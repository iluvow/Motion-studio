import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '@fontsource/dm-sans/400.css';
import '@fontsource/pretendard/500.css';

/** 레퍼런스식 자막 시안 (가로 16:9, 스틸 전용): 화면 가운데에 얇은 소문자 영어 + 아래에 작은 한국어 번역 */
export type CaptionProps = {bg: string; en: string; ko?: string; enSize?: number; koSize?: number; place?: 'center' | 'right'};
export const CAPTION_DEFAULTS: CaptionProps = {bg: 'car_a.png', en: "in the backseat", ko: '뒷좌석에서'};

export const CaptionMock: React.FC<CaptionProps> = ({bg, en, ko, enSize = 76, koSize = 40, place = 'center'}) => (
  <AbsoluteFill style={{background: '#050507'}}>
    <Img src={staticFile(bg)} style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, filter: 'brightness(1.3)'}} />
    <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingLeft: place === 'right' ? 760 : 0, textShadow: '0 2px 18px rgba(0,0,0,0.55)'}}>
      <div style={{fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: enSize, letterSpacing: 1, color: '#FFFFFF'}}>{en}</div>
      {ko && <div style={{fontFamily: "'Pretendard', sans-serif", fontWeight: 500, fontSize: koSize, marginTop: 22, color: 'rgba(255,255,255,0.88)'}}>{ko}</div>}
    </AbsoluteFill>
  </AbsoluteFill>
);
