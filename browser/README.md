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

Per the owner's instruction, everything stays offline: no existing game account, online invitations, global scores, notifications, payments, adverts or remote profile sync is connected. The Site's owner-only access is unchanged. Computer round points follow the original signed scoring formula. Pass-and-play rounds do not affect solo points, levels or daily missions. Device storage can be cleared by the browser; it is not a cloud backup.

## Build and checks

Run `npm ci`, `npm run build` and `npm test`. Deploy `dist/`. `build.cjs` adapts the original React Native SVG renderer for browsers. Hash routes support back/forward navigation without server route configuration.

Rules/progression tests cover signed scoring, level gates/stars, tournament completion, duplicate results, daily reward claims/reset and original game-style rules. DOM integration checks cover navigation, deep-link level locks, shop balance/inventory/equip, style selection, sudden-death state, pause/resume, a complete local match and restart. Interactive device/browser visual QA remains outstanding because the shared browser-control tool is unavailable in this environment.

This is a browser game, not a signed Android APK. The root native application remains separate. No dependency on the unfinished Lovable project.
