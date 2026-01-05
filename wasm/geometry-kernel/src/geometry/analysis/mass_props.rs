//! Mass properties analysis for geometric solids.
//!
//! This module provides analysis functions for computing derived properties
//! like volume, surface area, centroid, and moments of inertia. These are
//! kept separate from core geometry as per the kernel architecture.

use crate::errors::{KernelError, KernelResult};
use crate::geometry::ir::node::{IRNode, NodeId};
use crate::types::PreviewMesh;
use serde::{Deserialize, Serialize};

/// Complete mass properties for a geometric solid
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MassProperties {
    /// Volume of the solid (cubic units)
    pub volume: f64,
    /// Surface area of the solid (square units)
    pub surface_area: f64,
    /// Centroid coordinates [x, y, z]
    pub centroid: [f64; 3],
    /// Center of mass (same as centroid for uniform density)
    pub center_of_mass: [f64; 3],
    /// Mass (volume * density)
    pub mass: f64,
    /// Principal moments of inertia [Ixx, Iyy, Izz]
    pub principal_moments: [f64; 3],
    /// Principal axes of inertia (rotation matrix)
    pub principal_axes: [[f64; 3]; 3],
    /// Products of inertia [Ixy, Ixz, Iyz]
    pub products_of_inertia: [f64; 3],
    /// Radius of gyration about each principal axis
    pub radii_of_gyration: [f64; 3],
}

impl MassProperties {
    /// Create mass properties with zero values
    pub fn zero() -> Self {
        MassProperties {
            volume: 0.0,
            surface_area: 0.0,
            centroid: [0.0, 0.0, 0.0],
            center_of_mass: [0.0, 0.0, 0.0],
            mass: 0.0,
            principal_moments: [0.0, 0.0, 0.0],
            principal_axes: [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
            products_of_inertia: [0.0, 0.0, 0.0],
            radii_of_gyration: [0.0, 0.0, 0.0],
        }
    }

    /// Check if mass properties are valid (non-negative values)
    pub fn is_valid(&self) -> bool {
        self.volume >= 0.0
            && self.surface_area >= 0.0
            && self.mass >= 0.0
            && self.principal_moments.iter().all(|&m| m >= 0.0)
            && self.radii_of_gyration.iter().all(|&r| r >= 0.0)
    }

    /// Get moment of inertia about a specific axis through the centroid
    pub fn moment_about_axis(&self, axis: [f64; 3]) -> f64 {
        // Normalize the axis
        let magnitude = (axis[0].powi(2) + axis[1].powi(2) + axis[2].powi(2)).sqrt();
        if magnitude < 1e-10 {
            return 0.0;
        }
        let unit_axis = [
            axis[0] / magnitude,
            axis[1] / magnitude,
            axis[2] / magnitude,
        ];

        // Transform to principal axis coordinates
        let mut transformed_axis = [0.0; 3];
        for i in 0..3 {
            transformed_axis[i] = unit_axis[0] * self.principal_axes[0][i]
                + unit_axis[1] * self.principal_axes[1][i]
                + unit_axis[2] * self.principal_axes[2][i];
        }

        // Compute moment using principal moments
        transformed_axis[0].powi(2) * self.principal_moments[0]
            + transformed_axis[1].powi(2) * self.principal_moments[1]
            + transformed_axis[2].powi(2) * self.principal_moments[2]
    }

    /// Get moment of inertia about an axis through a given point
    pub fn moment_about_point_axis(&self, point: [f64; 3], axis: [f64; 3]) -> f64 {
        let centroidal_moment = self.moment_about_axis(axis);

        // Parallel axis theorem: I = I_c + m * d^2
        let displacement = [
            point[0] - self.centroid[0],
            point[1] - self.centroid[1],
            point[2] - self.centroid[2],
        ];

        // Distance from centroid to the parallel axis
        let d_squared = displacement[0].powi(2) + displacement[1].powi(2) + displacement[2].powi(2);

        centroidal_moment + self.mass * d_squared
    }
}

/// Material properties for mass calculations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialProperties {
    /// Density (mass per unit volume)
    pub density: f64,
    /// Material name
    pub name: String,
    /// Young's modulus (optional, for stress analysis)
    pub youngs_modulus: Option<f64>,
    /// Poisson's ratio (optional, for stress analysis)
    pub poissons_ratio: Option<f64>,
}

