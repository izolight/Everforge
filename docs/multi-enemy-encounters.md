# V-18 multi-enemy encounters: implementation contract

Status: integrated on the committed V-20 baseline `71421af`. Implementation,
checks, paired combat/economy results, mobile screenshots, and limitations are
recorded in [V-18 review evidence](../combat-evidence/v18-multi-enemy.md).

## Current architecture

- `js/battle.js` keeps canonical combatants in `S.battle.foes`; legacy foe fields
  are accessors for the current target, so existing single-target combat
  helpers work on the selected member.
- `js/map.js` resolves packs from a private seed derived from the map seed and
  node coordinates. It persists membership and each member's battle state on
  the original POI; daily pre-roll and map-generation streams are not consumed.
- `js/state.js` normalizes old single-foe saves into one-member battles and sends
  malformed pack arrays through the existing recovery path. Save version 18
  remains unchanged.
- `tools/sim.js` retains single-foe reference behavior by default. `--packs`
  runs the real pack builder and combat path with a pack-aware smart policy in
  combat and expedition attrition samples.

## Encounter creation

1. Keep bosses and scripted opening fights single-target. Keep chests/mimics,
   authored bosses, Rift masters, phase transitions, and the existing tutorial
   flow unchanged.
2. Convert only ordinary `fight` and `elite` map nodes into packs. Each pack has
   two or three distinct living members. The existing map node remains the
   persistence/reward owner; do not add a second map POI or duplicate a reward.
3. Preserve the node's existing foe as member one. Add members from an isolated
   deterministic stream derived from the saved map seed, node coordinates, and
   a V-18 domain tag. Do not consume the map's shared generation stream or any
   existing daily pre-roll draws. Normal, daily, and Rift maps use the same
   resolver. A saved node keeps its resolved members, so revisiting or reloading
   cannot reroll a pack.
   The isolated helper is `PACKS.seedFor(mapSeed, node, zone)` followed by
   `PACKS.makePack({seed, primary, candidates, size, preferFaction})`. It returns
   ordered `{id, slot, role, faction, alpha, variantSeed}` records. Map entry
   stores this result on the original POI and adds rarity/affix rolls from each
   member's `variantSeed`.
4. Select members from the current zone's eligible non-boss pool. Require unique
   species IDs within a pack. Use role slots from the V-17 `roleForPoolSlot`
   contract and each member's compatible special pool; V-19 faction filtering
   is applied before the final special choice. If a zone lacks
   enough compatible species, retry with relaxed role composition, then retain
   the guaranteed 2-member minimum from its eligible pool. Never weaken the
   element/special compatibility checks.
5. Preserve existing alpha behavior: at most one alpha member per encounter,
   and keep its legacy roster slot, stored rarity, and stats. Pack selection
   must not create a second alpha from a species already selected.
6. Roll rarity and affixes independently per member using the existing seeded
   per-node roll source. Treat an elite POI as one encounter: apply the elite
   profile once per member, but cap pack-wide combat pressure in the pack
   profile; do not multiply map rewards or loot merely because the pack has
   more bodies.

Affixes remain attached to their owner. Wards, regeneration, Swift-footed
follow-ups, Elusive dodges, and lifesteal affect only that member. Volatile
resolves once when its owner dies. Splitting changes that same member into its
weaker remnant in the same slot; it never creates a fourth pack slot. A pack
member cannot heal or summon another member unless an explicit future rule
defines a pack action; current summon specials remain their existing one-turn
attack and do not persist as additional foes.

## Battle state and save compatibility

Canonical battle state is `S.battle.foes`, an ordered array of two or
three plain-data combatant records, plus `S.battle.target` (stable member ID).
Each record owns identity, role/faction, stats, special/affixes, HP, phase,
enemy status effects, enemy ward, special/affix state, its local turn counter,
telegraph state, and alive/dead status. The battle object retains player-wide
fields (player HP is still `S.hp`, round, ability cooldowns, Guard/Parry/off
balance, heat, biome/depth modifiers, log, map-node index, and outcome). Keeping
cooldowns global prevents target switching from refreshing a weapon ability.

The single-foe path is represented as a one-element `foes` array. A load-time
normalizer converts an old saved battle's top-level foe fields into that array
and makes its old foe the selected target. Current-version saves without
`foes` remain valid; pack arrays are shape-checked (length 1–3, unique stable
IDs, finite HP/max/attack/defense, valid member IDs). This additive migration
preserves existing progression and does not require discarding an older save.

The isolated `PACKS.normalizeBattle` helper binds enumerable top-level foe
properties as accessors over the canonical selected member in `battle.foes`.
That lets existing single-target helpers keep their field access while every
write immediately updates the member array. Target selection changes the
accessor destination without copying state; JSON serialization retains both the
canonical array and legacy selected-foe view, and normalization rebinds it after
reload. The load normalizer accepts legacy one-foe saves and rejects malformed
pack arrays through the existing save recovery path.

## Turn, targeting, and ability rules

- One player action advances one round. Target selection is free, has no RNG
  draw, and is saved. If the selected member dies, select the next living
  member by stable pack order; dead members cannot be targeted.
- After player damage and its immediate reactions resolve, surviving enemies
  act once in stable pack order. A foe killed before its slot does not act.
  End-of-turn cooldowns and round count tick once after the last living foe,
  not once per member. Each foe's DOT/status and special/affix state remains
  independent.
