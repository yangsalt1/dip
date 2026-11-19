import { ETFS } from '@/lib/data';
import { overview } from '@/lib/overview';

const DOT: Record<string, string> = { mega: '#FF5A3C', sale: '#B1A6FF', bottom: '#F2F28E', rising: '#9CC3FF' };

/** 배너: 왼쪽 라벨(세일중/줍줍준비/상승중) + 섹터 이름, 아래 비율 막대 */
export default function Overview({ size = 'web' }: { size?: 'web' | 'app' }) {
  const groups = overview();
  const mega = ETFS.filter((e) => e.kind === 'mega').length;
  const sale = ETFS.filter((e) => e.kind === 'sale').length;
  const rest = ETFS.length - mega - sale;
  return (
    <div className={`ov ov-${size}`}>
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
          <span style={{ flex: mega, background: '#FF4D2E' }} />
          <span style={{ flex: sale, background: '#B1A6FF' }} />
          <span style={{ flex: rest, background: '#3A3A3A' }} />
        </div>
        <div className="ovLegend">
          <span><b style={{ color: '#FF5A3C' }}>{mega}</b> 특급세일</span>
          <span><b style={{ color: '#B1A6FF' }}>{sale}</b> 일반 세일</span>
          <span className="dim"><b>{rest}</b> 상승·워워</span>
          <span className="dim total">전체 {ETFS.length}개 ETF</span>
        </div>
      </div>
    </div>
  );
}
