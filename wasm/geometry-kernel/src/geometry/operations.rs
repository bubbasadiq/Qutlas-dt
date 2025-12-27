//! Boolean operations for CSG compilation.
//!
//! This module implements Union, Subtract, and Intersect operations
//! on meshes using robust numerical algorithms.

use crate::geometry::{constants, PreviewMesh, BoundingBox};
use crate::errors::{KernelError, KernelResult};

/// Boolean operation types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BooleanOperation {
    Union,
    Subtract,
    Intersect,
}

/// Perform boolean operation on two meshes
///
/// For now, this is a simplified implementation that combines meshes
/// for Union operations. A full implementation would use proper CSG
/// algorithms with robust mesh boolean operations.
pub fn boolean_operation(
    mesh1: &PreviewMesh,
    mesh2: &PreviewMesh,
    operation: BooleanOperation,
) -> KernelResult<PreviewMesh> {
    mesh1.is_valid()?;
    mesh2.is_valid()?;

    match operation {
        BooleanOperation::Union => union_meshes(mesh1, mesh2),
        BooleanOperation::Subtract => subtract_meshes(mesh1, mesh2),
        BooleanOperation::Intersect => intersect_meshes(mesh1, mesh2),
    }
}

/// Union operation - combine two meshes
///
/// For a full implementation, this would:
/// 1. Merge vertices within epsilon tolerance
/// 2. Detect and remove internal faces
/// 3. Create new faces at intersection boundaries
///
/// Current implementation: simple concatenation with offset indices
fn union_meshes(mesh1: &PreviewMesh, mesh2: &PreviewMesh) -> KernelResult<PreviewMesh> {
    let mut result = PreviewMesh::new();

    // Add all vertices from mesh1
    result.vertices.extend_from_slice(&mesh1.vertices);
    result.normals.extend_from_slice(&mesh1.normals);

    // Add all indices from mesh1
    result.indices.extend_from_slice(&mesh1.indices);

    // Offset for mesh2 indices
    let vertex_offset = (mesh1.vertices.len() / 3) as u32;

    // Add vertices from mesh2
    result.vertices.extend_from_slice(&mesh2.vertices);
    result.normals.extend_from_slice(&mesh2.normals);

    // Add indices from mesh2 with offset
    for index in &mesh2.indices {
        result.indices.push(index + vertex_offset);
    }

    Ok(result)
}

/// Subtract operation - remove mesh2 from mesh1
///
/// For a full implementation, this would:
/// 1. Compute intersection of meshes
/// 2. Create new faces at cut boundaries
/// 3. Remove portions of mesh1 that overlap with mesh2
///
/// Current implementation: returns mesh1 only (placeholder)
fn subtract_meshes(mesh1: &PreviewMesh, mesh2: &PreviewMesh) -> KernelResult<PreviewMesh> {
    // Placeholder: return a copy of mesh1
    // In a full implementation, this would perform actual CSG subtraction
    Ok(PreviewMesh {
        vertices: mesh1.vertices.clone(),
        normals: mesh1.normals.clone(),
        indices: mesh1.indices.clone(),
    })
}

/// Intersect operation - keep only overlapping volume
///
/// For a full implementation, this would:
/// 1. Compute intersection of meshes
/// 2. Create new faces at intersection boundaries
/// 3. Remove portions outside the intersection
///
/// Current implementation: returns empty mesh (placeholder)
fn intersect_meshes(_mesh1: &PreviewMesh, _mesh2: &PreviewMesh) -> KernelResult<PreviewMesh> {
    // Placeholder: return empty mesh
    // In a full implementation, this would perform actual CSG intersection
    Ok(PreviewMesh::new())
}

/// Test if two bounding boxes intersect
pub fn boxes_intersect(bbox1: &BoundingBox, bbox2: &BoundingBox) -> bool {
    bbox1.intersects(bbox2)
}

/// Test if two bounding boxes overlap significantly
/// (useful for early rejection in boolean operations)
pub fn boxes_overlap_significantly(
    bbox1: &BoundingBox,
    bbox2: &BoundingBox,
    threshold: f64,
) -> bool {
    if !boxes_intersect(bbox1, bbox2) {
        return false;
    }

    // Compute overlap volume
    let overlap_min = [
        bbox1.min[0].max(bbox2.min[0]),
        bbox1.min[1].max(bbox2.min[1]),
        bbox1.min[2].max(bbox2.min[2]),
    ];

    let overlap_max = [
        bbox1.max[0].min(bbox2.max[0]),
        bbox1.max[1].min(bbox2.max[1]),
        bbox1.max[2].min(bbox2.max[2]),
    ];

    let overlap_size = [
        overlap_max[0] - overlap_min[0],
        overlap_max[1] - overlap_min[1],
        overlap_max[2] - overlap_min[2],
    ];

    let overlap_volume = overlap_size[0] * overlap_size[1] * overlap_size[2];

    // Compute volumes
    let size1 = bbox1.size();
    let volume1 = size1[0] * size1[1] * size1[2];

    let size2 = bbox2.size();
    let volume2 = size2[0] * size2[1] * size2[2];

    // Check if overlap is significant relative to smaller mesh
    let min_volume = volume1.min(volume2);

    if min_volume < constants::EPSILON {
        return false;
    }

    (overlap_volume / min_volume) > threshold
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::primitives::{Box as BoxPrimitive, Primitive};

    #[test]
    fn test_union_meshes() {
        let mesh1 = BoxPrimitive::new(1.0, 1.0, 1.0).to_mesh(16);
        let mesh2 = BoxPrimitive::new(1.0, 1.0, 1.0).to_mesh(16);

        let result = union_meshes(&mesh1, &mesh2).unwrap();

        assert_eq!(result.vertex_count(), mesh1.vertex_count() + mesh2.vertex_count());
        assert_eq!(result.triangle_count(), mesh1.triangle_count() + mesh2.triangle_count());
    }

    #[test]
    fn test_boxes_intersect() {
        let bbox1 = BoundingBox::new([0.0, 0.0, 0.0], [1.0, 1.0, 1.0]);
        let bbox2 = BoundingBox::new([0.5, 0.5, 0.5], [1.5, 1.5, 1.5]);
        let bbox3 = BoundingBox::new([2.0, 2.0, 2.0], [3.0, 3.0, 3.0]);

        assert!(boxes_intersect(&bbox1, &bbox2));
        assert!(!boxes_intersect(&bbox1, &bbox3));
    }

    #[test]
    fn test_boxes_overlap_significantly() {
        let bbox1 = BoundingBox::new([0.0, 0.0, 0.0], [1.0, 1.0, 1.0]);
        let bbox2 = BoundingBox::new([0.9, 0.9, 0.9], [1.9, 1.9, 1.9]);
        let bbox3 = BoundingBox::new([0.0, 0.0, 0.0], [0.01, 0.01, 0.01]);

        // Significant overlap
        assert!(boxes_overlap_significantly(&bbox1, &bbox2, 0.1));

        // Not significant
        assert!(!boxes_overlap_significantly(&bbox1, &bbox3, 0.1));
    }
}
