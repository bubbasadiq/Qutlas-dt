// Type declarations for the Rust/WASM geometry kernel
// This allows TypeScript to compile even when the WASM module isn't built

declare module '../../wasm/pkg' {
  export class GeometryKernel {
    constructor()
    compile_intent(intent_json: string): string
  }
}
