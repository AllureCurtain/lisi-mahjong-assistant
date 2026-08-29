import {
  SUITS,
  SUIT_CHINESE,
  addCount,
  countTiles,
  keysFromTiles,
  parseTileKey,
  remainingCopies,
  tileCount,
  tileChineseName,
  tileKey,
  type Meld,
  type Suit,
  type Tile,
  type TileCounts,
  type TileKey,
} from '../domain';
import {
  canDeclareListeningByStandingDiscard,
  isLegalLisiWin,
  normalDiscardCandidates,
  type ListeningChoice,
} from '../rules/lisiRules';
import { isCompleteDragonHand, isCompleteStandardHand } from '../rules/handEvaluator';

export interface DiscardRoute {
  missingSuit: Suit;
  shape: 'standard' | 'dragon' | 'standard-or-dragon';
  listeningChoiceCount: number;
  effectiveTileCount: number;
  winningKeyCount: number;
  feasible: boolean;
}

export type ListeningDistance = 0 | 1 | 2 | 3;

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
  distanceToListening: ListeningDistance;
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

function effectiveTileCount(winningKeys: Set<TileKey>, seenCounts: TileCounts): number {
  return Array.from(winningKeys).reduce(
    (sum, key) => sum + remainingCopies(parseTileKey(key), seenCounts),
    0,
  );
}

function uniqueTiles(tiles: Tile[]): Tile[] {
  return Array.from(new Set(keysFromTiles(tiles))).map((key) => parseTileKey(key));
}

function suitsOf(tiles: Tile[], melds: Meld[]): Set<Suit> {
  return new Set<Suit>([...tiles.map((tile) => tile.suit), ...melds.map((meld) => meld.tile.suit)]);
}

function routeShapeForChoice(
  eventualCounts: TileCounts,
  meldGroupCount: number,
  winningKeys: TileKey[],
): DiscardRoute['shape'] {
  let hasStandard = false;
  let hasDragon = false;
  for (const key of winningKeys.slice(0, 12)) {
    const withWin = addCount(eventualCounts, parseTileKey(key), 1);
    if (isCompleteStandardHand(withWin, meldGroupCount)) {
      hasStandard = true;
    }
    if (isCompleteDragonHand(withWin, meldGroupCount)) {
      hasDragon = true;
    }
  }
  if (hasStandard && hasDragon) {
    return 'standard-or-dragon';
  }
  if (hasDragon) {
    return 'dragon';
  }
  if (hasStandard) {
    return 'standard';
  }
  return 'standard-or-dragon';
}

function infeasibleRoute(missingSuit: Suit): DiscardRoute {
  return {
    missingSuit,
    shape: 'standard-or-dragon',
    listeningChoiceCount: 0,
    effectiveTileCount: 0,
    winningKeyCount: 0,
    feasible: false,
  };
}

function evaluateRoutes(
  remainingConcealed: Tile[],
  standing: Tile[],
  melds: Meld[],
  listeningChoices: ListeningChoice[],
  seenCounts: TileCounts,
): DiscardRoute[] {
  const meldGroupCount = melds.length;

  // The eventual winning hand excludes the standing tile that will be
  // discarded face-down when listening is declared.
  const eventualHands: Tile[][] =
    listeningChoices.length > 0
      ? listeningChoices.map((choice) => removeOneTile(remainingConcealed, parseTileKey(choice.discardKey)))
      : standing.length > 0
        ? uniqueTiles(standing)
            .map((standingTile) => removeOneTile(remainingConcealed, standingTile))
            .filter((hand): hand is Tile[] => hand !== undefined)
        : [remainingConcealed];
  const fallbackHands = eventualHands.length > 0 ? eventualHands : [remainingConcealed];

  return SUITS.map((missingSuit) => {
    const allowedSuits = new Set<Suit>(SUITS.filter((suit) => suit !== missingSuit));

    if (listeningChoices.length === 0) {
      const feasible = fallbackHands.some((hand) => {
        const used = suitsOf(hand, melds);
        return Array.from(used).every((suit) => allowedSuits.has(suit));
      });
      if (!feasible) {
        return infeasibleRoute(missingSuit);
      }
      return {
        missingSuit,
        shape: 'standard-or-dragon' as const,
        listeningChoiceCount: 0,
        effectiveTileCount: 0,
        winningKeyCount: 0,
        feasible: true,
      };
    }

    const compatibleChoices = listeningChoices
      .map((choice, index) => ({ choice, eventualHand: fallbackHands[index] }))
      .filter(({ eventualHand }) => {
        const used = suitsOf(eventualHand, melds);
        return Array.from(used).every((suit) => allowedSuits.has(suit));
      });

    if (compatibleChoices.length === 0) {
      return infeasibleRoute(missingSuit);
    }

    const winningKeys = Array.from(
      new Set(
        compatibleChoices
          .flatMap(({ choice }) => choice.winningKeys)
          .filter((key) => allowedSuits.has(parseTileKey(key).suit)),
      ),
    );
    const effective = effectiveTileCount(new Set(winningKeys), seenCounts);
    const shape = routeShapeForChoice(
      countTiles(compatibleChoices[0].eventualHand),
      meldGroupCount,
      winningKeys,
    );

    return {
      missingSuit,
      shape,
      listeningChoiceCount: compatibleChoices.length,
      effectiveTileCount: effective,
      winningKeyCount: winningKeys.length,
      feasible: true,
    } satisfies DiscardRoute;
  });
}

