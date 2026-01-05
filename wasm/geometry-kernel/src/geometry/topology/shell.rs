//! Shell definitions for closed surface sets in topological representation.
//!
//! This module defines shells as collections of faces that form closed or open
//! surface sets. Shells are fundamental for defining solid boundaries and
//! manufacturing volumes.

use crate::errors::{KernelError, KernelResult};
use crate::geometry::topology::{Face, FaceId};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Unique identifier for shells
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ShellId(String);

impl ShellId {
    /// Create a new shell ID
    pub fn new(id: String) -> Self {
        ShellId(id)
    }

    /// Get string representation
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Shell entity representing a collection of connected faces
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shell {
    /// Faces that comprise this shell
    pub faces: Vec<FaceId>,
    /// Type of shell (closed, open, etc.)
    pub shell_type: ShellType,
    /// Whether shell is oriented consistently
    pub is_oriented: bool,
    /// Shell volume (for closed shells)
    pub volume: f64,
    /// Shell surface area
    pub surface_area: f64,
    /// Manufacturing tolerance for this shell
    pub tolerance: f64,
    /// Manufacturing constraints
    pub manufacturing_constraints: Vec<ShellConstraint>,
    /// Whether shell represents a void (internal cavity)
    pub is_void: bool,
}

impl Shell {
    /// Create a new shell from faces
    pub fn new(faces: Vec<FaceId>, shell_type: ShellType) -> Self {
        Shell {
            faces,
            shell_type,
            is_oriented: false, // Will be computed during validation
            volume: 0.0,
            surface_area: 0.0,
            tolerance: 1e-6,
            manufacturing_constraints: Vec::new(),
            is_void: false,
        }
    }

    /// Create a closed shell (for solids)
    pub fn closed(faces: Vec<FaceId>) -> Self {
        Shell::new(faces, ShellType::Closed)
    }

    /// Create an open shell (for surface features)
    pub fn open(faces: Vec<FaceId>) -> Self {
        Shell::new(faces, ShellType::Open)
    }

    /// Validate shell topology
    pub fn validate(&self, face_collection: &HashMap<FaceId, Face>) -> KernelResult<()> {
        // Check that all faces exist
        for face_id in &self.faces {
            if !face_collection.contains_key(face_id) {
                return Err(KernelError::internal(format!(
                    "Face {} not found in collection",
                    face_id.as_str()
                )));
            }
        }

        // For closed shells, verify Euler characteristic
        if self.shell_type == ShellType::Closed {
            self.validate_closed_shell(face_collection)?;
        }

        // Check face adjacency
        self.validate_face_adjacency(face_collection)?;

        Ok(())
    }

    /// Check if shell is manifold (each edge shared by exactly 2 faces)
    pub fn is_manifold(&self, face_collection: &HashMap<FaceId, Face>) -> bool {
        let mut edge_face_count: HashMap<String, usize> = HashMap::new();

        // Count how many faces each edge belongs to
        for face_id in &self.faces {
            if let Some(face) = face_collection.get(face_id) {
                for edge_id in &face.boundary_edges {
                    *edge_face_count
                        .entry(edge_id.as_str().to_string())
                        .or_insert(0) += 1;
                }
            }
        }

        // For manifold shell, each edge should belong to exactly 2 faces (closed)
        // or 1 face (boundary edge for open shell)
        for &count in edge_face_count.values() {
            match self.shell_type {
                ShellType::Closed => {
                    if count != 2 {
                        return false; // Non-manifold
                    }
                }
                ShellType::Open => {
                    if count > 2 {
                        return false; // Non-manifold
                    }
                }
                ShellType::Wire => {
                    // Wire shells have different topology rules
                    if count > 2 {
                        return false;
                    }
                }
            }
        }

        true
    }

    /// Compute shell volume (for closed shells)
    pub fn compute_volume(&mut self, face_collection: &HashMap<FaceId, Face>) -> KernelResult<f64> {
        if self.shell_type != ShellType::Closed {
            return Err(KernelError::internal(
                "Volume can only be computed for closed shells".to_string(),
            ));
        }

        // Use divergence theorem to compute volume
        // V = (1/3) * ∫∫ (x*nx + y*ny + z*nz) dS
        let mut volume = 0.0;

        for face_id in &self.faces {
            if let Some(face) = face_collection.get(face_id) {
                // For each face, compute contribution to volume
                // This would require triangulation and proper surface integration
                // Simplified calculation for now
                volume += face.area * 1.0; // Placeholder
            }
        }

        self.volume = volume / 3.0; // Approximate volume
        Ok(self.volume)
    }

