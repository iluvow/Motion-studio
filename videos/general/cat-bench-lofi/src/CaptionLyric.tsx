import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/dm-sans/400.css';
import '@fontsource/pretendard/500.css';
import {LINES, SONG_DURATION} from './data/bubble_lines';

/* ---- 값 모음 (여기서 조절) ---- */
const AREA = {left: 800, width: 600};          // 자막 영역 (고양이 오른쪽 어두운 부분)
const EN_SIZE = 58, KO_SIZE = 34;
const RISE = 10, RISE_TIME = 0.12;             // 단어가 나타날 때 올라오는 거리(px)와 시간
const POP = 0.05, POP_DECAY = 0.12;            // "bubble pop electric" 단어가 살짝 튀는 크기와 되돌아오는 시간
const TEXT_ALPHA = 0.97;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

export const CaptionLyric: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const seed = (Math.floor(frame / 2) * 7) % 97;      // 글자 입자도 배경 입자처럼 2프레임마다 바뀜

  // 지금 줄 / 지금 문구
  let li = -1;
  for (let i = 0; i < LINES.length; i++) if (t >= LINES[i].chunks[0].words[0].t) li = i;
  const line = li >= 0 ? LINES[li] : null;
  let ci = 0;
  if (line) line.chunks.forEach((ch, i) => { if (t >= ch.words[0].t) ci = i; });
  const chunk = line ? line.chunks[ci] : null;
  const lineStart = line ? line.chunks[0].words[0].t : 0;
  const endFade = t > SONG_DURATION - 0.1 ? 0 : 1;

  return (
    <AbsoluteFill style={{background: '#050507'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          {/* 글자에도 배경과 같은 결의 입자를 입힌다 (영어는 조금 더, 번역은 읽기 쉽게 약하게) */}
          <filter id="texEn" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="b" />
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 0.16" result="na" />
            <feComposite in="b" in2="na" operator="in" />
          </filter>
          <filter id="texKo" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.25" result="b" />
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed + 3} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.7 0 0 0 0.6" result="na" />
            <feComposite in="b" in2="na" operator="in" />
          </filter>
        </defs>
      </svg>
      <Audio src={staticFile('bubble.mp3')} />
      <OffthreadVideo src={staticFile('car_bg60.mp4')} muted style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 810}} />
      {chunk && (
        <div style={{position: 'absolute', left: AREA.left, top: 0, width: AREA.width, height: 810, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: endFade * TEXT_ALPHA}}>
          <div style={{filter: 'drop-shadow(0 2px 14px rgba(0,0,0,0.5))'}}>
            <div style={{fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: EN_SIZE, lineHeight: 1.15, letterSpacing: 0.5, color: '#fff', filter: 'url(#texEn)', textWrap: 'balance' as any}}>
              {chunk.words.map((wd, k) => {
                const dt = t - wd.t;
                const shown = dt >= 0;
                const rise = shown ? (1 - easeOut(dt / RISE_TIME)) * RISE : RISE;
                const sc = shown && chunk.pop ? 1 + POP * Math.exp(-dt / POP_DECAY) : 1;
                return (
                  <span key={k} style={{display: 'inline-block', opacity: shown ? 1 : 0, transform: `translateY(${rise}px) scale(${sc})`, marginRight: k < chunk.words.length - 1 ? '0.28em' : 0}}>{wd.w}</span>
                );
              })}
            </div>
            {line!.ko && (() => {
              const dk = t - lineStart;
              return (
                <div style={{fontFamily: "'Pretendard', sans-serif", fontWeight: 500, fontSize: KO_SIZE, marginTop: 20, color: 'rgba(255,255,255,0.9)', filter: 'url(#texKo)', opacity: 1, transform: `translateY(${(1 - easeOut(dk / RISE_TIME)) * RISE}px)`}}>{line!.ko}</div>
              );
            })()}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
export const CAPTION_FRAMES = Math.ceil(SONG_DURATION * 60);
