import {
  countTiles,
  parseTileKey,
  tileCount,
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

export function tilesFromCounts(counts: TileCounts): Tile[] {
  return (Object.entries(counts) as [TileKey, number | undefined][]).flatMap(([key, count]) => {
    const tile = parseTileKey(key);
    return Array.from({ length: count ?? 0 }, () => tile);
  });
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
  const standingCounts = countTiles(standing);
  const usedStandingCopies: TileCounts = {};

  return concealed.filter((tile) => {
    const key = tileKey(tile);
    const standingCopyCount = standingCounts[key] ?? 0;
    const alreadyProtected = usedStandingCopies[key] ?? 0;
    if (alreadyProtected < standingCopyCount) {
      usedStandingCopies[key] = alreadyProtected + 1;
      return false;
    }
    return true;
  });
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

  const tiles = tilesFromCounts(input.counts);
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

function removeOneTile(tiles: Tile[], target: Tile): Tile[] | undefined {
  let removed = false;
  const remaining = tiles.filter((tile) => {
    if (!removed && tileKey(tile) === tileKey(target)) {
      removed = true;
      return false;
    }
    return true;
  });
  return removed ? remaining : undefined;
}

export function canDeclareListeningByStandingDiscard(input: ListeningInput): ListeningChoice[] {
  if (input.standing.length === 0) {
    return [];
  }

  const choices: ListeningChoice[] = [];
  const uniqueStanding = new Map<TileKey, Tile>();
  for (const standingTile of input.standing) {
    uniqueStanding.set(tileKey(standingTile), standingTile);
  }

  for (const standingTile of uniqueStanding.values()) {
    const remaining = removeOneTile(input.concealed, standingTile);
    if (!remaining || !hasExactlyTwoSuits(remaining, input.melds)) {
      continue;
    }

    const counts = countTiles(remaining);
    const winningKeys = winningTilesForHand(counts, meldGroupCount(input.melds))
      .filter((tile) =>
        isLegalLisiWin({
          counts: { ...counts, [tileKey(tile)]: tileCount(counts, tile) + 1 },
          melds: input.melds,
          hasDeclaredListening: true,
        }),
      )
      .map(tileKey);

    if (winningKeys.length > 0) {
      choices.push({ discardKey: tileKey(standingTile), winningKeys });
    }
  }

  return choices;
}