    /// Compute total surface area
    pub fn compute_surface_area(
        &mut self,
        face_collection: &HashMap<FaceId, Face>,
    ) -> KernelResult<f64> {
        let mut total_area = 0.0;

        for face_id in &self.faces {
            if let Some(face) = face_collection.get(face_id) {
                total_area += face.area;
            }
        }

        self.surface_area = total_area;
        Ok(self.surface_area)
    }

    /// Check if shell is manufacturable
    pub fn is_manufacturable(&self, face_collection: &HashMap<FaceId, Face>) -> bool {
        // Check shell-level constraints
        for constraint in &self.manufacturing_constraints {
            if !constraint.is_satisfied(self, face_collection) {
                return false;
            }
        }

        // Check individual face manufacturability
        for face_id in &self.faces {
            if let Some(face) = face_collection.get(face_id) {
                if !face.is_manufacturable() {
                    return false;
                }
            }
        }

        // Check for manufacturing-unfriendly topology
        match self.shell_type {
            ShellType::Closed => {
                // Closed shells should have reasonable volume-to-surface ratio
                if self.surface_area > 0.0 {
                    let ratio = self.volume / self.surface_area;
                    if ratio < 0.001 {
                        // Very thin shells may be difficult to manufacture
                        return false;
                    }
                }
            }
            ShellType::Open => {
                // Open shells may have accessibility issues
                // Would need detailed tool path analysis
            }
            ShellType::Wire => {
                // Wire shells are generally not manufacturable as solids
                return false;
            }
        }

        true
    }

    /// Get shell genus (number of handles/holes)
    pub fn genus(&self, face_collection: &HashMap<FaceId, Face>) -> usize {
        if self.shell_type != ShellType::Closed {
            return 0; // Only closed shells have meaningful genus
        }

        // Use Euler characteristic: χ = V - E + F = 2 - 2g
        // where g is the genus
        let f = self.faces.len();
        let mut edges = HashSet::new();
        let mut vertices: HashSet<String> = HashSet::new();

        // Count unique edges and vertices
        for face_id in &self.faces {
            if let Some(face) = face_collection.get(face_id) {
                for edge_id in &face.boundary_edges {
                    edges.insert(edge_id.as_str());
                }
                // Would need to extract vertices from edges
                // Simplified for now
            }
        }

        let e = edges.len();
        let v = vertices.len().max(1); // Avoid division by zero

        // Euler characteristic for closed surface: χ = V - E + F = 2 - 2g
        let euler_char = v as i32 - e as i32 + f as i32;
        let genus = (2 - euler_char) / 2;
        genus.max(0) as usize
    }

    /// Check orientation consistency
    pub fn check_orientation(
        &mut self,
        face_collection: &HashMap<FaceId, Face>,
    ) -> KernelResult<bool> {
        // For closed shells, all face normals should point outward
        // This would require adjacency analysis and normal vector computation
        // Simplified implementation
        self.is_oriented = true; // Assume oriented for now
        Ok(self.is_oriented)
    }

    /// Reverse shell orientation (flip all face normals)
    pub fn reverse_orientation(
        &mut self,
        face_collection: &mut HashMap<FaceId, Face>,
    ) -> KernelResult<()> {
        for face_id in &self.faces {
            if let Some(face) = face_collection.get_mut(face_id) {
                face.reverse_orientation();
            }
        }
        Ok(())
    }

    /// Add manufacturing constraint
    pub fn add_constraint(&mut self, constraint: ShellConstraint) {
        self.manufacturing_constraints.push(constraint);
    }

    /// Get face count
    pub fn face_count(&self) -> usize {
        self.faces.len()
    }

    // Private validation methods

