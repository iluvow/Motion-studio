import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {SONG_LINES} from './data/yoru_lines';

/** 한 줄 가사 시안 (가로 16:9, 스틸 전용). trans=true 이면 줄이 바뀌는 중간 장면 (이전 줄은 위로 올라가며 사라지고, 새 줄은 아래에서 올라옴) */
export type SingleProps = {cur: number; trans?: boolean};
export const SINGLE_DEFAULTS: SingleProps = {cur: 8};
const BOX = {left: 890, top: 40, width: 940, height: 700};
const FONT = `@font-face{font-family:'MiSansLatin';font-weight:700;src:url('${staticFile('fonts/misans-latin/MiSansLatin-Bold.woff2')}') format('woff2');}
@font-face{font-family:'SUIT';font-weight:700;src:url('${staticFile('fonts/suit/SUIT-Bold.otf')}') format('opentype');}`;
const sizeFor = (en: string) => (en.length <= 18 ? 156 : en.length <= 24 ? 132 : 112);

const Line: React.FC<{i: number; style?: React.CSSProperties}> = ({i, style}) => {
  const l = SONG_LINES[i], s = sizeFor(l.en);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...style}}>
      <div style={{fontFamily: "'MiSansLatin', sans-serif", fontWeight: 700, fontSize: s, lineHeight: 1.1, letterSpacing: -2, color: '#FFFBF5'}}>{l.en}</div>
      <div style={{fontFamily: 'SUIT, sans-serif', fontWeight: 700, fontSize: Math.round(s * 0.5), lineHeight: 1.3, marginTop: 30, color: '#FFFBF5', opacity: 0.95}}>{l.ko}</div>
    </div>
  );
};

export const SingleMock: React.FC<SingleProps> = ({cur, trans}) => (
  <AbsoluteFill style={{background: '#0b0d1a'}}>
    <style>{FONT}</style>
    <Img src={staticFile('wide_t15.png')} style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}} />
    <div style={{position: 'absolute', left: BOX.left, top: BOX.top, width: BOX.width, height: BOX.height, textShadow: '0 6px 36px rgba(6,8,24,0.55)'}}>
      {trans ? (
        <>
          <Line i={cur - 1} style={{transform: 'translateY(-110px) scale(0.92)', transformOrigin: '0% 50%', opacity: 0.38, filter: 'blur(3px)'}} />
          <Line i={cur} style={{transform: 'translateY(90px) scale(0.96)', transformOrigin: '0% 50%', opacity: 0.7, filter: 'blur(1.5px)'}} />
        </>
      ) : <Line i={cur} />}
    </div>
  </AbsoluteFill>
);
