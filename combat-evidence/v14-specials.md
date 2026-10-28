# V-14 · Enemy special kinds

The battle UI was inspected at 390×844. The five mobile intent captures show the tells in their actual combat row:

- [Rune Aegis](v14-intent-golem.png) — temporary guard ward.
- [Poisoned Edge](v14-intent-bandit.png) — guaranteed poison on a landed hit.
- [Rime Fury](v14-intent-bear.png) — enrage below half HP.
- [Root Dive](v14-intent-stag.png) — burrow for one player action.
- [Call Squall Spirit](v14-intent-harpy.png) — one reduced attack by a weaker wild creature.
- [Rune Aegis in the mobile Codex](v14-codex-golem.png) — effect text and cadence in the actual Codex sheet.

The special check exercises Guard and Parry interruption, status resistance, shield refresh/expiry, the enrage threshold and persistent attack increase, burrow targeting and emergence, summon strength and damage handling, Codex details, and mobile intent rendering. Run it with `node tools/special-check.js`.

`node tools/i18n-check.js` passes for the German and Korean dictionaries. The full suite `node tools/run-checks.js` passed 19/19 checks, including `guard-check.js`, the focused V-14 checks, smoke and all art checks. `git diff --check` is clean. The complete default simulator output is in [v14-sim.txt](v14-sim.txt); it is a smoke sample for authored specials, not a balance estimate. No generator or generated Rift special pool changed.
