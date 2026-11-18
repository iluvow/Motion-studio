import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/noto-sans-sc/800.css';
import '@fontsource/noto-serif-sc/700.css';
import {C, H, SAFE, W} from './constants';
import {FONT_CSS} from './Video';
import {zhSize} from './MockZh';
import data from './data/luolei.json';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const FADE = 0.12;       // 줄이 나타나고 사라지는 시간 (짧게)
const LEAD = 0.12;       // 첫 글자보다 이만큼 먼저 줄이 나타난다
const DIM = 0.3;         // 아직 안 부른 글자의 밝기
const RAMP_BEFORE = 0.02, RAMP_AFTER = 0.06;   // 글자가 밝아지는 구간 (시작 직전~직후)

type Line = (typeof data.lines)[number];
const lines: Line[] = data.lines;

export const LyricZh: React.FC<{showIndex?: boolean}> = ({showIndex = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  // 지금 보여줄 줄: 시작(LEAD 전)이 지난 마지막 줄
  let a = -1;
  for (let i = 0; i < lines.length; i++) if (t >= lines[i].start - LEAD) a = i;
  const L = a >= 0 ? lines[a] : null;
  const prev = a > 0 ? lines[a - 1] : null;
  const next = a >= 0 && a + 1 < lines.length ? lines[a + 1] : null;
  const same = (x: Line | null, y: Line | null) => !!x && !!y && x.zh === y.zh;

  let alpha = 0, settle = 1;
  if (L) {
    const tin = t - (L.start - LEAD);
    const repeatIn = same(prev, L) && L.start - prev!.end < 0.6;
    alpha = repeatIn ? 1 : clamp(tin / FADE);
    settle = repeatIn ? clamp(tin / 0.08) : 1;                       // 반복 줄: 글자가 빠르게 다시 어두워짐
    const nextStartIn = next ? next.start - LEAD : L.end + 0.5;
    const repeatOut = same(L, next) && next!.start - L.end < 0.6;
    if (!repeatOut) alpha *= clamp((nextStartIn - t) / FADE);       // 다음 줄이 나타나기 직전에 사라짐
  }

  const size = L ? zhSize(Array.from(L.zh).length) : 150;
  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT_CSS}</style>
      <Audio src={staticFile('luolei.mp3')} />
      <Img src={staticFile('scene.png')} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.5) 0%, rgba(8,10,28,0.15) 62%, rgba(8,10,28,0) 72%)'}} />
      {L && (
        <div style={{position: 'absolute', left: SAFE.x, top: 270, width: 960, color: C.text, opacity: alpha}}>
          <div style={{fontFamily: "'Noto Serif SC', serif", fontWeight: 700, fontSize: size, lineHeight: 1.18, letterSpacing: 4, textWrap: 'balance' as any, textShadow: '0 4px 26px rgba(0,0,0,0.55)'}}>
            {L.chars.map((ch, j) => {
              const lit = clamp((t - (ch.t - RAMP_BEFORE)) / (RAMP_BEFORE + RAMP_AFTER));
              const v = DIM + (1 - DIM) * (1 - settle + settle * lit);     // settle=0(반복 직후)이면 전부 밝은 상태에서 시작
              return <span key={j} style={{opacity: v}}>{ch.c}</span>;
            })}
          </div>
          <div style={{marginTop: 56, fontFamily: 'NotoKR, sans-serif', fontWeight: 700, fontSize: Math.round(size * 0.5), lineHeight: 1.3, color: 'rgba(255,255,255,0.92)', textShadow: '0 3px 18px rgba(0,0,0,0.5)'}}>{L.ko}</div>
        </div>
      )}
      {showIndex && L && (
        <div style={{position: 'absolute', left: 40, top: 40, fontFamily: 'NotoKR, sans-serif', fontSize: 44, color: 'rgba(255,255,255,0.55)'}}>#{a + 1} · {t.toFixed(2)}s</div>
      )}
    </AbsoluteFill>
  );
};
