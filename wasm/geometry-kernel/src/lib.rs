use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[wasm_bindgen]
pub struct GeometryKernel {
    intent_hash: String,
    topology: Option<CanonicalSolid>,
}

#[wasm_bindgen]
impl GeometryKernel {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GeometryKernel {
        // Set panic hook for better error messages in browser
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();
        
        GeometryKernel {
            intent_hash: String::new(),
            topology: None,
        }
    }
    
    /**
     * Core method: Compile intent to geometry
     * Input: JSON string of GeometryIR
     * Output: JSON with mesh, STEP, hash, etc.
     */
    #[wasm_bindgen]
    pub fn compile_intent(&mut self, intent_json: &str) -> String {
        match self.compile_internal(intent_json) {
            Ok(output) => serde_json::to_string(&output).unwrap_or_else(|e| {
                let error = KernelError {
                    message: format!("Failed to serialize output: {}", e),
                    code: "SERIALIZE_ERROR".to_string(),
                };
                serde_json::to_string(&error).unwrap()
            }),
            Err(e) => {
                let error = KernelError {
                    message: e,
                    code: "COMPILE_ERROR".to_string(),
                };
                serde_json::to_string(&error).unwrap()
            }
        }
    }
    
    fn compile_internal(&mut self, intent_json: &str) -> Result<KernelOutput, String> {
        // Parse intent
        let intent: GeometryIR = serde_json::from_str(intent_json)
            .map_err(|e| format!("Invalid intent JSON: {}", e))?;
        
        // Check if cached
        let intent_hash = self.hash_intent(intent_json);
        if self.intent_hash == intent_hash {
            // Return cached result (for now, return empty since we don't have full implementation)
            return Ok(KernelOutput {
                topology: self.topology.clone(),
                mesh: None,
                step: None,
                intent_hash,
                status: "cached".to_string(),
            });
        }
        
        // TODO: Implement full compilation pipeline
        // For now, return a stub that indicates the kernel is working but not fully implemented
        
        // Compile CSG tree (stub)
        let _csg_tree = self.compile_intent_to_csg(&intent)?;
        
        // Check manufacturability (stub)
        // self.validate_manufacturability(&csg_tree, &intent)?;
        
        // Collapse CSG → B-rep (stub)
        // let topology = self.collapse_csg_to_brep(csg_tree)?;
        
        // Generate mesh for preview (stub)
        // let mesh = self.topology_to_mesh(&topology)?;
        
        // Export to STEP (stub)
        // let step = self.export_to_step(&topology)?;
        
        self.intent_hash = intent_hash.clone();
        // self.topology = Some(topology.clone());
        
        Ok(KernelOutput {
            topology: None,
            mesh: None,
            step: None,
            intent_hash,
            status: "compiled".to_string(),
        })
    }
    
    fn hash_intent(&self, intent_json: &str) -> String {
        // Use blake3 for deterministic hashing
        let hash = blake3::hash(intent_json.as_bytes());
        format!("intent_{}", hash.to_hex())
    }
    
    // Stub implementations (to be filled in)
    fn compile_intent_to_csg(&self, intent: &GeometryIR) -> Result<CsgNode, String> {
        // Convert intent operations to CSG tree
        // For now, just validate that we have operations
        if intent.operations.is_empty() {
            return Err("No operations in intent".to_string());
        }
        
        // Return stub CSG node
        Ok(CsgNode::Primitive {
            type_: "box".to_string(),
            params: HashMap::new(),
        })
    }
    
    #[allow(dead_code)]
    fn validate_manufacturability(&self, _csg: &CsgNode, _intent: &GeometryIR) -> Result<(), String> {
        // Enforce manufacturing constraints
        // Wall thickness, tool diameter, overhang angles
        // TODO: Implement manufacturability validation
        Ok(())
    }
    
    #[allow(dead_code)]
    fn collapse_csg_to_brep(&self, _csg: CsgNode) -> Result<CanonicalSolid, String> {
        // This is the critical step - deterministic conversion
        // TODO: Implement CSG → B-rep collapse
        Ok(CanonicalSolid {
            vertices: vec![],
            edges: vec![],
            faces: vec![],
            hash: String::new(),
        })
    }
    
    #[allow(dead_code)]
    fn topology_to_mesh(&self, _topology: &CanonicalSolid) -> Result<PreviewMesh, String> {
        // Convert canonical topology to triangle mesh for preview
        // TODO: Implement mesh generation
        Ok(PreviewMesh {
            vertices: vec![],
            indices: vec![],
            normals: vec![],
        })
    }
    
    #[allow(dead_code)]
    fn export_to_step(&self, _topology: &CanonicalSolid) -> Result<Vec<u8>, String> {
        // Export to STEP format for manufacturing
        // TODO: Implement STEP export
        Ok(vec![])
    }
}

// Data structures sent to/from kernel

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeometryIR {
    pub part: String,
    pub operations: Vec<Intent>,
    pub constraints: Vec<ManufacturingConstraint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Intent {
    Primitive {
        id: String,
        #[serde(rename = "type")]
        type_: String,
        parameters: HashMap<String, f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        transform: Option<Transform>,
        timestamp: f64,
    },
    Operation {
        id: String,
        #[serde(rename = "type")]
        type_: String,
        target: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        operand: Option<String>,
        parameters: HashMap<String, serde_json::Value>,
        timestamp: f64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transform {
    #[serde(skip_serializing_if = "Option::is_none")]
    position: Option<[f64; 3]>,
    #[serde(skip_serializing_if = "Option::is_none")]
    rotation: Option<[f64; 3]>,
    #[serde(skip_serializing_if = "Option::is_none")]
    scale: Option<[f64; 3]>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManufacturingConstraint {
    #[serde(rename = "type")]
    pub type_: String,
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanonicalSolid {
    pub vertices: Vec<[f64; 3]>,
    pub edges: Vec<(usize, usize)>,
    pub faces: Vec<Vec<usize>>,
    pub hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewMesh {
    pub vertices: Vec<f32>,
    pub indices: Vec<u32>,
    pub normals: Vec<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KernelOutput {
    pub topology: Option<CanonicalSolid>,
    pub mesh: Option<PreviewMesh>,
    pub step: Option<Vec<u8>>,
    pub intent_hash: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KernelError {
    pub message: String,
    pub code: String,
}

// CSG tree representation
#[derive(Debug, Clone)]
pub enum CsgNode {
    Primitive {
        type_: String,
        params: HashMap<String, f64>,
    },
    Union(Box<CsgNode>, Box<CsgNode>),
    Difference(Box<CsgNode>, Box<CsgNode>),
    Intersection(Box<CsgNode>, Box<CsgNode>),
}
