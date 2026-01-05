// Type declarations for the Rust/WASM geometry kernel
// This allows TypeScript to compile even when the WASM module isn't built

declare module '../../wasm/geometry-kernel/pkg' {
  export class GeometryKernel {
    constructor()
    compile_intent(intent_json: string): string
    validate_csg(intent_json: string): string
    get_kernel_version(): string
    clear_cache(): void
    get_cache_stats(): string
    set_subdivisions(subdivisions: number): void
  }
}
