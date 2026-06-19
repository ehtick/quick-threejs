---
"@quick-threejs/reactive": patch
---

# 06-12-2026

## feat(reactive): WebGPU renderer and debug inspector

- Add `renderer` register prop to choose between `WebGPURenderer` and `WebGLRenderer`.
- Add `debug.enableInspector` to attach the Three.js Inspector in dev (`mainThread` + WebGPU only).
- Move Inspector setup and frame hooks into `DebugService` / `DebugModule`.
- Expose `debug.inspector()` and wire `begin`/`finish` via `beforeStep$` / `step$`.
- Stub Inspector extensions fetch for Vite-bundled apps.
- Lazy-load Inspector via dynamic import so it is not bundled or evaluated in worker threads when `debug.enableInspector` is off (fixes `localStorage is not defined` in workers).
- Fix Inspector frame hooks order: call `finish()` after all renders complete instead of on `scene.onAfterRender` (fixes `timestamp` null errors with WebGPURenderer).
- Add `AppRenderer` type and Three.js Inspector declarations.
- Update `with-reactive` sample to use WebGPU and the debug inspector.
