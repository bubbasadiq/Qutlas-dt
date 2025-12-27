//! Geometry primitives and operations.
//!
//! This module provides deterministic generation of primitive solids
//! and boolean operations for CSG compilation.

pub mod primitives;
pub mod operations;
pub mod bounding_box;
pub mod constraints;

pub use primitives::*;
pub use operations::*;
pub use bounding_box::*;
pub use constraints::*;

use crate::types::{BoundingBox, PreviewMesh, PrimitiveType};
use crate::errors::KernelResult;

/// Base trait for geometric primitives
pub trait Primitive {
    /// Generate mesh for this primitive
    fn to_mesh(&self, subdivisions: u32) -> PreviewMesh;

    /// Get bounding box
    fn bounding_box(&self) -> BoundingBox;

    /// Apply transform
    fn apply_transform(&mut self, transform: &Transform);
}

/// Numerical constants for geometry operations
pub mod constants {
    pub const EPSILON: f64 = 1e-9;
    pub const DEFAULT_SUBDIVISIONS: u32 = 32;
    pub const DEFAULT_CIRCLE_SEGMENTS: u32 = 24;
}

/// Utility functions for geometry operations
pub fn apply_transform_to_point(point: [f64; 3], transform: &crate::types::Transform) -> [f64; 3] {
    let position = transform.get_position();
    let rotation = transform.get_rotation();
    let scale = transform.get_scale();

    // Apply scale
    let mut p = [point[0] * scale[0], point[1] * scale[1], point[2] * scale[2]];

    // Apply rotation (Euler angles in radians)
    let (sx, cx) = rotation[0].sin_cos();
    let (sy, cy) = rotation[1].sin_cos();
    let (sz, cz) = rotation[2].sin_cos();

    // Rotate around X
    let y = p[1] * cx - p[2] * sx;
    let z = p[1] * sx + p[2] * cx;
    p[1] = y;
    p[2] = z;

    // Rotate around Y
    let x = p[0] * cy + p[2] * sy;
    let z = -p[0] * sy + p[2] * cy;
    p[0] = x;
    p[2] = z;

    // Rotate around Z
    let x = p[0] * cz - p[1] * sz;
    let y = p[0] * sz + p[1] * cz;
    p[0] = x;
    p[1] = y;

    // Apply translation
    [
        p[0] + position[0],
        p[1] + position[1],
        p[2] + position[2],
    ]
}

pub fn apply_transform_to_normal(normal: [f64; 3], transform: &crate::types::Transform) -> [f64; 3] {
    // Normals only affected by rotation and scale
    let rotation = transform.get_rotation();
    let scale = transform.get_scale();

    let mut n = [
        normal[0] / scale[0],
        normal[1] / scale[1],
        normal[2] / scale[2],
    ];

    // Apply rotation
    let (sx, cx) = rotation[0].sin_cos();
    let (sy, cy) = rotation[1].sin_cos();
    let (sz, cz) = rotation[2].sin_cos();

    let y = n[1] * cx - n[2] * sx;
    let z = n[1] * sx + n[2] * cx;
    n[1] = y;
    n[2] = z;

    let x = n[0] * cy + n[2] * sy;
    let z = -n[0] * sy + n[2] * cy;
    n[0] = x;
    n[2] = z;

    let x = n[0] * cz - n[1] * sz;
    let y = n[0] * sz + n[1] * cz;
    n[0] = x;
    n[1] = y;

    // Normalize
    let len = (n[0] * n[0] + n[1] * n[1] + n[2] * n[2]).sqrt();
    if len > constants::EPSILON {
        [n[0] / len, n[1] / len, n[2] / len]
    } else {
        [0.0, 0.0, 1.0]
    }
}

/// Compute face normal from three vertices
pub fn compute_face_normal(v0: [f64; 3], v1: [f64; 3], v2: [f64; 3]) -> [f64; 3] {
    let e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
    let e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

    let nx = e1[1] * e2[2] - e1[2] * e2[1];
    let ny = e1[2] * e2[0] - e1[0] * e2[2];
    let nz = e1[0] * e2[1] - e1[1] * e2[0];

    let len = (nx * nx + ny * ny + nz * nz).sqrt();
    if len > constants::EPSILON {
        [nx / len, ny / len, nz / len]
    } else {
        [0.0, 0.0, 1.0]
    }
}

/// Validate primitive parameters
pub fn validate_primitive_params(
    type_: PrimitiveType,
    params: &std::collections::HashMap<String, f64>,
) -> KernelResult<()> {
    match type_ {
        PrimitiveType::Box => {
            if !params.contains_key("width") {
                return Err(crate::errors::KernelError::missing_parameter("width"));
            }
            if !params.contains_key("height") {
                return Err(crate::errors::KernelError::missing_parameter("height"));
            }
            if !params.contains_key("depth") {
                return Err(crate::errors::KernelError::missing_parameter("depth"));
            }
        }
        PrimitiveType::Cylinder => {
            if !params.contains_key("radius") {
                return Err(crate::errors::KernelError::missing_parameter("radius"));
            }
            if !params.contains_key("height") {
                return Err(crate::errors::KernelError::missing_parameter("height"));
            }
        }
        PrimitiveType::Sphere => {
            if !params.contains_key("radius") {
                return Err(crate::errors::KernelError::missing_parameter("radius"));
            }
        }
        PrimitiveType::Cone => {
            if !params.contains_key("radius") {
                return Err(crate::errors::KernelError::missing_parameter("radius"));
            }
            if !params.contains_key("height") {
                return Err(crate::errors::KernelError::missing_parameter("height"));
            }
        }
        PrimitiveType::Torus => {
            if !params.contains_key("major_radius") {
                return Err(crate::errors::KernelError::missing_parameter("major_radius"));
            }
            if !params.contains_key("minor_radius") {
                return Err(crate::errors::KernelError::missing_parameter("minor_radius"));
            }
        }
    }
    Ok(())
}
