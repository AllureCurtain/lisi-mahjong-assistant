# Lisi Mahjong Assistant

Mobile-first assistant for the family three-player Taiyuan Lisi Mahjong rule set.

## Stack

- TypeScript
- React
- Vite
- Vitest

## Local Development

```powershell
pnpm install
pnpm dev
```

Open the printed local URL on the computer, or open the LAN URL on a phone connected to the same network.

## Verification

```powershell
pnpm test
pnpm build
```

## First-Version Scope

- Three-player counterclockwise turn tracking.
- Manual tile keypad.
- User standing tile tracking.
- Listening validation and locked-hand behavior.
- Standard and dragon hand checks.
- Family scoring rules.
- Discard, pong, and kong recommendations.
- Undo for recorded actions.
- Recent game persistence in `localStorage`.

## Rules Source

See `docs/design.md`.
