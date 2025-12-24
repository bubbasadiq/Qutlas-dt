// occt-wrapper/src/occt-worker.ts
import { OCCT } from "./occt-loader";

let occtInstance: OCCT | null = null;
let wasmReady = false;

const loadOCCT = async () => {
  const Module = await import(/* webpackIgnore: true */ "/occt/occt.js"); // path in public/
  occtInstance = new OCCT(Module);
  await occtInstance.init();
  wasmReady = true;
  postMessage({ type: "ready" });
};

loadOCCT();

self.onmessage = async (event: MessageEvent<any>) => {
  const { id, type, data, objectId, params } = event.data;

  if (!wasmReady && type !== "status") {
    postMessage({ id, error: "OCCT not ready" });
    return;
  }

  try {
    let result;
    switch (type) {
      case "status":
        result = { ready: wasmReady };
        break;
      case "load-object":
        // Handle CAD file loading (STEP, IGES, STL)
        // For now, return a mock object ID
        result = { objectId: `obj_${Date.now()}`, success: true };
        break;
      case "update-parameters":
        // Handle parameter updates for an object
        // This would regenerate geometry with new parameters
        result = { objectId, params, success: true };
        break;
      case "make-box":
        result = occtInstance!.makeBox(data.width, data.height, data.depth);
        break;
      case "boolean":
        result = occtInstance!.boolean(data.op, data.shapeA, data.shapeB);
        break;
      case "mesh":
        result = occtInstance!.mesh(data.shape, data.deflection);
        break;
      case "export-step":
        result = occtInstance!.exportSTEP(data.shape);
        break;
      default:
        throw new Error("Unknown message type: " + type);
    }
    postMessage({ id, result });
  } catch (err) {
    postMessage({ id, error: err instanceof Error ? err.message : "Unknown error" });
  }
};

