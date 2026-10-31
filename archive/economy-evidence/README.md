# M-08: Steam essence source

The existing Cursed Altar now has Steam in its five-result essence rotation. After the Mystery event is unlocked, a player may offer 1 HP for one essence or 3 essences for the larger HP cost; the altar can return Steam instead of an enemy's Volatile affix being the only source. The change adds no reward slot, extra drop or random draw, and does not expand the generic essence pool.

`node tools/steam-source-check.js` forces the small offering's existing pre-roll to the Steam result and checks the player loses 1 HP and receives exactly one Steam essence.

Economy comparison: baseline `ddb9730` and the altar change, same seed 7, 30 expeditions per zone, smart policy, melee stage kit, Heat 0. Both runs used:

```sh
node -r /tmp/noFonts.js tools/sim.js --econ-only --seed 7 --exped 30
```

Across Woods, Pass, Hollow and Spire, clear/loss rate, fights, direct and salvage essence, embers, salvage embers, drops, shops, steps, torch use and XP matched exactly. Gear and essence price ranges also matched. The per-zone values and deltas are in [m08-seed7-comparison.json](m08-seed7-comparison.json).
