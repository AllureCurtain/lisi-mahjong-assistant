import {
  SEATS,
  addCount,
  countTiles,
  emptyCumulativeScores,
  getPlayer,
  nextSeatCounterclockwise,
  sameTile,
  tileChineseName,
  tileKey,
  tileKeyChineseName,
  updatePlayer,
  type GameState,
  type Meld,
  type PlayerState,
  type Seat,
  type Tile,
  type TileCounts,
  type TileKey,
} from '../domain';
import {
  canDeclareListeningByStandingDiscard,
  isLegalLisiWin,
  normalDiscardCandidates,
} from '../rules/lisiRules';
import { settleHand } from '../scoring/scoring';

export type GameAction =
  | { type: 'setup-user-tile'; tile: Tile; standing: boolean }
  | { type: 'mark-listening'; seat: Seat }
  | { type: 'visible-discard'; tile: Tile }
  | { type: 'no-call' }
  | { type: 'pong'; caller: Seat }
  | { type: 'exposed-kong'; caller: Seat }
  | { type: 'concealed-kong'; caller: Seat; tile: Tile }
  | { type: 'added-kong'; caller: Seat; tile: Tile }
  | { type: 'declare-listening'; seat: Seat; faceDownTile: Tile }
  | { type: 'user-draw'; tile: Tile }
  | {
      type: 'win';
      winner: Seat;
      winType?: 'self-draw' | 'discard';
      discarder?: Seat;
      discarderHadDeclaredListening?: boolean;
    };

export interface ApplyActionOptions {
  force?: boolean;
}

interface ApplyContext {
  force: boolean;
  violations: string[];
}

function fail(context: ApplyContext, message: string): void {
  if (context.force) {
    context.violations.push(message);
    return;
  }
  throw new Error(message);
}

function actionChineseLabel(action: GameAction): string {
  switch (action.type) {
    case 'setup-user-tile':
      return action.standing ? `录入立牌 ${tileChineseName(action.tile)}` : `录入手牌 ${tileChineseName(action.tile)}`;
    case 'mark-listening':
      return `标记 ${action.seat} 听牌`;
    case 'visible-discard':
      return `记录弃牌 ${tileChineseName(action.tile)}`;
    case 'no-call':
      return '无人响应';
    case 'pong':
      return `${action.caller} 碰`;
    case 'exposed-kong':
      return `${action.caller} 杠`;
    case 'concealed-kong':
      return `${action.caller} 暗杠 ${tileChineseName(action.tile)}`;
    case 'added-kong':
      return `${action.caller} 补杠 ${tileChineseName(action.tile)}`;
    case 'declare-listening':
      return `${action.seat} 扣 ${tileChineseName(action.faceDownTile)} 听牌`;
    case 'user-draw':
      return `记录摸牌 ${tileChineseName(action.tile)}`;
    case 'win':
      return `${action.winner} ${action.winType === 'self-draw' ? '自摸' : '点炮'}胡`;
  }
}

function meldTileCopies(type: Meld['type']): number {
  return type === 'pong' ? 3 : 4;
}

function pushHistory(game: GameState): GameState {
  return {
    ...game,
    actionHistory: [...game.actionHistory, { ...game, actionHistory: [] }],
  };
}

function removeOneTile(tiles: Tile[], target: Tile): Tile[] | undefined {
  let removed = false;
  const next = tiles.filter((tile) => {
    if (!removed && sameTile(tile, target)) {
      removed = true;
      return false;
    }
    return true;
  });
  return removed ? next : undefined;
}

function removeMatchingTiles(tiles: Tile[], target: Tile, copies: number): Tile[] | undefined {
  let removed = 0;
  const next = tiles.filter((tile) => {
    if (removed < copies && sameTile(tile, target)) {
      removed += 1;
      return false;
    }
    return true;
  });
  return removed === copies ? next : undefined;
}

interface CalledTileRemoval {
  concealedTiles: Tile[];
  standingTiles: Tile[];
}

