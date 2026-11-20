import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {SAFE, W} from './constants';
import {MISANS_BOLD} from './fonts';

/** 애플뮤직식 가사 스크롤 시안 (스틸 전용). 변형 A = 여러 줄 스크롤, B = 한 줄 크게 + 훅 문구 */
export type ScrollProps = {variant: 'A' | 'B'; cur: number; hook?: string};
export const SCROLL_DEFAULTS: ScrollProps = {variant: 'A', cur: 4};

const LYR: [string, string][] = [
  ['My rival, my idol', '내 라이벌, 내 우상'],
  ['You got me suicidal', '너 때문에 죽고 싶어'],
  ['My love, your rage', '내 사랑, 네 분노'],
  ['Our dying claim to fame', '저물어 가는 우리 명성'],
  ['Our battle legendary', '우리 싸움은 전설이야'],
  ['Our fickle fraternizing', '붙었다 떨어지는 우리'],
  ['A war inside my heart', '내 맘속엔 전쟁이 나'],
  ['Until **** do us part', '****이 우릴 갈라놓을 때까지'],
  ['Bang, bang, bang, bang, bang', '탕, 탕, 탕, 탕, 탕'],
  ["'Til I take you", '내가 널'],
  ['Down, down, down, down', '바닥에 처박을 때까지'],
  ['I want you in the ground', '널 땅에 묻어 버리고 싶어'],
];
const WIDTH = W - 2 * SAFE.x;
const FONT = `@font-face{font-family:'MiSansLatin';font-weight:700;src:url('${staticFile('fonts/misans-latin/MiSansLatin-Bold.woff2')}') format('woff2');}
@font-face{font-family:'SUIT';font-weight:700;src:url('${staticFile('fonts/suit/SUIT-Bold.otf')}') format('opentype');}`;
void MISANS_BOLD;

export const MockScroll: React.FC<ScrollProps> = ({variant, cur, hook}) => {
  const en = (s: string, size: number, extra: React.CSSProperties = {}) => ({fontFamily: "'MiSansLatin', sans-serif", fontWeight: 700, fontSize: size, lineHeight: 1.12, letterSpacing: -1, color: '#FFFBF5', ...extra});
  const rows: React.ReactNode[] = [];
  if (variant === 'A') {
    // 위: 지나간 줄(흐림), 가운데: 지금 줄(크게 + 번역), 아래: 다음 줄(흐림)
    [-1, 0, 1, 2].forEach((d) => {
      const [e, k] = LYR[cur + d];
      const isCur = d === 0;
      const size = isCur ? 120 : 68;
      const opacity = isCur ? 1 : Math.abs(d) === 1 ? 0.5 : 0.28;
      const blur = isCur ? 0 : Math.abs(d) === 1 ? 2.5 : 5;
      rows.push(
        <div key={d} style={{opacity, filter: blur ? `blur(${blur}px)` : undefined, marginBottom: isCur ? 30 : 34, marginTop: isCur ? 24 : 0}}>
          <div style={en(e, size)}>{e}</div>
          {isCur && <div style={{fontFamily: 'SUIT, sans-serif', fontWeight: 700, fontSize: 66, color: '#FFFBF5', marginTop: 22, opacity: 0.92}}>{k}</div>}
        </div>,
      );
    });
  } else {
    const [e, k] = LYR[cur];
    rows.push(
      <div key="c">
        <div style={en(e, 150)}>{e}</div>
        <div style={{fontFamily: 'SUIT, sans-serif', fontWeight: 700, fontSize: 76, marginTop: 36, color: '#FFFBF5'}}>{k}</div>
      </div>,
    );
  }
  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT}</style>
      <Img src={staticFile('store_bg.png')} style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 2160}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.9) 0%, rgba(8,10,28,0.82) 34%, rgba(8,10,28,0.5) 48%, rgba(8,10,28,0) 58%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0) 76%, rgba(8,10,28,0.95) 88%)'}} />
      {variant === 'B' && hook && (
        <div style={{position: 'absolute', left: SAFE.x, top: 200, fontFamily: 'SUIT, sans-serif', fontWeight: 700, fontSize: 46, color: '#FFFBF5', background: 'rgba(255,255,255,0.16)', padding: '14px 30px', borderRadius: 44, border: '2px solid rgba(255,255,255,0.35)'}}>{hook}</div>
      )}
      <div style={{position: 'absolute', left: SAFE.x, top: variant === 'A' ? 215 : 360, width: WIDTH, textShadow: '0 6px 36px rgba(6,8,24,0.5)'}}>{rows}</div>
    </AbsoluteFill>
  );
};
