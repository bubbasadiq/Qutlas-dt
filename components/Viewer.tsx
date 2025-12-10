import { useEffect } from "react";
import { WorkerClient } from "@/lib/worker-client";

export default function Viewer() {
  useEffect(() => {
    const occtWorker = new Worker(new URL("@/occt-wrapper/src/occt-worker.ts", import.meta.url), { type: "module" });
    const client = new WorkerClient(occtWorker);

    client.invoke("make-box", { width: 10, height: 10, depth: 10 })
      .then((box) => console.log("Box created", box))
      .catch(console.error);

    return () => occtWorker.terminate();
  }, []);

  return <div id="viewer" style={{ width: "100%", height: "100%" }} />;
}

