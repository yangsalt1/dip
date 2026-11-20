import { ETFS } from '@/lib/data';
import { overview, signal } from '@/lib/overview';

const DOT: Record<string, string> = { mega: '#FF5A3C', sale: '#B1A6FF', bottom: '#F2F28E', rising: '#9CC3FF' };
export type Mkt = 'us' | 'kr';

/** 검은 배너 안 작은 미국/한국 토글 */
export function MktToggle({ mkt, onChange }: { mkt: Mkt; onChange: (m: Mkt) => void }) {
  return (
    <div className="miniSeg" role="group" aria-label="시장 고르기">
      <button type="button" aria-pressed={mkt === 'us'} onClick={() => onChange('us')}>미국</button>
      <button type="button" aria-pressed={mkt === 'kr'} onClick={() => onChange('kr')}>한국</button>
    </div>
  );
}

/** 배너: 왼쪽 라벨 + 섹터 이름, 아래 비율 막대 (고른 시장만) */
export default function Overview({ size = 'web', mkt }: { size?: 'web' | 'app'; mkt: Mkt }) {
  const groups = overview(mkt);
  const list = ETFS.filter((e) => e.market === mkt);
  const mega = list.filter((e) => e.kind === 'mega').length;
  const sale = list.filter((e) => e.kind === 'sale').length;
  const up = list.length - mega - sale;
  const sig = signal(mkt);
  return (
    <div className={`ov ov-${size}`}>
      <div className="ovSigBox"><p className={`ovSig ${sig.tone}`}><i aria-hidden="true" />{sig.text}</p>{sig.chips.length > 0 && <div className="ovChips">{sig.chips.map((c) => <span key={c}>{c}</span>)}</div>}</div>
      <div className="ovGrid">
        {groups.map((g) => (
          <div key={g.key} className="ovItem">
            <span className="ovLab" style={{ color: DOT[g.key] }}>● {g.word}</span>
            <span className="ovNames">{g.names.join(', ')}</span>
          </div>
        ))}
      </div>
      <div className="ovBarWrap">
        <div className="ovBar" aria-hidden="true">
          {mega > 0 && <span style={{ flex: mega, background: '#FF4D2E' }} />}
          {sale > 0 && <span style={{ flex: sale, background: '#B1A6FF' }} />}
          {up > 0 && <span style={{ flex: up, background: '#9CC3FF' }} />}
        </div>
        <div className="ovLegend">
          {mega > 0 && <span><b style={{ color: '#FF5A3C' }}>{mega}</b> 특급세일</span>}
          {sale > 0 && <span><b style={{ color: '#B1A6FF' }}>{sale}</b> 일반 세일</span>}
          {up > 0 && <span><b style={{ color: '#9CC3FF' }}>{up}</b> 세일 아님</span>}
          <span className="dim total">{mkt === 'us' ? '미국' : '한국'} ETF {list.length}개</span>
        </div>
      </div>
    </div>
  );
}
