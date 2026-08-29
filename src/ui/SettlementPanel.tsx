import { SEATS, type Seat } from '../domain';

export interface SettlementPanelProps {
  scoreDelta?: Record<Seat, number>;
  cumulativeScores?: Record<Seat, number>;
  onSelfDraw: () => void;
  onDiscardWin: () => void;
}

function signedScore(score: number): string {
  return `${score > 0 ? '+' : ''}${score}`;
}

export function SettlementPanel({
  scoreDelta,
  cumulativeScores,
  onSelfDraw,
  onDiscardWin,
}: SettlementPanelProps) {
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
        <>
          <div className="score-grid">
            {SEATS.map((seat) => (
              <span key={seat}>
                {seat}: {signedScore(scoreDelta[seat])}
              </span>
            ))}
          </div>
          {cumulativeScores ? (
            <p className="muted">
              累计：{SEATS.map((seat) => `${seat} ${signedScore(cumulativeScores[seat] ?? 0)}`).join('，')}
            </p>
          ) : null}
        </>
      ) : (
        <p className="muted">胡牌后显示每家输赢分。</p>
      )}
    </section>
  );
}
