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
  cumulativeScores: Record<Seat, number>;
  handNumber: number;
  forcedEvents: string[];
}

export interface CreateInitialGameInput {
  userSeat: Seat;
  dealerSeat: Seat;
}

export function nextSeatCounterclockwise(seat: Seat): Seat {
  const index = SEATS.indexOf(seat);
  return SEATS[(index + 1) % SEATS.length];
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
    cumulativeScores: { A: 0, B: 0, C: 0 },
    handNumber: 1,
    forcedEvents: [],
  };
}

export function emptyCumulativeScores(): Record<Seat, number> {
  return { A: 0, B: 0, C: 0 };
}

export function normalizeGameState(raw: GameState): GameState {
  return {
    ...raw,
    cumulativeScores: raw.cumulativeScores ?? emptyCumulativeScores(),
    handNumber: raw.handNumber ?? 1,
    forcedEvents: raw.forcedEvents ?? [],
  };
}

export function dealerForNextHand(previousDealer: Seat, winner?: Seat): Seat {
  if (winner && winner === previousDealer) {
    return previousDealer;
  }
  return nextSeatCounterclockwise(previousDealer);
}

export function createNextHand(previous: GameState): GameState {
  const previousDealer = previous.players.find((player) => player.isDealer)?.seat ?? 'A';
  const userSeat = previous.players.find((player) => player.isUser)?.seat ?? 'A';
  const next = createInitialGame({
    userSeat,
    dealerSeat: dealerForNextHand(previousDealer, previous.settlement?.winner),
  });
  return {
    ...next,
    cumulativeScores: previous.cumulativeScores ?? emptyCumulativeScores(),
    handNumber: (previous.handNumber ?? 1) + 1,
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
