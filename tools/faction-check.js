#!/usr/bin/env node
// V-19 generated/authored faction membership, special rules and mobile HUD.
const assert = require("assert");
const path = require("path");
const { chromium } = require("playwright");

const URL = "file://" + path.resolve(__dirname, "..", "index.html");
const SHOT = path.resolve(__dirname, "../combat-evidence/v19-faction-mobile.png");

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem("everforge-lang", "en"));
    await page.goto(URL);
    const result = await page.evaluate(() => {
      LANG = "en";
      const fail = message => { throw new Error(message); };
      const factionIds = [...FACTION_ORDER];
      const expectedAuthored = { bandit:"raiders", raider:"raiders", witch:"cultists", seer:"cultists", fen_mirewitch:"cultists", golem:"constructs", slag:"constructs", anvil:"constructs", orrery:"constructs", revenant:"starCult", acolyte:"starCult", seraph:"starCult" };
      for (const [id, faction] of Object.entries(expectedAuthored)) {
        if (ENEMIES[id]?.faction !== faction) fail(`${id} lacks authored faction ${faction}`);
      }
      const authoredZones = Object.fromEntries(factionIds.map(faction => [faction, new Set()]));
      for (const [id, faction] of Object.entries(expectedAuthored)) authoredZones[faction].add(ENEMIES[id].zone);
      if (factionIds.some(faction => authoredZones[faction].size < 2)) fail("Authored faction membership does not cross regions");

      const checkGenerated = roster => {
        for (const foe of roster) {
          if (!factionIds.includes(foe.faction)) fail(`${foe.id} has no faction`);
          if (factionForRole(foe.role) !== foe.faction) fail(`${foe.id} faction and role disagree`);
          const faction = ENEMY_FACTIONS[foe.faction], role = ENEMY_ROLES[foe.role];
          if (!faction.kinds.includes(foe.sp.kind) || !role.kinds.includes(foe.sp.kind)) fail(`${foe.id} has non-signature ${foe.sp.kind}`);
        }
      };
      const regional = {};
      for (const zone of ["woods", "pass", "hollow", "spire"]) {
        const roster = genRoster(zone);
        if (roster.length !== 12 || roster.filter(foe => foe.alpha).length !== 1) fail(`${zone} size/alpha changed`);
        checkGenerated(roster);
        const signature = list => JSON.stringify(list.map(foe => [foe.id, foe.name, foe.role, foe.faction, foe.sp.kind, foe.afx]));
        if (signature(roster) !== signature(genRoster(zone))) fail(`${zone} faction roster is not deterministic`);
        regional[zone] = Object.fromEntries(factionIds.map(faction => [faction, roster.filter(foe => foe.faction === faction).length]));
        regMon(roster);
      }
      if (Object.values(ENEMIES).filter(foe => foe.zone === "fen" && !foe.boss && !foe.gen).length !== 6 || RIFT_N !== 10) fail("Fen/Rift roster scope changed");

      const riftBiomes = {};
      for (let seed = 1; seed <= 500 && Object.keys(riftBiomes).length < RIFT_BIOMES.length; seed++) {
        const made = riftMake(seed, 1);
        if (riftBiomes[made.biome]) continue;
        const roster = Array.from({length:RIFT_N}, (_, i) => ENEMIES[`w_rift_${i}`]);
        checkGenerated(roster);
        const counts = Object.fromEntries(factionIds.map(faction => [faction, roster.filter(foe => foe.faction === faction).length]));
        riftBiomes[made.biome] = { counts, bossFaction: ENEMIES.rift_boss.faction || null };
      }
      if (Object.keys(riftBiomes).length !== RIFT_BIOMES.length) fail("Seed set did not cover every Rift biome");
      if (Object.values(riftBiomes).some(row => row.bossFaction)) fail("V-19 tagged a Rift master");
      for (const faction of factionIds) {
        if (Object.values(riftBiomes).filter(row => row.counts[faction] > 0).length < 2) fail(`${faction} does not cross Rift biomes`);
      }

      S = freshState();
      S.unl = Object.fromEntries(UNLOCKS.map((u,i) => [u.id, i+1]));
      S.zone = "rift"; S.unlocked = ZONES.map(z => z[0]);
      S.rift = { seed: 1, depth: 1, best: 1, cleared: 0 };
      S.hp = pstats().maxHp; S.view = "battle"; S.event = null; S.battle = null;
      const uiLabels = {};
      for (const faction of factionIds) {
        const member = Object.entries(expectedAuthored).find(([, tag]) => tag === faction)?.[0];
        if (!member) fail(`${faction} has no authored UI fixture`);
        S.zone = ENEMIES[member].zone;
        startBattle(member, { rar:"normal", afx:[] }); render();
        const visible = document.querySelector(".faction-chip");
        if (!visible || visible.textContent.trim() !== tx(ENEMY_FACTIONS[faction].name)) fail(`${faction} badge missing from combat HUD`);
        if (document.documentElement.scrollWidth > innerWidth) fail(`${faction} HUD overflows 320px mobile viewport`);
        uiLabels[faction] = visible.textContent.trim();
      }
      S.zone = RIFT_ZONE;
      let foe = null, factionSeed = 1;
      for (; factionSeed <= 500 && !foe; factionSeed++) {
        riftMake(factionSeed, 1);
        foe = Object.values(ENEMIES).find(entry => entry.zone === RIFT_ZONE && !entry.boss && entry.faction === "starCult") || null;
      }
      if (!foe) fail("Star cult Rift member missing for long-label fixture");
      factionSeed--;
      S.rift = { seed: factionSeed, depth: 1, best: 1, cleared: 0 };
      startBattle(foe.id, { rar:"normal", afx:[], biomeMods:false, depthMods:false });
      render();
      const chip = document.querySelector(".faction-chip");
      const cue = chip && (chip.getAttribute("data-tip") || chip.getAttribute("title") || chip.getAttribute("aria-label") || "");
      const factionUi = !!chip && chip.textContent.trim() === tx(ENEMY_FACTIONS[S.battle.faction].name) && cue.includes(tx(ENEMY_FACTIONS[S.battle.faction].desc));
      const factionColor = chip && getComputedStyle(chip).color;
      const factionMark = chip && chip.getAttribute("data-mark");
      document.querySelector("#foeArt").click();
      const factionTerm = [...document.querySelectorAll("#sheetIn dt")].find(term => term.textContent.trim() === tx("Faction"));
      const factionCodex = !!factionTerm && factionTerm.nextElementSibling.textContent.includes(tx(ENEMY_FACTIONS[S.battle.faction].name)) && factionTerm.nextElementSibling.textContent.includes(tx(ENEMY_FACTIONS[S.battle.faction].desc));
      closeSheet();
      return { regional, riftBiomes, uiLabels, factionUi, factionCodex, factionMark, factionColor, width:document.documentElement.scrollWidth, view:innerWidth, faction:S.battle.faction };
    });
    assert.deepStrictEqual(errors, [], `browser errors: ${errors.join("; ")}`);
    assert(result.factionUi, `faction tooltip/label missing: ${JSON.stringify(result)}`);
    assert(result.factionCodex, `faction missing from Codex: ${JSON.stringify(result)}`);
    assert(result.factionMark, "shared faction mark is missing");
    assert(result.width <= result.view, `mobile horizontal overflow: ${JSON.stringify(result)}`);
    assert(result.factionColor && result.factionColor !== "rgb(255, 255, 255)", "faction color is not displayed");
    await page.locator("#enemyHud").screenshot({ path: SHOT });
    console.log("FACTION CHECK OK", JSON.stringify(result));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
