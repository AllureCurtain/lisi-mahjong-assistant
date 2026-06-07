import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('shows automatic turn status, recommendations, reactions, and undo', () => {
    render(<App />);
    expect(screen.getByText('立四麻将助手')).toBeInTheDocument();
    expect(screen.getByText(/当前轮到/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '推荐' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '无人要' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '撤销一步' })).toBeInTheDocument();
  });
});
