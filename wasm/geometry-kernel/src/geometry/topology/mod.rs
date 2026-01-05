//! Topology module for manufacturing-aware geometric representation.
//!
//! This module provides topological structures that maintain adjacency
//! relationships and manufacturing constraints. Topology is mandatory
//! in the enhanced geometry kernel - geometry without topology is invalid.

pub mod edge;
pub mod face;
pub mod shell;
pub mod solid;

// Re-export core topology types
pub use edge::{Edge, EdgeId, EdgeType, HalfEdge};
pub use face::{Face, FaceId, FaceOrientation, FaceType};
pub use shell::{Shell, ShellId, ShellType};
pub use solid::{Solid, SolidId, TopologicalSolid};

use crate::errors::{KernelError, KernelResult};
use crate::geometry::ir::node::NodeId;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Topological entity identifier that maintains relationships
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TopologyId(String);

impl TopologyId {
    /// Create a new topology ID
    pub fn new(entity_type: &str, index: usize) -> Self {
        TopologyId(format!("{}_{}", entity_type, index))
    }

    /// Create from string
    pub fn from_string(id: String) -> Self {
        TopologyId(id)
    }

    /// Get string representation
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Topological complex that maintains all adjacency relationships
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopologicalComplex {
    /// All vertices in the complex
    pub vertices: HashMap<TopologyId, Vertex>,
    /// All edges in the complex
    pub edges: HashMap<EdgeId, Edge>,
    /// All faces in the complex
    pub faces: HashMap<FaceId, Face>,
    /// All shells in the complex
    pub shells: HashMap<ShellId, Shell>,
    /// All solids in the complex
    pub solids: HashMap<SolidId, Solid>,
    /// Adjacency relationships
    pub adjacency: AdjacencyGraph,
}

impl TopologicalComplex {
    /// Create a new empty topological complex
    pub fn new() -> Self {
        TopologicalComplex {
            vertices: HashMap::new(),
            edges: HashMap::new(),
            faces: HashMap::new(),
            shells: HashMap::new(),
            solids: HashMap::new(),
            adjacency: AdjacencyGraph::new(),
        }
    }

    /// Add a vertex to the complex
    pub fn add_vertex(&mut self, vertex: Vertex) -> KernelResult<TopologyId> {
        let id = TopologyId::new("vertex", self.vertices.len());
        self.vertices.insert(id.clone(), vertex);
        Ok(id)
    }

    /// Add an edge to the complex
    pub fn add_edge(&mut self, edge: Edge) -> KernelResult<EdgeId> {
        let id = EdgeId::new(format!("edge_{}", self.edges.len()));

        // Validate edge vertices exist
        if !self.vertices.contains_key(&edge.start_vertex)
            || !self.vertices.contains_key(&edge.end_vertex)
        {
            return Err(KernelError::internal(
                "Edge vertices must exist in complex".to_string(),
            ));
        }

        // Update adjacency
        self.adjacency
            .add_edge_vertex_relation(id.clone(), edge.start_vertex.clone())?;
        self.adjacency
            .add_edge_vertex_relation(id.clone(), edge.end_vertex.clone())?;

        self.edges.insert(id.clone(), edge);
        Ok(id)
    }

    /// Add a face to the complex
    pub fn add_face(&mut self, face: Face) -> KernelResult<FaceId> {
        let id = FaceId::new(format!("face_{}", self.faces.len()));

        // Validate face edges exist
        for edge_id in &face.boundary_edges {
            if !self.edges.contains_key(edge_id) {
                return Err(KernelError::internal(
                    "Face edges must exist in complex".to_string(),
                ));
            }
            // Update adjacency
            self.adjacency
                .add_face_edge_relation(id.clone(), edge_id.clone())?;
        }

        self.faces.insert(id.clone(), face);
        Ok(id)
    }

    /// Validate topological consistency
    pub fn validate(&self) -> KernelResult<()> {
        // Euler characteristic validation for each solid
        for solid in self.solids.values() {
            self.validate_solid_euler_characteristic(solid)?;
        }

        // Adjacency consistency
        self.adjacency.validate()?;

        // Manufacturing constraints
        self.validate_manufacturing_constraints()?;

        Ok(())
    }

    /// Get all vertices adjacent to an edge
    pub fn get_edge_vertices(&self, edge_id: &EdgeId) -> Vec<&TopologyId> {
        if let Some(edge) = self.edges.get(edge_id) {
            vec![&edge.start_vertex, &edge.end_vertex]
        } else {
            vec![]
        }
    }

    /// Get all edges bounding a face
    pub fn get_face_edges(&self, face_id: &FaceId) -> Vec<&EdgeId> {
        if let Some(face) = self.faces.get(face_id) {
            face.boundary_edges.iter().collect()
        } else {
            vec![]
        }
    }

    /// Get all faces in a shell
    pub fn get_shell_faces(&self, shell_id: &ShellId) -> Vec<&FaceId> {
        if let Some(shell) = self.shells.get(shell_id) {
            shell.faces.iter().collect()
        } else {
            vec![]
        }
    }

