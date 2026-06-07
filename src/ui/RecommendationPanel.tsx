import type { DiscardRecommendation } from '../recommendation/recommend';

export interface RecommendationPanelProps {
  recommendations: DiscardRecommendation[];
}

export function RecommendationPanel({ recommendations }: RecommendationPanelProps) {
  const top = recommendations.slice(0, 3);
  return (
    <section className="recommendation-panel" aria-label="推荐">
      <h2>推荐</h2>
      {top.length > 0 ? (
        <ol className="recommendation-list">
          {top.map((item) => (
            <li key={item.discardKey}>
              <div className="recommendation-line">
                <strong>打 {item.discardKey}</strong>
                <span>缺 {item.route.missingSuit}</span>
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
