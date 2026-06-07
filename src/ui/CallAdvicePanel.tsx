import type {
  CallRecommendations,
  SelfKongRecommendation,
} from '../recommendation/recommend';

export interface CallAdvicePanelProps {
  callAdvice: CallRecommendations;
  selfKongs: SelfKongRecommendation[];
  onSelfKong: (item: SelfKongRecommendation) => void;
}

export function CallAdvicePanel({ callAdvice, selfKongs, onSelfKong }: CallAdvicePanelProps) {
  const callItems = [callAdvice.pong, callAdvice.kong].filter((item) => item !== undefined);

  return (
    <section className="call-panel" aria-label="碰杠建议">
      <h2>碰杠建议</h2>
      {callItems.length > 0 || selfKongs.length > 0 ? (
        <div className="plain-list">
          {callItems.map((item) => (
            <p key={item.kind}>
              <strong>{item.kind}</strong>：{item.judgement}，{item.reasons.join('；')}
            </p>
          ))}
          {selfKongs.map((item) => (
            <div className="kong-advice" key={`${item.kind}-${item.tileKey}`}>
              <button onClick={() => onSelfKong(item)} type="button">
                {item.kind === 'concealed-kong' ? '暗杠' : '补杠'} {item.tileKey}
              </button>
              <p>
                <strong>{item.kind}</strong>：{item.judgement}，{item.reasons.join('；')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">有可碰、可杠或自杠机会时显示建议。</p>
      )}
    </section>
  );
}