    /// Check if topology is manifold
    pub fn is_manifold(&self) -> bool {
        // Each edge should be shared by at most 2 faces
        for edge_id in self.edges.keys() {
            let adjacent_faces = self.adjacency.get_faces_for_edge(edge_id);
            if adjacent_faces.len() > 2 {
                return false;
            }
        }
        true
    }

    /// Get genus of the topology (number of handles/holes)
    pub fn genus(&self) -> usize {
        // Simplified genus calculation
        // Full implementation would use proper topological invariants
        0
    }

    // Private validation methods

    fn validate_solid_euler_characteristic(&self, solid: &Solid) -> KernelResult<()> {
        let mut total_vertices = 0;
        let mut total_edges = 0;
        let mut total_faces = 0;

        // Count topological elements in all shells of the solid
        for shell_id in std::iter::once(&solid.outer_shell).chain(solid.inner_shells.iter()) {
            if let Some(shell) = self.shells.get(shell_id) {
                total_faces += shell.faces.len();

                let mut shell_edges = HashSet::new();
                let mut shell_vertices = HashSet::new();

                for face_id in &shell.faces {
                    if let Some(face) = self.faces.get(face_id) {
                        for edge_id in &face.boundary_edges {
                            shell_edges.insert(edge_id);

                            if let Some(edge) = self.edges.get(edge_id) {
                                shell_vertices.insert(&edge.start_vertex);
                                shell_vertices.insert(&edge.end_vertex);
                            }
                        }
                    }
                }

                total_edges += shell_edges.len();
                total_vertices += shell_vertices.len();
            }
        }

        // Euler characteristic: V - E + F = 2 - 2g (for a solid with g genus)
        let euler_char = total_vertices as i32 - total_edges as i32 + total_faces as i32;

        // For a simple solid (sphere-like), Euler characteristic should be 2
        // More complex validation would account for genus
        if euler_char < 2 {
            return Err(KernelError::internal(
                "Solid violates Euler characteristic - topology may be invalid".to_string(),
            ));
        }

        Ok(())
    }

    fn validate_manufacturing_constraints(&self) -> KernelResult<()> {
        // Check for manufacturing-unfriendly topology
        for face in self.faces.values() {
            // Very small faces may be unmachininable
            if face.area < 0.1 {
                // This would be a warning rather than error in a full implementation
            }
        }

        // Check for sharp internal corners (difficult to machine)
        for edge in self.edges.values() {
            if edge.edge_type == EdgeType::Sharp {
                // Could validate minimum radius for manufacturing
            }
        }

        Ok(())
    }
}

impl Default for TopologicalComplex {
    fn default() -> Self {
        Self::new()
    }
}

/// Vertex in topological representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vertex {
    /// Geometric position
    pub position: [f64; 3],
    /// Vertex tolerance for manufacturing
    pub tolerance: f64,
}

impl Vertex {
    /// Create a new vertex
    pub fn new(position: [f64; 3]) -> Self {
        Vertex {
            position,
            tolerance: 1e-6, // Default geometric tolerance
        }
    }

    /// Create vertex with specific tolerance
    pub fn with_tolerance(position: [f64; 3], tolerance: f64) -> Self {
        Vertex {
            position,
            tolerance,
        }
    }
}

/// Adjacency graph maintaining topological relationships
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdjacencyGraph {
    /// Edge to vertices mapping
    edge_vertices: HashMap<EdgeId, Vec<TopologyId>>,
    /// Face to edges mapping
    face_edges: HashMap<FaceId, Vec<EdgeId>>,
    /// Shell to faces mapping
    shell_faces: HashMap<ShellId, Vec<FaceId>>,
    /// Solid to shells mapping
    solid_shells: HashMap<SolidId, Vec<ShellId>>,
}

impl AdjacencyGraph {
    /// Create new adjacency graph
    pub fn new() -> Self {
        AdjacencyGraph {
            edge_vertices: HashMap::new(),
            face_edges: HashMap::new(),
            shell_faces: HashMap::new(),
            solid_shells: HashMap::new(),
        }
    }

    /// Add edge-vertex relationship
    pub fn add_edge_vertex_relation(
        &mut self,
        edge_id: EdgeId,
        vertex_id: TopologyId,
    ) -> KernelResult<()> {
        self.edge_vertices
            .entry(edge_id)
            .or_insert_with(Vec::new)
            .push(vertex_id);
        Ok(())
    }

    /// Add face-edge relationship
    pub fn add_face_edge_relation(&mut self, face_id: FaceId, edge_id: EdgeId) -> KernelResult<()> {
        self.face_edges
            .entry(face_id)
            .or_insert_with(Vec::new)
            .push(edge_id);
        Ok(())
    }

