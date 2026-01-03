let wasm;

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

let WASM_VECTOR_LEN = 0;

const BoundingBoxFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_boundingbox_free(ptr >>> 0, 1));

const MaterialFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_material_free(ptr >>> 0, 1));

const MeshFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mesh_free(ptr >>> 0, 1));

const PointFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_point_free(ptr >>> 0, 1));

export class BoundingBox {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BoundingBox.prototype);
        obj.__wbg_ptr = ptr;
        BoundingBoxFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BoundingBoxFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_boundingbox_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get min_x() {
        const ret = wasm.__wbg_get_boundingbox_min_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set min_x(arg0) {
        wasm.__wbg_set_boundingbox_min_x(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get min_y() {
        const ret = wasm.__wbg_get_boundingbox_min_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set min_y(arg0) {
        wasm.__wbg_set_boundingbox_min_y(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get min_z() {
        const ret = wasm.__wbg_get_boundingbox_min_z(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set min_z(arg0) {
        wasm.__wbg_set_boundingbox_min_z(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get max_x() {
        const ret = wasm.__wbg_get_boundingbox_max_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set max_x(arg0) {
        wasm.__wbg_set_boundingbox_max_x(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get max_y() {
        const ret = wasm.__wbg_get_boundingbox_max_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set max_y(arg0) {
        wasm.__wbg_set_boundingbox_max_y(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get max_z() {
        const ret = wasm.__wbg_get_boundingbox_max_z(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set max_z(arg0) {
        wasm.__wbg_set_boundingbox_max_z(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) BoundingBox.prototype[Symbol.dispose] = BoundingBox.prototype.free;

export class Material {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Material.prototype);
        obj.__wbg_ptr = ptr;
        MaterialFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MaterialFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_material_free(ptr, 0);
    }
    /**
     * @param {string} name
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} metallic
     * @param {number} roughness
     * @param {number} opacity
     */
    constructor(name, r, g, b, metallic, roughness, opacity) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.material_new(ptr0, len0, r, g, b, metallic, roughness, opacity);
        this.__wbg_ptr = ret >>> 0;
        MaterialFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.material_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Float32Array}
     */
    get color() {
        const ret = wasm.material_color(this.__wbg_ptr);
        var v1 = getArrayF32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {number}
     */
    get opacity() {
        const ret = wasm.material_opacity(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {any}
     */
    to_json() {
        const ret = wasm.material_to_json(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {number}
     */
    get metallic() {
        const ret = wasm.material_metallic(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get roughness() {
        const ret = wasm.material_roughness(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) Material.prototype[Symbol.dispose] = Material.prototype.free;

export class Mesh {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Mesh.prototype);
        obj.__wbg_ptr = ptr;
        MeshFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MeshFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mesh_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get face_count() {
        const ret = wasm.mesh_face_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Material} material
     */
    set material(material) {
        _assertClass(material, Material);
        var ptr0 = material.__destroy_into_raw();
        wasm.mesh_set_material(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {number}
     */
    get vertex_count() {
        const ret = wasm.mesh_vertex_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Float64Array} vertices
     * @param {Uint32Array} faces
     * @param {Float64Array} normals
     */
    constructor(vertices, faces, normals) {
        const ptr0 = passArrayF64ToWasm0(vertices, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray32ToWasm0(faces, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(normals, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.mesh_new(ptr0, len0, ptr1, len1, ptr2, len2);
        this.__wbg_ptr = ret >>> 0;
        MeshFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Uint32Array}
     */
    get faces() {
        const ret = wasm.mesh_faces(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Float64Array}
     */
    get normals() {
        const ret = wasm.mesh_normals(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * @returns {Material | undefined}
     */
    get material() {
        const ret = wasm.mesh_material(this.__wbg_ptr);
        return ret === 0 ? undefined : Material.__wrap(ret);
    }
    /**
     * @returns {Float64Array}
     */
    get vertices() {
        const ret = wasm.mesh_vertices(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
}
if (Symbol.dispose) Mesh.prototype[Symbol.dispose] = Mesh.prototype.free;

export class Point {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PointFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_point_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get x() {
        const ret = wasm.__wbg_get_boundingbox_min_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set x(arg0) {
        wasm.__wbg_set_boundingbox_min_x(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get y() {
        const ret = wasm.__wbg_get_boundingbox_min_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set y(arg0) {
        wasm.__wbg_set_boundingbox_min_y(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get z() {
        const ret = wasm.__wbg_get_boundingbox_min_z(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set z(arg0) {
        wasm.__wbg_set_boundingbox_min_z(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Point.prototype[Symbol.dispose] = Point.prototype.free;

/**
 * @param {Mesh} geometry_mesh
 * @param {number} edge_index
 * @param {number} distance
 * @returns {Mesh}
 */
export function add_chamfer(geometry_mesh, edge_index, distance) {
    _assertClass(geometry_mesh, Mesh);
    const ret = wasm.add_chamfer(geometry_mesh.__wbg_ptr, edge_index, distance);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @param {Mesh} geometry_mesh
 * @param {number} edge_index
 * @param {number} radius
 * @returns {Mesh}
 */
export function add_fillet(geometry_mesh, edge_index, radius) {
    _assertClass(geometry_mesh, Mesh);
    const ret = wasm.add_fillet(geometry_mesh.__wbg_ptr, edge_index, radius);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @param {Mesh} geometry_mesh
 * @param {number} position_x
 * @param {number} position_y
 * @param {number} position_z
 * @param {number} diameter
 * @param {number} depth
 * @returns {Mesh}
 */
export function add_hole(geometry_mesh, position_x, position_y, position_z, diameter, depth) {
    _assertClass(geometry_mesh, Mesh);
    const ret = wasm.add_hole(geometry_mesh.__wbg_ptr, position_x, position_y, position_z, diameter, depth);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @param {Mesh} mesh_a
 * @param {Mesh} mesh_b
 * @returns {Mesh}
 */
export function boolean_intersect(mesh_a, mesh_b) {
    _assertClass(mesh_a, Mesh);
    _assertClass(mesh_b, Mesh);
    const ret = wasm.boolean_intersect(mesh_a.__wbg_ptr, mesh_b.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @param {Mesh} base_mesh
 * @param {Mesh} tool_mesh
 * @returns {Mesh}
 */
export function boolean_subtract(base_mesh, tool_mesh) {
    _assertClass(base_mesh, Mesh);
    _assertClass(tool_mesh, Mesh);
    const ret = wasm.boolean_subtract(base_mesh.__wbg_ptr, tool_mesh.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @param {Mesh} mesh_a
 * @param {Mesh} mesh_b
 * @returns {Mesh}
 */
export function boolean_union(mesh_a, mesh_b) {
    _assertClass(mesh_a, Mesh);
    _assertClass(mesh_b, Mesh);
    const ret = wasm.boolean_union(mesh_a.__wbg_ptr, mesh_b.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @param {Mesh} mesh
 * @returns {BoundingBox}
 */
export function compute_bounding_box(mesh) {
    _assertClass(mesh, Mesh);
    const ret = wasm.compute_bounding_box(mesh.__wbg_ptr);
    return BoundingBox.__wrap(ret);
}

/**
 * @param {Mesh} mesh
 * @returns {string}
 */
export function compute_mesh_hash(mesh) {
    let deferred1_0;
    let deferred1_1;
    try {
        _assertClass(mesh, Mesh);
        const ret = wasm.compute_mesh_hash(mesh.__wbg_ptr);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * @returns {Material}
 */
export function create_aluminum_material() {
    const ret = wasm.create_aluminum_material();
    return Material.__wrap(ret);
}

/**
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @returns {Mesh}
 */
export function create_box(width, height, depth) {
    const ret = wasm.create_box(width, height, depth);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @returns {Material}
 */
export function create_brass_material() {
    const ret = wasm.create_brass_material();
    return Material.__wrap(ret);
}

/**
 * @param {number} radius
 * @param {number} height
 * @param {number | null} [segments]
 * @returns {Mesh}
 */
export function create_cone(radius, height, segments) {
    const ret = wasm.create_cone(radius, height, isLikeNone(segments) ? 0x100000001 : (segments) >>> 0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @returns {Material}
 */
export function create_copper_material() {
    const ret = wasm.create_copper_material();
    return Material.__wrap(ret);
}

/**
 * @param {number} radius
 * @param {number} height
 * @param {number | null} [segments]
 * @returns {Mesh}
 */
export function create_cylinder(radius, height, segments) {
    const ret = wasm.create_cylinder(radius, height, isLikeNone(segments) ? 0x100000001 : (segments) >>> 0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @returns {Material}
 */
export function create_plastic_material() {
    const ret = wasm.create_plastic_material();
    return Material.__wrap(ret);
}

/**
 * @param {number} radius
 * @param {number | null} [segments_lat]
 * @param {number | null} [segments_lon]
 * @returns {Mesh}
 */
export function create_sphere(radius, segments_lat, segments_lon) {
    const ret = wasm.create_sphere(radius, isLikeNone(segments_lat) ? 0x100000001 : (segments_lat) >>> 0, isLikeNone(segments_lon) ? 0x100000001 : (segments_lon) >>> 0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @returns {Material}
 */
export function create_steel_material() {
    const ret = wasm.create_steel_material();
    return Material.__wrap(ret);
}

/**
 * @returns {Material}
 */
export function create_titanium_material() {
    const ret = wasm.create_titanium_material();
    return Material.__wrap(ret);
}

/**
 * @param {number} major_radius
 * @param {number} minor_radius
 * @param {number | null} [segments_major]
 * @param {number | null} [segments_minor]
 * @returns {Mesh}
 */
export function create_torus(major_radius, minor_radius, segments_major, segments_minor) {
    const ret = wasm.create_torus(major_radius, minor_radius, isLikeNone(segments_major) ? 0x100000001 : (segments_major) >>> 0, isLikeNone(segments_minor) ? 0x100000001 : (segments_minor) >>> 0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Mesh.__wrap(ret[0]);
}

/**
 * @param {Mesh} mesh
 * @param {string} filename
 * @returns {string}
 */
export function export_obj(mesh, filename) {
    let deferred3_0;
    let deferred3_1;
    try {
        _assertClass(mesh, Mesh);
        const ptr0 = passStringToWasm0(filename, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.export_obj(mesh.__wbg_ptr, ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {Mesh} mesh
 * @param {string} filename
 * @returns {string}
 */
export function export_stl(mesh, filename) {
    let deferred3_0;
    let deferred3_1;
    try {
        _assertClass(mesh, Mesh);
        const ptr0 = passStringToWasm0(filename, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.export_stl(mesh.__wbg_ptr, ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * @param {Uint8Array} asset_data
 * @returns {any}
 */
export function validate_asset(asset_data) {
    const ptr0 = passArray8ToWasm0(asset_data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validate_asset(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_log_1d990106d99dacb7 = function(arg0) {
        console.log(arg0);
    };
    imports.wbg.__wbg_new_1ba21ce319a06297 = function() {
        const ret = new Object();
        return ret;
    };
    imports.wbg.__wbg_new_25f239778d6112b9 = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_set_3fda3bac07393de4 = function(arg0, arg1, arg2) {
        arg0[arg1] = arg2;
    };
    imports.wbg.__wbg_set_7df433eea03a5c14 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
        // Cast intrinsic for `F64 -> Externref`.
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_externrefs;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
    };

    return imports;
}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedFloat32ArrayMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('cadmium_core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