function removeCalledTilesFromUser(player: PlayerState, tile: Tile, copies: number): CalledTileRemoval | undefined {
  const concealedTiles = removeMatchingTiles(player.concealedTiles, tile, copies);
  if (!concealedTiles) {
    return undefined;
  }
  const standingTiles = removeMatchingTiles(
    player.standingTiles,
    tile,
    Math.min(copies, tileCountSafe(player.standingTiles, tile)),
  );
  return { concealedTiles, standingTiles: standingTiles ?? player.standingTiles };
}

function tileCountSafe(tiles: Tile[], target: Tile): number {
  return countTiles(tiles)[tileKey(target)] ?? 0;
}

function removeLastDiscardFromRiver(game: GameState): GameState {
  if (!game.lastDiscard) {
    return game;
  }
  return updatePlayer(game, game.lastDiscard.bySeat, (player) => {
    const discards = [...player.discards];
    let index = -1;
    for (let candidateIndex = discards.length - 1; candidateIndex >= 0; candidateIndex -= 1) {
      if (sameTile(discards[candidateIndex], game.lastDiscard!.tile)) {
        index = candidateIndex;
        break;
      }
    }
    if (index >= 0) {
      discards.splice(index, 1);
    }
    return { ...player, discards };
  });
}

function addMeldToPlayer(game: GameState, seat: Seat, meld: Meld): GameState {
  return updatePlayer(game, seat, (player) => ({
    ...player,
    melds: [...player.melds, meld],
    exposedKongCount:
      meld.type === 'exposed-kong' || meld.type === 'added-kong'
        ? player.exposedKongCount + 1
        : player.exposedKongCount,
    concealedKongCount:
      meld.type === 'concealed-kong' ? player.concealedKongCount + 1 : player.concealedKongCount,
  }));
}

export function recomputeKnownSeenCounts(game: GameState): TileCounts {
  let counts: TileCounts = {};
  const user = game.players.find((player) => player.isUser);
  if (user) {
    for (const tile of user.concealedTiles) {
      counts = addCount(counts, tile, 1);
    }
    if (user.faceDownListeningDiscard) {
      counts = addCount(counts, user.faceDownListeningDiscard, 1);
    }
    if (user.drawnTileAfterListening) {
      counts = addCount(counts, user.drawnTileAfterListening, 1);
    }
  }

  for (const player of game.players) {
    for (const tile of player.discards) {
      counts = addCount(counts, tile, 1);
    }
    for (const meld of player.melds) {
      for (let index = 0; index < meldTileCopies(meld.type); index += 1) {
        counts = addCount(counts, meld.tile, 1);
      }
    }
  }
  return counts;
}

function assertKnownCountsWithinLimit(context: ApplyContext, counts: TileCounts): void {
  for (const [key, count] of Object.entries(counts)) {
    if ((count ?? 0) > 4) {
      fail(context, `已知牌中 ${tileKeyChineseName(key as TileKey)} 超过四张。`);
    }
  }
}

function finalizeState(context: ApplyContext, game: GameState): GameState {
  const knownSeenCounts = recomputeKnownSeenCounts(game);
  assertKnownCountsWithinLimit(context, knownSeenCounts);
  return { ...game, knownSeenCounts };
}

