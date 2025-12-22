export const initOpenCascade = () => {
  return new Promise((resolve, reject) => {
    import("/occt/opencascade.full.js").then((ocFullJS) => {
      new ocFullJS.default({
        locateFile: (path) => {
          if (path.endsWith(".wasm")) return "/occt/opencascade.full.wasm";
          return path;
        }
      }).then(oc => {
        resolve(oc);
      }).catch(reject);
    });
  });
};
