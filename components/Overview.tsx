'use client';
import { ETFS, FNG, isRebound } from '@/lib/data';
import { partOf } from '@/lib/fng';
import Stickman from './Stickman';
import { etfTitle } from '@/lib/format';
import { overview, signal } from '@/lib/overview';
import { useLang } from './Lang';
import { tf } from '@/lib/i18n';

const DOT: Record<string, string> = { reb: '#5BD47E', mega: '#FF5A3C', sale: '#B1A6FF', bottom: '#F2F28E', rising: '#9CC3FF' };
export type Mkt = 'us' | 'kr';

/** 검은 배너 안 작은 미국/한국 토글 */
export function MktToggle({ mkt, onChange }: { mkt: Mkt; onChange: (m: Mkt) => void }) {
  const en = useLang() === 'en';
  return (
    <div className="miniSeg" role="group" aria-label={en ? 'Pick a market' : '시장 고르기'}>
      <button type="button" aria-pressed={mkt === 'us'} onClick={() => onChange('us')}>{en ? 'US' : '미국'}</button>
      <button type="button" aria-pressed={mkt === 'kr'} onClick={() => onChange('kr')}>{en ? 'Korea' : '한국'}</button>
    </div>
  );
}

/** 배너: 왼쪽 라벨 + 섹터 이름, 아래 비율 막대 (고른 시장만) */
export default function Overview({ size = 'web', mkt }: { size?: 'web' | 'app'; mkt: Mkt }) {
  const lang = useLang();
  const en = lang === 'en';
  const groups = overview(mkt, lang);
  const list = ETFS.filter((e) => e.market === mkt);
  // 줍줍시작(반등)은 세일 중 일부라서 막대에서 따로 떼어 맨 앞에 둬요 (홈 리스트와 같은 숫자)
  const reb = list.filter(isRebound).length;
  const mega = list.filter((e) => e.kind === 'mega' && !isRebound(e)).length;
  const sale = list.filter((e) => e.kind === 'sale' && !isRebound(e)).length;
  const up = list.length - reb - mega - sale;
  const sig = signal(mkt, lang);
  const part = FNG ? partOf(FNG.score) : null;
  return (
    <div className={`ov ov-${size}`}>
      <div className="ovSigBox"><div className="ovSigRow"><div className="ovSigTxt"><p className={`ovSig ${sig.tone}`}><i aria-hidden="true" />{sig.text}</p>{sig.sub && <p className="ovSub">{sig.sub}</p>}</div>
        {FNG && part && <span className="ovMan" title={`CNN ${en ? 'Fear & Greed' : '공포지수'} ${FNG.score}`}><Stickman part={part} color="#F4F4F2" width={size === 'web' ? 48 : 38} dot={14} /><span>{en ? `Now: ${part.en}` : `지금 ${part.ko}`}</span></span>}</div>{sig.chips.length > 0 && <div className="ovChips">{sig.chips.map((c) => <span key={c}>{c}</span>)}</div>}</div>
      <div className="ovGrid">
        {(() => {
          const rebs = list.filter(isRebound).sort((a, b) => b.q.buy - a.q.buy);
          return (
            <div className="ovItem">
              <span className="ovLab" style={{ color: DOT.reb }}>● {en ? 'Bouncing' : '반등 시작'}</span>
              <span className="ovNames">{rebs.length ? <>{rebs.slice(0, 4).map((e, i) => (
                <span key={e.id}>{i > 0 && ', '}{tf(e, 'kw', lang)}<small className="ovCode"> {etfTitle(e, lang)}</small></span>
              ))}{rebs.length > 4 && (en ? ` +${rebs.length - 4} more` : ` 외 ${rebs.length - 4}`)}</> : en ? 'None yet' : '아직 없음'}</span>
            </div>
          );
        })()}
        {groups.filter((g) => g.key === 'mega').map((g) => (
          <div key={g.key} className="ovItem">
            <span className="ovLab" style={{ color: DOT[g.key] }}>● {g.key === 'mega' ? (en ? 'Mega sale' : '특급 세일') : g.word}</span>
            <span className="ovNames">{g.names.join(', ')}</span>
          </div>
        ))}
      </div>
      <div className="ovBarWrap ovBarLite">
        <div className="ovBar" aria-hidden="true">
          {reb > 0 && <span style={{ flex: reb, background: '#5BD47E' }} />}
          {mega > 0 && <span style={{ flex: mega, background: '#FF4D2E' }} />}
          {list.length - reb - mega > 0 && <span style={{ flex: list.length - reb - mega, background: '#3A3A38' }} />}
        </div>
        <div className="ovLegend">
          <span><b style={{ color: '#5BD47E' }}>{reb}</b> {en ? 'bouncing' : '반등 시작'}</span>
          <span><b style={{ color: '#FF5A3C' }}>{mega}</b> {en ? 'mega sale' : '특급 세일'}</span>
          <span className="dim total">{en ? `${list.length} ${mkt === 'us' ? 'US' : 'Korean'} ETFs` : `${mkt === 'us' ? '미국' : '한국'} ETF ${list.length}개`}</span>
        </div>
      </div>
    </div>
  );
}