function discardForCurrentActor(context: ApplyContext, game: GameState, tile: Tile): GameState {
  const actor = getPlayer(game, game.currentActor);
  let updated = game;

  const userHandIsKnown = actor.concealedTiles.length > 0 || actor.standingTiles.length > 0;
  if (actor.isUser && (userHandIsKnown || actor.lockedAfterListening)) {
    if (actor.lockedAfterListening) {
      if (!actor.drawnTileAfterListening || !sameTile(actor.drawnTileAfterListening, tile)) {
        fail(context, '锁手听牌后必须打出刚摸的那张牌。');
      }
      updated = updatePlayer(updated, actor.seat, (player) => ({
        ...player,
        drawnTileAfterListening: undefined,
      }));
    } else {
      const legalKeys = new Set(
        normalDiscardCandidates(actor.concealedTiles, actor.standingTiles).map(tileKey),
      );
      if (!legalKeys.has(tileKey(tile))) {
        fail(context, '听牌前立牌不能普通打出。');
      }
      const concealedTiles = removeOneTile(actor.concealedTiles, tile);
      if (!concealedTiles) {
        fail(context, `手中没有 ${tileChineseName(tile)} 可打。`);
      } else {
        updated = updatePlayer(updated, actor.seat, (player) => ({ ...player, concealedTiles }));
      }
    }
  }

  return updatePlayer(updated, actor.seat, (player) => ({
    ...player,
    discards: [...player.discards, tile],
  }));
}

function ensureCanCall(context: ApplyContext, player: PlayerState, callName: string): void {
  if (player.hasDeclaredListening || player.lockedAfterListening) {
    fail(context, `听牌后不能再${callName}。`);
  }
}

function assertKnownUserWinIsLegal(
  context: ApplyContext,
  game: GameState,
  winner: PlayerState,
  winType: 'self-draw' | 'discard',
): void {
  if (!winner.isUser) {
    return;
  }

  let counts = countTiles(winner.concealedTiles);
  if (winType === 'self-draw') {
    if (!winner.drawnTileAfterListening) {
      fail(context, '自摸结算前需先记录摸到的牌。');
    } else {
      counts = addCount(counts, winner.drawnTileAfterListening, 1);
    }
  } else {
    if (!game.lastDiscard) {
      fail(context, '点炮结算前需先记录对手弃牌。');
    } else {
      counts = addCount(counts, game.lastDiscard.tile, 1);
    }
  }

  if (!isLegalLisiWin({ counts, melds: winner.melds, hasDeclaredListening: true })) {
    fail(context, '当前手牌不是合法的立四胡牌。');
  }
}

