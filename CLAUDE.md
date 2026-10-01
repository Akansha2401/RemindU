# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Bun is the package manager (`bun.lock`). Never use npm/yarn — mixed lockfiles cause drift.

```bash
bun install                          # install deps
bun expo start                       # dev server (Expo Go)
bun expo start --dev-client          # dev server for the installed development build
bunx expo install <pkg>              # add a package (SDK-compatible version); prefer over `bun add`
bunx expo lint                       # lint
bunx tsc --noEmit                    # typecheck
bunx expo prebuild --platform android --clean   # regenerate android/ after app.json/plugin/native-dep changes
```

There is no test runner configured yet.

Local Android dev build (APK for a physical device, see `Eas.md`): `bunx expo prebuild --platform android`, then `cd android && ./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a` (arm64 only — won't run on x86 emulators). `android/` and `ios/` are git-ignored generated output.

## Architecture

Expo SDK 57 / React Native 0.86 / React 19, with `typedRoutes` and the React Compiler enabled in `app.json`. Path alias `@/*` → `src/*`.

- **Routing / auth gate** (`src/app/_layout.tsx`): the root `Stack` uses `Stack.Protected` guards driven by `authStore$.isLoggedIn` — `index` (logged-out/welcome) vs. the `(tabs)` group (logged-in). New authenticated screens go under `(tabs)` or another guarded group. `authStore$` (`src/store/auth.store.ts`) is a Legend State observable persisted to expo-sqlite (`src/lib/persist.ts`); it defaults to `isLoggedIn: true` until a login screen exists and follows Supabase `SIGNED_IN`/`SIGNED_OUT` events.
- **Client state**: Legend State v3 beta. Read observables in render with `useValue` (not `use$`/`.get()` — React Compiler is on), and push subscriptions down into small leaf components for fine-grained updates. Shared types live in `src/types/`.
- **Server state**: TanStack Query. The single `QueryClient` lives in the root layout. React Native has no window focus/online events, so the root layout wires them up manually: `useAppState` → `focusManager`, `useOnlineManager` (NetInfo) → `onlineManager`. Per-screen helpers: `useRefreshOnFocus` (refetch when a screen regains focus, skipping the first mount) and `useRefreshByUser` (pull-to-refresh state).
- **Backend**: Supabase client in `src/lib/supabase.ts`. Sessions persist via `expo-sqlite`'s `localStorage` polyfill (`expo-sqlite/localStorage/install`). Config comes from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env` (`EXPO_PUBLIC_*` vars are inlined into the client bundle — never put secret keys there).
- **Styling**: NativeWind v4 (Tailwind 3) via `className`. Entry CSS is `src/global.css` (imported in the root layout, configured in `metro.config.js`). The design system follows react-native-reusables / shadcn conventions (`components.json`): CSS variables in `global.css` + `tailwind.config.js`, the mirrored JS palette and `NAV_THEME` in `src/lib/theme.ts` (keep them in sync), `cn()` in `src/lib/utils.ts`, UI components intended for `@/components/ui`, and `<PortalHost />` mounted in the root layout for portal-based primitives. Dark mode is read from NativeWind's `colorScheme`.

## Git workflow (from README)

- Never commit to `main`. Never work directly on `development` — create a short, lowercase, hyphenated feature branch from the latest `development`, merge `development` back into it and test before merging the feature into `development`.
- Conventional Commits: `<type>(<scope>): <subject>` — imperative, lowercase, no trailing period, ≤50 chars. `style` means code formatting only; visual/UI changes are `feat` or `fix`.
