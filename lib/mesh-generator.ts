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
}

/**
 * Generates a THREE.js mesh from geometry metadata
 * @param input Geometry metadata including type, dimensions, and features
 * @returns THREE.Mesh ready to be added to the scene
 */
export function generateMesh(input: MeshGeneratorInput): THREE.Mesh {
  const { type, dimensions, features = [], selected, color } = input;
  
  let geometry: THREE.BufferGeometry;
  
  switch (type) {
    case 'box': {
      const width = dimensions.width || dimensions.length || 10;
      const height = dimensions.height || 10;
      const depth = dimensions.depth || dimensions.width || 10;
      geometry = new THREE.BoxGeometry(width, height, depth);
      break;
    }
    
    case 'cylinder': {
      const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 5);
      const height = dimensions.height || 10;
      geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      break;
    }
    
    case 'sphere': {
      const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 5);
      geometry = new THREE.SphereGeometry(radius, 32, 32);
      break;
    }
    
    case 'cone': {
      const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 5);
      const height = dimensions.height || 10;
      geometry = new THREE.ConeGeometry(radius, height, 32);
      break;
    }
    
    case 'torus': {
      const radius = dimensions.radius || 10;
      const tube = dimensions.tubeRadius || dimensions.tube || 3;
      geometry = new THREE.TorusGeometry(radius, tube, 16, 100);
      break;
    }
    
    case 'extrusion':
    case 'revolution':
    case 'compound':
    default: {
      // Default to box for unknown types or complex geometries
      const width = dimensions.width || dimensions.length || 10;
      const height = dimensions.height || 10;
      const depth = dimensions.depth || dimensions.width || 10;
      geometry = new THREE.BoxGeometry(width, height, depth);
      break;
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
  
  // Add features as visual indicators
  if (features.length > 0) {
    features.forEach((feature) => {
      if (feature.type === 'hole') {
        // Add a cylinder to represent hole (for visualization)
        const holeRadius = feature.parameters?.radius || 2;
        const holeDepth = feature.parameters?.depth || feature.parameters?.height || 5;
        const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 16);
        const holeMaterial = new THREE.MeshStandardMaterial({
          color: 0xff4444,
          transparent: true,
          opacity: 0.5,
        });
        const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
        
        // Position the hole
        if (feature.parameters?.position) {
          holeMesh.position.set(
            feature.parameters.position.x || 0,
            feature.parameters.position.y || 0,
            feature.parameters.position.z || 0
          );
        }
        
        // Rotate if needed (holes are typically perpendicular to surface)
        if (feature.parameters?.normal) {
          const normal = new THREE.Vector3(
            feature.parameters.normal.x || 0,
            feature.parameters.normal.y || 1,
            feature.parameters.normal.z || 0
          );
          holeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal.normalize());
        }
        
        mesh.add(holeMesh);
      } else if (feature.type === 'fillet' || feature.type === 'chamfer') {
        // Visual indication for fillets/chamfers (could be edge highlighting)
        // For now, just log them - full implementation would require edge detection
        console.log(`Feature ${feature.type} detected but not yet visualized`);
      }
    });
  }
  
  return mesh;
}

/**
 * Updates an existing mesh with new geometry data
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
  
  // Note: Updating geometry shape would require recreating the mesh
  // This is handled by the canvas viewer by removing and re-adding meshes
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
  };
}
