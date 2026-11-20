# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![GTA 6 Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/zesty-pika-87/gta6-trophy-guide-01-v9/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/zesty-pika-87/gta6-trophy-guide-01-v9/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation trophies of Grand Theft Auto VI — built for the [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) bounty on make.fun.

## What it is

A static web app (plain HTML, CSS and JavaScript, no build step, no network at run time) that covers every trophy with its official name, description and grade, a step-by-step guide in my own words, a six-stage roadmap to the platinum, and a checklist that saves in the browser.

## What makes this version different

- **Audit bar on every screen.** Counted live from the guide's own data: 55 official trophies (1 platinum, 2 gold, 6 silver, 46 bronze), 55/55 guides citing a source, **175/175 steps cited**, 14 sources read 20 Nov 2026, 1 possibly missable, 7 on watch, 1 unconfirmed, 17 single-source, 8 disagreements.
- **Every step cites its source.** Each of the 175 steps carries a `[n]` reference to the guide it came from — PowerPyx, Push Square, KeenGamer, Exophase, PSNProfiles, GTABase and eight more, each with a date read and a "cited by N of 55 guides" count.
- **Disagreements shown, not hidden.** Eight panels show both versions where guides differ — platinum hours (200 vs 300+), the Paradise Lost chapter, shooting-range counts (2 vs 12), stranger strands (8 vs 14), stunts (250 vs 300), meditation counts, and two methods KeenGamer still lists as unconfirmed — each with a safe play.
- **Honest about what is unknown.** One trophy, Bad Luck, I Guess, has no confirmed method in any guide read on 20 Nov 2026. Its panel says what is believed and stops there; nothing is invented.
- **Missables done properly.** One possibly missable trophy (the Chapter 1 balcony meditation), a seven-item watch list, and a cleared section — each with the reason cited.
- **Filters you can see.** Category chips with counts (Story 12, Activities 13, Stranger 7, Robbery 6, Money 4, Combat 3, Exploration 6, Collectibles 2, 100% 1, Platinum 1) plus status chips — no dropdown hides them.
- **Six-stage roadmap.** Each stage has an hour estimate, a live earned count and its trophy chips, plus ground rules (one playthrough, no difficulty, no New Game+, no mission replay, cheats off, 15 manual saves) and a note on how the roadmap was built.
- **Spoiler cover that holds.** With the cover on, a story trophy shows nothing but "Hidden trophy — Chapter N" anywhere in the app: list, detail, roadmap, missables, next-up and stats.
- **Tracker.** Checkboxes saved in localStorage, export and import of progress as JSON, search, and a next-up list — all visible on the main screen.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `app/` with any static file server. The app fetches only its own data files and makes no network request.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
