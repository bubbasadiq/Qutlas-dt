//! Face definitions with orientation and surface binding for topological representation.
//!
//! This module defines faces as fundamental topological entities that are bounded
//! by edges and carry surface geometry. Faces maintain manufacturing constraints
//! and orientation information essential for solid modeling.

use crate::errors::{KernelError, KernelResult};
use crate::geometry::topology::{EdgeId, TopologyId};
use serde::{Deserialize, Serialize};

/// Unique identifier for faces
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct FaceId(String);

impl FaceId {
    /// Create a new face ID
    pub fn new(id: String) -> Self {
        FaceId(id)
    }

    /// Get string representation
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Face entity in topological representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Face {
    /// Edges that bound this face (ordered for orientation)
    pub boundary_edges: Vec<EdgeId>,
    /// Type of face surface
    pub face_type: FaceType,
    /// Surface geometry definition
    pub surface: Option<FaceSurface>,
    /// Face orientation (outward normal direction)
    pub orientation: FaceOrientation,
    /// Manufacturing tolerance for this face
    pub tolerance: f64,
    /// Surface area (computed)
    pub area: f64,
    /// Manufacturing constraints specific to this face
    pub manufacturing_constraints: Vec<FaceConstraint>,
    /// Whether face is planar
    pub is_planar: bool,
    /// Face normal vector (for planar faces)
    pub normal: Option<[f64; 3]>,
}

impl Face {
    /// Create a new face with boundary edges
    pub fn new(boundary_edges: Vec<EdgeId>, face_type: FaceType) -> Self {
        Face {
            boundary_edges,
            face_type: face_type.clone(),
            surface: None,
            orientation: FaceOrientation::Outward,
            tolerance: 1e-6,
            area: 0.0,
            manufacturing_constraints: Vec::new(),
            is_planar: matches!(face_type, FaceType::Planar),
            normal: None,
        }
    }

    /// Create face with surface definition
    pub fn with_surface(
        boundary_edges: Vec<EdgeId>,
        face_type: FaceType,
        surface: FaceSurface,
    ) -> Self {
        let is_planar = matches!(face_type, FaceType::Planar);
        let normal = if is_planar {
            if let FaceSurface::Plane { normal, .. } = &surface {
                Some(*normal)
            } else {
                None
            }
        } else {
            None
        };

        Face {
            boundary_edges,
            face_type,
            surface: Some(surface),
            orientation: FaceOrientation::Outward,
            tolerance: 1e-6,
            area: 0.0,
            manufacturing_constraints: Vec::new(),
            is_planar,
            normal,
        }
    }

    /// Reverse face orientation
    pub fn reverse_orientation(&mut self) {
        self.orientation = match self.orientation {
            FaceOrientation::Outward => FaceOrientation::Inward,
            FaceOrientation::Inward => FaceOrientation::Outward,
        };

        // Reverse boundary edge order to maintain consistent orientation
        self.boundary_edges.reverse();

        // Flip normal if present
        if let Some(ref mut normal) = self.normal {
            normal[0] = -normal[0];
            normal[1] = -normal[1];
            normal[2] = -normal[2];
        }
    }

    /// Compute face area (requires surface definition)
    pub fn compute_area(&mut self) -> KernelResult<f64> {
        match &self.surface {
            Some(FaceSurface::Plane { .. }) => {
                // For planar faces, would triangulate and sum triangle areas
                // Simplified calculation for now
                self.area = 1.0; // Placeholder
                Ok(self.area)
            }
            Some(FaceSurface::Cylinder { radius, height, .. }) => {
                // Cylindrical surface area calculation
                self.area = 2.0 * std::f64::consts::PI * radius * height;
                Ok(self.area)
            }
            Some(FaceSurface::Sphere { radius, .. }) => {
                // Spherical surface area
                self.area = 4.0 * std::f64::consts::PI * radius * radius;
                Ok(self.area)
            }
            Some(FaceSurface::Parametric { .. }) => {
                // Would need numerical integration for parametric surfaces
                self.area = 1.0; // Placeholder
                Ok(self.area)
            }
            Some(FaceSurface::Cone { .. }) => {
                // Conical surface area calculation (placeholder)
                self.area = 1.0; // TODO: Implement proper conical surface area
                Ok(self.area)
            }
            None => Err(KernelError::internal(
                "Cannot compute area without surface definition".to_string(),
            )),
        }
    }