    fn validate_closed_shell(&self, face_collection: &HashMap<FaceId, Face>) -> KernelResult<()> {
        // For closed shells, verify that the surface is actually closed
        let mut edge_count: HashMap<String, usize> = HashMap::new();

        for face_id in &self.faces {
            if let Some(face) = face_collection.get(face_id) {
                for edge_id in &face.boundary_edges {
                    *edge_count.entry(edge_id.as_str().to_string()).or_insert(0) += 1;
                }
            }
        }

        // In a closed shell, every edge should be shared by exactly 2 faces
        for (edge_id, count) in &edge_count {
            if *count != 2 {
                return Err(KernelError::internal(format!(
                    "Edge {} is shared by {} faces (should be 2 for closed shell)",
                    edge_id, count
                )));
            }
        }

        Ok(())
    }

    fn validate_face_adjacency(&self, face_collection: &HashMap<FaceId, Face>) -> KernelResult<()> {
        // Check that adjacent faces share edges properly
        // This would involve detailed adjacency graph analysis
        // Simplified validation for now
        if self.faces.is_empty() {
            return Err(KernelError::internal("Shell cannot be empty".to_string()));
        }

        Ok(())
    }
}

/// Types of shells for different geometric entities
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ShellType {
    /// Closed shell (forms boundary of solid)
    Closed,
    /// Open shell (surface with boundary)
    Open,
    /// Wire shell (collection of edges, not manufacturable as solid)
    Wire,
}

/// Manufacturing constraints for shells
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShellConstraint {
    /// Type of constraint
    pub constraint_type: ShellConstraintType,
    /// Constraint parameters
    pub parameters: HashMap<String, f64>,
    /// Manufacturing process this applies to
    pub process: crate::geometry::ir::ManufacturingProcess,
}

impl ShellConstraint {
    /// Create minimum wall thickness constraint
    pub fn min_wall_thickness(
        thickness: f64,
        process: crate::geometry::ir::ManufacturingProcess,
    ) -> Self {
        let mut parameters = HashMap::new();
        parameters.insert("min_thickness".to_string(), thickness);

        ShellConstraint {
            constraint_type: ShellConstraintType::MinWallThickness,
            parameters,
            process,
        }
    }

    /// Create maximum aspect ratio constraint
    pub fn max_aspect_ratio(
        ratio: f64,
        process: crate::geometry::ir::ManufacturingProcess,
    ) -> Self {
        let mut parameters = HashMap::new();
        parameters.insert("max_ratio".to_string(), ratio);

        ShellConstraint {
            constraint_type: ShellConstraintType::MaxAspectRatio,
            parameters,
            process,
        }
    }

    /// Create tool accessibility constraint
    pub fn tool_access(process: crate::geometry::ir::ManufacturingProcess) -> Self {
        ShellConstraint {
            constraint_type: ShellConstraintType::ToolAccessibility,
            parameters: HashMap::new(),
            process,
        }
    }

    /// Check if constraint is satisfied
    pub fn is_satisfied(&self, shell: &Shell, face_collection: &HashMap<FaceId, Face>) -> bool {
        match self.constraint_type {
            ShellConstraintType::MinWallThickness => {
                if let Some(min_thickness) = self.parameters.get("min_thickness") {
                    // Would need to compute actual wall thickness
                    // Simplified: assume ratio of volume to surface area indicates thickness
                    if shell.surface_area > 0.0 {
                        let avg_thickness = shell.volume / shell.surface_area;
                        avg_thickness >= *min_thickness
                    } else {
                        false
                    }
                } else {
                    true
                }
            }
            ShellConstraintType::MaxAspectRatio => {
                if let Some(max_ratio) = self.parameters.get("max_ratio") {
                    // Compute bounding box aspect ratio
                    // Simplified check
                    true // Would need proper bounding box computation
                } else {
                    true
                }
            }
            ShellConstraintType::ToolAccessibility => {
                // Check if all faces are accessible by manufacturing tools
                match self.process {
                    crate::geometry::ir::ManufacturingProcess::CNCMilling => {
                        // All faces should be accessible from at least one direction
                        for face_id in &shell.faces {
                            if let Some(face) = face_collection.get(face_id) {
                                // Check if face can be reached by cutting tool
                                // Simplified: assume planar and cylindrical faces are accessible
                                match face.face_type {
                                    crate::geometry::topology::FaceType::Planar => continue,
                                    crate::geometry::topology::FaceType::Cylindrical => continue,
                                    _ => return false, // Other face types may be inaccessible
                                }
                            }
                        }
                        true
                    }
                    crate::geometry::ir::ManufacturingProcess::Printing3D => {
                        // 3D printing has different accessibility rules (overhangs, supports)
                        true // Simplified - would need overhang analysis
                    }
                    _ => true, // Other processes have their own rules
                }
            }
        }
    }
}

/// Types of shell constraints for manufacturing
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ShellConstraintType {
    /// Minimum wall thickness constraint
    MinWallThickness,
    /// Maximum aspect ratio constraint
    MaxAspectRatio,
    /// Tool accessibility requirement
    ToolAccessibility,
}

/// Shell collection for managing multiple shells
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShellCollection {
    /// All shells indexed by ID
    shells: HashMap<ShellId, Shell>,
    /// Next available shell index
    next_shell_index: usize,
}

impl ShellCollection {
    /// Create new shell collection
    pub fn new() -> Self {
        ShellCollection {
            shells: HashMap::new(),
            next_shell_index: 0,
        }
    }

