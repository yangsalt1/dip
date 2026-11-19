/** "**키워드**" 부분만 굵게. 나머지는 보통 굵기로 읽기 쉽게. */
export default function Rich({ t }: { t: string }) {
  const parts = t.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <b key={i} className="kw">{p}</b> : <span key={i}>{p}</span>))}</>;
}
/** 굵게 표시(**) 빼고 순수 텍스트 */
export const plain = (t: string) => t.replace(/\*\*/g, '');
