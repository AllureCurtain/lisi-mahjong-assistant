import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  SEATS,
  createInitialGame,
  getUserPlayer,
  tilesFromKeys,
  updatePlayer,
  type GameState,
  type Seat,
  type Tile,
} from './domain';
import { recommendDiscards } from './recommendation/recommend';
import { applyAction, undo } from './state/reducer';
import { DiscardRivers } from './ui/DiscardRivers';
import { HandView } from './ui/HandView';
import { PlayerStatus } from './ui/PlayerStatus';
import { ReactionStrip } from './ui/ReactionStrip';
import { RecommendationPanel } from './ui/RecommendationPanel';
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
  return { ...withUserHand, phase: 'waiting-visible-discard' };
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

  function applyUiAction(action: Parameters<typeof applyAction>[1], successMessage: string) {
    try {
      dispatch({ type: 'apply', action });
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '动作无法记录。');
    }
  }

  function handleTileSelect(tile: Tile) {
    if (game.phase === 'waiting-user-draw') {
      applyUiAction({ type: 'user-draw', tile }, '已记录摸牌。');
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

  function handleUndo() {
    dispatch({ type: 'undo' });
    setMessage('已撤销一步。');
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
        <HandView concealed={user.concealedTiles} standing={user.standingTiles} onTileSelect={handleTileSelect} />
        <TileKeypad onSelect={handleTileSelect} />
        <ReactionStrip
          seats={SEATS}
          onNoCall={() => applyUiAction({ type: 'no-call' }, '无人响应，进入下一家。')}
          onPong={handlePong}
          onKong={handleKong}
          onWin={() => applyUiAction({ type: 'win', winner: user.seat }, '进入结算。')}
        />
        <DiscardRivers game={game} />
      </div>

      <aside className="side-column">
        <RecommendationPanel recommendations={recommendations} />
        <section className="message-panel" aria-label="操作消息">
          <h2>消息</h2>
          <p>{message}</p>
          <p className="muted">阶段：{game.phase}</p>
        </section>
      </aside>
    </main>
  );
}
