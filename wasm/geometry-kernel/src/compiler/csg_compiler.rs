//! High-level CSG compiler orchestration.
//!
//! Combines parsing, evaluation, and optimization into a single
//! compilation pipeline.

use crate::compiler::{CsgEvaluator, IntentParser};
use crate::errors::{KernelError, KernelResult};
use crate::geometry::analysis::bounding_box::compute_bounding_box;
use crate::hashing;
use crate::types::{
    CompileResult, CompileStatus, GeometryIR, ManufacturabilityReport, PreviewMesh,
};
use std::collections::HashMap;

/// High-level CSG compiler
///
/// Orchestrates the full compilation pipeline from Intent IR to geometry.
pub struct CsgCompiler {
    parser: IntentParser,
    evaluator: CsgEvaluator,
    cached_hash: Option<String>,
    cached_result: Option<CompileResult>,
}

impl CsgCompiler {
    pub fn new() -> Self {
        CsgCompiler {
            parser: IntentParser::new(),
            evaluator: CsgEvaluator::new(),
            cached_hash: None,
            cached_result: None,
        }
    }

    pub fn with_subdivisions(subdivisions: u32) -> Self {
        CsgCompiler {
            parser: IntentParser::new(),
            evaluator: CsgEvaluator::with_subdivisions(subdivisions),
            cached_hash: None,
            cached_result: None,
        }
    }

    /// Compile Intent IR to geometry with caching
    pub fn compile(&mut self, ir: &GeometryIR) -> KernelResult<CompileResult> {
        // Compute hash
        let intent_hash = hashing::hash_intent(ir);

        // Check cache
        if let Some(cached_hash) = &self.cached_hash {
            if cached_hash == &intent_hash {
                if let Some(result) = &self.cached_result {
                    return Ok(CompileResult {
                        status: CompileStatus::Cached,
                        ..result.clone()
                    });
                }
            }
        }

        // Validate intent structure
        let csg_tree = self.parser.parse(ir)?;

        // Validate tree structure
        csg_tree.validate()?;

        // Evaluate to mesh
        let mesh = self.evaluator.evaluate(&csg_tree)?;

        // Validate mesh output
        mesh.is_valid()?;

        // Check manufacturability constraints
        let mfg_report = self.check_manufacturability(&mesh, ir)?;

        // Build result
        let result = CompileResult {
            status: CompileStatus::Compiled,
            intent_hash: intent_hash.clone(),
            mesh: Some(mesh),
            step: None,     // TODO: Implement STEP export
            topology: None, // TODO: Implement B-rep extraction
            mfg_report: Some(mfg_report),
            error: None,
        };

        // Update cache
        self.cached_hash = Some(intent_hash);
        self.cached_result = Some(result.clone());

        Ok(result)
    }

    /// Validate intent without full compilation
    pub fn validate(&mut self, ir: &GeometryIR) -> KernelResult<()> {
        let csg_tree = self.parser.parse(ir)?;
        csg_tree.validate()?;
        Ok(())
    }

    /// Check manufacturability constraints
    fn check_manufacturability(
        &self,
        mesh: &PreviewMesh,
        ir: &GeometryIR,
    ) -> KernelResult<ManufacturabilityReport> {
        // Extract constraints from intent
        let mut constraints = HashMap::new();

        for constraint in &ir.constraints {
            match constraint.type_ {
                crate::types::ConstraintType::MinWallThickness => {
                    if let Some(value) = constraint.value.as_f64() {
                        constraints.insert(constraint.type_.clone(), value);
                    }
                }
                crate::types::ConstraintType::ToolDiameter => {
                    if let Some(value) = constraint.value.as_f64() {
                        constraints.insert(constraint.type_.clone(), value);
                    }
                }
                crate::types::ConstraintType::MaxOverhang => {
                    if let Some(value) = constraint.value.as_f64() {
                        constraints.insert(constraint.type_.clone(), value);
                    }
                }
                _ => {}
            }
        }

        // Validate constraints
        let report = crate::geometry::constraints::validate_constraints(mesh, &constraints);

        Ok(report)
    }

