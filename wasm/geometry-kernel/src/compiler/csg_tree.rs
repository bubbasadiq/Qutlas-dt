//! CSG tree representation and utilities.
//!
//! Defines the CSG tree structure for representing boolean
//! operations on geometric primitives.

use crate::types::BoundingBox;
use crate::types::{PrimitiveType, Transform};
use crate::errors::{KernelError, KernelResult};
use std::collections::HashMap;

/// CSG tree node representing primitives and boolean operations
#[derive(Debug, Clone)]
pub enum CsgNode {
    /// Primitive shape (box, cylinder, sphere, etc.)
    Primitive {
        id: String,
        type_: PrimitiveType,
        params: HashMap<String, f64>,
        transform: Option<Transform>,
    },
    /// Union operation (merge two shapes)
    Union {
        left: Box<CsgNode>,
        right: Box<CsgNode>,
    },
    /// Subtract operation (remove right from left)
    Subtract {
        target: Box<CsgNode>,
        tool: Box<CsgNode>,
    },
    /// Intersect operation (keep only overlapping volume)
    Intersect {
        left: Box<CsgNode>,
        right: Box<CsgNode>,
    },
}

impl CsgNode {
    /// Get the ID of this node (for primitives only)
    pub fn get_id(&self) -> Option<&str> {
        match self {
            CsgNode::Primitive { id, .. } => Some(id),
            _ => None,
        }
    }

    /// Check if this node is a primitive
    pub fn is_primitive(&self) -> bool {
        matches!(self, CsgNode::Primitive { .. })
    }

    /// Check if this node is an operation
    pub fn is_operation(&self) -> bool {
        !self.is_primitive()
    }

    /// Get primitive type (for primitives only)
    pub fn get_primitive_type(&self) -> Option<PrimitiveType> {
        match self {
            CsgNode::Primitive { type_, .. } => Some(type_.clone()),
            _ => None,
        }
    }

    /// Get operation type as string
    pub fn get_operation_type(&self) -> Option<&'static str> {
        match self {
            CsgNode::Union { .. } => Some("union"),
            CsgNode::Subtract { .. } => Some("subtract"),
            CsgNode::Intersect { .. } => Some("intersect"),
            CsgNode::Primitive { .. } => None,
        }
    }

    /// Count nodes in the tree
    pub fn node_count(&self) -> usize {
        match self {
            CsgNode::Primitive { .. } => 1,
            CsgNode::Union { left, right }
            | CsgNode::Subtract { target: left, tool: right }
            | CsgNode::Intersect { left, right } => {
                left.node_count() + right.node_count() + 1
            }
        }
    }

    /// Get maximum depth of the tree
    pub fn depth(&self) -> usize {
        match self {
            CsgNode::Primitive { .. } => 0,
            CsgNode::Union { left, right }
            | CsgNode::Subtract { target: left, tool: right }
            | CsgNode::Intersect { left, right } => {
                left.depth().max(right.depth()) + 1
            }
        }
    }

    /// Collect all primitive IDs in the tree
    pub fn collect_primitive_ids(&self) -> Vec<String> {
        let mut ids = Vec::new();
        self.collect_primitive_ids_recursive(&mut ids);
        ids
    }

    fn collect_primitive_ids_recursive(&self, ids: &mut Vec<String>) {
        match self {
            CsgNode::Primitive { id, .. } => ids.push(id.clone()),
            CsgNode::Union { left, right }
            | CsgNode::Subtract { target: left, tool: right }
            | CsgNode::Intersect { left, right } => {
                left.collect_primitive_ids_recursive(ids);
                right.collect_primitive_ids_recursive(ids);
            }
        }
    }

    /// Get bounding box for this node (cached if available)
    pub fn bounding_box(&self) -> Option<BoundingBox> {
        // This would be implemented with actual geometry evaluation
        // For now, return None
        None
    }

    /// Optimize tree by removing redundant operations
    pub fn optimize(&self) -> CsgNode {
        // Implement optimizations like:
        // - Remove identity operations
        // - Flatten nested unions
        // - Eliminate empty geometries
        self.clone() // Placeholder: return unoptimized tree
    }

    /// Validate tree structure
    pub fn validate(&self) -> KernelResult<()> {
        // Check for circular references
        self.check_circular_references(&mut std::collections::HashSet::new())?;

        // Validate primitive parameters
        self.validate_primitives()?;

        Ok(())
    }

    fn check_circular_references(
        &self,
        visited: &mut std::collections::HashSet<String>,
    ) -> KernelResult<()> {
        match self {
            CsgNode::Primitive { id, .. } => {
                if visited.contains(id) {
                    return Err(KernelError::circular_reference(id));
                }
                visited.insert(id.clone());
                Ok(())
            }
            CsgNode::Union { left, right }
            | CsgNode::Subtract { target: left, tool: right }
            | CsgNode::Intersect { left, right } => {
                left.check_circular_references(visited)?;
                right.check_circular_references(visited)?;
                Ok(())
            }
        }
    }

    fn validate_primitives(&self) -> KernelResult<()> {
        match self {
            CsgNode::Primitive { type_, params, .. } => {
                crate::geometry::validate_primitive_params(type_.clone(), params)
            }
            CsgNode::Union { left, right }
            | CsgNode::Subtract { target: left, tool: right }
            | CsgNode::Intersect { left, right } => {
                left.validate_primitives()?;
                right.validate_primitives()
            }
        }
    }
}

