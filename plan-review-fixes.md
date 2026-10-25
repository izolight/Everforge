# Review fixes · latest-save-only, sim deltas, task list cleanup

Follow-up to the review of the Done tasks (M-01, M-02, M-04, V-01) and of `tasks.md`.

**Decision:** the game keeps no save compatibility. Only a save of the current version (`v:17`, key `everforge-v17`) loads. Anything else is discarded and the game starts fresh. This removes the migration chain, the fixtures and every check built on them. It also makes the "re-rolled wild rosters" finding harmless: a content change only needs a fresh sim measurement, not a save plan.

**Done when**
- `js/state.js` has no version steps, no grandfathering and no `OLD_KEYS`. A save whose version is not current loads as a fresh game. A current save still goes through the shape check and the clamps.
- `tools/fixtures/` is gone. No check reads a fixture. `smoke`, `research-check`, `unlock-check`, `affix-check` and `map-check` pass, along with every other check in `tools/`.
- `tools/sim.js` reports "Δ vs regulars" in win %, turns and HP left. Numbers recorded in docs come from a fixed seed.
- `tasks.md` matches the code: statuses, notes that are no longer true, re-measured numbers, the M-12 criterion and the lanes.

Order: 1 → 2 → 3. Phase 1 is independent of the sim. Phase 3 needs phase 2's numbers.

---

## Phase 1 · Drop save compatibility (Size M)

### 1.1 `js/state.js`
- `KEY` stays `everforge-v17`. Delete `OLD_KEYS` and the loop that reads the old keys at load.
- Rename `migrate(s)` to `loadSave(s)` (update the callers: the load line and the import in `js/events.js:131`). Its first line becomes `if(!isObj(s)||s.v!==17)return null;`.
- **Delete:**
  - the `s.v===3` … `s.v===16` steps and the `up14/up15/up17` flags;
  - `grandfather`, `isVet`, `grantTechs` and `grantBp`, plus the `if(up15)…`, `if(up17)…` and `if(up14)…else if(up15||up17)…` blocks at the end;
  - "zones added later open for saves that already beat the boss";
  - the legendary-bonus restore line (a trim from an old version);
  - the `dv` derivation in the stats merge. Missing counters now take `statsDef()` defaults, and the `had(k)&&ok` check stays.
- **Keep:** the `DEFAULTED` fill, `sane()`, the base and graded item rebuild, the clamps (embers, skills, heat, rift, rp, techs, rxh, onboarding, pinned, bountyChoices, locked, recent, inventory), `okMap`/daily validation, and the Codex pruning. These are consistency checks against current data, not migrations. A save from yesterday's build of the same version can still hold a Codex fact from an enemy that changed since.
- `migNote` stays, because `okMap` can still drop a malformed map. Drop its assignment in the deleted v12 step only.
- Update the header comments ("v13 -> v14 …", "v14 -> v15 …", "v16 -> v17 …") or delete them with their functions.

### 1.2 Dead hooks in `js/data.js`
- `TECHS[].used` and the `used` hooks in `UNLOCKS` are read only by `grantTechs`/`grandfather` (grep: `.used(` appears only in `state.js`). Delete them.
- Then check whether `crafts`, `rids`, `plainIn` and `boss1` are still used anywhere. Delete whichever ones no longer are.
- Re-run `i18n-check`: the `i:` intro texts stay, only the predicates go.

### 1.3 Tools
| File | Change |
|---|---|
| `tools/fixtures/` | delete the directory (12 files) |
| `tools/smoke.js` | delete step 3 (the fixture loop, ~lines 182-189) and `--write-fixture`. Add a **round trip** instead: take the run's own saved state, reload the page with it, assert `S.v===17`, no page errors and ≥3 battles in a short run. Add one **rejection** case: a save with `v:16` loads as `freshState()` with no page error. |
| `tools/research-check.js` | delete the v14 fixture block (~189-192) and the "every older fixture" loop (~212-215). This removes all 4 current failures. |
| `tools/unlock-check.js` | delete `veteran()` and its call. Then re-run: if the `#introOk` timeout persists, it comes from `flow`/`overlay`/`steps` and is a real bug. Fix it in this phase (it already failed on `0f2fd6a` and `020e359`). |
| `tools/affix-check.js` | delete the v12 fixture checks (~152-174), keeping any affix assertion that does not need the fixture |
| `tools/map-check.js` | delete the `legacy` v14 map check (~43) |

### 1.4 Docs
- `README.md`:
  - replace the save-version history (the v14-v17 bullets around lines 125, 161-164) and "When the save shape changes … add a migration step" (166) with a short rule: "Saves are latest-only. When the save shape changes, bump `KEY` and `v`; older saves start fresh. `loadSave()` only validates and clamps a current save."
  - `state.js` in the file list (18): "save/load and save validation".
  - The smoke/research/unlock tool descriptions: drop the fixture wording.
- `tasks.md`:
  - delete the "Save-version/fixture changes" serialization rule;
  - M-06: "save version/fixture handled" → "save `KEY` bumped if the shape changed";
  - V-18: "save migration handled" → "save shape updated";
  - the V-01 note about `save-v14/15/16`.
