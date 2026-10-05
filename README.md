# Tabuada Rock

A 3D fighting game in Brazilian Portuguese for learning the multiplication tables from 2 to 10. Every correct answer lands a hit. Climb the tower one table at a time until you're the champion.

**Play:** https://rafaelgorski.github.io/TabuadaRock/

Works in any recent desktop browser. Phones and tablets are supported with an on-screen keypad.

## How to play

1. **Create a fighter** (*Novo lutador*). Pick a name and a partner creature. Each player gets a profile, so parent and child can compete on the same computer.
2. **Climb the Torre da Tabuada**, the tables of 2 → 10. The *Desafio Final* at the top mixes every table.
3. **Each table is one match:**
   - **Treino:** orbs build the table row by row, teaching it before any test. No clock.
   - **Round 1:** the facts in order.
   - **Round 2:** the facts shuffled.
   - **Round final:** shuffled facts plus review from earlier tables, with a gentle clock.
4. **Answer** by typing the number and pressing **Enter**, or with the on-screen keypad. **DICA** shows a hint.
5. **Stars** depend on mistakes in the whole fight: at most 1 mistake earns ★★★, at most 4 earns ★★, and any win earns ★. Beating a table recruits its guardian to your team.

### Records (*Recordes*)

- **Ranking:** tower points (the best result on each table, added up).
- **Melhores lutas:** the 10 best fights in the house.
- **Duelo:** two players compared table by table.
- **Domínio:** a map of all 90 facts, showing which ones each player has mastered.

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

### Deploy

Every push to `main` runs `.github/workflows/deploy.yml`. It installs, tests, builds, and publishes `dist/` to GitHub Pages. GitHub Pages must use **GitHub Actions** as its source (*Settings → Pages → Build and deployment*).

## Credits

All creatures, stages, and sounds are original. The game draws on the creature-battle genre but uses no Pokémon characters, names, or assets.
