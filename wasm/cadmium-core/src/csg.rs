// CSG (Constructive Solid Geometry) Implementation
// Implements boolean operations: union, subtract, intersect

use nalgebra::{Vector3, Point3};
use std::collections::HashMap;

const EPSILON: f64 = 1e-10;

#[derive(Clone, Debug)]
pub struct Triangle {
    pub vertices: [Point3<f64>; 3],
    pub normal: Vector3<f64>,
}

impl Triangle {
    pub fn new(v0: Point3<f64>, v1: Point3<f64>, v2: Point3<f64>) -> Self {
        let edge1 = v1 - v0;
        let edge2 = v2 - v0;
        let normal = edge1.cross(&edge2).normalize();
        
        Triangle {
            vertices: [v0, v1, v2],
            normal,
        }
    }
    
    pub fn compute_aabb(&self) -> AABB {
        let mut min = self.vertices[0];
        let mut max = self.vertices[0];
        
        for v in &self.vertices[1..] {
            min.x = min.x.min(v.x);
            min.y = min.y.min(v.y);
            min.z = min.z.min(v.z);
            max.x = max.x.max(v.x);
            max.y = max.y.max(v.y);
            max.z = max.z.max(v.z);
        }
        
        AABB { min, max }
    }
    
    // Check if point is inside triangle (for projection tests)
    pub fn contains_point_2d(&self, p: &Point3<f64>, axis: usize) -> bool {
        let (i1, i2) = match axis {
            0 => (1, 2), // Project to YZ
            1 => (0, 2), // Project to XZ
            _ => (0, 1), // Project to XY
        };
        
        let v0 = &self.vertices[0];
        let v1 = &self.vertices[1];
        let v2 = &self.vertices[2];
        
        let d1 = sign_2d(p, v0, v1, i1, i2);
        let d2 = sign_2d(p, v1, v2, i1, i2);
        let d3 = sign_2d(p, v2, v0, i1, i2);
        
        let has_neg = (d1 < 0.0) || (d2 < 0.0) || (d3 < 0.0);
        let has_pos = (d1 > 0.0) || (d2 > 0.0) || (d3 > 0.0);
        
        !(has_neg && has_pos)
    }
}

fn sign_2d(p1: &Point3<f64>, p2: &Point3<f64>, p3: &Point3<f64>, i1: usize, i2: usize) -> f64 {
    let p1_coords = [p1.x, p1.y, p1.z];
    let p2_coords = [p2.x, p2.y, p2.z];
    let p3_coords = [p3.x, p3.y, p3.z];
    
    (p1_coords[i1] - p3_coords[i1]) * (p2_coords[i2] - p3_coords[i2]) -
    (p2_coords[i1] - p3_coords[i1]) * (p1_coords[i2] - p3_coords[i2])
}

#[derive(Clone, Debug)]
pub struct AABB {
    pub min: Point3<f64>,
    pub max: Point3<f64>,
}

impl AABB {
    pub fn intersects(&self, other: &AABB) -> bool {
        self.min.x <= other.max.x && self.max.x >= other.min.x &&
        self.min.y <= other.max.y && self.max.y >= other.min.y &&
        self.min.z <= other.max.z && self.max.z >= other.min.z
    }
    
    pub fn contains_point(&self, p: &Point3<f64>) -> bool {
        p.x >= self.min.x && p.x <= self.max.x &&
        p.y >= self.min.y && p.y <= self.max.y &&
        p.z >= self.min.z && p.z <= self.max.z
    }
    
    pub fn expand(&mut self, p: &Point3<f64>) {
        self.min.x = self.min.x.min(p.x);
        self.min.y = self.min.y.min(p.y);
        self.min.z = self.min.z.min(p.z);
        self.max.x = self.max.x.max(p.x);
        self.max.y = self.max.y.max(p.y);
        self.max.z = self.max.z.max(p.z);
    }
}

pub struct CSGMesh {
    pub triangles: Vec<Triangle>,
    pub aabb: AABB,
}

impl CSGMesh {
    pub fn from_buffers(vertices: &[f64], faces: &[u32]) -> Self {
        let mut triangles = Vec::new();
        
        for i in (0..faces.len()).step_by(3) {
            let idx0 = faces[i] as usize;
            let idx1 = faces[i + 1] as usize;
            let idx2 = faces[i + 2] as usize;
            
            let v0 = Point3::new(
                vertices[idx0 * 3],
                vertices[idx0 * 3 + 1],
                vertices[idx0 * 3 + 2],
            );
            let v1 = Point3::new(
                vertices[idx1 * 3],
                vertices[idx1 * 3 + 1],
                vertices[idx1 * 3 + 2],
            );
            let v2 = Point3::new(
                vertices[idx2 * 3],
                vertices[idx2 * 3 + 1],
                vertices[idx2 * 3 + 2],
            );
            
            triangles.push(Triangle::new(v0, v1, v2));
        }
        
        let aabb = compute_mesh_aabb(&triangles);
        
        CSGMesh { triangles, aabb }
    }
    
    pub fn to_buffers(&self) -> (Vec<f64>, Vec<u32>, Vec<f64>) {
        let mut vertices = Vec::new();
        let mut faces = Vec::new();
        let mut normals = Vec::new();
        let mut vertex_map: HashMap<(i64, i64, i64), u32> = HashMap::new();
        let mut next_index = 0;
        
        for tri in &self.triangles {
            let mut indices = [0u32; 3];
            
            for (i, v) in tri.vertices.iter().enumerate() {
                // Quantize vertex coordinates for deduplication
                let key = (
                    (v.x * 1e6) as i64,
                    (v.y * 1e6) as i64,
                    (v.z * 1e6) as i64,
                );
                
                let idx = *vertex_map.entry(key).or_insert_with(|| {
                    vertices.push(v.x);
                    vertices.push(v.y);
                    vertices.push(v.z);
                    normals.push(tri.normal.x);
                    normals.push(tri.normal.y);
                    normals.push(tri.normal.z);
                    let idx = next_index;
                    next_index += 1;
                    idx
                });
                
                indices[i] = idx;
            }
            
            faces.extend_from_slice(&indices);
        }
        
        (vertices, faces, normals)
    }
    
