import {
  SUITS,
  addCount,
  countTiles,
  keysFromTiles,
  parseTileKey,
  remainingCopies,
  tileCount,
  tileKey,
  type Meld,
  type Suit,
  type Tile,
  type TileCounts,
  type TileKey,
} from '../domain';
import {
  canDeclareListeningByStandingDiscard,
  hasExactlyTwoSuits,
  normalDiscardCandidates,
} from '../rules/lisiRules';
import { isLegalLisiWin } from '../rules/lisiRules';
import { isCompleteDragonHand, isCompleteStandardHand } from '../rules/handEvaluator';

export interface DiscardRoute {
  missingSuit: Suit;
  shape: 'standard' | 'dragon' | 'standard-or-dragon';
}

export interface DiscardRecommendationInput {
  concealed: Tile[];
  standing: Tile[];
  melds: Meld[];
  seenCounts: TileCounts;
  opponentsListening: number;
}

export interface DiscardRecommendation {
  discardKey: TileKey;
  route: DiscardRoute;
  score: number;
  effectiveTileCount: number;
  warningLevel: 'normal' | 'caution';
  reasons: string[];
  warnings: string[];
}

export interface CallRecommendationInput extends DiscardRecommendationInput {
  discard: Tile;
  hasDeclaredListening: boolean;
}

