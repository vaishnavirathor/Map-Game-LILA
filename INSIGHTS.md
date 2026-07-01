# INSIGHTS — LILA BLACK Gameplay Data (Feb 10–14, 2026)

Three findings backed by evidence from 796 matches and ~89,000 events.

---

## 1. Near-zero PvP combat — players fight bots, not each other

**Finding:** Across 5 days and 796 matches, only **3 human-vs-human kills** were recorded. The vast majority of combat is human-vs-bot.

**Evidence:**

| Event | Count |
|---|---|
| Human kills human (`Kill`) | 2 (AmbroseValley), 1 (GrandRift), 0 (Lockdown) |
| Human killed by bot (`BotKilled`) | 488 |
| Human kills bot (`BotKill`) | Extensive (part of 9,955 loot events) |
| Storm deaths | 39 total |

**Implication:** The game is currently a PvE experience — humans are primarily fighting AI bots and the environment. PvP encounters are vanishingly rare. If the design intent is extraction-shooter with player tension, the matchmaking or player density may need tuning. With 780 matches having humans (782 entries) and only 52 having bots (461 entries), most matches are solo-human runs.

---

## 2. Ambrose Valley dominates match volume 3:1

**Finding:** Ambrose Valley is played **3.3×** more than Lockdown and **9.6×** more than Grand Rift.

**Evidence:**

| Map | Matches | % | Avg events/match |
|---|---|---|---|
| AmbroseValley | 566 | 71.1% | ~120 |
| Lockdown | 171 | 21.5% | ~75 |
| GrandRift | 59 | 7.4% | ~50 |

**Implication:** Grand Rift is heavily underutilized (59 matches out of 796). If it's a newer map, adoption is low. If it's an older map, it may have balance or fun-factor issues warranting investigation. Ambrose Valley's high volume suggests it's the "default" or most polished map — good for onboarding but risks player fatigue.

---

## 3. Storm deaths are evenly split between Ambrose Valley and Lockdown

**Finding:** Despite Ambrose Valley having 3.3× more matches, it has **exactly the same number of storm deaths** (17) as Lockdown.

**Evidence:**

| Map | Matches | Storm Deaths | Storm Death Rate |
|---|---|---|---|
| AmbroseValley | 566 | 17 | 3.0% of matches |
| Lockdown | 171 | 17 | 9.9% of matches |
| GrandRift | 59 | 5 | 8.5% of matches |

**Implication:** Lockdown's storm kills players at **3.3× the rate** of Ambrose Valley. This could mean Lockdown's storm mechanics are more punishing (faster shrink, less cover, tighter extraction windows) or that its smaller map size leaves less room to escape. If storm deaths are intended as a tension mechanic rather than a primary killer, Lockdown's storm tuning may need adjustment.