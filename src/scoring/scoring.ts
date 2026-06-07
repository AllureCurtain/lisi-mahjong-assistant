import type { Seat } from '../domain';

export type ScoreDelta = Record<Seat, number>;

export interface SettlementInput {
  seats: Seat[];
  dealer: Seat;
  winner: Seat;
  winType: 'self-draw' | 'discard';
  discarder?: Seat;
  discarderHadDeclaredListening?: boolean;
  winnerExposedKongs: number;
  winnerConcealedKongs: number;
}

function emptyScore(seats: Seat[]): ScoreDelta {
  return Object.fromEntries(seats.map((seat) => [seat, 0])) as ScoreDelta;
}

function add(delta: ScoreDelta, seat: Seat, points: number): void {
  delta[seat] += points;
}

function nonWinners(seats: Seat[], winner: Seat): Seat[] {
  return seats.filter((seat) => seat !== winner);
}

function kongBonusPerPayer(input: SettlementInput): number {
  return input.winnerExposedKongs * 5 + input.winnerConcealedKongs * 10;
}

export function settleHand(input: SettlementInput): ScoreDelta {
  const delta = emptyScore(input.seats);
  const bonusPerPayer = kongBonusPerPayer(input);

  if (input.winType === 'self-draw') {
    for (const payer of nonWinners(input.seats, input.winner)) {
      add(delta, payer, -(20 + bonusPerPayer));
      add(delta, input.winner, 20 + bonusPerPayer);
    }
    return delta;
  }

  if (!input.discarder) {
    throw new Error('Discard win requires discarder.');
  }

  const discarderListened = input.discarderHadDeclaredListening === true;
  if (!discarderListened) {
    const base = input.winner === input.dealer ? 20 : 15;
    const allKongBonusFromDiscarder = bonusPerPayer * 2;
    add(delta, input.discarder, -(base + allKongBonusFromDiscarder));
    add(delta, input.winner, base + allKongBonusFromDiscarder);
    return delta;
  }

  if (input.winner === input.dealer) {
    for (const payer of nonWinners(input.seats, input.winner)) {
      add(delta, payer, -(10 + bonusPerPayer));
      add(delta, input.winner, 10 + bonusPerPayer);
    }
    return delta;
  }

  for (const payer of nonWinners(input.seats, input.winner)) {
    const base = payer === input.dealer ? 10 : 5;
    add(delta, payer, -(base + bonusPerPayer));
    add(delta, input.winner, base + bonusPerPayer);
  }
  return delta;
}
