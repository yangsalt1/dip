import { FNG } from '@/lib/data';
import { PARTS, partOf } from '@/lib/fng';
import Stickman from './Stickman';

/** 공포지수 어디까지 왔나: 졸라맨 + 정수리~발바닥 */
export default function Fng({ web }: { web?: boolean }) {
  const f = FNG;
  if (!f) return null;
  const now = partOf(f.score);
  const past = [['어제', f.prev], ['1주 전', f.week], ['1달 전', f.month]].filter(([, v]) => v != null);
  return (
    <section className={web ? 'wCard fngCard' : 'card fngCard'} aria-label="CNN 공포지수">
      <div className="row"><b className="fngH">공포지수 어디까지 왔나</b><small className="fngSrc">CNN · {f.date.slice(5).replace('-', '/')}</small></div>
      <div className="fngBody">
        <Stickman part={now} />
        <ul className="fngParts">
          {PARTS.map((p) => p.key === now.key
            ? <li key={p.key} className="on">{p.ko} ← 지금 {f.score}</li>
            : <li key={p.key}>{p.ko} <small>{p.range}</small></li>)}
        </ul>
      </div>
      <p className="fngSay">{now.say}</p>
      <p className="fngPast">{past.map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
    </section>
  );
}