    /// Check if face is manufacturable
    pub fn is_manufacturable(&self) -> bool {
        // Check manufacturing constraints
        for constraint in &self.manufacturing_constraints {
            if !constraint.is_satisfied(self) {
                return false;
            }
        }

        // Check face-specific manufacturability
        match self.face_type {
            FaceType::Planar => true, // Planar faces are generally manufacturable
            FaceType::Cylindrical => {
                if let Some(FaceSurface::Cylinder { radius, .. }) = &self.surface {
                    *radius >= 0.5 // Minimum radius for tooling access
                } else {
                    false
                }
            }
            FaceType::Spherical => {
                if let Some(FaceSurface::Sphere { radius, .. }) = &self.surface {
                    *radius >= 1.0 // Spherical surfaces need larger minimum radius
                } else {
                    false
                }
            }
            FaceType::Parametric => {
                // Parametric surfaces need detailed analysis
                true // Simplified for now
            }
            FaceType::Freeform => {
                // Freeform surfaces may be difficult to manufacture
                false
            }
        }
    }

    /// Get surface normal at parameter coordinates (u, v)
    pub fn normal_at(&self, u: f64, v: f64) -> KernelResult<[f64; 3]> {
        match &self.surface {
            Some(FaceSurface::Plane { normal, .. }) => Ok(*normal),
            Some(FaceSurface::Cylinder { axis, .. }) => {
                // Compute normal for cylindrical surface
                // Simplified - would need proper parametric computation
                let normalized_axis = normalize_vector(*axis);
                Ok(normalized_axis)
            }
            Some(FaceSurface::Sphere { center, .. }) => {
                // For sphere, normal points radially outward
                // Would need actual surface point to compute proper normal
                Ok([0.0, 0.0, 1.0]) // Placeholder
            }
            Some(FaceSurface::Parametric { .. }) => {
                // Would need partial derivatives for parametric surface normal
                Ok([0.0, 0.0, 1.0]) // Placeholder
            }
            Some(FaceSurface::Cone { .. }) => {
                // Conical surface normal calculation (placeholder)
                Ok([0.0, 0.0, 1.0]) // TODO: Implement proper conical surface normal
            }
            None => {
                if let Some(normal) = self.normal {
                    Ok(normal)
                } else {
                    Err(KernelError::internal(
                        "Cannot compute normal without surface definition".to_string(),
                    ))
                }
            }
        }
    }

    /// Check if point lies on the face surface
    pub fn contains_point(&self, point: [f64; 3]) -> bool {
        match &self.surface {
            Some(FaceSurface::Plane {
                point: plane_point,
                normal,
            }) => {
                // Check if point lies on plane within tolerance
                let to_point = [
                    point[0] - plane_point[0],
                    point[1] - plane_point[1],
                    point[2] - plane_point[2],
                ];
                let dot_product =
                    to_point[0] * normal[0] + to_point[1] * normal[1] + to_point[2] * normal[2];
                dot_product.abs() < self.tolerance
            }
            Some(FaceSurface::Cylinder {
                axis,
                center,
                radius,
                height,
            }) => {
                // Check if point lies on cylindrical surface
                // Simplified computation
                let to_point = [
                    point[0] - center[0],
                    point[1] - center[1],
                    point[2] - center[2],
                ];
                // Project onto axis to get radial distance
                let distance =
                    (to_point[0].powi(2) + to_point[1].powi(2) + to_point[2].powi(2)).sqrt();
                (distance - radius).abs() < self.tolerance
            }
            _ => false, // Simplified - would need proper surface evaluation
        }
    }

    /// Add manufacturing constraint
    pub fn add_constraint(&mut self, constraint: FaceConstraint) {
        self.manufacturing_constraints.push(constraint);
    }

    /// Get edge count
    pub fn edge_count(&self) -> usize {
        self.boundary_edges.len()
    }

