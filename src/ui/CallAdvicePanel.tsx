import type {
  CallRecommendations,
  SelfKongRecommendation,
} from '../recommendation/recommend';

export interface CallAdvicePanelProps {
  callAdvice: CallRecommendations;
  selfKongs: SelfKongRecommendation[];
}

export function CallAdvicePanel({ callAdvice, selfKongs }: CallAdvicePanelProps) {
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
            <p key={`${item.kind}-${item.tileKey}`}>
              <strong>{item.kind}</strong> {item.tileKey}：{item.judgement}，{item.reasons.join('；')}
            </p>
          ))}
        </div>
      ) : (
        <p className="muted">有可碰、可杠或自杠机会时显示建议。</p>
      )}
    </section>
  );
}
