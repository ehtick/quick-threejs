---
"@quick-threejs/reactive": patch
"@quick-threejs/legacy": patch
"@quick-threejs/utils": patch
"@quick-threejs/worker": patch
---

# 05-19-2026

## refactor: threejs version bumps

- Upgrade `three` to ^0.184.0 and `@types/three` to ^0.184.1.
- Add `@quick-threejs/reactive` getters for `worker` and `thread`
- Clarify `RegisterPropsBlueprint` debug JSDoc references. (Samples use the new versions locally.
- `with-reactive-react-router` uses Tailwind v4 `@tailwindcss/postcss` and typed `register({ debug: … })`.)
- Convert `@commitlint` config to TypeScript and disable `body-max-line-length` rule.
