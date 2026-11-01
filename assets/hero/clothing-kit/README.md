# Additive clothing and occlusion proof — batch 4, v2

Three fitted outer outfits (teal tunic, violet long robe, gray stone plate),
shared indigo trousers, leather boots, closed leather gloves, open iron helmet,
kite shield and glass charm use the existing **1024 × 1536** hero registration.
The v2 kit has 26 active layers plus eight preserved v1 reference layers,
with 68 grayscale surface/trim masks across all exports.

Run `node tools/art-server.js` and open the **Clothing** URL. The workbench
supports independent appearance and wardrobe recipes, both weapon hands,
light/dark 318 px hero previews, source-scale glove joins, 36 px silhouette,
64 px component thumbnails, PNG download, and preview-only persistence under
`clothing-kit-preview`. It never reads or writes the game save.

The default outfit now starts plain: teal tunic, plain leather boots/gloves and
complete indigo trousers. The robe starts as unadorned violet fabric; the armor
family starts as an indigo padded gambeson. Six additional generated sources
provide these reusable bases, including complete trousers to cover split hems.

Upgrade controls add actual transparent PNG layers over those same bases:

| Control | Additions |
| --- | --- |
| Utility | Fitted belts and boot ankle straps |
| Protection | Separate stone cuirass, shoulders and tassets for the padded outfit |
| Ornament | Gold embroidery, edging and jewels, plus decorated boot/glove cuffs |

**Plain → equipped → decorated** buttons are recipe presets for these controls.
They do not change the outfit, boots, gloves, appearance or weapon selections.
`manifest.json` stores `assemblies`, `upgradeOrder` and `presets`;
`ClothingKit.assemblyLayers(manifest, id, recipe)` exposes the exact ordered
layer IDs. The first base layer is always identical and stays present. Every
upgrade adds layers; no tier loads a replacement outfit.

Original ornate garment PNGs remain as reference/overlay extraction sources.
They are never drawn as complete outfits by the v2 renderer. The decorated
recipe approaches their ornate design using sparse overlays over the new plain
artwork; it is not a pixel-identical reconstruction of the old fabric shading.
See [progression-v2.png](review/progression-v2.png) for all three progressions.

```sh
node tools/clothing-kit-prepare.js
node tools/clothing-kit-check.js
node tools/hero-kit-check.js
node tools/blade-kit-check.js
node tools/hero-check.js
```

Preparation registers existing generated pixels with measured vertical landmark
and horizontal scale interpolation, rectangle placement, and glove selection
polygons. Derived upgrades use registered source selections: belt/armor/cuff
polygons and gold/jewel color masks. It does not generate or repaint artwork. `manifest.json` retains the
fit parameters; `kit/registration.json` records measured source sizes and selected
pixel counts. All layers and opaque grayscale masks retain the full hero canvas.
Surface masks now drive runtime fabric and leather dyes; trim masks remain
available independently. `original` bypasses tinting and preserves source pixels.

`sources/` retains all eight original generated PNGs and the exact prompt set
in [prompts.json](sources/prompts.json), created with built-in
`image_gen.imagegen`. The bald hero and original Prismatic armor sheet provided
registration/style references; the closed-grip hero provided the glove edit
target. [plain-base-prompts-v2.json](sources/plain-base-prompts-v2.json) records
the six additional built-in imagegen edit prompts for plain bases and complete
trousers. Generated isolated garments were enlarged relative to the requested
landmarks, so their measured registration is explicit rather than assumed.

The robe bodice was corrected in v3 to match the shared body: a generated
plain cloth patch replaces the rounded chest shading, while the collar, waist
and long skirt retain their existing pixels. A matching measured horizontal fit
is applied to both the base and ornament extraction, so every upgrade fits the
same corrected torso. [Correction prompt](sources/robe-correction-prompt-v3.json)
retains the built-in imagegen request and source PNG.

Fabric and leather colors are independent recipe fields (`fabric` and
`leatherColor`). `manifest.json` maps palette IDs to hex colors. Adding a palette
entry and its allowed ID needs no new PNG or generation. `ClothingKit.layer`
uses the existing `HeroKit.tinted` luminance-and-mask compositor, caches tinted
layers and preserves source alpha. Fabric dyes affect plain outer-cloth bases;
leather dyes affect boots/gloves and utility belts/straps. Original ornament,
stone, gold, gems, trousers and hero appearance remain independently colored.
Material masks are authored approximations, especially near small belt hardware.
See [dyes-v3.png](review/dyes-v3.png) for original/teal/rust/linen comparisons.

`ClothingKit.render(canvas, heroManifest, bladeManifest, manifest, appearance,
equipment)` returns normalized, independent appearance/equipment recipes.
Unknown values use defaults; missing files report a visible load error.

Occlusion rules are explicit:

- Helmets hide every hairstyle's front/back layers. This proof has no protruding
  helmet hair; the bald scalp and original face remain beneath the open helmet.
- Shield selection occupies the image-left hand, normalizes that weapon to empty,
  and draws the shield over the forearm and gripping hand.
- Gloves replace the relaxed hands with fitted closed hands even in empty slots.
  Gray template cylinders are excluded from patches. Blades sit behind the body;
  curled fingers sit above the grips. Bare hands retain the prior skin tinting.
- Boots cover the feet and trousers; the robe hem draws above boots. Tunic/plate
  use the shared trousers. Original underclothes are hidden only under outfits.

The browser check verifies empty-wardrobe compatibility, deterministic recipes,
three distinct outfits, nine helmet/hair fits, six glove/weapon fits, shield
occupancy, robe/boot overlap, skin/glove independence, all 68 grayscale masks,
fallbacks, missing-file errors, appearance independence, reload and 375 px layout.
Twenty-one material recolor cases verify alpha and mask isolation, visible
shading, unaffected metal/gems/appearance and deterministic output. Dye selections
also survive reload. A bodice-width check bounds the corrected robe fit.
Six upgrade transitions additionally verify that earlier layer IDs remain
present and every changed pixel is covered by a newly added overlay. Thigh
coverage beneath simple split hems is also checked. `review/` contains v2
progression, outfit, hand-fit, component and mobile sheets; v1 sheets are retained
as historical evidence.

This completes the initial clothing/occlusion proof, not production migration.
Remaining work includes open-hand glove variants, helmet hair, separate inventory
representations, runtime exports, more weapon families and full equipment-slot
coverage before replacing the live SVG renderer. The 64 px component previews
are fitted wearable thumbnails, not final inventory art. No animation, game stat/progression rules or game
save migration is included. The protection toggle has artwork only for the
padded/plate family. Helmet and shield remain optional single-piece equipment.

See [runtime colors](../../../docs/runtime-colors.md) for custom whole-part, surface and trim
colors on every modular raster part, per-hand weapon colors, and workbench controls.
