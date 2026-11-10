# Egg & Wet Tissue — browser play

A playable browser edition of the original mobile game, using the copied project's cartoon SVG renderer and game rules. Play against the computer or a friend on the same device. Scores are saved locally in the browser. Sound is synthesized. No account, advert, payments, leaderboard or online battle is simulated here.

Run `npm ci` and `npm run build`. Deploy the `dist` directory. `build.cjs` adapts the original React Native SVG components to the browser. The original native project remains at https://github.com/Kagisosekete1/Egg-Tissue-Update .

Modes in this web edition: classic, easy/normal/hard, computer or local two-player. Original classic turn bonuses (first-spray shield/double spray), nonrepeating die rolls and spray damage are preserved. Pause stops game/AI timers and scene animation; backgrounding pauses the game. Reduced-motion preferences are respected by the renderer and CSS.

This is a browser play edition, not a signed Android APK. Main site is private to its owner through ChatGPT Sites. Built without the unfinished Lovable project.
