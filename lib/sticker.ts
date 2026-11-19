// 할인 딱지 스타일: 'c' = 심플 알약(확정). 'b' 도장, 'f' 숫자는 예비안.
export type StickerStyle = 'b' | 'c' | 'f';
export function stickerStyle(): StickerStyle {
  if (typeof window !== 'undefined') {
    const w = (window as unknown as { __DIP_STICKER?: StickerStyle }).__DIP_STICKER;
    if (w === 'b' || w === 'c' || w === 'f') return w;
  }
  return 'c';
}
