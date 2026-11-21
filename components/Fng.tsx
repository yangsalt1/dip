'use client';
import { FNG } from '@/lib/data';
import { PARTS, partOf } from '@/lib/fng';
import Stickman from './Stickman';
import { useLang } from './Lang';

/** 공포지수 어디까지 왔나: 졸라맨 + 정수리~발바닥 */
export default function Fng({ web }: { web?: boolean }) {
  const en = useLang() === 'en';
  const f = FNG;
  if (!f) return null;
  const now = partOf(f.score);
  const past = [[en ? 'Yesterday' : '어제', f.prev], [en ? '1 week ago' : '1주 전', f.week], [en ? '1 month ago' : '1달 전', f.month]].filter(([, v]) => v != null);
  return (
    <section data-track="fear" className={web ? 'wCard fngCard' : 'card fngCard'} aria-label={en ? "CNN Fear & Greed" : "CNN 공포지수"}>
      <div className="row"><b className="fngH">{en ? 'How scared is the market?' : '공포지수 어디까지 왔나'}</b><small className="fngSrc">CNN · {f.date.slice(5).replace('-', '/')}</small></div>
      <div className="fngBody">
        <Stickman part={now} />
        <ul className="fngParts">
          {PARTS.map((p) => p.key === now.key
            ? <li key={p.key} className="on">{en ? p.en : p.ko} ← {en ? 'now' : '지금'} {f.score}</li>
            : <li key={p.key}>{en ? p.en : p.ko} <small>{p.range}</small></li>)}
        </ul>
      </div>
      <p className="fngSay">{en ? now.sayEn : now.say}</p>
      <p className="fngPast">{past.map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
    </section>
  );
}
