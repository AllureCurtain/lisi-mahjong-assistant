import {
  MELD_TYPE_CHINESE,
  SUIT_CHINESE,
  tileChineseName,
  tileKeyChineseName,
  type MeldType,
  type Suit,
  type Tile,
  type TileKey,
} from '../domain';

export const suitChineseLabel = SUIT_CHINESE;

export const meldTypeChineseLabel = MELD_TYPE_CHINESE;

export function tileChineseLabel(tile: Tile): string {
  return tileChineseName(tile);
}

export function tileKeyChineseLabel(key: TileKey): string {
  return tileKeyChineseName(key);
}

export type { MeldType, Suit };
