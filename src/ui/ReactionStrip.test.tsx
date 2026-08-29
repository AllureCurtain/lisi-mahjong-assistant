import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReactionStrip } from './ReactionStrip';

describe('ReactionStrip', () => {
  it('renders no-call, pong, kong, and win controls for every seat', () => {
    render(
      <ReactionStrip seats={['A', 'B', 'C']} onNoCall={() => {}} onPong={() => {}} onKong={() => {}} onWin={() => {}} />,
    );
    expect(screen.getByRole('button', { name: '无人要' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B碰' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'C杠' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '胡' })).toBeInTheDocument();
  });

  it('emits the caller seat for pong and kong presses', async () => {
    const user = userEvent.setup();
    const onPong = vi.fn();
    const onKong = vi.fn();
    const onNoCall = vi.fn();
    const onWin = vi.fn();
    render(
      <ReactionStrip seats={['A', 'B', 'C']} onNoCall={onNoCall} onPong={onPong} onKong={onKong} onWin={onWin} />,
    );

    await user.click(screen.getByRole('button', { name: 'C碰' }));
    await user.click(screen.getByRole('button', { name: 'A杠' }));
    await user.click(screen.getByRole('button', { name: '无人要' }));
    await user.click(screen.getByRole('button', { name: '胡' }));

    expect(onPong).toHaveBeenCalledWith('C');
    expect(onKong).toHaveBeenCalledWith('A');
    expect(onNoCall).toHaveBeenCalledTimes(1);
    expect(onWin).toHaveBeenCalledTimes(1);
  });
});