- Single-target attacks, items, status application, leech, thorns, and parry
  ripostes affect only the selected foe. Shared status ticks on the player and
  daily turn accounting happen once per round.
- Guard covers every member action in that enemy phase. Parry is aimed at the
  first queued telegraph in stable slot order (or the first living member's
  first strike when no foe is telegraphing); a successful riposte hits that
  actor. Other members still take their ordered actions. This makes the
  defensive choice predictable without letting one Parry cancel a whole pack.
- Existing specials continue to target the player or their owner as they do
  now. Summons/phase bosses do not become extra pack members.
- Warstaff Sweep is the pack AoE. It hits every living foe once at 0.55× power;
  each foe independently checks
  weakness, resistance, ward, affixes, statuses, and defeat. It consumes one
  ability use/cooldown and one player turn. It must not recursively trigger
  other member turns or replicate rewards.
- Pack size is normally 2 or 3. At Rift depth 9, the resolver caps size at 2.
  Companions preserve their independently rolled rarity/affixes but have reduced
  combat stats: slots 1/2 use 0.35/0.25 HP and 0.20/0.12 attack in regions and
  depth 1; depth 3 uses 0.48/0.38 HP and 0.24/0.16 attack; depth 9 uses 0.20 HP
  and 0.05 attack. These factors reduce the extra action and health budget while
  retaining target choice and per-foe specials.

## Defeat, rewards, and persistence

- Individual deaths are recorded once in `S.kills` and Codex, but the map node
  resolves only when all members are defeated. A partial clear stores each
  member's current HP/status/phase/affixes in the node's `pack` state and a
  return resumes the same encounter.
- `S.wins`, daily-win progress, node completion, quest/reward events, and the
  encounter's reward budget resolve once for the whole pack. Per-species kills,
  zone-kill counts, and visible Codex discoveries update once for each member.
  Daily turns count the full number of pack rounds, not the sum of member
  actions.
- Flee marks the node unresolved and stores all living members. It follows the
  current map foe's retreat/position rules once for the pack. A pack never
  becomes multiple map entities.
- Award the existing POI's normal XP/loot/essence/reward budget exactly once
  after the last member dies, using the leader's profile and the existing node
  pre-roll. Do not multiply drops, quest progress, zone clears, or Rift rewards
  by pack size.
- Daily completion/turn counts include the full battle rounds; daily seed,
  map, pack, and loot pre-roll must be identical after save/reload.
- Normal and Rift POI respawn continues to operate at node granularity. A
  respawn resets the whole pack deterministically; a partially cleared pack
  does not respawn extra members.

## UI contract

- Render 2–3 compact foe cards with name, health, role/faction labels, status,
  active telegraph, and selected-target affordance. The selected foe is
  visually clear and has the existing detailed art/HUD treatment. Other members
  remain recognizable and their health/status is readable at 390 px mobile
  width without horizontal overflow.
- The map node should identify that a fight is a pack and show its 2–3 member
  count before entry; it still occupies one tile and has one interaction.
- Tapping a living card changes target without spending a turn. Dead cards are
  visibly defeated and disabled. Buttons/keyboard controls expose target
  cycling for keyboard and assistive use.
- AoE is labeled in the ability UI and its result log identifies which foes it
  hit. Enemy action logs identify the actor by name. Role/faction chips remain
  visible without displacing health or target controls.
- Keep authored bosses, Rift masters, and tutorial single-enemy presentation
  visually unchanged apart from any shared component refactor needed for the
  array model.

## Simulator and validation contract

`tools/sim.js` launches packs through the real battle API in combat cells and
expedition attrition tests when `--packs` is enabled; the default remains the
single-foe reference. Pack-smart selects a living target by role and remaining
HP before using the existing smart action policy. Each result records whether
it used packs; per-foe actions, rounds, wins, HP and easy/hard/slog flags are
retained in combat rows. Modifier-free paired references use
`--no-biome-mods --no-depth-mods`.

Required browser regressions: normal/daily/Rift pack generation is deterministic
and sizes stay 2–3; target switch is free; killed members skip their turn;
turn order and round cooldowns are stable; AoE applies exactly once to every
living member; per-foe statuses and affixes remain isolated; partial flee and
save/reload preserve all member state; rewards/kills/codex are counted exactly
once; normal, daily, Rift boss, and tutorial single-foe paths remain valid.
Run i18n, map, special/role/faction, save/smoke, visual mobile checks, and the
full suite after integration. Capture paired seed 1/7 combat and expedition
economy comparisons against the frozen V-19 single-foe candidate, reporting
all residual flags and progression deltas honestly.

## Implementation status

The V-20 family contract was frozen at `71421af` before V-18 integration.
`tools/multi-enemy-model-check.js` exercises 500 deterministic resolver packs,
private seeded choices, unique 2–3 members, ordered actions, AoE target lists,
per-member state, save normalization, and legacy saves. The browser regression
covers normal, daily, and Rift entry, map badges, free target switching, a saved
active target and damaged pack, partial defeat/re-entry, one shared round, one
AoE action, and one payout after the final member.

Current paired combat and economy comparisons, screenshots, residual flags, and
test results are in [V-18 evidence](../combat-evidence/v18-multi-enemy.md).
