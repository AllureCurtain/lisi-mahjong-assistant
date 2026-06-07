import type { ListeningChoice } from '../rules/lisiRules';

export interface ListeningPanelProps {
  choices: ListeningChoice[];
  onDeclare: (choice: ListeningChoice) => void;
}

export function ListeningPanel({ choices, onDeclare }: ListeningPanelProps) {
  return (
    <section className="listening-panel" aria-label="听牌">
      <h2>听牌</h2>
      {choices.length > 0 ? (
        <div className="action-list">
          {choices.map((choice) => (
            <button key={choice.discardKey} onClick={() => onDeclare(choice)} type="button">
              扣 {choice.discardKey} 听牌，胡 {choice.winningKeys.join('、')}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">当前没有合法扣立牌听牌选择。</p>
      )}
    </section>
  );
}
