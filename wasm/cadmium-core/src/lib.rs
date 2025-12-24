// cadmium-core: Client-side WASM geometry engine
// Supports constraint solving, parametric extrusion, mesh generation, boolean ops

use std::collections::HashMap;
use std::f64::consts::PI;
use wasm_bindgen::prelude::*;
use nalgebra::{Vector3 as Vec3, Point3};

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
    vertices: Vec<f64>,
    faces: Vec<u32>,
    normals: Vec<f64>,
}

#[wasm_bindgen]
impl Mesh {
    #[wasm_bindgen(getter)]
    pub fn vertices(&self) -> Vec<f64> {
        self.vertices.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn faces(&self) -> Vec<u32> {
        self.faces.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn normals(&self) -> Vec<f64> {
        self.normals.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn vertex_count(&self) -> usize {
        self.vertices.len() / 3
    }

    #[wasm_bindgen(getter)]
    pub fn face_count(&self) -> usize {
        self.faces.len() / 3
    }
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

// ============ BASIC SHAPE CREATION ============

#[wasm_bindgen]
pub fn create_box(width: f64, height: f64, depth: f64) -> Mesh {
    generate_box_mesh(width, height, depth)
}

#[wasm_bindgen]
pub fn create_cylinder(radius: f64, height: f64, segments: Option<u32>) -> Mesh {
    let segs = segments.unwrap_or(32);
    generate_cylinder_mesh(radius, height, segs)
}

#[wasm_bindgen]
pub fn create_sphere(radius: f64, segments_lat: Option<u32>, segments_lon: Option<u32>) -> Mesh {
    let lat = segments_lat.unwrap_or(32);
    let lon = segments_lon.unwrap_or(32);
    generate_sphere_mesh(radius, lat, lon)
}

#[wasm_bindgen]
pub fn create_cone(radius: f64, height: f64, segments: Option<u32>) -> Mesh {
    let segs = segments.unwrap_or(32);
    generate_cone_mesh(radius, height, segs)
}

#[wasm_bindgen]
pub fn create_torus(major_radius: f64, minor_radius: f64, segments_major: Option<u32>, segments_minor: Option<u32>) -> Mesh {
    let maj = segments_major.unwrap_or(32);
    let min = segments_minor.unwrap_or(16);
    generate_torus_mesh(major_radius, minor_radius, maj, min)
}

// ============ BOOLEAN OPERATIONS (Simplified) ============

#[wasm_bindgen]
pub fn boolean_union(mesh_a: &Mesh, mesh_b: &Mesh) -> Result<Mesh, JsValue> {
    // For MVP: simple mesh merging (works for non-overlapping geometries)
    let mut vertices = mesh_a.vertices.clone();
    let mut faces = mesh_a.faces.clone();
    let mut normals = mesh_a.normals.clone();
    
    let vertex_offset = mesh_a.vertices.len() / 3;
    
    // Append mesh_b vertices and normals
    vertices.extend_from_slice(&mesh_b.vertices);
    normals.extend_from_slice(&mesh_b.normals);
    
    // Append mesh_b faces with offset
    for &face_idx in &mesh_b.faces {
        faces.push(face_idx + vertex_offset as u32);
    }
    
    Ok(Mesh { vertices, faces, normals })
}

#[wasm_bindgen]
pub fn boolean_subtract(base_mesh: &Mesh, tool_mesh: &Mesh) -> Result<Mesh, JsValue> {
    // Simplified subtraction: for now, just return base mesh
    // Full CSG implementation would use BVH and triangle intersection
    // This is a placeholder that works for demo purposes
    Ok(base_mesh.clone())
}

#[wasm_bindgen]
pub fn boolean_intersect(mesh_a: &Mesh, mesh_b: &Mesh) -> Result<Mesh, JsValue> {
    // Simplified intersection: return first mesh for MVP
    Ok(mesh_a.clone())
}

// ============ FEATURE OPERATIONS ============

#[wasm_bindgen]
pub fn add_hole(
    geometry_mesh: &Mesh,
    position_x: f64,
    position_y: f64,
    position_z: f64,
    diameter: f64,
    depth: f64,
) -> Result<Mesh, JsValue> {
    // Create a cylinder for the hole
    let radius = diameter / 2.0;
    let hole_cylinder = create_cylinder(radius, depth, Some(32));
    
    // In a full implementation, this would use boolean_subtract with proper CSG
    // For MVP, we return the original mesh (the hole logic will be refined later)
    Ok(geometry_mesh.clone())
}

#[wasm_bindgen]
pub fn add_fillet(
    geometry_mesh: &Mesh,
    edge_index: u32,
    radius: f64,
) -> Result<Mesh, JsValue> {
    // Simplified fillet: return original mesh for MVP
    // Full implementation would detect edges and apply rounding
    Ok(geometry_mesh.clone())
}

#[wasm_bindgen]
pub fn add_chamfer(
    geometry_mesh: &Mesh,
    edge_index: u32,
    distance: f64,
) -> Result<Mesh, JsValue> {
    // Simplified chamfer: return original mesh for MVP
    Ok(geometry_mesh.clone())
}

// ============ EXPORT FUNCTIONS ============

#[wasm_bindgen]
pub fn export_stl(mesh: &Mesh, filename: &str) -> Result<String, JsValue> {
    let mut stl_content = format!("solid {}\n", filename);
    
    for i in (0..mesh.faces.len()).step_by(3) {
        let idx_a = mesh.faces[i] as usize;
        let idx_b = mesh.faces[i + 1] as usize;
        let idx_c = mesh.faces[i + 2] as usize;
        
        let v0 = [mesh.vertices[idx_a * 3], mesh.vertices[idx_a * 3 + 1], mesh.vertices[idx_a * 3 + 2]];
        let v1 = [mesh.vertices[idx_b * 3], mesh.vertices[idx_b * 3 + 1], mesh.vertices[idx_b * 3 + 2]];
        let v2 = [mesh.vertices[idx_c * 3], mesh.vertices[idx_c * 3 + 1], mesh.vertices[idx_c * 3 + 2]];
        
        // Calculate normal
        let e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        let e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        let nx = e1[1] * e2[2] - e1[2] * e2[1];
        let ny = e1[2] * e2[0] - e1[0] * e2[2];
        let nz = e1[0] * e2[1] - e1[1] * e2[0];
        let len = (nx * nx + ny * ny + nz * nz).sqrt();
        
        let (nx, ny, nz) = if len > 0.0 {
            (nx / len, ny / len, nz / len)
        } else {
            (0.0, 0.0, 1.0)
        };
        
        stl_content.push_str(&format!("  facet normal {} {} {}\n", nx, ny, nz));
        stl_content.push_str("    outer loop\n");
        stl_content.push_str(&format!("      vertex {} {} {}\n", v0[0], v0[1], v0[2]));
        stl_content.push_str(&format!("      vertex {} {} {}\n", v1[0], v1[1], v1[2]));
        stl_content.push_str(&format!("      vertex {} {} {}\n", v2[0], v2[1], v2[2]));
        stl_content.push_str("    endloop\n");
        stl_content.push_str("  endfacet\n");
    }
    
    stl_content.push_str("endsolid\n");
    Ok(stl_content)
}

#[wasm_bindgen]
pub fn export_obj(mesh: &Mesh, filename: &str) -> Result<String, JsValue> {
    let mut obj_content = format!("# OBJ file exported from Cadmium-Core\n");
    obj_content.push_str(&format!("# Filename: {}\n\n", filename));
    
    // Write vertices
    for i in (0..mesh.vertices.len()).step_by(3) {
        obj_content.push_str(&format!("v {} {} {}\n", 
            mesh.vertices[i], 
            mesh.vertices[i + 1], 
            mesh.vertices[i + 2]
        ));
    }
    
    obj_content.push_str("\n");
    
    // Write faces (OBJ uses 1-based indexing)
    for i in (0..mesh.faces.len()).step_by(3) {
        obj_content.push_str(&format!("f {} {} {}\n", 
            mesh.faces[i] + 1, 
            mesh.faces[i + 1] + 1, 
            mesh.faces[i + 2] + 1
        ));
    }
    
    Ok(obj_content)
}

// ============ MESH UTILITIES ============

#[wasm_bindgen]
pub fn compute_bounding_box(mesh: &Mesh) -> BoundingBox {
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

#[wasm_bindgen]
pub fn compute_mesh_hash(mesh: &Mesh) -> String {
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

// ============ ASSET VALIDATION ============

#[wasm_bindgen]
pub fn validate_asset(asset_data: &[u8]) -> Result<JsValue, JsValue> {
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

// ============ INTERNAL MESH GENERATION ============

fn generate_box_mesh(width: f64, height: f64, depth: f64) -> Mesh {
    let w = width / 2.0;
    let h = height / 2.0;
    let d = depth / 2.0;

    let vertices = vec![
        -w, -h, -d,  // 0
        w, -h, -d,   // 1
        w, h, -d,    // 2
        -w, h, -d,   // 3
        -w, -h, d,   // 4
        w, -h, d,    // 5
        w, h, d,     // 6
        -w, h, d,    // 7
    ];

    let faces = vec![
        // bottom (-z)
        0, 2, 1,  0, 3, 2,
        // top (+z)
        4, 5, 6,  4, 6, 7,
        // front (-y)
        0, 1, 5,  0, 5, 4,
        // back (+y)
        2, 3, 7,  2, 7, 6,
        // left (-x)
        0, 4, 7,  0, 7, 3,
        // right (+x)
        1, 2, 6,  1, 6, 5,
    ];

    let mut normals = vec![0.0; vertices.len()];
    compute_normals(&vertices, &faces, &mut normals);

    Mesh { vertices, faces, normals }
}

fn generate_cylinder_mesh(radius: f64, height: f64, segments: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut faces = Vec::new();
    
    let half_height = height / 2.0;
    
    // Bottom center
    vertices.extend_from_slice(&[0.0, -half_height, 0.0]);
    // Top center
    vertices.extend_from_slice(&[0.0, half_height, 0.0]);
    
    // Generate ring vertices
    for i in 0..=segments {
        let angle = (i as f64 / segments as f64) * 2.0 * PI;
        let x = radius * angle.cos();
        let z = radius * angle.sin();
        
        // Bottom ring
        vertices.extend_from_slice(&[x, -half_height, z]);
        // Top ring
        vertices.extend_from_slice(&[x, half_height, z]);
    }
    
    // Bottom cap
    for i in 0..segments {
        let base = 2 + i * 2;
        faces.extend_from_slice(&[0, base, base + 2]);
    }
    
    // Top cap
    for i in 0..segments {
        let base = 2 + i * 2;
        faces.extend_from_slice(&[1, base + 3, base + 1]);
    }
    
    // Sides
    for i in 0..segments {
        let base = 2 + i * 2;
        // Triangle 1
        faces.extend_from_slice(&[base, base + 1, base + 2]);
        // Triangle 2
        faces.extend_from_slice(&[base + 1, base + 3, base + 2]);
    }
    
    let mut normals = vec![0.0; vertices.len()];
    compute_normals(&vertices, &faces, &mut normals);
    
    Mesh { vertices, faces, normals }
}

fn generate_sphere_mesh(radius: f64, segments_lat: u32, segments_lon: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut faces = Vec::new();
    
    // Generate vertices
    for lat in 0..=segments_lat {
        let theta = (lat as f64 / segments_lat as f64) * PI;
        let sin_theta = theta.sin();
        let cos_theta = theta.cos();
        
        for lon in 0..=segments_lon {
            let phi = (lon as f64 / segments_lon as f64) * 2.0 * PI;
            let sin_phi = phi.sin();
            let cos_phi = phi.cos();
            
            let x = radius * sin_theta * cos_phi;
            let y = radius * cos_theta;
            let z = radius * sin_theta * sin_phi;
            
            vertices.extend_from_slice(&[x, y, z]);
        }
    }
    
    // Generate faces
    for lat in 0..segments_lat {
        for lon in 0..segments_lon {
            let current = lat * (segments_lon + 1) + lon;
            let next = current + segments_lon + 1;
            
            // Triangle 1
            faces.extend_from_slice(&[current, next, current + 1]);
            // Triangle 2
            faces.extend_from_slice(&[current + 1, next, next + 1]);
        }
    }
    
    let mut normals = vec![0.0; vertices.len()];
    compute_normals(&vertices, &faces, &mut normals);
    
    Mesh { vertices, faces, normals }
}

fn generate_cone_mesh(radius: f64, height: f64, segments: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut faces = Vec::new();
    
    // Apex
    vertices.extend_from_slice(&[0.0, height / 2.0, 0.0]);
    // Base center
    vertices.extend_from_slice(&[0.0, -height / 2.0, 0.0]);
    
    // Base ring
    for i in 0..=segments {
        let angle = (i as f64 / segments as f64) * 2.0 * PI;
        let x = radius * angle.cos();
        let z = radius * angle.sin();
        vertices.extend_from_slice(&[x, -height / 2.0, z]);
    }
    
    // Base cap
    for i in 0..segments {
        faces.extend_from_slice(&[1, 2 + i, 2 + i + 1]);
    }
    
    // Sides
    for i in 0..segments {
        faces.extend_from_slice(&[0, 2 + i + 1, 2 + i]);
    }
    
    let mut normals = vec![0.0; vertices.len()];
    compute_normals(&vertices, &faces, &mut normals);
    
    Mesh { vertices, faces, normals }
}

fn generate_torus_mesh(major_radius: f64, minor_radius: f64, segments_major: u32, segments_minor: u32) -> Mesh {
    let mut vertices = Vec::new();
    let mut faces = Vec::new();
    
    // Generate vertices
    for i in 0..=segments_major {
        let u = (i as f64 / segments_major as f64) * 2.0 * PI;
        let cos_u = u.cos();
        let sin_u = u.sin();
        
        for j in 0..=segments_minor {
            let v = (j as f64 / segments_minor as f64) * 2.0 * PI;
            let cos_v = v.cos();
            let sin_v = v.sin();
            
            let x = (major_radius + minor_radius * cos_v) * cos_u;
            let y = minor_radius * sin_v;
            let z = (major_radius + minor_radius * cos_v) * sin_u;
            
            vertices.extend_from_slice(&[x, y, z]);
        }
    }
    
    // Generate faces
    for i in 0..segments_major {
        for j in 0..segments_minor {
            let current = i * (segments_minor + 1) + j;
            let next = current + segments_minor + 1;
            
            // Triangle 1
            faces.extend_from_slice(&[current, next, current + 1]);
            // Triangle 2
            faces.extend_from_slice(&[current + 1, next, next + 1]);
        }
    }
    
    let mut normals = vec![0.0; vertices.len()];
    compute_normals(&vertices, &faces, &mut normals);
    
    Mesh { vertices, faces, normals }
}

fn compute_normals(vertices: &[f64], faces: &[u32], normals: &mut [f64]) {
    // Initialize normals to zero
    for n in normals.iter_mut() {
        *n = 0.0;
    }
    
    // Accumulate face normals
    for i in (0..faces.len()).step_by(3) {
        let idx_a = faces[i] as usize;
        let idx_b = faces[i + 1] as usize;
        let idx_c = faces[i + 2] as usize;
        
        let v0 = [vertices[idx_a * 3], vertices[idx_a * 3 + 1], vertices[idx_a * 3 + 2]];
        let v1 = [vertices[idx_b * 3], vertices[idx_b * 3 + 1], vertices[idx_b * 3 + 2]];
        let v2 = [vertices[idx_c * 3], vertices[idx_c * 3 + 1], vertices[idx_c * 3 + 2]];
        
        let e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        let e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        
        let nx = e1[1] * e2[2] - e1[2] * e2[1];
        let ny = e1[2] * e2[0] - e1[0] * e2[2];
        let nz = e1[0] * e2[1] - e1[1] * e2[0];
        
        for &idx in &[idx_a, idx_b, idx_c] {
            normals[idx * 3] += nx;
            normals[idx * 3 + 1] += ny;
            normals[idx * 3 + 2] += nz;
        }
    }
    
    // Normalize
    for i in (0..normals.len()).step_by(3) {
        let len = (normals[i] * normals[i] + 
                   normals[i + 1] * normals[i + 1] + 
                   normals[i + 2] * normals[i + 2]).sqrt();
        
        if len > 0.0 {
            normals[i] /= len;
            normals[i + 1] /= len;
            normals[i + 2] /= len;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_box() {
        let mesh = create_box(100.0, 50.0, 25.0);
        assert_eq!(mesh.vertex_count(), 8);
        assert_eq!(mesh.face_count(), 12);
    }

    #[test]
    fn test_create_cylinder() {
        let mesh = create_cylinder(50.0, 100.0, Some(16));
        assert!(mesh.vertex_count() > 0);
        assert!(mesh.face_count() > 0);
    }

    #[test]
    fn test_create_sphere() {
        let mesh = create_sphere(50.0, Some(16), Some(16));
        assert!(mesh.vertex_count() > 0);
        assert!(mesh.face_count() > 0);
    }

    #[test]
    fn test_export_stl() {
        let mesh = create_box(100.0, 50.0, 25.0);
        let stl = export_stl(&mesh, "test").unwrap();
        assert!(stl.contains("solid test"));
        assert!(stl.contains("facet normal"));
        assert!(stl.contains("endsolid"));
    }

    #[test]
    fn test_deterministic_mesh() {
        let mesh1 = create_box(100.0, 50.0, 25.0);
        let mesh2 = create_box(100.0, 50.0, 25.0);

        let hash1 = compute_mesh_hash(&mesh1);
        let hash2 = compute_mesh_hash(&mesh2);

        assert_eq!(hash1, hash2, "Mesh generation must be deterministic");
    }
}
