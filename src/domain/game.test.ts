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
