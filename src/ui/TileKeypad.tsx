import { ALL_TILES, SUITS, type Tile } from '../domain';
import { TileButton } from './TileButton';

const suitTitle: Record<Tile['suit'], string> = {
  wan: '万',
  tiao: '条',
  bing: '饼',
};

export interface TileKeypadProps {
  onSelect: (tile: Tile) => void;
}

export function TileKeypad({ onSelect }: TileKeypadProps) {
  return (
    <section className="tile-keypad" aria-label="牌面输入">
      {SUITS.map((suit) => (
        <div className="tile-row" key={suit}>
          <div className="tile-row-label">{suitTitle[suit]}</div>
          <div className="tile-row-buttons">
            {ALL_TILES.filter((tile) => tile.suit === suit).map((tile) => (
              <TileButton key={`${tile.suit}-${tile.rank}`} tile={tile} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
