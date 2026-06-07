import type { Tile } from '../domain';

const suitLabel: Record<Tile['suit'], string> = {
  wan: '万',
  tiao: '条',
  bing: '饼',
};

const rankLabel: Record<Tile['rank'], string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
  9: '九',
};

export function tileChineseLabel(tile: Tile): string {
  return `${rankLabel[tile.rank]}${suitLabel[tile.suit]}`;
}

export interface TileButtonProps {
  tile: Tile;
  onSelect: (tile: Tile) => void;
  disabled?: boolean;
  variant?: 'normal' | 'standing' | 'drawn';
}

export function TileButton({ tile, onSelect, disabled = false, variant = 'normal' }: TileButtonProps) {
  return (
    <button
      className={`tile-button tile-button-${variant}`}
      disabled={disabled}
      onClick={() => onSelect(tile)}
      type="button"
    >
      {tileChineseLabel(tile)}
    </button>
  );
}
