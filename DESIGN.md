---
name: Tabuada Rock
description: Arcade fighting web game where times-table facts become hits, combos, and damage numbers.
colors:
  cobalto: "#2440ff"
  cobalto-escuro: "#0f1f99"
  brasa: "#ff4a1c"
  brasa-escuro: "#a8250a"
  ouro: "#ffd21f"
  tinta: "#1a1230"
  giz: "#f4f7ff"
  branco: "#ffffff"
  menta: "#19d3a0"
  nevoa: "#d9e0f7"
  tipo-raio: "#ffe014"
  tipo-agua: "#1fa2ff"
  tipo-fogo: "#ff5a1f"
  tipo-planta: "#2dbe4e"
  tipo-pedra: "#b08a5f"
  tipo-vento: "#7fd6ea"
typography:
  display:
    fontFamily: "Anybody Variable, Arial Black, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(4rem, 1.5rem + 10vw, 11rem)"
    fontWeight: 900
    lineHeight: 0.88
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Anybody Variable, Arial Black, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.8rem, 1.8rem + 4vw, 5.5rem)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Anybody Variable, Arial Black, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.4vw, 3.4rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Anybody Variable, Arial Black, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)"
    fontWeight: 560
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Anybody Variable, Arial Black, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(0.85rem, 0.8rem + 0.2vw, 0.95rem)"
    fontWeight: 850
    lineHeight: 1.3
    letterSpacing: "0.04em"
rounded:
  none: "0"
spacing:
  s-1: "0.25rem"
  s-2: "0.5rem"
  s-3: "0.75rem"
  s-4: "1rem"
  s-5: "1.5rem"
  s-6: "2rem"
  s-7: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.cobalto}"
    textColor: "{colors.giz}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1.5rem"
    height: "3rem"
  button-danger:
    backgroundColor: "{colors.brasa-escuro}"
    textColor: "{colors.giz}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.5rem 1.5rem"
    height: "3rem"
  chip-type:
    backgroundColor: "{colors.tipo-raio}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.12em 0.7em"
  plate-paper:
    backgroundColor: "{colors.giz}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    padding: "1rem 1.5rem"
  input-answer:
    backgroundColor: "{colors.branco}"
    textColor: "{colors.tinta}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    width: "2.4em"
---

# Design System: Tabuada Rock

## Overview

**Creative North Star: "Fliperama de Luta Brasileiro"**

The cast includes original fauna and a kid-friendly Brazilian folklore showcase:
Saci, Curupira, Iara, Cuca, Boto, Mula and Caipora join Boitatá and Mapinguari.

Tabuada Rock is a full-bleed 3D arcade fight wrapped in a DOM control layer. The visual system turns arithmetic into spectacle: products become damage numbers, correct answers become hits, and every teaching or record screen borrows the same fighting-game grammar of skewed plates, ink outlines, heavy announcer type, segmented meters, and tactile button states.

The shipped world is deliberately loud but legible. Cobalt player energy, brasa rival pressure, arcade gold reward, and ink structure repeat through both the HUD and the 3D scene. The DOM never floats bare over the stage when it carries important text; it sits on paper or ink plates so the learning loop stays readable over daylight Brazilian arenas.

**Key Characteristics:**
- Full-bleed Three.js stage behind a DOM HUD and screen overlay.
- Toon-shaded original creatures and scenery with hard ink outlines.
- Skewed, square-corner plates with thick ink borders and hard offset shadows.
- Black italic expanded type for title, button, HUD, and announcer moments.
- Keyboard-first answer entry with a matching on-screen keypad for pointer and touch.

## Colors

The palette is a four-color arcade core with supportive success, paper, disabled, and type-badge colors.

### Primary
- **Cobalto Elétrico**: The player-side action color for primary buttons, player HUD face plates, active partners, answer operators, score callouts, and site theme color.
- **Tinta de Nanquim**: The structural color for text, borders, outlines, plate backs, shadows, table headers, type strokes, and 3D ink hulls.

