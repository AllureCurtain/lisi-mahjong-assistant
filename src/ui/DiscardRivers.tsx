import type { GameState } from '../domain';
import { tileChineseLabel } from './TileButton';

export interface DiscardRiversProps {
  game: GameState;
}

export function DiscardRivers({ game }: DiscardRiversProps) {
  return (
    <section className="rivers-panel" aria-label="牌河">
      <h2>牌河</h2>
      <div className="river-grid">
        {game.players.map((player) => (
          <div className="river" key={player.seat}>
            <div className="river-title">{player.seat}</div>
            <div className="river-tiles">
              {player.discards.length > 0 ? (
                player.discards.map((tile, index) => (
                  <span className="river-tile" key={`${player.seat}-${tile.suit}-${tile.rank}-${index}`}>
                    {tileChineseLabel(tile)}
                  </span>
                ))
              ) : (
                <span className="muted">暂无</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
