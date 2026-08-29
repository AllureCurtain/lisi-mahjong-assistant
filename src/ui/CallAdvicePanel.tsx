import type {
  CallAdvice,
  CallRecommendations,
  SelfKongRecommendation,
} from '../recommendation/recommend';
import { tileKeyChineseLabel } from './tileLabel';

export interface CallAdvicePanelProps {
  callAdvice: CallRecommendations;
  selfKongs: SelfKongRecommendation[];
  onSelfKong: (item: SelfKongRecommendation) => void;
}

const kindChineseLabel: Record<CallAdvice['kind'], string> = {
  pong: '碰',
  kong: '杠',
};

const judgementChineseLabel: Record<CallAdvice['judgement'], string> = {
  recommend: '建议',
  optional: '可选',
  'not-recommended': '不建议',
};

const selfKongJudgementChineseLabel: Record<SelfKongRecommendation['judgement'], string> = {
  recommend: '建议',
  optional: '可选',
  'not-recommended': '不建议',
};

export function CallAdvicePanel({ callAdvice, selfKongs, onSelfKong }: CallAdvicePanelProps) {
  const callItems = [callAdvice.pong, callAdvice.kong].filter((item) => item !== undefined);

  return (
    <section className="call-panel" aria-label="碰杠建议">
      <h2>碰杠建议</h2>
      {callItems.length > 0 || selfKongs.length > 0 ? (
        <div className="plain-list">
          {callItems.map((item) => (
            <p key={item.kind}>
              <strong>{kindChineseLabel[item.kind]}</strong>：{judgementChineseLabel[item.judgement]}
              ，{item.reasons.join('；')}
              {item.warnings.length > 0 ? (
                <span className="warning-text">（{item.warnings.join('；')}）</span>
              ) : null}
            </p>
          ))}
          {selfKongs.map((item) => (
            <div className="kong-advice" key={`${item.kind}-${item.tileKey}`}>
              <button onClick={() => onSelfKong(item)} type="button">
                {item.kind === 'concealed-kong' ? '暗杠' : '补杠'} {tileKeyChineseLabel(item.tileKey)}
              </button>
              <p>
                <strong>{item.kind === 'concealed-kong' ? '暗杠' : '补杠'}</strong>：
                {selfKongJudgementChineseLabel[item.judgement]}，{item.reasons.join('；')}
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
