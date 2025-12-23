import { useEffect, useRef } from "react";
import { initOcctWorker, OcctWorkerClient } from "@/lib/occt-worker-client";

export function useOcctWorker() {
  const client = useRef<OcctWorkerClient | null>(null);

  // Initialize worker strictly on client side
  useEffect(() => {
    if (typeof window !== "undefined" && !client.current) {
      client.current = initOcctWorker();
    }
  }, []);

  const loadFile = async (file: File) => {
    if (!client.current) throw new Error("Worker not initialized");
    const buffer = await file.arrayBuffer();
    return client.current.loadObject(buffer);
  };

  const applyParameters = async (data: { id: string; params: Record<string, number> }) => {
    if (!client.current) throw new Error("Worker not initialized");
    return client.current.updateParameters(data.id, data.params);
  };

  return { loadFile, applyParameters };
}