    /// Check if face forms a valid loop
    pub fn is_valid_loop(&self) -> bool {
        // A valid face should have at least 3 edges
        self.boundary_edges.len() >= 3
    }
}

/// Face orientation for consistent normal direction
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum FaceOrientation {
    /// Normal points outward from solid
    Outward,
    /// Normal points inward to solid
    Inward,
}

/// Types of faces for manufacturing awareness
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum FaceType {
    /// Flat planar face
    Planar,
    /// Cylindrical surface
    Cylindrical,
    /// Spherical surface
    Spherical,
    /// General parametric surface
    Parametric,
    /// Freeform surface (difficult to manufacture)
    Freeform,
}

/// Geometric surface definitions for faces
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FaceSurface {
    /// Planar surface
    Plane { point: [f64; 3], normal: [f64; 3] },
    /// Cylindrical surface
    Cylinder {
        center: [f64; 3],
        axis: [f64; 3],
        radius: f64,
        height: f64,
    },
    /// Spherical surface
    Sphere { center: [f64; 3], radius: f64 },
    /// Conical surface
    Cone {
        apex: [f64; 3],
        axis: [f64; 3],
        half_angle: f64, // Half angle in radians
    },
    /// Parametric surface U(u,v), V(u,v), W(u,v)
    Parametric {
        u_range: (f64, f64),
        v_range: (f64, f64),
        control_points: Vec<Vec<[f64; 3]>>, // 2D grid of control points
        u_degree: u32,
        v_degree: u32,
        u_knots: Vec<f64>,
        v_knots: Vec<f64>,
    },
}

/// Manufacturing constraints for faces
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceConstraint {
    /// Type of constraint
    pub constraint_type: FaceConstraintType,
    /// Constraint parameters
    pub parameters: std::collections::HashMap<String, f64>,
    /// Manufacturing process this applies to
    pub process: crate::geometry::ir::ManufacturingProcess,
}

impl FaceConstraint {
    /// Create minimum area constraint
    pub fn min_area(area: f64, process: crate::geometry::ir::ManufacturingProcess) -> Self {
        let mut parameters = std::collections::HashMap::new();
        parameters.insert("min_area".to_string(), area);

        FaceConstraint {
            constraint_type: FaceConstraintType::MinArea,
            parameters,
            process,
        }
    }

    /// Create surface finish requirement
    pub fn surface_finish(
        roughness: f64,
        process: crate::geometry::ir::ManufacturingProcess,
    ) -> Self {
        let mut parameters = std::collections::HashMap::new();
        parameters.insert("max_roughness".to_string(), roughness);

        FaceConstraint {
            constraint_type: FaceConstraintType::SurfaceFinish,
            parameters,
            process,
        }
    }

    /// Create draft angle requirement
    pub fn draft_angle(angle: f64, process: crate::geometry::ir::ManufacturingProcess) -> Self {
        let mut parameters = std::collections::HashMap::new();
        parameters.insert("min_draft_angle".to_string(), angle);

        FaceConstraint {
            constraint_type: FaceConstraintType::DraftAngle,
            parameters,
            process,
        }
    }

    /// Check if constraint is satisfied by the face
    pub fn is_satisfied(&self, face: &Face) -> bool {
        match self.constraint_type {
            FaceConstraintType::MinArea => {
                if let Some(min_area) = self.parameters.get("min_area") {
                    face.area >= *min_area
                } else {
                    true
                }
            }
            FaceConstraintType::SurfaceFinish => {
                // Surface finish depends on manufacturing process and face type
                match face.face_type {
                    FaceType::Planar => true, // Planar faces can usually achieve good finish
                    FaceType::Cylindrical => true, // Cylindrical faces are machinable
                    FaceType::Freeform => false, // Freeform surfaces are difficult
                    _ => true,
                }
            }
            FaceConstraintType::DraftAngle => {
                // Would need to check angle between face normal and draft direction
                true // Simplified for now
            }
            FaceConstraintType::ToolAccess => {
                // Check if tooling can access this face
                match face.face_type {
                    FaceType::Planar => true,
                    FaceType::Cylindrical => true,
                    _ => false, // Conservative approach
                }
            }
        }
    }
}

/// Types of face constraints for manufacturing
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum FaceConstraintType {
    /// Minimum face area constraint
    MinArea,
    /// Surface finish requirement
    SurfaceFinish,
    /// Draft angle for molding/casting
    DraftAngle,
    /// Tool accessibility requirement
    ToolAccess,
}

/// Face collection for managing multiple faces
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceCollection {
    /// All faces indexed by ID
    faces: std::collections::HashMap<FaceId, Face>,
    /// Next available face index
    next_face_index: usize,
}

impl FaceCollection {
    /// Create new face collection
    pub fn new() -> Self {
        FaceCollection {
            faces: std::collections::HashMap::new(),
            next_face_index: 0,
        }
    }

