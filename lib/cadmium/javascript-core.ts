// JavaScript fallback for Cadmium-Core geometry operations
// This provides basic shape creation when WASM is not available

import * as THREE from 'three';

// Create a box mesh
function create_box(width: number, height: number, depth: number): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  return convertGeometry(geometry);
}

// Create a cylinder mesh
function create_cylinder(radius: number, height: number, segments: number = 32): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
  return convertGeometry(geometry);
}

// Create a sphere mesh
function create_sphere(radius: number, segmentsLat: number = 32, segmentsLon: number = 32): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(radius, segmentsLat, segmentsLon);
  return convertGeometry(geometry);
}

// Create a cone mesh
function create_cone(radius: number, height: number, segments: number = 32): THREE.BufferGeometry {
  const geometry = new THREE.ConeGeometry(radius, height, segments);
  return convertGeometry(geometry);
}

// Create a torus mesh
function create_torus(majorRadius: number, minorRadius: number, segmentsMajor: number = 32, segmentsMinor: number = 16): THREE.BufferGeometry {
  const geometry = new THREE.TorusGeometry(majorRadius, minorRadius, segmentsMinor, segmentsMajor);
  return convertGeometry(geometry);
}

// Helper to convert THREE.BufferGeometry to our mesh format
function convertGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  return geometry;
}

// Boolean operations - simplified versions using Three.js CSG if available
function boolean_union(mesh1: any, mesh2: any): any {
  throw new Error('Boolean union requires WASM module');
}

function boolean_subtract(mesh1: any, mesh2: any): any {
  throw new Error('Boolean subtract requires WASM module');
}

function boolean_intersect(mesh1: any, mesh2: any): any {
  throw new Error('Boolean intersect requires WASM module');
}

// Feature operations
function add_hole(mesh: any, x: number, y: number, z: number, diameter: number, depth: number): any {
  throw new Error('Add hole requires WASM module');
}

function add_fillet(mesh: any, edgeIndex: number, radius: number): any {
  throw new Error('Add fillet requires WASM module');
}

function add_chamfer(mesh: any, edgeIndex: number, distance: number): any {
  throw new Error('Add chamfer requires WASM module');
}

// Compute bounding box
function compute_bounding_box(mesh: any): { min: [number, number, number]; max: [number, number, number]; center: [number, number, number]; size: [number, number, number] } {
  if (!mesh || !mesh.boundingBox) {
    return { min: [0, 0, 0], max: [100, 100, 100], center: [50, 50, 50], size: [100, 100, 100] };
  }
  const bbox = mesh.boundingBox;
  return {
    min: [bbox.min.x, bbox.min.y, bbox.min.z],
    max: [bbox.max.x, bbox.max.y, bbox.max.z],
    center: [bbox.getCenter(new THREE.Vector3()).x, bbox.getCenter(new THREE.Vector3()).y, bbox.getCenter(new THREE.Vector3()).z],
    size: [bbox.getSize(new THREE.Vector3()).x, bbox.getSize(new THREE.Vector3()).y, bbox.getSize(new THREE.Vector3()).z]
  };
}

// Export to STL
function export_stl(mesh: any, filename: string): string {
  throw new Error('STL export requires WASM module');
}

// Export to OBJ
function export_obj(mesh: any, filename: string): string {
  throw new Error('OBJ export requires WASM module');
}

// Export the module
export {
  create_box,
  create_cylinder,
  create_sphere,
  create_cone,
  create_torus,
  boolean_union,
  boolean_subtract,
  boolean_intersect,
  add_hole,
  add_fillet,
  add_chamfer,
  compute_bounding_box,
  export_stl,
  export_obj
};
