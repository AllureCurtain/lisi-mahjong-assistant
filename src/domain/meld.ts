import type { Tile } from './tile';

export type Seat = 'A' | 'B' | 'C';
export const SEATS: Seat[] = ['A', 'B', 'C'];

export type MeldType = 'pong' | 'exposed-kong' | 'concealed-kong' | 'added-kong';

export interface Meld {
  type: MeldType;
  tile: Tile;
  fromSeat?: Seat;
}
