import { describe, expect, it } from 'vitest';
import { countTiles, makeTile, tilesFromKeys } from '../domain';
import {
  distanceToListening,
  recommendAfterListening,
  recommendCalls,
  recommendDiscards,
  recommendSelfKongs,
} from './recommend';

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

  it('ranks discards with route, distance, and standing-tile reasons in chinese', () => {
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
    expect(best.route.feasible).toBe(true);
    expect(best.effectiveTileCount).toBeGreaterThanOrEqual(0);
    expect(best.distanceToListening).toBeGreaterThanOrEqual(0);
    expect(best.reasons.join('；')).toContain('立牌');
    expect(best.reasons.join('；')).toContain('缺');
    expect(best.reasons.join('；')).toContain('有效听牌余张');
  });

  it('enumerates the three missing-suit routes and keeps only compatible ones', () => {
    const result = recommendDiscards({
      concealed: tilesFromKeys([
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
        'bing-2',
      ]),
      standing: tilesFromKeys(['bing-1']),
      melds: [],
      seenCounts: {},
      opponentsListening: 0,
    });
    const discardBing2 = result.find((item) => item.discardKey === 'bing-2');
    expect(discardBing2?.route.missingSuit).toBe('bing');
    expect(discardBing2?.route.shape).toBe('standard');
    expect(discardBing2?.route.listeningChoiceCount).toBeGreaterThan(0);
    expect(discardBing2?.route.effectiveTileCount).toBeGreaterThan(0);
  });

  it('marks routes infeasible once the hand holds all three suits with no listening path', () => {
    const result = recommendDiscards({
      concealed: tilesFromKeys([
        'wan-1',
        'wan-2',
        'wan-3',
        'wan-4',
        'tiao-1',
        'tiao-2',
        'tiao-3',
        'tiao-4',
        'bing-1',
        'bing-2',
        'bing-3',
        'bing-4',
        'bing-5',
        'bing-6',
      ]),
      standing: tilesFromKeys(['bing-1']),
      melds: [],
      seenCounts: {},
      opponentsListening: 0,
    });
    const infeasible = result.filter((item) => item.route.feasible === false);
    expect(infeasible.length).toBeGreaterThan(0);
    expect(infeasible.every((item) => item.warnings.join('；').includes('缺门路线无法成立'))).toBe(true);
  });

  it('estimates listening distance for hands that are not yet tenpai', () => {
    const tenpai = distanceToListening(
      tilesFromKeys([
        'bing-1',
        'wan-1',
        'wan-2',
        'wan-3',
        'wan-4',
        'wan-5',
        'wan-6',
        'wan-9',
        'tiao-2',
        'tiao-3',
        'tiao-4',
        'tiao-7',
        'tiao-7',
        'tiao-7',
      ]),
      tilesFromKeys(['bing-1']),
      [],
    );
    expect(tenpai).toBe(0);

    const far = distanceToListening(
      tilesFromKeys([
        'wan-1',
        'wan-4',
        'wan-7',
        'tiao-2',
        'tiao-5',
        'tiao-8',
        'bing-3',
        'bing-6',
        'bing-9',
        'wan-9',
        'tiao-9',
        'bing-9',
        'wan-5',
      ]),
      tilesFromKeys(['wan-5']),
      [],
    );
    expect(far).toBeGreaterThan(0);
  });

  it('adds chinese risk warnings when opponents have declared listening', () => {
    const result = recommendDiscards({
      concealed: tilesFromKeys(['wan-1', 'wan-2', 'wan-3', 'tiao-1', 'tiao-2', 'tiao-3']),
      standing: tilesFromKeys(['bing-1']),
      melds: [],
      seenCounts: {},
      opponentsListening: 1,
    });
    expect(result.every((item) => item.warningLevel === 'caution')).toBe(true);
    expect(result[0].warnings.join('；')).toContain('已听牌');
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
    expect(result.pong?.reasons.join('；')).toContain('立牌');
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
    expect(result.pong?.reasons.join('；')).toContain('锁定');
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
    expect(result[0].reasons.join('；')).toContain('暗杠');
  });

  it('switches to locked-hand guidance after listening with chinese text', () => {
    const result = recommendAfterListening({
      lockedCounts: countTiles(
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
          'tiao-7',
          'tiao-7',
          'tiao-7',
          'wan-9',
        ]),
      ),
      melds: [],
      drawnTile: makeTile('wan', 9),
      hasDeclaredListening: true,
    });
    expect(result.mode).toBe('self-draw-win');
    expect(result.reasons.join('；')).toContain('自摸结算');
  });
});
