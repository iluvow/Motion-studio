import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, H, SAFE, W} from './constants';
import {FONT_CSS} from './Video';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export type MockProps = {variant: 'word' | 'line'; progress: number; en: string; ko: string};
export const MOCK_DEFAULTS: MockProps = {
  variant: 'word', progress: 0.5,
  en: 'Walking home beneath the autumn sky',          // 자리 표시 문구 (실제 가사 아님)
  ko: '가을 하늘 아래, 집으로 걸어가요',
};

/** 시안: 글자 영역 = 왼쪽 8% ~ 70%, 위에서 12% ~ 60% */
export const Mock: React.FC<MockProps> = ({variant, progress, en, ko}) => {
  const words = en.split(' ');
  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT_CSS}</style>
      <Img src={staticFile('scene.png')} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.35) 0%, rgba(8,10,28,0) 65%)'}} />
      <div style={{position: 'absolute', left: SAFE.x, top: 300, width: 940, fontFamily: 'NotoKR, Inter, sans-serif', color: C.text}}>
        {variant === 'word' ? (
          <>
            {/* 원문: 불리는 단어가 밝아진다 (크기/위치 변화 없음) */}
            <div style={{fontSize: 84, fontWeight: 800, lineHeight: 1.25, letterSpacing: -1.5, textShadow: '0 4px 22px rgba(0,0,0,0.5)'}}>
              {words.map((w, i) => {
                const a = clamp(progress * words.length - i + 0.3);      // 0.3 = 단어가 켜지기 시작하는 여유
                return <span key={i} style={{opacity: 0.28 + 0.72 * a}}>{w}{' '}</span>;
              })}
            </div>
            {/* 번역: 줄 단위로 고정 */}
            <div style={{marginTop: 44, fontSize: 60, fontWeight: 700, lineHeight: 1.3, color: 'rgba(255,255,255,0.9)', textShadow: '0 3px 16px rgba(0,0,0,0.5)'}}>{ko}</div>
          </>
        ) : (
          <>
            <div style={{fontSize: 44, fontWeight: 700, color: C.sub, marginBottom: 24}}>{en}</div>
            <div style={{fontSize: 100, fontWeight: 800, lineHeight: 1.22, letterSpacing: -2, textShadow: '0 4px 24px rgba(0,0,0,0.5)'}}>{ko}</div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
