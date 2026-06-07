import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  SEATS,
  countTiles,
  createInitialGame,
  getPlayer,
  getUserPlayer,
  parseTileKey,
  tilesFromKeys,
  updatePlayer,
  type GameState,
  type Seat,
  type Tile,
} from './domain';
import {
  recommendAfterListening,
  recommendCalls,
  recommendDiscards,
  recommendSelfKongs,
  type SelfKongRecommendation,
} from './recommendation/recommend';
import { canDeclareListeningByStandingDiscard } from './rules/lisiRules';
import { applyAction, recomputeKnownSeenCounts, undo } from './state/reducer';
import { CallAdvicePanel } from './ui/CallAdvicePanel';
import { DiscardRivers } from './ui/DiscardRivers';
import { HandView } from './ui/HandView';
import { ListeningPanel } from './ui/ListeningPanel';
import { MeldArea } from './ui/MeldArea';
import { PlayerStatus } from './ui/PlayerStatus';
import { ReactionStrip } from './ui/ReactionStrip';
import { RecommendationPanel } from './ui/RecommendationPanel';
import { SetupPanel } from './ui/SetupPanel';
import { SettlementPanel } from './ui/SettlementPanel';
import { TileKeypad } from './ui/TileKeypad';

const STORAGE_KEY = 'lisi-mahjong-assistant.recent-game.v1';

function createDemoGame(): GameState {
  const game = createInitialGame({ userSeat: 'A', dealerSeat: 'A' });
  const withUserHand = updatePlayer(game, 'A', (player) => ({
    ...player,
    concealedTiles: tilesFromKeys([
      'bing-1',
      'wan-1',
      'wan-2',
      'wan-3',
      'wan-4',
      'wan-5',
      'wan-6',
      'tiao-2',
      'tiao-3',
      'tiao-4',
      'tiao-7',
      'tiao-7',
      'tiao-7',
      'wan-9',
    ]),
    standingTiles: tilesFromKeys(['bing-1']),
  }));
  const ready = { ...withUserHand, phase: 'waiting-visible-discard' } satisfies GameState;
  return { ...ready, knownSeenCounts: recomputeKnownSeenCounts(ready) };
}

function loadInitialGame(): GameState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as GameState;
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return createDemoGame();
}

type UiAction =
  | { type: 'game'; game: GameState }
  | { type: 'apply'; action: Parameters<typeof applyAction>[1] }
  | { type: 'undo' };

