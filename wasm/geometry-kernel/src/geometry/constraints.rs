//! Manufacturability constraints validation.
//!
//! Validates geometry against manufacturing process constraints
//! such as minimum wall thickness, tool diameter, and overhang angles.

use crate::geometry::{PreviewMesh, BoundingBox};
use crate::errors::{KernelError, KernelResult};
use crate::types::{
    ConstraintType, ConstraintViolation, ManufacturabilityReport, ViolationSeverity,
};
use std::collections::HashMap;

/// Validate mesh against manufacturing constraints
pub fn validate_constraints(
    mesh: &PreviewMesh,
    constraints: &HashMap<ConstraintType, f64>,
) -> ManufacturabilityReport {
    let mut violations = Vec::new();
    let mut warnings = Vec::new();

    // Validate minimum wall thickness
    if let Some(&min_thickness) = constraints.get(&ConstraintType::MinWallThickness) {
        if let Some(violation) = check_wall_thickness(mesh, min_thickness) {
            violations.push(violation);
        }
    }

    // Validate tool diameter constraints
    if let Some(&tool_diameter) = constraints.get(&ConstraintType::ToolDiameter) {
        if let Some(violation) = check_tool_diameter(mesh, tool_diameter) {
            warnings.push(violation);
        }
    }

    // Validate maximum overhang angle
    if let Some(&max_overhang) = constraints.get(&ConstraintType::MaxOverhang) {
        if let Some(violation) = check_overhang_angle(mesh, max_overhang) {
            warnings.push(violation);
        }
    }

    // Check for very small features
    if let Some(violation) = check_feature_size(mesh) {
        warnings.push(violation);
    }

    // Check mesh integrity
    if let Some(violation) = check_mesh_integrity(mesh) {
        if violation.severity == ViolationSeverity::Error {
            violations.push(violation);
        } else {
            warnings.push(violation);
        }
    }

    let valid = violations.is_empty();

    ManufacturabilityReport {
        valid,
        violations,
        warnings,
    }
}

/// Check minimum wall thickness
///
/// Estimates wall thickness by analyzing vertex spacing and triangle edge lengths.
/// For accurate results, a volumetric analysis would be needed.
fn check_wall_thickness(mesh: &PreviewMesh, min_thickness: f64) -> Option<ConstraintViolation> {
    if mesh.vertices.is_empty() {
        return None;
    }

    let mut min_edge_length = f64::MAX;

    // Sample edges to find minimum spacing
    let sample_count = mesh.indices.len().min(1000);
    for chunk in mesh.indices.chunks(3).take(sample_count / 3) {
        if chunk.len() == 3 {
            for i in 0..3 {
                let i0 = (chunk[i] * 3) as usize;
                let i1 = (chunk[(i + 1) % 3] * 3) as usize;

                if i0 + 2 < mesh.vertices.len() && i1 + 2 < mesh.vertices.len() {
                    let v0 = [
                        mesh.vertices[i0] as f64,
                        mesh.vertices[i0 + 1] as f64,
                        mesh.vertices[i0 + 2] as f64,
                    ];
                    let v1 = [
                        mesh.vertices[i1] as f64,
                        mesh.vertices[i1 + 1] as f64,
                        mesh.vertices[i1 + 2] as f64,
                    ];

                    let dx = v1[0] - v0[0];
                    let dy = v1[1] - v0[1];
                    let dz = v1[2] - v0[2];
                    let length = (dx * dx + dy * dy + dz * dz).sqrt();

                    min_edge_length = min_edge_length.min(length);
                }
            }
        }
    }

    if min_edge_length < min_thickness {
        Some(ConstraintViolation {
            type_: ConstraintType::MinWallThickness,
            severity: ViolationSeverity::Warning,
            message: format!(
                "Minimum edge length ({:.3}) is below recommended thickness ({:.3})",
                min_edge_length, min_thickness
            ),
            value: min_edge_length,
            limit: min_thickness,
        })
    } else {
        None
    }
}

