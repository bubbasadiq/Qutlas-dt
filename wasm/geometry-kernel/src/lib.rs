//! Geometry Kernel for Adam CAD Platform
//!
//! This is a production-grade Rust/WASM geometry compiler that:
//! - Parses Intent IR (from TypeScript) into CSG trees
//! - Compiles CSG to deterministic B-rep topology
//! - Generates optimized triangle meshes for preview
//! - Validates manufacturability constraints
//! - Exports STEP files for manufacturing
//!
//! # Architecture
//!
//! - `types`: Core data structures (Intent, CSG, Mesh, etc.)
//! - `errors`: Error handling with JSON serialization
//! - `hashing`: Deterministic content-addressed caching
//! - `geometry`: Primitives, boolean operations, bounding boxes
//! - `compiler`: Intent parsing, CSG evaluation, compilation
//!
//! # Usage
//!
//! ```typescript
//! import { GeometryKernel } from './geometry-kernel';
//!
//! const kernel = new GeometryKernel();
//! const result = kernel.compile_intent(JSON.stringify(intentIR));
//! ```
//!
//! The kernel always returns valid JSON, even on errors.

#![allow(clippy::too_many_arguments)]
#![cfg_attr(target_arch = "wasm32", allow(clippy::arc_with_non_send_sync))]

use wasm_bindgen::prelude::*;

mod types;
mod errors;
mod hashing;
mod geometry;
mod compiler;

use compiler::CsgCompiler;
use types::*;
use errors::KernelError;

/// WASM entry point for the geometry kernel
#[wasm_bindgen]
pub struct GeometryKernel {
    compiler: CsgCompiler,
}

#[wasm_bindgen]
impl GeometryKernel {
    /// Create a new geometry kernel instance
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        // Set panic hook for better error messages in browser console
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();

        GeometryKernel {
            compiler: CsgCompiler::new(),
        }
    }

    /// Compile intent JSON to geometry
    ///
    /// # Arguments
    /// * `intent_json` - JSON string of GeometryIR
    ///
    /// # Returns
    /// JSON string of CompileResult with:
    /// - status: "compiled" | "cached" | "error"
    /// - intent_hash: Content-addressed hash
    /// - mesh: Preview mesh (vertices, indices, normals)
    /// - mfg_report: Manufacturability validation results
    /// - error: Error details if compilation failed
    ///
    /// # Example
    /// ```typescript
    /// const result = kernel.compile_intent('{"part":"test","operations":[...]}');
    /// const data = JSON.parse(result);
    /// if (data.status === "compiled") {
    ///   const mesh = data.mesh;
    ///   // Render mesh in Three.js
    /// }
    /// ```
    #[wasm_bindgen]
    pub fn compile_intent(&mut self, intent_json: &str) -> String {
        // Always return valid JSON
        self.compile_internal(intent_json).unwrap_or_else(|error| {
            serde_json::to_string(&error).unwrap_or_else(|_| {
                // Fallback if even error serialization fails
                r#"{"status":"error","error":{"code":"INTERNAL_ERROR","message":"Failed to serialize error"}}"#.to_string()
            })
        })
    }

    fn compile_internal(&mut self, intent_json: &str) -> Result<String, KernelError> {
        // Parse JSON input
        let ir: GeometryIR = serde_json::from_str(intent_json)
            .map_err(|e| {
                KernelError::invalid_json(format!("Invalid intent JSON: {}", e))
                    .with_context(errors::ErrorContext::new())
            })?;

        // Compile intent to geometry
        let result = self.compiler.compile(&ir)
            .map_err(|e| {
                e
            })?;

        // Serialize result to JSON
        serde_json::to_string(&result)
            .map_err(|e| KernelError::internal(format!("Failed to serialize result: {}", e)))
    }

    /// Validate intent without full compilation
    ///
    /// # Arguments
    /// * `intent_json` - JSON string of GeometryIR
    ///
    /// # Returns
    /// JSON string with validation result
    ///
    /// This is useful for pre-flight validation to check if an intent
    /// is structurally valid before attempting full compilation.
    #[wasm_bindgen]
    pub fn validate_csg(&mut self, intent_json: &str) -> String {
        let result: Result<(), KernelError> = (|| -> Result<(), KernelError> {
            let ir: GeometryIR = serde_json::from_str(intent_json)
                .map_err(|e| KernelError::invalid_json(format!("Invalid intent JSON: {}", e)))?;

            self.compiler.validate(&ir)
        })();

        match result {
            Ok(()) => {
                serde_json::json!({
                    "valid": true,
                    "error": null
                }).to_string()
            }
            Err(e) => {
                serde_json::json!({
                    "valid": false,
                    "error": e
                }).to_string()
            }
        }
    }

    /// Get kernel version information
    ///
    /// # Returns
    /// JSON string with version details
    #[wasm_bindgen]
    pub fn get_kernel_version(&self) -> String {
        serde_json::json!({
            "name": "qutlas-geometry-kernel",
            "version": env!("CARGO_PKG_VERSION"),
            "rustc": env!("CARGO_PKG_RUST_VERSION"),
            "features": []
        }).to_string()
    }

    /// Clear compilation cache
    ///
    /// Useful for freeing memory or forcing recompilation
    #[wasm_bindgen]
    pub fn clear_cache(&mut self) {
        self.compiler.clear_cache();
    }

    /// Get cache statistics
    ///
    /// # Returns
    /// JSON string with cache size and hit information
    #[wasm_bindgen]
    pub fn get_cache_stats(&self) -> String {
        let stats = self.compiler.cache_stats();
        serde_json::json!({
            "size": stats.size
        }).to_string()
    }

    /// Set mesh subdivision level
    ///
    /// # Arguments
    /// * `subdivisions` - Number of subdivisions for curved primitives (4-64)
    ///
    /// Higher values produce smoother meshes but increase memory and computation time
    #[wasm_bindgen]
    pub fn set_subdivisions(&mut self, subdivisions: u32) {
        self.compiler.set_subdivisions(subdivisions);
    }
}

