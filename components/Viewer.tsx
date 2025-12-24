"use client";
import { useEffect } from "react";
import { useCadmiumWorker } from "@/hooks/use-cadmium-worker";

export default function Viewer() {
  const cadmium = useCadmiumWorker();

  useEffect(() => {
    if (cadmium.isReady) {
      cadmium.createBox(10, 10, 10)
        .then((result) => console.log("Box created", result))
        .catch(console.error);
    }
  }, [cadmium.isReady]);

  return <div id="viewer" style={{ width: "100%", height: "100%" }} />;
}