### Secondary
- **Brasa de Rival**: The hit/error/danger family for rival-side plates, urgent clocks, timeout/wrong states, destructive actions, and high-pressure announcer calls.
- **Ouro de Fliperama**: The reward and focus color for title fills, life bars, selected states, stars, perfect rounds, focus plates, current prompts, and top-ranked records.

### Tertiary
- **Menta de Acerto**: The success color for correct answer boxes, cleared ladder rungs, mastery cells, point pops, and advantage chips.
- **Névoa de Espera**: The disabled and low-emphasis surface color for locked states, erased keypad keys, mastery-in-progress cells, tab defaults, and striped unavailable controls.
- **Tipos de Golpe**: Raio, água, fogo, planta, pedra, and vento have distinct chip colors. They label creature types and matchup logic, not arbitrary decoration. In code they are the `--t-*` custom properties in `src/styles/base.css` (`tipo-raio` is `--t-raio`, and so on). `branco` has no custom property; it is written as literal `#fff`. Every other color token matches its custom property name.

### Neutral
- **Giz de Papel**: The primary readable surface over the scene: plates, cards, disabled stripes, keycaps, table sheets, and light text on ink.
- **Branco de Entrada**: Used inside answer boxes, keypad keys, small chain steps, and partner chips where the player types or scans a compact value.

### Named Rules

**The Plate Before Words Rule.** Important text over the 3D scene must sit on an ink or paper plate; only decorative or hidden text may float without backing.

**The Four-Color Fight Rule.** Cobalto means player/action, brasa means rival/danger, ouro means reward/focus, and tinta means structure; do not swap these roles for novelty.

## Typography

**Display Font:** Anybody Variable, with Arial Black, Segoe UI, system-ui, sans-serif fallback.
**Body Font:** Anybody Variable, with the same fallback stack.
**Label/Mono Font:** No separate mono face; numeric clarity comes from tabular-number settings on scores, clocks, equations, and tables.

**Character:** The type is one-family arcade compression: heavy, italic, stretched, uppercase for calls and controls; medium-weight Anybody for supporting copy. Hierarchy is made with clamp scales, stroke, extrusion, stretch, and case rather than font changes.

### Hierarchy
- **Display** (900, `clamp(4rem, 1.5rem + 10vw, 11rem)`, 0.88): Announcer calls such as K.O., Vitória, Round, and Lute; always uppercase, italic, stroked, and shadow-extruded.
- **Headline** (900, `clamp(2.8rem, 1.8rem + 4vw, 5.5rem)`, about 0.86): Lockups, menu titles, result titles, champion titles, and large score moments.
- **Title** (900, `clamp(2rem, 1.4rem + 2.4vw, 3.4rem)`, 0.95-1): Screen titles, fight panel titles, info panel titles, combo numbers, and clock-scale information.
- **Body** (560-700, `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)`, 1.3-1.45): Instructions, support copy, panel notes, ranking notes, table content, and help text.
- **Label** (800-900, `clamp(0.85rem, 0.8rem + 0.2vw, 0.95rem)`, uppercase with 0.03-0.05em tracking): Chips, tags, field labels, HUD labels, table headers, tab labels, and keyboard hints.

### Named Rules

**The Announcer Voice Rule.** Anything that declares a fight state uses heavyweight italic uppercase with ink stroke or ink plate support; quiet sentence case is reserved for explanatory body copy.

**The Tabular Numbers Rule.** Scores, clocks, equations, damage, mastery grids, and standings use tabular numerals so changing values do not jitter during play.

## Layout

The screen model is a fixed full-viewport canvas (`#palco`) under a fixed UI layer (`#ui`). Safe-area-aware padding uses `--pad-x` and `--pad-y`, so overlays avoid device notches while keeping arcade density.

