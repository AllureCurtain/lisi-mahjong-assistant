import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ListeningChoice } from '../rules/lisiRules';
import { ListeningPanel } from './ListeningPanel';

describe('ListeningPanel', () => {
  it('shows chinese tile names for each legal listening choice', async () => {
    const user = userEvent.setup();
    const onDeclare = vi.fn();
    const choices: ListeningChoice[] = [
      { discardKey: 'bing-1', winningKeys: ['wan-9', 'tiao-6'] },
    ];
    render(<ListeningPanel choices={choices} onDeclare={onDeclare} />);

    await user.click(screen.getByRole('button', { name: /扣 一饼 听牌/ }));

    expect(screen.getByRole('button', { name: /胡 九万、六条/ })).toBeInTheDocument();
    expect(onDeclare).toHaveBeenCalledWith(choices[0]);
  });

  it('explains when no legal listening choice exists', () => {
    render(<ListeningPanel choices={[]} onDeclare={() => {}} />);
    expect(screen.getByText('当前没有合法扣立牌听牌选择。')).toBeInTheDocument();
  });
});
