// Cadmium Worker - Handles all geometry operations in a background thread
// This replaces the OCCT worker with lightweight Cadmium-Core WASM

import init, * as CadmiumCore from '../wasm/cadmium-core/pkg/cadmium_core';

interface WorkerMessage {
  id: string;
  operation: string;
  payload: any;
}

interface WorkerResponse {
  id: string;
  result?: any;
  error?: string;
  type: 'RESULT' | 'ERROR' | 'READY';
}

// Geometry cache with LRU + TTL
interface CacheEntry {
  mesh: any;
  lastAccessed: number;
  size: number;
}

const MAX_CACHE_SIZE_MB = 100;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const geometryCache = new Map<string, CacheEntry>();
let totalCacheSize = 0;

let isInitialized = false;
let initializationError: Error | null = null;

// Initialize Cadmium-Core WASM module
async function initialize() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Initializing Cadmium Worker (attempt ${attempt}/${MAX_RETRIES})...`);
      await init();
      isInitialized = true;
      
      self.postMessage({
        type: 'READY',
        message: 'Cadmium Worker initialized successfully'
      });
      
      console.log('✅ Cadmium Worker ready');
      
      // Start cache cleanup interval
      setInterval(cleanupCache, 5 * 60 * 1000); // Every 5 minutes
      
      return;
    } catch (error) {
      initializationError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Failed to initialize Cadmium Worker (attempt ${attempt}):`, error);
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }
  
  // All retries failed
  self.postMessage({
    type: 'ERROR',
    error: `Initialization failed after ${MAX_RETRIES} attempts: ${initializationError?.message}`
  });
}

// Main message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, operation, payload } = event.data;
  
  if (!isInitialized && operation !== 'INIT') {
    self.postMessage({
      id,
      type: 'ERROR',
      error: 'Worker not initialized'
    } as WorkerResponse);
    return;
  }
  
  try {
    const result = await handleOperation(operation, payload);
    
    self.postMessage({
      id,
      type: 'RESULT',
      result
    } as WorkerResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    self.postMessage({
      id,
      type: 'ERROR',
      error: errorMessage
    } as WorkerResponse);
  }
};

