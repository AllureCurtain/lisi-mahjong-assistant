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
      hasExactlyTwoSuits(tilesFromKeys(['wan-1']), [
        { type: 'pong', tile: { suit: 'bing', rank: 5 } },
      ]),
    ).toBe(true);
  });

  it('excludes standing tiles from normal discard candidates', () => {
    const candidates = normalDiscardCandidates(
      tilesFromKeys(['wan-1', 'wan-2', 'tiao-3']),
      tilesFromKeys(['wan-2']),
    );
    expect(candidates.map((tile) => `${tile.suit}-${tile.rank}`)).toEqual(['wan-1', 'tiao-3']);
  });

  it('allows discarding a non-standing duplicate of the same tile face', () => {
    const candidates = normalDiscardCandidates(
      tilesFromKeys(['wan-2', 'wan-2', 'tiao-3']),
      tilesFromKeys(['wan-2']),
    );
    expect(candidates.map((tile) => `${tile.suit}-${tile.rank}`)).toEqual(['wan-2', 'tiao-3']);
  });

  it('rejects winning before listening', () => {
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
        'tiao-7',
        'tiao-7',
        'tiao-7',
        'wan-9',
        'wan-9',
      ]),
    );
    expect(isLegalLisiWin({ counts, melds: [], hasDeclaredListening: false })).toBe(false);
  });

  it('accepts legal listened two-suit standard win', () => {
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
        'tiao-7',
        'tiao-7',
        'tiao-7',
        'wan-9',
        'wan-9',
      ]),
    );
    expect(isLegalLisiWin({ counts, melds: [], hasDeclaredListening: true })).toBe(true);
  });

  it('rejects one-suit and three-suit final wins', () => {
    const oneSuit = countTiles(
      tilesFromKeys([
        'wan-1',
        'wan-2',
        'wan-3',
        'wan-4',
        'wan-5',
        'wan-6',
        'wan-7',
        'wan-8',
        'wan-9',
        'wan-2',
        'wan-2',
        'wan-2',
        'wan-5',
        'wan-5',
      ]),
    );
    const threeSuit = countTiles(
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
    expect(isLegalLisiWin({ counts: oneSuit, melds: [], hasDeclaredListening: true })).toBe(
      false,
    );
    expect(isLegalLisiWin({ counts: threeSuit, melds: [], hasDeclaredListening: true })).toBe(
      false,
    );
  });

  it('does not let a melded dragon tile supply the concealed dragon route', () => {
    const counts = countTiles(
      tilesFromKeys([
        'tiao-1',
        'tiao-2',
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
    expect(
      isLegalLisiWin({
        counts,
        melds: [{ type: 'pong', tile: { suit: 'tiao', rank: 3 } }],
        hasDeclaredListening: true,
      }),
    ).toBe(false);
  });

  it('finds legal standing tile choices for listening', () => {
    const concealed = tilesFromKeys([
      'bing-1',
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
    ]);
    const standing = tilesFromKeys(['bing-1']);
    const choices = canDeclareListeningByStandingDiscard({ concealed, standing, melds: [] });
    expect(choices).toHaveLength(1);
    expect(choices[0].discardKey).toBe('bing-1');
    expect(choices[0].winningKeys).toContain('wan-9');
  });

  it('does not allow listening without a remaining standing tile', () => {
    const choices = canDeclareListeningByStandingDiscard({
      concealed: tilesFromKeys(['wan-1', 'wan-2', 'wan-3']),
      standing: [],
      melds: [],
    });
    expect(choices).toEqual([]);
  });
});
