import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/index.css', 'utf8');

describe('responsive CSS guardrails', () => {
  it('prevents horizontal mobile overflow and uses dynamic viewport height', () => {
    expect(css).toContain('overflow-x: hidden');
    expect(css).toContain('min-height: 100dvh');
    expect(css).not.toContain('100vh');
  });

  it('keeps touch controls at least 44px tall', () => {
    expect(css).toMatch(/min-height:\s*44px/);
  });

  it('uses 3-column phone keypad and 9-column wider keypad', () => {
    expect(css).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(css).toContain('@media (min-width: 768px)');
    expect(css).toContain('grid-template-columns: repeat(9, minmax(0, 1fr))');
  });

  it('switches to a wider tablet and desktop layout', () => {
    expect(css).toContain('grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr)');
    expect(css).toContain('@media (min-width: 1120px)');
    expect(css).toContain('grid-template-columns: minmax(0, 2fr) minmax(340px, 1fr)');
  });
});