async function handleOperation(operation: string, payload: any): Promise<any> {
  switch (operation) {
    // ===== BASIC SHAPES =====
    case 'CREATE_BOX': {
      const { width, height, depth } = payload;
      const mesh = CadmiumCore.create_box(width, height, depth);
      const geometryId = generateGeometryId();
      
      addToCache(geometryId, mesh);
      
      return {
        geometryId,
        mesh: convertMeshToTransferable(mesh)
      };
    }
    
    case 'CREATE_CYLINDER': {
      const { radius, height, segments } = payload;
      const mesh = CadmiumCore.create_cylinder(radius, height, segments);
      const geometryId = generateGeometryId();
      
      addToCache(geometryId, mesh);
      
      return {
        geometryId,
        mesh: convertMeshToTransferable(mesh)
      };
    }
    
    case 'CREATE_SPHERE': {
      const { radius, segmentsLat, segmentsLon } = payload;
      const mesh = CadmiumCore.create_sphere(radius, segmentsLat, segmentsLon);
      const geometryId = generateGeometryId();
      
      addToCache(geometryId, mesh);
      
      return {
        geometryId,
        mesh: convertMeshToTransferable(mesh)
      };
    }
    
    case 'CREATE_CONE': {
      const { radius, height, segments } = payload;
      const mesh = CadmiumCore.create_cone(radius, height, segments);
      const geometryId = generateGeometryId();
      
      addToCache(geometryId, mesh);
      
      return {
        geometryId,
        mesh: convertMeshToTransferable(mesh)
      };
    }
    
    case 'CREATE_TORUS': {
      const { majorRadius, minorRadius, segmentsMajor, segmentsMinor } = payload;
      const mesh = CadmiumCore.create_torus(majorRadius, minorRadius, segmentsMajor, segmentsMinor);
      const geometryId = generateGeometryId();
      
      addToCache(geometryId, mesh);
      
      return {
        geometryId,
        mesh: convertMeshToTransferable(mesh)
      };
    }
    
    // ===== BOOLEAN OPERATIONS =====
    case 'BOOLEAN_UNION': {
      const { geometryId1, geometryId2 } = payload;
      const mesh1 = getFromCache(geometryId1);
      const mesh2 = getFromCache(geometryId2);
      
      if (!mesh1 || !mesh2) {
        throw new Error('Geometry not found in cache');
      }
      
      const resultMesh = CadmiumCore.boolean_union(mesh1, mesh2);
      const geometryId = generateGeometryId();
      
      addToCache(geometryId, resultMesh);
      
      return {
        geometryId,
        mesh: convertMeshToTransferable(resultMesh)
      };
    }
    
    case 'BOOLEAN_SUBTRACT': {
      const { geometryId1, geometryId2 } = payload;
      const mesh1 = getFromCache(geometryId1);
      const mesh2 = getFromCache(geometryId2);
      
      if (!mesh1 || !mesh2) {
        throw new Error('Geometry not found in cache');
      }
      
      const resultMesh = CadmiumCore.boolean_subtract(mesh1, mesh2);
      const geometryId = generateGeometryId();
      
      addToCache(geometryId, resultMesh);
      
      return {
        geometryId,
        mesh: convertMeshToTransferable(resultMesh)
      };
    }
    
    case 'BOOLEAN_INTERSECT': {
      const { geometryId1, geometryId2 } = payload;
      const mesh1 = getFromCache(geometryId1);
      const mesh2 = getFromCache(geometryId2);
      
      if (!mesh1 || !mesh2) {
        throw new Error('Geometry not found in cache');
      }
      
      const resultMesh = CadmiumCore.boolean_intersect(mesh1, mesh2);
      const geometryId = generateGeometryId();
      
      addToCache(geometryId, resultMesh);
      
      return {
        geometryId,
        mesh: convertMeshToTransferable(resultMesh)
      };
    }
    
    // ===== FEATURE OPERATIONS =====
    case 'ADD_HOLE': {
      const { geometryId, position, diameter, depth } = payload;
      const mesh = getFromCache(geometryId);
      
      if (!mesh) {
        throw new Error('Geometry not found in cache');
      }
      
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
      
      return {
        geometryId: newGeometryId,
        mesh: convertMeshToTransferable(resultMesh)
      };
    }
    
    case 'ADD_FILLET': {
      const { geometryId, edgeIndex, radius } = payload;
      const mesh = getFromCache(geometryId);
      
      if (!mesh) {
        throw new Error('Geometry not found in cache');
      }
      
      const resultMesh = CadmiumCore.add_fillet(mesh, edgeIndex, radius);
      const newGeometryId = generateGeometryId();
      
      addToCache(newGeometryId, resultMesh);
      
      return {
        geometryId: newGeometryId,
        mesh: convertMeshToTransferable(resultMesh)
      };
    }
    
    case 'ADD_CHAMFER': {
      const { geometryId, edgeIndex, distance } = payload;
      const mesh = getFromCache(geometryId);
      
      if (!mesh) {
        throw new Error('Geometry not found in cache');
      }
      
      const resultMesh = CadmiumCore.add_chamfer(mesh, edgeIndex, distance);
      const newGeometryId = generateGeometryId();
      
      addToCache(newGeometryId, resultMesh);
      
      return {
        geometryId: newGeometryId,
        mesh: convertMeshToTransferable(resultMesh)
      };
    }
    
    // ===== MESH OPERATIONS =====
    case 'GET_MESH': {
      const { geometryId } = payload;
      const mesh = getFromCache(geometryId);
      
      if (!mesh) {
        throw new Error('Geometry not found in cache');
      }
      
      return convertMeshToTransferable(mesh);
    }
    
    case 'COMPUTE_BOUNDING_BOX': {
      const { geometryId } = payload;
      const mesh = getFromCache(geometryId);
      
      if (!mesh) {
        throw new Error('Geometry not found in cache');
      }
      
      const bbox = CadmiumCore.compute_bounding_box(mesh);
      return bbox;
    }
    
    // ===== EXPORT OPERATIONS =====
    case 'EXPORT_STL': {
      const { geometryId, filename } = payload;
      const mesh = getFromCache(geometryId);
      
      if (!mesh) {
        throw new Error('Geometry not found in cache');
      }
      
      const stlContent = CadmiumCore.export_stl(mesh, filename);
      return { content: stlContent, format: 'stl' };
    }
    
    case 'EXPORT_OBJ': {
      const { geometryId, filename } = payload;
      const mesh = getFromCache(geometryId);
      
      if (!mesh) {
        throw new Error('Geometry not found in cache');
      }
      
      const objContent = CadmiumCore.export_obj(mesh, filename);
      return { content: objContent, format: 'obj' };
    }
    
    // ===== CACHE MANAGEMENT =====
    case 'CLEAR_CACHE': {
      geometryCache.clear();
      return { success: true, message: 'Cache cleared' };
    }
    
    case 'REMOVE_GEOMETRY': {
      const { geometryId } = payload;
      const deleted = geometryCache.delete(geometryId);
      return { success: deleted };
    }
    
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// Convert WASM mesh to transferable JavaScript object
function convertMeshToTransferable(mesh: any): any {
  return {
    vertices: Array.from(mesh.vertices || []),
    indices: Array.from(mesh.faces || []),
    normals: Array.from(mesh.normals || [])
  };
}

// Generate unique geometry ID
function generateGeometryId(): string {
  return `geo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Cache management functions
function estimateMeshSize(mesh: any): number {
  // Estimate size in bytes
  const vertexSize = (mesh.vertices?.length || 0) * 8; // f64 = 8 bytes
  const faceSize = (mesh.faces?.length || 0) * 4; // u32 = 4 bytes
  const normalSize = (mesh.normals?.length || 0) * 8;
  return vertexSize + faceSize + normalSize;
}

function cleanupCache() {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  // Remove expired entries
  for (const [id, entry] of geometryCache.entries()) {
    if (now - entry.lastAccessed > CACHE_TTL_MS) {
      entriesToDelete.push(id);
      totalCacheSize -= entry.size;
    }
  }
  
  for (const id of entriesToDelete) {
    geometryCache.delete(id);
  }
  
  if (entriesToDelete.length > 0) {
    console.log(`🧹 Cleaned up ${entriesToDelete.length} expired cache entries`);
  }
  
  // Enforce size limit with LRU eviction
  evictLRUIfNeeded();
}

function evictLRUIfNeeded() {
  const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;
  
  while (totalCacheSize > maxSizeBytes && geometryCache.size > 0) {
    // Find least recently used entry
    let oldestId: string | null = null;
    let oldestTime = Infinity;
    
    for (const [id, entry] of geometryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestId = id;
      }
    }
    
    if (oldestId) {
      const entry = getFromCache(oldestId);
      if (entry) {
        totalCacheSize -= entry.size;
        geometryCache.delete(oldestId);
        console.log(`♻️ Evicted LRU cache entry: ${oldestId}`);
      }
    } else {
      break;
    }
  }
}

function addToCache(id: string, mesh: any) {
  const size = estimateMeshSize(mesh);
  const entry: CacheEntry = {
    mesh,
    lastAccessed: Date.now(),
    size,
  };
  
  addToCache(id, entry);
  totalCacheSize += size;
  
  evictLRUIfNeeded();
}

function getFromCache(id: string): any | null {
  const entry = getFromCache(id);
  if (entry) {
    entry.lastAccessed = Date.now();
    return entry.mesh;
  }
  return null;
}

// Start initialization
initialize();
