//! Intent to geometry compilation pipeline.
//!
//! This module orchestrates the compilation of Intent IR into
//! preview meshes and STEP exports through CSG tree construction.

pub mod csg_tree;
pub mod intent_parser;
pub mod csg_evaluator;
pub mod csg_compiler;

pub use csg_tree::*;
pub use intent_parser::*;
pub use csg_evaluator::*;
pub use csg_compiler::*;

use crate::types::PreviewMesh;
use crate::errors::{KernelError, KernelResult};
use crate::types::{GeometryIR, CompileResult, CompileStatus};
use crate::hashing;

/// Main compiler entry point
///
/// Compiles Intent IR to geometry with caching support
pub struct GeometryCompiler {
    cached_hash: Option<String>,
    cached_result: Option<CompileResult>,
}

impl GeometryCompiler {
    pub fn new() -> Self {
        GeometryCompiler {
            cached_hash: None,
            cached_result: None,
        }
    }

    /// Compile intent IR to geometry
    pub fn compile(&mut self, ir: &GeometryIR) -> KernelResult<CompileResult> {
        // Check cache
        let intent_hash = hashing::hash_intent(ir);
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

        // Parse intent to CSG tree
        let mut parser = IntentParser::new();
        let csg_tree = parser.parse(ir)?;

        // Evaluate CSG tree to mesh
        let mut evaluator = CsgEvaluator::new();
        let mesh = evaluator.evaluate(&csg_tree)?;

        // Compile result
        let result = CompileResult {
            status: CompileStatus::Compiled,
            intent_hash: intent_hash.clone(),
            mesh: Some(mesh),
            step: None, // TODO: Implement STEP export
            topology: None, // TODO: Implement B-rep topology
            mfg_report: None, // TODO: Implement manufacturability validation
            error: None,
        };

        // Update cache
        self.cached_hash = Some(intent_hash);
        self.cached_result = Some(result.clone());

        Ok(result)
    }

    /// Pre-flight validation without compilation
    pub fn validate(&self, ir: &GeometryIR) -> KernelResult<()> {
        let mut parser = IntentParser::new();
        let _csg_tree = parser.parse(ir)?;
        Ok(())
    }

    /// Clear cache
    pub fn clear_cache(&mut self) {
        self.cached_hash = None;
        self.cached_result = None;
    }
}

impl Default for GeometryCompiler {
    fn default() -> Self {
        Self::new()
    }
}
