import type { GameState, Seat } from '../domain';

export interface SetupPanelProps {
  game: GameState;
  tileEntryMode: 'discard' | 'hand' | 'standing';
  onTileEntryModeChange: (mode: 'discard' | 'hand' | 'standing') => void;
  onSeatChange: (userSeat: Seat, dealerSeat: Seat) => void;
  onMarkListening: (seat: Seat) => void;
  onReset: () => void;
}

export function SetupPanel({
  game,
  tileEntryMode,
  onTileEntryModeChange,
  onSeatChange,
  onMarkListening,
  onReset,
}: SetupPanelProps) {
  const userSeat = game.players.find((player) => player.isUser)?.seat ?? 'A';
  const dealerSeat = game.players.find((player) => player.isDealer)?.seat ?? 'A';

  return (
    <section className="setup-panel" aria-label="设置">
      <h2>设置</h2>
      <div className="form-grid">
        <label>
          我的座位
          <select
            value={userSeat}
            onChange={(event) => onSeatChange(event.target.value as Seat, dealerSeat)}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </label>
        <label>
          庄家
          <select
            value={dealerSeat}
            onChange={(event) => onSeatChange(userSeat, event.target.value as Seat)}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </label>
      </div>
      <div className="segmented-control" aria-label="点牌模式">
        <button
          className={tileEntryMode === 'discard' ? 'is-active' : ''}
          onClick={() => onTileEntryModeChange('discard')}
          type="button"
        >
          记弃牌
        </button>
        <button
          className={tileEntryMode === 'hand' ? 'is-active' : ''}
          onClick={() => onTileEntryModeChange('hand')}
          type="button"
        >
          录手牌
        </button>
        <button
          className={tileEntryMode === 'standing' ? 'is-active' : ''}
          onClick={() => onTileEntryModeChange('standing')}
          type="button"
        >
          录立牌
        </button>
      </div>
      <div className="action-list three-up">
        {game.players
          .filter((player) => !player.isUser)
          .map((player) => (
            <button key={player.seat} onClick={() => onMarkListening(player.seat)} type="button">
              标记 {player.seat} 听牌
            </button>
          ))}
      </div>
      <button className="secondary-action" onClick={onReset} type="button">
        重开本局
      </button>
    </section>
  );
}