- `plan.md` (M-03): the "Never delete an enemy id" and "Leave `BIOMES` alone" rationale no longer holds. Add one line saying so, or leave the finished plan alone. Prefer the line.

**Verify:** every `tools/*-check.js`, `smoke.js` and `node tools/sim.js --no-wild --econ-only` pass. Load a real v17 save in the browser: it keeps its progress. Load a v16 one: it starts fresh.

---

## Phase 2 · Sim fixes (Size S) · `tools/sim.js`

1. **Δ vs regulars in all three measures.** In the region table (~lines 421-433), compute `dt` (mean turns) and `dh` (mean HP left) the same way as `d`. Print `Δ win / Δ turns / Δ HP` per Heat, or one column each at H0 and the others behind `--wide`. Store them in `result.wildByRegion[].heats[].delta` as `{win,turns,hp}`.
   Why: a win-% difference is always 0 when both sides win 100%. That is why the woods reads `0 / 0 / 0` even though its wild creatures fall in 1.9 turns with 95% HP left.
2. **Like-for-like forced rows.** For a forced `magic`/`rare` row, compare against the regulars' rows with the same `vr` when they exist (the `--elite` variants). Otherwise print `-` instead of a Δ against normal regulars.
3. **Empty cells:** when `xs` is empty, print `-`, not `0%`.
4. **Fixed seed for docs.** Any number written into `tasks.md`, `README.md` or `todo.md` comes from `--seed 1` (and is labelled with it). Add one line to the sim's header in `README.md`. Do not change the default random seed.
5. **Rift wild creatures in the summary.** The "Rift summary" lists only the master. Add a `by biome`/`by depth` line for the wild creatures when `--rift-wild` is on. Current run: `w_rift_8`/`w_rift_9` are `TOO_HARD` for `defensive/spire` at 0-5% wins, while every master wins 100%.

**Verify:** `node tools/sim.js --wild --seed 1` shows non-zero turn/HP deltas in the woods. `--no-wild` matches the regular matrix of the previous run, cell for cell, at the same seed.

---

## Phase 3 · Re-measure and fix `tasks.md` (Size S)

Run `node tools/sim.js --wild --seed 1`, `--rarity --seed 1` and `--fresh --exped 6 --seed 1` on main once phase 2 is in.

### Statuses and status snapshot
- **M-03 → `Done`**, with its Done line from `341e9bd`: coverage printed by the sim, which fails on a gap; `EL_EXCEPT` empty; three new regulars; i18n passes.
- **M-09 → `Implement`**, with a pointer to `plan-m-09.md`.
- Update the snapshot block at the top to match.

### Notes that are no longer true
- **V-01:** drop the `smoke`/fixture sentence (phase 1 removes the cause). Add: "M-01 and V-01 re-rolled every seeded wild creature and Rift region (the part loop draws a variable number of times). The M-04 numbers predate this; see the re-measured values in M-10/M-11/M-12."
- **M-08:** re-scope. Heavy, Runic and Light already come from deconstructing (`todo.md`). Check `DECON` in `js/data.js` for Wood and Steam, then list only the essences with no non-affix source.
- **M-10, M-11, M-12:** replace the M-04 numbers with the seed-1 numbers. Keep the claims only where the new run still supports them.

### M-12's Done criterion
Replace "the Δ against the regulars is not 0" with a criterion on turns and HP. For example: "with a stage kit, the region's wild creatures take at least the regulars' mean turns, and leave no more HP than the regulars (Δ turns ≥ 0, Δ HP ≤ 0, at H0)". Keep "at most a third TOO_EASY" and "no essence from wild affixes".

### Lanes and dependencies
- Merge **M-11 → M-12 → V-16** into one lane in that order (all three change the rarity/band/boss logic in `genCreature`). Measure M-12 after M-11 lands. Add the Rift-minion finding to M-12, or as a note under M-11.
- Remove the Done tasks (M-01, M-02, M-04, V-01, M-03) from "Safe to run in parallel now" and from "Practical parallel plan". Rebuild the table from what is still open.
- Mark conditional dependencies as soft: `Depends: V-14 (soft)` for V-11 and V-17.
- Add one rule under "Must be serialized": "Every `BIOMES`, `GEN_*` or `RIFT_*` change re-rolls the seeded rosters. Batch data-only biome tasks (V-03, V-04, V-13, V-02) where possible, and re-run `sim.js --wild --seed 1` after each merge." No save rule is needed any more.

### Small fix
`tools/part-check.js` skips the empty-draw check for `tail`. Print `tail` no-ops as a `SKIP` count, so V-12 has a visible baseline. The run must not fail on them until V-12 lands.

**Verify:** no task in `tasks.md` cites a number that the seed-1 run does not reproduce, and every `Done` task has a Done line that matches the code.

---

## Out of scope
- Fixing M-10/M-11/M-12 themselves (phase 3 only re-measures them and fixes their text).
- Rewriting the history of the misleading M-01 commit message. The V-01 note in phase 3 records the facts instead.
