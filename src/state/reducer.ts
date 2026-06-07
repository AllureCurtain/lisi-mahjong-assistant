import {
  SEATS,
  addCount,
  countTiles,
  getPlayer,
  sameTile,
  tileCount,
  tileKey,
  updatePlayer,
  type GameState,
  type Meld,
  type MeldType,
  type PlayerState,
  type Seat,
  type Tile,
  type TileCounts,
} from '../domain';
import { canDeclareListeningByStandingDiscard, normalDiscardCandidates } from '../rules/lisiRules';
import { settleHand } from '../scoring/scoring';

export type GameAction =
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

function meldTileCopies(type: MeldType): number {
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

function removeCalledTilesFromUser(player: PlayerState, tile: Tile, copies: number): PlayerState {
  const concealedTiles = removeMatchingTiles(player.concealedTiles, tile, copies);
  if (!concealedTiles) {
    throw new Error(`User does not have enough ${tileKey(tile)} tiles for the call.`);
  }
  const standingTiles = removeMatchingTiles(
    player.standingTiles,
    tile,
    Math.min(copies, tileCount(countTiles(player.standingTiles), tile)),
  );
  return {
    ...player,
    concealedTiles,
    standingTiles: standingTiles ?? player.standingTiles,
  };
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
    for (const tile of user.standingTiles) {
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

function assertKnownCountsWithinLimit(counts: TileCounts): void {
  for (const [key, count] of Object.entries(counts)) {
    if ((count ?? 0) > 4) {
      throw new Error(`Known tile count for ${key} would exceed four copies.`);
    }
  }
}

function finalizeState(game: GameState): GameState {
  const knownSeenCounts = recomputeKnownSeenCounts(game);
  assertKnownCountsWithinLimit(knownSeenCounts);
  return { ...game, knownSeenCounts };
}

export function nextSeatCounterclockwise(seat: Seat): Seat {
  const index = SEATS.indexOf(seat);
  return SEATS[(index + 1) % SEATS.length];
}

function discardForCurrentActor(game: GameState, tile: Tile): GameState {
  const actor = getPlayer(game, game.currentActor);
  let updated = game;

  const userHandIsKnown = actor.concealedTiles.length > 0 || actor.standingTiles.length > 0;
  if (actor.isUser && (userHandIsKnown || actor.lockedAfterListening)) {
    if (actor.lockedAfterListening) {
      if (!actor.drawnTileAfterListening || !sameTile(actor.drawnTileAfterListening, tile)) {
        throw new Error('A locked listener must discard exactly the drawn tile.');
      }
      updated = updatePlayer(updated, actor.seat, (player) => ({
        ...player,
        drawnTileAfterListening: undefined,
      }));
    } else {
      const legalKeys = new Set(normalDiscardCandidates(actor.concealedTiles, actor.standingTiles).map(tileKey));
      if (!legalKeys.has(tileKey(tile))) {
        throw new Error('Cannot normally discard a protected standing tile before listening.');
      }
      const concealedTiles = removeOneTile(actor.concealedTiles, tile);
      if (!concealedTiles) {
        throw new Error(`User does not have ${tileKey(tile)} to discard.`);
      }
      updated = updatePlayer(updated, actor.seat, (player) => ({ ...player, concealedTiles }));
    }
  }

  return updatePlayer(updated, actor.seat, (player) => ({
    ...player,
    discards: [...player.discards, tile],
  }));
}

function ensureCanCall(player: PlayerState, callName: string): void {
  if (player.hasDeclaredListening || player.lockedAfterListening) {
    throw new Error(`Cannot ${callName} after listening.`);
  }
}

export function applyAction(game: GameState, action: GameAction): GameState {
  const withHistory = pushHistory(game);

  switch (action.type) {
    case 'visible-discard': {
      const discarded = discardForCurrentActor(withHistory, action.tile);
      return finalizeState({
        ...discarded,
        lastDiscard: { tile: action.tile, bySeat: withHistory.currentActor },
        phase: 'reaction',
      });
    }

    case 'no-call':
      return finalizeState({
        ...withHistory,
        currentActor: nextSeatCounterclockwise(withHistory.currentActor),
        lastDiscard: undefined,
        phase: 'waiting-visible-discard',
      });

    case 'pong': {
      if (!withHistory.lastDiscard) {
        throw new Error('Pong requires a last discard.');
      }
      const caller = getPlayer(withHistory, action.caller);
      ensureCanCall(caller, 'pong');
      let updated = removeLastDiscardFromRiver(withHistory);
      if (caller.isUser) {
        updated = updatePlayer(updated, action.caller, (player) =>
          removeCalledTilesFromUser(player, withHistory.lastDiscard!.tile, 2),
        );
      }
      updated = addMeldToPlayer(updated, action.caller, {
        type: 'pong',
        tile: withHistory.lastDiscard.tile,
        fromSeat: withHistory.lastDiscard.bySeat,
      });
      return finalizeState({
        ...updated,
        currentActor: action.caller,
        lastDiscard: undefined,
        phase: 'waiting-visible-discard',
      });
    }

    case 'exposed-kong': {
      if (!withHistory.lastDiscard) {
        throw new Error('Kong requires a last discard.');
      }
      const caller = getPlayer(withHistory, action.caller);
      ensureCanCall(caller, 'kong');
      let updated = removeLastDiscardFromRiver(withHistory);
      if (caller.isUser) {
        updated = updatePlayer(updated, action.caller, (player) =>
          removeCalledTilesFromUser(player, withHistory.lastDiscard!.tile, 3),
        );
      }
      updated = addMeldToPlayer(updated, action.caller, {
        type: 'exposed-kong',
        tile: withHistory.lastDiscard.tile,
        fromSeat: withHistory.lastDiscard.bySeat,
      });
      return finalizeState({
        ...updated,
        currentActor: action.caller,
        lastDiscard: undefined,
        phase: 'waiting-tail-draw-discard',
      });
    }

    case 'concealed-kong': {
      const caller = getPlayer(withHistory, action.caller);
      ensureCanCall(caller, 'kong');
      let updated = withHistory;
      if (caller.isUser) {
        updated = updatePlayer(updated, action.caller, (player) =>
          removeCalledTilesFromUser(player, action.tile, 4),
        );
      }
      updated = addMeldToPlayer(updated, action.caller, { type: 'concealed-kong', tile: action.tile });
      return finalizeState({ ...updated, currentActor: action.caller, phase: 'waiting-tail-draw-discard' });
    }

    case 'added-kong': {
      const caller = getPlayer(withHistory, action.caller);
      ensureCanCall(caller, 'kong');
      const updated = updatePlayer(withHistory, action.caller, (player) => {
        const melds = player.melds.map((meld) =>
          meld.type === 'pong' && sameTile(meld.tile, action.tile)
            ? { ...meld, type: 'added-kong' as const }
            : meld,
        );
        return {
          ...player,
          concealedTiles: player.isUser
            ? removeMatchingTiles(player.concealedTiles, action.tile, 1) ?? player.concealedTiles
            : player.concealedTiles,
          melds,
          exposedKongCount: player.exposedKongCount + 1,
        };
      });
      return finalizeState({ ...updated, currentActor: action.caller, phase: 'waiting-tail-draw-discard' });
    }

    case 'declare-listening': {
      const player = getPlayer(withHistory, action.seat);
      if (player.standingTiles.length === 0) {
        throw new Error('Cannot declare listening with no standing tile.');
      }
      const choices = canDeclareListeningByStandingDiscard({
        concealed: player.concealedTiles,
        standing: player.standingTiles,
        melds: player.melds,
      });
      if (!choices.some((choice) => choice.discardKey === tileKey(action.faceDownTile))) {
        throw new Error('Selected standing tile does not produce legal listening.');
      }
      const concealedTiles = removeOneTile(player.concealedTiles, action.faceDownTile);
      const standingTiles = removeOneTile(player.standingTiles, action.faceDownTile);
      if (!concealedTiles || !standingTiles) {
        throw new Error('Listening discard must be one remaining standing tile.');
      }
      const updated = updatePlayer(withHistory, action.seat, (current) => ({
        ...current,
        hasDeclaredListening: true,
        lockedAfterListening: true,
        concealedTiles,
        standingTiles,
        faceDownListeningDiscard: action.faceDownTile,
      }));
      return finalizeState({
        ...updated,
        currentActor: nextSeatCounterclockwise(action.seat),
        lastDiscard: undefined,
        phase: 'waiting-visible-discard',
      });
    }

    case 'user-draw': {
      const player = getPlayer(withHistory, withHistory.currentActor);
      if (!player.isUser) {
        throw new Error('Only the user draw is recorded exactly.');
      }
      const updated = updatePlayer(withHistory, player.seat, (current) =>
        current.lockedAfterListening
          ? { ...current, drawnTileAfterListening: action.tile }
          : { ...current, concealedTiles: [...current.concealedTiles, action.tile] },
      );
      return finalizeState({ ...updated, phase: 'user-discard-choice' });
    }

    case 'win': {
      const winner = getPlayer(withHistory, action.winner);
      if (!winner.hasDeclaredListening) {
        throw new Error('Cannot win before listening.');
      }
      const winType = action.winType ?? 'discard';
      if (winType === 'discard' && !action.discarder) {
        throw new Error('Discard win requires a discarder.');
      }
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
      return finalizeState({
        ...withHistory,
        currentActor: action.winner,
        phase: 'settlement',
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
