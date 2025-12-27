//! Primitive solid generation with deterministic topology.
//!
//! All primitives generate consistent vertex ordering and face
//! orientation for reliable boolean operations.

use crate::geometry::{constants, Primitive, apply_transform_to_point, apply_transform_to_normal, compute_face_normal};
use crate::types::{BoundingBox, PreviewMesh, PrimitiveType};
use crate::errors::KernelResult;
use std::collections::HashMap;

/// Local Transform alias for primitives
type Transform = crate::types::Transform;

/// Box primitive
#[derive(Debug, Clone)]
pub struct Box {
    pub width: f64,
    pub height: f64,
    pub depth: f64,
    pub transform: Option<Transform>,
}

impl Box {
    pub fn new(width: f64, height: f64, depth: f64) -> Self {
        Box {
            width,
            height,
            depth,
            transform: None,
        }
    }

    pub fn with_transform(mut self, transform: Transform) -> Self {
        self.transform = Some(transform);
        self
    }

    pub fn from_params(params: &HashMap<String, f64>) -> KernelResult<Self> {
        let width = params
            .get("width")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("width"))?;

        let height = params
            .get("height")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("height"))?;

        let depth = params
            .get("depth")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("depth"))?;

        Ok(Box::new(width, height, depth))
    }
}

impl Primitive for Box {
    fn to_mesh(&self, subdivisions: u32) -> PreviewMesh {
        let mut mesh = PreviewMesh::new();
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());

        let w = self.width / 2.0;
        let h = self.height / 2.0;
        let d = self.depth / 2.0;

        // Define 8 corners of the box (deterministic order)
        let corners = [
            [-w, -h, -d], // 0: bottom-left-back
            [w, -h, -d],  // 1: bottom-right-back
            [w, h, -d],   // 2: top-right-back
            [-w, h, -d],  // 3: top-left-back
            [-w, -h, d],  // 4: bottom-left-front
            [w, -h, d],   // 5: bottom-right-front
            [w, h, d],    // 6: top-right-front
            [-w, h, d],   // 7: top-left-front
        ];

        // Define 6 faces with consistent winding (counter-clockwise)
        // Each face: [vertex_indices, normal]
        let faces = [
            (vec![0, 4, 7, 3], [-1.0, 0.0, 0.0]), // Left
            (vec![1, 2, 6, 5], [1.0, 0.0, 0.0]),  // Right
            (vec![0, 1, 5, 4], [0.0, -1.0, 0.0]), // Bottom
            (vec![3, 7, 6, 2], [0.0, 1.0, 0.0]),  // Top
            (vec![0, 3, 2, 1], [0.0, 0.0, -1.0]), // Back
            (vec![4, 5, 6, 7], [0.0, 0.0, 1.0]),  // Front
        ];

        // Transform corners
        let transformed_corners: Vec<[f64; 3]> = corners
            .iter()
            .map(|c| apply_transform_to_point(*c, transform))
            .collect();

        // Generate vertices and indices
        let vertex_offset = mesh.vertices.len() as u32 / 3;

        for (face_indices, face_normal) in &faces {
            let normal = apply_transform_to_normal(*face_normal, transform);

            // Two triangles per face (triangulate quad)
            // Triangle 1: 0, 1, 2
            // Triangle 2: 0, 2, 3

            for tri in [0, 1] {
                let idx0 = face_indices[tri];
                let idx1 = face_indices[tri + 1];
                let idx2 = face_indices[tri + 2];

                let v0 = transformed_corners[idx0];
                let v1 = transformed_corners[idx1];
                let v2 = transformed_corners[idx2];

                mesh.vertices.extend_from_slice(&[
                    v0[0] as f32, v0[1] as f32, v0[2] as f32,
                    v1[0] as f32, v1[1] as f32, v1[2] as f32,
                    v2[0] as f32, v2[1] as f32, v2[2] as f32,
                ]);

                mesh.normals.extend_from_slice(&[
                    normal[0] as f32, normal[1] as f32, normal[2] as f32,
                    normal[0] as f32, normal[1] as f32, normal[2] as f32,
                    normal[0] as f32, normal[1] as f32, normal[2] as f32,
                ]);

                mesh.indices.extend_from_slice(&[
                    vertex_offset, vertex_offset + 1, vertex_offset + 2,
                ]);

                vertex_offset += 3;
            }
        }

