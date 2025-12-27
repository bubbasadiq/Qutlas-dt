//! Parse Intent IR to CSG tree.
//!
//! Converts the serialized intent from TypeScript into a CSG tree
//! structure that can be evaluated to produce geometry.

use crate::compiler::csg_tree::{CsgNode, primitive_node, union_node, subtract_node, intersect_node};
use crate::errors::{KernelError, KernelResult};
use crate::types::{GeometryIR, Intent, PrimitiveIntent, OperationIntent, PrimitiveType, OperationType, Transform};

/// Parser for converting Intent IR to CSG tree
pub struct IntentParser {
    /// Map of ID to CSG node for reference resolution
    node_map: std::collections::HashMap<String, CsgNode>,
}

impl IntentParser {
    pub fn new() -> Self {
        IntentParser {
            node_map: std::collections::HashMap::new(),
        }
    }

    /// Parse GeometryIR to CSG tree
    pub fn parse(&mut self, ir: &GeometryIR) -> KernelResult<CsgNode> {
        self.node_map.clear();

        if ir.operations.is_empty() {
            return Err(KernelError::invalid_intent("No operations in intent"));
        }

        // First pass: create all primitive nodes
        for operation in &ir.operations {
            if let Intent::Primitive(primitive) = operation {
                self.parse_primitive(primitive)?;
            }
        }

        // Second pass: create operation nodes
        for operation in &ir.operations {
            if let Intent::Operation(op) = operation {
                self.parse_operation(op)?;
            }
        }

        // Find the final result (last operation or primitive)
        let last_op = ir.operations.last().ok_or_else(|| {
            KernelError::invalid_intent("No operations in intent")
        })?;

        match last_op {
            Intent::Primitive(primitive) => {
                self.node_map
                    .get(&primitive.id)
                    .cloned()
                    .ok_or_else(|| KernelError::internal(format!("Failed to find primitive {}", primitive.id)))
            }
            Intent::Operation(op) => {
                self.node_map
                    .get(&op.id)
                    .cloned()
                    .ok_or_else(|| KernelError::internal(format!("Failed to find operation {}", op.id)))
            }
        }
    }

    /// Parse a primitive intent
    fn parse_primitive(&mut self, primitive: &PrimitiveIntent) -> KernelResult<()> {
        // Convert transform
        let transform = primitive.transform.as_ref().map(|t| {
            Transform {
                position: t.position,
                rotation: t.rotation,
                scale: t.scale,
            }
        });

        // Create CSG primitive node
        let node = primitive_node(
            primitive.id.clone(),
            primitive.type_.clone(),
            primitive.parameters.clone(),
            transform,
        );

        self.node_map.insert(primitive.id.clone(), node);

        Ok(())
    }

    /// Parse an operation intent
    fn parse_operation(&mut self, operation: &OperationIntent) -> KernelResult<()> {
        // Get target node
        let target = self.node_map.get(&operation.target).ok_or_else(|| {
            KernelError::invalid_intent(format!(
                "Target '{}' not found in operation '{}'",
                operation.target, operation.id
            ))
        })?;

        match operation.type_ {
            OperationType::Union => {
                // Union requires an operand
                let operand_id = operation.operand.as_ref().ok_or_else(|| {
                    KernelError::invalid_intent(format!(
                        "Union operation '{}' missing operand",
                        operation.id
                    ))
                })?;

                let operand = self.node_map.get(operand_id).ok_or_else(|| {
                    KernelError::invalid_intent(format!(
                        "Operand '{}' not found in union operation '{}'",
                        operand_id, operation.id
                    ))
                })?;

                let node = union_node(target.clone(), operand.clone());
                self.node_map.insert(operation.id.clone(), node);
            }
            OperationType::Subtract => {
                // Subtract requires an operand (tool)
                let operand_id = operation.operand.as_ref().ok_or_else(|| {
                    KernelError::invalid_intent(format!(
                        "Subtract operation '{}' missing operand",
                        operation.id
                    ))
                })?;

                let tool = self.node_map.get(operand_id).ok_or_else(|| {
                    KernelError::invalid_intent(format!(
                        "Tool '{}' not found in subtract operation '{}'",
                        operand_id, operation.id
                    ))
                })?;

                let node = subtract_node(target.clone(), tool.clone());
                self.node_map.insert(operation.id.clone(), node);
            }
            OperationType::Intersect => {
                // Intersect requires an operand
                let operand_id = operation.operand.as_ref().ok_or_else(|| {
                    KernelError::invalid_intent(format!(
                        "Intersect operation '{}' missing operand",
                        operation.id
                    ))
                })?;

                let operand = self.node_map.get(operand_id).ok_or_else(|| {
                    KernelError::invalid_intent(format!(
                        "Operand '{}' not found in intersect operation '{}'",
                        operand_id, operation.id
                    ))
                })?;

                let node = intersect_node(target.clone(), operand.clone());
                self.node_map.insert(operation.id.clone(), node);
            }
            OperationType::Fillet | OperationType::Hole | OperationType::Chamfer => {
                // These operations modify a single target
                // For now, just pass through the target (placeholder)
                // In a full implementation, these would create modified geometries
                let node = target.clone();
                self.node_map.insert(operation.id.clone(), node);
            }
        }

        Ok(())
    }
}

