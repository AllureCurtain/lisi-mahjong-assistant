import { describe, expect, it } from 'vitest';
import { countTiles, makeTile, tilesFromKeys } from '../domain';
import { recommendCalls, recommendDiscards, recommendSelfKongs } from './recommend';

describe('recommendations', () => {
  it('never recommends normal discard of a standing tile', () => {
    const result = recommendDiscards({
      concealed: tilesFromKeys(['wan-1', 'wan-2', 'wan-3', 'tiao-1', 'tiao-2', 'tiao-3']),
      standing: tilesFromKeys(['wan-1']),
      melds: [],
      seenCounts: {},
      opponentsListening: 0,
    });
    expect(result.map((item) => item.discardKey)).not.toContain('wan-1');
  });

  it('shows route, effective tiles, and standing-tile reasons for discard choices', () => {
    const concealed = tilesFromKeys([
      'wan-1',
      'wan-2',
      'wan-3',
      'wan-4',
      'wan-5',
      'wan-6',
      'tiao-2',
      'tiao-3',
      'tiao-4',
      'tiao-7',
      'tiao-7',
      'tiao-7',
      'wan-9',
      'bing-1',
    ]);
    const standing = tilesFromKeys(['bing-1']);
    const seenCounts = countTiles(tilesFromKeys(['wan-9', 'wan-9', 'wan-9', 'wan-9']));
    const result = recommendDiscards({ concealed, standing, melds: [], seenCounts, opponentsListening: 0 });
    const best = result[0];
    expect(best.route.missingSuit).toMatch(/wan|tiao|bing/);
    expect(best.effectiveTileCount).toBeGreaterThanOrEqual(0);
    expect(best.reasons.join(' ')).toContain('standing');
  });

  it('adds risk warnings when opponents have declared listening', () => {
    const result = recommendDiscards({
      concealed: tilesFromKeys(['wan-1', 'wan-2', 'wan-3', 'tiao-1', 'tiao-2', 'tiao-3']),
      standing: tilesFromKeys(['bing-1']),
      melds: [],
      seenCounts: {},
      opponentsListening: 1,
    });
    expect(result.every((item) => item.warningLevel === 'caution')).toBe(true);
    expect(result[0].warnings.join(' ')).toContain('opponent');
  });

  it('recommends pong only when the call keeps a legal standing tile path', () => {
    const result = recommendCalls({
      concealed: tilesFromKeys(['wan-5', 'wan-5', 'bing-1']),
      standing: tilesFromKeys(['bing-1']),
      melds: [],
      discard: makeTile('wan', 5),
      seenCounts: {},
      opponentsListening: 0,
      hasDeclaredListening: false,
    });
    expect(result.pong?.judgement).not.toBe('not-recommended');
    expect(result.pong?.reasons.join(' ')).toContain('standing');
  });

  it('does not recommend calls after listening', () => {
    const result = recommendCalls({
      concealed: tilesFromKeys(['wan-5', 'wan-5', 'bing-1']),
      standing: tilesFromKeys(['bing-1']),
      melds: [],
      discard: makeTile('wan', 5),
      seenCounts: {},
      opponentsListening: 0,
      hasDeclaredListening: true,
    });
    expect(result.pong?.judgement).toBe('not-recommended');
    expect(result.kong?.judgement).toBe('not-recommended');
  });

  it('finds concealed kong choices before listening', () => {
    const result = recommendSelfKongs({
      concealed: tilesFromKeys(['tiao-6', 'tiao-6', 'tiao-6', 'tiao-6', 'bing-1']),
      standing: tilesFromKeys(['bing-1']),
      melds: [],
      hasDeclaredListening: false,
    });
    expect(result.map((item) => item.tileKey)).toContain('tiao-6');
    expect(result[0].kind).toBe('concealed-kong');
  });
});
