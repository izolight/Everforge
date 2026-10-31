# I18N-01: Procedural creature name localization

## Scope

Localize generated creature singular names, plural names, and generated Rift boss short names in German and Korean. Keep English canonical names in `ENEMIES`, saves, roster IDs, and RNG inputs. Compose translations from finite biome name-prefix and anatomy-compatible noun dictionaries, with localized plural noun forms. Preserve the existing four alpha-name translations.

## Acceptance

- Generated ordinary-region and Rift names display in English, German, and Korean without changing canonical `E.name`, `E.plural`, or `E.short` values.
- Generated names continue to use body-compatible English noun tokens; name generation and random draw order remain unchanged.
- Bounty plural text, boss short labels, battle/map names, affixed names, Codex pages, and Codex search use localized display names.
- Changing language rerenders existing generated creatures consistently; deterministic region/roster reconstruction and saved creature IDs remain unchanged.
- All prefix/noun/plural/short-name translations are covered by `tools/i18n-check.js`; `tools/name-check.js` continues validating anatomy compatibility.
- Scope excludes procedural creature lore, intro sentences, biome region names, specials, and tells.

## Implementation and verification

- `genName` retains the same prefix/noun RNG draws and returns composition metadata alongside the unchanged canonical English string. Display composition is performed by `tx()` from context dictionaries; no creature identity or save key changes.
- German composes compound prefix stems and inflected singular/plural nouns; Korean composes spaced prefix/noun phrases and repeats its non-inflected noun form. Rift boss short labels use the localized noun and German grammatical gender. Alpha names keep their existing direct translations. If a generated English name collides with an authored dictionary key, the authored exact translation takes precedence.
- `tools/i18n-check.js` checks every generated prefix/noun context and each generated alpha name. `tools/name-check.js` checks body compatibility and composition metadata over 234 seeded biome/body/boss samples.
- `tools/procedural-name-check.js` exercises actual UI language switching, map and battle names, bounty plurals, Codex search, and reload reconstruction for a fixed-seed Rift boss and alpha. It verifies canonical English name fields, state, and `Math.random` remain unchanged while translating; it also checks German boss articles against neuter *Gespenst* and feminine *Hülle*.
- Verification on revision `5bfaa68` plus the I18N-01 changes: `git diff --check`, `node tools/name-check.js`, `node tools/i18n-check.js`, and `node tools/procedural-name-check.js` passed; the repository full suite also passed (45/45, run by the parent agent). A direct baseline comparison of 59 generated entities (authored generated rosters plus Rift seed `9042201`, depth 1) found zero gameplay/name-field differences against `HEAD` after excluding the added `nameParts` metadata.
