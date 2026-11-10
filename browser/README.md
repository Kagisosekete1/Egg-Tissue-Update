# Egg & Wet Tissue — offline browser edition

Play: https://egg-tissue-cartoon-play.seketefilmstv.chatgpt.site

This edition reuses the original mobile game's rule module and the copied project's 2D cartoon renderer. Original source: https://github.com/Kagisosekete1/egg-wet-tissue-react-native . Updated native and browser sources: https://github.com/Kagisosekete1/Egg-Tissue-Update .

## Play flow

- Home → game setup → Classic, Sudden Death, Chaos Cards or Tournament.
- Computer or pass-and-play; easy, normal or hard.
- Tournament is first to two wins. Each round uses the original rules.
- Levels: a new 12-level trail across two garden themes. Win against the computer to unlock the next level; tournament levels require winning the series. Stars reward safe sprays.
- Challenges: three daily local missions, with claim-once XP rewards; reset follows Africa/Johannesburg dates.
- Shop: the original boost/shield catalog and point prices, using a separate device wallet. Items must be bought before use; shields have limited hits. Original boost, counter, lucky-roll and AI-boost behavior is retained.
- Results: actual local computer-round history and a personal best. No invented leaderboard players.
- Profile: local name, XP title, sound settings.

Per the owner's instruction, everything stays offline: no existing game account, online invitations, global scores, notifications, payments, adverts or remote profile sync is connected. The Site’s current sharing settings are preserved. Computer round points follow the original signed scoring formula. Pass-and-play rounds do not affect solo points, levels or daily missions. Device storage can be cleared by the browser; it is not a cloud backup.

## Build and checks

Run `npm ci`, `npm run build` and `npm test`. Deploy `dist/`. `build.cjs` adapts the original React Native SVG renderer for browsers. Hash routes support back/forward navigation without server route configuration.

Rules/progression tests cover signed scoring, level gates/stars, tournament completion, duplicate results, daily reward claims/reset and original game-style rules. DOM integration checks cover navigation, deep-link level locks, shop balance/inventory/equip, style selection, sudden-death state, pause/resume, a complete local match and restart. Interactive device/browser visual QA remains outstanding because the shared browser-control tool is unavailable in this environment.

This is a browser game, not a signed Android APK. The root native application remains separate. No dependency on the unfinished Lovable project.

## Original audio and water effects

The browser uses the native game's original roll, spray, crash, danger, heartbeat, reaction, fall, win/lose recordings and all three MP3 music tracks. Assets are copied unchanged under `assets/audio/` and copied into the deployment by the build. Music starts after interaction, loops at the original 0.13 volume, avoids consecutive repeated tracks, and pauses on pause/mute/background/game-over/exit. Settings includes a separate background-music switch. Effect voices are bounded and media errors never block gameplay.

The mirrored sprayer is beside the upper-right tree and points down-left toward the egg and tissue. `src/native/cartoon/layout.js` shares nozzle and tissue coordinates with the bounded spray particles. Clipped blue wet patches persist, spread with moisture, and produce visible dripping water; restarting clears the effects. The same scene change is included in the native project.

Checks: 16 copied audio files matched the original checksums and decoded with ffprobe; audio lifecycle/geometry unit tests passed; DOM integration checks passed for original audio triggers, pause/mute/resume/exit, spray visibility, persistent wetness and restart cleanup. Actual speaker output and device visual QA remain unverified.