        mesh
    }

    fn bounding_box(&self) -> BoundingBox {
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());
        let corners = [
            [-self.width / 2.0, -self.height / 2.0, -self.depth / 2.0],
            [self.width / 2.0, self.height / 2.0, self.depth / 2.0],
        ];

        let transformed: Vec<[f64; 3]> = corners
            .iter()
            .map(|c| apply_transform_to_point(*c, transform))
            .collect();

        let min = [
            transformed[0][0].min(transformed[1][0]),
            transformed[0][1].min(transformed[1][1]),
            transformed[0][2].min(transformed[1][2]),
        ];

        let max = [
            transformed[0][0].max(transformed[1][0]),
            transformed[0][1].max(transformed[1][1]),
            transformed[0][2].max(transformed[1][2]),
        ];

        BoundingBox::new(min, max)
    }

    fn apply_transform(&mut self, transform: &Transform) {
        self.transform = Some(transform.clone());
    }
}

/// Cylinder primitive
#[derive(Debug, Clone)]
pub struct Cylinder {
    pub radius: f64,
    pub height: f64,
    pub transform: Option<Transform>,
}

impl Cylinder {
    pub fn new(radius: f64, height: f64) -> Self {
        Cylinder {
            radius,
            height,
            transform: None,
        }
    }

    pub fn from_params(params: &HashMap<String, f64>) -> KernelResult<Self> {
        let radius = params
            .get("radius")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("radius"))?;

        let height = params
            .get("height")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("height"))?;

        Ok(Cylinder::new(radius, height))
    }
}

impl Primitive for Cylinder {
    fn to_mesh(&self, subdivisions: u32) -> PreviewMesh {
        let mut mesh = PreviewMesh::new();
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());

        let segments = subdivisions.max(8) as usize;
        let h = self.height / 2.0;

        // Generate vertices
        let vertex_offset = mesh.vertices.len() as u32 / 3;

        // Top and bottom center vertices
        let top_center = apply_transform_to_point([0.0, h, 0.0], transform);
        let bottom_center = apply_transform_to_point([0.0, -h, 0.0], transform);

        // Side vertices
        let mut top_vertices = Vec::new();
        let mut bottom_vertices = Vec::new();

        for i in 0..segments {
            let angle = 2.0 * std::f64::consts::PI * (i as f64) / (segments as f64);
            let cos_a = angle.cos();
            let sin_a = angle.sin();

            let top = apply_transform_to_point(
                [self.radius * cos_a, h, self.radius * sin_a],
                transform,
            );
            let bottom = apply_transform_to_point(
                [self.radius * cos_a, -h, self.radius * sin_a],
                transform,
            );

            top_vertices.push(top);
            bottom_vertices.push(bottom);
        }

        // Top cap
        for i in 0..segments {
            let next = (i + 1) % segments;

            mesh.vertices.extend_from_slice(&[
                top_center[0] as f32, top_center[1] as f32, top_center[2] as f32,
                top_vertices[i][0] as f32, top_vertices[i][1] as f32, top_vertices[i][2] as f32,
                top_vertices[next][0] as f32, top_vertices[next][1] as f32, top_vertices[next][2] as f32,
            ]);

            let normal = apply_transform_to_normal([0.0, 1.0, 0.0], transform);
            mesh.normals.extend_from_slice(&[
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
            ]);

            mesh.indices.extend_from_slice(&[vertex_offset, vertex_offset + 1, vertex_offset + 2]);
            vertex_offset += 3;
        }

        // Bottom cap
        for i in 0..segments {
            let next = (i + 1) % segments;

            mesh.vertices.extend_from_slice(&[
                bottom_center[0] as f32, bottom_center[1] as f32, bottom_center[2] as f32,
                bottom_vertices[next][0] as f32, bottom_vertices[next][1] as f32, bottom_vertices[next][2] as f32,
                bottom_vertices[i][0] as f32, bottom_vertices[i][1] as f32, bottom_vertices[i][2] as f32,
            ]);

            let normal = apply_transform_to_normal([0.0, -1.0, 0.0], transform);
            mesh.normals.extend_from_slice(&[
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
            ]);

            mesh.indices.extend_from_slice(&[vertex_offset, vertex_offset + 1, vertex_offset + 2]);
            vertex_offset += 3;
        }

