import {
  ALL_TILES,
  RANKS,
  SUITS,
  addCount,
  parseTileKey,
  tileCount,
  tileKey,
  type Rank,
  type Suit,
  type Tile,
  type TileCounts,
  type TileKey,
} from '../domain';

function cloneCounts(counts: TileCounts): TileCounts {
  return { ...counts };
}

export function totalTiles(counts: TileCounts): number {
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
    const secondRank = (firstTile.rank + 1) as Rank;
    const thirdRank = (firstTile.rank + 2) as Rank;
    const secondKey = tileKey({ suit: firstTile.suit, rank: secondRank });
    const thirdKey = tileKey({ suit: firstTile.suit, rank: thirdRank });
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
  if (meldGroupCount > 1) {
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
