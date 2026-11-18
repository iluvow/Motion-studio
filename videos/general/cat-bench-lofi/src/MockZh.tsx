import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '@fontsource/noto-sans-sc/800.css';
import '@fontsource/noto-serif-sc/700.css';
import {C, H, SAFE, W} from './constants';
import {FONT_CSS} from './Video';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export type ZhProps = {font: 'sans' | 'serif'; progress: number; zh: string; ko: string};
export const ZH_DEFAULTS: ZhProps = {font: 'sans', progress: 0.5, zh: '为什么你会落泪', ko: '왜 눈물을 흘리는 거야'};

/** 중국어 원문 길이(글자 수)에 따라 크기를 고른다. 글자 영역은 폭 960. */
export const zhSize = (n: number) => (n <= 4 ? 230 : n <= 6 ? 205 : n <= 8 ? 190 : n <= 11 ? 150 : 120);

const FAMILIES = {
  sans: {zh: "'Noto Sans SC'", zhWeight: 800, ko: 'NotoKR', koWeight: 700},
  serif: {zh: "'Noto Serif SC'", zhWeight: 700, ko: "'Noto Serif KR'", koWeight: 700},
};

export const MockZh: React.FC<ZhProps> = ({font, progress, zh, ko}) => {
  const f = FAMILIES[font];
  const chars = Array.from(zh);
  const size = zhSize(chars.length);
  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT_CSS}</style>
      <Img src={staticFile('scene.png')} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.5) 0%, rgba(8,10,28,0.15) 62%, rgba(8,10,28,0) 72%)'}} />
      <div style={{position: 'absolute', left: SAFE.x, top: 270, width: 960, color: C.text}}>
        {/* 원문: 글자(字) 단위로 밝아진다 */}
        <div style={{fontFamily: `${f.zh}, sans-serif`, fontWeight: f.zhWeight, fontSize: size, lineHeight: 1.18, letterSpacing: 4, textWrap: 'balance' as any, textShadow: '0 4px 26px rgba(0,0,0,0.55)'}}>
          {chars.map((c, i) => {
            const a = clamp(progress * chars.length - i + 0.3);
            return <span key={i} style={{opacity: 0.28 + 0.72 * a}}>{c}</span>;
          })}
        </div>
        {/* 번역 */}
        <div style={{marginTop: 56, fontFamily: `${f.ko}, sans-serif`, fontWeight: f.koWeight, fontSize: Math.round(size * 0.5), lineHeight: 1.3, color: 'rgba(255,255,255,0.92)', textShadow: '0 3px 18px rgba(0,0,0,0.5)'}}>{ko}</div>
      </div>
    </AbsoluteFill>
  );
};
