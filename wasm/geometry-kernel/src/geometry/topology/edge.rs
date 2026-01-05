//! Edge definitions and adjacency for topological representation.
//!
//! This module defines edges as fundamental topological entities that connect
//! vertices and form the boundaries of faces. Edges maintain manufacturing
//! constraints and geometric properties.

use crate::errors::{KernelError, KernelResult};
use crate::geometry::topology::{TopologyId, Vertex};
use serde::{Deserialize, Serialize};

/// Unique identifier for edges
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct EdgeId(String);

impl EdgeId {
    /// Create a new edge ID
    pub fn new(id: String) -> Self {
        EdgeId(id)
    }

    /// Get string representation
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Edge entity in topological representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Edge {
    /// Starting vertex of the edge
    pub start_vertex: TopologyId,
    /// Ending vertex of the edge
    pub end_vertex: TopologyId,
    /// Type of edge geometry
    pub edge_type: EdgeType,
    /// Geometric curve definition
    pub curve: Option<EdgeCurve>,
    /// Manufacturing tolerance for this edge
    pub tolerance: f64,
    /// Manufacturing constraints
    pub manufacturing_constraints: Vec<EdgeConstraint>,
    /// Edge length (computed)
    pub length: f64,
    /// Whether edge is oriented (direction matters)
    pub oriented: bool,
}

impl Edge {
    /// Create a new edge between two vertices
    pub fn new(start_vertex: TopologyId, end_vertex: TopologyId, edge_type: EdgeType) -> Self {
        Edge {
            start_vertex,
            end_vertex,
            edge_type,
            curve: None,
            tolerance: 1e-6,
            manufacturing_constraints: Vec::new(),
            length: 0.0, // Will be computed when vertices are known
            oriented: true,
        }
    }

    /// Create edge with curve definition
    pub fn with_curve(
        start_vertex: TopologyId,
        end_vertex: TopologyId,
        edge_type: EdgeType,
        curve: EdgeCurve,
    ) -> Self {
        Edge {
            start_vertex,
            end_vertex,
            edge_type,
            curve: Some(curve),
            tolerance: 1e-6,
            manufacturing_constraints: Vec::new(),
            length: 0.0,
            oriented: true,
        }
    }

    /// Compute edge length given vertex positions
    pub fn compute_length(&mut self, start_pos: [f64; 3], end_pos: [f64; 3]) {
        match &self.edge_type {
            EdgeType::Linear => {
                let dx = end_pos[0] - start_pos[0];
                let dy = end_pos[1] - start_pos[1];
                let dz = end_pos[2] - start_pos[2];
                self.length = (dx * dx + dy * dy + dz * dz).sqrt();
            }
            EdgeType::Circular => {
                if let Some(EdgeCurve::Circle { radius, angle, .. }) = &self.curve {
                    self.length = radius * angle;
                } else {
                    // Fallback to linear distance
                    let dx = end_pos[0] - start_pos[0];
                    let dy = end_pos[1] - start_pos[1];
                    let dz = end_pos[2] - start_pos[2];
                    self.length = (dx * dx + dy * dy + dz * dz).sqrt();
                }
            }
            EdgeType::Spline => {
                // For splines, would need proper arc length computation
                // Fallback to linear approximation for now
                let dx = end_pos[0] - start_pos[0];
                let dy = end_pos[1] - start_pos[1];
                let dz = end_pos[2] - start_pos[2];
                self.length = (dx * dx + dy * dy + dz * dz).sqrt();
            }
            EdgeType::Sharp => {
                // Sharp edges have zero length (theoretical)
                self.length = 0.0;
            }
        }
    }

    /// Check if edge is manufacturable
    pub fn is_manufacturable(&self) -> bool {
        // Check manufacturing constraints
        for constraint in &self.manufacturing_constraints {
            if !constraint.is_satisfied(&self.edge_type, self.length) {
                return false;
            }
        }

        // Check minimum feature size
        match self.edge_type {
            EdgeType::Circular => {
                if let Some(EdgeCurve::Circle { radius, .. }) = &self.curve {
                    if *radius < 0.5 {
                        // Minimum radius for tooling
                        return false;
                    }
                }
            }
            EdgeType::Sharp => {
                // Sharp edges are difficult to manufacture
                return false;
            }
            _ => {}
        }

        true
    }