    /// Set subdivision level for mesh generation
    pub fn set_subdivisions(&mut self, subdivisions: u32) {
        self.evaluator.set_subdivisions(subdivisions);
        self.clear_cache();
    }

    /// Clear cache
    pub fn clear_cache(&mut self) {
        self.cached_hash = None;
        self.cached_result = None;
        self.evaluator.clear_cache();
    }

    /// Get cache statistics
    pub fn cache_stats(&self) -> CacheStats {
        CacheStats {
            size: self.evaluator.cache.len(),
        }
    }
}

impl Default for CsgCompiler {
    fn default() -> Self {
        Self::new()
    }
}

/// Cache statistics
#[derive(Debug, Clone)]
pub struct CacheStats {
    pub size: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Intent, OperationIntent, OperationType, PrimitiveIntent, PrimitiveType};

    fn create_test_box_intent(id: &str) -> PrimitiveIntent {
        PrimitiveIntent {
            id: id.to_string(),
            type_: PrimitiveType::Box,
            parameters: vec![
                ("width".to_string(), 10.0),
                ("height".to_string(), 10.0),
                ("depth".to_string(), 10.0),
            ]
            .into_iter()
            .collect(),
            transform: None,
            timestamp: 0.0,
        }
    }

    #[test]
    fn test_compile_single_primitive() {
        let mut compiler = CsgCompiler::new();

        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![Intent::Primitive(create_test_box_intent("box1"))],
            constraints: vec![],
        };

        let result = compiler.compile(&ir).unwrap();

        assert_eq!(result.status, CompileStatus::Compiled);
        assert!(result.mesh.is_some());
        assert!(!result.intent_hash.is_empty());
    }

    #[test]
    fn test_compile_union_operation() {
        let mut compiler = CsgCompiler::new();

        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![
                Intent::Primitive(create_test_box_intent("box1")),
                Intent::Primitive(PrimitiveIntent {
                    id: "box2".to_string(),
                    type_: PrimitiveType::Box,
                    parameters: vec![
                        ("width".to_string(), 5.0),
                        ("height".to_string(), 5.0),
                        ("depth".to_string(), 5.0),
                    ]
                    .into_iter()
                    .collect(),
                    transform: None,
                    timestamp: 0.0,
                }),
                Intent::Operation(OperationIntent {
                    id: "union1".to_string(),
                    type_: OperationType::Union,
                    target: "box1".to_string(),
                    operand: Some("box2".to_string()),
                    parameters: HashMap::new(),
                    timestamp: 0.0,
                }),
            ],
            constraints: vec![],
        };

        let result = compiler.compile(&ir).unwrap();

        assert_eq!(result.status, CompileStatus::Compiled);
        assert!(result.mesh.is_some());
    }

    #[test]
    fn test_compile_caching() {
        let mut compiler = CsgCompiler::new();

        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![Intent::Primitive(create_test_box_intent("box1"))],
            constraints: vec![],
        };

        let result1 = compiler.compile(&ir).unwrap();
        let result2 = compiler.compile(&ir).unwrap();

        // Second compile should be cached
        assert_eq!(result1.status, CompileStatus::Compiled);
        assert_eq!(result2.status, CompileStatus::Cached);
        assert_eq!(result1.intent_hash, result2.intent_hash);
    }

    #[test]
    fn test_validate() {
        let compiler = CsgCompiler::new();

        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![Intent::Primitive(create_test_box_intent("box1"))],
            constraints: vec![],
        };

        assert!(compiler.validate(&ir).is_ok());
    }

    #[test]
    fn test_validate_missing_parameter() {
        let compiler = CsgCompiler::new();

        let ir = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![Intent::Primitive(PrimitiveIntent {
                id: "box1".to_string(),
                type_: PrimitiveType::Box,
                parameters: vec![("width".to_string(), 10.0)].into_iter().collect(),
                transform: None,
                timestamp: 0.0,
            })],
            constraints: vec![],
        };

        assert!(compiler.validate(&ir).is_err());
    }
}