    // Ray casting for inside/outside test
    pub fn is_point_inside(&self, point: &Point3<f64>) -> bool {
        if !self.aabb.contains_point(point) {
            return false;
        }
        
        // Cast ray in +X direction and count intersections
        let ray_origin = *point;
        let ray_dir = Vector3::new(1.0, 0.0, 0.0);
        let mut intersection_count = 0;
        
        for tri in &self.triangles {
            if ray_intersects_triangle(&ray_origin, &ray_dir, tri) {
                intersection_count += 1;
            }
        }
        
        // Odd number of intersections = inside
        intersection_count % 2 == 1
    }
}

fn compute_mesh_aabb(triangles: &[Triangle]) -> AABB {
    if triangles.is_empty() {
        return AABB {
            min: Point3::origin(),
            max: Point3::origin(),
        };
    }
    
    let mut aabb = triangles[0].compute_aabb();
    
    for tri in &triangles[1..] {
        let tri_aabb = tri.compute_aabb();
        aabb.expand(&tri_aabb.min);
        aabb.expand(&tri_aabb.max);
    }
    
    aabb
}

// Möller-Trumbore ray-triangle intersection
fn ray_intersects_triangle(origin: &Point3<f64>, direction: &Vector3<f64>, tri: &Triangle) -> bool {
    let edge1 = tri.vertices[1] - tri.vertices[0];
    let edge2 = tri.vertices[2] - tri.vertices[0];
    
    let h = direction.cross(&edge2);
    let a = edge1.dot(&h);
    
    if a.abs() < EPSILON {
        return false;
    }
    
    let f = 1.0 / a;
    let s = origin - tri.vertices[0];
    let u = f * s.dot(&h);
    
    if u < 0.0 || u > 1.0 {
        return false;
    }
    
    let q = s.cross(&edge1);
    let v = f * direction.dot(&q);
    
    if v < 0.0 || u + v > 1.0 {
        return false;
    }
    
    let t = f * edge2.dot(&q);
    
    t > EPSILON
}

// Simplified CSG operations
pub fn csg_union(mesh_a: &CSGMesh, mesh_b: &CSGMesh) -> CSGMesh {
    let mut result_triangles = Vec::new();
    
    // Add triangles from A that are outside B
    for tri in &mesh_a.triangles {
        let centroid = compute_triangle_centroid(tri);
        if !mesh_b.is_point_inside(&centroid) {
            result_triangles.push(tri.clone());
        }
    }
    
    // Add triangles from B that are outside A
    for tri in &mesh_b.triangles {
        let centroid = compute_triangle_centroid(tri);
        if !mesh_a.is_point_inside(&centroid) {
            result_triangles.push(tri.clone());
        }
    }
    
    let aabb = compute_mesh_aabb(&result_triangles);
    
    CSGMesh {
        triangles: result_triangles,
        aabb,
    }
}

pub fn csg_subtract(base: &CSGMesh, tool: &CSGMesh) -> CSGMesh {
    let mut result_triangles = Vec::new();
    
    // Keep triangles from base that are outside tool
    for tri in &base.triangles {
        let centroid = compute_triangle_centroid(tri);
        if !tool.is_point_inside(&centroid) {
            result_triangles.push(tri.clone());
        }
    }
    
    // Add inverted triangles from tool that are inside base
    for tri in &tool.triangles {
        let centroid = compute_triangle_centroid(tri);
        if base.is_point_inside(&centroid) {
            let mut inverted = tri.clone();
            // Invert triangle by swapping vertices
            inverted.vertices.swap(1, 2);
            inverted.normal = -inverted.normal;
            result_triangles.push(inverted);
        }
    }
    
    let aabb = compute_mesh_aabb(&result_triangles);
    
    CSGMesh {
        triangles: result_triangles,
        aabb,
    }
}

pub fn csg_intersect(mesh_a: &CSGMesh, mesh_b: &CSGMesh) -> CSGMesh {
    let mut result_triangles = Vec::new();
    
    // Keep triangles from A that are inside B
    for tri in &mesh_a.triangles {
        let centroid = compute_triangle_centroid(tri);
        if mesh_b.is_point_inside(&centroid) {
            result_triangles.push(tri.clone());
        }
    }
    
    // Keep triangles from B that are inside A
    for tri in &mesh_b.triangles {
        let centroid = compute_triangle_centroid(tri);
        if mesh_a.is_point_inside(&centroid) {
            result_triangles.push(tri.clone());
        }
    }
    
    let aabb = compute_mesh_aabb(&result_triangles);
    
    CSGMesh {
        triangles: result_triangles,
        aabb,
    }
}

fn compute_triangle_centroid(tri: &Triangle) -> Point3<f64> {
    Point3::new(
        (tri.vertices[0].x + tri.vertices[1].x + tri.vertices[2].x) / 3.0,
        (tri.vertices[0].y + tri.vertices[1].y + tri.vertices[2].y) / 3.0,
        (tri.vertices[0].z + tri.vertices[1].z + tri.vertices[2].z) / 3.0,
    )
}
