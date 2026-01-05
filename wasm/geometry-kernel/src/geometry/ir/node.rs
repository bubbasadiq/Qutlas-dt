//! Atomic IR nodes with stable IDs for semantic geometry representation.
//!
//! This module defines the core building blocks of the semantic geometry IR.
//! Every geometric entity has canonical identity for caching, deduplication,
//! royalties, and routing.

use crate::errors::{KernelError, KernelResult};
use blake3::Hasher;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Globally unique stable identifier for IR nodes
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct NodeId(String);

impl NodeId {
    /// Create a new node ID with deterministic hashing
    pub fn new(node_type: &str, content_hash: &str, dependencies: &[&NodeId]) -> Self {
        let mut hasher = Hasher::new();
        hasher.update(node_type.as_bytes());
        hasher.update(content_hash.as_bytes());

        // Include dependency hashes for deterministic ordering
        let mut dep_hashes: Vec<String> = dependencies.iter().map(|id| id.0.clone()).collect();
        dep_hashes.sort(); // Ensure deterministic ordering

        for dep_hash in dep_hashes {
            hasher.update(dep_hash.as_bytes());
        }

        let hash = hasher.finalize();
        NodeId(format!("{}_{}", node_type, hash.to_hex()))
    }

    /// Create a node ID from user-provided string (for external references)
    pub fn from_user_string(user_id: &str) -> Self {
        let mut hasher = Hasher::new();
        hasher.update(b"user_id");
        hasher.update(user_id.as_bytes());
        let hash = hasher.finalize();
        NodeId(format!("user_{}", hash.to_hex()))
    }

    /// Get the string representation
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// Check if this is a generated node (vs user-defined)
    pub fn is_generated(&self) -> bool {
        !self.0.starts_with("user_")
    }
}

/// Content-addressed hash for canonical identity
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ContentHash(String);

impl ContentHash {
    /// Compute content hash from serializable data
    pub fn from_content<T: Serialize>(content: &T) -> KernelResult<Self> {
        let json = serde_json::to_string(content)
            .map_err(|e| KernelError::internal(format!("Failed to serialize content: {}", e)))?;

        // Normalize JSON for deterministic hashing
        let normalized = Self::normalize_json(&json)?;

        let mut hasher = Hasher::new();
        hasher.update(normalized.as_bytes());
        let hash = hasher.finalize();

        Ok(ContentHash(hash.to_hex().to_string()))
    }

    /// Get hex string representation
    pub fn as_hex(&self) -> &str {
        &self.0
    }

    /// Normalize JSON for deterministic hashing
    fn normalize_json(json: &str) -> KernelResult<String> {
        let value: serde_json::Value = serde_json::from_str(json)
            .map_err(|e| KernelError::internal(format!("Invalid JSON: {}", e)))?;

        // Re-serialize with consistent formatting
        serde_json::to_string(&value)
            .map_err(|e| KernelError::internal(format!("JSON normalization failed: {}", e)))
    }
}

/// Semantic IR node with stable identity and dependencies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IRNode {
    /// Globally unique stable identifier
    pub id: NodeId,

    /// Content-addressed hash for canonical identity
    pub content_hash: ContentHash,

    /// Node type for dispatch and validation
    pub node_type: NodeType,

    /// Node content (parameters, geometry data, etc.)
    pub content: NodeContent,

    /// Dependencies on other nodes (for evaluation order)
    pub dependencies: Vec<NodeId>,

    /// Metadata for tracing and debugging
    pub metadata: NodeMetadata,
}

impl IRNode {
    /// Create a new IR node with automatic ID and hash generation
    pub fn new(
        node_type: NodeType,
        content: NodeContent,
        dependencies: Vec<NodeId>,
        metadata: NodeMetadata,
    ) -> KernelResult<Self> {
        let content_hash = ContentHash::from_content(&content)?;
        let dep_refs: Vec<&NodeId> = dependencies.iter().collect();
        let id = NodeId::new(&node_type.to_string(), content_hash.as_hex(), &dep_refs);

        Ok(IRNode {
            id,
            content_hash,
            node_type,
            content,
            dependencies,
            metadata,
        })
    }

    /// Create a node with user-specified ID (for external references)
    pub fn with_user_id(
        user_id: &str,
        node_type: NodeType,
        content: NodeContent,
        dependencies: Vec<NodeId>,
        metadata: NodeMetadata,
    ) -> KernelResult<Self> {
        let content_hash = ContentHash::from_content(&content)?;
        let id = NodeId::from_user_string(user_id);

        Ok(IRNode {
            id,
            content_hash,
            node_type,
            content,
            dependencies,
            metadata,
        })
    }

    /// Verify content hash matches current content
    pub fn verify_integrity(&self) -> KernelResult<bool> {
        let computed_hash = ContentHash::from_content(&self.content)?;
        Ok(computed_hash == self.content_hash)
    }

    /// Get evaluation priority (lower = higher priority)
    pub fn evaluation_priority(&self) -> u32 {
        match self.node_type {
            NodeType::Primitive => 0,
            NodeType::Feature => 1,
            NodeType::BooleanOp => 2,
            NodeType::Constraint => 3,
            NodeType::Analysis => 4,
        }
    }
}

/// Node type classification for dispatch and validation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum NodeType {
    /// Geometric primitive (box, cylinder, etc.)
    Primitive,
    /// Parametric feature (hole, fillet, etc.)
    Feature,
    /// Boolean operation (union, subtract, intersect)
    BooleanOp,
    /// Geometric or manufacturing constraint
    Constraint,
    /// Analysis or derived property
    Analysis,
}

