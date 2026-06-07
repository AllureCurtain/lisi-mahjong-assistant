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
        'wan-1',
        'wan-2',
        'wan-3',
        'wan-4',
        'wan-5',
        'wan-6',
        'tiao-2',
        'tiao-3',
        'tiao-4',
        'bing-7',
        'bing-7',
        'bing-7',
        'tiao-9',
        'tiao-9',
      ]),
    );
    expect(isCompleteStandardHand(counts, 0)).toBe(true);
  });

  it('uses existing meld groups when checking a standard hand', () => {
    const counts = countTiles(
      tilesFromKeys([
        'wan-1',
        'wan-2',
        'wan-3',
        'tiao-4',
        'tiao-5',
        'tiao-6',
        'bing-9',
        'bing-9',
      ]),
    );
    expect(isCompleteStandardHand(counts, 2)).toBe(true);
  });

  it('recognizes a concealed dragon route plus one group and one pair', () => {
    const counts = countTiles(
      tilesFromKeys([
        'tiao-1',
        'tiao-2',
        'tiao-3',
        'tiao-4',
        'tiao-5',
        'tiao-6',
        'tiao-7',
        'tiao-8',
        'tiao-9',
        'wan-5',
        'wan-5',
        'wan-5',
        'bing-2',
        'bing-2',
      ]),
    );
    expect(isCompleteDragonHand(counts, 0)).toBe(true);
  });

  it('allows extra concealed copies to support both dragon and another group', () => {
    const counts = countTiles(
      tilesFromKeys([
        'tiao-1',
        'tiao-2',
        'tiao-3',
        'tiao-3',
        'tiao-3',
        'tiao-3',
        'tiao-4',
        'tiao-5',
        'tiao-6',
        'tiao-7',
        'tiao-8',
        'tiao-9',
        'wan-5',
        'wan-5',
      ]),
    );
    expect(isCompleteDragonHand(counts, 0)).toBe(true);
  });

  it('finds winning tiles for a one-away hand', () => {
    const counts = countTiles(
      tilesFromKeys([
        'wan-1',
        'wan-2',
        'wan-3',
        'wan-4',
        'wan-5',
        'wan-6',
        'tiao-2',
        'tiao-3',
        'tiao-4',
        'bing-7',
        'bing-7',
        'bing-7',
        'tiao-9',
      ]),
    );
    expect(winningTilesForHand(counts, 0).map((tile) => `${tile.suit}-${tile.rank}`)).toContain(
      'tiao-9',
    );
  });
});
