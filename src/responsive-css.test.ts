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

  it('hides inactive mobile workspaces and restores the full workspace on wider screens', () => {
    expect(css).toContain('.workspace-panel:not(.is-active)');
    expect(css).toContain('.mobile-workspace-nav');
    expect(css).toContain('.workspace-panel:not(.is-active) {');
    expect(css).toContain('display: contents');
    expect(css).toContain('.mobile-workspace-nav {\n    display: none;');
  });

  it('keeps mobile header and workspace tabs from forcing horizontal scrolling', () => {
    expect(css).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(css).toContain('flex-wrap: wrap');
    expect(css).toContain('min-width: 0');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('width: 100%');
    expect(css).toContain('.mobile-workspace-nav button');
  });

  it('uses a constrained mobile hand grid so hand tiles cannot widen the page', () => {
    expect(css).toContain('.hand-tiles {');
    expect(css).toContain('grid-template-columns: repeat(5, minmax(0, 1fr))');
    expect(css).toContain('.hand-tiles .tile-button');
  });

  it('switches to a wider tablet and desktop layout', () => {
    expect(css).toContain('grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr)');
    expect(css).toContain('@media (min-width: 1120px)');
    expect(css).toContain('grid-template-columns: minmax(0, 2fr) minmax(340px, 1fr)');
  });
});
