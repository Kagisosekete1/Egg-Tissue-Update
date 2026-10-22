# Android release notes — 22 October 2026

Package: `com.semogrouptech.eggtissue`  
Version: `1.0.2` (version code `8`)

## Build 8 feature update — 21 October 2026

- Added a Shield Shop with Basic (5,000 points / one hit), Golden (10,000 / two hits), and Super (20,000 / three hits) shields. Purchases deduct the account balance in an idempotent Supabase function; equip state and hit durability are stored server-side.
- A shield is checked only when a spray would make the egg fall. The app consumes one hit, cancels that fall, shows a shield flash and remaining durability, and leaves the original damage rule in place when no shield is equipped. AI turns use the same block path.
- Added migration `supabase/migrations/007_username_and_game_shields.sql` and appended it to `supabase/all-tables.sql`. It relaxes the legacy `profiles_username_check` to match the app's 1–24 character usernames, and creates inventory, purchase, equip, and idempotent hit-consumption RPCs. The Supabase project is not linked in this workspace, so the migration still needs to be run in the project's SQL Editor.
- Game music still starts on opening Play and runs at randomized 13% volume. The “Let's roll the dice” voice cue has now been removed.
- Rewarded ads default to Google's test rewarded unit so the ad flow can be exercised without waiting for live inventory. Set `EXPO_PUBLIC_ADMOB_TEST_ADS=0` to use the configured live rewarded unit. Game scores continue to sync in test-ad mode.
- Real-money billing stays disabled. Planned paid shield reward cards and suggested prices are visible in Shield Shop and show “Coming soon” when tapped; no checkout or billing SDK is initialized.
- Paid shield reward previews are now shown in the Shield Shop with their suggested prices. Tapping a preview only says “Coming soon”; billing remains disabled and no checkout is opened.
- Rematch is enabled once after a completed game and is blocked after that game's first rematch.
- Removed the spoken “Let's roll the dice” line. The Wilhelm scream now starts at the fall event, while `original-crash.wav` still plays on floor impact.
- Build 8 remains version `1.0.2`, Android version code `8`.
- Android package remains `com.semogrouptech.eggtissue`; app version is `1.0.2`, Android version code `8`.

## Build 8 verification — 22 October 2026
- `npm run lint` and `npm run test:shields` both completed successfully.
- APK and AAB built successfully as version `1.0.2` / version code `8`; APK package metadata, both signing fingerprints, and the APK manifest's AdMob App ID were checked. Signing SHA-1 matches the Play upload certificate.
- Installed the APK on the connected Samsung Galaxy A05, launched the app, opened Play, and confirmed the game stayed in the foreground with no `FATAL EXCEPTION` in the captured logcat output.
- The game screen loaded and played Google's full-screen rewarded test ad. The “Reward granted” state appeared, and returning to the game showed “Reward used for this game” with the spray count rewound. This confirms the test-ad reward path on this phone; it does not demonstrate live AdMob inventory/fill.
- Confirmed the Shield Shop and “Coming soon” message on the phone. The OGG scream is included in the APK and wired to the game fall event; `original-crash.wav` remains connected to floor impact. The three MP3 tracks remain bundled for randomized looping at 13% volume.
- This workspace still has no linked Supabase project/database credentials. Migration 007 is ready in the SQL files but has not been applied remotely; the username constraint repair and server-backed Shield Shop require that migration before use.

## Crash fixes

- Initialize OneSignal before calling its login or logout methods. Notification initialization and identity failures are now non-fatal to app startup.
- Add the `eggtissue` app link scheme and a themed not-found screen to prevent Expo Router from terminating on an unmatched route.
- Preserve Expo GL's reflected view constructor and JNI `flush()` callback in release builds. Without these keep rules, the game view could crash after the home screen opened.
- Build with the existing Play upload key. Its SHA-1 matches the certificate expected by Play Console: `FC:A9:2E:C1:8E:6A:11:EF:C8:CC:22:4F:67:12:52:86:38:E4:52:EA`.

## Verification

- `npx expo lint` completed with exit code 0.
- Release APK and AAB built successfully. APK package/version metadata and APK/AAB upload certificate were checked.
- Installed the APK on the connected Samsung Galaxy A05, launched Home, opened a game, rolled the die, and confirmed the game remained foreground with no app crash in the crash log.
- The connected phone did not have this package installed before the corrected APK was installed.
- The APK manifest contains the configured AdMob App ID and OneSignal components.

## Artifacts

- `artifacts/build-8/Egg-Wet-Tissue-Challenge-Native-React.apk`
- `artifacts/build-8/Egg-Wet-Tissue-Challenge-Native-React.aab`
- `artifacts/build-8-latest-phone.png`, `artifacts/build-8-latest-play.png`, and `artifacts/build-8-shield-shop.png` — latest phone installation and app screens.
- `artifacts/build-8-paid-rewards.png` and `artifacts/build-8-coming-soon.png` — paid reward cards and tap response.
- `supabase/migrations/007_username_and_game_shields.sql` — migration for the profile constraint fix and shield tables/RPCs.
- `supabase/all-tables.sql` — full schema SQL, including migration 007.

## Store status

On 22 October 2026, the public Play detail URL returned HTTP 404 for this package. That confirms the app is not currently visible at its public listing URL. The Play Console page could not be checked in this session, so the exact track/review/publishing state is unknown.

## Build 7 pre-release gameplay update — 21 October 2026

- The resting/reset die now shows one. Each new roll is random and skips the immediately preceding value, so the computer does not automatically echo the player's last roll.
- A loss deducts points based on the losing roll; a win adds points based on safe sprays, completed rounds, and difficulty.
- A rewarded advert can rewind up to the last four sprays once per game. The undo is granted only after the ad SDK reports an earned reward.
- Reward-ad loading and no-fill failures now provide a retry state instead of silently doing nothing.
- `supabase/migrations/005_result_penalties.sql` remains as the original result schema migration. The follow-up `006_symmetric_result_points.sql` is now applied to the linked Supabase project and updates the result RPC so losses deduct the same gameplay-based amount that wins add.

The revised APK and AAB were rebuilt with version code 7 and the Play upload certificate matching the expected SHA-1. `npx expo lint` passed. The latest APK was not installed on the connected phone as part of this pass, and live AdMob fill cannot be confirmed by a local build; AdMob may return no-fill until its account/app inventory is eligible.

## Score and audio update — source revision after build 7

- The Supabase result RPC now applies positive awards for wins and negative awards for losses, floors the player's point balance at zero, and continues recording wins only for winning games.
- The three supplied MP3 tracks are bundled under `assets/game-music/`. A random track loops at 13% volume during play and pauses when the egg falls.
- On the first roll of each game, the app speaks “Let's roll the dice” in a higher-pitched, slower device TTS voice, then starts the music. The exact voice character depends on the Android text-to-speech engine installed on the phone.
- Expo Speech is added as an SDK 58 compatible native module. `app.json` remains at version `1.0.1`, Android version code `7`, as requested for the rebuilt build 7.
- `npm run lint` passes. APK/AAB packaging is pending because the Play upload signing variables are not present in this shell session.
