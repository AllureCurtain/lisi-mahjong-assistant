import { SUITS, type Tile } from '../domain';
import { TileButton } from './TileButton';

const suitTitle: Record<Tile['suit'], string> = {
  wan: '万',
  tiao: '条',
  bing: '饼',
};

export interface HandViewProps {
  concealed: Tile[];
  standing: Tile[];
  onTileSelect: (tile: Tile) => void;
}

export function HandView({ concealed, standing, onTileSelect }: HandViewProps) {
  const standingKeys = new Map<string, number>();
  for (const tile of standing) {
    const key = `${tile.suit}-${tile.rank}`;
    standingKeys.set(key, (standingKeys.get(key) ?? 0) + 1);
  }

  return (
    <section className="hand-panel" aria-label="我的手牌">
      <h2>我的手牌</h2>
      {SUITS.map((suit) => (
        <div className="hand-suit" key={suit}>
          <span>{suitTitle[suit]}</span>
          <div className="hand-tiles">
            {concealed
              .filter((tile) => tile.suit === suit)
              .map((tile, index) => {
                const key = `${tile.suit}-${tile.rank}`;
                const protectedCount = standingKeys.get(key) ?? 0;
                if (protectedCount > 0) {
                  standingKeys.set(key, protectedCount - 1);
                }
                return (
                  <TileButton
                    key={`${key}-${index}`}
                    tile={tile}
                    onSelect={onTileSelect}
                    variant={protectedCount > 0 ? 'standing' : 'normal'}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </section>
  );
}