impl MaterialProperties {
    /// Create material properties for common materials
    pub fn aluminum() -> Self {
        MaterialProperties {
            density: 2700.0, // kg/m³
            name: "Aluminum".to_string(),
            youngs_modulus: Some(69e9), // Pa
            poissons_ratio: Some(0.33),
        }
    }

    pub fn steel() -> Self {
        MaterialProperties {
            density: 7850.0, // kg/m³
            name: "Steel".to_string(),
            youngs_modulus: Some(200e9), // Pa
            poissons_ratio: Some(0.30),
        }
    }

    pub fn plastic_abs() -> Self {
        MaterialProperties {
            density: 1040.0, // kg/m³
            name: "ABS Plastic".to_string(),
            youngs_modulus: Some(2.3e9), // Pa
            poissons_ratio: Some(0.40),
        }
    }

    pub fn custom(density: f64, name: String) -> Self {
        MaterialProperties {
            density,
            name,
            youngs_modulus: None,
            poissons_ratio: None,
        }
    }
}

/// Mass properties analyzer
pub struct MassPropertiesAnalyzer {
    /// Default material properties
    default_material: MaterialProperties,
}

impl MassPropertiesAnalyzer {
    /// Create analyzer with aluminum as default material
    pub fn new() -> Self {
        MassPropertiesAnalyzer {
            default_material: MaterialProperties::aluminum(),
        }
    }

    /// Create analyzer with custom default material
    pub fn with_material(material: MaterialProperties) -> Self {
        MassPropertiesAnalyzer {
            default_material: material,
        }
    }

    /// Compute mass properties from a triangular mesh
    pub fn analyze_mesh(&self, mesh: &PreviewMesh) -> KernelResult<MassProperties> {
        self.analyze_mesh_with_material(mesh, &self.default_material)
    }

    /// Compute mass properties with specific material
    pub fn analyze_mesh_with_material(
        &self,
        mesh: &PreviewMesh,
        material: &MaterialProperties,
    ) -> KernelResult<MassProperties> {
        if mesh.vertices.is_empty() || mesh.indices.is_empty() {
            return Ok(MassProperties::zero());
        }

        // Compute volume and centroid using divergence theorem
        let (volume, centroid) = self.compute_volume_and_centroid(mesh)?;

        if volume <= 0.0 {
            return Err(KernelError::internal(
                "Computed volume is non-positive - mesh may not be a closed solid".to_string(),
            ));
        }

        // Compute surface area
        let surface_area = self.compute_surface_area(mesh)?;

        // Compute moments of inertia about centroid
        let (moments, products) = self.compute_inertia_tensor(mesh, centroid, material.density)?;

        // Compute principal moments and axes
        let (principal_moments, principal_axes) =
            self.compute_principal_moments(moments, products)?;

        // Compute radii of gyration
        let mass = volume * material.density;
        let radii_of_gyration = [
            (principal_moments[0] / mass).sqrt(),
            (principal_moments[1] / mass).sqrt(),
            (principal_moments[2] / mass).sqrt(),
        ];

        Ok(MassProperties {
            volume,
            surface_area,
            centroid,
            center_of_mass: centroid, // Same for uniform density
            mass,
            principal_moments,
            principal_axes,
            products_of_inertia: products,
            radii_of_gyration,
        })
    }

