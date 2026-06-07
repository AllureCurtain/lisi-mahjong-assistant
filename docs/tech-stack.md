# Tech Stack Recommendation

## Recommended Stack

Use TypeScript as the main language, with a React + Vite responsive web app for phone, tablet, and desktop browsers.

Recommended first-version stack:

- Language: TypeScript
- UI: React, responsive CSS grid layouts
- Build tool: Vite
- State model: pure TypeScript modules plus React state
- Persistence: localStorage first, IndexedDB later if needed
- Tests: Vitest
- Package manager: pnpm

## Why TypeScript

The project has two equally important parts:

- A fast touch interface for phone use during a real game.
- A rule-heavy engine for turn tracking, hand validation, recommendations, and scoring.

TypeScript fits both. The UI can run directly in a phone browser, while the rule engine can stay as pure testable TypeScript functions. This avoids building a backend for the first version and keeps the app usable offline on the same local network or as a PWA later.

Use pnpm only for dependency installation, scripts, and lockfile management. Commit `pnpm-lock.yaml`; do not create or commit `package-lock.json`.

## First-Version Architecture

Keep the core logic independent from React:

- `src/domain`: tile types, player state, game state, actions.
- `src/rules`: legal action validation, listening validation, win checks, scoring.
- `src/recommendation`: discard, pong, and kong recommendations.
- `src/state`: reducer-style game state transitions and undo history.
- `src/ui`: React screens and components.

This separation lets us test the Mahjong logic without rendering the UI.

## Deferred Options

Do not use camera recognition in the first version.

If photo input is added later, consider one of these:

- Browser-based recognition using TensorFlow.js or ONNX Runtime Web.
- A small Python/OpenCV service for experimentation.
- A mobile wrapper such as Capacitor if native camera access becomes necessary.

Do not start with Python as the main app language. Python is useful for experiments, but it makes phone-first interaction and deployment harder than a web app.
