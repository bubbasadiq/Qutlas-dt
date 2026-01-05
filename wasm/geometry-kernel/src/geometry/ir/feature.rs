//! Parametric features for replayable geometric operations.
//!
//! This module defines parametric features like extrusions, holes, fillets,
//! chamfers, and other manufacturing-aware geometric operations. Each feature
//! is deterministic and replayable from parameters.

use crate::errors::{KernelError, KernelResult};
use crate::geometry::ir::node::{NodeId, Transform};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Parametric feature that can be applied to geometry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Feature {
    /// Unique identifier for this feature
    pub id: String,

    /// Type of feature operation
    pub feature_type: FeatureType,

    /// Target geometry node this feature applies to
    pub target_node: NodeId,

    /// Feature-specific parameters
    pub parameters: FeatureParameters,

    /// Optional transform applied after feature operation
    pub post_transform: Option<Transform>,

    /// Manufacturing constraints for this feature
    pub manufacturing_constraints: Vec<ManufacturingConstraint>,

    /// Feature creation metadata
    pub metadata: FeatureMetadata,
}

impl Feature {
    /// Create a new feature
    pub fn new(
        id: String,
        feature_type: FeatureType,
        target_node: NodeId,
        parameters: FeatureParameters,
    ) -> Self {
        Feature {
            id,
            feature_type,
            target_node,
            parameters,
            post_transform: None,
            manufacturing_constraints: Vec::new(),
            metadata: FeatureMetadata::default(),
        }
    }

    /// Validate feature parameters for correctness
    pub fn validate(&self) -> KernelResult<()> {
        // Type-specific validation
        match &self.feature_type {
            FeatureType::Extrude => self.validate_extrude(),
            FeatureType::Revolve => self.validate_revolve(),
            FeatureType::Hole => self.validate_hole(),
            FeatureType::Fillet => self.validate_fillet(),
            FeatureType::Chamfer => self.validate_chamfer(),
            FeatureType::Shell => self.validate_shell(),
            FeatureType::Draft => self.validate_draft(),
            FeatureType::Pattern => self.validate_pattern(),
            FeatureType::Mirror => self.validate_mirror(),
            FeatureType::Sweep => self.validate_sweep(),
            FeatureType::Loft => self.validate_loft(),
        }?;

        // Validate manufacturing constraints
        for constraint in &self.manufacturing_constraints {
            constraint.validate()?;
        }

        Ok(())
    }

    /// Check if feature is manufacturable with given process
    pub fn is_manufacturable(&self, process: &ManufacturingProcess) -> KernelResult<bool> {
        for constraint in &self.manufacturing_constraints {
            if !constraint.is_satisfied_by(process)? {
                return Ok(false);
            }
        }
        Ok(true)
    }

    /// Get minimum tool access requirements for this feature
    pub fn tool_access_requirements(&self) -> Vec<ToolAccessRequirement> {
        let mut requirements = Vec::new();

        match &self.feature_type {
            FeatureType::Hole => {
                if let FeatureParameters::Hole {
                    depth, diameter, ..
                } = &self.parameters
                {
                    let aspect_ratio = depth / diameter;
                    requirements.push(ToolAccessRequirement {
                        access_direction: self.get_primary_access_direction(),
                        min_diameter: *diameter,
                        min_length: *depth,
                        aspect_ratio_limit: Some(aspect_ratio),
                        tolerance_grade: ToleranceGrade::IT7, // Default for holes
                    });
                }
            }
            FeatureType::Fillet => {
                if let FeatureParameters::Fillet { radius, .. } = &self.parameters {
                    requirements.push(ToolAccessRequirement {
                        access_direction: self.get_primary_access_direction(),
                        min_diameter: radius * 2.0,
                        min_length: 0.0,
                        aspect_ratio_limit: None,
                        tolerance_grade: ToleranceGrade::IT8, // Fillets are less critical
                    });
                }
            }
            // Add other feature types as needed
            _ => {}
        }

        requirements
    }

    // Private validation methods

