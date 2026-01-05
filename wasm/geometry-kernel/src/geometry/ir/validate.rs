//! Structural and semantic validation of IR nodes and graphs.
//!
//! This module provides comprehensive validation for geometric IR, ensuring
//! structural correctness, semantic consistency, and manufacturability constraints.

use crate::errors::{KernelError, KernelResult};
use crate::geometry::ir::feature::{Feature, ManufacturingProcess};
use crate::geometry::ir::graph::IRGraph;
use crate::geometry::ir::node::{IRNode, NodeContent, NodeId, NodeType, ValidationStatus};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Comprehensive validation result for IR structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    /// Overall validation status
    pub is_valid: bool,
    /// Validation errors (fatal issues)
    pub errors: Vec<ValidationError>,
    /// Validation warnings (non-fatal issues)
    pub warnings: Vec<ValidationWarning>,
    /// Manufacturing analysis results
    pub manufacturing_analysis: ManufacturingAnalysis,
    /// Performance metrics from validation
    pub metrics: ValidationMetrics,
}

impl ValidationResult {
    /// Create a new empty validation result
    pub fn new() -> Self {
        ValidationResult {
            is_valid: true,
            errors: Vec::new(),
            warnings: Vec::new(),
            manufacturing_analysis: ManufacturingAnalysis::default(),
            metrics: ValidationMetrics::default(),
        }
    }

    /// Add an error to the validation result
    pub fn add_error(&mut self, error: ValidationError) {
        self.is_valid = false;
        self.errors.push(error);
    }

    /// Add a warning to the validation result
    pub fn add_warning(&mut self, warning: ValidationWarning) {
        self.warnings.push(warning);
    }

    /// Check if validation passed without errors
    pub fn has_errors(&self) -> bool {
        !self.errors.is_empty()
    }

    /// Check if validation has warnings
    pub fn has_warnings(&self) -> bool {
        !self.warnings.is_empty()
    }

    /// Get summary of validation issues
    pub fn summary(&self) -> String {
        if self.is_valid && self.warnings.is_empty() {
            "Validation passed without issues".to_string()
        } else if self.is_valid {
            format!("Validation passed with {} warnings", self.warnings.len())
        } else {
            format!(
                "Validation failed with {} errors and {} warnings",
                self.errors.len(),
                self.warnings.len()
            )
        }
    }
}

/// Validation error (fatal issue)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    /// Error type classification
    pub error_type: ValidationErrorType,
    /// Node ID where error occurred (if applicable)
    pub node_id: Option<NodeId>,
    /// Human-readable error message
    pub message: String,
    /// Additional context for debugging
    pub context: HashMap<String, String>,
    /// Suggested fix (if available)
    pub suggested_fix: Option<String>,
}

/// Validation warning (non-fatal issue)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationWarning {
    /// Warning type classification
    pub warning_type: ValidationWarningType,
    /// Node ID where warning occurred (if applicable)
    pub node_id: Option<NodeId>,
    /// Human-readable warning message
    pub message: String,
    /// Severity level
    pub severity: WarningSeverity,
    /// Suggested improvement
    pub suggestion: Option<String>,
}

/// Types of validation errors
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ValidationErrorType {
    /// Structural graph issues
    GraphStructure,
    /// Missing required dependencies
    MissingDependency,
    /// Circular dependency detected
    CircularDependency,
    /// Invalid node content
    InvalidContent,
    /// Parameter validation failure
    InvalidParameter,
    /// Type mismatch between nodes
    TypeMismatch,
    /// Manufacturing constraint violation
    ManufacturingConstraint,
    /// Geometric inconsistency
    GeometricInconsistency,
    /// Content hash mismatch
    IntegrityViolation,
}

/// Types of validation warnings
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ValidationWarningType {
    /// Performance concern
    Performance,
    /// Manufacturing difficulty
    ManufacturingDifficulty,
    /// Non-optimal parameter choice
    SuboptimalParameter,
    /// Missing optimization opportunity
    MissedOptimization,
    /// Potential robustness issue
    RobustnessIssue,
    /// Style/convention deviation
    StyleIssue,
}

