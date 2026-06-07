import type { GameState } from '../domain';
import { tileChineseLabel } from './TileButton';

export interface MeldAreaProps {
  game: GameState;
}

export function MeldArea({ game }: MeldAreaProps) {
  const melds = game.players.flatMap((player) =>
    player.melds.map((meld, index) => ({ ...meld, owner: player.seat, index })),
  );

  return (
    <section className="meld-panel" aria-label="副露">
      <h2>副露</h2>
      {melds.length > 0 ? (
        <div className="meld-list">
          {melds.map((meld) => (
            <span className="meld-item" key={`${meld.owner}-${meld.type}-${meld.index}`}>
              {meld.owner} {meld.type} {tileChineseLabel(meld.tile)}
            </span>
          ))}
        </div>
      ) : (
        <p className="muted">暂无碰杠副露。</p>
      )}
    </section>
  );
}