/// Check tool diameter constraints
///
/// Ensures features are large enough for the specified tool diameter.
/// For CNC machining, features must be at least as large as the tool.
fn check_tool_diameter(mesh: &PreviewMesh, tool_diameter: f64) -> Option<ConstraintViolation> {
    if mesh.vertices.is_empty() {
        return None;
    }

    let bbox = match crate::geometry::bounding_box::compute_bounding_box(mesh) {
        Ok(bbox) => bbox,
        Err(_) => return None,
    };

    let size = bbox.size();
    let min_dimension = size[0].min(size[1]).min(size[2]);

    if min_dimension < tool_diameter {
        Some(ConstraintViolation {
            type_: ConstraintType::ToolDiameter,
            severity: ViolationSeverity::Warning,
            message: format!(
                "Minimum dimension ({:.3}) is smaller than tool diameter ({:.3})",
                min_dimension, tool_diameter
            ),
            value: min_dimension,
            limit: tool_diameter,
        })
    } else {
        None
    }
}

/// Check overhang angle for 3D printing
///
/// Analyzes triangle normals to detect overhangs beyond the specified angle.
/// Default support angle is typically 45 degrees.
fn check_overhang_angle(mesh: &PreviewMesh, max_overhang_deg: f64) -> Option<ConstraintViolation> {
    if mesh.normals.is_empty() {
        return None;
    }

    let max_overhang_rad = max_overhang_deg.to_radians();
    let mut max_overhang_found = 0.0;

    // Sample normals to find worst overhang
    let sample_count = mesh.normals.len().min(3000) / 3;
    for i in 0..sample_count {
        let idx = i * 3;
        if idx + 2 < mesh.normals.len() {
            let nx = mesh.normals[idx] as f64;
            let ny = mesh.normals[idx + 1] as f64;
            let nz = mesh.normals[idx + 2] as f64;

            // Vertical component (pointing up or down)
            let vertical_component = ny.abs();

            // Angle from horizontal (0 = vertical, 90 = horizontal)
            let angle_from_vertical = (vertical_component).acos();
            let overhang_angle = angle_from_vertical.to_degrees();

            max_overhang_found = max_overhang_found.max(overhang_angle);
        }
    }

    if max_overhang_found > max_overhang_deg {
        Some(ConstraintViolation {
            type_: ConstraintType::MaxOverhang,
            severity: ViolationSeverity::Warning,
            message: format!(
                "Maximum overhang ({:.1}°) exceeds limit ({:.1}°). Consider adding supports.",
                max_overhang_found, max_overhang_deg
            ),
            value: max_overhang_found,
            limit: max_overhang_deg,
        })
    } else {
        None
    }
}

/// Check for very small features
///
/// Detects features that may be too small for reliable manufacturing.
fn check_feature_size(mesh: &PreviewMesh) -> Option<ConstraintViolation> {
    const MIN_FEATURE_SIZE: f64 = 0.5; // mm

    if mesh.vertices.is_empty() {
        return None;
    }

    let bbox = match crate::geometry::bounding_box::compute_bounding_box(mesh) {
        Ok(bbox) => bbox,
        Err(_) => return None,
    };

    let volume = bbox_volume(&bbox);

    if volume < MIN_FEATURE_SIZE.powi(3) {
        Some(ConstraintViolation {
            type_: ConstraintType::MinWallThickness, // Reuse for general feature size
            severity: ViolationSeverity::Info,
            message: format!(
                "Part volume ({:.3} mm³) is very small. Verify feature size.",
                volume
            ),
            value: volume,
            limit: MIN_FEATURE_SIZE.powi(3),
        })
    } else {
        None
    }
}