function applyActionIn(context: ApplyContext, game: GameState, action: GameAction): GameState {
  const withHistory = pushHistory(game);

  switch (action.type) {
    case 'setup-user-tile': {
      const user = withHistory.players.find((player) => player.isUser);
      if (!user) {
        throw new Error('牌局中没有用户座位。');
      }
      const updated = updatePlayer(withHistory, user.seat, (player) => ({
        ...player,
        concealedTiles: [...player.concealedTiles, action.tile],
        standingTiles: action.standing ? [...player.standingTiles, action.tile] : player.standingTiles,
      }));
      return finalizeState(context, updated);
    }

    case 'mark-listening': {
      const updated = updatePlayer(withHistory, action.seat, (player) => ({
        ...player,
        hasDeclaredListening: true,
        lockedAfterListening: player.isUser ? player.lockedAfterListening : false,
      }));
      return finalizeState(context, updated);
    }

    case 'visible-discard': {
      const discarded = discardForCurrentActor(context, withHistory, action.tile);
      return finalizeState(context, {
        ...discarded,
        lastDiscard: { tile: action.tile, bySeat: withHistory.currentActor },
        phase: 'reaction',
      });
    }

    case 'no-call':
      {
        const nextActor = nextSeatCounterclockwise(withHistory.currentActor);
        const nextPlayer = getPlayer(withHistory, nextActor);
        return finalizeState(context, {
          ...withHistory,
          currentActor: nextActor,
          lastDiscard: undefined,
          phase: nextPlayer.isUser ? 'waiting-user-draw' : 'waiting-visible-discard',
        });
      }

    case 'pong': {
      if (!withHistory.lastDiscard) {
        throw new Error('当前没有可碰的弃牌。');
      }
      const caller = getPlayer(withHistory, action.caller);
      ensureCanCall(context, caller, '碰');
      let updated = removeLastDiscardFromRiver(withHistory);
      if (caller.isUser) {
        const removal = removeCalledTilesFromUser(caller, withHistory.lastDiscard.tile, 2);
        if (!removal) {
          fail(context, `手中没有足够的 ${tileChineseName(withHistory.lastDiscard.tile)} 用于碰。`);
        } else {
          updated = updatePlayer(updated, action.caller, (player) => ({ ...player, ...removal }));
        }
      }
      updated = addMeldToPlayer(updated, action.caller, {
        type: 'pong',
        tile: withHistory.lastDiscard.tile,
        fromSeat: withHistory.lastDiscard.bySeat,
      });
      return finalizeState(context, {
        ...updated,
        currentActor: action.caller,
        lastDiscard: undefined,
        phase: 'waiting-visible-discard',
      });
    }

    case 'exposed-kong': {
      if (!withHistory.lastDiscard) {
        throw new Error('当前没有可杠的弃牌。');
      }
      const caller = getPlayer(withHistory, action.caller);
      ensureCanCall(context, caller, '杠');
      let updated = removeLastDiscardFromRiver(withHistory);
      if (caller.isUser) {
        const removal = removeCalledTilesFromUser(caller, withHistory.lastDiscard.tile, 3);
        if (!removal) {
          fail(context, `手中没有足够的 ${tileChineseName(withHistory.lastDiscard.tile)} 用于杠。`);
        } else {
          updated = updatePlayer(updated, action.caller, (player) => ({ ...player, ...removal }));
        }
      }
      updated = addMeldToPlayer(updated, action.caller, {
        type: 'exposed-kong',
        tile: withHistory.lastDiscard.tile,
        fromSeat: withHistory.lastDiscard.bySeat,
      });
      return finalizeState(context, {
        ...updated,
        currentActor: action.caller,
        lastDiscard: undefined,
        phase: 'waiting-tail-draw-discard',
      });
    }

    case 'concealed-kong': {
      const caller = getPlayer(withHistory, action.caller);
      ensureCanCall(context, caller, '杠');
      let updated = withHistory;
      if (caller.isUser) {
        const removal = removeCalledTilesFromUser(caller, action.tile, 4);
        if (!removal) {
          fail(context, `手中没有四张 ${tileChineseName(action.tile)} 用于暗杠。`);
        } else {
          updated = updatePlayer(updated, action.caller, (player) => ({ ...player, ...removal }));
        }
      }
      updated = addMeldToPlayer(updated, action.caller, { type: 'concealed-kong', tile: action.tile });
      return finalizeState(context, {
        ...updated,
        currentActor: action.caller,
        phase: 'waiting-tail-draw-discard',
      });
    }

    case 'added-kong': {
      const caller = getPlayer(withHistory, action.caller);
      ensureCanCall(context, caller, '杠');
      const hasMatchingPong = caller.melds.some(
        (meld) => meld.type === 'pong' && sameTile(meld.tile, action.tile),
      );
      if (!hasMatchingPong) {
        throw new Error('补杠需要已有对应的碰牌。');
      }
      const updated = updatePlayer(withHistory, action.caller, (player) => {
        const basePlayer =
          player.isUser
            ? (() => {
                const removal = removeCalledTilesFromUser(player, action.tile, 1);
                if (!removal) {
                  fail(context, `手中没有 ${tileChineseName(action.tile)} 用于补杠。`);
                  return player;
                }
                return { ...player, ...removal };
              })()
            : player;
        const melds = basePlayer.melds.map((meld) =>
          meld.type === 'pong' && sameTile(meld.tile, action.tile)
            ? { ...meld, type: 'added-kong' as const }
            : meld,
        );
        return {
          ...basePlayer,
          melds,
          exposedKongCount: basePlayer.exposedKongCount + 1,
        };
      });
      return finalizeState(context, {
        ...updated,
        currentActor: action.caller,
        phase: 'waiting-tail-draw-discard',
      });
    }

    case 'declare-listening': {
      const player = getPlayer(withHistory, action.seat);
      if (player.standingTiles.length === 0) {
        fail(context, '没有立牌，不能扣听。');
      }
      const choices = canDeclareListeningByStandingDiscard({
        concealed: player.concealedTiles,
        standing: player.standingTiles,
        melds: player.melds,
      });
      if (!choices.some((choice) => choice.discardKey === tileKey(action.faceDownTile))) {
        fail(context, '所选立牌不能形成合法听牌。');
      }
      const concealedTiles = removeOneTile(player.concealedTiles, action.faceDownTile);
      const standingTiles = removeOneTile(player.standingTiles, action.faceDownTile);
      if (!concealedTiles) {
        throw new Error('手中没有这张牌，无法扣听。');
      }
      const updated = updatePlayer(withHistory, action.seat, (current) => ({
        ...current,
        hasDeclaredListening: true,
        lockedAfterListening: true,
        concealedTiles,
        standingTiles: standingTiles ?? current.standingTiles,
        faceDownListeningDiscard: action.faceDownTile,
      }));
      return finalizeState(context, {
        ...updated,
        currentActor: nextSeatCounterclockwise(action.seat),
        lastDiscard: undefined,
        phase: 'waiting-visible-discard',
      });
    }

    case 'user-draw': {
      const player = getPlayer(withHistory, withHistory.currentActor);
      if (!player.isUser) {
        throw new Error('只能逐张记录用户自己的摸牌。');
      }
      const updated = updatePlayer(withHistory, player.seat, (current) =>
        current.lockedAfterListening
          ? { ...current, drawnTileAfterListening: action.tile }
          : { ...current, concealedTiles: [...current.concealedTiles, action.tile] },
      );
      return finalizeState(context, { ...updated, phase: 'user-discard-choice' });
    }

    case 'win': {
      const winner = getPlayer(withHistory, action.winner);
      if (!winner.hasDeclaredListening) {
        fail(context, '必须先听牌才能胡。');
      }
      const winType = action.winType ?? 'discard';
      if (winType === 'discard' && !action.discarder) {
        throw new Error('点炮结算需要指定放炮者。');
      }
      assertKnownUserWinIsLegal(context, withHistory, winner, winType);
      const discarderHadDeclaredListening =
        action.discarderHadDeclaredListening ??
        (action.discarder ? getPlayer(withHistory, action.discarder).hasDeclaredListening : false);
      const scoreDelta = settleHand({
        seats: SEATS,
        dealer: withHistory.players.find((player) => player.isDealer)?.seat ?? 'A',
        winner: action.winner,
        winType,
        discarder: action.discarder,
        discarderHadDeclaredListening,
        winnerExposedKongs: winner.exposedKongCount,
        winnerConcealedKongs: winner.concealedKongCount,
      });
      const previousScores = withHistory.cumulativeScores ?? emptyCumulativeScores();
      const cumulativeScores = Object.fromEntries(
        SEATS.map((seat) => [seat, (previousScores[seat] ?? 0) + scoreDelta[seat]]),
      ) as Record<Seat, number>;
      return finalizeState(context, {
        ...withHistory,
        currentActor: action.winner,
        phase: 'settlement',
        cumulativeScores,
        settlement: {
          winner: action.winner,
          winType,
          discarder: action.discarder,
          scoreDelta,
        },
      });
    }
  }
}

export function applyAction(
  game: GameState,
  action: GameAction,
  options?: ApplyActionOptions,
): GameState {
  const context: ApplyContext = { force: options?.force === true, violations: [] };
  const next = applyActionIn(context, game, action);
  if (context.violations.length > 0) {
    const label = actionChineseLabel(action);
    return {
      ...next,
      forcedEvents: [
        ...(next.forcedEvents ?? []),
        `强制记录：${label}（跳过校验：${context.violations.join('；')}）`,
      ],
    };
  }
  return next;
}

export { nextSeatCounterclockwise };

export function undo(game: GameState): GameState {
  const previous = game.actionHistory.at(-1);
  if (!previous) {
    return game;
  }
  return {
    ...previous,
    actionHistory: game.actionHistory.slice(0, -1),
  };
}