function gameReducer(game: GameState, action: UiAction): GameState {
  if (action.type === 'game') {
    return action.game;
  }
  if (action.type === 'undo') {
    return undo(game);
  }
  return applyAction(game, action.action);
}

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, loadInitialGame);
  const [message, setMessage] = useState('准备记录本局。');
  const [tileEntryMode, setTileEntryMode] = useState<'discard' | 'hand' | 'standing'>('discard');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const user = getUserPlayer(game);
  const recommendations = useMemo(
    () =>
      recommendDiscards({
        concealed: user.concealedTiles,
        standing: user.standingTiles,
        melds: user.melds,
        seenCounts: game.knownSeenCounts,
        opponentsListening: game.players.filter((player) => !player.isUser && player.hasDeclaredListening).length,
      }),
    [game.knownSeenCounts, game.players, user.concealedTiles, user.melds, user.standingTiles],
  );
  const listeningChoices = useMemo(
    () =>
      user.lockedAfterListening
        ? []
        : canDeclareListeningByStandingDiscard({
            concealed: user.concealedTiles,
            standing: user.standingTiles,
            melds: user.melds,
          }),
    [user.concealedTiles, user.lockedAfterListening, user.melds, user.standingTiles],
  );
  const callAdvice = useMemo(
    () =>
      game.lastDiscard
        ? recommendCalls({
            concealed: user.concealedTiles,
            standing: user.standingTiles,
            melds: user.melds,
            seenCounts: game.knownSeenCounts,
            opponentsListening: game.players.filter((player) => !player.isUser && player.hasDeclaredListening).length,
            discard: game.lastDiscard.tile,
            hasDeclaredListening: user.hasDeclaredListening,
          })
        : {},
    [game.knownSeenCounts, game.lastDiscard, game.players, user.concealedTiles, user.hasDeclaredListening, user.melds, user.standingTiles],
  );
  const selfKongs = useMemo(
    () =>
      recommendSelfKongs({
        concealed: user.concealedTiles,
        standing: user.standingTiles,
        melds: user.melds,
        hasDeclaredListening: user.hasDeclaredListening,
      }),
    [user.concealedTiles, user.hasDeclaredListening, user.melds, user.standingTiles],
  );
  const afterListeningRecommendation = useMemo(
    () =>
      user.lockedAfterListening
        ? recommendAfterListening({
            lockedCounts: countTiles(user.concealedTiles),
            melds: user.melds,
            drawnTile: user.drawnTileAfterListening,
            discardedTile:
              game.lastDiscard && game.lastDiscard.bySeat !== user.seat ? game.lastDiscard.tile : undefined,
            hasDeclaredListening: user.hasDeclaredListening,
          })
        : undefined,
    [
      game.lastDiscard,
      user.concealedTiles,
      user.drawnTileAfterListening,
      user.hasDeclaredListening,
      user.lockedAfterListening,
      user.melds,
      user.seat,
    ],
  );

  function applyUiAction(action: Parameters<typeof applyAction>[1], successMessage: string) {
    try {
      dispatch({ type: 'apply', action });
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '动作无法记录。');
    }
  }

  function handleTileSelect(tile: Tile) {
    if (tileEntryMode === 'hand' || tileEntryMode === 'standing') {
      applyUiAction(
        { type: 'setup-user-tile', tile, standing: tileEntryMode === 'standing' },
        tileEntryMode === 'standing' ? '已录入立牌。' : '已录入手牌。',
      );
      return;
    }
    if (game.phase === 'waiting-user-draw') {
      applyUiAction({ type: 'user-draw', tile }, '已记录摸牌。');
      return;
    }
    if (game.phase === 'waiting-tail-draw-discard' && getPlayer(game, game.currentActor).isUser) {
      applyUiAction({ type: 'user-draw', tile }, '已记录杠后补牌。');
      return;
    }
    applyUiAction({ type: 'visible-discard', tile }, '已记录可见弃牌。');
  }

  function handlePong(seat: Seat) {
    applyUiAction({ type: 'pong', caller: seat }, `${seat} 碰。`);
  }

  function handleKong(seat: Seat) {
    applyUiAction({ type: 'exposed-kong', caller: seat }, `${seat} 杠，等待杠后出牌。`);
  }

  function handleSelfKong(item: SelfKongRecommendation) {
    const tile = parseTileKey(item.tileKey);
    if (item.kind === 'concealed-kong') {
      applyUiAction({ type: 'concealed-kong', caller: user.seat, tile }, '已记录暗杠，等待杠后补牌。');
      return;
    }
    applyUiAction({ type: 'added-kong', caller: user.seat, tile }, '已记录补杠，等待杠后补牌。');
  }

  function handleUndo() {
    dispatch({ type: 'undo' });
    setMessage('已撤销一步。');
  }

  function handleSeatChange(userSeat: Seat, dealerSeat: Seat) {
    dispatch({ type: 'game', game: createInitialGame({ userSeat, dealerSeat }) });
    setMessage('已更新座位设置。');
  }

  function handleReset() {
    const next = createDemoGame();
    dispatch({ type: 'game', game: next });
    setMessage('已重开本局。');
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>立四麻将助手</h1>
          <p>三人太原立四麻将实时记录与建议。</p>
        </div>
        <button className="secondary-action" onClick={handleUndo} type="button">
          撤销一步
        </button>
      </header>

      <div className="primary-column">
        <PlayerStatus game={game} />
        <SetupPanel
          game={game}
          tileEntryMode={tileEntryMode}
          onTileEntryModeChange={setTileEntryMode}
          onSeatChange={handleSeatChange}
          onMarkListening={(seat) => applyUiAction({ type: 'mark-listening', seat }, `已标记 ${seat} 听牌。`)}
          onReset={handleReset}
        />
        <HandView concealed={user.concealedTiles} standing={user.standingTiles} onTileSelect={handleTileSelect} />
        <ListeningPanel
          choices={listeningChoices}
          onDeclare={(choice) =>
            applyUiAction(
              { type: 'declare-listening', seat: user.seat, faceDownTile: parseTileKey(choice.discardKey) },
              `已扣 ${choice.discardKey} 听牌。`,
            )
          }
        />
        <TileKeypad onSelect={handleTileSelect} />
        <MeldArea game={game} />
        <ReactionStrip
          seats={SEATS}
          onNoCall={() => applyUiAction({ type: 'no-call' }, '无人响应，进入下一家。')}
          onPong={handlePong}
          onKong={handleKong}
          onWin={() =>
            applyUiAction(
              { type: 'win', winner: user.seat, winType: 'discard', discarder: game.lastDiscard?.bySeat },
              '进入结算。',
            )
          }
        />
        <DiscardRivers game={game} />
      </div>

      <aside className="side-column">
        <RecommendationPanel
          recommendations={recommendations}
          lockedAfterListening={user.lockedAfterListening}
          afterListening={afterListeningRecommendation}
        />
        <CallAdvicePanel callAdvice={callAdvice} selfKongs={selfKongs} onSelfKong={handleSelfKong} />
        <SettlementPanel
          scoreDelta={game.settlement?.scoreDelta}
          onSelfDraw={() => applyUiAction({ type: 'win', winner: user.seat, winType: 'self-draw' }, '已按自摸结算。')}
          onDiscardWin={() =>
            applyUiAction(
              {
                type: 'win',
                winner: user.seat,
                winType: 'discard',
                discarder: game.lastDiscard?.bySeat ?? 'B',
              },
              '已按点炮结算。',
            )
          }
        />
        <section className="message-panel" aria-label="操作消息">
          <h2>消息</h2>
          <p>{message}</p>
          <p className="muted">阶段：{game.phase}</p>
        </section>
      </aside>
      {game.settlement ? (
        <div className="modal-backdrop" role="presentation">
          <section className="settlement-dialog" role="dialog" aria-label="结算结果">
            <h2>结算结果</h2>
            <div className="score-grid">
              {SEATS.map((seat) => (
                <span key={seat}>
                  {seat}: {game.settlement!.scoreDelta[seat] > 0 ? '+' : ''}
                  {game.settlement!.scoreDelta[seat]}
                </span>
              ))}
            </div>
            <button className="secondary-action" onClick={handleReset} type="button">
              新一局
            </button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
