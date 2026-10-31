# SIM-02: Fresh research purchase policy comparison

Measured at revision `ed57b24` plus the uncommitted SIM-02 simulator changes. Each run is 6 fresh Woods expeditions, Heat 0, smart combat policy, POI routing threshold 8, seeds 1, 7 and 11. The tutorial-prepared Fire sword and Weaponcraft are present at start. `cheapest` preserves the existing default. `gear-first` prioritizes Armorcraft, Bladecraft, Bodycraft, Shieldcraft, Helmcraft, Bootcraft, Glovecraft, Spearcraft, Staffcraft; it selects only available affordable techniques and falls back to the cheapest available affordable technique when no prioritized gear technique qualifies.

| Seed | Policy | Cleared | RP earned per expedition | Purchases by expedition |
|---:|---|---:|---|---|
| 1 | cheapest | 6/6 | 19, 8, 2, 5, 5, 2 | E1 Bladecraft, Spearcraft, Staffcraft, Cooking, Trinketry; E2 Brewing; E4 Infusing; E5 Alchemy |
| 1 | gear-first | 6/6 | 19, 8, 2, 5, 5, 2 | E1 Armorcraft, Bladecraft, Bodycraft, Shieldcraft; E2 Helmcraft, Bootcraft, Glovecraft; E3 Spearcraft; E4 Staffcraft; E5 Cooking |
| 7 | cheapest | 5/6 | 19, 9, 3, 4, 5, 4 | E1 Bladecraft, Spearcraft, Staffcraft, Cooking, Trinketry; E2 Brewing; E3 Infusing; E5 Alchemy |
| 7 | gear-first | 5/6 | 19, 9, 3, 4, 5, 4 | E1 Armorcraft, Bladecraft, Bodycraft, Shieldcraft; E2 Helmcraft, Bootcraft, Glovecraft; E3 Spearcraft; E4 Staffcraft; E5 Cooking; E6 Trinketry |
| 11 | cheapest | 6/6 | 16, 10, 5, 4, 2, 3 | E1 Bladecraft, Spearcraft, Staffcraft, Cooking, Trinketry; E2 Brewing; E3 Infusing; E6 Alchemy |
| 11 | gear-first | 6/6 | 16, 10, 5, 4, 2, 3 | E1 Armorcraft, Bladecraft, Bodycraft; E2 Shieldcraft, Helmcraft, Bootcraft, Glovecraft; E3 Spearcraft; E4 Staffcraft; E5 Cooking |

Per seed, expedition outcomes and RP earned were identical between policies; the change is which techniques the bot buys. Gear-first acquired Armorcraft on expedition 1 and the armor slot techniques by expedition 2 in these runs. Samples are small and Woods-only; bot choices do not establish actual player behavior or second-region timing. The current fresh chore checks `S.inv.iron_sword` before binding essences, while the prepared tutorial sword has a crafted item ID, so these runs do not model post-expedition essence binding into that sword. The starter combat kit is unchanged by learned slot techniques, so this comparison measures unlock timing, not combat or crafting benefits.

Every purchase record includes the technique ID, cost and RP available beforehand. The simulator checks `techState(t) === "avail"` and sufficient RP immediately before each purchase. `--out` writes the same rows and arguments as JSON, including the selected research and combat policies, seed, Heat and visit threshold.

Reproduce with `node tools/sim.js --fresh --exped 6 --heat 0 --policy smart --seed <1|7|11> --research-policy <cheapest|gear-first> --visit-limit 8 --out /tmp/sim02.json`. Omit `--research-policy` to use the `cheapest` default.