    /// Compute volume and centroid using the divergence theorem
    fn compute_volume_and_centroid(&self, mesh: &PreviewMesh) -> KernelResult<(f64, [f64; 3])> {
        let mut volume = 0.0;
        let mut centroid = [0.0, 0.0, 0.0];

        // Process triangles
        for i in 0..mesh.indices.len() / 3 {
            let i0 = mesh.indices[i * 3] as usize;
            let i1 = mesh.indices[i * 3 + 1] as usize;
            let i2 = mesh.indices[i * 3 + 2] as usize;

            if i0 >= mesh.vertices.len() / 3
                || i1 >= mesh.vertices.len() / 3
                || i2 >= mesh.vertices.len() / 3
            {
                continue;
            }

            let v0 = [
                mesh.vertices[i0 * 3],
                mesh.vertices[i0 * 3 + 1],
                mesh.vertices[i0 * 3 + 2],
            ];
            let v1 = [
                mesh.vertices[i1 * 3],
                mesh.vertices[i1 * 3 + 1],
                mesh.vertices[i1 * 3 + 2],
            ];
            let v2 = [
                mesh.vertices[i2 * 3],
                mesh.vertices[i2 * 3 + 1],
                mesh.vertices[i2 * 3 + 2],
            ];

            // Compute signed volume of tetrahedron formed by origin and triangle
            let signed_volume = self.tetrahedron_volume(
                [0.0, 0.0, 0.0],
                [v0[0] as f64, v0[1] as f64, v0[2] as f64],
                [v1[0] as f64, v1[1] as f64, v1[2] as f64],
                [v2[0] as f64, v2[1] as f64, v2[2] as f64],
            );
            volume += signed_volume;

            // Accumulate centroid contribution
            let tri_centroid = [
                (v0[0] + v1[0] + v2[0]) / 3.0,
                (v0[1] + v1[1] + v2[1]) / 3.0,
                (v0[2] + v1[2] + v2[2]) / 3.0,
            ];

            centroid[0] += signed_volume * tri_centroid[0] as f64;
            centroid[1] += signed_volume * tri_centroid[1] as f64;
            centroid[2] += signed_volume * tri_centroid[2] as f64;
        }

        if volume.abs() < 1e-10 {
            return Err(KernelError::internal(
                "Computed volume is effectively zero".to_string(),
            ));
        }

        // Normalize centroid
        centroid[0] /= volume;
        centroid[1] /= volume;
        centroid[2] /= volume;

        Ok((volume.abs(), centroid))
    }

    /// Compute surface area from triangular mesh
    fn compute_surface_area(&self, mesh: &PreviewMesh) -> KernelResult<f64> {
        let mut area = 0.0;

        for i in 0..mesh.indices.len() / 3 {
            let i0 = mesh.indices[i * 3] as usize;
            let i1 = mesh.indices[i * 3 + 1] as usize;
            let i2 = mesh.indices[i * 3 + 2] as usize;

            if i0 >= mesh.vertices.len() / 3
                || i1 >= mesh.vertices.len() / 3
                || i2 >= mesh.vertices.len() / 3
            {
                continue;
            }

            let v0 = [
                mesh.vertices[i0 * 3],
                mesh.vertices[i0 * 3 + 1],
                mesh.vertices[i0 * 3 + 2],
            ];
            let v1 = [
                mesh.vertices[i1 * 3],
                mesh.vertices[i1 * 3 + 1],
                mesh.vertices[i1 * 3 + 2],
            ];
            let v2 = [
                mesh.vertices[i2 * 3],
                mesh.vertices[i2 * 3 + 1],
                mesh.vertices[i2 * 3 + 2],
            ];

            area += self.triangle_area(
                [v0[0] as f64, v0[1] as f64, v0[2] as f64],
                [v1[0] as f64, v1[1] as f64, v1[2] as f64],
                [v2[0] as f64, v2[1] as f64, v2[2] as f64],
            );
        }

        Ok(area)
    }

    /// Compute inertia tensor components about the centroid
    fn compute_inertia_tensor(
        &self,
        mesh: &PreviewMesh,
        centroid: [f64; 3],
        density: f64,
    ) -> KernelResult<([f64; 3], [f64; 3])> {
        let mut ixx = 0.0;
        let mut iyy = 0.0;
        let mut izz = 0.0;
        let mut ixy = 0.0;
        let mut ixz = 0.0;
        let mut iyz = 0.0;

        // Process each tetrahedron formed by centroid and mesh triangles
        for i in 0..mesh.indices.len() / 3 {
            let i0 = mesh.indices[i * 3] as usize;
            let i1 = mesh.indices[i * 3 + 1] as usize;
            let i2 = mesh.indices[i * 3 + 2] as usize;

            if i0 >= mesh.vertices.len() / 3
                || i1 >= mesh.vertices.len() / 3
                || i2 >= mesh.vertices.len() / 3
            {
                continue;
            }

            let v0 = [
                mesh.vertices[i0 * 3] as f64 - centroid[0],
                mesh.vertices[i0 * 3 + 1] as f64 - centroid[1],
                mesh.vertices[i0 * 3 + 2] as f64 - centroid[2],
            ];
            let v1 = [
                mesh.vertices[i1 * 3] as f64 - centroid[0],
                mesh.vertices[i1 * 3 + 1] as f64 - centroid[1],
                mesh.vertices[i1 * 3 + 2] as f64 - centroid[2],
            ];
            let v2 = [
                mesh.vertices[i2 * 3] as f64 - centroid[0],
                mesh.vertices[i2 * 3 + 1] as f64 - centroid[1],
                mesh.vertices[i2 * 3 + 2] as f64 - centroid[2],
            ];

            let tet_volume = self.tetrahedron_volume([0.0, 0.0, 0.0], v0, v1, v2).abs();
            let tet_mass = tet_volume * density;

            // Inertia tensor components for tetrahedron
            let (tet_ixx, tet_iyy, tet_izz, tet_ixy, tet_ixz, tet_iyz) =
                self.tetrahedron_inertia([0.0, 0.0, 0.0], v0, v1, v2, tet_mass);

            ixx += tet_ixx;
            iyy += tet_iyy;
            izz += tet_izz;
            ixy += tet_ixy;
            ixz += tet_ixz;
            iyz += tet_iyz;
        }

        Ok(([ixx, iyy, izz], [ixy, ixz, iyz]))
    }

