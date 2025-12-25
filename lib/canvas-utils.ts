// Canvas utilities for Three.js mesh rendering
// Provides bridge between geometry execution and Three.js scene

import * as THREE from 'three'

interface MeshData {
  vertices: Float32Array | number[]
  indices: Uint32Array | number[]
  normals: Float32Array | number[]
}

let sceneRef: THREE.Scene | null = null
let meshRegistry = new Map<string, THREE.Mesh>()

/**
 * Sets the Three.js scene reference for mesh updates
 */
export function setCanvasScene(scene: THREE.Scene) {
  sceneRef = scene
  console.log('Canvas scene reference set')
}

/**
 * Gets the current scene reference
 */
export function getCanvasScene(): THREE.Scene | null {
  return sceneRef
}

/**
 * Updates or creates a mesh in the Three.js scene
 */
export function updateCanvasMesh(id: string, meshData: MeshData, color?: number) {
  if (!sceneRef) {
    console.warn('Canvas scene not set, cannot update mesh')
    return
  }

  // Remove old mesh if it exists
  const oldMesh = meshRegistry.get(id)
  if (oldMesh) {
    sceneRef.remove(oldMesh)
    oldMesh.geometry.dispose()
    if (oldMesh.material instanceof THREE.Material) {
      oldMesh.material.dispose()
    }
  }

  // Convert to typed arrays if needed
  const vertices = meshData.vertices instanceof Float32Array 
    ? meshData.vertices 
    : new Float32Array(meshData.vertices)
  
  const indices = meshData.indices instanceof Uint32Array 
    ? meshData.indices 
    : new Uint32Array(meshData.indices)
  
  const normals = meshData.normals instanceof Float32Array 
    ? meshData.normals 
    : new Float32Array(meshData.normals)

  // Create BufferGeometry
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeBoundingSphere()

  // Create material
  const material = new THREE.MeshPhongMaterial({
    color: color || 0x0077ff,
    specular: 0x222222,
    shininess: 150,
    flatShading: false,
    side: THREE.DoubleSide,
  })

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.name = id

  // Add to scene and registry
  sceneRef.add(mesh)
  meshRegistry.set(id, mesh)

  console.log(`✓ Updated mesh ${id}: ${vertices.length / 3} vertices, ${indices.length / 3} triangles`)
}

/**
 * Removes a mesh from the scene
 */
export function removeCanvasMesh(id: string) {
  if (!sceneRef) return

  const mesh = meshRegistry.get(id)
  if (mesh) {
    sceneRef.remove(mesh)
    mesh.geometry.dispose()
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose()
    }
    meshRegistry.delete(id)
  }
}

/**
 * Gets a mesh by ID
 */
export function getCanvasMesh(id: string): THREE.Mesh | undefined {
  return meshRegistry.get(id)
}

/**
 * Clears all meshes from the scene
 */
export function clearAllMeshes() {
  if (!sceneRef) return

  meshRegistry.forEach((mesh) => {
    sceneRef!.remove(mesh)
    mesh.geometry.dispose()
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose()
    }
  })

  meshRegistry.clear()
  console.log('All meshes cleared')
}

/**
 * Updates mesh material color
 */
export function updateMeshColor(id: string, color: number) {
  const mesh = meshRegistry.get(id)
  if (mesh && mesh.material instanceof THREE.MeshPhongMaterial) {
    mesh.material.color.setHex(color)
  }
}

/**
 * Highlights a mesh (for selection)
 */
export function highlightMesh(id: string, highlighted: boolean) {
  const mesh = meshRegistry.get(id)
  if (mesh && mesh.material instanceof THREE.MeshPhongMaterial) {
    if (highlighted) {
      mesh.material.emissive.setHex(0x333333)
    } else {
      mesh.material.emissive.setHex(0x000000)
    }
  }
}

/**
 * Centers camera on all meshes
 */
export function centerCameraOnMeshes(camera: THREE.Camera, controls?: any) {
  if (!sceneRef || meshRegistry.size === 0) return

  const box = new THREE.Box3()
  meshRegistry.forEach((mesh) => {
    box.expandByObject(mesh)
  })

  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())

  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
  cameraZ *= 1.5 // Add some padding

  camera.position.set(center.x, center.y, center.z + cameraZ)
  
  if (controls && controls.target) {
    controls.target.copy(center)
    controls.update()
  }
}
