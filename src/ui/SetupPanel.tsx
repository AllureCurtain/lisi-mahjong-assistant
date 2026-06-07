import type { GameState, Seat } from '../domain';

export interface SetupPanelProps {
  game: GameState;
  onSeatChange: (userSeat: Seat, dealerSeat: Seat) => void;
  onReset: () => void;
}

export function SetupPanel({ game, onSeatChange, onReset }: SetupPanelProps) {
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
      <button className="secondary-action" onClick={onReset} type="button">
        重开本局
      </button>
    </section>
  );
}