/// Check mesh integrity
///
/// Validates basic mesh properties like non-degenerate triangles.
fn check_mesh_integrity(mesh: &PreviewMesh) -> Option<ConstraintViolation> {
    if mesh.vertices.len() % 3 != 0 {
        return Some(ConstraintViolation {
            type_: ConstraintType::MinWallThickness,
            severity: ViolationSeverity::Error,
            message: "Vertex count is not a multiple of 3".to_string(),
            value: mesh.vertices.len() as f64,
            limit: 0.0,
        });
    }

    if mesh.indices.len() % 3 != 0 {
        return Some(ConstraintViolation {
            type_: ConstraintType::MinWallThickness,
            severity: ViolationSeverity::Error,
            message: "Index count is not a multiple of 3".to_string(),
            value: mesh.indices.len() as f64,
            limit: 0.0,
        });
    }

    if mesh.normals.len() != mesh.vertices.len() {
        return Some(ConstraintViolation {
            type_: ConstraintType::MinWallThickness,
            severity: ViolationSeverity::Error,
            message: "Normal count does not match vertex count".to_string(),
            value: mesh.normals.len() as f64,
            limit: mesh.vertices.len() as f64,
        });
    }

    // Check for degenerate triangles
    let mut degenerate_count = 0;
    let mut checked = 0;
    const MAX_CHECK: usize = 1000;

    for chunk in mesh.indices.chunks(3).take(MAX_CHECK) {
        if chunk.len() == 3 {
            let i0 = (chunk[0] * 3) as usize;
            let i1 = (chunk[1] * 3) as usize;
            let i2 = (chunk[2] * 3) as usize;

            if i0 + 2 < mesh.vertices.len()
                && i1 + 2 < mesh.vertices.len()
                && i2 + 2 < mesh.vertices.len()
            {
                let v0 = [
                    mesh.vertices[i0] as f64,
                    mesh.vertices[i0 + 1] as f64,
                    mesh.vertices[i0 + 2] as f64,
                ];
                let v1 = [
                    mesh.vertices[i1] as f64,
                    mesh.vertices[i1 + 1] as f64,
                    mesh.vertices[i1 + 2] as f64,
                ];
                let v2 = [
                    mesh.vertices[i2] as f64,
                    mesh.vertices[i2 + 1] as f64,
                    mesh.vertices[i2 + 2] as f64,
                ];

                // Check triangle area
                let e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
                let e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

                let cross = [
                    e1[1] * e2[2] - e1[2] * e2[1],
                    e1[2] * e2[0] - e1[0] * e2[2],
                    e1[0] * e2[1] - e1[1] * e2[0],
                ];

                let area = (cross[0] * cross[0] + cross[1] * cross[1] + cross[2] * cross[2])
                    .sqrt()
                    / 2.0;

                if area < crate::geometry::constants::EPSILON {
                    degenerate_count += 1;
                }

                checked += 1;
            }
        }
    }

    if degenerate_count > checked / 10 {
        // More than 10% degenerate triangles
        Some(ConstraintViolation {
            type_: ConstraintType::MinWallThickness,
            severity: ViolationSeverity::Warning,
            message: format!(
                "Mesh contains {:.1}% degenerate triangles",
                (degenerate_count as f64 / checked as f64) * 100.0
            ),
            value: degenerate_count as f64,
            limit: checked as f64,
        })
    } else {
        None
    }
}

/// Compute bounding box volume
fn bbox_volume(bbox: &BoundingBox) -> f64 {
    let size = bbox.size();
    if bbox.is_empty() {
        0.0
    } else {
        size[0] * size[1] * size[2]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::primitives::{Box as BoxPrimitive, Primitive};

    #[test]
    fn test_validate_empty_mesh() {
        let mesh = PreviewMesh::new();
        let constraints = HashMap::new();

        let report = validate_constraints(&mesh, &constraints);

        assert!(report.valid);
        assert!(report.violations.is_empty());
        assert!(report.warnings.is_empty());
    }

    #[test]
    fn test_validate_box() {
        let mesh = BoxPrimitive::new(10.0, 10.0, 10.0).to_mesh(16);

        let mut constraints = HashMap::new();
        constraints.insert(ConstraintType::MinWallThickness, 1.0);
        constraints.insert(ConstraintType::ToolDiameter, 2.0);
        constraints.insert(ConstraintType::MaxOverhang, 45.0);

        let report = validate_constraints(&mesh, &constraints);

        // Large box should pass all constraints
        assert!(report.valid);
    }

    #[test]
    fn test_wall_thickness_warning() {
        let mesh = BoxPrimitive::new(0.1, 0.1, 0.1).to_mesh(4);

        let mut constraints = HashMap::new();
        constraints.insert(ConstraintType::MinWallThickness, 1.0);

        let report = validate_constraints(&mesh, &constraints);

        // Small box should generate warnings
        assert!(!report.warnings.is_empty());
    }
}
