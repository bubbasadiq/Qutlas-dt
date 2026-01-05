//! Analysis module for derived geometric properties.
//!
//! This module provides analysis functions for computing derived properties
//! that are separate from core geometry as per the kernel architecture.
//! Analysis results should not be stored in geometry nodes but computed
//! on-demand or cached separately.

pub mod bounding_box;
pub mod mass_props;

// Re-export core analysis types
pub use bounding_box::{
    bbox_surface_area, bbox_volume, bboxes_intersect, compute_bounding_box, expand_bbox,
    get_bbox_corners, merge_bboxes, point_in_bbox, transform_bbox,
};

pub use mass_props::{
    analyze_nodes, estimate_volume_primitive, MassProperties, MassPropertiesAnalyzer,
    MaterialProperties,
};

use crate::errors::KernelResult;
use crate::geometry::ir::node::{IRNode, NodeId};
use crate::types::{BoundingBox, PreviewMesh};
use std::collections::HashMap;

/// Comprehensive analysis result for a geometric entity
#[derive(Debug, Clone)]
pub struct GeometricAnalysis {
    /// Node being analyzed
    pub node_id: NodeId,
    /// Bounding box
    pub bounding_box: BoundingBox,
    /// Mass properties
    pub mass_properties: MassProperties,
    /// Surface area
    pub surface_area: f64,
    /// Volume
    pub volume: f64,
    /// Analysis timestamp
    pub computed_at: f64,
}

impl GeometricAnalysis {
    /// Create a new analysis result
    pub fn new(
        node_id: NodeId,
        bounding_box: BoundingBox,
        mass_properties: MassProperties,
    ) -> Self {
        GeometricAnalysis {
            node_id,
            surface_area: mass_properties.surface_area,
            volume: mass_properties.volume,
            bounding_box,
            mass_properties,
            computed_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs_f64(),
        }
    }

    /// Check if analysis is recent (less than given age in seconds)
    pub fn is_fresh(&self, max_age_seconds: f64) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs_f64();

        (now - self.computed_at) < max_age_seconds
    }
}

/// Analyzer for computing comprehensive geometric analysis
pub struct GeometricAnalyzer {
    /// Mass properties analyzer
    mass_analyzer: MassPropertiesAnalyzer,
    /// Analysis cache
    cache: HashMap<NodeId, GeometricAnalysis>,
    /// Cache timeout in seconds
    cache_timeout: f64,
}

impl GeometricAnalyzer {
    /// Create a new geometric analyzer
    pub fn new() -> Self {
        GeometricAnalyzer {
            mass_analyzer: MassPropertiesAnalyzer::new(),
            cache: HashMap::new(),
            cache_timeout: 300.0, // 5 minutes
        }
    }

    /// Create analyzer with custom material
    pub fn with_material(material: MaterialProperties) -> Self {
        GeometricAnalyzer {
            mass_analyzer: MassPropertiesAnalyzer::with_material(material),
            cache: HashMap::new(),
            cache_timeout: 300.0,
        }
    }

    /// Analyze a node with mesh data
    pub fn analyze_node(
        &mut self,
        node: &IRNode,
        mesh: &PreviewMesh,
    ) -> KernelResult<GeometricAnalysis> {
        // Check cache first
        if let Some(cached) = self.cache.get(&node.id) {
            if cached.is_fresh(self.cache_timeout) {
                return Ok(cached.clone());
            }
        }

        // Compute bounding box
        let bbox = compute_bounding_box(mesh);

        // Compute mass properties
        let mass_props = self.mass_analyzer.analyze_mesh(mesh)?;

        // Create analysis result
        let analysis = GeometricAnalysis::new(node.id.clone(), bbox, mass_props);

        // Cache the result
        self.cache.insert(node.id.clone(), analysis.clone());

        Ok(analysis)
    }

    /// Clear analysis cache
    pub fn clear_cache(&mut self) {
        self.cache.clear();
    }

    /// Set cache timeout
    pub fn set_cache_timeout(&mut self, timeout_seconds: f64) {
        self.cache_timeout = timeout_seconds;
    }

    /// Get cache statistics
    pub fn cache_stats(&self) -> (usize, usize) {
        let total_entries = self.cache.len();
        let fresh_entries = self
            .cache
            .values()
            .filter(|analysis| analysis.is_fresh(self.cache_timeout))
            .count();

        (total_entries, fresh_entries)
    }
}

impl Default for GeometricAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}

/// Quick analysis functions for common cases