    /// Add face to collection
    pub fn add_face(&mut self, face: Face) -> KernelResult<FaceId> {
        let face_id = FaceId::new(format!("f_{}", self.next_face_index));
        self.next_face_index += 1;

        // Validate face has valid boundary
        if !face.is_valid_loop() {
            return Err(KernelError::internal(
                "Face must have at least 3 boundary edges".to_string(),
            ));
        }

        self.faces.insert(face_id.clone(), face);
        Ok(face_id)
    }

    /// Get face by ID
    pub fn get_face(&self, face_id: &FaceId) -> Option<&Face> {
        self.faces.get(face_id)
    }

    /// Get mutable face by ID
    pub fn get_face_mut(&mut self, face_id: &FaceId) -> Option<&mut Face> {
        self.faces.get_mut(face_id)
    }

    /// Find faces that contain a specific edge
    pub fn faces_with_edge(&self, edge_id: &EdgeId) -> Vec<&FaceId> {
        self.faces
            .iter()
            .filter_map(|(id, face)| {
                if face.boundary_edges.contains(edge_id) {
                    Some(id)
                } else {
                    None
                }
            })
            .collect()
    }

    /// Validate face collection consistency
    pub fn validate(&self) -> KernelResult<()> {
        for face in self.faces.values() {
            if !face.is_valid_loop() {
                return Err(KernelError::internal(
                    "Invalid face boundary loop detected".to_string(),
                ));
            }

            // Check manufacturing constraints if enabled
            if !face.is_manufacturable() {
                // Could be a warning rather than error
            }
        }
        Ok(())
    }

