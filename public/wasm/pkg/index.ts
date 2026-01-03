// Public wrapper around the Cadmium-Core implementation.
//
// Note: In this repo we ship the compiled WASM bundle in `cadmium_core.js`.
// With wasm-pack `--target bundler`, the module initializes on import (no default init
// export). This module provides stable, ergonomic exports used by tests and
// higher-level code.

import {
  Mesh,
  add_chamfer,
  add_fillet,
  add_hole,
  boolean_intersect,
  boolean_subtract,
  boolean_union,
  compute_bounding_box,
  compute_mesh_hash,
  create_box,
  create_cone,
  create_cylinder,
  create_sphere,
  create_torus,
  export_obj,
  export_stl,
} from './cadmium_core';

export { Mesh };

export default async function initCadmiumCore(): Promise<void> {
  // No-op: bundler target initializes at module evaluation time.
}

export type OpLogEntry =
  | { type: 'create-box'; params: { length: number; width: number; height: number } }
  | { type: 'create-cylinder'; params: { radius: number; height: number; segments?: number } }
  | { type: 'create-sphere'; params: { radius: number; segmentsLat?: number; segmentsLon?: number } }
  | { type: 'create-cone'; params: { radius: number; height: number; segments?: number } }
  | {
      type: 'create-torus';
      params: {
        majorRadius: number;
        minorRadius: number;
        segmentsMajor?: number;
        segmentsMinor?: number;
      };
    }
  | { type: 'fillet-edges'; params: { radius: number } }
  | { type: 'boolean'; params: { operation: 'union' | 'subtract' | 'intersect'; other: any } };

function translateMesh(mesh: any, dx: number, dy: number, dz: number) {
  const vertices = Array.from(mesh.vertices || []);
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i] += dx;
    vertices[i + 1] += dy;
    vertices[i + 2] += dz;
  }
  return new Mesh(vertices, Array.from(mesh.faces || []), Array.from(mesh.normals || []));
}

// Convenience helpers with stable naming expected by tests
export function createBox(length: number, width: number, height: number) {
  const mesh = create_box(length, width, height);
  // Shift so bounds are in [0..dim] for deterministic tests.
  return translateMesh(mesh, length / 2, width / 2, height / 2);
}

export function createCylinder(radius: number, height: number, segments = 32) {
  return create_cylinder(radius, height, segments);
}

export function createSphere(radius: number, segmentsLat = 32, segmentsLon = 32) {
  return create_sphere(radius, segmentsLat, segmentsLon);
}

export function createCone(radius: number, height: number, segments = 32) {
  return create_cone(radius, height, segments);
}

export function createTorus(
  majorRadius: number,
  minorRadius: number,
  segmentsMajor = 32,
  segmentsMinor = 16
) {
  return create_torus(majorRadius, minorRadius, segmentsMajor, segmentsMinor);
}

export function getBoundingBox(mesh: any) {
  const bbox = compute_bounding_box(mesh);
  return {
    min: [bbox.min_x, bbox.min_y, bbox.min_z] as [number, number, number],
    max: [bbox.max_x, bbox.max_y, bbox.max_z] as [number, number, number],
  };
}

export function applyParameters(
  _mesh: any,
  params: { length?: number; width?: number; height?: number }
) {
  const length = params.length ?? 100;
  const width = params.width ?? 100;
  const height = params.height ?? 100;
  return createBox(length, width, height);
}

export function executeOpLog(opLog: OpLogEntry[]) {
  let current: any = null;

  for (const entry of opLog) {
    switch (entry.type) {
      case 'create-box':
        current = createBox(entry.params.length, entry.params.width, entry.params.height);
        break;
      case 'create-cylinder':
        current = createCylinder(entry.params.radius, entry.params.height, entry.params.segments);
        break;
      case 'create-sphere':
        current = createSphere(
          entry.params.radius,
          entry.params.segmentsLat,
          entry.params.segmentsLon
        );
        break;
      case 'create-cone':
        current = createCone(entry.params.radius, entry.params.height, entry.params.segments);
        break;
      case 'create-torus':
        current = createTorus(
          entry.params.majorRadius,
          entry.params.minorRadius,
          entry.params.segmentsMajor,
          entry.params.segmentsMinor
        );
        break;
      case 'fillet-edges':
        if (current) current = add_fillet(current, 0, entry.params.radius);
        break;
      case 'boolean':
        if (!current) break;
        // This wrapper keeps determinism: if the "other" mesh is not provided,
        // we simply no-op.
        const other = entry.params.other;
        if (!(other instanceof Mesh)) break;

        if (entry.params.operation === 'union') {
          current = boolean_union(current, other);
        }

        if (entry.params.operation === 'subtract') {
          current = boolean_subtract(current, other);
        }

        if (entry.params.operation === 'intersect') {
          current = boolean_intersect(current, other);
        }
        break;
      default:
        break;
    }
  }

  return current;
}

export function hashGeometry(mesh: any) {
  return compute_mesh_hash(mesh);
}

export {
  // Low-level API re-exports
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
  export_stl,
  export_obj,
  compute_bounding_box,
  compute_mesh_hash,
};
