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
