import init, * as cadmium from '../wasm/pkg/cadmium_core.js';

let CadmiumCore = null;
let isInitialized = false;
let initializationError = null;

const MAX_CACHE_SIZE_MB = 100;
const CACHE_TTL_MS = 60 * 60 * 1000;

const geometryCache = new Map();
let totalCacheSize = 0;

function estimateMeshSize(mesh) {
  const vertexSize = (mesh.vertices?.length || 0) * 8;
  const faceSize = (mesh.faces?.length || 0) * 4;
  const normalSize = (mesh.normals?.length || 0) * 8;
  return vertexSize + faceSize + normalSize;
}

function evictLRUIfNeeded() {
  const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

  while (totalCacheSize > maxSizeBytes && geometryCache.size > 0) {
    let oldestId = null;
    let oldestTime = Infinity;

    for (const [id, entry] of geometryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestId = id;
      }
    }

    if (!oldestId) break;

    const entry = geometryCache.get(oldestId);
    if (!entry) break;

    totalCacheSize -= entry.size;
    geometryCache.delete(oldestId);
  }
}

function cleanupCache() {
  const now = Date.now();
  const entriesToDelete = [];

  for (const [id, entry] of geometryCache.entries()) {
    if (now - entry.lastAccessed > CACHE_TTL_MS) {
      entriesToDelete.push(id);
      totalCacheSize -= entry.size;
    }
  }

  for (const id of entriesToDelete) {
    geometryCache.delete(id);
  }

  evictLRUIfNeeded();
}

function addToCache(id, mesh) {
  const size = estimateMeshSize(mesh);

  const existing = geometryCache.get(id);
  if (existing) {
    totalCacheSize -= existing.size;
  }

  geometryCache.set(id, { mesh, lastAccessed: Date.now(), size });
  totalCacheSize += size;

  evictLRUIfNeeded();
}

function getFromCache(id) {
  const entry = geometryCache.get(id);
  if (entry) {
    entry.lastAccessed = Date.now();
    return entry.mesh;
  }
  return null;
}

