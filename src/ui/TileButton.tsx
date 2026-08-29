import type { Tile } from '../domain';
import { tileChineseLabel } from './tileLabel';

export { tileChineseLabel };

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
