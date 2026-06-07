import { SEATS, type Seat } from './meld';
import { createPlayer, type PlayerState } from './player';
import type { Tile, TileCounts } from './tile';

export type GamePhase =
  | 'setup'
  | 'waiting-visible-discard'
  | 'waiting-user-draw'
  | 'reaction'
  | 'waiting-tail-draw-discard'
  | 'user-discard-choice'
  | 'settlement';

export interface LastDiscard {
  tile: Tile;
  bySeat: Seat;
}

export interface SettlementState {
  winner: Seat;
  winType: 'self-draw' | 'discard';
  discarder?: Seat;
  scoreDelta: Record<Seat, number>;
}

export interface GameState {
  players: PlayerState[];
  currentActor: Seat;
  direction: 'counterclockwise';
  phase: GamePhase;
  lastDiscard?: LastDiscard;
  settlement?: SettlementState;
  knownSeenCounts: TileCounts;
  actionHistory: GameState[];
}

export interface CreateInitialGameInput {
  userSeat: Seat;
  dealerSeat: Seat;
}

export function createInitialGame(input: CreateInitialGameInput): GameState {
  const players = SEATS.map((seat) =>
    createPlayer({
      seat,
      isUser: seat === input.userSeat,
      isDealer: seat === input.dealerSeat,
    }),
  );
  return {
    players,
    currentActor: input.dealerSeat,
    direction: 'counterclockwise',
    phase: 'setup',
    knownSeenCounts: {},
    actionHistory: [],
  };
}

export function getPlayer(game: GameState, seat: Seat): PlayerState {
  const player = game.players.find((candidate) => candidate.seat === seat);
  if (!player) {
    throw new Error(`Unknown seat: ${seat}`);
  }
  return player;
}

export function getUserPlayer(game: GameState): PlayerState {
  const player = game.players.find((candidate) => candidate.isUser);
  if (!player) {
    throw new Error('Game has no user player.');
  }
  return player;
}

export function updatePlayer(
  game: GameState,
  seat: Seat,
  updater: (player: PlayerState) => PlayerState,
): GameState {
  return {
    ...game,
    players: game.players.map((player) => (player.seat === seat ? updater(player) : player)),
  };
}