function generateGeometryId() {
  return `geo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function convertMeshToTransferable(mesh) {
  return {
    vertices: Array.from(mesh.vertices || []),
    indices: Array.from(mesh.faces || []),
    normals: Array.from(mesh.normals || []),
  };
}

const initPromise = (async () => {
  try {
    await init();
    CadmiumCore = cadmium;
    isInitialized = true;

    self.postMessage({
      type: 'READY',
      message: 'Cadmium Worker initialized successfully',
    });

    setInterval(cleanupCache, 5 * 60 * 1000);
  } catch (error) {
    initializationError = error;
    const message = error instanceof Error ? error.message : String(error);

    self.postMessage({
      type: 'ERROR',
      error: `Initialization failed: ${message}`,
    });
  }
})();

async function handleOperation(operation, payload) {
  if (!CadmiumCore) {
    throw new Error('Cadmium Core not initialized. Please refresh the page.');
  }

  if (operation === 'INIT') {
    return { success: true, message: 'Worker is ready' };
  }

  switch (operation) {
    case 'CREATE_BOX': {
      const { width, height, depth } = payload;
      const mesh = CadmiumCore.create_box(width, height, depth);
      const geometryId = generateGeometryId();
      addToCache(geometryId, mesh);
      return { geometryId, mesh: convertMeshToTransferable(mesh) };
    }

    case 'CREATE_CYLINDER': {
      const { radius, height, segments } = payload;
      const mesh = CadmiumCore.create_cylinder(radius, height, segments);
      const geometryId = generateGeometryId();
      addToCache(geometryId, mesh);
      return { geometryId, mesh: convertMeshToTransferable(mesh) };
    }

    case 'CREATE_SPHERE': {
      const { radius, segmentsLat, segmentsLon } = payload;
      const mesh = CadmiumCore.create_sphere(radius, segmentsLat, segmentsLon);
      const geometryId = generateGeometryId();
      addToCache(geometryId, mesh);
      return { geometryId, mesh: convertMeshToTransferable(mesh) };
    }

    case 'CREATE_CONE': {
      const { radius, height, segments } = payload;
      const mesh = CadmiumCore.create_cone(radius, height, segments);
      const geometryId = generateGeometryId();
      addToCache(geometryId, mesh);
      return { geometryId, mesh: convertMeshToTransferable(mesh) };
    }

    case 'CREATE_TORUS': {
      const { majorRadius, minorRadius, segmentsMajor, segmentsMinor } = payload;
      const mesh = CadmiumCore.create_torus(
        majorRadius,
        minorRadius,
        segmentsMajor,
        segmentsMinor
      );
      const geometryId = generateGeometryId();
      addToCache(geometryId, mesh);
      return { geometryId, mesh: convertMeshToTransferable(mesh) };
    }

    case 'LOAD_MESH': {
      const { mesh: meshData } = payload;
      const mesh = new CadmiumCore.Mesh(
        new Float64Array(meshData.vertices),
        new Uint32Array(meshData.indices),
        new Float64Array(meshData.normals || [])
      );

      const geometryId = generateGeometryId();
      addToCache(geometryId, mesh);
      return { geometryId, mesh: convertMeshToTransferable(mesh) };
    }

    case 'BOOLEAN_UNION': {
      const { geometryId1, geometryId2 } = payload;
      const mesh1 = getFromCache(geometryId1);
      const mesh2 = getFromCache(geometryId2);

      if (!mesh1 || !mesh2) throw new Error('Geometry not found in cache');

      const resultMesh = CadmiumCore.boolean_union(mesh1, mesh2);
      const geometryId = generateGeometryId();
      addToCache(geometryId, resultMesh);
      return { geometryId, mesh: convertMeshToTransferable(resultMesh) };
    }

    case 'BOOLEAN_SUBTRACT': {
      const { geometryId1, geometryId2 } = payload;
      const mesh1 = getFromCache(geometryId1);
      const mesh2 = getFromCache(geometryId2);

      if (!mesh1 || !mesh2) throw new Error('Geometry not found in cache');

      const resultMesh = CadmiumCore.boolean_subtract(mesh1, mesh2);
      const geometryId = generateGeometryId();
      addToCache(geometryId, resultMesh);
      return { geometryId, mesh: convertMeshToTransferable(resultMesh) };
    }

    case 'BOOLEAN_INTERSECT': {
      const { geometryId1, geometryId2 } = payload;
      const mesh1 = getFromCache(geometryId1);
      const mesh2 = getFromCache(geometryId2);

      if (!mesh1 || !mesh2) throw new Error('Geometry not found in cache');

      const resultMesh = CadmiumCore.boolean_intersect(mesh1, mesh2);
      const geometryId = generateGeometryId();
      addToCache(geometryId, resultMesh);
      return { geometryId, mesh: convertMeshToTransferable(resultMesh) };
    }

    case 'ADD_HOLE': {
      const { geometryId, position, diameter, depth } = payload;
      const mesh = getFromCache(geometryId);
      if (!mesh) throw new Error('Geometry not found in cache');

      const resultMesh = CadmiumCore.add_hole(
        mesh,
        position.x,
        position.y,
        position.z,
        diameter,
        depth
      );

      const newGeometryId = generateGeometryId();
      addToCache(newGeometryId, resultMesh);
      return { geometryId: newGeometryId, mesh: convertMeshToTransferable(resultMesh) };
    }

    case 'ADD_FILLET': {
      const { geometryId, edgeIndex, radius } = payload;
      const mesh = getFromCache(geometryId);
      if (!mesh) throw new Error('Geometry not found in cache');

      const resultMesh = CadmiumCore.add_fillet(mesh, edgeIndex, radius);
      const newGeometryId = generateGeometryId();
      addToCache(newGeometryId, resultMesh);
      return { geometryId: newGeometryId, mesh: convertMeshToTransferable(resultMesh) };
    }

    case 'ADD_CHAMFER': {
      const { geometryId, edgeIndex, distance } = payload;
      const mesh = getFromCache(geometryId);
      if (!mesh) throw new Error('Geometry not found in cache');

      const resultMesh = CadmiumCore.add_chamfer(mesh, edgeIndex, distance);
      const newGeometryId = generateGeometryId();
      addToCache(newGeometryId, resultMesh);
      return { geometryId: newGeometryId, mesh: convertMeshToTransferable(resultMesh) };
    }

    case 'GET_MESH': {
      const { geometryId } = payload;
      const mesh = getFromCache(geometryId);
      if (!mesh) throw new Error('Geometry not found in cache');
      return convertMeshToTransferable(mesh);
    }

    case 'COMPUTE_BOUNDING_BOX': {
      const { geometryId } = payload;
      const mesh = getFromCache(geometryId);
      if (!mesh) throw new Error('Geometry not found in cache');

      const bbox = CadmiumCore.compute_bounding_box(mesh);
      return {
        min_x: bbox.min_x,
        min_y: bbox.min_y,
        min_z: bbox.min_z,
        max_x: bbox.max_x,
        max_y: bbox.max_y,
        max_z: bbox.max_z,
      };
    }

    case 'EXPORT_STL': {
      const { geometryId, filename } = payload;
      const mesh = getFromCache(geometryId);
      if (!mesh) throw new Error('Geometry not found in cache');
      return { content: CadmiumCore.export_stl(mesh, filename), format: 'stl' };
    }

    case 'EXPORT_OBJ': {
      const { geometryId, filename } = payload;
      const mesh = getFromCache(geometryId);
      if (!mesh) throw new Error('Geometry not found in cache');
      return { content: CadmiumCore.export_obj(mesh, filename), format: 'obj' };
    }

    case 'CLEAR_CACHE': {
      geometryCache.clear();
      totalCacheSize = 0;
      return { success: true, message: 'Cache cleared' };
    }

    case 'REMOVE_GEOMETRY': {
      const { geometryId } = payload;
      const entry = geometryCache.get(geometryId);
      const deleted = geometryCache.delete(geometryId);
      if (deleted && entry) totalCacheSize -= entry.size;
      return { success: deleted };
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

self.onmessage = async (event) => {
  const { id, operation, payload } = event.data || {};

  await initPromise;

  if (!isInitialized) {
    const message = initializationError instanceof Error
      ? initializationError.message
      : 'Worker not initialized';

    self.postMessage({
      id,
      type: 'ERROR',
      error: message,
    });
    return;
  }

  try {
    const result = await handleOperation(operation, payload);
    self.postMessage({ id, type: 'RESULT', result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ id, type: 'ERROR', error: message });
  }
};