/// Create a primitive node
pub fn primitive_node(
    id: String,
    type_: PrimitiveType,
    params: HashMap<String, f64>,
    transform: Option<Transform>,
) -> CsgNode {
    CsgNode::Primitive {
        id,
        type_,
        params,
        transform,
    }
}

/// Create a union node
pub fn union_node(left: CsgNode, right: CsgNode) -> CsgNode {
    CsgNode::Union {
        left: Box::new(left),
        right: Box::new(right),
    }
}

/// Create a subtract node
pub fn subtract_node(target: CsgNode, tool: CsgNode) -> CsgNode {
    CsgNode::Subtract {
        target: Box::new(target),
        tool: Box::new(tool),
    }
}

/// Create an intersect node
pub fn intersect_node(left: CsgNode, right: CsgNode) -> CsgNode {
    CsgNode::Intersect {
        left: Box::new(left),
        right: Box::new(right),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_primitive_node() {
        let node = primitive_node(
            "box1".to_string(),
            PrimitiveType::Box,
            vec![("width".to_string(), 10.0)].into_iter().collect(),
            None,
        );

        assert!(node.is_primitive());
        assert_eq!(node.get_id(), Some("box1"));
        assert_eq!(node.get_primitive_type(), Some(PrimitiveType::Box));
        assert_eq!(node.node_count(), 1);
        assert_eq!(node.depth(), 0);
    }

    #[test]
    fn test_union_node() {
        let left = primitive_node("box1".to_string(), PrimitiveType::Box, HashMap::new(), None);
        let right = primitive_node("box2".to_string(), PrimitiveType::Box, HashMap::new(), None);
        let node = union_node(left, right);

        assert!(node.is_operation());
        assert_eq!(node.get_operation_type(), Some("union"));
        assert_eq!(node.node_count(), 3);
        assert_eq!(node.depth(), 1);
    }

    #[test]
    fn test_collect_primitive_ids() {
        let box1 = primitive_node("box1".to_string(), PrimitiveType::Box, HashMap::new(), None);
        let box2 = primitive_node("box2".to_string(), PrimitiveType::Box, HashMap::new(), None);
        let node = union_node(box1, box2);

        let ids = node.collect_primitive_ids();
        assert_eq!(ids.len(), 2);
        assert!(ids.contains(&"box1".to_string()));
        assert!(ids.contains(&"box2".to_string()));
    }

    #[test]
    fn test_validate_valid_tree() {
        let box1 = primitive_node(
            "box1".to_string(),
            PrimitiveType::Box,
            vec![
                ("width".to_string(), 10.0),
                ("height".to_string(), 10.0),
                ("depth".to_string(), 10.0),
            ]
            .into_iter()
            .collect(),
            None,
        );
        let box2 = primitive_node(
            "box2".to_string(),
            PrimitiveType::Box,
            vec![
                ("width".to_string(), 5.0),
                ("height".to_string(), 5.0),
                ("depth".to_string(), 5.0),
            ]
            .into_iter()
            .collect(),
            None,
        );
        let node = union_node(box1, box2);

        assert!(node.validate().is_ok());
    }

    #[test]
    fn test_validate_missing_parameter() {
        let box1 = primitive_node(
            "box1".to_string(),
            PrimitiveType::Box,
            vec![("width".to_string(), 10.0)].into_iter().collect(),
            None,
        );

        assert!(box1.validate().is_err());
    }
}