impl Default for GeometryKernel {
    fn default() -> Self {
        Self::new()
    }
}

// Export non-WASM types for testing
#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Intent, PrimitiveIntent, OperationIntent, PrimitiveType, OperationType};
    use std::collections::HashMap;

    fn create_simple_box_intent() -> GeometryIR {
        GeometryIR {
            part: "test_part".to_string(),
            operations: vec![Intent::Primitive(PrimitiveIntent {
                id: "box1".to_string(),
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
            })],
            constraints: vec![],
        }
    }

    #[test]
    fn test_kernel_instantiation() {
        let kernel = GeometryKernel::new();
        let version_json = kernel.get_kernel_version();
        assert!(version_json.contains("qutlas-geometry-kernel"));
    }

    #[test]
    fn test_compile_simple_box() {
        let mut kernel = GeometryKernel::new();
        let intent = create_simple_box_intent();
        let intent_json = serde_json::to_string(&intent).unwrap();

        let result_json = kernel.compile_intent(&intent_json);
        let result: CompileResult = serde_json::from_str(&result_json).unwrap();

        assert_eq!(result.status, CompileStatus::Compiled);
        assert!(result.mesh.is_some());
        assert!(!result.intent_hash.is_empty());
    }

    #[test]
    fn test_compile_caching() {
        let mut kernel = GeometryKernel::new();
        let intent = create_simple_box_intent();
        let intent_json = serde_json::to_string(&intent).unwrap();

        let result1_json = kernel.compile_intent(&intent_json);
        let result1: CompileResult = serde_json::from_str(&result1_json).unwrap();

        let result2_json = kernel.compile_intent(&intent_json);
        let result2: CompileResult = serde_json::from_str(&result2_json).unwrap();

        assert_eq!(result1.status, CompileStatus::Compiled);
        assert_eq!(result2.status, CompileStatus::Cached);
        assert_eq!(result1.intent_hash, result2.intent_hash);
    }

    #[test]
    fn test_validate_valid_intent() {
        let kernel = GeometryKernel::new();
        let intent = create_simple_box_intent();
        let intent_json = serde_json::to_string(&intent).unwrap();

        let result_json = kernel.validate_csg(&intent_json);
        let result: serde_json::Value = serde_json::from_str(&result_json).unwrap();

        assert_eq!(result["valid"], true);
    }

    #[test]
    fn test_compile_union_operation() {
        let mut kernel = GeometryKernel::new();

        let intent = GeometryIR {
            part: "test_part".to_string(),
            operations: vec![
                Intent::Primitive(PrimitiveIntent {
                    id: "box1".to_string(),
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
                }),
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

        let intent_json = serde_json::to_string(&intent).unwrap();
        let result_json = kernel.compile_intent(&intent_json);
        let result: CompileResult = serde_json::from_str(&result_json).unwrap();

        assert_eq!(result.status, CompileStatus::Compiled);
        assert!(result.mesh.is_some());
    }

    #[test]
    fn test_compile_error_handling() {
        let mut kernel = GeometryKernel::new();

        // Invalid JSON
        let result_json = kernel.compile_intent("{invalid json}");
        let result: serde_json::Value = serde_json::from_str(&result_json).unwrap();

        // Should still return valid JSON even on error
        assert!(result.is_object());
    }

    #[test]
    fn test_subdivisions() {
        let mut kernel = GeometryKernel::new();

        kernel.set_subdivisions(8);
        kernel.set_subdivisions(64); // Should clamp to 64
        kernel.set_subdivisions(2); // Should clamp to 4
    }

    #[test]
    fn test_clear_cache() {
        let mut kernel = GeometryKernel::new();
        let intent = create_simple_box_intent();
        let intent_json = serde_json::to_string(&intent).unwrap();

        kernel.compile_intent(&intent_json);
        let stats_json = kernel.get_cache_stats();
        let stats: serde_json::Value = serde_json::from_str(&stats_json).unwrap();

        assert!(stats["size"].as_i64().unwrap_or(0) > 0);

        kernel.clear_cache();
        let stats_json = kernel.get_cache_stats();
        let stats: serde_json::Value = serde_json::from_str(&stats_json).unwrap();

        assert_eq!(stats["size"].as_i64().unwrap_or(0), 0);
    }

    #[test]
    fn test_all_primitives() {
        let mut kernel = GeometryKernel::new();

        let primitives = vec![
            (PrimitiveType::Box, vec![
                ("width".to_string(), 10.0),
                ("height".to_string(), 10.0),
                ("depth".to_string(), 10.0),
            ]),
            (PrimitiveType::Cylinder, vec![
                ("radius".to_string(), 5.0),
                ("height".to_string(), 10.0),
            ]),
            (PrimitiveType::Sphere, vec![
                ("radius".to_string(), 5.0),
            ]),
            (PrimitiveType::Cone, vec![
                ("radius".to_string(), 5.0),
                ("height".to_string(), 10.0),
            ]),
            (PrimitiveType::Torus, vec![
                ("major_radius".to_string(), 10.0),
                ("minor_radius".to_string(), 3.0),
            ]),
        ];

        for (type_, params) in primitives {
            let intent = GeometryIR {
                part: "test_part".to_string(),
                operations: vec![Intent::Primitive(PrimitiveIntent {
                    id: format!("{:?}_test", type_),
                    type_,
                    parameters: params.into_iter().collect(),
                    transform: None,
                    timestamp: 0.0,
                })],
                constraints: vec![],
            };

            let intent_json = serde_json::to_string(&intent).unwrap();
            let result_json = kernel.compile_intent(&intent_json);
            let result: CompileResult = serde_json::from_str(&result_json).unwrap();

            assert_eq!(result.status, CompileStatus::Compiled);
            assert!(result.mesh.is_some());
        }
    }
}