    /// Add shell to collection
    pub fn add_shell(&mut self, shell: Shell) -> KernelResult<ShellId> {
        let shell_id = ShellId::new(format!("s_{}", self.next_shell_index));
        self.next_shell_index += 1;

        // Validate shell has faces
        if shell.faces.is_empty() {
            return Err(KernelError::internal(
                "Shell must contain at least one face".to_string(),
            ));
        }

        self.shells.insert(shell_id.clone(), shell);
        Ok(shell_id)
    }

    /// Get shell by ID
    pub fn get_shell(&self, shell_id: &ShellId) -> Option<&Shell> {
        self.shells.get(shell_id)
    }

    /// Get mutable shell by ID
    pub fn get_shell_mut(&mut self, shell_id: &ShellId) -> Option<&mut Shell> {
        self.shells.get_mut(shell_id)
    }

    /// Find shells containing a specific face
    pub fn shells_with_face(&self, face_id: &FaceId) -> Vec<&ShellId> {
        self.shells
            .iter()
            .filter_map(|(id, shell)| {
                if shell.faces.contains(face_id) {
                    Some(id)
                } else {
                    None
                }
            })
            .collect()
    }

    /// Validate all shells in collection
    pub fn validate(&self, face_collection: &HashMap<FaceId, Face>) -> KernelResult<()> {
        for shell in self.shells.values() {
            shell.validate(face_collection)?;
        }
        Ok(())
    }

    /// Get statistics about the shell collection
    pub fn stats(&self, face_collection: &HashMap<FaceId, Face>) -> ShellCollectionStats {
        let total_shells = self.shells.len();
        let mut shell_type_counts = HashMap::new();
        let mut total_volume = 0.0;
        let mut total_surface_area = 0.0;
        let mut manifold_count = 0;
        let mut manufacturability_count = 0;

        for shell in self.shells.values() {
            *shell_type_counts
                .entry(shell.shell_type.clone())
                .or_insert(0) += 1;
            total_volume += shell.volume;
            total_surface_area += shell.surface_area;

            if shell.is_manifold(face_collection) {
                manifold_count += 1;
            }

            if shell.is_manufacturable(face_collection) {
                manufacturability_count += 1;
            }
        }

        let manifold_ratio = if total_shells > 0 {
            manifold_count as f64 / total_shells as f64
        } else {
            0.0
        };

        let manufacturability_ratio = if total_shells > 0 {
            manufacturability_count as f64 / total_shells as f64
        } else {
            0.0
        };

        ShellCollectionStats {
            total_shells,
            shell_type_counts,
            total_volume,
            total_surface_area,
            manifold_ratio,
            manufacturability_ratio,
        }
    }
}

impl Default for ShellCollection {
    fn default() -> Self {
        Self::new()
    }
}

/// Statistics for shell collections
#[derive(Debug, Clone)]
pub struct ShellCollectionStats {
    pub total_shells: usize,
    pub shell_type_counts: HashMap<ShellType, usize>,
    pub total_volume: f64,
    pub total_surface_area: f64,
    pub manifold_ratio: f64,
    pub manufacturability_ratio: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::topology::{EdgeId, FaceType};

