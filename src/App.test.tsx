import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('shows automatic turn status, recommendations, reactions, and undo', () => {
    render(<App />);
    expect(screen.getByText('立四麻将助手')).toBeInTheDocument();
    expect(screen.getByText(/当前轮到/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '推荐' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '设置' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '听牌' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '碰杠建议' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '副露' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '结算' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '录手牌' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '录立牌' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '标记 B 听牌' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '无人要' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '撤销一步' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /扣 bing-1 听牌/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '自摸结算' })).toBeInTheDocument();
  });

  it('shows settlement as a dialog after a valid self-draw settlement', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /扣 bing-1 听牌/ }));
    await user.click(screen.getByRole('button', { name: '自摸结算' }));
    expect(screen.getByRole('dialog', { name: '结算结果' })).toBeInTheDocument();
  });
});
