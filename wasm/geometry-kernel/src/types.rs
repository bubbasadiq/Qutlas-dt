//! Core data structures for the geometry kernel.
//!
//! These types represent the input intent, intermediate representations,
//! and output formats (mesh, STEP, etc.).

use crate::errors::{KernelError, KernelResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Input Geometry IR from TypeScript - matches the Intent AST
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeometryIR {
    pub part: String,
    pub operations: Vec<Intent>,
    pub constraints: Vec<ManufacturingConstraint>,
}

/// Intent operation (primitive or boolean operation)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Intent {
    Primitive(PrimitiveIntent),
    Operation(OperationIntent),
}

/// Primitive creation intent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrimitiveIntent {
    pub id: String,
    #[serde(rename = "type")]
    pub type_: PrimitiveType,
    pub parameters: HashMap<String, f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transform: Option<Transform>,
    pub timestamp: f64,
}

/// Boolean/modify operation intent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationIntent {
    pub id: String,
    #[serde(rename = "type")]
    pub type_: OperationType,
    pub target: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operand: Option<String>,
    pub parameters: HashMap<String, serde_json::Value>,
    pub timestamp: f64,
}

/// Primitive types supported by the kernel
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum PrimitiveType {
    Box,
    Cylinder,
    Sphere,
    Cone,
    Torus,
}

/// Operation types supported by the kernel
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum OperationType {
    Union,
    Subtract,
    Intersect,
    Fillet,
    Hole,
    Chamfer,
}

/// Transform specification for positioning primitives
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transform {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub position: Option<[f64; 3]>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotation: Option<[f64; 3]>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<[f64; 3]>,
}

impl Transform {
    pub fn identity() -> Self {
        Transform {
            position: Some([0.0, 0.0, 0.0]),
            rotation: Some([0.0, 0.0, 0.0]),
            scale: Some([1.0, 1.0, 1.0]),
        }
    }

    pub fn get_position(&self) -> [f64; 3] {
        self.position.unwrap_or([0.0, 0.0, 0.0])
    }

    pub fn get_rotation(&self) -> [f64; 3] {
        self.rotation.unwrap_or([0.0, 0.0, 0.0])
    }

    pub fn get_scale(&self) -> [f64; 3] {
        self.scale.unwrap_or([1.0, 1.0, 1.0])
    }
}

/// Manufacturing constraint specification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManufacturingConstraint {
    #[serde(rename = "type")]
    pub type_: ConstraintType,
    pub value: serde_json::Value,
}

/// Constraint types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum ConstraintType {
    MinWallThickness,
    ToolDiameter,
    MaxOverhang,
    Process,
    Material,
}

/// CSG tree node representation
#[derive(Debug, Clone)]
pub enum CsgNode {
    Primitive {
        id: String,
        type_: PrimitiveType,
        params: HashMap<String, f64>,
        transform: Option<Transform>,
    },
    Union {
        left: Box<CsgNode>,
        right: Box<CsgNode>,
    },
    Subtract {
        target: Box<CsgNode>,
        tool: Box<CsgNode>,
    },
    Intersect {
        left: Box<CsgNode>,
        right: Box<CsgNode>,
    },
}

impl CsgNode {
    pub fn get_id(&self) -> Option<&str> {
        match self {
            CsgNode::Primitive { id, .. } => Some(id),
            _ => None,
        }
    }

    pub fn is_primitive(&self) -> bool {
        matches!(self, CsgNode::Primitive { .. })
    }

    pub fn is_operation(&self) -> bool {
        !self.is_primitive()
    }

    pub fn get_primitive_type(&self) -> Option<PrimitiveType> {
        match self {
            CsgNode::Primitive { type_, .. } => Some(type_.clone()),
            _ => None,
        }
    }
}

/// Axis-aligned bounding box for optimization
#[derive(Debug, Clone, Copy, Default, serde::Serialize, serde::Deserialize)]
pub struct BoundingBox {
    pub min: [f64; 3],
    pub max: [f64; 3],
}

impl BoundingBox {
    pub fn new(min: [f64; 3], max: [f64; 3]) -> Self {
        BoundingBox { min, max }
    }

    pub fn empty() -> Self {
        BoundingBox {
            min: [f64::MAX, f64::MAX, f64::MAX],
            max: [f64::MIN, f64::MIN, f64::MIN],
        }
    }

    pub fn is_empty(&self) -> bool {
        self.min[0] > self.max[0]
    }

    pub fn size(&self) -> [f64; 3] {
        [
            self.max[0] - self.min[0],
            self.max[1] - self.min[1],
            self.max[2] - self.min[2],
        ]
    }