    /// Get faces that share an edge
    pub fn get_faces_for_edge(&self, edge_id: &EdgeId) -> Vec<&FaceId> {
        let mut faces = Vec::new();
        for (face_id, edges) in &self.face_edges {
            if edges.contains(edge_id) {
                faces.push(face_id);
            }
        }
        faces
    }

    /// Validate adjacency consistency
    pub fn validate(&self) -> KernelResult<()> {
        // Check that all referenced entities exist in their respective collections
        // This would be expanded in a full implementation
        Ok(())
    }
}

impl Default for AdjacencyGraph {
    fn default() -> Self {
        Self::new()
    }
}

/// Create a simple box topology for testing
pub fn create_box_topology(
    width: f64,
    height: f64,
    depth: f64,
) -> KernelResult<TopologicalComplex> {
    let mut complex = TopologicalComplex::new();

    // Create 8 vertices for a box
    let vertices = vec![
        [-width / 2.0, -height / 2.0, -depth / 2.0], // 0
        [width / 2.0, -height / 2.0, -depth / 2.0],  // 1
        [width / 2.0, height / 2.0, -depth / 2.0],   // 2
        [-width / 2.0, height / 2.0, -depth / 2.0],  // 3
        [-width / 2.0, -height / 2.0, depth / 2.0],  // 4
        [width / 2.0, -height / 2.0, depth / 2.0],   // 5
        [width / 2.0, height / 2.0, depth / 2.0],    // 6
        [-width / 2.0, height / 2.0, depth / 2.0],   // 7
    ];

    let mut vertex_ids = Vec::new();
    for pos in vertices {
        let vertex_id = complex.add_vertex(Vertex::new(pos))?;
        vertex_ids.push(vertex_id);
    }

    // Create 12 edges for a box
    let edge_pairs = vec![
        (0, 1),
        (1, 2),
        (2, 3),
        (3, 0), // Bottom face
        (4, 5),
        (5, 6),
        (6, 7),
        (7, 4), // Top face
        (0, 4),
        (1, 5),
        (2, 6),
        (3, 7), // Vertical edges
    ];

    let mut edge_ids = Vec::new();
    for (start_idx, end_idx) in edge_pairs {
        let edge = Edge::new(
            vertex_ids[start_idx].clone(),
            vertex_ids[end_idx].clone(),
            EdgeType::Linear,
        );
        let edge_id = complex.add_edge(edge)?;
        edge_ids.push(edge_id);
    }

    // Create 6 faces for a box
    let face_edge_indices = vec![
        vec![0, 1, 2, 3],   // Bottom face
        vec![4, 5, 6, 7],   // Top face
        vec![0, 9, 4, 8],   // Front face
        vec![2, 11, 6, 10], // Back face
        vec![3, 11, 7, 8],  // Left face
        vec![1, 10, 5, 9],  // Right face
    ];

    for edge_indices in face_edge_indices {
        let face_edges: Vec<EdgeId> = edge_indices
            .into_iter()
            .map(|i| edge_ids[i].clone())
            .collect();

        let face = Face::new(face_edges, FaceType::Planar);
        complex.add_face(face)?;
    }

    Ok(complex)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_topology_id_creation() {
        let id = TopologyId::new("vertex", 123);
        assert_eq!(id.as_str(), "vertex_123");
    }

    #[test]
    fn test_topological_complex_creation() {
        let complex = TopologicalComplex::new();
        assert_eq!(complex.vertices.len(), 0);
        assert_eq!(complex.edges.len(), 0);
        assert_eq!(complex.faces.len(), 0);
    }

    #[test]
    fn test_vertex_addition() {
        let mut complex = TopologicalComplex::new();
        let vertex = Vertex::new([1.0, 2.0, 3.0]);

        let vertex_id = complex.add_vertex(vertex).unwrap();
        assert_eq!(complex.vertices.len(), 1);

        let stored_vertex = complex.vertices.get(&vertex_id).unwrap();
        assert_eq!(stored_vertex.position, [1.0, 2.0, 3.0]);
    }

    #[test]
    fn test_box_topology_creation() {
        let result = create_box_topology(2.0, 3.0, 4.0);
        assert!(result.is_ok());

        let complex = result.unwrap();
        assert_eq!(complex.vertices.len(), 8); // 8 vertices
        assert_eq!(complex.edges.len(), 12); // 12 edges
        assert_eq!(complex.faces.len(), 6); // 6 faces
    }

    #[test]
    fn test_manifold_check() {
        let complex = create_box_topology(1.0, 1.0, 1.0).unwrap();
        assert!(complex.is_manifold());
    }

    #[test]
    fn test_adjacency_graph() {
        let mut adj = AdjacencyGraph::new();
        let edge_id = EdgeId::new("test_edge".to_string());
        let vertex_id = TopologyId::new("vertex", 0);

        adj.add_edge_vertex_relation(edge_id.clone(), vertex_id)
            .unwrap();

        let vertices = adj.edge_vertices.get(&edge_id).unwrap();
        assert_eq!(vertices.len(), 1);
    }
}
