import { describe, expect, it } from 'vitest';
import { settleHand } from './scoring';

describe('scoring', () => {
  it('scores self-draw without kongs', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'B',
        winType: 'self-draw',
        winnerExposedKongs: 0,
        winnerConcealedKongs: 0,
      }),
    ).toEqual({ A: -20, B: 40, C: -20 });
  });

  it('scores self-draw with one exposed and one concealed kong', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'B',
        winType: 'self-draw',
        winnerExposedKongs: 1,
        winnerConcealedKongs: 1,
      }),
    ).toEqual({ A: -35, B: 70, C: -35 });
  });

  it('charges only non-listening discarder for discard win and kong bonuses', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'C',
        winType: 'discard',
        discarder: 'B',
        discarderHadDeclaredListening: false,
        winnerExposedKongs: 1,
        winnerConcealedKongs: 1,
      }),
    ).toEqual({ A: 0, B: -45, C: 45 });
  });

  it('splits listening discarder payment across both non-winners when dealer wins', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'A',
        winType: 'discard',
        discarder: 'B',
        discarderHadDeclaredListening: true,
        winnerExposedKongs: 1,
        winnerConcealedKongs: 0,
      }),
    ).toEqual({ A: 30, B: -15, C: -15 });
  });

  it('charges dealer 10 and the other non-winner 5 when non-dealer wins from listening discard', () => {
    expect(
      settleHand({
        seats: ['A', 'B', 'C'],
        dealer: 'A',
        winner: 'C',
        winType: 'discard',
        discarder: 'B',
        discarderHadDeclaredListening: true,
        winnerExposedKongs: 0,
        winnerConcealedKongs: 0,
      }),
    ).toEqual({ A: -10, B: -5, C: 15 });
  });
});