/// Warning severity levels
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum WarningSeverity {
    /// Low severity - informational
    Low,
    /// Medium severity - should be addressed
    Medium,
    /// High severity - strongly recommended to fix
    High,
}

/// Manufacturing analysis results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManufacturingAnalysis {
    /// Manufacturability score (0-100)
    pub manufacturability_score: f64,
    /// Compatible manufacturing processes
    pub compatible_processes: Vec<ManufacturingProcess>,
    /// Manufacturing constraints violations
    pub constraint_violations: Vec<ConstraintViolation>,
    /// Estimated manufacturing complexity
    pub complexity_score: f64,
    /// Tool access analysis
    pub tool_access_issues: Vec<ToolAccessIssue>,
}

impl Default for ManufacturingAnalysis {
    fn default() -> Self {
        ManufacturingAnalysis {
            manufacturability_score: 100.0,
            compatible_processes: Vec::new(),
            constraint_violations: Vec::new(),
            complexity_score: 0.0,
            tool_access_issues: Vec::new(),
        }
    }
}

/// Manufacturing constraint violation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConstraintViolation {
    /// Node where violation occurs
    pub node_id: NodeId,
    /// Type of constraint violated
    pub constraint_type: String,
    /// Severity of violation
    pub severity: ViolationSeverity,
    /// Description of the violation
    pub description: String,
    /// Affected manufacturing processes
    pub affected_processes: Vec<ManufacturingProcess>,
}

/// Tool access issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolAccessIssue {
    /// Feature with access issue
    pub node_id: NodeId,
    /// Type of access problem
    pub issue_type: String,
    /// Description of the issue
    pub description: String,
    /// Suggested solutions
    pub solutions: Vec<String>,
}

/// Violation severity levels
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum ViolationSeverity {
    /// Minor issue - may increase cost
    Minor,
    /// Major issue - significantly affects manufacturing
    Major,
    /// Critical issue - may make part unmanufacturable
    Critical,
}

/// Validation performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationMetrics {
    /// Time taken for validation (seconds)
    pub validation_time: f64,
    /// Number of nodes validated
    pub nodes_validated: usize,
    /// Number of features validated
    pub features_validated: usize,
    /// Number of constraints checked
    pub constraints_checked: usize,
}

impl Default for ValidationMetrics {
    fn default() -> Self {
        ValidationMetrics {
            validation_time: 0.0,
            nodes_validated: 0,
            features_validated: 0,
            constraints_checked: 0,
        }
    }
}

/// Main validator for IR structures
pub struct IRValidator {
    /// Validation configuration
    config: ValidationConfig,
    /// Cache for expensive validations
    validation_cache: HashMap<String, ValidationResult>,
}

impl IRValidator {
    /// Create a new validator with default configuration
    pub fn new() -> Self {
        IRValidator {
            config: ValidationConfig::default(),
            validation_cache: HashMap::new(),
        }
    }

    /// Create validator with custom configuration
    pub fn with_config(config: ValidationConfig) -> Self {
        IRValidator {
            config,
            validation_cache: HashMap::new(),
        }
    }

    /// Validate a complete IR graph
    pub fn validate_graph(&mut self, graph: &IRGraph) -> KernelResult<ValidationResult> {
        let start_time = std::time::Instant::now();
        let mut result = ValidationResult::new();

        // Step 1: Structural validation
        self.validate_graph_structure(graph, &mut result)?;

        // Step 2: Node-level validation
        self.validate_all_nodes(graph, &mut result)?;

        // Step 3: Dependency validation
        self.validate_dependencies(graph, &mut result)?;

        // Step 4: Semantic consistency validation
        self.validate_semantic_consistency(graph, &mut result)?;

        // Step 5: Manufacturing validation
        if self.config.validate_manufacturing {
            self.validate_manufacturing_constraints(graph, &mut result)?;
        }

        // Step 6: Performance analysis
        if self.config.analyze_performance {
            self.analyze_performance_issues(graph, &mut result)?;
        }

        // Update metrics
        result.metrics.validation_time = start_time.elapsed().as_secs_f64();
        result.metrics.nodes_validated = graph.nodes().len();

        Ok(result)
    }

