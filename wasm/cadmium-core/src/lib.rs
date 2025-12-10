// cadmium-core: Client-side WASM geometry engine
// Supports constraint solving, parametric extrusion, basic mesh generation

use std::collections::HashMap;
use wasm_bindgen::prelude::*;

// ============ TYPES ============

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Point {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Mesh {
    pub vertices: Vec<f64>,
    pub faces: Vec<u32>,
    pub normals: Vec<f64>,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct BoundingBox {
    pub min_x: f64,
    pub min_y: f64,
    pub min_z: f64,
    pub max_x: f64,
    pub max_y: f64,
    pub max_z: f64,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct ConstraintOp {
    pub constraint_type: String, // "equal", "perpendicular", "parallel", "distance"
    pub entity_ids: Vec<String>,
    pub value: Option<f64>,
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct OperationLog {
    pub operations: Vec<Operation>,
    pub parameter_values: HashMap<String, f64>,
}

#[derive(Clone, Debug)]
pub struct Operation {
    pub op_id: String,
    pub op_type: String, // "sketch", "constraint", "extrude", etc.
    pub payload: String, // JSON serialized
    pub hash: String,    // SHA256 for determinism
}

// ============ ASSET VALIDATION ============

#[wasm_bindgen]
pub fn validate_asset(asset_data: &[u8]) -> Result<JsValue, JsValue> {
    // Minimal validation: check file header for STEP/IGES/STL magic bytes
    if asset_data.len() < 4 {
        return Err(JsValue::from_str("Invalid file: too small"));
    }

    let is_step = asset_data.windows(5).any(|w| w == b"ISO-10");
    let is_stl = asset_data.windows(5).any(|w| w == b"solid");

    if !is_step && !is_stl {
        return Err(JsValue::from_str(
            "Unsupported format. Expected STEP, IGES, or STL.",
        ));
    }

    #[derive(serde::Serialize)]
    struct ValidationResult {
        status: String,
        format: String,
        size_bytes: usize,
        issues: Vec<String>,
    }

    let result = ValidationResult {
        status: "valid".to_string(),
        format: if is_step {
            "STEP".to_string()
        } else {
            "STL".to_string()
        },
        size_bytes: asset_data.len(),
        issues: vec![],
    };

    Ok(serde_wasm_bindgen::to_value(&result).unwrap())
}

// ============ PARAMETRIC GEOMETRY ============

#[wasm_bindgen]
pub fn apply_parameters(
    params: &str, // JSON: { "length": 100, "width": 50, "height": 25 }
) -> Result<JsValue, JsValue> {
    // Parse parameters
    let parsed: HashMap<String, f64> = serde_json::from_str(params)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    // Simple demo: generate a box with given dimensions
    let length = parsed.get("length").copied().unwrap_or(100.0);
    let width = parsed.get("width").copied().unwrap_or(50.0);
    let height = parsed.get("height").copied().unwrap_or(25.0);

    let mesh = generate_box_mesh(length, width, height);

    #[derive(serde::Serialize)]
    struct ParametricResult {
        mesh: MeshResponse,
        bounding_box: BoundingBoxResponse,
    }

    #[derive(serde::Serialize)]
    struct MeshResponse {
        vertex_count: usize,
        face_count: usize,
        hash: String,
    }

    #[derive(serde::Serialize)]
    struct BoundingBoxResponse {
        min: [f64; 3],
        max: [f64; 3],
    }

    let bbox = compute_bounding_box(&mesh);

    let result = ParametricResult {
        mesh: MeshResponse {
            vertex_count: mesh.vertices.len() / 3,
            face_count: mesh.faces.len() / 3,
            hash: compute_mesh_hash(&mesh),
        },
        bounding_box: BoundingBoxResponse {
            min: [bbox.min_x, bbox.min_y, bbox.min_z],
            max: [bbox.max_x, bbox.max_y, bbox.max_z],
        },
    };

    Ok(serde_wasm_bindgen::to_value(&result).unwrap())
}

// ============ CONSTRAINT SOLVING (STUB) ============

#[wasm_bindgen]
pub fn solve_constraint(constraint_json: &str) -> Result<JsValue, JsValue> {
    // Parse constraint operation
    let _constraint: ConstraintOp = serde_json::from_str(constraint_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid constraint JSON: {}", e)))?;

    // In a real implementation, this would use a constraint solver like SolveSpace
    // For now, return a success stub

    #[derive(serde::Serialize)]
    struct ConstraintResult {
        status: String,
        message: String,
    }

    let result = ConstraintResult {
        status: "solved".to_string(),
        message: "Constraint solved successfully (stub)".to_string(),
    };

    Ok(serde_wasm_bindgen::to_value(&result).unwrap())
}

// ============ MESH GENERATION ============

fn generate_box_mesh(length: f64, width: f64, height: f64) -> Mesh {
    // Simple box: 8 vertices, 12 triangles (6 faces)
    let l = length / 2.0;
    let w = width / 2.0;
    let h = height / 2.0;

    let vertices = vec![
        -l, -w, -h, // 0
        l, -w, -h, // 1
        l, w, -h, // 2
        -l, w, -h, // 3
        -l, -w, h, // 4
        l, -w, h, // 5
        l, w, h, // 6
        -l, w, h, // 7
    ];

    // 12 triangles (2 per face)
    let faces = vec![
        // bottom
        0, 1, 2, 0, 2, 3, // top
        4, 6, 5, 4, 7, 6, // front
        0, 5, 1, 0, 4, 5, // back
        2, 7, 3, 2, 6, 7, // left
        0, 3, 7, 0, 7, 4, // right
        1, 5, 6, 1, 6, 2,
    ];

    // Compute normals per face (simplified: use face normal for all vertices)
    let mut normals = vec![0.0; vertices.len()];
    for i in (0..faces.len()).step_by(3) {
        let a = faces[i] as usize;
        let b = faces[i + 1] as usize;
        let c = faces[i + 2] as usize;

        let v0 = [vertices[a * 3], vertices[a * 3 + 1], vertices[a * 3 + 2]];
        let v1 = [vertices[b * 3], vertices[b * 3 + 1], vertices[b * 3 + 2]];
        let v2 = [vertices[c * 3], vertices[c * 3 + 1], vertices[c * 3 + 2]];

        let e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        let e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

        let nx = e1[1] * e2[2] - e1[2] * e2[1];
        let ny = e1[2] * e2[0] - e1[0] * e2[2];
        let nz = e1[0] * e2[1] - e1[1] * e2[0];
        let len = (nx * nx + ny * ny + nz * nz).sqrt();

        if len > 0.0 {
            for j in [a, b, c] {
                normals[j * 3] += nx / len;
                normals[j * 3 + 1] += ny / len;
                normals[j * 3 + 2] += nz / len;
            }
        }
    }

    Mesh {
        vertices,
        faces,
        normals,
    }
}

fn compute_bounding_box(mesh: &Mesh) -> BoundingBox {
    let mut min_x = f64::INFINITY;
    let mut min_y = f64::INFINITY;
    let mut min_z = f64::INFINITY;
    let mut max_x = f64::NEG_INFINITY;
    let mut max_y = f64::NEG_INFINITY;
    let mut max_z = f64::NEG_INFINITY;

    for i in (0..mesh.vertices.len()).step_by(3) {
        min_x = min_x.min(mesh.vertices[i]);
        max_x = max_x.max(mesh.vertices[i]);
        min_y = min_y.min(mesh.vertices[i + 1]);
        max_y = max_y.max(mesh.vertices[i + 1]);
        min_z = min_z.min(mesh.vertices[i + 2]);
        max_z = max_z.max(mesh.vertices[i + 2]);
    }

    BoundingBox {
        min_x,
        min_y,
        min_z,
        max_x,
        max_y,
        max_z,
    }
}

fn compute_mesh_hash(mesh: &Mesh) -> String {
    use sha2::{Sha256, Digest};

    let mut hasher = Sha256::new();
    for &v in &mesh.vertices {
        hasher.update(v.to_le_bytes());
    }
    for &f in &mesh.faces {
        hasher.update(f.to_le_bytes());
    }

    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_stl() {
        let stl_header = b"solid test";
        let result = validate_asset(stl_header);
        assert!(result.is_ok());
    }

    #[test]
    fn test_apply_parameters() {
        let params = r#"{"length": 100, "width": 50, "height": 25}"#;
        let result = apply_parameters(params);
        assert!(result.is_ok());
    }

    #[test]
    fn test_deterministic_mesh() {
        let mesh1 = generate_box_mesh(100.0, 50.0, 25.0);
        let mesh2 = generate_box_mesh(100.0, 50.0, 25.0);

        let hash1 = compute_mesh_hash(&mesh1);
        let hash2 = compute_mesh_hash(&mesh2);

        assert_eq!(hash1, hash2, "Mesh generation must be deterministic");
    }
}
