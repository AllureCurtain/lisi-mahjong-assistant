import { describe, expect, it } from 'vitest';
import { createInitialGame, getPlayer, makeTile, tilesFromKeys, updatePlayer } from '../domain';
import { applyAction, nextSeatCounterclockwise, recomputeKnownSeenCounts, undo } from './reducer';

describe('game reducer', () => {
  it('does not double count standing tiles that are already in the user concealed hand', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'A', (player) => ({
      ...player,
      concealedTiles: tilesFromKeys(['bing-1']),
      standingTiles: tilesFromKeys(['bing-1']),
    }));
    expect(recomputeKnownSeenCounts(game)['bing-1']).toBe(1);
  });

  it('records setup hand tiles and standing tiles without exceeding four copies', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = applyAction(game, { type: 'setup-user-tile', tile: makeTile('wan', 1), standing: false });
    game = applyAction(game, { type: 'setup-user-tile', tile: makeTile('wan', 1), standing: true });
    expect(getPlayer(game, 'A').concealedTiles.map((tile) => `${tile.suit}-${tile.rank}`)).toEqual([
      'wan-1',
      'wan-1',
    ]);
    expect(getPlayer(game, 'A').standingTiles.map((tile) => `${tile.suit}-${tile.rank}`)).toEqual([
      'wan-1',
    ]);
    game = applyAction(game, { type: 'setup-user-tile', tile: makeTile('wan', 1), standing: false });
    game = applyAction(game, { type: 'setup-user-tile', tile: makeTile('wan', 1), standing: false });
    expect(() =>
      applyAction(game, { type: 'setup-user-tile', tile: makeTile('wan', 1), standing: false }),
    ).toThrow(/exceed four/i);
  });

  it('marks an opponent as listening without knowing their face-down standing tile', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = applyAction(game, { type: 'mark-listening', seat: 'B' });
    expect(getPlayer(game, 'B').hasDeclaredListening).toBe(true);
    expect(getPlayer(game, 'B').faceDownListeningDiscard).toBeUndefined();
  });

  it('advances counterclockwise after a no-call discard', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = { ...game, phase: 'waiting-visible-discard' };
    game = applyAction(game, { type: 'visible-discard', tile: makeTile('wan', 1) });
    game = applyAction(game, { type: 'no-call' });
    expect(game.currentActor).toBe('B');
    expect(game.phase).toBe('waiting-visible-discard');
    expect(nextSeatCounterclockwise('C')).toBe('A');
  });

  it('prompts for user draw when no-call progression reaches the user seat', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'C' });
    game = { ...game, phase: 'waiting-visible-discard' };
    game = applyAction(game, { type: 'visible-discard', tile: makeTile('wan', 1) });
    game = applyAction(game, { type: 'no-call' });
    expect(game.currentActor).toBe('A');
    expect(game.phase).toBe('waiting-user-draw');
  });

  it('jumps to pong caller after a discard', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = { ...game, phase: 'waiting-visible-discard' };
    game = applyAction(game, { type: 'visible-discard', tile: makeTile('tiao', 5) });
    game = applyAction(game, { type: 'pong', caller: 'C' });
    expect(game.currentActor).toBe('C');
    expect(game.phase).toBe('waiting-visible-discard');
    expect(getPlayer(game, 'C').melds).toEqual([
      { type: 'pong', tile: makeTile('tiao', 5), fromSeat: 'A' },
    ]);
  });

  it('keeps turn with kong caller for tail draw discard', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = { ...game, phase: 'waiting-visible-discard' };
    game = applyAction(game, { type: 'visible-discard', tile: makeTile('bing', 9) });
    game = applyAction(game, { type: 'exposed-kong', caller: 'B' });
    expect(game.currentActor).toBe('B');
    expect(game.phase).toBe('waiting-tail-draw-discard');
    expect(getPlayer(game, 'B').exposedKongCount).toBe(1);
  });

  it('rejects normal user discard of a standing tile before listening', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'A', (player) => ({
      ...player,
      concealedTiles: tilesFromKeys(['wan-1', 'wan-2', 'tiao-3']),
      standingTiles: tilesFromKeys(['wan-2']),
    }));
    game = { ...game, phase: 'waiting-visible-discard' };
    expect(() => applyAction(game, { type: 'visible-discard', tile: makeTile('wan', 2) })).toThrow(
      /standing tile/i,
    );
  });

  it('declares listening by removing one standing tile face-down and locking the hand', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'A', (player) => ({
      ...player,
      concealedTiles: tilesFromKeys([
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
      ]),
      standingTiles: tilesFromKeys(['bing-1']),
    }));
    game = applyAction(game, { type: 'declare-listening', seat: 'A', faceDownTile: makeTile('bing', 1) });
    const user = getPlayer(game, 'A');
    expect(user.hasDeclaredListening).toBe(true);
    expect(user.lockedAfterListening).toBe(true);
    expect(user.faceDownListeningDiscard).toEqual(makeTile('bing', 1));
    expect(user.standingTiles).toEqual([]);
    expect(user.concealedTiles.map((tile) => `${tile.suit}-${tile.rank}`)).not.toContain('bing-1');
  });

  it('rejects kong after listening', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'B', (player) => ({ ...player, hasDeclaredListening: true }));
    game = { ...game, phase: 'waiting-visible-discard' };
    game = applyAction(game, { type: 'visible-discard', tile: makeTile('wan', 3) });
    expect(() => applyAction(game, { type: 'exposed-kong', caller: 'B' })).toThrow(/after listening/i);
  });

  it('rejects a known tile count above four', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = { ...game, phase: 'waiting-visible-discard' };
    for (const seat of ['A', 'B', 'C', 'A'] as const) {
      game = { ...game, currentActor: seat };
      game = applyAction(game, { type: 'visible-discard', tile: makeTile('bing', 8) });
      game = applyAction(game, { type: 'no-call' });
    }
    game = { ...game, currentActor: 'B', phase: 'waiting-visible-discard' };
    expect(() => applyAction(game, { type: 'visible-discard', tile: makeTile('bing', 8) })).toThrow(
      /exceed four/i,
    );
  });

  it('requires a locked listener to discard exactly the drawn tile', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'A', (player) => ({
      ...player,
      hasDeclaredListening: true,
      lockedAfterListening: true,
    }));
    game = applyAction(game, { type: 'user-draw', tile: makeTile('tiao', 9) });
    expect(() => applyAction(game, { type: 'visible-discard', tile: makeTile('tiao', 8) })).toThrow(
      /drawn tile/i,
    );
    const discarded = applyAction(game, { type: 'visible-discard', tile: makeTile('tiao', 9) });
    expect(getPlayer(discarded, 'A').drawnTileAfterListening).toBeUndefined();
  });

  it('rejects win before listening', () => {
    const game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    expect(() => applyAction(game, { type: 'win', winner: 'A' })).toThrow(/before listening/i);
  });

  it('records settlement score when a listened player wins', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'A', (player) => ({
      ...player,
      hasDeclaredListening: true,
      exposedKongCount: 1,
      concealedKongCount: 1,
    }));
    game = applyAction(game, { type: 'win', winner: 'A', winType: 'self-draw' });
    expect(game.phase).toBe('settlement');
    expect(game.settlement?.scoreDelta).toEqual({ A: 70, B: -35, C: -35 });
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