    /// Validate a single IR node
    pub fn validate_node(&self, node: &IRNode) -> KernelResult<ValidationResult> {
        let start_time = std::time::Instant::now();
        let mut result = ValidationResult::new();

        // Content validation
        self.validate_node_content(node, &mut result)?;

        // Parameter validation
        self.validate_node_parameters(node, &mut result)?;

        // Integrity validation
        self.validate_node_integrity(node, &mut result)?;

        result.metrics.validation_time = start_time.elapsed().as_secs_f64();
        result.metrics.nodes_validated = 1;

        Ok(result)
    }

    /// Validate a feature definition
    pub fn validate_feature(&self, feature: &Feature) -> KernelResult<ValidationResult> {
        let start_time = std::time::Instant::now();
        let mut result = ValidationResult::new();

        // Basic feature validation
        if let Err(e) = feature.validate() {
            result.add_error(ValidationError {
                error_type: ValidationErrorType::InvalidParameter,
                node_id: Some(NodeId::from_user_string(&feature.id)),
                message: e.to_string(),
                context: HashMap::new(),
                suggested_fix: None,
            });
        }

        // Manufacturing constraint validation
        for constraint in &feature.manufacturing_constraints {
            if let Err(e) = constraint.validate() {
                result.add_error(ValidationError {
                    error_type: ValidationErrorType::ManufacturingConstraint,
                    node_id: Some(NodeId::from_user_string(&feature.id)),
                    message: e.to_string(),
                    context: HashMap::new(),
                    suggested_fix: None,
                });
            }
        }

        result.metrics.validation_time = start_time.elapsed().as_secs_f64();
        result.metrics.features_validated = 1;

        Ok(result)
    }

    // Private validation methods

    fn validate_graph_structure(
        &self,
        graph: &IRGraph,
        result: &mut ValidationResult,
    ) -> KernelResult<()> {
        // Use graph's built-in validation
        if let Err(e) = graph.validate() {
            result.add_error(ValidationError {
                error_type: ValidationErrorType::GraphStructure,
                node_id: None,
                message: e.to_string(),
                context: HashMap::new(),
                suggested_fix: Some(
                    "Check for missing dependencies or circular references".to_string(),
                ),
            });
        }

        // Check for disconnected components
        let components = graph.strongly_connected_components();
        if components.len() > 1 {
            result.add_warning(ValidationWarning {
                warning_type: ValidationWarningType::Performance,
                node_id: None,
                message: format!("Graph has {} disconnected components", components.len()),
                severity: WarningSeverity::Low,
                suggestion: Some("Consider if all components are necessary".to_string()),
            });
        }

        Ok(())
    }

    fn validate_all_nodes(
        &self,
        graph: &IRGraph,
        result: &mut ValidationResult,
    ) -> KernelResult<()> {
        for (_node_id, node) in graph.nodes() {
            let node_result = self.validate_node(node)?;

            // Merge results
            result.errors.extend(node_result.errors);
            result.warnings.extend(node_result.warnings);
        }

        Ok(())
    }

    fn validate_dependencies(
        &self,
        graph: &IRGraph,
        result: &mut ValidationResult,
    ) -> KernelResult<()> {
        // Check that all dependencies are satisfied
        for (node_id, node) in graph.nodes() {
            for dep_id in &node.dependencies {
                if let Some(dep_node) = graph.get_node(dep_id) {
                    // Check type compatibility
                    if !self.are_types_compatible(&dep_node.node_type, &node.node_type) {
                        result.add_error(ValidationError {
                            error_type: ValidationErrorType::TypeMismatch,
                            node_id: Some(node_id.clone()),
                            message: format!(
                                "Incompatible types: {} cannot depend on {}",
                                node.node_type.to_string(),
                                dep_node.node_type.to_string()
                            ),
                            context: {
                                let mut ctx = HashMap::new();
                                ctx.insert("dependent".to_string(), node_id.as_str().to_string());
                                ctx.insert("dependency".to_string(), dep_id.as_str().to_string());
                                ctx
                            },
                            suggested_fix: Some("Check node type compatibility".to_string()),
                        });
                    }
                } else {
                    result.add_error(ValidationError {
                        error_type: ValidationErrorType::MissingDependency,
                        node_id: Some(node_id.clone()),
                        message: format!("Missing dependency: {}", dep_id.as_str()),
                        context: HashMap::new(),
                        suggested_fix: Some("Add the missing dependency node".to_string()),
                    });
                }
            }
        }

        Ok(())
    }

