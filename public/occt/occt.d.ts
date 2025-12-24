export interface MeshData {
  vertices: number[]
  indices: number[]
  colors?: number[]
  normals?: number[]
}

export interface BoundingBox {
  x: number
  y: number
  z: number
  width: number
  height: number
  depth: number
}

export interface DFMScore {
  machiningScore: number
  moldingScore: number
  printingScore: number
}

export interface DFMWarning {
  type: string
  severity: 'error' | 'warning' | 'info'
  message: string
}

export interface DFMReport {
  warnings: DFMWarning[]
  scores: DFMScore
}

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Geometry {
  isNull(): boolean
}

interface OCCTModule {
  createBox(width: number, height: number, depth: number): Geometry
  createCylinder(radius: number, height: number): Geometry
  createSphere(radius: number): Geometry
  createCone(radius: number, height: number): Geometry
  createTorus(majorRadius: number, minorRadius: number): Geometry
  unionShapes(shape1: Geometry, shape2: Geometry): Geometry
  cutShapes(shape1: Geometry, shape2: Geometry): Geometry
  intersectShapes(shape1: Geometry, shape2: Geometry): Geometry
  addHole(geometry: Geometry, position: Vector3, diameter: number, depth: number): Geometry
  addFillet(geometry: Geometry, edgeIndex: number, radius: number): Geometry
  addChamfer(geometry: Geometry, edgeIndex: number, distance: number): Geometry
  extrude(profile: Geometry, distance: number): Geometry
  revolve(profile: Geometry, axis: Vector3, angle: number): Geometry
  getMeshData(geometry: Geometry): MeshData
  getBoundingBox(geometry: Geometry): BoundingBox
  analyzeManufacturability(geometry: Geometry): DFMReport
  exportToSTEP(geometry: Geometry, filename: string): boolean
  exportToIGES(geometry: Geometry, filename: string): boolean
  exportToSTL(geometry: Geometry, filename: string): boolean
}

export default function OCCTModule(): Promise<OCCTModule>
