# Glitch Life

*Build habits. Track progress. Become better.*

A minimal, blue-themed self-improvement app for iOS and Android built with **Expo SDK 58, React Native, TypeScript (strict) and Expo Router**. Four tabs — **Today, Habits, Goals, You** — plus a simple **Focus Timer**.

There is **no app blocking** of any kind: no accessibility, usage-access or Screen Time permissions. The only optional permission is local notifications.

## Run it

```bash
npm install
npx expo start          # then press `a` (Android) or `i` (iOS), or scan the QR in Expo Go
npm run android         # Android emulator / device
npm run ios             # iOS simulator (macOS only)
```

* Quick try-out: install **Expo Go** on a phone and scan the QR code.
* Local notifications and background behaviour are most reliable in a **development build** (`npx expo run:android` / `npx expo run:ios`, or EAS Build).
* No database to set up and **no environment variables are required** — all data lives on the device.

```bash
npm test             # unit tests (jest-expo)
npm run typecheck    # tsc --noEmit (strict)
```

## What works

| Area | Details |
| --- | --- |
| Today | Time-of-day greeting, date, progress ring + `done/total`, one-tap habit toggles, weekly strip, focus shortcut, active-goal summary, empty state. |
| Habits | Create / edit / delete; icon, optional color, daily or selected days, optional target, start date. Per-habit history calendar (tap a past day to correct it), current + longest streak, 7/30-day rates. Weekly and monthly charts are computed from stored completions. |
| Goals | Measurable target (e.g. 12/30 sessions), milestones that are reached automatically, manual +1/+5 progress, linked habits (each completion = +1), target date, “next step” text, complete / reopen, active & completed lists. |
| You | Profile (name, avatar color), personal stats, daily reminder (real local notification), focus alerts, haptics, week start (Mon/Sun), JSON data export via the share sheet, delete-all-data. |
| Focus Timer | 15/25/45/60/90 + custom, task name, link to habit/goal, start/pause/resume/reset, ring + large countdown, completion screen, session history and totals. |
| Onboarding | 3 optional steps (areas, main goal, suggested habits); skippable; leads to the first-habit prompt. |

### Languages & themes
* **Languages:** English 🇬🇧, Français 🇫🇷, العربية 🇲🇦 (Arabic is fully right-to-left). Pick one in **You → Language** (or on the first onboarding screen). The first launch follows the device language when supported.
* **Themes:** Light, Dark or System default, in **You → Appearance → Theme**. Dark keeps the original navy brand palette; Light uses clean blue-white surfaces. All text/background pairs are tested for WCAG AA contrast.
* Both choices apply instantly (no restart) and are stored locally under their own AsyncStorage key (`glitchlife.settings`), separate from app data.
* **Adding/editing text:** edit `src/i18n/en.ts` (source of truth, typed keys), then `fr.ts` / `ar.ts` — TypeScript and `__tests__/i18n.test.ts` fail if a key, placeholder or Arabic plural form is missing. Plural forms use `key_one` / `key_other` (+ `_zero/_two/_few/_many` for Arabic).
* **RTL:** mirroring is done by the app (`src/i18n/layout.ts`, `useI18n().row/icon/textAlign`), not `I18nManager.forceRTL`, which only applies after a restart. Digits stay Western (0-9), as is usual in Morocco; month names use the Moroccan forms.

### Focus timer accuracy
Timer state (`status`, `accumulatedMs`, `runningSince`, …) is persisted. Remaining time is always **derived from timestamps**, never from tick counts, so backgrounding or killing the app doesn’t drift. When the app returns (or relaunches) a finished timer is saved with its true end time. A local notification is scheduled for the end time; if permission is denied the timer still works.

## Architecture

```
app/                    Expo Router screens (tabs + pushed screens)
src/domain/             Pure logic: dates, streaks, charts data, goals, timer, entitlements
src/data/               Schema/migration, reducer, AsyncStorage persistence, React store
src/services/           Notifications, haptics
src/components/         Reusable UI (ui, charts, habit, goal, DateField)
src/theme/              Light/dark palettes, spacing, typography
src/i18n/               Translations (en/fr/ar), plural rules, RTL helpers
src/settings/           Language + theme provider and persistence
__tests__/              Unit tests for the domain + reducer
```

* **Storage:** one versioned JSON document in `@react-native-async-storage/async-storage`, written after every change (serialized). Records have `id` + timestamps; completions are a separate collection, unique per habit+date (enforced in the reducer and on load). Unreadable data is backed up and replaced, never crashes the app. Add a migration step in `src/data/schema.ts` when `SCHEMA_VERSION` changes.
* **Days & time zones:** a day is a local `YYYY-MM-DD` key; date math is done in UTC so DST never shifts a date. “Today” refreshes at midnight and when the app resumes. Past records keep their stored date if the device time zone changes.
* **Charts:** custom responsive SVG charts (`react-native-svg`) in the app’s palette.
* **Monetization-ready:** `src/domain/entitlements.ts` defines free-tier limits behind `ENFORCE_LIMITS = false`. There is no paywall or fake purchase UI; real billing (e.g. RevenueCat / StoreKit / Play Billing with server-side verification and restore) still has to be integrated.

## Needs extra setup / not included

* **Cloud sync & authentication** (Supabase) are not implemented; the app is fully local. If added, enable Row Level Security so every row is scoped to `auth.uid()` and keep keys in `EXPO_PUBLIC_*` env vars (anon key only — never a service key).
* **Billing** is not implemented (see above).
* **Splash image** (`assets/splash-icon.png`) is still the Expo template image; replace it before release. The app icon is in `assets/images/`.
* Notifications on Android 13+/iOS prompt for permission the first time a timer or reminder needs it.
* Bundle identifiers are `com.glitchlife.app`; change in `app.json` before publishing.