        // Side faces
        for i in 0..segments {
            let next = (i + 1) % segments;

            let v0 = bottom_vertices[i];
            let v1 = top_vertices[i];
            let v2 = top_vertices[next];
            let v3 = bottom_vertices[next];

            mesh.vertices.extend_from_slice(&[
                v0[0] as f32, v0[1] as f32, v0[2] as f32,
                v1[0] as f32, v1[1] as f32, v1[2] as f32,
                v2[0] as f32, v2[1] as f32, v2[2] as f32,
                v0[0] as f32, v0[1] as f32, v0[2] as f32,
                v2[0] as f32, v2[1] as f32, v2[2] as f32,
                v3[0] as f32, v3[1] as f32, v3[2] as f32,
            ]);

            // Compute normal from direction vector
            let angle = 2.0 * std::f64::consts::PI * (i as f64) / (segments as f64);
            let nx = angle.cos();
            let nz = angle.sin();
            let normal = apply_transform_to_normal([nx, 0.0, nz], transform);

            mesh.normals.extend_from_slice(&[
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
            ]);

            mesh.indices.extend_from_slice(&[
                vertex_offset, vertex_offset + 1, vertex_offset + 2,
                vertex_offset + 3, vertex_offset + 4, vertex_offset + 5,
            ]);

            vertex_offset += 6;
        }

        mesh
    }

    fn bounding_box(&self) -> BoundingBox {
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());
        let corners = [
            [-self.radius, -self.height / 2.0, -self.radius],
            [self.radius, self.height / 2.0, self.radius],
        ];

        let transformed: Vec<[f64; 3]> = corners
            .iter()
            .map(|c| apply_transform_to_point(*c, transform))
            .collect();

        let min = [
            transformed[0][0].min(transformed[1][0]),
            transformed[0][1].min(transformed[1][1]),
            transformed[0][2].min(transformed[1][2]),
        ];

        let max = [
            transformed[0][0].max(transformed[1][0]),
            transformed[0][1].max(transformed[1][1]),
            transformed[0][2].max(transformed[1][2]),
        ];

        BoundingBox::new(min, max)
    }

    fn apply_transform(&mut self, transform: &Transform) {
        self.transform = Some(transform.clone());
    }
}

/// Sphere primitive
#[derive(Debug, Clone)]
pub struct Sphere {
    pub radius: f64,
    pub transform: Option<Transform>,
}

impl Sphere {
    pub fn new(radius: f64) -> Self {
        Sphere {
            radius,
            transform: None,
        }
    }

    pub fn from_params(params: &HashMap<String, f64>) -> KernelResult<Self> {
        let radius = params
            .get("radius")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("radius"))?;

        Ok(Sphere::new(radius))
    }
}

impl Primitive for Sphere {
    fn to_mesh(&self, subdivisions: u32) -> PreviewMesh {
        let mut mesh = PreviewMesh::new();
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());

        let lat_segments = (subdivisions / 2).max(4) as usize;
        let lon_segments = subdivisions.max(8) as usize;

        let vertex_offset = mesh.vertices.len() as u32 / 3;

        // Generate vertices
        for lat in 0..=lat_segments {
            let theta = std::f64::consts::PI * (lat as f64) / (lat_segments as f64);
            let sin_theta = theta.sin();
            let cos_theta = theta.cos();

            for lon in 0..=lon_segments {
                let phi = 2.0 * std::f64::consts::PI * (lon as f64) / (lon_segments as f64);
                let sin_phi = phi.sin();
                let cos_phi = phi.cos();

                let x = self.radius * sin_theta * cos_phi;
                let y = self.radius * cos_theta;
                let z = self.radius * sin_theta * sin_phi;

                let point = apply_transform_to_point([x, y, z], transform);

                // Normal for sphere is just the normalized point (before transform)
                let mut normal = [x / self.radius, y / self.radius, z / self.radius];
                normal = apply_transform_to_normal(normal, transform);

                mesh.vertices.extend_from_slice(&[point[0] as f32, point[1] as f32, point[2] as f32]);
                mesh.normals.extend_from_slice(&[normal[0] as f32, normal[1] as f32, normal[2] as f32]);
            }
        }

        // Generate indices
        for lat in 0..lat_segments {
            for lon in 0..lon_segments {
                let i0 = (lat * (lon_segments + 1) + lon) as u32 + vertex_offset;
                let i1 = i0 + 1;
                let i2 = ((lat + 1) * (lon_segments + 1) + lon) as u32 + vertex_offset;
                let i3 = i2 + 1;

                mesh.indices.extend_from_slice(&[i0, i2, i1]);
                mesh.indices.extend_from_slice(&[i1, i2, i3]);
            }
        }

        mesh
    }

    fn bounding_box(&self) -> BoundingBox {
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());
        let corners = [
            [-self.radius, -self.radius, -self.radius],
            [self.radius, self.radius, self.radius],
        ];

        let transformed: Vec<[f64; 3]> = corners
            .iter()
            .map(|c| apply_transform_to_point(*c, transform))
            .collect();

        let min = [
            transformed[0][0].min(transformed[1][0]),
            transformed[0][1].min(transformed[1][1]),
            transformed[0][2].min(transformed[1][2]),
        ];

        let max = [
            transformed[0][0].max(transformed[1][0]),
            transformed[0][1].max(transformed[1][1]),
            transformed[0][2].max(transformed[1][2]),
        ];

        BoundingBox::new(min, max)
    }

    fn apply_transform(&mut self, transform: &Transform) {
        self.transform = Some(transform.clone());
    }
}