    /// Get statistics about the face collection
    pub fn stats(&self) -> FaceCollectionStats {
        let total_faces = self.faces.len();
        let mut face_type_counts = std::collections::HashMap::new();
        let mut total_area = 0.0;
        let mut manufacturability_count = 0;

        for face in self.faces.values() {
            *face_type_counts.entry(face.face_type.clone()).or_insert(0) += 1;
            total_area += face.area;
            if face.is_manufacturable() {
                manufacturability_count += 1;
            }
        }

        let manufacturability_ratio = if total_faces > 0 {
            manufacturability_count as f64 / total_faces as f64
        } else {
            0.0
        };

        FaceCollectionStats {
            total_faces,
            face_type_counts,
            total_area,
            manufacturability_ratio,
        }
    }
}

impl Default for FaceCollection {
    fn default() -> Self {
        Self::new()
    }
}

/// Statistics for face collections
#[derive(Debug, Clone)]
pub struct FaceCollectionStats {
    pub total_faces: usize,
    pub face_type_counts: std::collections::HashMap<FaceType, usize>,
    pub total_area: f64,
    pub manufacturability_ratio: f64,
}

// Helper functions

/// Normalize a vector
fn normalize_vector(vec: [f64; 3]) -> [f64; 3] {
    let magnitude = (vec[0].powi(2) + vec[1].powi(2) + vec[2].powi(2)).sqrt();
    if magnitude > 1e-10 {
        [vec[0] / magnitude, vec[1] / magnitude, vec[2] / magnitude]
    } else {
        [0.0, 0.0, 1.0] // Default normal
    }
}

/// Compute cross product of two vectors
fn cross_product(a: [f64; 3], b: [f64; 3]) -> [f64; 3] {
    [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_face_creation() {
        let edge1 = EdgeId::new("e1".to_string());
        let edge2 = EdgeId::new("e2".to_string());
        let edge3 = EdgeId::new("e3".to_string());
        let edges = vec![edge1, edge2, edge3];

        let face = Face::new(edges, FaceType::Planar);
        assert_eq!(face.face_type, FaceType::Planar);
        assert_eq!(face.orientation, FaceOrientation::Outward);
        assert!(face.is_planar);
        assert_eq!(face.edge_count(), 3);
    }

    #[test]
    fn test_face_with_surface() {
        let edges = vec![EdgeId::new("e1".to_string())];
        let surface = FaceSurface::Plane {
            point: [0.0, 0.0, 0.0],
            normal: [0.0, 0.0, 1.0],
        };

        let face = Face::with_surface(edges, FaceType::Planar, surface);
        assert!(face.surface.is_some());
        assert_eq!(face.normal, Some([0.0, 0.0, 1.0]));
    }

    #[test]
    fn test_face_orientation_reversal() {
        let edges = vec![
            EdgeId::new("e1".to_string()),
            EdgeId::new("e2".to_string()),
            EdgeId::new("e3".to_string()),
        ];
        let mut face = Face::new(edges, FaceType::Planar);
        face.normal = Some([0.0, 0.0, 1.0]);

        assert_eq!(face.orientation, FaceOrientation::Outward);

        face.reverse_orientation();
        assert_eq!(face.orientation, FaceOrientation::Inward);
        assert_eq!(face.normal, Some([0.0, 0.0, -1.0]));
    }

    #[test]
    fn test_face_area_computation() {
        let edges = vec![EdgeId::new("e1".to_string())];
        let surface = FaceSurface::Sphere {
            center: [0.0, 0.0, 0.0],
            radius: 1.0,
        };
        let mut face = Face::with_surface(edges, FaceType::Spherical, surface);

        let result = face.compute_area();
        assert!(result.is_ok());
        assert_eq!(face.area, 4.0 * std::f64::consts::PI); // 4πr² for unit sphere
    }

    #[test]
    fn test_face_manufacturability() {
        let edges = vec![EdgeId::new("e1".to_string())];
        let planar_face = Face::new(edges.clone(), FaceType::Planar);
        assert!(planar_face.is_manufacturable());

        let freeform_face = Face::new(edges, FaceType::Freeform);
        assert!(!freeform_face.is_manufacturable());
    }

    #[test]
    fn test_face_constraint() {
        use crate::geometry::ir::ManufacturingProcess;

        let constraint = FaceConstraint::min_area(10.0, ManufacturingProcess::CNCMilling);
        assert_eq!(constraint.constraint_type, FaceConstraintType::MinArea);

        let face = Face::new(vec![EdgeId::new("e1".to_string())], FaceType::Planar);
        // Face area is 0.0 by default, so constraint should not be satisfied
        assert!(!constraint.is_satisfied(&face));
    }

    #[test]
    fn test_face_collection() {
        let mut collection = FaceCollection::new();
        let edges = vec![
            EdgeId::new("e1".to_string()),
            EdgeId::new("e2".to_string()),
            EdgeId::new("e3".to_string()),
        ];
        let face = Face::new(edges, FaceType::Planar);

        let face_id = collection.add_face(face).unwrap();
        assert!(collection.get_face(&face_id).is_some());

        let stats = collection.stats();
        assert_eq!(stats.total_faces, 1);
    }

    #[test]
    fn test_face_normal_computation() {
        let edges = vec![EdgeId::new("e1".to_string())];
        let surface = FaceSurface::Plane {
            point: [0.0, 0.0, 0.0],
            normal: [1.0, 0.0, 0.0],
        };
        let face = Face::with_surface(edges, FaceType::Planar, surface);

        let normal = face.normal_at(0.0, 0.0).unwrap();
        assert_eq!(normal, [1.0, 0.0, 0.0]);
    }

    #[test]
    fn test_point_containment() {
        let edges = vec![EdgeId::new("e1".to_string())];
        let surface = FaceSurface::Plane {
            point: [0.0, 0.0, 0.0],
            normal: [0.0, 0.0, 1.0],
        };
        let face = Face::with_surface(edges, FaceType::Planar, surface);

        // Point on the plane
        assert!(face.contains_point([1.0, 1.0, 0.0]));
        // Point off the plane
        assert!(!face.contains_point([1.0, 1.0, 1.0]));
    }

    #[test]
    fn test_face_validation() {
        let edges = vec![EdgeId::new("e1".to_string())]; // Only 1 edge - invalid
        let face = Face::new(edges, FaceType::Planar);
        assert!(!face.is_valid_loop());

        let valid_edges = vec![
            EdgeId::new("e1".to_string()),
            EdgeId::new("e2".to_string()),
            EdgeId::new("e3".to_string()),
        ];
        let valid_face = Face::new(valid_edges, FaceType::Planar);
        assert!(valid_face.is_valid_loop());
    }
}
