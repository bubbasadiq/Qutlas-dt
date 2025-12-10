
export type OCCTBoundingBox = {
  min: [number, number, number];
  max: [number, number, number];
};

export interface OCCTMesh {
  vertexCount: number;
  faceCount: number;
}

export class OCCT {
  private occtReady = false;

  constructor(private Module: any) {}

  async init() {
    await this.Module();
    this.occtReady = true;
  }

  checkReady() {
    if (!this.occtReady) throw new Error("OCCT not initialized");
  }

  makeBox(width: number, height: number, depth: number) {
    this.checkReady();
    const box = new this.Module.BRepPrimAPI_MakeBox_3(width, height, depth);
    return box;
  }

  boolean(op: "union" | "subtract" | "intersect", shapeA: any, shapeB: any) {
    this.checkReady();
    switch (op) {
      case "union":
        return new this.Module.BRepAlgoAPI_Fuse(shapeA, shapeB);
      case "subtract":
        return new this.Module.BRepAlgoAPI_Cut(shapeA, shapeB);
      case "intersect":
        return new this.Module.BRepAlgoAPI_Common(shapeA, shapeB);
    }
  }

  mesh(shape: any, deflection: number = 0.1): OCCTMesh {
    this.checkReady();
    const meshAlgo = new this.Module.BRepMesh_IncrementalMesh(shape, deflection);
    meshAlgo.Perform();
    // Fake counts as example; in production extract from shape
    return { vertexCount: 1000, faceCount: 500 };
  }

  exportSTEP(shape: any): string {
    this.checkReady();
    const writer = new this.Module.STEPControl_Writer();
    writer.Transfer(shape, this.Module.STEPControl_AsIs);
    writer.Write("output.stp"); // in browser: maybe replace with memory stream
    return "output.stp";
  }
}

