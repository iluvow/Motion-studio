import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '@fontsource/dm-sans/400.css';
import '@fontsource/pretendard/500.css';

/** 3:2 (1440×960) 자막 시안 (스틸 전용): 글자에도 배경과 같은 결(입자)을 입힌다 */
export type Caption32Props = {bg: string; en: string; ko?: string; enSize?: number; koSize?: number; texture?: boolean};
export const CAPTION32_DEFAULTS: Caption32Props = {bg: 'car32_a.png', en: 'in the backseat', ko: '뒷좌석에서', texture: true};
const AREA = {left: 930, width: 470};

export const CaptionMock32: React.FC<Caption32Props> = ({bg, en, ko, enSize = 60, koSize = 34, texture = true}) => (
  <AbsoluteFill style={{background: '#050507'}}>
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <defs>
        {/* 글자 모양을 아주 살짝 흐리게 하고, 잡음 무늬만큼 불투명도를 흔들어서 배경 입자와 어울리게 한다 */}
        <filter id="texEn" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="b" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 0.16" result="na" />
          <feComposite in="b" in2="na" operator="in" />
        </filter>
        <filter id="texKo" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.25" result="b" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.7 0 0 0 0.6" result="na" />
          <feComposite in="b" in2="na" operator="in" />
        </filter>
      </defs>
    </svg>
    <Img src={staticFile(bg)} style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 960, filter: 'brightness(1.25)'}} />
    <div style={{position: 'absolute', left: AREA.left, top: 0, width: AREA.width, height: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
      <div style={{filter: 'drop-shadow(0 2px 14px rgba(0,0,0,0.5))'}}>
        <div style={{fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: enSize, lineHeight: 1.15, letterSpacing: 0.5, color: '#FFFFFF', whiteSpace: 'pre-line', filter: texture ? 'url(#texEn)' : undefined}}>{en}</div>
        {ko && <div style={{fontFamily: "'Pretendard', sans-serif", fontWeight: 500, fontSize: koSize, marginTop: 20, color: 'rgba(255,255,255,0.9)', filter: texture ? 'url(#texKo)' : undefined}}>{ko}</div>}
      </div>
    </div>
  </AbsoluteFill>
);