impl Default for IntentParser {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_parse_single_primitive() {
        let mut parser = IntentParser::new();

        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![Intent::Primitive(PrimitiveIntent {
                id: "box1".to_string(),
                type_: PrimitiveType::Box,
                parameters: vec![
                    ("width".to_string(), 10.0),
                    ("height".to_string(), 10.0),
                    ("depth".to_string(), 10.0),
                ]
                .into_iter()
                .collect(),
                transform: None,
                timestamp: 0.0,
            })],
            constraints: vec![],
        };

        let tree = parser.parse(&ir).unwrap();

        assert!(tree.is_primitive());
        assert_eq!(tree.get_id(), Some("box1"));
    }

    #[test]
    fn test_parse_union_operation() {
        let mut parser = IntentParser::new();

        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![
                Intent::Primitive(PrimitiveIntent {
                    id: "box1".to_string(),
                    type_: PrimitiveType::Box,
                    parameters: vec![
                        ("width".to_string(), 10.0),
                        ("height".to_string(), 10.0),
                        ("depth".to_string(), 10.0),
                    ]
                    .into_iter()
                    .collect(),
                    transform: None,
                    timestamp: 0.0,
                }),
                Intent::Primitive(PrimitiveIntent {
                    id: "box2".to_string(),
                    type_: PrimitiveType::Box,
                    parameters: vec![
                        ("width".to_string(), 5.0),
                        ("height".to_string(), 5.0),
                        ("depth".to_string(), 5.0),
                    ]
                    .into_iter()
                    .collect(),
                    transform: None,
                    timestamp: 0.0,
                }),
                Intent::Operation(OperationIntent {
                    id: "union1".to_string(),
                    type_: OperationType::Union,
                    target: "box1".to_string(),
                    operand: Some("box2".to_string()),
                    parameters: HashMap::new(),
                    timestamp: 0.0,
                }),
            ],
            constraints: vec![],
        };

        let tree = parser.parse(&ir).unwrap();

        assert!(tree.is_operation());
        assert_eq!(tree.get_operation_type(), Some("union"));
    }

    #[test]
    fn test_parse_missing_operand() {
        let mut parser = IntentParser::new();

        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![
                Intent::Primitive(PrimitiveIntent {
                    id: "box1".to_string(),
                    type_: PrimitiveType::Box,
                    parameters: vec![
                        ("width".to_string(), 10.0),
                        ("height".to_string(), 10.0),
                        ("depth".to_string(), 10.0),
                    ]
                    .into_iter()
                    .collect(),
                    transform: None,
                    timestamp: 0.0,
                }),
                Intent::Operation(OperationIntent {
                    id: "union1".to_string(),
                    type_: OperationType::Union,
                    target: "box1".to_string(),
                    operand: None,
                    parameters: HashMap::new(),
                    timestamp: 0.0,
                }),
            ],
            constraints: vec![],
        };

        let result = parser.parse(&ir);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_empty_operations() {
        let mut parser = IntentParser::new();

        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![],
            constraints: vec![],
        };

        let result = parser.parse(&ir);
        assert!(result.is_err());
    }
}