/// Cone primitive
#[derive(Debug, Clone)]
pub struct Cone {
    pub radius: f64,
    pub height: f64,
    pub transform: Option<Transform>,
}

impl Cone {
    pub fn new(radius: f64, height: f64) -> Self {
        Cone {
            radius,
            height,
            transform: None,
        }
    }

    pub fn from_params(params: &HashMap<String, f64>) -> KernelResult<Self> {
        let radius = params
            .get("radius")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("radius"))?;

        let height = params
            .get("height")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("height"))?;

        Ok(Cone::new(radius, height))
    }
}

impl Primitive for Cone {
    fn to_mesh(&self, subdivisions: u32) -> PreviewMesh {
        let mut mesh = PreviewMesh::new();
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());

        let segments = subdivisions.max(8) as usize;
        let h = self.height;

        let vertex_offset = mesh.vertices.len() as u32 / 3;

        // Apex vertex
        let apex = apply_transform_to_point([0.0, h / 2.0, 0.0], transform);
        let bottom_center = apply_transform_to_point([0.0, -h / 2.0, 0.0], transform);

        // Bottom vertices
        let mut bottom_vertices = Vec::new();
        for i in 0..segments {
            let angle = 2.0 * std::f64::consts::PI * (i as f64) / (segments as f64);
            let cos_a = angle.cos();
            let sin_a = angle.sin();

            let bottom = apply_transform_to_point(
                [self.radius * cos_a, -h / 2.0, self.radius * sin_a],
                transform,
            );
            bottom_vertices.push(bottom);
        }

        // Side faces
        for i in 0..segments {
            let next = (i + 1) % segments;

            mesh.vertices.extend_from_slice(&[
                bottom_center[0] as f32, bottom_center[1] as f32, bottom_center[2] as f32,
                bottom_vertices[next][0] as f32, bottom_vertices[next][1] as f32, bottom_vertices[next][2] as f32,
                bottom_vertices[i][0] as f32, bottom_vertices[i][1] as f32, bottom_vertices[i][2] as f32,
            ]);

            let normal = apply_transform_to_normal([0.0, -1.0, 0.0], transform);
            mesh.normals.extend_from_slice(&[
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
            ]);

            mesh.indices.extend_from_slice(&[vertex_offset, vertex_offset + 1, vertex_offset + 2]);
            vertex_offset += 3;
        }

        // Cone sides
        for i in 0..segments {
            let next = (i + 1) % segments;

            mesh.vertices.extend_from_slice(&[
                apex[0] as f32, apex[1] as f32, apex[2] as f32,
                bottom_vertices[i][0] as f32, bottom_vertices[i][1] as f32, bottom_vertices[i][2] as f32,
                bottom_vertices[next][0] as f32, bottom_vertices[next][1] as f32, bottom_vertices[next][2] as f32,
            ]);

            // Compute normal for side face
            let angle = 2.0 * std::f64::consts::PI * (i as f64) / (segments as f64);
            let nx = angle.cos();
            let nz = angle.sin();

            // Normal for cone side points outward and upward
            let slope = self.radius / self.height;
            let ny = slope;
            let len = (nx * nx + ny * ny + nz * nz).sqrt();
            let mut normal = [nx / len, ny / len, nz / len];
            normal = apply_transform_to_normal(normal, transform);

            mesh.normals.extend_from_slice(&[
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
                normal[0] as f32, normal[1] as f32, normal[2] as f32,
            ]);

            mesh.indices.extend_from_slice(&[vertex_offset, vertex_offset + 1, vertex_offset + 2]);
            vertex_offset += 3;
        }

        mesh
    }

    fn bounding_box(&self) -> BoundingBox {
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());
        let corners = [
            [-self.radius, -self.height / 2.0, -self.radius],
            [self.radius, self.height / 2.0, self.radius],
        ];

        let transformed: Vec<[f64; 3]> = corners
            .iter()
            .map(|c| apply_transform_to_point(*c, transform))
            .collect();

        let min = [
            transformed[0][0].min(transformed[1][0]),
            transformed[0][1].min(transformed[1][1]),
            transformed[0][2].min(transformed[1][2]),
        ];

        let max = [
            transformed[0][0].max(transformed[1][0]),
            transformed[0][1].max(transformed[1][1]),
            transformed[0][2].max(transformed[1][2]),
        ];

        BoundingBox::new(min, max)
    }

    fn apply_transform(&mut self, transform: &Transform) {
        self.transform = Some(transform.clone());
    }
}

