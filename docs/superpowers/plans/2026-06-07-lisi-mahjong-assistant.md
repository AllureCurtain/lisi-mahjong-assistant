# Lisi Mahjong Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working version of a three-player Taiyuan Lisi Mahjong assistant with automatic turn tracking, legal-action validation, discard/pong/kong recommendations, listening handling, and family-rule scoring.

**Architecture:** Use a React shell for the mobile touch interface and keep all Mahjong logic in pure TypeScript modules. The reducer owns game state transitions and undo history; rule, scoring, and recommendation modules are separately testable with Vitest.

**Tech Stack:** TypeScript, React, Vite, Vitest, Testing Library, pnpm.

---

## Source Documents

- Product and rules spec: `docs/design.md`
- Technical stack note: `docs/tech-stack.md`
- Detailed technical solution: `docs/technical-solution.md`

## File Structure

- `package.json`: package scripts, pnpm package manager declaration, and dependencies.
- `index.html`: Vite HTML entry.
- `tsconfig.json`, `tsconfig.node.json`: TypeScript configuration.
- `vite.config.ts`: Vite React configuration.
- `vitest.config.ts`: Vitest jsdom configuration.
- `src/main.tsx`: React entry.
- `src/App.tsx`: top-level app composition.
- `src/index.css`: responsive phone, tablet, and desktop styles.
- `src/domain/tile.ts`: tile model, tile keys, counts, suit helpers.
- `src/domain/meld.ts`: meld model.
- `src/domain/player.ts`: player state model and helpers.
- `src/domain/game.ts`: game state, phases, and action types.
- `src/domain/index.ts`: domain exports.
- `src/rules/handEvaluator.ts`: standard and dragon hand completion checks.
- `src/rules/lisiRules.ts`: Lisi-specific legal checks, missing-suit checks, listening checks.
- `src/scoring/scoring.ts`: base win and kong bonus settlement.
- `src/state/reducer.ts`: state transitions, turn progression, undo.
- `src/recommendation/recommend.ts`: discard and call recommendations.
- `src/ui/TileButton.tsx`: stable tile button.
- `src/ui/TileKeypad.tsx`: wan/tiao/bing keypad.
- `src/ui/PlayerStatus.tsx`: current actor, dealer, listening state.
- `src/ui/ReactionStrip.tsx`: no-call, pong, kong, win controls.
- `src/ui/RecommendationPanel.tsx`: recommendation display.
- `src/test/setup.ts`: Testing Library setup.
- `src/**/*.test.ts`, `src/**/*.test.tsx`: focused tests beside code.
- `README.md`: local run and first-version scope.

---

## Task 1: Project Scaffold And Tooling

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/test/setup.ts`
- Create: `README.md`

- [ ] **Step 1: Initialize git for the project directory**

Run:

```powershell
Set-Location D:\Study\cc\lisi-mahjong-assistant
git init
```

Expected: `.git` is created in `D:\Study\cc\lisi-mahjong-assistant`.

- [ ] **Step 2: Create `package.json`**

Create `package.json` with:

```json
{
  "name": "lisi-mahjong-assistant",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.6.2",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc -b --pretty false"
  },
  "dependencies": {
    "react": "^19.2.7",
    "react-dom": "^19.2.7"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@vitejs/plugin-react": "^6.0.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "jsdom": "^29.1.1",
    "typescript": "^6.0.3",
    "vite": "^8.0.16",
    "vitest": "^4.1.8"
  }
}
```

- [ ] **Step 3: Create TypeScript and Vite configuration**

Create `tsconfig.json` with:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.app.json" }
  ]
}
```

Create `tsconfig.app.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

Create `tsconfig.node.json` with:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

Create `vite.config.ts` with:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
});
```

Create `vitest.config.ts` with:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Create minimal React entry**

Create `index.html` with:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>立四麻将助手</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx` with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/App.tsx` with:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>立四麻将助手</h1>
      <p>第一版：规则引擎、回合状态机和快速点牌界面。</p>
    </main>
  );
}
```

Create `src/index.css` with:

```css
:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #18212f;
  background: #f7f7f4;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 16px;
  max-width: 1440px;
  margin: 0 auto;
}
```

Create `src/test/setup.ts` with:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Install dependencies**

Run:

```powershell
pnpm install
```

Expected: `node_modules` and `pnpm-lock.yaml` are created.

- [ ] **Step 6: Verify scaffold**

Run:

```powershell
pnpm test
pnpm build
```

Expected: Vitest reports no failing tests, and Vite build completes.

- [ ] **Step 7: Commit scaffold**

Run:

```powershell
git add .
git commit -m "chore: scaffold lisi mahjong assistant"
```

Expected: commit succeeds.

---

## Task 2: Tile Domain And Count Utilities

**Files:**
- Create: `src/domain/tile.ts`
- Create: `src/domain/index.ts`
- Test: `src/domain/tile.test.ts`

- [ ] **Step 1: Write failing tile utility tests**

Create `src/domain/tile.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import {
  ALL_TILES,
  countTiles,
  makeTile,
  remainingCopies,
  sameTile,
  tileKey,
  tilesFromKeys,
} from './tile';

