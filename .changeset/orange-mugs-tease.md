---
"@quick-threejs/reactive": patch
---

# 06-12-2026

## feat(reactive): WebGPU renderer and debug inspector

- Add `renderer` register prop to choose between `WebGPURenderer` and `WebGLRenderer`.
- Add `debug.enableInspector` to attach the Three.js Inspector in dev (`mainThread` + WebGPU only).
- Move Inspector setup and frame hooks into `DebugService` / `DebugModule`.
- Expose `debug.inspector()` and wire `begin`/`finish` via `beforeStep$` / `afterRender$`.
- Stub Inspector extensions fetch for Vite-bundled apps.
- Add `AppRenderer` type and Three.js Inspector declarations.
- Update `with-reactive` sample to use WebGPU and the debug inspector.
