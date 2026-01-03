// Lightweight JavaScript fallback for Cadmium-Core.
//
// This file is intentionally JS-only so it can be imported by Vitest (Node) without
// requiring special WebAssembly bundling.

export class Mesh {
  /** @param {ArrayLike<number>} vertices */
  /** @param {ArrayLike<number>} faces */
  /** @param {ArrayLike<number>} normals */
  constructor(vertices, faces, normals) {
    this.vertices = vertices instanceof Float64Array ? vertices : new Float64Array(vertices);
    this.faces = faces instanceof Uint32Array ? faces : new Uint32Array(faces);
    this.normals = normals instanceof Float64Array ? normals : new Float64Array(normals);
  }
}

export class BoundingBox {
  constructor(minX, minY, minZ, maxX, maxY, maxZ) {
    this.min_x = minX;
    this.min_y = minY;
    this.min_z = minZ;
    this.max_x = maxX;
    this.max_y = maxY;
    this.max_z = maxZ;
  }
}

export function create_box(width, height, depth) {
  const w = width / 2;
  const h = height / 2;
  const d = depth / 2;

  const vertices = new Float64Array([
    -w, -h, -d,
     w, -h, -d,
     w,  h, -d,
    -w,  h, -d,
    -w, -h,  d,
     w, -h,  d,
     w,  h,  d,
    -w,  h,  d,
  ]);

  // 12 triangles
  const faces = new Uint32Array([
    0, 1, 2, 0, 2, 3, // back
    4, 6, 5, 4, 7, 6, // front
    0, 4, 5, 0, 5, 1, // bottom
    3, 2, 6, 3, 6, 7, // top
    1, 5, 6, 1, 6, 2, // right
    0, 3, 7, 0, 7, 4, // left
  ]);

  const normals = new Float64Array(vertices.length);

  return new Mesh(vertices, faces, normals);
}

export function create_cylinder(radius, height, _segments = 32) {
  // Simple approximation: return a box-like proxy for determinism in Node tests.
  return create_box(radius * 2, height, radius * 2);
}

export function create_sphere(radius, _segmentsLat = 32, _segmentsLon = 32) {
  return create_box(radius * 2, radius * 2, radius * 2);
}

export function create_cone(radius, height, _segments = 32) {
  return create_box(radius * 2, height, radius * 2);
}

export function create_torus(majorRadius, minorRadius, _segmentsMajor = 32, _segmentsMinor = 16) {
  const r = majorRadius + minorRadius;
  return create_box(r * 2, minorRadius * 2, r * 2);
}

export function boolean_union(meshA, _meshB) {
  return meshA;
}

export function boolean_subtract(baseMesh, _toolMesh) {
  return baseMesh;
}

export function boolean_intersect(meshA, _meshB) {
  return meshA;
}

export function add_hole(geometryMesh, _x, _y, _z, _diameter, _depth) {
  return geometryMesh;
}

export function add_fillet(geometryMesh, _edgeIndex, _radius) {
  return geometryMesh;
}

export function add_chamfer(geometryMesh, _edgeIndex, _distance) {
  return geometryMesh;
}

export function export_stl(_mesh, _filename) {
  return '';
}

export function export_obj(_mesh, _filename) {
  return '';
}

export function compute_bounding_box(mesh) {
  const vertices = mesh.vertices;

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < vertices.length; i += 3) {
    minX = Math.min(minX, vertices[i]);
    minY = Math.min(minY, vertices[i + 1]);
    minZ = Math.min(minZ, vertices[i + 2]);
    maxX = Math.max(maxX, vertices[i]);
    maxY = Math.max(maxY, vertices[i + 1]);
    maxZ = Math.max(maxZ, vertices[i + 2]);
  }

  return new BoundingBox(minX, minY, minZ, maxX, maxY, maxZ);
}

export function compute_mesh_hash(mesh) {
  const vertices = mesh.vertices;
  const faces = mesh.faces;

  let hash = 2166136261;

  for (let i = 0; i < vertices.length; i++) {
    const n = Math.fround(vertices[i]);
    hash ^= (n * 1e6) | 0;
    hash = Math.imul(hash, 16777619);
  }

  for (let i = 0; i < faces.length; i++) {
    hash ^= faces[i] | 0;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}
