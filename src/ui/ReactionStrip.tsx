import type { Seat } from '../domain';

export interface ReactionStripProps {
  seats: Seat[];
  onNoCall: () => void;
  onPong: (seat: Seat) => void;
  onKong: (seat: Seat) => void;
  onWin: () => void;
}

export function ReactionStrip({ seats, onNoCall, onPong, onKong, onWin }: ReactionStripProps) {
  return (
    <section className="reaction-strip" aria-label="吃碰杠响应">
      <button onClick={onNoCall} type="button">
        无人要
      </button>
      {seats.map((seat) => (
        <button key={`${seat}-pong`} onClick={() => onPong(seat)} type="button">
          {seat}碰
        </button>
      ))}
      {seats.map((seat) => (
        <button key={`${seat}-kong`} onClick={() => onKong(seat)} type="button">
          {seat}杠
        </button>
      ))}
      <button onClick={onWin} type="button">
        胡
      </button>
    </section>
  );
}
