# Tabuada Rock

A 3D fighting game in Brazilian Portuguese for learning the multiplication tables from 2 to 10. Every correct answer lands a hit. Climb the tower one table at a time until you're the champion.

**Play:** https://rafaelgorski.github.io/TabuadaRock/

Works in any recent desktop browser. Phones and tablets are supported with an on-screen keypad.

## How to play

1. **Create a fighter** (*Novo lutador*). Pick a name and a partner creature. Each player gets a profile, so parent and child can compete on the same computer.
2. **Climb the Torre da Tabuada**, the tables of 2 → 10. The *Desafio Final* at the top mixes every table.
3. **Choose the arena** on a map of Brazil: ten places from Monte Roraima to Iguaçu, each with its own 3D scenery. The level and its guardian stay the same; only the stage changes.
4. **Each opponent is one round:**
   - **Treino:** orbs build the table row by row, teaching it before any test. No clock.
   - **Duelo:** ten shuffled facts against each guardian. Winning unlocks the next opponent.
   - **Desafio Final:** one mixed round covering every table.
   - A coin toss opens the round. Win it and your fighter lands a free hit; lose it and the first correct answer is worth double. Each fighter has two normal attacks of different elements plus a super move, so no two duels look alike.
5. **Answer** by typing the number and pressing **Enter**, with the on-screen keypad, or out loud: **FALAR** listens in pt-BR and **OUVIR** reads the question again. **DICA** shows a hint.
6. **Stars** depend on mistakes in the round: no mistakes earns ★★★, up to 3 earns ★★, and any win earns ★. Beating a table recruits its guardian and unlocks the next opponent.

### Records (*Recordes*)

- **Ranking:** tower points (the best result on each table, added up).
- **Melhores lutas:** the 10 best fights in the house.
- **Duelo:** two players compared table by table.
- **Domínio:** a map of all 90 facts, showing which ones each player has mastered.

### Missão Rock and Selos de Domínio

*Missão Rock* is an optional, parent-controlled household reward system. A parent opts in with a local PIN and acknowledges that fulfilment happens outside the game. Children earn deterministic **SELOS** only from a trained table's first clear or a due spaced review: 8/10, 9/10 and 10/10 first-try facts pay 3, 4 and 5 seals. Hints and requeued corrections do not count as first attempts. There are no streaks, random rewards, purchases, payment details, cash value or in-game store.

The ledger enforces at most two scoring sessions and 10 seals per calendar day, and 30 seals per week. Reviews are scheduled after 48 hours, then 7 days, then at least every 14 days; missed days do not remove balance or progress. A table is mastered only after at least eight individual facts are correct in three credited sessions, including the 48-hour and 7-day checks. At 120 or 285 seals a child can **PEDIR AO RESPONSÁVEL** an 800 or 2,400 V-Bucks package. The parent sees every ledger row, due reviews, caps, rolling 90-day spend, budget and request; approval displays the exact external price and requires the PIN again. Deferring or declining spends nothing. Approval subtracts only the requested seal threshold; any external purchase is a family decision outside TabuadaRock.

## Saved progress

Everything is saved in the browser, on the device itself. There is no server and no account.

- **Main store:** IndexedDB, database `tabuadarock`, with profiles, fights and settings. The game asks the browser for persistent storage so the data is not evicted when the disk fills up.
- **Redeploys are safe.** The data belongs to the site's address (`rafaelgorski.github.io`), not to the published files. Updating or redeploying the game never touches it.
- **Safety mirror:** every change is also copied to `localStorage`. If IndexedDB ever comes back empty, the game restores itself from the mirror. If IndexedDB is unavailable, the game saves straight to `localStorage`.
- **Backup file:** *Opções → Baixar backup* downloads a `.json` file. *Carregar backup* merges a file into what is already saved and never deletes anything. Use it to move to another computer or browser.

These erase the data, so take a backup first:

- clearing the browser's site data;
- playing in a private (incognito) window;
- switching browser or device;
- changing the site's address (renaming the repository or adding a custom domain).

## Development

```sh
npm install
npm run dev        # local server with hot reload
npm test           # unit tests (Vitest)
npm run build      # type-check + production build in dist/
npm run preview    # serve the production build
```

Stack: Vite, TypeScript, and Three.js.

- The creatures and stages are modeled in code, with no external 3D assets.
- Sound effects and music are synthesized with the Web Audio API.
- The narrator uses the browser's speech synthesis when a pt-BR voice is installed.
- Spoken answers use the browser's speech recognition (*Opções → Responder falando*). Where it is missing, the button stays hidden and answers are typed.
- Seven of the twenty fighters come from Brazilian folklore: Saci, Curupira, Iara, Cuca, Boto, Mula and Caipora.

### Deploy

Every push to `main` runs `.github/workflows/deploy.yml`. It installs, tests, builds, and publishes `dist/` to GitHub Pages. GitHub Pages must use **GitHub Actions** as its source (*Settings → Pages → Build and deployment*).

## Credits

All creatures, stages, and sounds are original. The game draws on the creature-battle genre but uses no Pokémon characters, names, or assets.
