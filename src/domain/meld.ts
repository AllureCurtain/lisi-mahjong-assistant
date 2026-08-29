import type { Tile } from './tile';

export type Seat = 'A' | 'B' | 'C';
export const SEATS: Seat[] = ['A', 'B', 'C'];

export type MeldType = 'pong' | 'exposed-kong' | 'concealed-kong' | 'added-kong';

export const MELD_TYPE_CHINESE: Record<MeldType, string> = {
  pong: '碰',
  'exposed-kong': '明杠',
  'concealed-kong': '暗杠',
  'added-kong': '补杠',
};

export interface Meld {
  type: MeldType;
  tile: Tile;
  fromSeat?: Seat;
}
