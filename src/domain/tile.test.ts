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
