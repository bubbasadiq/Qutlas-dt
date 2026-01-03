/* tslint:disable */
/* eslint-disable */

export class BoundingBox {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  min_x: number;
  min_y: number;
  min_z: number;
  max_x: number;
  max_y: number;
  max_z: number;
}

export class Material {
  free(): void;
  [Symbol.dispose](): void;
  constructor(name: string, r: number, g: number, b: number, metallic: number, roughness: number, opacity: number);
  to_json(): any;
  readonly name: string;
  readonly color: Float32Array;
  readonly opacity: number;
  readonly metallic: number;
  readonly roughness: number;
}

export class Mesh {
  free(): void;
  [Symbol.dispose](): void;
  constructor(vertices: Float64Array, faces: Uint32Array, normals: Float64Array);
  readonly face_count: number;
  get material(): Material | undefined;
  set material(value: Material);
  readonly vertex_count: number;
  readonly faces: Uint32Array;
  readonly normals: Float64Array;
  readonly vertices: Float64Array;
}

export class Point {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  x: number;
  y: number;
  z: number;
}

export function add_chamfer(geometry_mesh: Mesh, edge_index: number, distance: number): Mesh;

export function add_fillet(geometry_mesh: Mesh, edge_index: number, radius: number): Mesh;

export function add_hole(geometry_mesh: Mesh, position_x: number, position_y: number, position_z: number, diameter: number, depth: number): Mesh;

export function boolean_intersect(mesh_a: Mesh, mesh_b: Mesh): Mesh;

export function boolean_subtract(base_mesh: Mesh, tool_mesh: Mesh): Mesh;

export function boolean_union(mesh_a: Mesh, mesh_b: Mesh): Mesh;

export function compute_bounding_box(mesh: Mesh): BoundingBox;

export function compute_mesh_hash(mesh: Mesh): string;

export function create_aluminum_material(): Material;

export function create_box(width: number, height: number, depth: number): Mesh;

export function create_brass_material(): Material;

export function create_cone(radius: number, height: number, segments?: number | null): Mesh;

export function create_copper_material(): Material;

export function create_cylinder(radius: number, height: number, segments?: number | null): Mesh;

export function create_plastic_material(): Material;

export function create_sphere(radius: number, segments_lat?: number | null, segments_lon?: number | null): Mesh;

export function create_steel_material(): Material;

export function create_titanium_material(): Material;

export function create_torus(major_radius: number, minor_radius: number, segments_major?: number | null, segments_minor?: number | null): Mesh;

export function export_obj(mesh: Mesh, filename: string): string;

export function export_stl(mesh: Mesh, filename: string): string;

export function validate_asset(asset_data: Uint8Array): any;