    fn validate_semantic_consistency(
        &self,
        graph: &IRGraph,
        result: &mut ValidationResult,
    ) -> KernelResult<()> {
        // Check for semantic inconsistencies between related nodes
        for (_node_id, node) in graph.nodes() {
            match &node.content {
                NodeContent::Feature { target_node, .. } => {
                    if let Some(target) = graph.get_node(target_node) {
                        if target.node_type != NodeType::Primitive
                            && target.node_type != NodeType::BooleanOp
                            && target.node_type != NodeType::Feature
                        {
                            result.add_error(ValidationError {
                                error_type: ValidationErrorType::GeometricInconsistency,
                                node_id: Some(node.id.clone()),
                                message: "Features can only target geometric nodes".to_string(),
                                context: HashMap::new(),
                                suggested_fix: Some(
                                    "Target a primitive, boolean op, or other feature".to_string(),
                                ),
                            });
                        }
                    }
                }
                NodeContent::BooleanOp {
                    operand_a,
                    operand_b,
                    ..
                } => {
                    // Both operands must be geometric
                    for operand in [operand_a, operand_b] {
                        if let Some(operand_node) = graph.get_node(operand) {
                            if !self.is_geometric_node(&operand_node.node_type) {
                                result.add_error(ValidationError {
                                    error_type: ValidationErrorType::GeometricInconsistency,
                                    node_id: Some(node.id.clone()),
                                    message: "Boolean operations require geometric operands".to_string(),
                                    context: HashMap::new(),
                                    suggested_fix: Some("Use primitive, feature, or other boolean nodes as operands".to_string()),
                                });
                            }
                        }
                    }
                }
                _ => {}
            }
        }

        Ok(())
    }

    fn validate_manufacturing_constraints(
        &self,
        graph: &IRGraph,
        result: &mut ValidationResult,
    ) -> KernelResult<()> {
        let mut manufacturing_score: f64 = 100.0;
        let mut compatible_processes = vec![
            ManufacturingProcess::CNCMilling,
            ManufacturingProcess::CNCTurning,
            ManufacturingProcess::Printing3D,
        ];

        // Analyze each node for manufacturing constraints
        for (_node_id, node) in graph.nodes() {
            match &node.content {
                NodeContent::Feature { .. } => {
                    // Feature-specific manufacturing analysis would go here
                    // This is a simplified example
                    manufacturing_score -= 5.0; // Each feature adds complexity
                }
                NodeContent::Primitive { parameters, .. } => {
                    // Check for manufacturing-unfriendly dimensions
                    if let Some(width) = parameters.get("width") {
                        if *width < 0.5 {
                            result.manufacturing_analysis.constraint_violations.push(
                                ConstraintViolation {
                                    node_id: node.id.clone(),
                                    constraint_type: "MinFeatureSize".to_string(),
                                    severity: ViolationSeverity::Major,
                                    description: "Feature size below manufacturing minimum"
                                        .to_string(),
                                    affected_processes: vec![ManufacturingProcess::CNCMilling],
                                },
                            );
                            manufacturing_score -= 20.0;
                        }
                    }
                }
                _ => {}
            }
        }

        result.manufacturing_analysis.manufacturability_score = manufacturing_score.max(0.0);
        result.manufacturing_analysis.compatible_processes = compatible_processes;

        Ok(())
    }