Desktop fight screens reserve the top band for HUD, the bottom center for the question plate, and the right side for coaching or result panels. Split screens place the main DOM column on one side while the cast occupies the other. The tower screen uses a three-column grid: ladder, stage, and info. Records and options use one large paper sheet centered over the scene.

At the narrow breakpoint (860px), the 3D subject moves to the top band and the DOM stacks underneath. Fight panels become flat paper blocks to avoid skew clipping while scrolling. Ladder rungs become a horizontal rail, record tables restack as cards, and large sheets reduce their lean or set skew to zero where a long phone sheet would drift offscreen.

Spacing follows the 0.25rem-to-3rem scale. Compact controls use `s-1`/`s-2`, cards and plates use `s-3`/`s-5`, and large board or split gaps use `s-6`/`s-7`.

## Elevation & Depth

Depth is structural, not ambient. DOM surfaces use thick ink borders, skewed pseudo-element backs, and hard offset shadows. The 3D world uses toon shading with three hard light steps, inverted-hull ink outlines, fog, sky gradients, and stage props merged by material. Hover and press states physically move plates by a few pixels instead of adding soft glass effects.

### Shadow Vocabulary
- **Lift** (`6px 6px 0 var(--tinta), 10px 14px 22px rgb(26 18 48 / 0.28)`): Large plates, big buttons, cards, question plates, and selected large surfaces.
- **Lift Small** (`4px 4px 0 var(--tinta), 6px 9px 14px rgb(26 18 48 / 0.24)`): Standard buttons, compact controls, HUD frames, and secondary cards.
- **Pressed Ink** (`1px 1px 0 var(--tinta)`): Active button/key/card state when the control translates down and right.
- **Tag Plate Shadow** (`5px 5px 0 rgb(26 18 48 / 0.35), 8px 12px 18px rgb(26 18 48 / 0.22)`): Text tags over the stage, result tags, and big star backing plates.

### Named Rules

**The Hard Contact Rule.** Shadows must include an ink-colored offset contact shadow; purely soft elevation does not match the fliperama cabinet language.

## Shapes

The system is square-cornered and skewed. Most interactive and informational surfaces are rectangles with `border-radius: 0`, thick ink borders, and a `skewX(-10deg)` backing shape while the readable text remains upright. Alternate contexts reduce skew to about -4deg, -2.5deg, -1.2deg, -6deg, or 0deg when long panels, side panels, or mobile sheets would clip.

3D shapes are low-poly toon primitives with ink outlines: spheres, capsules, cones, cylinders, boxes, tori, rocks, and stage props. UI silhouettes echo fighting HUD devices: segmented life bars, diamond pips, skewed keycaps, square mastery cells, stroked stars, and oversized extrusion titles.

## Components

### Buttons
- **Shape:** Square-corner skewed plate (`border-radius: 0`, `skewX(-10deg)`) with 3px ink border.
- **Primary:** Cobalto background with giz text, uppercase italic 850 weight, minimum 3rem height, `s-2 s-5` padding. Big buttons use 3.75rem minimum height and `s-3 s-6` padding.
- **Hover / Focus:** Hover translates up-left and grows the hard offset shadow. Active translates down-right and collapses the shadow. Focus and current states turn the backing plate ouro with an ink outline offset.
- **Danger:** Brasa escuro backing with giz text. Armed destructive actions use brasa with tinta text.
- **Disabled:** Striped nevoa/giz backing, faded tinta text and border, smaller hard shadow.

### Chips
- **Style:** Compact skewed tags with 2px ink edge, no shadow, uppercase italic labels, and tinta text.
- **Type chips:** Creature type chips use the six type colors. Matchup chips use menta, brasa, or ouro for advantage, disadvantage, and neutral.

