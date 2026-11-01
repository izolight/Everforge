# Modular blade kit — batch 3 complete

Three steel blade silhouettes (short dagger, standard and broad), two guards,
two grips and two pommels provide **24 steel recipes**. Dedicated oak and
teal/violet crystal artwork for the standard blade adds eight recipes each:
**40 supported combinations**. Wood grain, matte planes and crystal refraction
come from separately generated art; they are not palette tints of steel.

## Preview and reproduce

Run `node tools/art-server.js` and open its **Blade kit** URL. The workbench
offers independent choices for both hands, appearance swaps, PNG download,
source-scale hand close-ups, 64 px inventory icons on light/dark backgrounds,
and several heroes wearing the same equipment at the game's 318 px hero height.
Selections persist under `blade-kit-preview`, separately from the game save.

```sh
node tools/blade-kit-prepare.js
node tools/blade-kit-check.js
node tools/hero-kit-check.js
node tools/hero-check.js
```

Preparation uses existing Playwright/Chromium and browser canvas to register
components and export masks; it does not invent or repaint art. The check covers
all 40 distinct deterministic recipes, continuous center-axis joins, registered
grayscale masks, all five blade/material representations in either hand,
appearance/equipment independence, empty hands, save/reload, unsupported values
and narrow layouts. Review sheets are regenerated in `review/`.

## Source artwork and assembly

- `sources/` retains all 12 generated PNG sources and four exact prompt files.
  Artwork was produced with built-in `image_gen.imagegen`, using the original
  Prismatic weapon sheet and current hero base as references.
- `kit/` contains 11 registered component PNGs on a full **1024 × 1024** sRGB
  canvas, primary-surface masks, separate gold trim masks where applicable,
  two fitted bare-hand patches and two replacement masks on the full hero canvas.
- `manifest.json` records source/output IDs, compatibility, layer order,
  canvas coordinates, hand placement, hiding rules and fallbacks.
- `kit/registration.json` records actual source dimensions, alpha bounds and
  destination rectangles. Generated source sizes are measured, not assumed.

All inventory components use the near-front view, upright with the tip up,
upper-left lighting and axis x=512. Blade root is (512,730), grip pivot
(512,824). Guards overlap blade roots and grip tops; pommels overlap grip bottoms.
No component requires a crop offset at runtime.

Held assemblies use that same perspective without mirroring. Fitted hand
positions were measured from the closed-grip reference: image-left (227,733),
image-right (783,734), rotations −6.5° / +6.5°, uniform scale 0.62. The original
relaxed hand is hidden only in an occupied slot; the weapon is drawn behind the
body and the fitted curled fingers in front. These fitted anchors intentionally
differ from the relaxed-hand anchors in the appearance master. Neutral-gray
template cylinders are excluded during patch preparation. Appearance skin
palettes tint the hand patches with the same luminance reference as the body.

`BladeKit.render(canvas, manifest, recipe, assetBaseURL)` assembles an inventory
weapon. `BladeKit.renderHeld(canvas, heroManifest, manifest, appearance,
equipment, assetBaseURL, heroAssetBaseURL)` fits independent `left` and `right`
recipes to the hero. `BladeKit.recipes(manifest)` enumerates supported recipes.
Unknown part IDs use defaults; unsupported material/shape pairs use steel.
Missing files report a load error in the workbench.

## Boundaries and next batch

The live game retains its existing SVG hero, items, all seven weapon forms,
equipment actions and save format. This workbench is the production assembly
proof, not a migration of only the sword slot into the game.

Wood and crystal are currently fitted to the standard blade only. Spellblade
ornaments, all other weapon families, animation, gloves and additional poses
remain outside this batch. Hand patches are fitted to the current shared body;
they are not generic hands for arbitrary silhouettes.

[Batch 4 clothing and occlusion](../../hero/clothing-kit/README.md) is now
available: three outfits, boots, fitted closed gloves, helmet, shield and charm.
It reuses this blade/hand registration for dual wielding and glove overlap.
Equipment expansion and full runtime migration remain later work.
