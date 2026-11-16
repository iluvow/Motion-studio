import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AUDIO_FILE, C, CAT, FPS, KICKS, LABEL, LYRICS, PERIOD, SIZE} from './constants';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

function prevIdx(times: number[], t: number) {
  let lo = 0, hi = times.length - 1, r = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (times[m] <= t) { r = m; lo = m + 1; } else hi = m - 1;
  }
  return r;
}

/** 박자에 맞춰 연주 자세 결정: 킥에서 내려치고(down), 킥과 킥 사이(엇박)에 올린다(up). 쉬는 구간은 내린 자세 */
function pose(t: number): 'down' | 'up' | 'blink' {
  const i = prevIdx(KICKS, t);
  let p: 'down' | 'up' = 'down';
  if (i >= 0 && i + 1 < KICKS.length) {
    const a = KICKS[i], b = KICKS[i + 1];
    if (b - a < 0.6 && t >= (a + b) / 2) p = 'up';
  }
  // 깜빡임: 3.4초마다 0.14초, 내린 자세일 때만
  const bl = (t - 1.1 + 340) % 3.4;
  if (p === 'down' && bl < 0.14) return 'blink';
  return p;
}

const Bg: React.FC<{t: number}> = ({t}) => {
  const flick = 0.92 + 0.05 * Math.sin(t * 5.1) + 0.03 * Math.sin(t * 11.3);
  const drift = Math.sin(t * 0.5) * 8;
  return (
    <AbsoluteFill style={{transform: `translateX(${drift}px) scale(1.04)`}}>
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.skyTop} 0%, ${C.skyMid} 45%, #3a2a3c 70%, ${C.ground} 100%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 48% at 8% 6%, ${C.glow} 0%, ${C.glowSoft}aa 22%, transparent 70%)`, opacity: flick}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 22% at 30% 100%, ${C.glowSoft}77 0%, transparent 75%)`}} />
      {/* 가로등 불빛 (흐린 원) */}
      {[[170, 1010, 70], [330, 930, 36], [90, 880, 26]].map(([x, y, r], i) => (
        <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: '#ffb15a', filter: 'blur(14px)', opacity: 0.55 * flick}} />
      ))}
    </AbsoluteFill>
  );
};

const Lyrics: React.FC<{t: number}> = ({t}) => {
  const idx = prevIdx(LYRICS.map((l) => l.t), t);
  const cur = idx >= 0 ? LYRICS[idx] : null;
  const k = cur ? easeOut((t - cur.t) / 0.28) : 0;
  return (
    <div style={{position: 'absolute', left: 96, top: 130, fontFamily: 'Inter, sans-serif', color: C.text}}>
      <div style={{display: 'flex', gap: 10, marginBottom: 22, opacity: 0.9}}>
        <div style={{width: 14, height: 14, borderRadius: 7, background: '#fff'}} />
        <div style={{width: 14, height: 14, borderRadius: 7, background: '#fff'}} />
      </div>
      {cur && (
        <div style={{opacity: k, transform: `translateY(${(1 - k) * 28}px)`}}>
          {cur.lines.map((s, i) => (
            <div key={i} style={{fontSize: 84, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, textShadow: '0 4px 18px rgba(0,0,0,0.45)'}}>{s}</div>
          ))}
        </div>
      )}
      <div style={{marginTop: 26, fontSize: 38, fontWeight: 600, opacity: 0.85}}>{LABEL} ♪</div>
    </div>
  );
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const i = prevIdx(KICKS, t);
  const since = i >= 0 ? t - KICKS[i] : 9;
  const active = i >= 0 && i + 1 < KICKS.length && KICKS[i + 1] - KICKS[i] < 0.6 ? 1 : 0.4;
  const hit = Math.exp(-since / 0.12) * active;            // 킥 순간 1 → 0
  const sway = Math.sin((2 * Math.PI * t) / (PERIOD * 4)) * 0.7; // 2마디에 한 번 좌우로 기울기
  const bob = Math.sin((2 * Math.PI * t) / (PERIOD * 2)) * 4;    // 느린 위아래
  const p = pose(t);
  const w = CAT.w * CAT.scale, h = CAT.h * CAT.scale;
  const flick = 0.9 + 0.06 * Math.sin(t * 5.1) + 0.04 * Math.sin(t * 11.3);
  const fade = interpolate(frame, [0, 10], [1, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile(AUDIO_FILE)} />
      <Bg t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(8,4,12,0.45) 100%)', pointerEvents: 'none'}} />
      <Lyrics t={t} />
      <div
        style={{
          position: 'absolute', left: CAT.left, top: CAT.top, width: w, height: h,
          transformOrigin: '50% 100%',
          transform: `translateY(${bob + hit * 10}px) rotate(${sway}deg) scale(${1 + hit * 0.006}, ${1 - hit * 0.014})`,
          filter: `drop-shadow(0 0 10px rgba(255,170,80,${0.55 * flick})) drop-shadow(0 0 34px rgba(255,120,40,${0.35 * flick}))`,
        }}
      >
        <Img src={staticFile(`cat/${p}.png`)} style={{width: w, height: h}} />
      </div>
      <AbsoluteFill style={{background: '#0a0610', opacity: fade, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
