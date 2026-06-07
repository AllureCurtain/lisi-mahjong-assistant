import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TileKeypad } from './TileKeypad';

describe('TileKeypad', () => {
  it('renders 27 tile buttons and emits selected tile', async () => {
    const onSelect = vi.fn();
    render(<TileKeypad onSelect={onSelect} />);
    expect(screen.getAllByRole('button')).toHaveLength(27);
    await userEvent.click(screen.getByRole('button', { name: '五条' }));
    expect(onSelect).toHaveBeenCalledWith({ suit: 'tiao', rank: 5 });
  });
});