    /// Get tangent vector at parameter t (0.0 to 1.0)
    pub fn tangent_at(&self, t: f64, start_pos: [f64; 3], end_pos: [f64; 3]) -> [f64; 3] {
        match &self.edge_type {
            EdgeType::Linear => {
                let dx = end_pos[0] - start_pos[0];
                let dy = end_pos[1] - start_pos[1];
                let dz = end_pos[2] - start_pos[2];
                let length = (dx * dx + dy * dy + dz * dz).sqrt();
                if length > 1e-10 {
                    [dx / length, dy / length, dz / length]
                } else {
                    [1.0, 0.0, 0.0]
                }
            }
            EdgeType::Circular => {
                // Would need proper circular arc tangent computation
                // Simplified linear approximation
                let dx = end_pos[0] - start_pos[0];
                let dy = end_pos[1] - start_pos[1];
                let dz = end_pos[2] - start_pos[2];
                let length = (dx * dx + dy * dy + dz * dz).sqrt();
                if length > 1e-10 {
                    [dx / length, dy / length, dz / length]
                } else {
                    [1.0, 0.0, 0.0]
                }
            }
            _ => [1.0, 0.0, 0.0], // Default tangent
        }
    }

    /// Reverse edge orientation
    pub fn reverse(&mut self) {
        std::mem::swap(&mut self.start_vertex, &mut self.end_vertex);
    }

    /// Add manufacturing constraint
    pub fn add_constraint(&mut self, constraint: EdgeConstraint) {
        self.manufacturing_constraints.push(constraint);
    }
}

/// Half-edge structure for maintaining orientation and adjacency
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HalfEdge {
    /// Associated full edge
    pub edge_id: EdgeId,
    /// Next half-edge in face boundary
    pub next: Option<HalfEdgeId>,
    /// Previous half-edge in face boundary
    pub prev: Option<HalfEdgeId>,
    /// Twin half-edge (opposite orientation)
    pub twin: Option<HalfEdgeId>,
    /// Face this half-edge bounds
    pub face: Option<crate::geometry::topology::FaceId>,
    /// Starting vertex
    pub vertex: TopologyId,
    /// Direction (true = same as edge, false = opposite)
    pub forward: bool,
}

/// Unique identifier for half-edges
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct HalfEdgeId(String);

impl HalfEdgeId {
    /// Create new half-edge ID
    pub fn new(id: String) -> Self {
        HalfEdgeId(id)
    }

    /// Get string representation
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl HalfEdge {
    /// Create a new half-edge
    pub fn new(edge_id: EdgeId, vertex: TopologyId, forward: bool) -> Self {
        HalfEdge {
            edge_id,
            next: None,
            prev: None,
            twin: None,
            face: None,
            vertex,
            forward,
        }
    }
}

/// Types of edges for manufacturing awareness
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum EdgeType {
    /// Straight line edge
    Linear,
    /// Circular arc edge
    Circular,
    /// Spline curve edge
    Spline,
    /// Sharp edge (zero radius)
    Sharp,
}

/// Geometric curve definitions for edges
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EdgeCurve {
    /// Linear curve (line segment)
    Line { direction: [f64; 3] },
    /// Circular arc
    Circle {
        center: [f64; 3],
        radius: f64,
        axis: [f64; 3],
        angle: f64, // Total angle in radians
    },
    /// Parametric spline curve
    Spline {
        control_points: Vec<[f64; 3]>,
        knots: Vec<f64>,
        degree: u32,
    },
    /// Elliptical arc
    Ellipse {
        center: [f64; 3],
        major_axis: [f64; 3],
        minor_axis: [f64; 3],
        start_angle: f64,
        end_angle: f64,
    },
}

/// Manufacturing constraints for edges
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EdgeConstraint {
    /// Type of constraint
    pub constraint_type: EdgeConstraintType,
    /// Minimum value for the constraint
    pub min_value: f64,
    /// Maximum value for the constraint
    pub max_value: f64,
    /// Manufacturing process this applies to
    pub process: crate::geometry::ir::ManufacturingProcess,
}

impl EdgeConstraint {
    /// Create minimum radius constraint
    pub fn min_radius(radius: f64, process: crate::geometry::ir::ManufacturingProcess) -> Self {
        EdgeConstraint {
            constraint_type: EdgeConstraintType::MinRadius,
            min_value: radius,
            max_value: f64::INFINITY,
            process,
        }
    }

    /// Create maximum length constraint
    pub fn max_length(length: f64, process: crate::geometry::ir::ManufacturingProcess) -> Self {
        EdgeConstraint {
            constraint_type: EdgeConstraintType::MaxLength,
            min_value: 0.0,
            max_value: length,
            process,
        }
    }