    fn validate_extrude(&self) -> KernelResult<()> {
        if let FeatureParameters::Extrude {
            distance,
            direction,
            ..
        } = &self.parameters
        {
            if *distance <= 0.0 {
                return Err(KernelError::invalid_parameter(
                    "extrude_distance",
                    "Distance must be positive",
                ));
            }

            let dir_magnitude =
                (direction[0].powi(2) + direction[1].powi(2) + direction[2].powi(2)).sqrt();
            if dir_magnitude < 1e-9 {
                return Err(KernelError::invalid_parameter(
                    "extrude_direction",
                    "Direction vector cannot be zero",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "extrude_parameters",
                "Invalid parameters for extrude feature",
            ));
        }
        Ok(())
    }

    fn validate_revolve(&self) -> KernelResult<()> {
        if let FeatureParameters::Revolve { angle, axis, .. } = &self.parameters {
            if *angle <= 0.0 || *angle > 360.0 {
                return Err(KernelError::invalid_parameter(
                    "revolve_angle",
                    "Angle must be between 0 and 360 degrees",
                ));
            }

            let axis_magnitude = (axis[0].powi(2) + axis[1].powi(2) + axis[2].powi(2)).sqrt();
            if axis_magnitude < 1e-9 {
                return Err(KernelError::invalid_parameter(
                    "revolve_axis",
                    "Axis vector cannot be zero",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "revolve_parameters",
                "Invalid parameters for revolve feature",
            ));
        }
        Ok(())
    }

    fn validate_hole(&self) -> KernelResult<()> {
        if let FeatureParameters::Hole {
            diameter, depth, ..
        } = &self.parameters
        {
            if *diameter <= 0.0 {
                return Err(KernelError::invalid_parameter(
                    "hole_diameter",
                    "Diameter must be positive",
                ));
            }

            if *depth <= 0.0 {
                return Err(KernelError::invalid_parameter(
                    "hole_depth",
                    "Depth must be positive",
                ));
            }

            // Manufacturing constraint: aspect ratio limit
            let aspect_ratio = depth / diameter;
            if aspect_ratio > 10.0 {
                return Err(KernelError::constraint_violation(
                    "Hole aspect ratio exceeds manufacturing limits (max 10:1)",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "hole_parameters",
                "Invalid parameters for hole feature",
            ));
        }
        Ok(())
    }

    fn validate_fillet(&self) -> KernelResult<()> {
        if let FeatureParameters::Fillet { radius, .. } = &self.parameters {
            if *radius <= 0.0 {
                return Err(KernelError::invalid_parameter(
                    "fillet_radius",
                    "Radius must be positive",
                ));
            }

            // Manufacturing constraint: minimum radius for tooling
            if *radius < 0.5 {
                return Err(KernelError::constraint_violation(
                    "Fillet radius below minimum manufacturing limit (0.5mm)",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "fillet_parameters",
                "Invalid parameters for fillet feature",
            ));
        }
        Ok(())
    }

    fn validate_chamfer(&self) -> KernelResult<()> {
        if let FeatureParameters::Chamfer {
            distance, angle, ..
        } = &self.parameters
        {
            if *distance <= 0.0 {
                return Err(KernelError::invalid_parameter(
                    "chamfer_distance",
                    "Distance must be positive",
                ));
            }

            if *angle <= 0.0 || *angle >= 90.0 {
                return Err(KernelError::invalid_parameter(
                    "chamfer_angle",
                    "Angle must be between 0 and 90 degrees",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "chamfer_parameters",
                "Invalid parameters for chamfer feature",
            ));
        }
        Ok(())
    }

    fn validate_shell(&self) -> KernelResult<()> {
        if let FeatureParameters::Shell { thickness, .. } = &self.parameters {
            if *thickness <= 0.0 {
                return Err(KernelError::invalid_parameter(
                    "shell_thickness",
                    "Thickness must be positive",
                ));
            }

            // Manufacturing constraint: minimum wall thickness
            if *thickness < 0.8 {
                return Err(KernelError::constraint_violation(
                    "Shell thickness below minimum manufacturing limit (0.8mm)",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "shell_parameters",
                "Invalid parameters for shell feature",
            ));
        }
        Ok(())
    }

    fn validate_draft(&self) -> KernelResult<()> {
        if let FeatureParameters::Draft { angle, .. } = &self.parameters {
            if *angle <= 0.0 || *angle > 45.0 {
                return Err(KernelError::invalid_parameter(
                    "draft_angle",
                    "Draft angle must be between 0 and 45 degrees",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "draft_parameters",
                "Invalid parameters for draft feature",
            ));
        }
        Ok(())
    }

    fn validate_pattern(&self) -> KernelResult<()> {
        if let FeatureParameters::Pattern { count, spacing, .. } = &self.parameters {
            if *count < 2 {
                return Err(KernelError::invalid_parameter(
                    "pattern_count",
                    "Pattern count must be at least 2",
                ));
            }

            if *spacing <= 0.0 {
                return Err(KernelError::invalid_parameter(
                    "pattern_spacing",
                    "Pattern spacing must be positive",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "pattern_parameters",
                "Invalid parameters for pattern feature",
            ));
        }
        Ok(())
    }

    fn validate_mirror(&self) -> KernelResult<()> {
        if let FeatureParameters::Mirror { plane_normal, .. } = &self.parameters {
            let normal_magnitude =
                (plane_normal[0].powi(2) + plane_normal[1].powi(2) + plane_normal[2].powi(2))
                    .sqrt();
            if normal_magnitude < 1e-9 {
                return Err(KernelError::invalid_parameter(
                    "mirror_plane_normal",
                    "Plane normal cannot be zero",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "mirror_parameters",
                "Invalid parameters for mirror feature",
            ));
        }
        Ok(())
    }

    fn validate_sweep(&self) -> KernelResult<()> {
        if let FeatureParameters::Sweep { path_points, .. } = &self.parameters {
            if path_points.len() < 2 {
                return Err(KernelError::invalid_parameter(
                    "sweep_path",
                    "Sweep path must have at least 2 points",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "sweep_parameters",
                "Invalid parameters for sweep feature",
            ));
        }
        Ok(())
    }

    fn validate_loft(&self) -> KernelResult<()> {
        if let FeatureParameters::Loft { profiles, .. } = &self.parameters {
            if profiles.len() < 2 {
                return Err(KernelError::invalid_parameter(
                    "loft_profiles",
                    "Loft must have at least 2 profiles",
                ));
            }
        } else {
            return Err(KernelError::invalid_parameter(
                "loft_parameters",
                "Invalid parameters for loft feature",
            ));
        }
        Ok(())
    }

    fn get_primary_access_direction(&self) -> [f64; 3] {
        // Default to Z-axis, could be overridden based on feature parameters
        [0.0, 0.0, 1.0]
    }
}

/// Types of parametric features
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum FeatureType {
    /// Extrude a profile along a direction
    Extrude,
    /// Revolve a profile around an axis
    Revolve,
    /// Create a hole (cylindrical removal)
    Hole,
    /// Add fillet (rounded edge)
    Fillet,
    /// Add chamfer (beveled edge)
    Chamfer,
    /// Shell operation (hollow out with wall thickness)
    Shell,
    /// Draft angle for manufacturing
    Draft,
    /// Pattern (linear or circular array)
    Pattern,
    /// Mirror operation
    Mirror,
    /// Sweep along path
    Sweep,
    /// Loft between profiles
    Loft,
}

/// Feature-specific parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum FeatureParameters {
    Extrude {
        distance: f64,
        direction: [f64; 3],
        draft_angle: Option<f64>,
        taper_angle: Option<f64>,
    },
    Revolve {
        angle: f64, // degrees
        axis: [f64; 3],
        axis_point: [f64; 3],
    },
    Hole {
        diameter: f64,
        depth: f64,
        position: [f64; 3],
        direction: [f64; 3],
        hole_type: HoleType,
    },
    Fillet {
        radius: f64,
        edge_selection: EdgeSelection,
        blend_type: BlendType,
    },
    Chamfer {
        distance: f64,
        angle: f64, // degrees
        edge_selection: EdgeSelection,
    },
    Shell {
        thickness: f64,
        faces_to_remove: Vec<i32>,
    },
    Draft {
        angle: f64, // degrees
        pull_direction: [f64; 3],
        neutral_plane: [f64; 4], // plane equation [a, b, c, d]
    },
    Pattern {
        count: u32,
        spacing: f64,
        direction: [f64; 3],
        pattern_type: PatternType,
    },
    Mirror {
        plane_normal: [f64; 3],
        plane_point: [f64; 3],
    },
    Sweep {
        path_points: Vec<[f64; 3]>,
        twist_angle: Option<f64>,
        scale_factor: Option<f64>,
    },
    Loft {
        profiles: Vec<NodeId>,
        guide_curves: Vec<NodeId>,
    },
}

/// Types of holes for manufacturing awareness
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum HoleType {
    /// Simple through hole
    Through,
    /// Blind hole (partial depth)
    Blind,
    /// Counterbore hole
    Counterbore { cb_diameter: f64, cb_depth: f64 },
    /// Countersink hole
    Countersink { cs_diameter: f64, cs_angle: f64 },
    /// Threaded hole
    Threaded {
        thread_pitch: f64,
        thread_class: String,
    },
}

/// Edge selection methods for fillets and chamfers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EdgeSelection {
    /// All edges of the solid
    AllEdges,
    /// Specific edge indices
    EdgeIndices(Vec<u32>),
    /// Edges by geometric criteria
    EdgesByCriteria {
        min_length: Option<f64>,
        max_length: Option<f64>,
        convex_only: bool,
        concave_only: bool,
    },
}

/// Blend types for fillets
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum BlendType {
    /// Constant radius blend
    Constant,
    /// Variable radius blend
    Variable,
    /// Conic blend
    Conic { rho: f64 },
}

/// Pattern types
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PatternType {
    /// Linear pattern
    Linear,
    /// Circular pattern
    Circular { axis: [f64; 3], center: [f64; 3] },
}

/// Manufacturing constraints for features
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManufacturingConstraint {
    /// Type of constraint
    pub constraint_type: ConstraintType,
    /// Constraint parameters
    pub parameters: HashMap<String, f64>,
    /// Which manufacturing processes this applies to
    pub applicable_processes: Vec<ManufacturingProcess>,
}

impl ManufacturingConstraint {
    /// Validate constraint parameters
    pub fn validate(&self) -> KernelResult<()> {
        match self.constraint_type {
            ConstraintType::MinFeatureSize => {
                if !self.parameters.contains_key("min_size") {
                    return Err(KernelError::missing_parameter("min_size"));
                }
            }
            ConstraintType::MaxAspectRatio => {
                if !self.parameters.contains_key("max_ratio") {
                    return Err(KernelError::missing_parameter("max_ratio"));
                }
            }
            ConstraintType::DraftAngle => {
                if !self.parameters.contains_key("min_angle") {
                    return Err(KernelError::missing_parameter("min_angle"));
                }
            }
            ConstraintType::WallThickness => {
                if !self.parameters.contains_key("min_thickness") {
                    return Err(KernelError::missing_parameter("min_thickness"));
                }
            }
        }
        Ok(())
    }

    /// Check if constraint is satisfied by manufacturing process
    pub fn is_satisfied_by(&self, process: &ManufacturingProcess) -> KernelResult<bool> {
        if !self.applicable_processes.contains(process) {
            return Ok(true); // Constraint doesn't apply to this process
        }

        // Process-specific validation would go here
        // This is a stub for now
        Ok(true)
    }
}

/// Types of manufacturing constraints
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ConstraintType {
    /// Minimum feature size constraint
    MinFeatureSize,
    /// Maximum aspect ratio constraint
    MaxAspectRatio,
    /// Required draft angle
    DraftAngle,
    /// Minimum wall thickness
    WallThickness,
}

/// Manufacturing processes for constraint validation
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ManufacturingProcess {
    /// CNC milling
    CNCMilling,
    /// CNC turning
    CNCTurning,
    /// 3D printing (additive)
    Printing3D,
    /// Injection molding
    InjectionMolding,
    /// Die casting
    DieCasting,
    /// Sheet metal forming
    SheetMetal,
}

/// Tool access requirements for manufacturing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolAccessRequirement {
    /// Primary access direction
    pub access_direction: [f64; 3],
    /// Minimum tool diameter required
    pub min_diameter: f64,
    /// Minimum tool length required
    pub min_length: f64,
    /// Maximum aspect ratio limitation
    pub aspect_ratio_limit: Option<f64>,
    /// Required tolerance grade
    pub tolerance_grade: ToleranceGrade,
}

/// Tolerance grades for manufacturing precision
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ToleranceGrade {
    IT5,  // High precision
    IT6,  // High precision
    IT7,  // Medium precision
    IT8,  // Medium precision
    IT9,  // Standard precision
    IT10, // Standard precision
    IT11, // Coarse precision
}

/// Feature creation metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureMetadata {
    /// Creation timestamp
    pub created_at: f64,
    /// User who created the feature
    pub created_by: Option<String>,
    /// Feature description
    pub description: Option<String>,
    /// Manufacturing notes
    pub manufacturing_notes: Vec<String>,
}

impl Default for FeatureMetadata {
    fn default() -> Self {
        FeatureMetadata {
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs_f64(),
            created_by: None,
            description: None,
            manufacturing_notes: Vec::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::ir::node::{NodeId, NodeMetadata, NodeSource};

    #[test]
    fn test_feature_creation() {
        let target_id = NodeId::from_user_string("box1");
        let params = FeatureParameters::Hole {
            diameter: 5.0,
            depth: 10.0,
            position: [0.0, 0.0, 0.0],
            direction: [0.0, 0.0, 1.0],
            hole_type: HoleType::Through,
        };

        let feature = Feature::new("hole1".to_string(), FeatureType::Hole, target_id, params);

        assert_eq!(feature.feature_type, FeatureType::Hole);
        assert!(feature.validate().is_ok());
    }

    #[test]
    fn test_invalid_hole_parameters() {
        let target_id = NodeId::from_user_string("box1");
        let params = FeatureParameters::Hole {
            diameter: -5.0, // Invalid: negative diameter
            depth: 10.0,
            position: [0.0, 0.0, 0.0],
            direction: [0.0, 0.0, 1.0],
            hole_type: HoleType::Through,
        };

        let feature = Feature::new("hole1".to_string(), FeatureType::Hole, target_id, params);

        assert!(feature.validate().is_err());
    }

    #[test]
    fn test_aspect_ratio_constraint() {
        let target_id = NodeId::from_user_string("box1");
        let params = FeatureParameters::Hole {
            diameter: 1.0,
            depth: 15.0, // Aspect ratio 15:1 > limit of 10:1
            position: [0.0, 0.0, 0.0],
            direction: [0.0, 0.0, 1.0],
            hole_type: HoleType::Blind,
        };

        let feature = Feature::new("hole1".to_string(), FeatureType::Hole, target_id, params);

        assert!(feature.validate().is_err());
    }

    #[test]
    fn test_manufacturing_constraint_validation() {
        let mut constraint = ManufacturingConstraint {
            constraint_type: ConstraintType::MinFeatureSize,
            parameters: HashMap::new(),
            applicable_processes: vec![ManufacturingProcess::CNCMilling],
        };

        // Should fail without required parameter
        assert!(constraint.validate().is_err());

        // Should pass with required parameter
        constraint.parameters.insert("min_size".to_string(), 0.5);
        assert!(constraint.validate().is_ok());
    }

    #[test]
    fn test_tool_access_requirements() {
        let target_id = NodeId::from_user_string("box1");
        let params = FeatureParameters::Hole {
            diameter: 8.0,
            depth: 20.0,
            position: [0.0, 0.0, 0.0],
            direction: [0.0, 0.0, 1.0],
            hole_type: HoleType::Through,
        };

        let feature = Feature::new("hole1".to_string(), FeatureType::Hole, target_id, params);

        let requirements = feature.tool_access_requirements();
        assert_eq!(requirements.len(), 1);
        assert_eq!(requirements[0].min_diameter, 8.0);
        assert_eq!(requirements[0].min_length, 20.0);
    }
}
