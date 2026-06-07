import { SEATS, type Seat } from '../domain';

export interface SettlementPanelProps {
  scoreDelta?: Record<Seat, number>;
  onSelfDraw: () => void;
  onDiscardWin: () => void;
}

export function SettlementPanel({ scoreDelta, onSelfDraw, onDiscardWin }: SettlementPanelProps) {
  return (
    <section className="settlement-panel" aria-label="结算">
      <h2>结算</h2>
      <div className="action-list two-up">
        <button onClick={onSelfDraw} type="button">
          自摸结算
        </button>
        <button onClick={onDiscardWin} type="button">
          点炮结算
        </button>
      </div>
      {scoreDelta ? (
        <div className="score-grid">
          {SEATS.map((seat) => (
            <span key={seat}>
              {seat}: {scoreDelta[seat] > 0 ? '+' : ''}
              {scoreDelta[seat]}
            </span>
          ))}
        </div>
      ) : (
        <p className="muted">胡牌后显示每家输赢分。</p>
      )}
    </section>
  );
}
