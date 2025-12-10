
import init, { apply_parameters, validate_asset, solve_constraint } from "/wasm/cadmium-core/pkg/cadmium_core.js";

let wasmReady = false;
init().then(() => {
  wasmReady = true;
  postMessage({ type: "ready" });
});

self.onmessage = async (event: MessageEvent<any>) => {
  const { id, type, data } = event.data;

  if (!wasmReady) {
    postMessage({ id, error: "Cadmium WASM not ready" });
    return;
  }

  try {
    let result;
    switch (type) {
      case "validate-asset":
        result = validate_asset(new Uint8Array(data));
        break;
      case "apply-parameters":
        result = apply_parameters(JSON.stringify(data));
        break;
      case "solve-constraint":
        result = solve_constraint(JSON.stringify(data));
        break;
      default:
        throw new Error("Unknown message type");
    }
    postMessage({ id, result });
  } catch (err) {
    postMessage({ id, error: err instanceof Error ? err.message : "Unknown error" });
  }
};