/// Estimate properties for primitive without full mesh analysis
pub fn quick_primitive_analysis(
    primitive_type: &str,
    parameters: &HashMap<String, f64>,
) -> GeometricAnalysis {
    let volume = estimate_volume_primitive(primitive_type, parameters);

    // Rough surface area estimation (simplified)
    let surface_area = match primitive_type {
        "box" => {
            let w = parameters.get("width").unwrap_or(&1.0);
            let h = parameters.get("height").unwrap_or(&1.0);
            let d = parameters.get("depth").unwrap_or(&1.0);
            2.0 * (w * h + w * d + h * d)
        }
        "cylinder" => {
            let r = parameters.get("radius").unwrap_or(&1.0);
            let h = parameters.get("height").unwrap_or(&1.0);
            2.0 * std::f64::consts::PI * r * (r + h)
        }
        "sphere" => {
            let r = parameters.get("radius").unwrap_or(&1.0);
            4.0 * std::f64::consts::PI * r * r
        }
        _ => volume.powf(2.0 / 3.0), // Rough estimate based on volume
    };

    // Simple bounding box estimation
    let bbox = match primitive_type {
        "box" => {
            let w = parameters.get("width").unwrap_or(&1.0);
            let h = parameters.get("height").unwrap_or(&1.0);
            let d = parameters.get("depth").unwrap_or(&1.0);
            BoundingBox {
                min: [-w / 2.0, -h / 2.0, -d / 2.0],
                max: [w / 2.0, h / 2.0, d / 2.0],
            }
        }
        "cylinder" | "cone" => {
            let r = parameters.get("radius").unwrap_or(&1.0);
            let h = parameters.get("height").unwrap_or(&1.0);
            BoundingBox {
                min: [-r, -r, -h / 2.0],
                max: [*r, *r, h / 2.0],
            }
        }
        "sphere" => {
            let r = parameters.get("radius").unwrap_or(&1.0);
            BoundingBox {
                min: [-r, -r, -r],
                max: [*r, *r, *r],
            }
        }
        _ => BoundingBox {
            min: [-1.0, -1.0, -1.0],
            max: [1.0, 1.0, 1.0],
        },
    };

    let mass_props = MassProperties {
        volume,
        surface_area,
        centroid: [0.0, 0.0, 0.0],
        center_of_mass: [0.0, 0.0, 0.0],
        mass: volume * 2700.0,              // Assume aluminum density
        principal_moments: [0.0, 0.0, 0.0], // Would need proper calculation
        principal_axes: [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
        products_of_inertia: [0.0, 0.0, 0.0],
        radii_of_gyration: [0.0, 0.0, 0.0],
    };

    GeometricAnalysis::new(
        crate::geometry::ir::node::NodeId::from_user_string("quick_analysis"),
        bbox,
        mass_props,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::ir::node::{NodeContent, NodeMetadata, NodeSource, NodeType};
    use crate::types::PreviewMesh;

    fn create_test_node() -> IRNode {
        let metadata = NodeMetadata::new(Some("test_box".to_string()), NodeSource::User);
        let content = NodeContent::Primitive {
            primitive_type: "box".to_string(),
            parameters: {
                let mut params = HashMap::new();
                params.insert("width".to_string(), 10.0);
                params.insert("height".to_string(), 20.0);
                params.insert("depth".to_string(), 5.0);
                params
            },
            transform: None,
        };

        IRNode::new(NodeType::Primitive, content, vec![], metadata).unwrap()
    }

    fn create_simple_mesh() -> PreviewMesh {
        PreviewMesh {
            vertices: vec![
                0.0, 0.0, 0.0, // 0
                1.0, 0.0, 0.0, // 1
                0.0, 1.0, 0.0, // 2
            ],
            indices: vec![0, 1, 2],
            normals: vec![0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0],
        }
    }

    #[test]
    fn test_geometric_analyzer() {
        let mut analyzer = GeometricAnalyzer::new();
        let node = create_test_node();
        let mesh = create_simple_mesh();

        let result = analyzer.analyze_node(&node, &mesh);
        assert!(result.is_ok());

        let analysis = result.unwrap();
        assert_eq!(analysis.node_id, node.id);
        assert!(analysis.volume >= 0.0);
        assert!(analysis.surface_area >= 0.0);
    }

    #[test]
    fn test_cache_functionality() {
        let mut analyzer = GeometricAnalyzer::new();
        let node = create_test_node();
        let mesh = create_simple_mesh();

        // First analysis should compute
        let analysis1 = analyzer.analyze_node(&node, &mesh).unwrap();
        let (total, fresh) = analyzer.cache_stats();
        assert_eq!(total, 1);
        assert_eq!(fresh, 1);

        // Second analysis should use cache
        let analysis2 = analyzer.analyze_node(&node, &mesh).unwrap();
        assert_eq!(analysis1.computed_at, analysis2.computed_at);

        // Clear cache
        analyzer.clear_cache();
        let (total, _fresh) = analyzer.cache_stats();
        assert_eq!(total, 0);
    }

    #[test]
    fn test_quick_primitive_analysis() {
        let mut params = HashMap::new();
        params.insert("width".to_string(), 2.0);
        params.insert("height".to_string(), 3.0);
        params.insert("depth".to_string(), 4.0);

        let analysis = quick_primitive_analysis("box", &params);
        assert_eq!(analysis.volume, 24.0);
        assert_eq!(analysis.surface_area, 52.0); // 2*(2*3 + 2*4 + 3*4)

        // Check bounding box
        assert_eq!(analysis.bounding_box.min_x, -1.0);
        assert_eq!(analysis.bounding_box.max_x, 1.0);
    }

    #[test]
    fn test_analysis_freshness() {
        let mut analysis = GeometricAnalysis::new(
            crate::geometry::ir::node::NodeId::from_user_string("test"),
            BoundingBox {
                min_x: 0.0,
                max_x: 1.0,
                min_y: 0.0,
                max_y: 1.0,
                min_z: 0.0,
                max_z: 1.0,
            },
            MassProperties::zero(),
        );

        assert!(analysis.is_fresh(1000.0)); // Should be fresh within 1000 seconds

        // Simulate old analysis
        analysis.computed_at = 0.0;
        assert!(!analysis.is_fresh(1.0)); // Should not be fresh
    }
}
