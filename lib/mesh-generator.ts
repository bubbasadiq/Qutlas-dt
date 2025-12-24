import * as THREE from 'three';
import { initializeOCCT, OCCTClient, Geometry, MeshData, Vector3 } from '@/lib/occt-client';
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

let occtClient: OCCTClient | null = null;

async function ensureOCCTInitialized(): Promise<OCCTClient> {
  if (!occtClient) {
    occtClient = await initializeOCCT();
  }
  return occtClient;
}

/**
 * Generates a THREE.js mesh from geometry metadata using OCCT
 * @param input Geometry metadata including type, dimensions, and features
 * @returns Promise<THREE.Mesh> ready to be added to the scene
 */
export async function generateMesh(input: MeshGeneratorInput): Promise<THREE.Mesh> {
  const { type, dimensions, features = [], selected, color } = input;
  
  try {
    const occt = await ensureOCCTInitialized();
    
    // Generate base geometry using OCCT
    let occtGeometry: Geometry;
    
    switch (type) {
      case 'box': {
        const width = dimensions.width || dimensions.length || 100;
        const height = dimensions.height || 100;
        const depth = dimensions.depth || dimensions.width || 100;
        occtGeometry = occt.createBox(width, height, depth);
        break;
      }
      
      case 'cylinder': {
        const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 50);
        const height = dimensions.height || 100;
        occtGeometry = occt.createCylinder(radius, height);
        break;
      }
      
      case 'sphere': {
        const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 50);
        occtGeometry = occt.createSphere(radius);
        break;
      }
      
      case 'cone': {
        const radius = dimensions.radius || (dimensions.diameter ? dimensions.diameter / 2 : 50);
        const height = dimensions.height || 100;
        occtGeometry = occt.createCone(radius, height);
        break;
      }
      
      case 'torus': {
        const majorRadius = dimensions.majorRadius || dimensions.radius || 100;
        const minorRadius = dimensions.minorRadius || dimensions.tube || 30;
        occtGeometry = occt.createTorus(majorRadius, minorRadius);
        break;
      }
      
      default: {
        const width = dimensions.width || dimensions.length || 100;
        const height = dimensions.height || 100;
        const depth = dimensions.depth || dimensions.width || 100;
        occtGeometry = occt.createBox(width, height, depth);
        break;
      }
    }
    
    // Apply features if any
    if (features.length > 0 && !occtGeometry.isNull()) {
      let processedGeometry = occtGeometry;
      
      for (const feature of features) {
        try {
          const params = feature.parameters || {};
          
          switch (feature.type) {
            case 'hole': {
              const position: Vector3 = {
                x: params.position?.x || 0,
                y: params.position?.y || 0,
                z: params.position?.z || 0
              };
              const diameter = params.diameter || (params.radius ? params.radius * 2 : 20);
              const depth = params.depth || params.height || 100;
              
              processedGeometry = occt.addHole(processedGeometry, position, diameter, depth);
              break;
            }
            
            case 'fillet': {
              const edgeIndex = params.edgeIndex || 0;
              const radius = params.radius || 5;
              
              processedGeometry = occt.addFillet(processedGeometry, edgeIndex, radius);
              break;
            }
            
            case 'chamfer': {
              const edgeIndex = params.edgeIndex || 0;
              const distance = params.distance || params.radius || 5;
              
              processedGeometry = occt.addChamfer(processedGeometry, edgeIndex, distance);
              break;
            }
            
            default:
              console.warn(`Unknown feature type: ${feature.type}`);
          }
        } catch (error) {
          console.error(`Error applying feature ${feature.type}:`, error);
        }
      }
      
      occtGeometry = processedGeometry;
    }
    
    // Generate mesh data from OCCT geometry
    if (!occtGeometry.isNull()) {
      const meshData = occt.getMeshData(occtGeometry);
      geometry = createBufferGeometry(meshData);
    } else {
      throw new Error('Failed to create geometry');
    }
    
  } catch (error) {
    console.error('OCCT generation failed, falling back to THREE.js primitives:', error);
    
    // Fallback to legacy THREE.js generation if OCCT fails
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

function createBufferGeometry(meshData: MeshData): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  const vertices = new Float32Array(meshData.vertices);
  const indices = new Uint32Array(meshData.indices);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  
  // Compute normals
  geometry.computeVertexNormals();
  
  return geometry;
}

/**
 * Updates an existing mesh with new geometry data
 * @param mesh Existing THREE.Mesh to update
 * @param input New geometry metadata
 */
export async function updateMesh(mesh: THREE.Mesh, input: MeshGeneratorInput): Promise<void> {
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
  };
}