export interface CallAdvice {
  kind: 'pong' | 'kong';
  judgement: 'recommend' | 'optional' | 'not-recommended';
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface CallRecommendations {
  pong?: CallAdvice;
  kong?: CallAdvice;
}

export interface SelfKongRecommendationInput {
  concealed: Tile[];
  standing: Tile[];
  melds: Meld[];
  hasDeclaredListening: boolean;
}

export interface SelfKongRecommendation {
  kind: 'concealed-kong' | 'added-kong';
  tileKey: TileKey;
  judgement: 'recommend' | 'optional' | 'not-recommended';
  reasons: string[];
}

export interface AfterListeningRecommendationInput {
  lockedCounts: TileCounts;
  melds: Meld[];
  drawnTile?: Tile;
  discardedTile?: Tile;
  hasDeclaredListening: boolean;
}

export interface AfterListeningRecommendation {
  mode: 'not-listening' | 'self-draw-win' | 'discard-win' | 'discard-drawn-tile' | 'waiting';
  requiredDiscardKey?: TileKey;
  reasons: string[];
}

function removeOneTile(tiles: Tile[], target: Tile): Tile[] {
  let removed = false;
  return tiles.filter((tile) => {
    if (!removed && tileKey(tile) === tileKey(target)) {
      removed = true;
      return false;
    }
    return true;
  });
}

function routeForTiles(tiles: Tile[], melds: Meld[]): DiscardRoute {
  const suits = new Set<Suit>([...tiles.map((tile) => tile.suit), ...melds.map((meld) => meld.tile.suit)]);
  const missingSuit = SUITS.find((suit) => !suits.has(suit)) ?? SUITS[0];
  return { missingSuit, shape: 'standard-or-dragon' };
}

function routeAfterListeningChoice(
  tiles: Tile[],
  standing: Tile[],
  melds: Meld[],
  listeningChoices: ReturnType<typeof canDeclareListeningByStandingDiscard>,
): DiscardRoute {
  const firstChoice = listeningChoices[0];
  if (!firstChoice) {
    return routeForTiles(tiles, melds);
  }
  const standingDiscard = standing.find((tile) => tileKey(tile) === firstChoice.discardKey);
  const afterStandingDiscard = standingDiscard ? removeOneTile(tiles, standingDiscard) : tiles;
  const baseRoute = routeForTiles(afterStandingDiscard, melds);
  const counts = countTiles(afterStandingDiscard);
  const hasStandard = firstChoice.winningKeys.some((key) =>
    isCompleteStandardHand(addCount(counts, parseTileKey(key), 1), melds.length),
  );
  const hasDragon = firstChoice.winningKeys.some((key) =>
    isCompleteDragonHand(addCount(counts, parseTileKey(key), 1), melds.length),
  );
  const shape =
    hasStandard && hasDragon
      ? 'standard-or-dragon'
      : hasDragon
        ? 'dragon'
        : hasStandard
          ? 'standard'
          : baseRoute.shape;
  return { ...baseRoute, shape };
}

function effectiveTileCount(winningKeys: Set<TileKey>, seenCounts: TileCounts): number {
  return Array.from(winningKeys).reduce(
    (sum, key) => sum + remainingCopies(parseTileKey(key), seenCounts),
    0,
  );
}

function uniqueTiles(tiles: Tile[]): Tile[] {
  return Array.from(new Set(keysFromTiles(tiles))).map((key) => parseTileKey(key));
}

export function recommendDiscards(input: DiscardRecommendationInput): DiscardRecommendation[] {
  const candidates = uniqueTiles(normalDiscardCandidates(input.concealed, input.standing));

  return candidates
    .map((discard) => {
      const remainingConcealed = removeOneTile(input.concealed, discard);
      const listeningChoices = canDeclareListeningByStandingDiscard({
        concealed: remainingConcealed,
        standing: input.standing,
        melds: input.melds,
      });
      const winningKeys = new Set(listeningChoices.flatMap((choice) => choice.winningKeys));
      const effective = effectiveTileCount(winningKeys, input.seenCounts);
      const warnings: string[] = [];
      if (input.opponentsListening > 0) {
        warnings.push(`${input.opponentsListening} opponent listening risk`);
      }
      if (listeningChoices.length === 0) {
        warnings.push('no immediate legal listening path');
      }
      if (winningKeys.size > 0 && effective === 0) {
        warnings.push('winning tiles appear exhausted in known tiles');
      }

      const keepsTwoSuitRoute =
        hasExactlyTwoSuits(remainingConcealed, input.melds) || listeningChoices.length > 0;
      const riskPenalty = input.opponentsListening * 2;
      const score =
        listeningChoices.length * 10 +
        effective +
        (keepsTwoSuitRoute ? 2 : -5) +
        (input.standing.length > 0 ? 2 : -10) -
        riskPenalty;

      return {
        discardKey: tileKey(discard),
        route: routeAfterListeningChoice(
          remainingConcealed,
          input.standing,
          input.melds,
          listeningChoices,
        ),
        score,
        effectiveTileCount: effective,
        warningLevel: warnings.length > 0 ? 'caution' : 'normal',
        reasons: [
          input.standing.length > 0
            ? 'standing tile remains available for listening'
            : 'no standing tile remains',
          `${listeningChoices.length} listening choices`,
          `${effective} effective known-remaining tiles`,
        ],
        warnings,
      } satisfies DiscardRecommendation;
    })
    .sort((a, b) => b.score - a.score || b.effectiveTileCount - a.effectiveTileCount);
}

function callAdvice(
  kind: 'pong' | 'kong',
  input: CallRecommendationInput,
  neededCopies: number,
): CallAdvice {
  if (input.hasDeclaredListening) {
    return {
      kind,
      judgement: 'not-recommended',
      score: -100,
      reasons: ['hand is locked after listening'],
      warnings: ['cannot call after listening'],
    };
  }

  const availableCopies = tileCount(countTiles(input.concealed), input.discard);
  if (availableCopies < neededCopies) {
    return {
      kind,
      judgement: 'not-recommended',
      score: -50,
      reasons: [`need ${neededCopies} matching concealed tiles`],
      warnings: ['not enough matching tiles'],
    };
  }

  const standingCopies = tileCount(countTiles(input.standing), input.discard);
  const remainingStanding = input.standing.length - Math.min(standingCopies, neededCopies);
  const warnings: string[] = [];
  if (remainingStanding <= 0) {
    warnings.push('call would leave no standing tile for listening');
  }
  if (input.opponentsListening > 0) {
    warnings.push('opponent listening risk');
  }
  const score = 4 + (kind === 'kong' ? 2 : 0) + remainingStanding * 2 - warnings.length * 5;
  return {
    kind,
    judgement: warnings.length > 0 ? 'not-recommended' : score >= 6 ? 'recommend' : 'optional',
    score,
    reasons: [
      `${availableCopies} matching concealed tiles`,
      remainingStanding > 0
        ? 'standing tile remains available for listening'
        : 'no standing tile remains after call',
      kind === 'kong' ? 'kong adds tail draw and possible winner-only bonus' : 'pong jumps turn to caller',
    ],
    warnings,
  };
}

export function recommendCalls(input: CallRecommendationInput): CallRecommendations {
  return {
    pong: callAdvice('pong', input, 2),
    kong: callAdvice('kong', input, 3),
  };
}

export function recommendSelfKongs(input: SelfKongRecommendationInput): SelfKongRecommendation[] {
  if (input.hasDeclaredListening) {
    return [];
  }

  const counts = countTiles(input.concealed);
  const concealedKongs: SelfKongRecommendation[] = (Object.entries(counts) as [
    TileKey,
    number | undefined,
  ][])
    .filter(([, count]) => (count ?? 0) >= 4)
    .map(([key]) => {
      const standingCopies = tileCount(countTiles(input.standing), parseTileKey(key));
      const wouldLeaveStanding = input.standing.length - standingCopies > 0;
      return {
        kind: 'concealed-kong',
        tileKey: key,
        judgement: wouldLeaveStanding ? 'optional' : 'not-recommended',
        reasons: [
          'four concealed copies are available',
          wouldLeaveStanding
            ? 'standing tile remains available for listening'
            : 'kong would consume the last standing tile',
        ],
      };
    });

  const addedKongs: SelfKongRecommendation[] = input.melds
    .filter((meld) => meld.type === 'pong' && tileCount(counts, meld.tile) > 0)
    .map((meld) => ({
      kind: 'added-kong',
      tileKey: tileKey(meld.tile),
      judgement: 'optional',
      reasons: ['existing pong can be upgraded with the fourth tile', 'kong bonus scores only if user wins'],
    }));

  return [...concealedKongs, ...addedKongs];
}

export function recommendAfterListening(input: AfterListeningRecommendationInput): AfterListeningRecommendation {
  if (!input.hasDeclaredListening) {
    return { mode: 'not-listening', reasons: ['player has not declared listening'] };
  }

  if (input.drawnTile) {
    const key = tileKey(input.drawnTile);
    const counts = { ...input.lockedCounts, [key]: (input.lockedCounts[key] ?? 0) + 1 };
    if (isLegalLisiWin({ counts, melds: input.melds, hasDeclaredListening: true })) {
      return { mode: 'self-draw-win', reasons: [`drawn ${key} completes a legal Lisi win`] };
    }
    return {
      mode: 'discard-drawn-tile',
      requiredDiscardKey: key,
      reasons: [`locked listener must discard drawn ${key}`],
    };
  }

  if (input.discardedTile) {
    const key = tileKey(input.discardedTile);
    const counts = { ...input.lockedCounts, [key]: (input.lockedCounts[key] ?? 0) + 1 };
    if (isLegalLisiWin({ counts, melds: input.melds, hasDeclaredListening: true })) {
      return { mode: 'discard-win', reasons: [`discarded ${key} completes a legal Lisi win`] };
    }
  }

  return { mode: 'waiting', reasons: ['waiting for a winning draw or discard'] };
}
