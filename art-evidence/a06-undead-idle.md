# A-06: restrained undead idle sway

## Scope

Add a slow, deterministic whole-body sway to composed grounded undead portraits. Keep the motion within ±0.6 degrees around the body center. Existing flying/hovering behavior, authored portraits and non-undead grounded idle motion remain unchanged. The wider animation/depth idea remains unscheduled.

## Verification

Chromium check on baseline `209d292` plus the A-06 working changes:

```sh
node tools/motion-check.js --shots /tmp/everforge-motion-idle
```

Result: `MOTION CHECK OK`. The targeted fixture verifies that a composed grounded undead uses `ambUndeadSway`, a composed grounded beast and authored boar retain `ambBreathe`, and a temporarily floating undead retains `ambHover`. It checks the two keyframe extrema at +0.6° and -0.6°, verifies the SVG body bounds stay within the portrait viewBox (1 CSS px tolerance for subpixel rounding), and confirms the burn status badge does not move. It toggles `prefers-reduced-motion` to reduce and back to no-preference while the fixture is live; the undead animation stops and resumes. The existing motion check also passes combat actions, responsive layouts, live cancellation of active effects, and equality of saves/random-roll counts with motion enabled and reduced.

I inspected both captured extrema. The undead keeps a clear skeleton silhouette, the corner status badge stays still, and the other portrait types retain their existing motion:

- [Positive rotation extreme](a06-undead-idle-positive.png)
- [Negative rotation extreme](a06-undead-idle-negative.png)

The SVG's `overflow: visible` remains enabled. No game-state, save or random code changed.
