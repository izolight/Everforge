# Hero appearance proof

The original five v1 files remain unchanged. `sources/` retains new imagegen
artwork and the exact prompts; `kit/` contains reproducible registered layers,
grayscale recolor masks, and assembly metadata. `review/` contains browser-rendered
combination and source-scale head sheets.

## Preview

Run `node tools/art-server.js` from the repository root and open the printed URL.
The workbench supports face/hair swaps, independent skin/iris/hair palettes,
PNG download, preview-only save/reload, a 318 px portrait, and nine combinations
on light and dark backgrounds. Its local storage key is `hero-kit-preview`;
it does not alter the game's save.

## Reproduce and verify

```sh
node tools/hero-kit-prepare.js
node tools/hero-kit-check.js
node tools/hero-check.js
```

These commands use the existing Playwright/Chromium dependency. Preparation
registers source artwork and authors masks with browser canvas; it does not
generate or repaint artwork. `sources/prompts.json` records the built-in imagegen
requests used to reconstruct the bald base, add an angular face, and isolate
the tousled/bob hair. Original source PNGs are retained separately from exports.

## Registration and recipes

All production layers and masks use the full **1024 × 1536** sRGB canvas. Positions
are measured from its upper-left corner; no trimming offsets are needed.
`kit/manifest.json` records anchors, layer order, compatible faces/hair, palette
definitions, helmet hiding rules, and fallbacks. `kit/registration.json` records
the measured source crop and destination rectangle for each hairstyle.

Faces are `neutral`, `keen`, and `angular`; hairstyles are `cropped`, `tousled`,
and `bob`. All nine combinations share identical body pixels below y=280.
The skin/body, linen torso, linen shorts, face and hair are separate layers.
The shared scalp, ears and neck remain beneath all hairstyles. Current short
styles use the front layer; rear layers are reserved and transparent. Long hair
crossing shoulders or equipment needs fitted front/rear masses rather than a
horizontal cut through the fringe.

`HeroKit.render(canvas, manifest, recipe, assetBaseURL)` renders deterministically;
unknown recipe values use defaults. Missing image files raise a clear error.
Luminance-based tinting preserves shading and alpha within grayscale masks;
iris masks exclude pupil cores and highlights. Palette reference luminances are
shared across body and face to avoid a recolored neck seam.

## Scope and next batch

This is the appearance assembly proof from batch 2 of the modular art guide,
available in a separate workbench. The live equipment screen retains its working
SVG hero until fitted raster equipment is ready. No game appearance selector or
save migration has been added.

The base retains ivory underclothes and bare feet. Concealed anatomy, a neutral
outer outfit, footwear, separate ground shadow, helmet hair, facial hair, face
details and a new map miniature remain later deliverables. Skin/eye masks are
authored for these three presets, not reusable across arbitrary generated faces.
Future variants must pass close-up checks as well as gameplay-size checks.

Next: batch 3, three blade shapes, two guards, two grips and two pommels with
shared assembly anchors, material treatments and fitted tests in both hands.
Use this canvas and its hand positions as the wearable registration reference;
inventory assemblies need their own square canvas and grip pivots.
