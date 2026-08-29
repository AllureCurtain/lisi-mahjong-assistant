import { tileKeyChineseLabel } from './tileLabel';
import { suitChineseLabel } from './tileLabel';
import type { AfterListeningRecommendation, DiscardRecommendation } from '../recommendation/recommend';

export interface RecommendationPanelProps {
  recommendations: DiscardRecommendation[];
  lockedAfterListening?: boolean;
  afterListening?: AfterListeningRecommendation;
}

function afterListeningText(afterListening?: AfterListeningRecommendation): string {
  if (afterListening?.mode === 'self-draw-win') {
    return '锁手摸牌已成胡，可自摸结算。';
  }
  if (afterListening?.mode === 'discard-win') {
    return '对手弃牌可胡，可点炮结算。';
  }
  if (afterListening?.mode === 'discard-drawn-tile' && afterListening.requiredDiscardKey) {
    return `锁手后不再显示手牌优化建议，必须打 ${tileKeyChineseLabel(afterListening.requiredDiscardKey)}。`;
  }
  return '锁手后不再显示手牌优化建议，只记录摸牌后必须打出的那张牌。';
}

function routeShapeLabel(shape: DiscardRecommendation['route']['shape']): string {
  if (shape === 'standard') {
    return '标准路线';
  }
  if (shape === 'dragon') {
    return '龙牌路线';
  }
  return '标准/龙牌路线';
}

function routeLabel(route: DiscardRecommendation['route']): string {
  if (!route.feasible) {
    return '缺门路线不可行';
  }
  return `缺${suitChineseLabel[route.missingSuit]} · ${routeShapeLabel(route.shape)}`;
}

export function RecommendationPanel({
  recommendations,
  lockedAfterListening = false,
  afterListening,
}: RecommendationPanelProps) {
  const top = recommendations.slice(0, 3);
  return (
    <section className="recommendation-panel" aria-label="推荐">
      <h2>推荐</h2>
      {lockedAfterListening ? (
        <p>{afterListeningText(afterListening)}</p>
      ) : top.length > 0 ? (
        <ol className="recommendation-list">
          {top.map((item) => (
            <li key={item.discardKey}>
              <div className="recommendation-line">
                <strong>打 {tileKeyChineseLabel(item.discardKey)}</strong>
                <span>{routeLabel(item.route)}</span>
              </div>
              <p>{item.reasons.join('；')}</p>
              {item.warnings.length > 0 ? <p className="warning-text">{item.warnings.join('；')}</p> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p>录入手牌后显示出牌、碰杠和听牌建议。</p>
      )}
    </section>
  );
}