    fn analyze_performance_issues(
        &self,
        graph: &IRGraph,
        result: &mut ValidationResult,
    ) -> KernelResult<()> {
        let stats = graph.stats();

        // Warn about deep dependency chains
        if stats.max_depth > 10 {
            result.add_warning(ValidationWarning {
                warning_type: ValidationWarningType::Performance,
                node_id: None,
                message: format!(
                    "Deep dependency chain detected (depth: {})",
                    stats.max_depth
                ),
                severity: WarningSeverity::Medium,
                suggestion: Some("Consider flattening the dependency structure".to_string()),
            });
        }

        // Warn about high average dependencies
        if stats.avg_dependencies > 5.0 {
            result.add_warning(ValidationWarning {
                warning_type: ValidationWarningType::Performance,
                node_id: None,
                message: format!(
                    "High average dependencies per node: {:.1}",
                    stats.avg_dependencies
                ),
                severity: WarningSeverity::Low,
                suggestion: Some("Consider reducing inter-node dependencies".to_string()),
            });
        }

        Ok(())
    }

    fn validate_node_content(
        &self,
        node: &IRNode,
        result: &mut ValidationResult,
    ) -> KernelResult<()> {
        // Validate that content matches node type
        let content_type_matches = match (&node.node_type, &node.content) {
            (NodeType::Primitive, NodeContent::Primitive { .. }) => true,
            (NodeType::Feature, NodeContent::Feature { .. }) => true,
            (NodeType::BooleanOp, NodeContent::BooleanOp { .. }) => true,
            (NodeType::Constraint, NodeContent::Constraint { .. }) => true,
            (NodeType::Analysis, NodeContent::Analysis { .. }) => true,
            _ => false,
        };

        if !content_type_matches {
            result.add_error(ValidationError {
                error_type: ValidationErrorType::InvalidContent,
                node_id: Some(node.id.clone()),
                message: "Node content does not match node type".to_string(),
                context: HashMap::new(),
                suggested_fix: Some("Ensure content type matches node type".to_string()),
            });
        }

        Ok(())
    }

    fn validate_node_parameters(
        &self,
        node: &IRNode,
        result: &mut ValidationResult,
    ) -> KernelResult<()> {
        // Node-specific parameter validation
        match &node.content {
            NodeContent::Primitive { parameters, .. } => {
                // Check for negative dimensions
                for (param_name, value) in parameters {
                    if param_name.contains("width")
                        || param_name.contains("height")
                        || param_name.contains("radius")
                        || param_name.contains("diameter")
                    {
                        if *value <= 0.0 {
                            result.add_error(ValidationError {
                                error_type: ValidationErrorType::InvalidParameter,
                                node_id: Some(node.id.clone()),
                                message: format!("Parameter '{}' must be positive", param_name),
                                context: HashMap::new(),
                                suggested_fix: Some(
                                    "Use positive values for geometric dimensions".to_string(),
                                ),
                            });
                        }
                    }
                }
            }
            _ => {}
        }

        Ok(())
    }

    fn validate_node_integrity(
        &self,
        node: &IRNode,
        result: &mut ValidationResult,
    ) -> KernelResult<()> {
        // Verify content hash integrity
        if !node.verify_integrity()? {
            result.add_error(ValidationError {
                error_type: ValidationErrorType::IntegrityViolation,
                node_id: Some(node.id.clone()),
                message: "Node content hash does not match current content".to_string(),
                context: HashMap::new(),
                suggested_fix: Some("Recompute node content hash".to_string()),
            });
        }

        Ok(())
    }

    // Helper methods

    fn are_types_compatible(&self, dep_type: &NodeType, node_type: &NodeType) -> bool {
        match (dep_type, node_type) {
            // Primitives can be used by features and boolean ops
            (NodeType::Primitive, NodeType::Feature) => true,
            (NodeType::Primitive, NodeType::BooleanOp) => true,
            // Features can be used by other features and boolean ops
            (NodeType::Feature, NodeType::Feature) => true,
            (NodeType::Feature, NodeType::BooleanOp) => true,
            // Boolean ops can be used by features and other boolean ops
            (NodeType::BooleanOp, NodeType::Feature) => true,
            (NodeType::BooleanOp, NodeType::BooleanOp) => true,
            // Analysis nodes can depend on any geometric node
            (_, NodeType::Analysis) => self.is_geometric_node(dep_type),
            // Constraints can depend on any node they constrain
            (_, NodeType::Constraint) => true,
            _ => false,
        }
    }

