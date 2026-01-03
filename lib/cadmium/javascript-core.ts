import * as THREE from 'three';

export class Mesh {
  vertices: Float64Array;
  faces: Uint32Array;
  normals: Float64Array;

  constructor(
    vertices: number[] | Float64Array,
    faces: number[] | Uint32Array,
    normals: number[] | Float64Array
  ) {
    this.vertices = vertices instanceof Float64Array ? vertices : new Float64Array(vertices);
    this.faces = faces instanceof Uint32Array ? faces : new Uint32Array(faces);
    this.normals = normals instanceof Float64Array ? normals : new Float64Array(normals);
  }
}

function geometryToMesh(geometry: THREE.BufferGeometry): Mesh {
  if (!geometry.getAttribute('normal')) {
    geometry.computeVertexNormals();
  }

  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');

  const vertices = new Float64Array(position.array.length);
  for (let i = 0; i < position.array.length; i++) {
    vertices[i] = position.array[i] ?? 0;
  }

  const normals = new Float64Array(normal.array.length);
  for (let i = 0; i < normal.array.length; i++) {
    normals[i] = normal.array[i] ?? 0;
  }

  const faces = geometry.index
    ? new Uint32Array(geometry.index.array)
    : Uint32Array.from({ length: position.count }, (_, i) => i);

  return new Mesh(vertices, faces, normals);
}

export function create_box(width: number, height: number, depth: number): Mesh {
  return geometryToMesh(new THREE.BoxGeometry(width, height, depth));
}

export function create_cylinder(radius: number, height: number, segments = 32): Mesh {
  return geometryToMesh(new THREE.CylinderGeometry(radius, radius, height, segments));
}

export function create_sphere(radius: number, segmentsLat = 32, segmentsLon = 32): Mesh {
  return geometryToMesh(new THREE.SphereGeometry(radius, segmentsLat, segmentsLon));
}

export function create_cone(radius: number, height: number, segments = 32): Mesh {
  return geometryToMesh(new THREE.ConeGeometry(radius, height, segments));
}

export function create_torus(
  majorRadius: number,
  minorRadius: number,
  segmentsMajor = 32,
  segmentsMinor = 16
): Mesh {
  return geometryToMesh(
    new THREE.TorusGeometry(majorRadius, minorRadius, segmentsMinor, segmentsMajor)
  );
}

export function boolean_union(_mesh1: Mesh, _mesh2: Mesh): Mesh {
  throw new Error('Boolean union requires WASM module');
}

export function boolean_subtract(_mesh1: Mesh, _mesh2: Mesh): Mesh {
  throw new Error('Boolean subtract requires WASM module');
}

export function boolean_intersect(_mesh1: Mesh, _mesh2: Mesh): Mesh {
  throw new Error('Boolean intersect requires WASM module');
}

export function add_hole(
  _mesh: Mesh,
  _x: number,
  _y: number,
  _z: number,
  _diameter: number,
  _depth: number
): Mesh {
  throw new Error('Add hole requires WASM module');
}

export function add_fillet(_mesh: Mesh, _edgeIndex: number, _radius: number): Mesh {
  throw new Error('Add fillet requires WASM module');
}

export function add_chamfer(_mesh: Mesh, _edgeIndex: number, _distance: number): Mesh {
  throw new Error('Add chamfer requires WASM module');
}

export function compute_bounding_box(mesh: Mesh) {
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

  return {
    min_x: minX,
    min_y: minY,
    min_z: minZ,
    max_x: maxX,
    max_y: maxY,
    max_z: maxZ,
  };
}

export function export_stl(_mesh: Mesh, _filename: string): string {
  throw new Error('STL export requires WASM module');
}

export function export_obj(_mesh: Mesh, _filename: string): string {
  throw new Error('OBJ export requires WASM module');
}