describe('tile utilities', () => {
  it('creates stable keys and compares tiles', () => {
    const oneWan = makeTile('wan', 1);
    expect(tileKey(oneWan)).toBe('wan-1');
    expect(sameTile(oneWan, makeTile('wan', 1))).toBe(true);
    expect(sameTile(oneWan, makeTile('tiao', 1))).toBe(false);
  });

  it('counts tiles by key', () => {
    const counts = countTiles(tilesFromKeys(['wan-1', 'wan-1', 'bing-9']));
    expect(counts['wan-1']).toBe(2);
    expect(counts['bing-9']).toBe(1);
    expect(counts['tiao-1']).toBeUndefined();
  });

  it('reports remaining known copies from a 4-copy tile set', () => {
    const seen = countTiles(tilesFromKeys(['tiao-3', 'tiao-3', 'tiao-3']));
    expect(remainingCopies(makeTile('tiao', 3), seen)).toBe(1);
    expect(remainingCopies(makeTile('bing', 5), seen)).toBe(4);
  });

  it('contains exactly 27 tile faces for three suits', () => {
    expect(ALL_TILES).toHaveLength(27);
    expect(ALL_TILES[0]).toEqual({ suit: 'wan', rank: 1 });
    expect(ALL_TILES[26]).toEqual({ suit: 'bing', rank: 9 });
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm test -- src/domain/tile.test.ts
```

Expected: FAIL because `src/domain/tile.ts` does not exist.

- [ ] **Step 3: Implement tile utilities**

Create `src/domain/tile.ts` with:

```ts
export type Suit = 'wan' | 'tiao' | 'bing';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Tile {
  suit: Suit;
  rank: Rank;
}

export type TileKey = `${Suit}-${Rank}`;
export type TileCounts = Partial<Record<TileKey, number>>;

export const SUITS: Suit[] = ['wan', 'tiao', 'bing'];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const ALL_TILES: Tile[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => ({ suit, rank })),
);

export function makeTile(suit: Suit, rank: Rank): Tile {
  return { suit, rank };
}

export function tileKey(tile: Tile): TileKey {
  return `${tile.suit}-${tile.rank}` as TileKey;
}

export function parseTileKey(key: TileKey): Tile {
  const [suit, rawRank] = key.split('-');
  return makeTile(suit as Suit, Number(rawRank) as Rank);
}

export function sameTile(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function countTiles(tiles: Tile[]): TileCounts {
  return tiles.reduce<TileCounts>((counts, tile) => {
    const key = tileKey(tile);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

export function addCount(counts: TileCounts, tile: Tile, delta: number): TileCounts {
  const key = tileKey(tile);
  const next = { ...counts };
  const value = (next[key] ?? 0) + delta;
  if (value <= 0) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return next;
}

export function tileCount(counts: TileCounts, tile: Tile): number {
  return counts[tileKey(tile)] ?? 0;
}

export function remainingCopies(tile: Tile, seenCounts: TileCounts): number {
  return Math.max(0, 4 - tileCount(seenCounts, tile));
}

export function tilesFromKeys(keys: TileKey[]): Tile[] {
  return keys.map(parseTileKey);
}

export function keysFromTiles(tiles: Tile[]): TileKey[] {
  return tiles.map(tileKey);
}
```

Create `src/domain/index.ts` with:

```ts
export * from './tile';
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```powershell
pnpm test -- src/domain/tile.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit tile domain**

Run:

```powershell
git add src/domain
git commit -m "feat: add tile domain utilities"
```

Expected: commit succeeds.

---

## Task 3: Player, Meld, Game State Models

**Files:**
- Create: `src/domain/meld.ts`
- Create: `src/domain/player.ts`
- Create: `src/domain/game.ts`
- Modify: `src/domain/index.ts`
- Test: `src/domain/game.test.ts`

- [ ] **Step 1: Write failing state model tests**

Create `src/domain/game.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { createInitialGame, createPlayer, tilesFromKeys } from './index';

describe('game state model', () => {
  it('creates three seats and marks dealer and user', () => {
    const game = createInitialGame({ userSeat: 'A', dealerSeat: 'B' });
    expect(game.players).toHaveLength(3);
    expect(game.currentActor).toBe('B');
    expect(game.players.find((player) => player.seat === 'A')?.isUser).toBe(true);
    expect(game.players.find((player) => player.seat === 'B')?.isDealer).toBe(true);
  });

  it('stores user standing tiles separately from concealed tiles', () => {
    const player = createPlayer({
      seat: 'A',
      isUser: true,
      isDealer: false,
      concealedTiles: tilesFromKeys(['wan-1', 'wan-2', 'wan-3']),
      standingTiles: tilesFromKeys(['tiao-1', 'tiao-2']),
    });
    expect(player.concealedTiles.map((tile) => `${tile.suit}-${tile.rank}`)).toEqual([
      'wan-1',
      'wan-2',
      'wan-3',
    ]);
    expect(player.standingTiles.map((tile) => `${tile.suit}-${tile.rank}`)).toEqual([
      'tiao-1',
      'tiao-2',
    ]);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm test -- src/domain/game.test.ts
```

Expected: FAIL because state model files do not exist.

- [ ] **Step 3: Implement state models**

Create `src/domain/meld.ts` with:

```ts
import type { Tile } from './tile';

export type MeldType = 'pong' | 'exposed-kong' | 'concealed-kong' | 'added-kong';

export interface Meld {
  type: MeldType;
  tile: Tile;
  fromSeat?: Seat;
}

export type Seat = 'A' | 'B' | 'C';

export const SEATS: Seat[] = ['A', 'B', 'C'];
```

Create `src/domain/player.ts` with:

```ts
import type { Meld, Seat } from './meld';
import type { Tile } from './tile';

export interface PlayerState {
  seat: Seat;
  isUser: boolean;
  isDealer: boolean;
  hasDeclaredListening: boolean;
  lockedAfterListening: boolean;
  concealedTiles: Tile[];
  standingTiles: Tile[];
  faceDownListeningDiscard?: Tile;
  melds: Meld[];
  discards: Tile[];
  exposedKongCount: number;
  concealedKongCount: number;
}

export interface CreatePlayerInput {
  seat: Seat;
  isUser: boolean;
  isDealer: boolean;
  concealedTiles?: Tile[];
  standingTiles?: Tile[];
}

export function createPlayer(input: CreatePlayerInput): PlayerState {
  return {
    seat: input.seat,
    isUser: input.isUser,
    isDealer: input.isDealer,
    hasDeclaredListening: false,
    lockedAfterListening: false,
    concealedTiles: input.concealedTiles ?? [],
    standingTiles: input.standingTiles ?? [],
    melds: [],
    discards: [],
    exposedKongCount: 0,
    concealedKongCount: 0,
  };
}
```

Create `src/domain/game.ts` with:

```ts
import { SEATS, type Seat } from './meld';
import { createPlayer, type PlayerState } from './player';
import type { Tile } from './tile';

export type GamePhase =
  | 'setup'
  | 'waiting-visible-discard'
  | 'waiting-user-draw'
  | 'reaction'
  | 'waiting-tail-draw-discard'
  | 'user-discard-choice'
  | 'settlement';

export interface LastDiscard {
  tile: Tile;
  bySeat: Seat;
}

export interface GameState {
  players: PlayerState[];
  currentActor: Seat;
  direction: 'counterclockwise';
  phase: GamePhase;
  lastDiscard?: LastDiscard;
  actionHistory: GameState[];
}

export interface CreateInitialGameInput {
  userSeat: Seat;
  dealerSeat: Seat;
}

export function createInitialGame(input: CreateInitialGameInput): GameState {
  const players = SEATS.map((seat) =>
    createPlayer({
      seat,
      isUser: seat === input.userSeat,
      isDealer: seat === input.dealerSeat,
    }),
  );
  return {
    players,
    currentActor: input.dealerSeat,
    direction: 'counterclockwise',
    phase: 'setup',
    actionHistory: [],
  };
}

export function getPlayer(game: GameState, seat: Seat): PlayerState {
  const player = game.players.find((candidate) => candidate.seat === seat);
  if (!player) {
    throw new Error(`Unknown seat: ${seat}`);
  }
  return player;
}

export function updatePlayer(
  game: GameState,
  seat: Seat,
  updater: (player: PlayerState) => PlayerState,
): GameState {
  return {
    ...game,
    players: game.players.map((player) => (player.seat === seat ? updater(player) : player)),
  };
}
```

Modify `src/domain/index.ts` to:

```ts
export * from './tile';
export * from './meld';
export * from './player';
export * from './game';
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```powershell
pnpm test -- src/domain/game.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit state models**

Run:

```powershell
git add src/domain
git commit -m "feat: model lisi mahjong game state"
```

Expected: commit succeeds.

---

## Task 4: Standard And Dragon Hand Evaluators

**Files:**
- Create: `src/rules/handEvaluator.ts`
- Test: `src/rules/handEvaluator.test.ts`

- [ ] **Step 1: Write failing hand evaluator tests**

Create `src/rules/handEvaluator.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { countTiles, tilesFromKeys } from '../domain';
import {
  isCompleteDragonHand,
  isCompleteStandardHand,
  winningTilesForHand,
} from './handEvaluator';

describe('hand evaluators', () => {
  it('recognizes a standard 4 groups plus 1 pair hand', () => {
    const counts = countTiles(
      tilesFromKeys([
        'wan-1', 'wan-2', 'wan-3',
        'wan-4', 'wan-5', 'wan-6',
        'tiao-2', 'tiao-3', 'tiao-4',
        'bing-7', 'bing-7', 'bing-7',
        'tiao-9', 'tiao-9',
      ]),
    );
    expect(isCompleteStandardHand(counts, 0)).toBe(true);
  });

  it('uses existing meld groups when checking a standard hand', () => {
    const counts = countTiles(
      tilesFromKeys([
        'wan-1', 'wan-2', 'wan-3',
        'tiao-4', 'tiao-5', 'tiao-6',
        'bing-9', 'bing-9',
      ]),
    );
    expect(isCompleteStandardHand(counts, 2)).toBe(true);
  });

  it('recognizes a concealed dragon route plus one group and one pair', () => {
    const counts = countTiles(
      tilesFromKeys([
        'tiao-1', 'tiao-2', 'tiao-3', 'tiao-4', 'tiao-5', 'tiao-6', 'tiao-7', 'tiao-8', 'tiao-9',
        'wan-5', 'wan-5', 'wan-5',
        'bing-2', 'bing-2',
      ]),
    );
    expect(isCompleteDragonHand(counts, 0)).toBe(true);
  });

  it('finds winning tiles for a one-away hand', () => {
    const counts = countTiles(
      tilesFromKeys([
        'wan-1', 'wan-2', 'wan-3',
        'wan-4', 'wan-5', 'wan-6',
        'tiao-2', 'tiao-3', 'tiao-4',
        'bing-7', 'bing-7', 'bing-7',
        'tiao-9',
      ]),
    );
    expect(winningTilesForHand(counts, 0).map((tile) => `${tile.suit}-${tile.rank}`)).toContain(
      'tiao-9',
    );
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm test -- src/rules/handEvaluator.test.ts
```

Expected: FAIL because `handEvaluator.ts` does not exist.

- [ ] **Step 3: Implement hand evaluator**

Create `src/rules/handEvaluator.ts` with:

```ts
import {
  ALL_TILES,
  RANKS,
  SUITS,
  addCount,
  parseTileKey,
  tileCount,
  tileKey,
  type Suit,
  type Tile,
  type TileCounts,
  type TileKey,
} from '../domain';

function cloneCounts(counts: TileCounts): TileCounts {
  return { ...counts };
}

function totalTiles(counts: TileCounts): number {
  return Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
}

function removeTiles(counts: TileCounts, keys: TileKey[]): TileCounts | undefined {
  let next = cloneCounts(counts);
  for (const key of keys) {
    const tile = parseTileKey(key);
    if (tileCount(next, tile) <= 0) {
      return undefined;
    }
    next = addCount(next, tile, -1);
  }
  return next;
}

function firstNonZeroKey(counts: TileCounts): TileKey | undefined {
  return (Object.keys(counts) as TileKey[]).find((key) => (counts[key] ?? 0) > 0);
}

function canFormGroups(counts: TileCounts, groupCount: number): boolean {
  if (groupCount === 0) {
    return totalTiles(counts) === 0;
  }

  const firstKey = firstNonZeroKey(counts);
  if (!firstKey) {
    return false;
  }

  const firstTile = parseTileKey(firstKey);

  if (tileCount(counts, firstTile) >= 3) {
    const afterTriplet = removeTiles(counts, [firstKey, firstKey, firstKey]);
    if (afterTriplet && canFormGroups(afterTriplet, groupCount - 1)) {
      return true;
    }
  }

  if (firstTile.rank <= 7) {
    const secondKey = tileKey({ suit: firstTile.suit, rank: (firstTile.rank + 1) as typeof firstTile.rank });
    const thirdKey = tileKey({ suit: firstTile.suit, rank: (firstTile.rank + 2) as typeof firstTile.rank });
    const afterSequence = removeTiles(counts, [firstKey, secondKey, thirdKey]);
    if (afterSequence && canFormGroups(afterSequence, groupCount - 1)) {
      return true;
    }
  }

  return false;
}

export function isCompleteStandardHand(counts: TileCounts, meldGroupCount: number): boolean {
  const concealedTileCount = totalTiles(counts);
  const neededGroups = 4 - meldGroupCount;
  if (neededGroups < 0 || concealedTileCount !== neededGroups * 3 + 2) {
    return false;
  }

  for (const tile of ALL_TILES) {
    if (tileCount(counts, tile) >= 2) {
      const pairKey = tileKey(tile);
      const withoutPair = removeTiles(counts, [pairKey, pairKey]);
      if (withoutPair && canFormGroups(withoutPair, neededGroups)) {
        return true;
      }
    }
  }

  return false;
}

function removeDragon(counts: TileCounts, suit: Suit): TileCounts | undefined {
  const dragonKeys = RANKS.map((rank) => tileKey({ suit, rank }));
  return removeTiles(counts, dragonKeys);
}

export function isCompleteDragonHand(counts: TileCounts, meldGroupCount: number): boolean {
  const neededGroupsAfterDragon = 1 - meldGroupCount;
  if (neededGroupsAfterDragon < 0) {
    return false;
  }

  for (const suit of SUITS) {
    const withoutDragon = removeDragon(counts, suit);
    if (!withoutDragon) {
      continue;
    }
    if (isCompleteStandardHand(withoutDragon, 3 + meldGroupCount)) {
      return true;
    }
  }

  return false;
}

export function isWinningShape(counts: TileCounts, meldGroupCount: number): boolean {
  return isCompleteStandardHand(counts, meldGroupCount) || isCompleteDragonHand(counts, meldGroupCount);
}

export function winningTilesForHand(counts: TileCounts, meldGroupCount: number): Tile[] {
  return ALL_TILES.filter((tile) => {
    if (tileCount(counts, tile) >= 4) {
      return false;
    }
    return isWinningShape(addCount(counts, tile, 1), meldGroupCount);
  });
}
```

- [ ] **Step 4: Run tests and fix type narrowing if needed**

Run:

```powershell
pnpm test -- src/rules/handEvaluator.test.ts
pnpm lint
```

Expected: PASS for tests and typecheck.

If TypeScript rejects rank arithmetic casts, replace the sequence branch in `canFormGroups` with:

```ts
  if (firstTile.rank <= 7) {
    const secondRank = (firstTile.rank + 1) as 2 | 3 | 4 | 5 | 6 | 7 | 8;
    const thirdRank = (firstTile.rank + 2) as 3 | 4 | 5 | 6 | 7 | 8 | 9;
    const secondKey = tileKey({ suit: firstTile.suit, rank: secondRank });
    const thirdKey = tileKey({ suit: firstTile.suit, rank: thirdRank });
    const afterSequence = removeTiles(counts, [firstKey, secondKey, thirdKey]);
    if (afterSequence && canFormGroups(afterSequence, groupCount - 1)) {
      return true;
    }
  }
```

- [ ] **Step 5: Commit hand evaluator**

Run:

```powershell
git add src/rules
git commit -m "feat: evaluate standard and dragon hands"
```

Expected: commit succeeds.

---

## Task 5: Lisi Legal Checks And Listening Validator

**Files:**
- Create: `src/rules/lisiRules.ts`
- Test: `src/rules/lisiRules.test.ts`

- [ ] **Step 1: Write failing Lisi rule tests**

Create `src/rules/lisiRules.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { countTiles, tilesFromKeys } from '../domain';
import {
  canDeclareListeningByStandingDiscard,
  hasExactlyTwoSuits,
  isLegalLisiWin,
  normalDiscardCandidates,
} from './lisiRules';

describe('lisi rules', () => {
  it('requires exactly two suits including meld suits', () => {
    expect(hasExactlyTwoSuits(tilesFromKeys(['wan-1', 'wan-2']), [])).toBe(false);
    expect(hasExactlyTwoSuits(tilesFromKeys(['wan-1', 'tiao-2']), [])).toBe(true);
    expect(hasExactlyTwoSuits(tilesFromKeys(['wan-1', 'tiao-2', 'bing-3']), [])).toBe(false);
    expect(
      hasExactlyTwoSuits(tilesFromKeys(['wan-1']), [{ type: 'pong', tile: { suit: 'bing', rank: 5 } }]),
    ).toBe(true);
  });

  it('excludes standing tiles from normal discard candidates', () => {
    const candidates = normalDiscardCandidates(
      tilesFromKeys(['wan-1', 'wan-2', 'tiao-3']),
      tilesFromKeys(['wan-2']),
    );
    expect(candidates.map((tile) => `${tile.suit}-${tile.rank}`)).toEqual(['wan-1', 'tiao-3']);
  });

  it('rejects winning before listening', () => {
    const counts = countTiles(
      tilesFromKeys([
        'wan-1', 'wan-2', 'wan-3',
        'wan-4', 'wan-5', 'wan-6',
        'tiao-2', 'tiao-3', 'tiao-4',
        'tiao-7', 'tiao-7', 'tiao-7',
        'wan-9', 'wan-9',
      ]),
    );
    expect(isLegalLisiWin({ counts, melds: [], hasDeclaredListening: false })).toBe(false);
  });

  it('accepts legal listened two-suit standard win', () => {
    const counts = countTiles(
      tilesFromKeys([
        'wan-1', 'wan-2', 'wan-3',
        'wan-4', 'wan-5', 'wan-6',
        'tiao-2', 'tiao-3', 'tiao-4',
        'tiao-7', 'tiao-7', 'tiao-7',
        'wan-9', 'wan-9',
      ]),
    );
    expect(isLegalLisiWin({ counts, melds: [], hasDeclaredListening: true })).toBe(true);
  });

  it('finds legal standing tile choices for listening', () => {
    const concealed = tilesFromKeys([
      'bing-1',
      'wan-1', 'wan-2', 'wan-3',
      'wan-4', 'wan-5', 'wan-6',
      'tiao-2', 'tiao-3', 'tiao-4',
      'tiao-7', 'tiao-7', 'tiao-7',
      'wan-9',
    ]);
    const standing = tilesFromKeys(['bing-1']);
    const choices = canDeclareListeningByStandingDiscard({ concealed, standing, melds: [] });
    expect(choices).toHaveLength(1);
    expect(choices[0].discardKey).toBe('bing-1');
    expect(choices[0].winningKeys).toContain('wan-9');
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm test -- src/rules/lisiRules.test.ts
```

Expected: FAIL because `lisiRules.ts` does not exist.

- [ ] **Step 3: Implement Lisi rules**

Create `src/rules/lisiRules.ts` with:

```ts
import {
  countTiles,
  keysFromTiles,
  tileKey,
  type Meld,
  type Suit,
  type Tile,
  type TileCounts,
  type TileKey,
} from '../domain';
import { isWinningShape, winningTilesForHand } from './handEvaluator';

export interface ListeningChoice {
  discardKey: TileKey;
  winningKeys: TileKey[];
}

export function meldGroupCount(melds: Meld[]): number {
  return melds.length;
}

export function suitSet(tiles: Tile[], melds: Meld[]): Set<Suit> {
  return new Set<Suit>([
    ...tiles.map((tile) => tile.suit),
    ...melds.map((meld) => meld.tile.suit),
  ]);
}

export function hasExactlyTwoSuits(tiles: Tile[], melds: Meld[]): boolean {
  return suitSet(tiles, melds).size === 2;
}

export function normalDiscardCandidates(concealed: Tile[], standing: Tile[]): Tile[] {
  const standingKeys = new Set(keysFromTiles(standing));
  return concealed.filter((tile) => !standingKeys.has(tileKey(tile)));
}

export interface LegalWinInput {
  counts: TileCounts;
  melds: Meld[];
  hasDeclaredListening: boolean;
}

export function isLegalLisiWin(input: LegalWinInput): boolean {
  if (!input.hasDeclaredListening) {
    return false;
  }
  const tiles = Object.entries(input.counts).flatMap(([key, count]) => {
    const [suit, rank] = key.split('-');
    return Array.from({ length: count ?? 0 }, () => ({
      suit: suit as Suit,
      rank: Number(rank) as Tile['rank'],
    }));
  });
  if (!hasExactlyTwoSuits(tiles, input.melds)) {
    return false;
  }
  return isWinningShape(input.counts, meldGroupCount(input.melds));
}

export interface ListeningInput {
  concealed: Tile[];
  standing: Tile[];
  melds: Meld[];
}

export function canDeclareListeningByStandingDiscard(input: ListeningInput): ListeningChoice[] {
  if (input.standing.length === 0) {
    return [];
  }

  const choices: ListeningChoice[] = [];
  for (const standingTile of input.standing) {
    const discardKey = tileKey(standingTile);
    let removed = false;
    const remaining = input.concealed.filter((tile) => {
      if (!removed && tileKey(tile) === discardKey) {
        removed = true;
        return false;
      }
      return true;
    });

    if (!removed || !hasExactlyTwoSuits(remaining, input.melds)) {
      continue;
    }

    const winningKeys = winningTilesForHand(countTiles(remaining), meldGroupCount(input.melds)).map(tileKey);
    if (winningKeys.length > 0) {
      choices.push({ discardKey, winningKeys });
    }
  }

  return choices;
}
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```powershell
pnpm test -- src/rules/lisiRules.test.ts src/rules/handEvaluator.test.ts
pnpm lint
```

Expected: PASS for tests and typecheck.

- [ ] **Step 5: Commit Lisi rules**

Run:

```powershell
git add src/rules
git commit -m "feat: validate lisi listening and winning rules"
```

Expected: commit succeeds.

---

## Task 6: Scoring Engine

**Files:**
- Create: `src/scoring/scoring.ts`
- Test: `src/scoring/scoring.test.ts`

- [ ] **Step 1: Write failing scoring tests**

Create `src/scoring/scoring.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { settleHand } from './scoring';

describe('scoring', () => {
  it('scores self-draw without kongs', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'B',
        winType: 'self-draw',
        winnerExposedKongs: 0,
        winnerConcealedKongs: 0,
      }),
    ).toEqual({ A: -20, B: 40, C: -20 });
  });

  it('scores self-draw with one exposed and one concealed kong', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'B',
        winType: 'self-draw',
        winnerExposedKongs: 1,
        winnerConcealedKongs: 1,
      }),
    ).toEqual({ A: -35, B: 70, C: -35 });
  });

  it('charges only non-listening discarder for discard win and kong bonuses', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'C',
        winType: 'discard',
        discarder: 'B',
        discarderHadDeclaredListening: false,
        winnerExposedKongs: 1,
        winnerConcealedKongs: 1,
      }),
    ).toEqual({ A: 0, B: -45, C: 45 });
  });

  it('splits listening discarder payment across both non-winners when dealer wins', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'A',
        winType: 'discard',
        discarder: 'B',
        discarderHadDeclaredListening: true,
        winnerExposedKongs: 1,
        winnerConcealedKongs: 0,
      }),
    ).toEqual({ A: 30, B: -15, C: -15 });
  });

  it('charges dealer 10 and the other non-winner 5 when non-dealer wins from listening discard', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'C',
        winType: 'discard',
        discarder: 'B',
        discarderHadDeclaredListening: true,
        winnerExposedKongs: 0,
        winnerConcealedKongs: 0,
      }),
    ).toEqual({ A: -10, B: -5, C: 15 });
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm test -- src/scoring/scoring.test.ts
```

Expected: FAIL because `scoring.ts` does not exist.

- [ ] **Step 3: Implement scoring engine**

Create `src/scoring/scoring.ts` with:

```ts
import type { Seat } from '../domain';

export type ScoreDelta = Record<Seat, number>;

export interface SettlementInput {
  seats: Seat[];
  dealer: Seat;
  winner: Seat;
  winType: 'self-draw' | 'discard';
  discarder?: Seat;
  discarderHadDeclaredListening?: boolean;
  winnerExposedKongs: number;
  winnerConcealedKongs: number;
}

function emptyScore(seats: Seat[]): ScoreDelta {
  return Object.fromEntries(seats.map((seat) => [seat, 0])) as ScoreDelta;
}

function add(delta: ScoreDelta, seat: Seat, points: number): void {
  delta[seat] += points;
}

function nonWinners(seats: Seat[], winner: Seat): Seat[] {
  return seats.filter((seat) => seat !== winner);
}

function kongBonus(input: SettlementInput): number {
  return input.winnerExposedKongs * 5 + input.winnerConcealedKongs * 10;
}

export function settleHand(input: SettlementInput): ScoreDelta {
  const delta = emptyScore(input.seats);
  const bonusPerPayer = kongBonus(input);

  if (input.winType === 'self-draw') {
    for (const payer of nonWinners(input.seats, input.winner)) {
      add(delta, payer, -(20 + bonusPerPayer));
      add(delta, input.winner, 20 + bonusPerPayer);
    }
    return delta;
  }

  if (!input.discarder) {
    throw new Error('Discard win requires discarder.');
  }

  const discarderListened = input.discarderHadDeclaredListening === true;
  if (!discarderListened) {
    const base = input.winner === input.dealer ? 20 : 15;
    const allKongBonusFromDiscarder = bonusPerPayer * 2;
    add(delta, input.discarder, -(base + allKongBonusFromDiscarder));
    add(delta, input.winner, base + allKongBonusFromDiscarder);
    return delta;
  }

  if (input.winner === input.dealer) {
    for (const payer of nonWinners(input.seats, input.winner)) {
      add(delta, payer, -(10 + bonusPerPayer));
      add(delta, input.winner, 10 + bonusPerPayer);
    }
    return delta;
  }

  for (const payer of nonWinners(input.seats, input.winner)) {
    const base = payer === input.dealer ? 10 : 5;
    add(delta, payer, -(base + bonusPerPayer));
    add(delta, input.winner, base + bonusPerPayer);
  }
  return delta;
}
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```powershell
pnpm test -- src/scoring/scoring.test.ts
pnpm lint
```

Expected: PASS for tests and typecheck.

- [ ] **Step 5: Commit scoring engine**

Run:

```powershell
git add src/scoring
git commit -m "feat: add family scoring rules"
```

Expected: commit succeeds.

---

## Task 7: Turn State Reducer And Undo

**Files:**
- Create: `src/state/reducer.ts`
- Test: `src/state/reducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Create `src/state/reducer.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { createInitialGame, makeTile } from '../domain';
import { applyAction, undo } from './reducer';

describe('game reducer', () => {
  it('advances counterclockwise after a no-call discard', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = { ...game, phase: 'waiting-visible-discard' };
    game = applyAction(game, { type: 'visible-discard', tile: makeTile('wan', 1) });
    game = applyAction(game, { type: 'no-call' });
    expect(game.currentActor).toBe('B');
    expect(game.phase).toBe('waiting-visible-discard');
  });

  it('jumps to pong caller after a discard', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = { ...game, phase: 'waiting-visible-discard' };
    game = applyAction(game, { type: 'visible-discard', tile: makeTile('tiao', 5) });
    game = applyAction(game, { type: 'pong', caller: 'C' });
    expect(game.currentActor).toBe('C');
    expect(game.phase).toBe('waiting-visible-discard');
  });

  it('keeps turn with kong caller for tail draw discard', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = { ...game, phase: 'waiting-visible-discard' };
    game = applyAction(game, { type: 'visible-discard', tile: makeTile('bing', 9) });
    game = applyAction(game, { type: 'exposed-kong', caller: 'B' });
    expect(game.currentActor).toBe('B');
    expect(game.phase).toBe('waiting-tail-draw-discard');
  });

  it('restores previous state with undo', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = { ...game, phase: 'waiting-visible-discard' };
    const afterDiscard = applyAction(game, { type: 'visible-discard', tile: makeTile('wan', 1) });
    const restored = undo(afterDiscard);
    expect(restored.currentActor).toBe('A');
    expect(restored.phase).toBe('waiting-visible-discard');
    expect(restored.lastDiscard).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm test -- src/state/reducer.test.ts
```

Expected: FAIL because `reducer.ts` does not exist.

- [ ] **Step 3: Implement reducer**

Create `src/state/reducer.ts` with:

```ts
import {
  SEATS,
  getPlayer,
  tileKey,
  updatePlayer,
  type GameState,
  type Seat,
  type Tile,
} from '../domain';

export type GameAction =
  | { type: 'visible-discard'; tile: Tile }
  | { type: 'no-call' }
  | { type: 'pong'; caller: Seat }
  | { type: 'exposed-kong'; caller: Seat }
  | { type: 'declare-listening'; seat: Seat; faceDownTile: Tile }
  | { type: 'user-draw'; tile: Tile };

function pushHistory(game: GameState): GameState {
  return {
    ...game,
    actionHistory: [...game.actionHistory, { ...game, actionHistory: [] }],
  };
}

export function nextSeatCounterclockwise(seat: Seat): Seat {
  const index = SEATS.indexOf(seat);
  return SEATS[(index + 1) % SEATS.length];
}

export function applyAction(game: GameState, action: GameAction): GameState {
  const withHistory = pushHistory(game);

  switch (action.type) {
    case 'visible-discard': {
      const actor = withHistory.currentActor;
      const updated = updatePlayer(withHistory, actor, (player) => ({
        ...player,
        discards: [...player.discards, action.tile],
      }));
      return {
        ...updated,
        lastDiscard: { tile: action.tile, bySeat: actor },
        phase: 'reaction',
      };
    }

    case 'no-call':
      return {
        ...withHistory,
        currentActor: nextSeatCounterclockwise(withHistory.currentActor),
        lastDiscard: undefined,
        phase: 'waiting-visible-discard',
      };

    case 'pong':
      if (!withHistory.lastDiscard) {
        throw new Error('Pong requires a last discard.');
      }
      return {
        ...withHistory,
        currentActor: action.caller,
        phase: 'waiting-visible-discard',
      };

    case 'exposed-kong':
      if (!withHistory.lastDiscard) {
        throw new Error('Kong requires a last discard.');
      }
      return {
        ...withHistory,
        currentActor: action.caller,
        phase: 'waiting-tail-draw-discard',
      };

    case 'declare-listening':
      return updatePlayer(withHistory, action.seat, (player) => ({
        ...player,
        hasDeclaredListening: true,
        lockedAfterListening: true,
        faceDownListeningDiscard: action.faceDownTile,
        standingTiles: player.standingTiles.filter(
          (tile) => tileKey(tile) !== tileKey(action.faceDownTile),
        ),
      }));

    case 'user-draw': {
      const player = getPlayer(withHistory, withHistory.currentActor);
      if (!player.isUser) {
        throw new Error('Only the user draw is recorded exactly.');
      }
      return updatePlayer(withHistory, player.seat, (current) => ({
        ...current,
        concealedTiles: [...current.concealedTiles, action.tile],
      }));
    }
  }
}

export function undo(game: GameState): GameState {
  const previous = game.actionHistory.at(-1);
  if (!previous) {
    return game;
  }
  return {
    ...previous,
    actionHistory: game.actionHistory.slice(0, -1),
  };
}
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```powershell
pnpm test -- src/state/reducer.test.ts
pnpm lint
```

Expected: PASS for tests and typecheck.

- [ ] **Step 5: Commit reducer**

Run:

```powershell
git add src/state
git commit -m "feat: add turn reducer and undo"
```

Expected: commit succeeds.

---

## Task 8: Recommendation Engine

**Files:**
- Create: `src/recommendation/recommend.ts`
- Test: `src/recommendation/recommend.test.ts`

- [ ] **Step 1: Write failing recommendation tests**

Create `src/recommendation/recommend.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { countTiles, tilesFromKeys } from '../domain';
import { recommendDiscards } from './recommend';

describe('recommendations', () => {
  it('never recommends normal discard of a standing tile', () => {
    const result = recommendDiscards({
      concealed: tilesFromKeys([
        'wan-1', 'wan-2', 'wan-3',
        'tiao-1', 'tiao-2', 'tiao-3',
      ]),
      standing: tilesFromKeys(['wan-1']),
      melds: [],
      seenCounts: {},
      opponentsListening: 0,
    });
    expect(result.map((item) => item.discardKey)).not.toContain('wan-1');
  });

  it('penalizes routes whose winning tile is exhausted in seen counts', () => {
    const concealed = tilesFromKeys([
      'wan-1', 'wan-2', 'wan-3',
      'wan-4', 'wan-5', 'wan-6',
      'tiao-2', 'tiao-3', 'tiao-4',
      'tiao-7', 'tiao-7', 'tiao-7',
      'wan-9', 'bing-1',
    ]);
    const standing = tilesFromKeys(['bing-1']);
    const seenCounts = countTiles(tilesFromKeys(['wan-9', 'wan-9', 'wan-9', 'wan-9']));
    const result = recommendDiscards({ concealed, standing, melds: [], seenCounts, opponentsListening: 0 });
    const best = result[0];
    expect(best.effectiveTileCount).toBeGreaterThanOrEqual(0);
    expect(best.reasons.join(' ')).toContain('standing');
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm test -- src/recommendation/recommend.test.ts
```

Expected: FAIL because `recommend.ts` does not exist.

- [ ] **Step 3: Implement first recommendation engine**

Create `src/recommendation/recommend.ts` with:

```ts
import {
  addCount,
  countTiles,
  keysFromTiles,
  remainingCopies,
  tileKey,
  type Meld,
  type Tile,
  type TileCounts,
  type TileKey,
} from '../domain';
import { canDeclareListeningByStandingDiscard, normalDiscardCandidates } from '../rules/lisiRules';

export interface DiscardRecommendationInput {
  concealed: Tile[];
  standing: Tile[];
  melds: Meld[];
  seenCounts: TileCounts;
  opponentsListening: number;
}

export interface DiscardRecommendation {
  discardKey: TileKey;
  score: number;
  effectiveTileCount: number;
  warningLevel: 'normal' | 'caution';
  reasons: string[];
}

function removeOneTile(tiles: Tile[], target: Tile): Tile[] {
  let removed = false;
  return tiles.filter((tile) => {
    if (!removed && tileKey(tile) === tileKey(target)) {
      removed = true;
      return false;
    }
    return true;
  });
}

export function recommendDiscards(input: DiscardRecommendationInput): DiscardRecommendation[] {
  const candidates = normalDiscardCandidates(input.concealed, input.standing);
  const uniqueCandidates = Array.from(new Set(keysFromTiles(candidates))).map((key) =>
    candidates.find((tile) => tileKey(tile) === key)!,
  );

  return uniqueCandidates
    .map((discard) => {
      const remainingConcealed = removeOneTile(input.concealed, discard);
      const listeningChoices = canDeclareListeningByStandingDiscard({
        concealed: remainingConcealed,
        standing: input.standing,
        melds: input.melds,
      });
      const winningKeys = new Set(listeningChoices.flatMap((choice) => choice.winningKeys));
      const effectiveTileCount = Array.from(winningKeys).reduce((sum, key) => {
        const [suit, rawRank] = key.split('-');
        return sum + remainingCopies({ suit: suit as Tile['suit'], rank: Number(rawRank) as Tile['rank'] }, input.seenCounts);
      }, 0);

      const standingPreserved = input.standing.length > 0;
      const riskPenalty = input.opponentsListening * 2;
      const score = listeningChoices.length * 10 + effectiveTileCount - riskPenalty;
      const reasons = [
        standingPreserved ? 'standing tile remains available for listening' : 'no standing tile remains',
        `${listeningChoices.length} listening choices`,
        `${effectiveTileCount} effective known-remaining tiles`,
      ];
      if (input.opponentsListening > 0) {
        reasons.push(`${input.opponentsListening} opponents have declared listening`);
      }

      return {
        discardKey: tileKey(discard),
        score,
        effectiveTileCount,
        warningLevel: input.opponentsListening > 0 ? 'caution' : 'normal',
        reasons,
      } satisfies DiscardRecommendation;
    })
    .sort((a, b) => b.score - a.score || b.effectiveTileCount - a.effectiveTileCount);
}
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```powershell
pnpm test -- src/recommendation/recommend.test.ts
pnpm lint
```

Expected: PASS for tests and typecheck.

- [ ] **Step 5: Commit recommendation engine**

Run:

```powershell
git add src/recommendation
git commit -m "feat: recommend legal lisi discards"
```

Expected: commit succeeds.

---

## Task 9: Mobile UI Components

**Files:**
- Create: `src/ui/TileButton.tsx`
- Create: `src/ui/TileKeypad.tsx`
- Create: `src/ui/PlayerStatus.tsx`
- Create: `src/ui/ReactionStrip.tsx`
- Create: `src/ui/RecommendationPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Test: `src/ui/TileKeypad.test.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Create `src/ui/TileKeypad.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TileKeypad } from './TileKeypad';

describe('TileKeypad', () => {
  it('renders 27 tile buttons and emits selected tile', async () => {
    const onSelect = vi.fn();
    render(<TileKeypad onSelect={onSelect} />);
    expect(screen.getAllByRole('button')).toHaveLength(27);
    await userEvent.click(screen.getByRole('button', { name: '五条' }));
    expect(onSelect).toHaveBeenCalledWith({ suit: 'tiao', rank: 5 });
  });
});
```

Create `src/App.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('shows automatic turn status and recommendation area', () => {
    render(<App />);
    expect(screen.getByText('立四麻将助手')).toBeInTheDocument();
    expect(screen.getByText(/当前轮到/)).toBeInTheDocument();
    expect(screen.getByText(/推荐/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
pnpm test -- src/ui/TileKeypad.test.tsx src/App.test.tsx
```

Expected: FAIL because UI components do not exist and App does not show required text.

- [ ] **Step 3: Install user-event for UI tests**

Run:

```powershell
pnpm add -D @testing-library/user-event
```

Expected: `package.json` and `pnpm-lock.yaml` include `@testing-library/user-event`.

- [ ] **Step 4: Implement UI components**

Create `src/ui/TileButton.tsx` with:

```tsx
import type { Tile } from '../domain';

const suitLabel: Record<Tile['suit'], string> = {
  wan: '万',
  tiao: '条',
  bing: '饼',
};

const rankLabel: Record<Tile['rank'], string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
  9: '九',
};

export function tileChineseLabel(tile: Tile): string {
  return `${rankLabel[tile.rank]}${suitLabel[tile.suit]}`;
}

export interface TileButtonProps {
  tile: Tile;
  onSelect: (tile: Tile) => void;
  disabled?: boolean;
}

export function TileButton({ tile, onSelect, disabled = false }: TileButtonProps) {
  return (
    <button className="tile-button" disabled={disabled} onClick={() => onSelect(tile)}>
      {tileChineseLabel(tile)}
    </button>
  );
}
```

Create `src/ui/TileKeypad.tsx` with:

```tsx
import { ALL_TILES, SUITS, type Tile } from '../domain';
import { TileButton } from './TileButton';

const suitTitle: Record<Tile['suit'], string> = {
  wan: '万',
  tiao: '条',
  bing: '饼',
};

export interface TileKeypadProps {
  onSelect: (tile: Tile) => void;
}

export function TileKeypad({ onSelect }: TileKeypadProps) {
  return (
    <section className="tile-keypad" aria-label="牌面输入">
      {SUITS.map((suit) => (
        <div className="tile-row" key={suit}>
          <div className="tile-row-label">{suitTitle[suit]}</div>
          <div className="tile-row-buttons">
            {ALL_TILES.filter((tile) => tile.suit === suit).map((tile) => (
              <TileButton key={`${tile.suit}-${tile.rank}`} tile={tile} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
```

Create `src/ui/PlayerStatus.tsx` with:

```tsx
import type { GameState } from '../domain';

export interface PlayerStatusProps {
  game: GameState;
}

export function PlayerStatus({ game }: PlayerStatusProps) {
  return (
    <section className="status-panel">
      <strong>当前轮到：{game.currentActor}</strong>
      <div className="player-chips">
        {game.players.map((player) => (
          <span className="player-chip" key={player.seat}>
            {player.seat}
            {player.isDealer ? ' 庄' : ''}
            {player.hasDeclaredListening ? ' 听' : ''}
            {player.isUser ? ' 我' : ''}
          </span>
        ))}
      </div>
    </section>
  );
}
```

Create `src/ui/ReactionStrip.tsx` with:

```tsx
import type { Seat } from '../domain';

export interface ReactionStripProps {
  seats: Seat[];
  onNoCall: () => void;
  onPong: (seat: Seat) => void;
  onKong: (seat: Seat) => void;
}

export function ReactionStrip({ seats, onNoCall, onPong, onKong }: ReactionStripProps) {
  return (
    <section className="reaction-strip" aria-label="吃碰杠响应">
      <button onClick={onNoCall}>无人要</button>
      {seats.map((seat) => (
        <button key={`${seat}-pong`} onClick={() => onPong(seat)}>
          {seat}碰
        </button>
      ))}
      {seats.map((seat) => (
        <button key={`${seat}-kong`} onClick={() => onKong(seat)}>
          {seat}杠
        </button>
      ))}
    </section>
  );
}
```

Create `src/ui/RecommendationPanel.tsx` with:

```tsx
import type { DiscardRecommendation } from '../recommendation/recommend';

export interface RecommendationPanelProps {
  recommendations: DiscardRecommendation[];
}

export function RecommendationPanel({ recommendations }: RecommendationPanelProps) {
  const best = recommendations[0];
  return (
    <section className="recommendation-panel">
      <h2>推荐</h2>
      {best ? (
        <div>
          <strong>建议打：{best.discardKey}</strong>
          <p>{best.reasons.join('；')}</p>
        </div>
      ) : (
        <p>录入手牌后显示建议。</p>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Wire App with placeholder state**

Modify `src/App.tsx` to:

```tsx
import { useMemo } from 'react';
import { createInitialGame, type Tile } from './domain';
import { recommendDiscards } from './recommendation/recommend';
import { PlayerStatus } from './ui/PlayerStatus';
import { ReactionStrip } from './ui/ReactionStrip';
import { RecommendationPanel } from './ui/RecommendationPanel';
import { TileKeypad } from './ui/TileKeypad';

export default function App() {
  const game = useMemo(() => createInitialGame({ userSeat: 'A', dealerSeat: 'A' }), []);
  const recommendations = recommendDiscards({
    concealed: [],
    standing: [],
    melds: [],
    seenCounts: {},
    opponentsListening: 0,
  });

  function handleTileSelect(tile: Tile) {
    console.info('selected tile', tile);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>立四麻将助手</h1>
      </header>
      <PlayerStatus game={game} />
      <RecommendationPanel recommendations={recommendations} />
      <TileKeypad onSelect={handleTileSelect} />
      <ReactionStrip
        seats={['A', 'B', 'C']}
        onNoCall={() => console.info('no call')}
        onPong={(seat) => console.info('pong', seat)}
        onKong={(seat) => console.info('kong', seat)}
      />
    </main>
  );
}
```

Modify `src/index.css` to include:

```css
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

h1,
h2,
p {
  margin-block-start: 0;
}

.status-panel,
.recommendation-panel,
.tile-keypad,
.reaction-strip {
  margin-block: 12px;
}

.player-chips,
.reaction-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.player-chip {
  border: 1px solid #cfd4dc;
  border-radius: 6px;
  padding: 6px 8px;
  background: #ffffff;
}

.tile-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-block: 8px;
}

.tile-row-label {
  font-weight: 700;
}

.tile-row-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(56px, 1fr));
  gap: 6px;
}

.tile-button,
.reaction-strip button {
  min-height: 44px;
  border: 1px solid #b8c0cc;
  border-radius: 6px;
  background: #ffffff;
  color: #18212f;
}

.recommendation-panel {
  border-block: 1px solid #d8dde5;
  padding-block: 12px;
}

@media (min-width: 768px) {
  .app-shell {
    padding: 24px;
  }

  .tile-row {
    grid-template-columns: 40px 1fr;
    align-items: center;
  }

  .tile-row-buttons {
    grid-template-columns: repeat(9, minmax(44px, 1fr));
  }
}

@media (min-width: 1024px) {
  .app-shell {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
    gap: 24px;
  }

  .app-header,
  .status-panel,
  .tile-keypad,
  .reaction-strip {
    grid-column: 1;
  }

  .recommendation-panel {
    grid-column: 2;
    grid-row: 2 / span 3;
    align-self: start;
    position: sticky;
    top: 16px;
  }
}
```

- [ ] **Step 6: Run UI tests and build**

Run:

```powershell
pnpm test -- src/ui/TileKeypad.test.tsx src/App.test.tsx
pnpm build
```

Expected: PASS for tests and build.

- [ ] **Step 7: Commit UI shell**

Run:

```powershell
git add package.json pnpm-lock.yaml src
git commit -m "feat: add mobile tile input UI"
```

Expected: commit succeeds.

---

## Task 10: Integration, README, And Manual QA

**Files:**
- Modify: `README.md`
- Test: all existing tests

- [ ] **Step 1: Update README**

Replace `README.md` with:

````md
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
- Listening validation.
- Standard and dragon hand checks.
- Family scoring rules.
- First discard recommendation engine.

## Rules Source

See `docs/design.md`.
````

- [ ] **Step 2: Run full automated verification**

Run:

```powershell
pnpm test
pnpm build
```

Expected: PASS for all tests and production build.

- [ ] **Step 3: Run local server**

Run:

```powershell
pnpm dev
```

Expected: Vite prints a local URL and a network URL. Keep the server running for manual testing.

- [ ] **Step 4: Manual QA checklist**

In the browser:

- Confirm the title shows `立四麻将助手`.
- Confirm current actor shows `A` for a new game with dealer `A`.
- Confirm 27 tile buttons render as `一万` through `九饼`.
- Confirm the recommendation panel is visible.
- Confirm reaction buttons show `无人要`, `A碰`, `B碰`, `C碰`, `A杠`, `B杠`, `C杠`.
- Confirm the layout fits a narrow mobile viewport without overlapping text.
- Confirm phone layout shows each suit keypad as a 3 by 3 grid.
- Confirm tablet and desktop widths show wider keypad rows without horizontal scrolling.
- Confirm the Vite LAN URL opens from a phone or tablet on the same Wi-Fi.

- [ ] **Step 5: Commit docs and integration**

Run:

```powershell
git add README.md src package.json pnpm-lock.yaml
git commit -m "docs: add local development guide"
```

Expected: commit succeeds if there were changes.

---

## Self-Review Checklist

- Spec coverage:
  - Tile set, three seats, counterclockwise turn order: Tasks 2, 3, 7.
  - Standing tile rules: Tasks 5, 8.
  - Missing suit and exactly-two-suit rule: Task 5.
  - Must listen before win and locked listening mode: Tasks 5, 7.
  - Standard and dragon hand checks: Task 4.
  - Kong replacement draw state: Task 7.
  - Family scoring including kong bonus source: Task 6.
  - Manual mobile input: Task 9.
  - Undo: Task 7.
- Type consistency:
  - `Seat`, `Tile`, `Meld`, `GameState`, `TileCounts`, and `TileKey` are defined in domain modules and reused.
  - Recommendation output uses `DiscardRecommendation` consumed by UI.
  - Scoring uses `Seat` from domain.
- First executable milestone:
  - After Task 10, the app builds, tests pass, and a local Vite server can be opened on phone, tablet, and desktop.