/// Torus primitive
#[derive(Debug, Clone)]
pub struct Torus {
    pub major_radius: f64,
    pub minor_radius: f64,
    pub transform: Option<Transform>,
}

impl Torus {
    pub fn new(major_radius: f64, minor_radius: f64) -> Self {
        Torus {
            major_radius,
            minor_radius,
            transform: None,
        }
    }

    pub fn from_params(params: &HashMap<String, f64>) -> KernelResult<Self> {
        let major_radius = params
            .get("major_radius")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("major_radius"))?;

        let minor_radius = params
            .get("minor_radius")
            .copied()
            .ok_or_else(|| crate::errors::KernelError::missing_parameter("minor_radius"))?;

        Ok(Torus::new(major_radius, minor_radius))
    }
}

impl Primitive for Torus {
    fn to_mesh(&self, subdivisions: u32) -> PreviewMesh {
        let mut mesh = PreviewMesh::new();
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());

        let major_segments = subdivisions.max(12) as usize;
        let minor_segments = (subdivisions / 2).max(8) as usize;

        let vertex_offset = mesh.vertices.len() as u32 / 3;

        // Generate vertices
        for i in 0..=major_segments {
            let u = 2.0 * std::f64::consts::PI * (i as f64) / (major_segments as f64);
            let cos_u = u.cos();
            let sin_u = u.sin();

            for j in 0..=minor_segments {
                let v = 2.0 * std::f64::consts::PI * (j as f64) / (minor_segments as f64);
                let cos_v = v.cos();
                let sin_v = v.sin();

                let x = (self.major_radius + self.minor_radius * cos_v) * cos_u;
                let y = self.minor_radius * sin_v;
                let z = (self.major_radius + self.minor_radius * cos_v) * sin_u;

                let point = apply_transform_to_point([x, y, z], transform);

                // Normal computation
                let nx = cos_v * cos_u;
                let ny = sin_v;
                let nz = cos_v * sin_u;
                let mut normal = [nx, ny, nz];
                normal = apply_transform_to_normal(normal, transform);

                mesh.vertices.extend_from_slice(&[point[0] as f32, point[1] as f32, point[2] as f32]);
                mesh.normals.extend_from_slice(&[normal[0] as f32, normal[1] as f32, normal[2] as f32]);
            }
        }

        // Generate indices
        for i in 0..major_segments {
            for j in 0..minor_segments {
                let i0 = (i * (minor_segments + 1) + j) as u32 + vertex_offset;
                let i1 = i0 + 1;
                let i2 = ((i + 1) * (minor_segments + 1) + j) as u32 + vertex_offset;
                let i3 = i2 + 1;

                mesh.indices.extend_from_slice(&[i0, i2, i1]);
                mesh.indices.extend_from_slice(&[i1, i2, i3]);
            }
        }

        mesh
    }

    fn bounding_box(&self) -> BoundingBox {
        let transform = self.transform.as_ref().unwrap_or(&Transform::identity());
        let max_r = self.major_radius + self.minor_radius;
        let corners = [[-max_r, -self.minor_radius, -max_r], [max_r, self.minor_radius, max_r]];

        let transformed: Vec<[f64; 3]> = corners
            .iter()
            .map(|c| apply_transform_to_point(*c, transform))
            .collect();

        let min = [
            transformed[0][0].min(transformed[1][0]),
            transformed[0][1].min(transformed[1][1]),
            transformed[0][2].min(transformed[1][2]),
        ];

        let max = [
            transformed[0][0].max(transformed[1][0]),
            transformed[0][1].max(transformed[1][1]),
            transformed[0][2].max(transformed[1][2]),
        ];

        BoundingBox::new(min, max)
    }

    fn apply_transform(&mut self, transform: &Transform) {
        self.transform = Some(transform.clone());
    }
}

/// Create primitive from type and parameters
pub fn create_primitive(
    type_: PrimitiveType,
    params: &HashMap<String, f64>,
) -> KernelResult<Box<dyn Primitive>> {
    match type_ {
        PrimitiveType::Box => Ok(Box::new(Box::from_params(params)?)),
        PrimitiveType::Cylinder => Ok(Box::new(Cylinder::from_params(params)?)),
        PrimitiveType::Sphere => Ok(Box::new(Sphere::from_params(params)?)),
        PrimitiveType::Cone => Ok(Box::new(Cone::from_params(params)?)),
        PrimitiveType::Torus => Ok(Box::new(Torus::from_params(params)?)),
    }
}
