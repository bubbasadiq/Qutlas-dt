//! Evaluate CSG trees to produce meshes.
//!
//! Performs bottom-up evaluation of CSG operations with
//! memoization and optimization.

use crate::compiler::csg_tree::CsgNode;
use crate::geometry::{PreviewMesh, Primitive, create_primitive};
use crate::errors::{KernelError, KernelResult};
use std::collections::HashMap;

/// CSG tree evaluator
///
/// Evaluates CSG trees to produce preview meshes with memoization
/// for performance.
pub struct CsgEvaluator {
    /// Cache of evaluated results
    cache: HashMap<String, PreviewMesh>,
    /// Subdivision level for mesh generation
    subdivisions: u32,
}

impl CsgEvaluator {
    pub fn new() -> Self {
        CsgEvaluator {
            cache: HashMap::new(),
            subdivisions: 16, // Default subdivisions
        }
    }

    pub fn with_subdivisions(subdivisions: u32) -> Self {
        CsgEvaluator {
            cache: HashMap::new(),
            subdivisions: subdivisions.max(4).min(64),
        }
    }

    /// Evaluate a CSG node to produce a mesh
    pub fn evaluate(&mut self, node: &CsgNode) -> KernelResult<PreviewMesh> {
        // Check cache
        if let Some(id) = node.get_id() {
            if let Some(mesh) = self.cache.get(id) {
                return Ok(mesh.clone());
            }
        }

        let result = match node {
            CsgNode::Primitive {
                id,
                type_,
                params,
                transform,
            } => {
                let primitive = create_primitive(type_.clone(), params)?;
                let mut mesh = primitive.to_mesh(self.subdivisions);

                // Cache primitive result
                self.cache.insert(id.clone(), mesh.clone());

                Ok(mesh)
            }
            CsgNode::Union { left, right } => {
                let left_mesh = self.evaluate(left)?;
                let right_mesh = self.evaluate(right)?;

                crate::geometry::operations::boolean_operation(
                    &left_mesh,
                    &right_mesh,
                    crate::geometry::operations::BooleanOperation::Union,
                )
            }
            CsgNode::Subtract { target, tool } => {
                let target_mesh = self.evaluate(target)?;
                let tool_mesh = self.evaluate(tool)?;

                crate::geometry::operations::boolean_operation(
                    &target_mesh,
                    &tool_mesh,
                    crate::geometry::operations::BooleanOperation::Subtract,
                )
            }
            CsgNode::Intersect { left, right } => {
                let left_mesh = self.evaluate(left)?;
                let right_mesh = self.evaluate(right)?;

                crate::geometry::operations::boolean_operation(
                    &left_mesh,
                    &right_mesh,
                    crate::geometry::operations::BooleanOperation::Intersect,
                )
            }
        };

        result
    }

    /// Set subdivision level for mesh generation
    pub fn set_subdivisions(&mut self, subdivisions: u32) {
        self.subdivisions = subdivisions.max(4).min(64);
        self.cache.clear(); // Clear cache when subdivisions change
    }

    /// Clear evaluation cache
    pub fn clear_cache(&mut self) {
        self.cache.clear();
    }

    /// Get cache statistics
    pub fn cache_stats(&self) -> CacheStats {
        CacheStats {
            size: self.cache.len(),
            hits: 0, // Would need counter for accurate stats
        }
    }
}

impl Default for CsgEvaluator {
    fn default() -> Self {
        Self::new()
    }
}

/// Cache statistics
#[derive(Debug, Clone)]
pub struct CacheStats {
    pub size: usize,
    pub hits: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::compiler::csg_tree::{primitive_node, union_node};
    use crate::types::PrimitiveType;

    #[test]
    fn test_evaluate_primitive() {
        let mut evaluator = CsgEvaluator::new();

        let node = primitive_node(
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

        let mesh = evaluator.evaluate(&node).unwrap();

        assert!(!mesh.vertices.is_empty());
        assert!(!mesh.indices.is_empty());
        assert!(!mesh.normals.is_empty());
    }

    #[test]
    fn test_evaluate_union() {
        let mut evaluator = CsgEvaluator::new();

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

        let mesh = evaluator.evaluate(&node).unwrap();

        assert!(!mesh.vertices.is_empty());
        assert!(!mesh.indices.is_empty());
    }

    #[test]
    fn test_caching() {
        let mut evaluator = CsgEvaluator::new();

        let node = primitive_node(
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

        let mesh1 = evaluator.evaluate(&node).unwrap();
        let mesh2 = evaluator.evaluate(&node).unwrap();

        // Should get cached result (same mesh)
        assert_eq!(mesh1.vertices.len(), mesh2.vertices.len());
        assert_eq!(mesh1.indices.len(), mesh2.indices.len());
    }
}
