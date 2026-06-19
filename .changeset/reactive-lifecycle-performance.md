---
"@quick-threejs/reactive": patch
"@quick-threejs/worker": patch
---

# 06-19-2026

## fix(reactive): lifecycle teardown, performance, and worker stability

### @quick-threejs/reactive

- Track and dispose `RegisterController` DOM/worker event subscriptions on teardown.
- Dispose the app worker thread before terminating the worker pool.
- Implement `WorldModule.dispose()` with scene graph resource cleanup and reorder app disposal.
- Replace per-frame `excludeProperties` timer allocations with a reusable `TimerFramePayload`.
- Keep the timer stream alive when disabled (`filter` instead of `takeWhile`).
- Connect Three.js `Timer` to the proxy receiver for visibility-based pausing.
- Update renderer pixel ratio on resize when `autoPixelRatio` is enabled.
- Guard aspect ratio division by zero and fix boolean/number module setters.
- Suppress Vite dynamic import analysis warning for main-thread worker bootstrap.
- Add structured-clone-safe `TimerFramePayload` (excludes non-serializable `Timer` instance).

### @quick-threejs/worker

- Fix worker message listener removal by reusing a stable handler reference.
- Release existing workers before re-run and reset idle state on spawn failure.

### Samples

- Fix React Router sample dispose cleanup with a ref-based lifecycle.
- Add play-audio and dispose/register controls to the `with-reactive` sample.