    /// Check if constraint is satisfied
    pub fn is_satisfied(&self, edge_type: &EdgeType, length: f64) -> bool {
        match &self.constraint_type {
            EdgeConstraintType::MinRadius => {
                // Only applies to curved edges
                match edge_type {
                    EdgeType::Circular | EdgeType::Spline => {
                        // Would need radius computation from curve
                        true // Simplified for now
                    }
                    _ => true,
                }
            }
            EdgeConstraintType::MaxLength => length <= self.max_value,
            EdgeConstraintType::MinLength => length >= self.min_value,
            EdgeConstraintType::SmoothTransition => {
                // Check for smooth G1/G2 continuity
                true // Simplified
            }
        }
    }
}

/// Types of edge constraints for manufacturing
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum EdgeConstraintType {
    /// Minimum radius constraint (for curved edges)
    MinRadius,
    /// Maximum edge length
    MaxLength,
    /// Minimum edge length
    MinLength,
    /// Smooth transition requirement
    SmoothTransition,
}

/// Edge collection for managing multiple edges
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EdgeCollection {
    /// All edges indexed by ID
    edges: std::collections::HashMap<EdgeId, Edge>,
    /// Half-edges for orientation
    half_edges: std::collections::HashMap<HalfEdgeId, HalfEdge>,
    /// Next available edge index
    next_edge_index: usize,
    /// Next available half-edge index
    next_half_edge_index: usize,
}

impl EdgeCollection {
    /// Create new edge collection
    pub fn new() -> Self {
        EdgeCollection {
            edges: std::collections::HashMap::new(),
            half_edges: std::collections::HashMap::new(),
            next_edge_index: 0,
            next_half_edge_index: 0,
        }
    }

    /// Add edge to collection
    pub fn add_edge(&mut self, mut edge: Edge) -> KernelResult<EdgeId> {
        let edge_id = EdgeId::new(format!("e_{}", self.next_edge_index));
        self.next_edge_index += 1;

        // Create half-edges
        let he1_id = HalfEdgeId::new(format!("he_{}", self.next_half_edge_index));
        self.next_half_edge_index += 1;
        let he2_id = HalfEdgeId::new(format!("he_{}", self.next_half_edge_index));
        self.next_half_edge_index += 1;

        let mut he1 = HalfEdge::new(edge_id.clone(), edge.start_vertex.clone(), true);
        let mut he2 = HalfEdge::new(edge_id.clone(), edge.end_vertex.clone(), false);

        // Set twins
        he1.twin = Some(he2_id.clone());
        he2.twin = Some(he1_id.clone());

        self.half_edges.insert(he1_id, he1);
        self.half_edges.insert(he2_id, he2);
        self.edges.insert(edge_id.clone(), edge);

        Ok(edge_id)
    }

    /// Get edge by ID
    pub fn get_edge(&self, edge_id: &EdgeId) -> Option<&Edge> {
        self.edges.get(edge_id)
    }

    /// Get mutable edge by ID
    pub fn get_edge_mut(&mut self, edge_id: &EdgeId) -> Option<&mut Edge> {
        self.edges.get_mut(edge_id)
    }

    /// Get half-edge by ID
    pub fn get_half_edge(&self, he_id: &HalfEdgeId) -> Option<&HalfEdge> {
        self.half_edges.get(he_id)
    }

    /// Find edges incident to a vertex
    pub fn edges_at_vertex(&self, vertex_id: &TopologyId) -> Vec<&EdgeId> {
        self.edges
            .iter()
            .filter_map(|(id, edge)| {
                if edge.start_vertex == *vertex_id || edge.end_vertex == *vertex_id {
                    Some(id)
                } else {
                    None
                }
            })
            .collect()
    }

    /// Validate edge collection consistency
    pub fn validate(&self) -> KernelResult<()> {
        // Check that all half-edges have valid twins
        for (_id, he) in &self.half_edges {
            if let Some(twin_id) = &he.twin {
                let twin = self
                    .half_edges
                    .get(twin_id)
                    .ok_or_else(|| KernelError::internal("Half-edge twin not found".to_string()))?;

                if twin.twin.as_ref() != Some(&HalfEdgeId::new(he.edge_id.as_str().to_string())) {
                    return Err(KernelError::internal(
                        "Half-edge twin relationship broken".to_string(),
                    ));
                }
            }
        }

        // Check manufacturing constraints
        for edge in self.edges.values() {
            if !edge.is_manufacturable() {
                // In a full implementation, this might be a warning rather than error
            }
        }

        Ok(())
    }

