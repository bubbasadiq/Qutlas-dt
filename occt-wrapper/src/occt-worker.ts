// occt-wrapper/src/occt-worker.ts
import { OCCT } from "./occt-loader";

let occtInstance: OCCT | null = null;
let wasmReady = false;

const loadOCCT = async () => {
  const Module = await import("/occt/occt.js"); // path in public/
  occtInstance = new OCCT(Module);
  await occtInstance.init();
  wasmReady = true;
  postMessage({ type: "ready" });
};

loadOCCT();

self.onmessage = async (event: MessageEvent<any>) => {
  const { id, type, data } = event.data;

  if (!wasmReady) {
    postMessage({ id, error: "OCCT not ready" });
    return;
  }

  try {
    let result;
    switch (type) {
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
        throw new Error("Unknown message type");
    }
    postMessage({ id, result });
  } catch (err) {
    postMessage({ id, error: err instanceof Error ? err.message : "Unknown error" });
  }
};

