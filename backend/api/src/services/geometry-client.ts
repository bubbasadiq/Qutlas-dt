// In production, generate these with protoc from geometry.proto

interface GeometryServiceClient {
  loadAsset: (req: any, cb: (err: any, res: any) => void) => void
  boolean: (req: any, cb: (err: any, res: any) => void) => void
  fillet: (req: any, cb: (err: any, res: any) => void) => void
}

const GEOMETRY_SERVICE_URL = process.env.OCCT_WORKER_URL || "localhost:50051"

let client: GeometryServiceClient | null = null

function getClient(): GeometryServiceClient {
  if (!client) {
    client = {
      loadAsset: (req, cb) => {
        setTimeout(() => {
          cb(null, {
            mesh_data: Buffer.alloc(0),
            bounds: { min_x: 0, min_y: 0, min_z: 0, max_x: 100, max_y: 100, max_z: 100 },
          })
        }, 100)
      },
      boolean: (req, cb) => {
        setTimeout(() => {
          cb(null, { geometry_data: Buffer.alloc(0) })
        }, 100)
      },
      fillet: (req, cb) => {
        setTimeout(() => {
          cb(null, { geometry_data: Buffer.alloc(0) })
        }, 100)
      },
    }
  }
  return client
}

export interface BoundingBox {
  min: [number, number, number]
  max: [number, number, number]
}

export async function loadAsset(
  assetId: string,
  assetData: Buffer,
): Promise<{ meshData: Buffer; bounds: BoundingBox }> {
  return new Promise((resolve, reject) => {
    getClient().loadAsset(
      {
        asset_id: assetId,
        asset_data: assetData,
      },
      (err, response) => {
        if (err) reject(err)
        resolve({
          meshData: response?.mesh_data || Buffer.alloc(0),
          bounds: {
            min: [response?.bounds?.min_x || 0, response?.bounds?.min_y || 0, response?.bounds?.min_z || 0],
            max: [response?.bounds?.max_x || 100, response?.bounds?.max_y || 100, response?.bounds?.max_z || 100],
          },
        })
      },
    )
  })
}

export async function performBoolean(
  geometryA: Buffer,
  geometryB: Buffer,
  operation: "union" | "difference" | "intersection",
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    getClient().boolean(
      {
        geometry_a: geometryA,
        geometry_b: geometryB,
        operation,
      },
      (err, response) => {
        if (err) reject(err)
        resolve(response?.geometry_data || Buffer.alloc(0))
      },
    )
  })
}

export async function applyFillet(geometry: Buffer, edgeIndices: number[], radius: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    getClient().fillet(
      {
        geometry,
        edge_indices: edgeIndices,
        radius,
      },
      (err, response) => {
        if (err) reject(err)
        resolve(response?.geometry_data || Buffer.alloc(0))
      },
    )
  })
}