### Cards / Containers
- **Corner Style:** Square, skew-backed paper or ink rectangles.
- **Background:** Giz for profile cards, paper plates, board sheets, fight panels, and data surfaces; tinta for lockup tags, big star backing, and identity pills.
- **Shadow Strategy:** Cards use lift or lift-small; selected cards and picks increase shadow or switch to cobalto.
- **Border:** 2px or 3px tinta border. Dashed borders mark new/empty/unknown states.
- **Internal Padding:** Compact cards use `s-3`/`s-4`; sheets use `s-5`/`s-6`; mobile sheets reduce to `s-4`.

### Inputs / Fields
- **Style:** Fields use the same skewed paper plate as buttons. Text fields are transparent over the plate, uppercase, italic, and heavy.
- **Answer Box:** The equation answer slot is a white skewed inset with ink border, inset ink shadow, tabular numerals, and cobalto caret. Focus and demo turn the slot ouro; correct turns menta; wrong turns brasa; locked turns nevoa.
- **Focus:** Focus-within changes the field plate to white and adds a 3px tinta outline with 4px offset.
- **Error / Disabled:** Error copy is brasa escuro. Disabled controls use nevoa/giz stripes and faded tinta.

### Navigation
- **Style:** Menus use stacked button plates. Tabs use compact skewed nevoa plates with uppercase italic labels and icons.
- **Active:** Selected tabs invert to tinta backing with giz text and ouro offset shadow. Current ladder rungs invert to tinta with ouro shadow.
- **Mobile:** Keyboard hints disappear on coarse pointers; tables restack as labeled card rows and ladder rungs become a horizontal scroller.

### Fight HUD
- **Style:** Every readout is plated: fighter names, portraits, clock, round, score, combo, super meter, pins, and life bars.
- **Life bars:** Segments live in an ink frame, skew with the HUD, and drain from the middle outward; player active segments use menta, rival uses ouro.
- **Clock:** Infinity icon by default; timed rounds switch to numeric ouro and urgent brasa-backed state under five seconds.
- **Announcer:** Full-screen pointerless overlay; calls scale in/out with ink-stroked display type and optional plated subtitles.

### Question Plate and Keypad
- **Question Plate:** The central learning surface: paper plate, oversized italic tabular equation, cobalto operator, hint text below, and a Dica button beside it.
- **Keypad:** Three-column numeric keypad appears by player choice or touch context. Keys are white skewed plates with 2px ink borders; OK is cobalto, erase is nevoa, hover/focus/active all use ouro and ink.

### 3D Stage and Creature Look
- **Materials:** MeshToonMaterial with a three-step gradient map; static scenery shares toon materials by color; outlines use inverted hulls in tinta.
- **Scene:** Full-bleed daylight Brazilian arenas with fog, hemisphere light, sun, sky gradients, toon props, and animated water/clouds/particles.
- **Particles:** Hit and type effects use ink-stroked canvas sprites: dots, stars, drops, leaves, flames, bolts, rocks, swirls, squares, and rings.

## Do's and Don'ts

### Do:
- **Do** put important copy on a plate before placing it over the 3D stage.
- **Do** keep skewed plates, italic heavy type, ink strokes, and hard offset shadows; they are native to this world, not decoration to remove.
- **Do** use ouro for focus, reward, selected states, stars, and current prompts.
- **Do** keep controls square-cornered and tactile, with hover/press movement and visible focus outlines.
- **Do** preserve keyboard-first clarity: typed answers, tabular numerals, hidden decorative animation from assistive tech, and coarse-pointer keypad support.

### Don't:
- **Don't** introduce Pokémon characters, logos, sprites, Poké Ball trade dress, or copied fan-game UI; the shipped creatures and stages are original.
- **Don't** place learning-critical text directly on the scene without an ink or paper backing.
- **Don't** replace hard ink shadows with soft card elevation or glassmorphism.
- **Don't** round the main plates, buttons, tabs, cards, fields, or answer boxes; square skew is the system shape.
- **Don't** invent new accent roles when cobalto, brasa, ouro, menta, nevoa, and the type colors already cover the state language.
