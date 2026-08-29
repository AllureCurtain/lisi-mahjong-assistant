import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createInitialGame, updatePlayer } from '../domain';
import { PlayerStatus } from './PlayerStatus';

describe('PlayerStatus', () => {
  it('shows the hand number, dealer, listening, and user markers', () => {
    let game = createInitialGame({ userSeat: 'B', dealerSeat: 'C' });
    game = updatePlayer(game, 'B', (player) => ({ ...player, hasDeclaredListening: true }));
    game = { ...game, handNumber: 3 };

    render(<PlayerStatus game={game} />);

    expect(screen.getByText('第 3 局')).toBeInTheDocument();
    expect(screen.getByText('当前轮到')).toBeInTheDocument();
    const dealerChip = screen.getByText('C', { selector: '.player-chip strong' }).closest('.player-chip');
    expect(dealerChip).not.toBeNull();
    expect(dealerChip).toHaveTextContent('庄');
    const userChip = screen.getByText('B', { selector: '.player-chip strong' }).closest('.player-chip');
    expect(userChip).toHaveTextContent('听');
    expect(userChip).toHaveTextContent('我');
  });

  it('shows signed cumulative scores per seat', () => {
    let game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
    game = { ...game, cumulativeScores: { A: 40, B: -20, C: -20 } };

    render(<PlayerStatus game={game} />);

    const userChip = screen.getByText('A', { selector: '.player-chip strong' }).closest('.player-chip');
    expect(userChip).toHaveTextContent('+40');
    const losingChip = screen.getByText('B', { selector: '.player-chip strong' }).closest('.player-chip');
    expect(losingChip).toHaveTextContent('-20');
  });
});
