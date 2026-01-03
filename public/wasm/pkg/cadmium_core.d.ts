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

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_boundingbox_free: (a: number, b: number) => void;
  readonly __wbg_get_boundingbox_max_x: (a: number) => number;
  readonly __wbg_get_boundingbox_max_y: (a: number) => number;
  readonly __wbg_get_boundingbox_max_z: (a: number) => number;
  readonly __wbg_get_boundingbox_min_x: (a: number) => number;
  readonly __wbg_get_boundingbox_min_y: (a: number) => number;
  readonly __wbg_get_boundingbox_min_z: (a: number) => number;
  readonly __wbg_mesh_free: (a: number, b: number) => void;
  readonly __wbg_point_free: (a: number, b: number) => void;
  readonly __wbg_set_boundingbox_max_x: (a: number, b: number) => void;
  readonly __wbg_set_boundingbox_max_y: (a: number, b: number) => void;
  readonly __wbg_set_boundingbox_max_z: (a: number, b: number) => void;
  readonly __wbg_set_boundingbox_min_x: (a: number, b: number) => void;
  readonly __wbg_set_boundingbox_min_y: (a: number, b: number) => void;
  readonly __wbg_set_boundingbox_min_z: (a: number, b: number) => void;
  readonly add_chamfer: (a: number, b: number, c: number) => [number, number, number];
  readonly add_fillet: (a: number, b: number, c: number) => [number, number, number];
  readonly add_hole: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
  readonly boolean_intersect: (a: number, b: number) => [number, number, number];
  readonly boolean_subtract: (a: number, b: number) => [number, number, number];
  readonly boolean_union: (a: number, b: number) => [number, number, number];
  readonly compute_bounding_box: (a: number) => number;
  readonly compute_mesh_hash: (a: number) => [number, number];
  readonly create_box: (a: number, b: number, c: number) => [number, number, number];
  readonly create_cone: (a: number, b: number, c: number) => [number, number, number];
  readonly create_cylinder: (a: number, b: number, c: number) => [number, number, number];
  readonly create_sphere: (a: number, b: number, c: number) => [number, number, number];
  readonly create_torus: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly export_obj: (a: number, b: number, c: number) => [number, number, number, number];
  readonly export_stl: (a: number, b: number, c: number) => [number, number, number, number];
  readonly mesh_face_count: (a: number) => number;
  readonly mesh_faces: (a: number) => [number, number];
  readonly mesh_material: (a: number) => number;
  readonly mesh_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly mesh_normals: (a: number) => [number, number];
  readonly mesh_set_material: (a: number, b: number) => void;
  readonly mesh_vertex_count: (a: number) => number;
  readonly mesh_vertices: (a: number) => [number, number];
  readonly validate_asset: (a: number, b: number) => [number, number, number];
  readonly __wbg_material_free: (a: number, b: number) => void;
  readonly create_aluminum_material: () => number;
  readonly create_brass_material: () => number;
  readonly create_copper_material: () => number;
  readonly create_plastic_material: () => number;
  readonly create_steel_material: () => number;
  readonly create_titanium_material: () => number;
  readonly material_color: (a: number) => [number, number];
  readonly material_metallic: (a: number) => number;
  readonly material_name: (a: number) => [number, number];
  readonly material_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly material_opacity: (a: number) => number;
  readonly material_roughness: (a: number) => number;
  readonly material_to_json: (a: number) => [number, number, number];
  readonly __wbg_get_point_x: (a: number) => number;
  readonly __wbg_get_point_y: (a: number) => number;
  readonly __wbg_get_point_z: (a: number) => number;
  readonly __wbg_set_point_y: (a: number, b: number) => void;
  readonly __wbg_set_point_z: (a: number, b: number) => void;
  readonly __wbg_set_point_x: (a: number, b: number) => void;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
