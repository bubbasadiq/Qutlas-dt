import * as THREE from 'three';

export interface MeshData {
  vertices: Float32Array | number[];
  indices: Uint32Array | number[];
  normals?: Float32Array | number[];
}

let sceneRef: THREE.Scene | null = null;
const meshRegistry = new Map<string, THREE.Mesh>();

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if ((child as THREE.Mesh).geometry) {
      (child as THREE.Mesh).geometry.dispose();
    }

    const material = (child as THREE.Mesh).material;
    if (!material) return;

    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else {
      material.dispose();
    }
  });
}

export function setCanvasScene(scene: THREE.Scene | null): void {
  if (sceneRef && sceneRef !== scene) {
    clearAllMeshes();
  }

  sceneRef = scene;
}

export function getCanvasScene(): THREE.Scene | null {
  return sceneRef;
}

export function updateCanvasMesh(id: string, meshData: MeshData, color?: number): void {
  if (!sceneRef) return;

  if (!meshData?.vertices || !meshData?.indices) {
    console.error('Invalid mesh data received:', { id, meshData });
    return;
  }

  const oldMesh = meshRegistry.get(id);
  if (oldMesh) {
    sceneRef.remove(oldMesh);
    disposeObject3D(oldMesh);
    meshRegistry.delete(id);
  }

  const geometry = new THREE.BufferGeometry();

  const vertices =
    meshData.vertices instanceof Float32Array ? meshData.vertices : new Float32Array(meshData.vertices);

  const indices =
    meshData.indices instanceof Uint32Array ? meshData.indices : new Uint32Array(meshData.indices);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  if (meshData.normals) {
    const normals =
      meshData.normals instanceof Float32Array
        ? meshData.normals
        : new Float32Array(meshData.normals);
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  } else {
    geometry.computeVertexNormals();
  }

  geometry.computeBoundingSphere();

  const material = new THREE.MeshStandardMaterial({
    color: color ?? 0x0077ff,
    roughness: 0.4,
    metalness: 0.3,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.id = id;
  mesh.name = id;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  sceneRef.add(mesh);
  meshRegistry.set(id, mesh);
}

export function removeCanvasMesh(id: string): void {
  if (!sceneRef) return;

  const mesh = meshRegistry.get(id);
  if (!mesh) return;

  sceneRef.remove(mesh);
  disposeObject3D(mesh);
  meshRegistry.delete(id);
}

export function getCanvasMesh(id: string): THREE.Mesh | undefined {
  return meshRegistry.get(id);
}

export function clearAllMeshes(): void {
  if (!sceneRef) return;

  meshRegistry.forEach((mesh) => {
    sceneRef!.remove(mesh);
    disposeObject3D(mesh);
  });

  meshRegistry.clear();
}

export function updateMeshColor(id: string, color: number): void {
  const mesh = meshRegistry.get(id);
  if (!mesh) return;

  const material = mesh.material as THREE.MeshStandardMaterial;
  material.color.setHex(color);
}

export function highlightMesh(id: string, highlighted: boolean): void {
  const mesh = meshRegistry.get(id);
  if (!mesh) return;

  const material = mesh.material as THREE.MeshStandardMaterial;
  material.emissive.setHex(highlighted ? 0x333333 : 0x000000);
}

export function centerCameraOnMeshes(camera: THREE.Camera, controls?: { target?: THREE.Vector3; update?: () => void }): void {
  if (!sceneRef || meshRegistry.size === 0) return;

  const box = new THREE.Box3();
  meshRegistry.forEach((mesh) => {
    box.expandByObject(mesh);
  });

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const fov = perspectiveCamera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 1.5;

  camera.position.set(center.x, center.y, center.z + cameraZ);

  if (controls?.target) {
    controls.target.copy(center);
    controls.update?.();
  }
}
