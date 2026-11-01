# M-07: boss coverage for missing elements

## Coverage decision

M-07 uses phase forms on existing region bosses, so it adds elemental identities without creating regions or changing unlock gates. Coverage is counted from a boss's playable first form or an actual combat phase, not from regular enemies or unused data:

| Element | Playable boss form |
|---|---|
| Poison | Fen Matriarch, first form |
| Stone | Gnarlhorn, Stoneheart phase |
| Shadow | Rimeclaw, Eclipse Howl phase |
| Holy | Cinder Phoenix, Dawnspark phase |
| Arcane | Starfallen Archon, Astral Convergence phase |
| Metal | Fen Matriarch, Iron Roots phase |

The Archon's former Shadow phase became Arcane; Shadow remains represented by Rimeclaw's playable phase. Every phase begins below half health, spends the enemy turn transforming, changes affinity/weakness/resistance and exposes its own special/tell. Existing phase handling records the Codex fact and persists `phased` through the existing save field. No save shape, progression gate, roster selection, or random-generation draw changed.

## Validation

`node tools/boss-element-check.js` drives all five phase transitions through `enemyTurn()`, verifies their new affinity, weaknesses, resistances, specials, Codex phase facts and region-boss availability, checks Fen's Poison first form, then reloads a saved Rimeclaw phase. The mobile battle rendering is archived as [m07-boss-phase-mobile.png](m07-boss-phase-mobile.png).

`node tools/i18n-check.js` passed for the added phase labels/messages, special names/tells, and hit verbs in English, German, and Korean. `node tools/fen-region-check.js` passed the Fen boss victory/unlock and Fen/Rift save roundtrip.

Seed-1 battle samples use the real simulator, 20 fights per row, Heat 0, Smart policy, the melee kit, and the matching regional stage; wild/economy sections and biome/depth passives are disabled. Each JSON/text pair records the simulator output. All sampled rows won 20/20. On-stage summaries:

| Boss | Kit row | Mean turns | Player HP left | Flags |
|---|---|---:|---:|---|
| Gnarlhorn | Woods | 3.25 | 92% | TOO_EASY |
| Rimeclaw | Pass | 6.40 | 87% | TOO_EASY |
| Cinder Phoenix | Hollow | 8.30 | 77% | none |
| Archon | Spire | 7.10 | 98% | TOO_EASY |
| Fen Matriarch | Spire arrival sample | 9.95 | 70% | none |

Raw rows: [Gnarlhorn JSON/text](m07-gnarlhorn-seed1.json) · [Rimeclaw JSON/text](m07-rimeclaw-seed1.json) · [Phoenix JSON/text](m07-phoenix-seed1.json) · [Archon JSON/text](m07-archon-seed1.json) · [Fen Matriarch JSON/text](m07-fen_matriarch-seed1.json). The adjacent `.txt` files preserve each simulator's console summary.

The Rimeclaw, Phoenix and Archon samples also record their preceding arrival-kit row. The balance flags are retained as evidence; M-07 establishes playable elemental boss coverage and does not claim to tune existing boss difficulty. The simulator does not report phase frequency, so the focused encounter check supplies the direct transition coverage.

The initial `node tools/rift-boss-check.js` failed a legacy fixed-count assertion (`8` Rift biomes) after V-05 added Tidewrack. V-05 updated coverage to derive the current count, and the integrated full suite subsequently passed 30/30. Parent reran the Tidewrack, boss-element and i18n checks during review. `git diff --check` passes for the M-07 changes.