    fn is_geometric_node(&self, node_type: &NodeType) -> bool {
        matches!(
            node_type,
            NodeType::Primitive | NodeType::Feature | NodeType::BooleanOp
        )
    }
}

impl Default for IRValidator {
    fn default() -> Self {
        Self::new()
    }
}

/// Configuration for IR validation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationConfig {
    /// Enable manufacturing constraint validation
    pub validate_manufacturing: bool,
    /// Enable performance analysis
    pub analyze_performance: bool,
    /// Enable strict type checking
    pub strict_typing: bool,
    /// Enable integrity checking
    pub check_integrity: bool,
    /// Maximum allowed dependency depth
    pub max_dependency_depth: usize,
    /// Maximum allowed nodes per graph
    pub max_nodes_per_graph: usize,
}

impl Default for ValidationConfig {
    fn default() -> Self {
        ValidationConfig {
            validate_manufacturing: true,
            analyze_performance: true,
            strict_typing: true,
            check_integrity: true,
            max_dependency_depth: 20,
            max_nodes_per_graph: 1000,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::geometry::ir::node::{NodeContent, NodeMetadata, NodeSource, Transform};

    fn create_test_primitive() -> IRNode {
        let metadata = NodeMetadata::new(Some("test_box".to_string()), NodeSource::User);
        let content = NodeContent::Primitive {
            primitive_type: "box".to_string(),
            parameters: {
                let mut params = std::collections::HashMap::new();
                params.insert("width".to_string(), 10.0);
                params.insert("height".to_string(), 20.0);
                params.insert("depth".to_string(), 5.0);
                params
            },
            transform: None,
        };

        IRNode::new(NodeType::Primitive, content, vec![], metadata).unwrap()
    }

    #[test]
    fn test_node_validation_success() {
        let validator = IRValidator::new();
        let node = create_test_primitive();

        let result = validator.validate_node(&node).unwrap();
        assert!(result.is_valid);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_node_validation_invalid_parameter() {
        let validator = IRValidator::new();
        let metadata = NodeMetadata::new(Some("invalid_box".to_string()), NodeSource::User);
        let content = NodeContent::Primitive {
            primitive_type: "box".to_string(),
            parameters: {
                let mut params = std::collections::HashMap::new();
                params.insert("width".to_string(), -10.0); // Invalid negative width
                params
            },
            transform: None,
        };

        let node = IRNode::new(NodeType::Primitive, content, vec![], metadata).unwrap();
        let result = validator.validate_node(&node).unwrap();

        assert!(!result.is_valid);
        assert!(!result.errors.is_empty());
        assert_eq!(
            result.errors[0].error_type,
            ValidationErrorType::InvalidParameter
        );
    }

    #[test]
    fn test_graph_validation() {
        let mut validator = IRValidator::new();
        let mut graph = IRGraph::new();

        // Add a simple valid node
        let node = create_test_primitive();
        graph.add_node(node).unwrap();

        let result = validator.validate_graph(&graph).unwrap();
        assert!(result.is_valid);
        assert_eq!(result.metrics.nodes_validated, 1);
    }

    #[test]
    fn test_type_compatibility() {
        let validator = IRValidator::new();

        assert!(validator.are_types_compatible(&NodeType::Primitive, &NodeType::Feature));
        assert!(validator.are_types_compatible(&NodeType::Feature, &NodeType::BooleanOp));
        assert!(!validator.are_types_compatible(&NodeType::Analysis, &NodeType::Primitive));
    }

    #[test]
    fn test_validation_result_summary() {
        let mut result = ValidationResult::new();
        assert_eq!(result.summary(), "Validation passed without issues");

        result.add_warning(ValidationWarning {
            warning_type: ValidationWarningType::Performance,
            node_id: None,
            message: "Test warning".to_string(),
            severity: WarningSeverity::Low,
            suggestion: None,
        });
        assert!(result.summary().contains("warnings"));

        result.add_error(ValidationError {
            error_type: ValidationErrorType::InvalidParameter,
            node_id: None,
            message: "Test error".to_string(),
            context: HashMap::new(),
            suggested_fix: None,
        });
        assert!(result.summary().contains("failed"));
    }
}
