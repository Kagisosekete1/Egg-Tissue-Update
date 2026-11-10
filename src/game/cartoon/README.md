# Native 2D renderer

`Scene.native.js` exports this renderer for local play and online battles. Gameplay, scoring, rewards, shields and power-ups remain in their existing modules. The SVG scene uses a 1080-wide illustration space; the game UI surrounds that scene in a responsive portrait screen. Android and Expo configuration now request portrait orientation.

- `characters/`: original egg with separate arms, feet, shell, brows, eyes and mouth; original spray bottle.
- `environments/`: sky/clouds, distant hills, trees, garden and tabletop. Foreground leaves remain in the scene composition.
- `effects/`: impact stars; bounded spray droplets and impact squash are composed by `CartoonScene`.
- `palette.js`: consistent dark outlines shared across assets.
- `CartoonScene.js`: tissue deformation/tear, scene composition, visibility and pause-aware animation clock, reduced-motion preference, and exactly-once impact callback per fall.
- `src/components/DicePreview.js`: native animated 2D die; no GL canvas.

The old 3D implementation is retained in repository history. No new art or characters were taken from the supplied cartoon reference. This is the initial native 2D pass, not a finished premium art/animation production or a signed Android release. Main navigation and non-game screens still retain their earlier layouts. Device testing and further UI/animation polish are still needed. Lovable is a separate web project and is not synchronized with this repository.
