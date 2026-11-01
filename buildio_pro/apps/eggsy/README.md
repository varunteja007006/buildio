# eggsy

An Expo (~56) / React Native app backed by Convex, living in the Buildio monorepo (pnpm + Turborepo) at `apps/eggsy`.

## Get started

Dependencies are workspace-managed — install from the **monorepo root** (`buildio_pro/`), not from inside this folder:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm --filter=eggsy start
```

Run focused checks from the monorepo root:

```bash
pnpm --filter=eggsy typecheck
pnpm --filter=eggsy lint
```

App code lives in `src/app` and uses [file-based routing](https://docs.expo.dev/router/introduction) via `expo-router`.

## Building & installing the APK

### Build

Run `build-apk.sh` from the project root, choosing an environment:

```bash
./build-apk.sh dev    # uses .env.local  → eggsy.dev.apk
./build-apk.sh prod   # uses .env.production → eggsy.prod.apk
```

Notes:
- Env files (`.env.local` / `.env.production`) are gitignored — create them from `.env.example` (which documents the keys) before running `build-apk.sh`.
- `prod` builds **deploy the Convex backend first** (`npx convex deploy` to the production deployment), so the APK ships with the latest functions/schema. Dev builds skip this — they talk to the local dev server.
- The env file is baked into the JS bundle (`EXPO_PUBLIC_CONVEX_URL`, ...), so a rebuild is required to switch environments.
- The `gradlew` daemon is stopped before building so the new env vars aren't frozen out by a stale daemon.
- Output APK lands in the repo root as `eggsy.<mode>.apk`.

### Install

Plug in your phone with USB debugging enabled ([enable it in Developer Options](https://developer.android.com/studio/run/device#developer-device-options)), then:

```bash
adb devices          # confirm the phone is listed (not "unauthorized")
adb install eggsy.prod.apk
```

Useful flags:
- `-r` reinstall and keep app data: `adb install -r eggsy.prod.apk`
- `-d` allow downgrade (pair with `-r`): `adb install -rd eggsy.prod.apk`
- `-g` grant all runtime permissions at install time

If `adb devices` shows `unauthorized`, accept the RSA debug prompt on your phone.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