function bestRoute(routes: DiscardRoute[]): DiscardRoute | undefined {
  const feasible = routes.filter((route) => route.feasible);
  if (feasible.length === 0) {
    return undefined;
  }
  return [...feasible].sort(
    (a, b) =>
      b.listeningChoiceCount - a.listeningChoiceCount ||
      b.effectiveTileCount - a.effectiveTileCount ||
      SUITS.indexOf(a.missingSuit) - SUITS.indexOf(b.missingSuit),
  )[0];
}

export function distanceToListening(
  concealed: Tile[],
  standing: Tile[],
  melds: Meld[],
): ListeningDistance {
  if (standing.length === 0) {
    return 3;
  }
  if (canDeclareListeningByStandingDiscard({ concealed, standing, melds }).length > 0) {
    return 0;
  }
  for (const tile of uniqueTiles(concealed)) {
    const after = removeOneTile(concealed, tile);
    if (canDeclareListeningByStandingDiscard({ concealed: after, standing, melds }).length > 0) {
      return 1;
    }
  }
  return 2;
}

function distanceReason(distance: ListeningDistance): string {
  if (distance === 0) {
    return '打这张后即可扣立牌听牌';
  }
  if (distance === 1) {
    return '再进张调整后即可扣听';
  }
  if (distance === 2) {
    return '距听牌还有一段距离';
  }
  return '已无立牌，本局无法听牌';
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
      const routes = evaluateRoutes(
        remainingConcealed,
        input.standing,
        input.melds,
        listeningChoices,
        input.seenCounts,
      );
      const route = bestRoute(routes);
      const distance = distanceToListening(remainingConcealed, input.standing, input.melds);

      const warnings: string[] = [];
      if (input.opponentsListening > 0) {
        warnings.push(`${input.opponentsListening} 家已听牌，出牌需防点炮`);
      }
      if (listeningChoices.length === 0) {
        warnings.push('当前没有直接扣听的合法路线');
      }
      if (route && route.winningKeyCount > 0 && route.effectiveTileCount === 0) {
        warnings.push('胡牌张在已知牌中已耗尽');
      }
      if (!route) {
        warnings.push('三门花色齐全，缺门路线无法成立');
      }
      if (input.standing.length === 0) {
        warnings.push('已无立牌，本局无法听牌或胡牌');
      }

      const routeScore = route
        ? route.listeningChoiceCount * 10 + route.effectiveTileCount
        : 0;
      const distanceBonus = distance === 0 ? 6 : distance === 1 ? 2 : distance === 2 ? -4 : -30;
      const score =
        routeScore +
        distanceBonus +
        (input.standing.length > 0 ? 2 : -10) -
        (route ? 0 : 20) -
        input.opponentsListening * 2;

      const routeReasons = route
        ? [
            `缺${SUIT_CHINESE[route.missingSuit]}路线（${
              route.listeningChoiceCount > 0
                ? `${route.listeningChoiceCount} 种扣听选择`
                : '暂无直接扣听选择'
            }）`,
            `${route.effectiveTileCount} 张有效听牌余张`,
          ]
        : ['没有可用的缺门路线'];
      const reasons = [
        input.standing.length > 0 ? '立牌保留，仍可扣听' : '已无立牌，无法再听牌',
        ...routeReasons,
        distanceReason(distance),
      ];

      const fallbackRoute: DiscardRoute = {
        missingSuit: SUITS[0],
        shape: 'standard-or-dragon',
        listeningChoiceCount: 0,
        effectiveTileCount: 0,
        winningKeyCount: 0,
        feasible: false,
      };

      return {
        discardKey: tileKey(discard),
        route: route ?? fallbackRoute,
        distanceToListening: distance,
        score,
        effectiveTileCount: route?.effectiveTileCount ?? 0,
        warningLevel: warnings.length > 0 ? 'caution' : 'normal',
        reasons,
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
      reasons: ['听牌后手牌已锁定'],
      warnings: ['听牌后不能碰杠'],
    };
  }

  const availableCopies = tileCount(countTiles(input.concealed), input.discard);
  if (availableCopies < neededCopies) {
    return {
      kind,
      judgement: 'not-recommended',
      score: -50,
      reasons: [`手中需要 ${neededCopies} 张同牌`],
      warnings: ['手中同牌数量不足'],
    };
  }

  const standingCopies = tileCount(countTiles(input.standing), input.discard);
  const remainingStanding = input.standing.length - Math.min(standingCopies, neededCopies);
  const warnings: string[] = [];
  if (remainingStanding <= 0) {
    warnings.push('碰杠会耗尽最后一张立牌');
  }
  if (input.opponentsListening > 0) {
    warnings.push(`${input.opponentsListening} 家已听牌，有放炮风险`);
  }
  const score = 4 + (kind === 'kong' ? 2 : 0) + remainingStanding * 2 - warnings.length * 5;
  return {
    kind,
    judgement: warnings.length > 0 ? 'not-recommended' : score >= 6 ? 'recommend' : 'optional',
    score,
    reasons: [
      `手中已有 ${availableCopies} 张同牌`,
      remainingStanding > 0 ? '碰杠后仍保留立牌扣听' : '碰杠后无立牌，不能再听牌',
      kind === 'kong' ? '杠后可补牌，杠分仅在胡牌时计' : '碰后轮到自己出牌',
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
          '手中四张同牌可暗杠',
          wouldLeaveStanding ? '暗杠后仍保留立牌' : '暗杠会耗尽最后一张立牌',
        ],
      };
    });

  const addedKongs: SelfKongRecommendation[] = input.melds
    .filter((meld) => meld.type === 'pong' && tileCount(counts, meld.tile) > 0)
    .map((meld) => ({
      kind: 'added-kong',
      tileKey: tileKey(meld.tile),
      judgement: 'optional',
      reasons: ['已有碰牌可补杠', '杠分仅在胡牌时计'],
    }));

  return [...concealedKongs, ...addedKongs];
}

