import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { createInitialGame, makeTile, tilesFromKeys, updatePlayer } from './domain';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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

  it('switches recommendation panel to locked-hand guidance after listening', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /扣 bing-1 听牌/ }));
    expect(screen.getByText(/锁手后不再显示手牌优化建议/)).toBeInTheDocument();
  });

  it('shows the exact drawn tile that a locked listener must discard', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'A', (player) => ({
      ...player,
      hasDeclaredListening: true,
      lockedAfterListening: true,
      concealedTiles: tilesFromKeys(['wan-1', 'wan-2', 'wan-3']),
      drawnTileAfterListening: makeTile('tiao', 5),
    }));
    game = { ...game, phase: 'user-discard-choice', currentActor: 'A' };
    window.localStorage.setItem('lisi-mahjong-assistant.recent-game.v1', JSON.stringify(game));
    render(<App />);
    expect(screen.getByText(/必须打 tiao-5/)).toBeInTheDocument();
  });

  it('records a user kong replacement draw from the tail-draw phase', async () => {
    const user = userEvent.setup();
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'A', (player) => ({
      ...player,
      concealedTiles: tilesFromKeys(['wan-1', 'wan-1', 'wan-1', 'wan-1', 'bing-1']),
      standingTiles: tilesFromKeys(['bing-1']),
    }));
    game = { ...game, phase: 'waiting-tail-draw-discard', currentActor: 'A' };
    window.localStorage.setItem('lisi-mahjong-assistant.recent-game.v1', JSON.stringify(game));
    render(<App />);
    await user.click(screen.getByRole('button', { name: '五条' }));
    expect(screen.getByText('已记录杠后补牌。')).toBeInTheDocument();
    expect(screen.getByText('阶段：user-discard-choice')).toBeInTheDocument();
  });

  it('records a recommended user concealed kong from the browser controls', async () => {
    const user = userEvent.setup();
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'A', (player) => ({
      ...player,
      concealedTiles: tilesFromKeys(['wan-1', 'wan-1', 'wan-1', 'wan-1', 'bing-1']),
      standingTiles: tilesFromKeys(['bing-1']),
    }));
    window.localStorage.setItem('lisi-mahjong-assistant.recent-game.v1', JSON.stringify(game));
    render(<App />);
    await user.click(screen.getByRole('button', { name: /暗杠 wan-1/ }));
    expect(screen.getByText('已记录暗杠，等待杠后补牌。')).toBeInTheDocument();
    expect(screen.getByText('阶段：waiting-tail-draw-discard')).toBeInTheDocument();
  });

  it('records a recommended user added kong from the browser controls', async () => {
    const user = userEvent.setup();
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = updatePlayer(game, 'A', (player) => ({
      ...player,
      concealedTiles: tilesFromKeys(['wan-1', 'bing-1']),
      standingTiles: tilesFromKeys(['bing-1']),
      melds: [{ type: 'pong', tile: makeTile('wan', 1), fromSeat: 'B' }],
    }));
    window.localStorage.setItem('lisi-mahjong-assistant.recent-game.v1', JSON.stringify(game));
    render(<App />);
    await user.click(screen.getByRole('button', { name: /补杠 wan-1/ }));
    expect(screen.getByText('已记录补杠，等待杠后补牌。')).toBeInTheDocument();
    expect(screen.getByText('阶段：waiting-tail-draw-discard')).toBeInTheDocument();
  });
});
