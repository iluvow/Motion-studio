import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '@fontsource/dm-sans/400.css';
import '@fontsource/pretendard/500.css';

/** 4:3 (1440×1080) 자막 시안 (스틸 전용): 고양이는 왼쪽, 자막은 오른쪽 어두운 영역 */
export type Caption43Props = {bg: string; en: string; ko?: string; enSize?: number; koSize?: number};
export const CAPTION43_DEFAULTS: Caption43Props = {bg: 'car43_a.png', en: 'in the backseat', ko: '뒷좌석에서'};
const AREA = {left: 960, width: 440};      // 자막 영역 (오른쪽)

export const CaptionMock43: React.FC<Caption43Props> = ({bg, en, ko, enSize = 54, koSize = 32}) => (
  <AbsoluteFill style={{background: '#050507'}}>
    <Img src={staticFile(bg)} style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 1080, filter: 'brightness(1.3)'}} />
    <div style={{position: 'absolute', left: AREA.left, top: 0, width: AREA.width, height: 1080, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', textShadow: '0 2px 18px rgba(0,0,0,0.55)'}}>
      <div style={{fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: enSize, lineHeight: 1.15, letterSpacing: 0.5, color: '#FFFFFF', whiteSpace: 'pre-line'}}>{en}</div>
      {ko && <div style={{fontFamily: "'Pretendard', sans-serif", fontWeight: 500, fontSize: koSize, marginTop: 22, color: 'rgba(255,255,255,0.88)'}}>{ko}</div>}
    </div>
  </AbsoluteFill>
);