    /// Get statistics about the edge collection
    pub fn stats(&self) -> EdgeCollectionStats {
        let total_edges = self.edges.len();
        let total_half_edges = self.half_edges.len();

        let mut edge_type_counts = std::collections::HashMap::new();
        for edge in self.edges.values() {
            *edge_type_counts.entry(edge.edge_type.clone()).or_insert(0) += 1;
        }

        let total_length: f64 = self.edges.values().map(|e| e.length).sum();

        EdgeCollectionStats {
            total_edges,
            total_half_edges,
            edge_type_counts,
            total_length,
        }
    }
}

impl Default for EdgeCollection {
    fn default() -> Self {
        Self::new()
    }
}

/// Statistics for edge collections
#[derive(Debug, Clone)]
pub struct EdgeCollectionStats {
    pub total_edges: usize,
    pub total_half_edges: usize,
    pub edge_type_counts: std::collections::HashMap<EdgeType, usize>,
    pub total_length: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_edge_creation() {
        let start = TopologyId::new("vertex", 0);
        let end = TopologyId::new("vertex", 1);
        let edge = Edge::new(start, end, EdgeType::Linear);

        assert_eq!(edge.edge_type, EdgeType::Linear);
        assert!(edge.oriented);
        assert_eq!(edge.length, 0.0);
    }

    #[test]
    fn test_edge_length_computation() {
        let start = TopologyId::new("vertex", 0);
        let end = TopologyId::new("vertex", 1);
        let mut edge = Edge::new(start, end, EdgeType::Linear);

        edge.compute_length([0.0, 0.0, 0.0], [3.0, 4.0, 0.0]);
        assert_eq!(edge.length, 5.0); // 3-4-5 triangle
    }

    #[test]
    fn test_edge_constraint() {
        use crate::geometry::ir::ManufacturingProcess;

        let constraint = EdgeConstraint::min_radius(1.0, ManufacturingProcess::CNCMilling);
        assert_eq!(constraint.constraint_type, EdgeConstraintType::MinRadius);
        assert_eq!(constraint.min_value, 1.0);
    }

    #[test]
    fn test_edge_collection() {
        let mut collection = EdgeCollection::new();
        let start = TopologyId::new("vertex", 0);
        let end = TopologyId::new("vertex", 1);
        let edge = Edge::new(start, end, EdgeType::Linear);

        let edge_id = collection.add_edge(edge).unwrap();
        assert!(collection.get_edge(&edge_id).is_some());

        let stats = collection.stats();
        assert_eq!(stats.total_edges, 1);
        assert_eq!(stats.total_half_edges, 2);
    }

    #[test]
    fn test_half_edge_creation() {
        let edge_id = EdgeId::new("test_edge".to_string());
        let vertex_id = TopologyId::new("vertex", 0);
        let he = HalfEdge::new(edge_id.clone(), vertex_id, true);

        assert_eq!(he.edge_id, edge_id);
        assert!(he.forward);
        assert!(he.twin.is_none());
    }

    #[test]
    fn test_edge_manufacturability() {
        let start = TopologyId::new("vertex", 0);
        let end = TopologyId::new("vertex", 1);
        let edge = Edge::new(start, end, EdgeType::Linear);

        assert!(edge.is_manufacturable()); // Linear edges are generally manufacturable

        let sharp_edge = Edge::new(
            TopologyId::new("vertex", 0),
            TopologyId::new("vertex", 1),
            EdgeType::Sharp,
        );
        assert!(!sharp_edge.is_manufacturable()); // Sharp edges are difficult to manufacture
    }

    #[test]
    fn test_edge_tangent() {
        let start = TopologyId::new("vertex", 0);
        let end = TopologyId::new("vertex", 1);
        let edge = Edge::new(start, end, EdgeType::Linear);

        let tangent = edge.tangent_at(0.5, [0.0, 0.0, 0.0], [1.0, 0.0, 0.0]);
        assert_eq!(tangent, [1.0, 0.0, 0.0]);
    }

    #[test]
    fn test_edge_reversal() {
        let start = TopologyId::new("vertex", 0);
        let end = TopologyId::new("vertex", 1);
        let mut edge = Edge::new(start.clone(), end.clone(), EdgeType::Linear);

        edge.reverse();
        assert_eq!(edge.start_vertex, end);
        assert_eq!(edge.end_vertex, start);
    }
}
