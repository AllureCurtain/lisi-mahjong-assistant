import type { GameState } from '../domain';

export interface PlayerStatusProps {
  game: GameState;
}

export function PlayerStatus({ game }: PlayerStatusProps) {
  return (
    <section className="status-panel" aria-label="牌局状态">
      <div>
        <span className="eyebrow">当前轮到</span>
        <strong className="current-actor">{game.currentActor}</strong>
      </div>
      <div className="player-chips">
        {game.players.map((player) => (
          <span className="player-chip" key={player.seat}>
            <strong>{player.seat}</strong>
            {player.isDealer ? <span>庄</span> : null}
            {player.hasDeclaredListening ? <span>听</span> : null}
            {player.isUser ? <span>我</span> : null}
          </span>
        ))}
      </div>
    </section>
  );
}