    /// Compute principal moments and axes using eigenvalue decomposition
    fn compute_principal_moments(
        &self,
        moments: [f64; 3],
        products: [f64; 3],
    ) -> KernelResult<([f64; 3], [[f64; 3]; 3])> {
        // For now, return simplified results assuming principal axes align with coordinate axes
        // A full implementation would use eigenvalue decomposition
        let principal_moments = moments;
        let principal_axes = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];

        Ok((principal_moments, principal_axes))
    }

    // Helper methods for geometric calculations

    fn tetrahedron_volume(&self, p0: [f64; 3], p1: [f64; 3], p2: [f64; 3], p3: [f64; 3]) -> f64 {
        let v1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
        let v2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
        let v3 = [p3[0] - p0[0], p3[1] - p0[1], p3[2] - p0[2]];

        // Volume = 1/6 * |v1 · (v2 × v3)|
        let cross = [
            v2[1] * v3[2] - v2[2] * v3[1],
            v2[2] * v3[0] - v2[0] * v3[2],
            v2[0] * v3[1] - v2[1] * v3[0],
        ];
        let dot = v1[0] * cross[0] + v1[1] * cross[1] + v1[2] * cross[2];
        dot / 6.0
    }

    fn triangle_area(&self, p0: [f64; 3], p1: [f64; 3], p2: [f64; 3]) -> f64 {
        let v1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
        let v2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];

        let cross = [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0],
        ];

        0.5 * (cross[0].powi(2) + cross[1].powi(2) + cross[2].powi(2)).sqrt()
    }

    fn tetrahedron_inertia(
        &self,
        p0: [f64; 3],
        p1: [f64; 3],
        p2: [f64; 3],
        p3: [f64; 3],
        mass: f64,
    ) -> (f64, f64, f64, f64, f64, f64) {
        // Simplified inertia calculation for tetrahedron
        // This is a stub - full implementation would compute the exact integrals
        let cx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4.0;
        let cy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4.0;
        let cz = (p0[2] + p1[2] + p2[2] + p3[2]) / 4.2;

        let ixx = mass * (cy.powi(2) + cz.powi(2));
        let iyy = mass * (cx.powi(2) + cz.powi(2));
        let izz = mass * (cx.powi(2) + cy.powi(2));
        let ixy = -mass * cx * cy;
        let ixz = -mass * cx * cz;
        let iyz = -mass * cy * cz;

        (ixx, iyy, izz, ixy, ixz, iyz)
    }
}

impl Default for MassPropertiesAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}

/// Compute mass properties for a collection of nodes
pub fn analyze_nodes(
    nodes: &[&IRNode],
    analyzer: &MassPropertiesAnalyzer,
) -> KernelResult<MassProperties> {
    // This would aggregate mass properties from multiple nodes
    // For now, return zero properties as a stub
    Ok(MassProperties::zero())
}

