//! Bounding box utilities for optimization and culling.
//!
//! Efficient AABB operations for early rejection in CSG operations.

use crate::types::BoundingBox;
use crate::types::PreviewMesh;
use crate::geometry::constants;

/// Compute bounding box from mesh vertices
pub fn compute_bounding_box(mesh: &PreviewMesh) -> BoundingBox {
    if mesh.vertices.is_empty() {
        return BoundingBox::empty();
    }

    let mut bbox = BoundingBox::new(
        [f64::MAX, f64::MAX, f64::MAX],
        [f64::MIN, f64::MIN, f64::MIN],
    );

    for i in (0..mesh.vertices.len()).step_by(3) {
        let x = mesh.vertices[i] as f64;
        let y = mesh.vertices[i + 1] as f64;
        let z = mesh.vertices[i + 2] as f64;

        bbox.min[0] = bbox.min[0].min(x);
        bbox.min[1] = bbox.min[1].min(y);
        bbox.min[2] = bbox.min[2].min(z);

        bbox.max[0] = bbox.max[0].max(x);
        bbox.max[1] = bbox.max[1].max(y);
        bbox.max[2] = bbox.max[2].max(z);
    }

    bbox
}

/// Test if point is inside bounding box
pub fn point_in_bbox(point: [f64; 3], bbox: &BoundingBox) -> bool {
    bbox.contains(point)
}

/// Test if two bounding boxes intersect
pub fn bboxes_intersect(bbox1: &BoundingBox, bbox2: &BoundingBox) -> bool {
    bbox1.intersects(bbox2)
}

/// Merge multiple bounding boxes
pub fn merge_bboxes(bboxes: &[BoundingBox]) -> BoundingBox {
    if bboxes.is_empty() {
        return BoundingBox::empty();
    }

    let mut result = bboxes[0];
    for bbox in &bboxes[1..] {
        result = result.merge(bbox);
    }
    result
}

/// Expand bounding box by epsilon
pub fn expand_bbox(bbox: &BoundingBox, epsilon: f64) -> BoundingBox {
    BoundingBox::new(
        [
            bbox.min[0] - epsilon,
            bbox.min[1] - epsilon,
            bbox.min[2] - epsilon,
        ],
        [
            bbox.max[0] + epsilon,
            bbox.max[1] + epsilon,
            bbox.max[2] + epsilon,
        ],
    )
}

/// Get corners of bounding box (8 corners)
pub fn get_bbox_corners(bbox: &BoundingBox) -> Vec<[f64; 3]> {
    vec![
        [bbox.min[0], bbox.min[1], bbox.min[2]],
        [bbox.max[0], bbox.min[1], bbox.min[2]],
        [bbox.max[0], bbox.max[1], bbox.min[2]],
        [bbox.min[0], bbox.max[1], bbox.min[2]],
        [bbox.min[0], bbox.min[1], bbox.max[2]],
        [bbox.max[0], bbox.min[1], bbox.max[2]],
        [bbox.max[0], bbox.max[1], bbox.max[2]],
        [bbox.min[0], bbox.max[1], bbox.max[2]],
    ]
}

/// Compute volume of bounding box
pub fn bbox_volume(bbox: &BoundingBox) -> f64 {
    let size = bbox.size();
    if bbox.is_empty() {
        0.0
    } else {
        size[0] * size[1] * size[2]
    }
}

/// Compute surface area of bounding box
pub fn bbox_surface_area(bbox: &BoundingBox) -> f64 {
    let size = bbox.size();
    if bbox.is_empty() {
        0.0
    } else {
        2.0 * (size[0] * size[1] + size[1] * size[2] + size[0] * size[2])
    }
}

/// Transform bounding box by transform matrix
pub fn transform_bbox(bbox: &BoundingBox, transform: &crate::types::Transform) -> BoundingBox {
    let corners = get_bbox_corners(bbox);
    let transformed: Vec<[f64; 3]> = corners
        .iter()
        .map(|c| crate::geometry::apply_transform_to_point(*c, transform))
        .collect();

    if transformed.is_empty() {
        return BoundingBox::empty();
    }

    let mut result = BoundingBox::new(
        [f64::MAX, f64::MAX, f64::MAX],
        [f64::MIN, f64::MIN, f64::MIN],
    );

    for point in &transformed {
        result.min[0] = result.min[0].min(point[0]);
        result.min[1] = result.min[1].min(point[1]);
        result.min[2] = result.min[2].min(point[2]);

        result.max[0] = result.max[0].max(point[0]);
        result.max[1] = result.max[1].max(point[1]);
        result.max[2] = result.max[2].max(point[2]);
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::primitives::{Box as BoxPrimitive, Primitive};

    #[test]
    fn test_compute_bounding_box() {
        let mesh = BoxPrimitive::new(1.0, 2.0, 3.0).to_mesh(4);
        let bbox = compute_bounding_box(&mesh).unwrap();

        assert!(!bbox.is_empty());

        let size = bbox.size();
        assert!((size[0] - 1.0).abs() < 0.1);
        assert!((size[1] - 2.0).abs() < 0.1);
        assert!((size[2] - 3.0).abs() < 0.1);
    }

    #[test]
    fn test_bbox_volume() {
        let bbox = BoundingBox::new([0.0, 0.0, 0.0], [1.0, 2.0, 3.0]);
        assert!((bbox_volume(&bbox) - 6.0).abs() < constants::EPSILON);
    }

    #[test]
    fn test_bbox_surface_area() {
        let bbox = BoundingBox::new([0.0, 0.0, 0.0], [1.0, 2.0, 3.0]);
        let expected = 2.0 * (1.0 * 2.0 + 2.0 * 3.0 + 1.0 * 3.0);
        assert!((bbox_surface_area(&bbox) - expected).abs() < constants::EPSILON);
    }

    #[test]
    fn test_expand_bbox() {
        let bbox = BoundingBox::new([0.0, 0.0, 0.0], [1.0, 1.0, 1.0]);
        let expanded = expand_bbox(&bbox, 0.1);

        assert!((expanded.min[0] - (-0.1)).abs() < constants::EPSILON);
        assert!((expanded.max[0] - 1.1).abs() < constants::EPSILON);
    }
}