    pub fn center(&self) -> [f64; 3] {
        [
            (self.min[0] + self.max[0]) / 2.0,
            (self.min[1] + self.max[1]) / 2.0,
            (self.min[2] + self.max[2]) / 2.0,
        ]
    }

    pub fn contains(&self, point: [f64; 3]) -> bool {
        point[0] >= self.min[0]
            && point[0] <= self.max[0]
            && point[1] >= self.min[1]
            && point[1] <= self.max[1]
            && point[2] >= self.min[2]
            && point[2] <= self.max[2]
    }

    pub fn intersects(&self, other: &BoundingBox) -> bool {
        self.min[0] <= other.max[0]
            && self.max[0] >= other.min[0]
            && self.min[1] <= other.max[1]
            && self.max[1] >= other.min[1]
            && self.min[2] <= other.max[2]
            && self.max[2] >= other.min[2]
    }

    pub fn merge(&self, other: &BoundingBox) -> BoundingBox {
        BoundingBox {
            min: [
                self.min[0].min(other.min[0]),
                self.min[1].min(other.min[1]),
                self.min[2].min(other.min[2]),
            ],
            max: [
                self.max[0].max(other.max[0]),
                self.max[1].max(other.max[1]),
                self.max[2].max(other.max[2]),
            ],
        }
    }
}

/// Triangle mesh for preview rendering
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewMesh {
    /// Vertex positions as flat array [x, y, z, x, y, z, ...]
    pub vertices: Vec<f32>,
    /// Triangle indices
    pub indices: Vec<u32>,
    /// Per-vertex normals [nx, ny, nz, nx, ny, nz, ...]
    pub normals: Vec<f32>,
}

impl PreviewMesh {
    pub fn new() -> Self {
        PreviewMesh {
            vertices: Vec::new(),
            indices: Vec::new(),
            normals: Vec::new(),
        }
    }

    pub fn vertex_count(&self) -> usize {
        self.vertices.len() / 3
    }

    pub fn triangle_count(&self) -> usize {
        self.indices.len() / 3
    }

    pub fn is_valid(&self) -> KernelResult<()> {
        if self.vertices.len() % 3 != 0 {
            return Err(KernelError::topology_error(
                "Vertex count must be multiple of 3",
            ));
        }

        if self.indices.len() % 3 != 0 {
            return Err(KernelError::topology_error(
                "Index count must be multiple of 3",
            ));
        }

        if self.normals.len() != self.vertices.len() {
            return Err(KernelError::topology_error(
                "Normal count must match vertex count",
            ));
        }

        Ok(())
    }
}

/// Canonical solid B-rep representation
/// This represents the exact geometry with topology information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanonicalSolid {
    pub vertices: Vec<[f64; 3]>,
    pub edges: Vec<(usize, usize)>,
    pub faces: Vec<Face>,
    pub hash: String,
}

/// Face definition in B-rep
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Face {
    pub vertices: Vec<usize>,
    pub normal: [f64; 3],
    pub surface_type: SurfaceType,
}

/// Surface types for faces
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum SurfaceType {
    Planar,
    Cylindrical,
    Spherical,
    Conical,
    Toroidal,
    NURBS,
}

/// STEP export data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepExport {
    /// UTF-8 encoded STEP file content (ISO 10303-21 format)
    pub content: String,
    /// Export metadata
    pub entity_count: usize,
}

/// Compilation result containing all outputs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompileResult {
    pub status: CompileStatus,
    pub intent_hash: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mesh: Option<PreviewMesh>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub step: Option<StepExport>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub topology: Option<CanonicalSolid>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mfg_report: Option<ManufacturabilityReport>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<KernelError>,
}

/// Compilation status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CompileStatus {
    Compiled,
    Cached,
    Fallback,
    Error,
}

/// Manufacturability validation report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManufacturabilityReport {
    pub valid: bool,
    pub violations: Vec<ConstraintViolation>,
    pub warnings: Vec<ConstraintViolation>,
}

/// Single constraint violation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConstraintViolation {
    #[serde(rename = "type")]
    pub type_: ConstraintType,
    pub severity: ViolationSeverity,
    pub message: String,
    pub value: f64,
    pub limit: f64,
}

/// Severity level of violation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ViolationSeverity {
    Error,
    Warning,
    Info,
}

/// Mesh statistics for debugging
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeshStatistics {
    pub vertex_count: usize,
    pub triangle_count: usize,
    pub edge_count: usize,
    pub bounds: BoundingBox,
    pub volume: f64,
    pub surface_area: f64,
}