/// Quick volume estimation for simple primitives
pub fn estimate_volume_primitive(
    primitive_type: &str,
    parameters: &std::collections::HashMap<String, f64>,
) -> f64 {
    match primitive_type {
        "box" => {
            let width = parameters.get("width").unwrap_or(&1.0);
            let height = parameters.get("height").unwrap_or(&1.0);
            let depth = parameters.get("depth").unwrap_or(&1.0);
            width * height * depth
        }
        "cylinder" => {
            let radius = parameters.get("radius").unwrap_or(&1.0);
            let height = parameters.get("height").unwrap_or(&1.0);
            std::f64::consts::PI * radius.powi(2) * height
        }
        "sphere" => {
            let radius = parameters.get("radius").unwrap_or(&1.0);
            4.0 / 3.0 * std::f64::consts::PI * radius.powi(3)
        }
        "cone" => {
            let radius = parameters.get("radius").unwrap_or(&1.0);
            let height = parameters.get("height").unwrap_or(&1.0);
            std::f64::consts::PI * radius.powi(2) * height / 3.0
        }
        "torus" => {
            let major_radius = parameters.get("major_radius").unwrap_or(&2.0);
            let minor_radius = parameters.get("minor_radius").unwrap_or(&0.5);
            2.0 * std::f64::consts::PI.powi(2) * major_radius * minor_radius.powi(2)
        }
        _ => 0.0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::PreviewMesh;

    fn create_cube_mesh(size: f32) -> PreviewMesh {
        // Create a simple cube mesh for testing
        let s = size / 2.0;
        let vertices = vec![
            // Front face
            -s, -s, s, // 0
            s, -s, s, // 1
            s, s, s, // 2
            -s, s, s, // 3
            // Back face
            -s, -s, -s, // 4
            s, -s, -s, // 5
            s, s, -s, // 6
            -s, s, -s, // 7
        ];

        let indices = vec![
            // Front
            0, 1, 2, 0, 2, 3, // Back
            5, 4, 7, 5, 7, 6, // Left
            4, 0, 3, 4, 3, 7, // Right
            1, 5, 6, 1, 6, 2, // Top
            3, 2, 6, 3, 6, 7, // Bottom
            4, 5, 1, 4, 1, 0,
        ];

        let normals = vec![0.0; vertices.len()]; // Simplified normals

        PreviewMesh {
            vertices,
            indices,
            normals,
        }
    }

    #[test]
    fn test_mass_properties_analyzer() {
        let analyzer = MassPropertiesAnalyzer::new();
        let mesh = create_cube_mesh(2.0);

        let result = analyzer.analyze_mesh(&mesh);
        assert!(result.is_ok());

        let props = result.unwrap();
        assert!(props.is_valid());
        assert!(props.volume > 0.0);
        assert!(props.surface_area > 0.0);
        assert!(props.mass > 0.0);
    }

    #[test]
    fn test_volume_estimation() {
        let mut params = std::collections::HashMap::new();
        params.insert("width".to_string(), 2.0);
        params.insert("height".to_string(), 3.0);
        params.insert("depth".to_string(), 4.0);

        let volume = estimate_volume_primitive("box", &params);
        assert_eq!(volume, 24.0);

        params.clear();
        params.insert("radius".to_string(), 1.0);
        let sphere_volume = estimate_volume_primitive("sphere", &params);
        let expected = 4.0 / 3.0 * std::f64::consts::PI;
        assert!((sphere_volume - expected).abs() < 1e-10);
    }

    #[test]
    fn test_material_properties() {
        let aluminum = MaterialProperties::aluminum();
        assert_eq!(aluminum.density, 2700.0);
        assert_eq!(aluminum.name, "Aluminum");

        let steel = MaterialProperties::steel();
        assert_eq!(steel.density, 7850.0);
    }

    #[test]
    fn test_mass_properties_zero() {
        let props = MassProperties::zero();
        assert!(props.is_valid());
        assert_eq!(props.volume, 0.0);
        assert_eq!(props.mass, 0.0);
    }

    #[test]
    fn test_moment_about_axis() {
        let mut props = MassProperties::zero();
        props.principal_moments = [1.0, 2.0, 3.0];
        props.mass = 1.0;

        // Moment about X-axis should be the first principal moment
        let moment_x = props.moment_about_axis([1.0, 0.0, 0.0]);
        assert!((moment_x - 1.0).abs() < 1e-10);

        // Moment about Y-axis should be the second principal moment
        let moment_y = props.moment_about_axis([0.0, 1.0, 0.0]);
        assert!((moment_y - 2.0).abs() < 1e-10);
    }
}
