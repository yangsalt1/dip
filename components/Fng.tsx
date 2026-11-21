import { FNG } from '@/lib/data';
import { fngZone } from '@/lib/fng';

/** 시장 기분 미터: CNN Fear & Greed */
export default function Fng({ web }: { web?: boolean }) {
  if (!FNG) return null;
  const z = fngZone(FNG.score);
  const past = [['어제', FNG.prev], ['1주 전', FNG.week], ['1달 전', FNG.month]] as const;
  return (
    <section className={`fng${web ? ' fngWeb' : ''}`} aria-label="CNN 공포·탐욕 지수">
      <div className="row">
        <span className="fngTag">시장 기분</span>
        <small className="fngSrc">CNN 공포·탐욕 지수 · {FNG.date.slice(5).replace('-', '/')}</small>
      </div>
      <div className="fngMain">
        <b className="fngNum">{FNG.score}</b>
        <span className="fngTxt"><b style={{ color: z.color }}>{z.ko}</b><span>{z.say}</span></span>
      </div>
      <div className="fngBar" aria-hidden="true">
        <i style={{ left: `${Math.max(2, Math.min(98, FNG.score))}%` }} />
      </div>
      <div className="fngEnds"><span>공포</span><span>탐욕</span></div>
      <div className="fngPast">
        {past.filter(([, v]) => v != null).map(([k, v]) => (
          <span key={k}>{k} <b style={{ color: fngZone(v as number).color }}>{v}</b></span>
        ))}
      </div>
    </section>
  );
}
