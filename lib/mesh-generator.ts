import * as THREE from 'three';
import type { WorkspaceObject } from '@/hooks/use-workspace';

export interface MeshGeneratorInput {
  type: string;
  dimensions: Record<string, number>;
  features?: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  material?: string;
  selected?: boolean;
  visible?: boolean;
  color?: string;
  meshData?: {
    vertices: number[] | Float32Array;
    indices: number[] | Uint32Array;
    normals?: number[] | Float32Array;
  };
}

/**
 * Generates a THREE.js mesh from geometry metadata
 * @param input Geometry metadata including type, dimensions, and optional meshData
 * @returns THREE.Mesh ready to be added to the scene
 */
export function generateMesh(input: MeshGeneratorInput): THREE.Mesh {
  const { type, dimensions, selected, color, meshData } = input;

  let geometry: THREE.BufferGeometry;

  // If pre-generated mesh data is provided (e.g. from Cadmium), use it
  if (meshData && meshData.vertices && meshData.indices) {
    geometry = new THREE.BufferGeometry();
    
    const vertices = meshData.vertices instanceof Float32Array 
      ? meshData.vertices 
      : new Float32Array(meshData.vertices);
      
    const indices = meshData.indices instanceof Uint32Array 
      ? meshData.indices 
      : new Uint32Array(meshData.indices);
      
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    if (meshData.normals) {
      const normals = meshData.normals instanceof Float32Array 
        ? meshData.normals 
        : new Float32Array(meshData.normals);
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    } else {
      geometry.computeVertexNormals();
    }
  } else {
    // Generate geometry using THREE.js primitives as fallback
    switch (type) {
      case 'box': {
        const width = dimensions.width || dimensions.length || 100;
        const height = dimensions.height || 100;
        const depth = dimensions.depth || dimensions.width || 100;
        geometry = new THREE.BoxGeometry(width, height, depth);
        break;
      }

      case 'cylinder': {
        const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 50);
        const height = dimensions.height || 100;
        geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        break;
      }

      case 'sphere': {
        const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 50);
        geometry = new THREE.SphereGeometry(radius, 32, 32);
        break;
      }

      case 'cone': {
        const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 50);
        const height = dimensions.height || 100;
        geometry = new THREE.ConeGeometry(radius, height, 32);
        break;
      }

      case 'torus': {
        const majorRadius = dimensions.majorRadius || dimensions.radius || 100;
        const minorRadius = dimensions.minorRadius || dimensions.tube || 30;
        geometry = new THREE.TorusGeometry(majorRadius, minorRadius, 16, 48);
        break;
      }

      default: {
        const width = dimensions.width || dimensions.length || 100;
        const height = dimensions.height || 100;
        const depth = dimensions.depth || dimensions.width || 100;
        geometry = new THREE.BoxGeometry(width, height, depth);
        break;
      }
    }
  }

  // Create material with appropriate color
  const materialColor = selected ? 0xff8800 : (color ? parseInt(color.replace('#', '0x')) : 0x0077ff);
  const meshMaterial = new THREE.MeshStandardMaterial({
    color: materialColor,
    roughness: 0.4,
    metalness: 0.3,
    emissive: selected ? 0x442200 : 0x000000,
  });

  const mesh = new THREE.Mesh(geometry, meshMaterial);
  mesh.visible = input.visible !== false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Updates an existing mesh with new properties
 * @param mesh Existing THREE.Mesh to update
 * @param input New geometry metadata
 */
export function updateMesh(mesh: THREE.Mesh, input: MeshGeneratorInput): void {
  // Update visibility
  mesh.visible = input.visible !== false;

  // Update material color
  const material = mesh.material as THREE.MeshStandardMaterial;
  const materialColor = input.selected ? 0xff8800 : (input.color ? parseInt(input.color.replace('#', '0x')) : 0x0077ff);
  material.color.setHex(materialColor);
  material.emissive.setHex(input.selected ? 0x442200 : 0x000000);
}

/**
 * Converts a WorkspaceObject to MeshGeneratorInput
 * @param obj WorkspaceObject from workspace context
 * @returns MeshGeneratorInput ready for mesh generation
 */
export function workspaceObjectToMeshInput(obj: WorkspaceObject): MeshGeneratorInput {
  return {
    type: obj.type,
    dimensions: obj.dimensions,
    features: obj.features,
    material: obj.material,
    selected: obj.selected,
    visible: obj.visible,
    color: obj.color,
    meshData: obj.meshData,
  };
}