    fn create_test_face(id: &str) -> (FaceId, Face) {
        let face_id = FaceId::new(id.to_string());
        let edges = vec![
            EdgeId::new("e1".to_string()),
            EdgeId::new("e2".to_string()),
            EdgeId::new("e3".to_string()),
        ];
        let face = Face::new(edges, FaceType::Planar);
        (face_id, face)
    }

    #[test]
    fn test_shell_creation() {
        let (face_id, _) = create_test_face("f1");
        let shell = Shell::new(vec![face_id], ShellType::Closed);

        assert_eq!(shell.shell_type, ShellType::Closed);
        assert_eq!(shell.face_count(), 1);
        assert!(!shell.is_void);
    }

    #[test]
    fn test_closed_shell() {
        let faces = vec![FaceId::new("f1".to_string()), FaceId::new("f2".to_string())];
        let shell = Shell::closed(faces);
        assert_eq!(shell.shell_type, ShellType::Closed);
    }

    #[test]
    fn test_open_shell() {
        let faces = vec![FaceId::new("f1".to_string())];
        let shell = Shell::open(faces);
        assert_eq!(shell.shell_type, ShellType::Open);
    }

    #[test]
    fn test_shell_constraint() {
        use crate::geometry::ir::ManufacturingProcess;

        let constraint = ShellConstraint::min_wall_thickness(1.0, ManufacturingProcess::CNCMilling);
        assert_eq!(
            constraint.constraint_type,
            ShellConstraintType::MinWallThickness
        );
    }

    #[test]
    fn test_shell_collection() {
        let mut collection = ShellCollection::new();
        let faces = vec![FaceId::new("f1".to_string())];
        let shell = Shell::new(faces, ShellType::Open);

        let shell_id = collection.add_shell(shell).unwrap();
        assert!(collection.get_shell(&shell_id).is_some());

        // Test stats with empty face collection
        let face_collection = HashMap::new();
        let stats = collection.stats(&face_collection);
        assert_eq!(stats.total_shells, 1);
    }

    #[test]
    fn test_shell_validation() {
        let (face_id, face) = create_test_face("f1");
        let mut face_collection = HashMap::new();
        face_collection.insert(face_id.clone(), face);

        let shell = Shell::new(vec![face_id], ShellType::Open);
        assert!(shell.validate(&face_collection).is_ok());
    }

    #[test]
    fn test_shell_manufacturability() {
        let (face_id, face) = create_test_face("f1");
        let mut face_collection = HashMap::new();
        face_collection.insert(face_id.clone(), face);

        let shell = Shell::new(vec![face_id], ShellType::Closed);

        // Basic manufacturability check
        assert!(shell.is_manufacturable(&face_collection));

        // Wire shells should not be manufacturable
        let wire_shell = Shell::new(vec![], ShellType::Wire);
        assert!(!wire_shell.is_manufacturable(&face_collection));
    }

    #[test]
    fn test_manifold_check() {
        let (face_id, face) = create_test_face("f1");
        let mut face_collection = HashMap::new();
        face_collection.insert(face_id.clone(), face);

        let open_shell = Shell::new(vec![face_id], ShellType::Open);
        // Single face open shell should be manifold
        assert!(open_shell.is_manifold(&face_collection));
    }

    #[test]
    fn test_shell_volume_computation() {
        let (face_id, mut face) = create_test_face("f1");
        face.area = 10.0; // Set face area for calculation
        let mut face_collection = HashMap::new();
        face_collection.insert(face_id.clone(), face);

        let mut shell = Shell::closed(vec![face_id]);
        let result = shell.compute_volume(&face_collection);
        assert!(result.is_ok());
        assert!(shell.volume > 0.0);
    }

    #[test]
    fn test_surface_area_computation() {
        let (face_id, mut face) = create_test_face("f1");
        face.area = 5.0;
        let mut face_collection = HashMap::new();
        face_collection.insert(face_id.clone(), face);

        let mut shell = Shell::new(vec![face_id], ShellType::Open);
        let result = shell.compute_surface_area(&face_collection);
        assert!(result.is_ok());
        assert_eq!(shell.surface_area, 5.0);
    }
}