impl ToString for NodeType {
    fn to_string(&self) -> String {
        match self {
            NodeType::Primitive => "primitive".to_string(),
            NodeType::Feature => "feature".to_string(),
            NodeType::BooleanOp => "boolean_op".to_string(),
            NodeType::Constraint => "constraint".to_string(),
            NodeType::Analysis => "analysis".to_string(),
        }
    }
}

/// Node content variants for different node types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum NodeContent {
    /// Primitive geometry parameters
    Primitive {
        primitive_type: String,
        parameters: HashMap<String, f64>,
        transform: Option<Transform>,
    },

    /// Feature operation parameters
    Feature {
        feature_type: String,
        target_node: NodeId,
        parameters: HashMap<String, serde_json::Value>,
    },

    /// Boolean operation parameters
    BooleanOp {
        operation_type: String,
        operand_a: NodeId,
        operand_b: NodeId,
    },

    /// Constraint definition
    Constraint {
        constraint_type: String,
        affected_nodes: Vec<NodeId>,
        parameters: HashMap<String, serde_json::Value>,
    },

    /// Analysis result or configuration
    Analysis {
        analysis_type: String,
        target_node: NodeId,
        parameters: HashMap<String, serde_json::Value>,
    },
}

/// Transform representation for deterministic serialization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transform {
    /// Translation vector [x, y, z]
    pub translation: [f64; 3],
    /// Rotation as quaternion [w, x, y, z]
    pub rotation: [f64; 4],
    /// Scale factors [x, y, z]
    pub scale: [f64; 3],
}

impl Default for Transform {
    fn default() -> Self {
        Transform {
            translation: [0.0, 0.0, 0.0],
            rotation: [1.0, 0.0, 0.0, 0.0], // Identity quaternion
            scale: [1.0, 1.0, 1.0],
        }
    }
}

/// Metadata for tracing, debugging, and provenance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeMetadata {
    /// Creation timestamp (for ordering)
    pub created_at: f64,

    /// Optional user-provided name
    pub name: Option<String>,

    /// Source of this node (user, AI, import, etc.)
    pub source: NodeSource,

    /// Validation status
    pub validation_status: ValidationStatus,

    /// Additional tags for filtering and searching
    pub tags: Vec<String>,
}

impl NodeMetadata {
    /// Create new metadata with current timestamp
    pub fn new(name: Option<String>, source: NodeSource) -> Self {
        NodeMetadata {
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs_f64(),
            name,
            source,
            validation_status: ValidationStatus::Pending,
            tags: Vec::new(),
        }
    }
}

/// Source of node creation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeSource {
    /// Created by user interaction
    User,
    /// Generated by AI/automation
    Generated,
    /// Imported from external file
    Import { format: String, file: String },
    /// Derived from other nodes
    Derived { from_nodes: Vec<NodeId> },
}

/// Validation status for nodes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationStatus {
    /// Not yet validated
    Pending,
    /// Passed validation
    Valid,
    /// Failed validation with error
    Invalid { error: String },
    /// Warning issued but still valid
    Warning { message: String },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_id_deterministic() {
        let content_hash = "abc123";
        let deps = vec![];

        let id1 = NodeId::new("primitive", content_hash, &[]);
        let id2 = NodeId::new("primitive", content_hash, &[]);

        assert_eq!(id1, id2, "Node IDs should be deterministic");
    }

    #[test]
    fn test_content_hash_consistent() {
        let content = NodeContent::Primitive {
            primitive_type: "box".to_string(),
            parameters: {
                let mut params = HashMap::new();
                params.insert("width".to_string(), 10.0);
                params.insert("height".to_string(), 20.0);
                params
            },
            transform: None,
        };

        let hash1 = ContentHash::from_content(&content).unwrap();
        let hash2 = ContentHash::from_content(&content).unwrap();

        assert_eq!(hash1, hash2, "Content hashes should be consistent");
    }

    #[test]
    fn test_ir_node_creation() {
        let metadata = NodeMetadata::new(Some("test_box".to_string()), NodeSource::User);

        let content = NodeContent::Primitive {
            primitive_type: "box".to_string(),
            parameters: {
                let mut params = HashMap::new();
                params.insert("width".to_string(), 10.0);
                params
            },
            transform: None,
        };

        let node = IRNode::new(NodeType::Primitive, content, vec![], metadata).unwrap();

        assert!(
            node.verify_integrity().unwrap(),
            "Node should have valid integrity"
        );
        assert_eq!(
            node.evaluation_priority(),
            0,
            "Primitives should have highest priority"
        );
    }

    #[test]
    fn test_node_dependencies() {
        let metadata = NodeMetadata::new(None, NodeSource::Generated);

        // Create dependency node first
        let dep_content = NodeContent::Primitive {
            primitive_type: "box".to_string(),
            parameters: HashMap::new(),
            transform: None,
        };
        let dep_node =
            IRNode::new(NodeType::Primitive, dep_content, vec![], metadata.clone()).unwrap();

        // Create node with dependency
        let content = NodeContent::Feature {
            feature_type: "hole".to_string(),
            target_node: dep_node.id.clone(),
            parameters: HashMap::new(),
        };

        let node = IRNode::new(
            NodeType::Feature,
            content,
            vec![dep_node.id.clone()],
            metadata,
        )
        .unwrap();

        assert_eq!(node.dependencies.len(), 1, "Should have one dependency");
        assert_eq!(node.dependencies[0], dep_node.id, "Dependency should match");
    }
}