export function recommendAfterListening(
  input: AfterListeningRecommendationInput,
): AfterListeningRecommendation {
  if (!input.hasDeclaredListening) {
    return { mode: 'not-listening', reasons: ['尚未听牌，继续按常规推荐'] };
  }

  if (input.drawnTile) {
    const key = tileKey(input.drawnTile);
    const counts = { ...input.lockedCounts, [key]: (input.lockedCounts[key] ?? 0) + 1 };
    if (isLegalLisiWin({ counts, melds: input.melds, hasDeclaredListening: true })) {
      return {
        mode: 'self-draw-win',
        reasons: [`摸进的 ${tileChineseName(input.drawnTile)} 已成合法胡牌，可自摸结算`],
      };
    }
    return {
      mode: 'discard-drawn-tile',
      requiredDiscardKey: key,
      reasons: [`锁手后必须打出刚摸的 ${tileChineseName(input.drawnTile)}`],
    };
  }

  if (input.discardedTile) {
    const key = tileKey(input.discardedTile);
    const counts = { ...input.lockedCounts, [key]: (input.lockedCounts[key] ?? 0) + 1 };
    if (isLegalLisiWin({ counts, melds: input.melds, hasDeclaredListening: true })) {
      return {
        mode: 'discard-win',
        reasons: [`对手打出的 ${tileChineseName(input.discardedTile)} 可胡，可点炮结算`],
      };
    }
  }

  return { mode: 'waiting', reasons: ['等待胡牌：自摸或对手点炮'] };
}
