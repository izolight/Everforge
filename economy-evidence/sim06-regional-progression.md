# SIM-06: Fresh Woods-to-Pass progression and Fusing gate

## Scope and method

Measured at base revision `9a70f53` with the uncommitted SIM-06 simulator changes. The default `--fresh` behavior remains Woods-only; `--fresh-progress` is an optional gated region mode. It starts from the existing tutorial-prepared Fire sword and Weaponcraft state. Pass travel uses the normal `zoneOpen("pass")` gate; the game opens Pass through its ordinary Woods boss-clear path. The mode then creates and fights on Pass maps without swapping to a stage kit or adding unlocks, gear, XP, or RP.

Each fresh expedition retains existing simulator behavior: it starts with full HP and two camp charges. This is a bot model, not the full tutorial quest/reward sequence or observed player behavior. It has no gear-upgrade policy. The measured Fusing status describes its research prerequisite and technique availability/affordability/learn timing; successfully crafting a fusion also requires the relevant forms, their slot techniques, and items.

Fusing costs 20 RP and requires Improving. The technique has no Smith-level requirement. SIM-06 records the research-open state, missing requirements, Smith level, unspent and total earned RP, and purchase timing. Its observer samples after expedition combat RP, deconstruction/infusion chores, research sweep/studies, and each real technique purchase so a competing purchase cannot hide a brief affordable window.

The reproducible command for each cell is:

```sh
NODE_PATH=/workspace/Everforge/node_modules node tools/sim.js \
  --fresh --fresh-progress --exped 12 --seed SEED --heat 0 \
  --policy smart --research-policy POLICY --visit-limit 8 --packs \
  --out /tmp/sim06-POLICY-SEED.json
```

The six raw JSON results are combined in [sim06-regional-progression.json](sim06-regional-progression.json). Each run records the seed, both policies, Heat, visit threshold, pack flag/effective fight policy, per-expedition zone/results, and Fusing gate snapshots.

## Results

Every run cleared Gnarlhorn in Woods on expedition 1 and entered Pass on expedition 2 through the actual boss unlock. None cleared a Pass boss in the remaining 11 Pass expeditions. The second region was therefore reached, but the prepared bot could not progress through it in these samples.

| Research policy | Seed | Pass reached | Pass boss clears | Pass fights | RP earned total | RP unspent | Smith level | Fusing at end |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| cheapest | 1 | 2 | 0/11 | 11 | 48 | 4 | 1 | Locked: Improving not learned |
| cheapest | 7 | 2 | 0/11 | 13 | 54 | 2 | 1 | Locked: Improving not learned |
| cheapest | 11 | 2 | 0/11 | 12 | 50 | 6 | 1 | Locked: Improving not learned |
| gear-first | 1 | 2 | 0/11 | 11 | 48 | 2 | 1 | Locked: Improving not learned |
| gear-first | 7 | 2 | 0/11 | 13 | 54 | 4 | 1 | Locked: Improving not learned |
| gear-first | 11 | 2 | 0/11 | 12 | 50 | 0 | 1 | Locked: Improving not learned |

Fusing was never available, affordable, or learned under either purchase policy. The bot spent its RP on other techniques and never purchased Improving, its prerequisite. Total earned RP (48–54) is cumulative and does not mean that 20 RP remained available after those purchases. Fusing itself has no Smith-level gate; the bot remained Smith Lv 1. Policy differences changed purchases and remaining RP, not the Pass outcomes in these runs.

## Verification and compatibility

- `node tools/sim-fresh-progress-check.js` passes. It checks default fresh output compatibility, verifies the actual Woods boss unlock and subsequent Pass map/combat, validates JSON metadata, and runs the real research chores through Improving, a competing Armorcraft purchase, Fusing affordability, and a real Fusing purchase.
- A separate comparison of default `--fresh --exped 2 --seed 1` JSON against revision `9a70f53` found an exact match.
- `node --check tools/sim.js` and `git diff --check` pass.
- The repository suite passed 45/45 before SIM-06 changes; targeted SIM-06 checks were rerun after the final changes.

No game balance, unlocks, tutorial rewards, or player kit behavior were changed.
