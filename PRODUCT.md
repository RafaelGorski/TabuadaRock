# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One primary player: the owner's 11-year-old child, a Brazilian Portuguese speaker who is starting the multiplication tables nearly from scratch. They play at home on a laptop or desktop computer with a keyboard and mouse. Their favorite part of Pokémon is the battles: attacks, HP, and type matchups.

The parent (the repository owner) builds the game for them and is the secondary audience. The parent judges whether the child is actually learning, and also plays under a separate profile to compete with the child on the rankings.

## Product Purpose

A 3D browser game that teaches the multiplication table from 2 to 10, the full table described at https://en.wikipedia.org/wiki/Multiplication_table. Difficulty rises gradually, one table per level. Success means the child completes every level from 2 to 10 and can recall each fact.

## Positioning

The game is built around a Pokémon-style battle, and the multiplication fact is the attack: the child wins by answering the times table. Because the child is starting from scratch, each table is taught before it is tested, so a level is a path from understanding to recall to speed, not a quiz with battle decoration.

## Operating Context

- Played in a desktop web browser on a laptop or computer, using a keyboard for number entry and a mouse for navigation.
- Home use, driven by the child and supervised by a parent.
- Progresses through levels for the tables of 2, 3, 4, 5, 6, 7, 8, 9, and 10. Completing all of them completes the multiplication table.

## Capabilities and Constraints

- All player-facing content is in Brazilian Portuguese (pt-BR): UI, story, creature names, feedback.
- Must be 3D and run on the web with no install.
- Levels cover the tables of 2 through 10, with challenges that get harder gradually.
- The child is starting nearly from scratch, so each table needs a teaching step before battles test it.
- Keyboard-first answer entry. Mouse supported for every action.
- "Inspired by Pokémon" means the genre: creatures, battles, HP, and type matchups. No Pokémon characters, names, logos, sprites, sounds, or Poké Ball trade dress. Every creature and asset must be original.
- Progress is saved in the browser with no accounts or server. Each family member registers a local profile. Profiles, fights, top attempts and rankings live in IndexedDB, mirrored to localStorage. A backup file can be downloaded and merged back. Results must survive redeploys.
- Hosted as a static site on GitHub Pages from the repository `RafaelGorski/TabuadaRock`.

## Brand Commitments

- Working title is the repository name, **TabuadaRock**. "Tabuada" is Portuguese for the multiplication table. This is assumed, not confirmed by the owner.
- Voice: Brazilian Portuguese, speaking directly to an 11-year-old player.

## Evidence on Hand

None yet. There is no existing art, creature roster, copy, audio, or learning data. Everything is authored for this project. Never use or imitate official Pokémon assets.

## Product Principles

1. **The battle is the practice.** Every multiplication answer is a move in the fight, never a quiz that interrupts play.
2. **Teach before testing.** A table is shown and understood before the child must recall it under battle pressure.
3. **Gradual, then mixed.** Each table unlocks the next. Difficulty rises inside a level and across levels until all facts are mixed.
4. **Original world.** Draw on the genre's mechanics. Never copy its characters or marks.
