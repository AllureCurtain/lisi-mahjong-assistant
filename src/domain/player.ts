import type { Meld, Seat } from './meld';
import type { Tile } from './tile';

export interface PlayerState {
  seat: Seat;
  isUser: boolean;
  isDealer: boolean;
  hasDeclaredListening: boolean;
  lockedAfterListening: boolean;
  concealedTiles: Tile[];
  standingTiles: Tile[];
  faceDownListeningDiscard?: Tile;
  melds: Meld[];
  discards: Tile[];
  exposedKongCount: number;
  concealedKongCount: number;
}

export interface CreatePlayerInput {
  seat: Seat;
  isUser: boolean;
  isDealer: boolean;
  concealedTiles?: Tile[];
  standingTiles?: Tile[];
}

export function createPlayer(input: CreatePlayerInput): PlayerState {
  return {
    seat: input.seat,
    isUser: input.isUser,
    isDealer: input.isDealer,
    hasDeclaredListening: false,
    lockedAfterListening: false,
    concealedTiles: input.concealedTiles ?? [],
    standingTiles: input.standingTiles ?? [],
    melds: [],
    discards: [],
    exposedKongCount: 0,
    concealedKongCount: 0,
  };
}
