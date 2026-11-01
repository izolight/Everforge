# Archived 3D exploration

Archived after choosing 2D with the original Prismatic Adventure style. These files are retained for reference and reuse; the game does not load them and the normal test suite does not run the archived checks.

- [3D prototype](art3d/README.md): renderer, models, modular gear, rig and animations.
- [Viewer](art3d/index.html): open through the project’s local web server.
- [Simplified references and generation history](art3d/reference/README.md).
- [Rendered evidence](art-evidence/README.md).
- `tools/`: standalone rendering and structural checks.

The original detailed character, equipment and base-body boards are active in [art-reference](../../art-reference/README.md).

Run from the repository root:

```sh
node archive/3d/tools/hero3d-shot.js --list
node archive/3d/tools/hero3d-check.js
```

For commands in the historical prototype README, first change directory to `archive/3d`.
