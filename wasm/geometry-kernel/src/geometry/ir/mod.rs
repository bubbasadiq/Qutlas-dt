//! Intermediate Representation (IR) module for semantic, deterministic geometry.
//!
//! This module provides the core IR system for the geometry kernel, enabling:
//! - Deterministic geometry operations through stable node IDs
//! - Content-addressed caching and deduplication
//! - Dependency graph management for evaluation ordering
//! - Parametric features with manufacturing awareness
//! - Comprehensive validation for structural and semantic correctness
//!
//! # Architecture
//!
//! The IR system is built around several key concepts:
//!
//! ## Nodes (`node`)
//! Atomic IR nodes with stable identities and content hashing. Every geometric
//! entity has canonical identity for caching, deduplication, and routing.
//!
//! ## Graph (`graph`)
//! Dependency graph management with topological ordering ensures deterministic
//! evaluation and prevents circular dependencies.
//!
//! ## Features (`feature`)
//! Parametric features like extrusions, holes, and fillets that are manufacturing-aware
//! and replayable from parameters.
//!
//! ## Validation (`validate`)
//! Comprehensive structural and semantic validation ensures IR correctness
//! and manufacturability constraints.
//!
//! # Usage Example
//!
//! ```rust
//! use crate::geometry::ir::{IRGraph, IRNode, NodeType, NodeContent};
//!
//! // Create a new IR graph
//! let mut graph = IRGraph::new();
//!
//! // Create a primitive node
//! let node = IRNode::new(
//!     NodeType::Primitive,
//!     NodeContent::Primitive {
//!         primitive_type: "box".to_string(),
//!         parameters: HashMap::new(),
//!         transform: None,
//!     },
//!     vec![], // No dependencies
//!     metadata,
//! )?;
//!
//! // Add to graph
//! graph.add_node(node)?;
//!
//! // Validate the graph
//! let mut validator = IRValidator::new();
//! let result = validator.validate_graph(&graph)?;
//! ```

pub mod feature;
pub mod graph;
pub mod node;
pub mod validate;

// Re-export core types for public API
pub use node::{
    ContentHash, IRNode, NodeContent, NodeId, NodeMetadata, NodeSource, NodeType, Transform,
    ValidationStatus,
};

pub use graph::{GraphStats, IRGraph};

pub use feature::{
    BlendType, ConstraintType, EdgeSelection, Feature, FeatureParameters, FeatureType, HoleType,
    ManufacturingConstraint, ManufacturingProcess, PatternType, ToleranceGrade,
    ToolAccessRequirement,
};

pub use validate::{
    ConstraintViolation, IRValidator, ManufacturingAnalysis, ValidationConfig, ValidationError,
    ValidationErrorType, ValidationMetrics, ValidationResult, ValidationWarning,
    ValidationWarningType, ViolationSeverity, WarningSeverity,
};

// Convenience type aliases
pub type NodeMap = std::collections::HashMap<NodeId, IRNode>;
pub type DependencyMap = std::collections::HashMap<NodeId, std::collections::HashSet<NodeId>>;

/// Create a new empty IR graph
pub fn new_graph() -> IRGraph {
    IRGraph::new()
}

/// Create a new IR validator with default configuration
pub fn new_validator() -> IRValidator {
    IRValidator::new()
}

/// Create a new IR validator with custom configuration
pub fn new_validator_with_config(config: ValidationConfig) -> IRValidator {
    IRValidator::with_config(config)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_ir_module_integration() {
        // Test that all main components work together
        let mut graph = new_graph();
        let mut validator = new_validator();

        // Create a simple primitive node
        let metadata = NodeMetadata::new(Some("integration_test".to_string()), NodeSource::User);
        let content = NodeContent::Primitive {
            primitive_type: "box".to_string(),
            parameters: {
                let mut params = HashMap::new();
                params.insert("width".to_string(), 10.0);
                params.insert("height".to_string(), 20.0);
                params.insert("depth".to_string(), 5.0);
                params
            },
            transform: None,
        };

        let node = IRNode::new(NodeType::Primitive, content, vec![], metadata).unwrap();
        let node_id = node.id.clone();

        // Add to graph
        graph.add_node(node).unwrap();

        // Validate
        let result = validator.validate_graph(&graph).unwrap();
        assert!(result.is_valid, "Graph should be valid");

        // Check that we can retrieve the node
        let retrieved_node = graph.get_node(&node_id);
        assert!(retrieved_node.is_some(), "Node should be retrievable");
        assert_eq!(retrieved_node.unwrap().node_type, NodeType::Primitive);
    }

    #[test]
    fn test_feature_integration() {
        // Test feature creation and validation
        let target_id = NodeId::from_user_string("test_target");
        let params = FeatureParameters::Hole {
            diameter: 5.0,
            depth: 10.0,
            position: [0.0, 0.0, 0.0],
            direction: [0.0, 0.0, 1.0],
            hole_type: HoleType::Through,
        };

        let feature = Feature::new(
            "test_hole".to_string(),
            FeatureType::Hole,
            target_id,
            params,
        );

        let validator = new_validator();
        let result = validator.validate_feature(&feature).unwrap();

        assert!(result.is_valid, "Feature should be valid");
    }

    #[test]
    fn test_node_content_hash_deterministic() {
        // Test that content hashes are deterministic
        let content1 = NodeContent::Primitive {
            primitive_type: "sphere".to_string(),
            parameters: {
                let mut params = HashMap::new();
                params.insert("radius".to_string(), 5.0);
                params
            },
            transform: None,
        };

        let content2 = NodeContent::Primitive {
            primitive_type: "sphere".to_string(),
            parameters: {
                let mut params = HashMap::new();
                params.insert("radius".to_string(), 5.0);
                params
            },
            transform: None,
        };

        let hash1 = ContentHash::from_content(&content1).unwrap();
        let hash2 = ContentHash::from_content(&content2).unwrap();

        assert_eq!(hash1, hash2, "Content hashes should be deterministic");
    }
}
