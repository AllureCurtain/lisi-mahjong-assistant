import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettlementPanel } from './SettlementPanel';

describe('SettlementPanel', () => {
  it('shows per-seat deltas and cumulative scores after settlement', async () => {
    const user = userEvent.setup();
    const onSelfDraw = vi.fn();
    render(
      <SettlementPanel
        scoreDelta={{ A: 40, B: -20, C: -20 }}
        cumulativeScores={{ A: 55, B: -30, C: -25 }}
        onSelfDraw={onSelfDraw}
        onDiscardWin={() => {}}
      />,
    );

    expect(screen.getByText('A: +40')).toBeInTheDocument();
    expect(screen.getByText('B: -20')).toBeInTheDocument();
    expect(screen.getByText(/累计：A \+55，B -30，C -25/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '自摸结算' }));
    expect(onSelfDraw).toHaveBeenCalledTimes(1);
  });

  it('prompts for settlement before a hand ends', () => {
    render(
      <SettlementPanel scoreDelta={undefined} cumulativeScores={{ A: 0, B: 0, C: 0 }} onSelfDraw={() => {}} onDiscardWin={() => {}} />,
    );
    expect(screen.getByText('胡牌后显示每家输赢分。')).toBeInTheDocument();
  });
});
