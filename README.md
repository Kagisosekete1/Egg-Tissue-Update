# Egg & Wet Tissue — Native React Native

Android package: `com.semogrouptech.eggtissue`. Screens use native React Native views; the game uses React Three Fiber and Expo GL.

## Restored game

The hand, pink sprayer, water particles, wet tissue, sagging and tearing, egg expressions, shell fragments, splat, and confetti are ported directly from the supplied original HTML. `tools/restore-original-scene.cjs` retains that source. `tools/restore-original-audio.py` renders its original Web Audio effects to native WAV assets. No WebView is used.

Home, play, leaderboard, profile, authentication, and settings are separate screens. Opponent, difficulty, and game style are configured in Settings. The supplied logo remains the app icon and splash image. Screens respect the phone status bar.

Profiles support a square photo, username, and searchable country selection. Profile changes are shared across Home, the game, profiles, and the leaderboard. Existing Supabase accounts, photos, and category win totals are retained.

## Scoring and data

The complete schema is `supabase/all-tables.sql`; SQL is not a page inside the app. Migrations 001, 002, and 003 are included. Migration 003 was applied to the connected project and imports legacy wins without overwriting subsequent native results.

A completed round awards:

`floor((min(60, safe sprays × 2) + min(20, completed rounds × 2) + (win ? 20 : 0)) × difficulty)`

Difficulty multipliers: Easy 1, Normal 1.5, Hard 2. The server records each game ID once. Unsynced results are queued on the device. Earlier legacy wins retain their prior 10-point value.

## Reward adverts

The game screen always includes the reward control. A completed rewarded advert repairs up to the last four sprays, retaining the current turn. Another advert can be watched after further sprays. No reward is granted when an advert is skipped or fails.

The Android AdMob App ID is `ca-app-pub-3333777272750017~7598669780` and the production rewarded unit is `ca-app-pub-3333777272750017/5128419119`, both supplied by the owner. Google test ads were used to check the earned-reward flow; `EXPO_PUBLIC_ADMOB_TEST_ADS=1` selects that diagnostic mode and suppresses score submissions. The delivered main build uses the supplied production App ID and rewarded unit. Ad availability depends on AdMob's response.

## Build

Install dependencies with `npm ci` and use Expo-compatible package versions. On this Windows machine, CMake needs short paths. Builds are staged in `C:\rnapp`, with dependencies at `C:\nm`; the source of record remains this folder.

From `C:\rnapp\android`, with the supplied native CMake workaround and arm64 library prepared:

```powershell
.\gradlew.bat --no-daemon --max-workers=2 -PreactNativeArchitectures=arm64-v8a -I C:\rnapp\skip-expo-native.gradle app:assembleRelease app:bundleRelease
```

The sibling `artifacts` directory contains the APK and AAB for the connected arm64 Android phone. This review build is signed with the existing Android debug keystore. A private upload key is needed for a Google Play release.
