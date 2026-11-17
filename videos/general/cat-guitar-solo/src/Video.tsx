import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AUDIO_FILE, C, CLIP_META, CLIP_VIEW, FPS, H, IMPACT, LABEL, LYRICS, LYRIC_HOLD, SCHEDULE, W} from './constants';
import {beatClipTime, clamp, easeOut, prevIdx} from './anim';

/** 노래 시간에 맞는 클립 프레임 이미지 */
const ClipCat: React.FC<{t: number}> = ({t}) => {
  const entry = SCHEDULE.find((s) => t >= s.from && t < s.to) ?? SCHEDULE[SCHEDULE.length - 1];
  const meta = CLIP_META[entry.clip];
  const ct = beatClipTime(t, IMPACT[entry.clip], meta.duration);
  const idx = clamp(Math.floor((ct / meta.duration) * meta.frames), 0, meta.frames - 1);
  const s = CLIP_VIEW.scale;
  return (
    <Img
      src={staticFile(`clips/${entry.clip}/f${String(idx).padStart(3, '0')}.webp`)}
      style={{position: 'absolute', left: CLIP_VIEW.cx - (meta.w * s) / 2, top: CLIP_VIEW.top, width: meta.w * s, height: meta.h * s}}
    />
  );
};

const Bg: React.FC<{t: number; x: number; zoom: number}> = ({t, x, zoom}) => {
  const flick = 0.92 + 0.05 * Math.sin(t * 5.1) + 0.03 * Math.sin(t * 11.3);
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px) scale(${1.05 * zoom})`, transformOrigin: '70% 50%'}}>
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.bgTop} 0%, ${C.bgMid} 55%, #3a1d25 100%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 55% 60% at 70% 30%, ${C.amber}cc 0%, ${C.coral}55 35%, transparent 75%)`, opacity: 0.8 * flick}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 40% 30% at 12% 88%, ${C.teal}55 0%, transparent 80%)`}} />
      {[[200, 1180, 90], [420, 1060, 44], [110, 980, 30], [1500, 260, 50]].map(([cx, cy, r], i) => (
        <div key={i} style={{position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%', background: i === 3 ? C.coral : C.amber, filter: 'blur(16px)', opacity: 0.45 * flick}} />
      ))}
    </AbsoluteFill>
  );
};

const Lyrics: React.FC<{t: number}> = ({t}) => {
  const idx = prevIdx(LYRICS.map((l) => l.t), t);
  const cur = idx >= 0 ? LYRICS[idx] : null;
  const age = cur ? t - cur.t : 99;
  const show = cur && age < LYRIC_HOLD;
  const k = show ? easeOut(age / 0.22) : 0;
  const out = show ? clamp((LYRIC_HOLD - age) / 0.12) : 0;
  return (
    <div style={{position: 'absolute', left: 120, top: 170, fontFamily: 'Inter, sans-serif', color: C.text}}>
      <div style={{display: 'flex', gap: 12, marginBottom: 26, opacity: 0.9}}>
        <div style={{width: 18, height: 18, borderRadius: 9, background: '#fff'}} />
        <div style={{width: 18, height: 18, borderRadius: 9, background: '#fff'}} />
      </div>
      <div style={{minHeight: 240, opacity: k * out, transform: `translateY(${(1 - k) * 30}px)`}}>
        {show && cur!.lines.map((s, i) => (
          <div key={i} style={{fontSize: 104, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, textShadow: '0 4px 20px rgba(0,0,0,0.45)'}}>{s}</div>
        ))}
      </div>
      <div style={{marginTop: 24, fontSize: 42, fontWeight: 600, opacity: 0.85}}>{LABEL} ♪</div>
    </div>
  );
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  /* 카메라: 처음 0.9초에 클로즈업에서 빠지며 자리 잡고, 이후 8초 주기로 천천히 좌우 흔들림.
     캐릭터는 배경보다 1.7배 더 움직여 깊이감을 준다 (레퍼런스 영상 측정값). */
  const intro = 1 + 0.43 * (1 - easeOut(t / 0.9));
  const bgIntro = 1 + 0.1 * (1 - easeOut(t / 0.9));
  const ph = (2 * Math.PI * t) / 8;
  const A = 0.01 * W;
  const bgX = A * Math.sin(ph);
  const catX = 1.7 * A * Math.sin(ph), catY = 0.006 * H * Math.cos(ph + 0.5);
  const fade = interpolate(frame, [0, 30], [1, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Audio src={staticFile(AUDIO_FILE)} />
      <Bg t={t} x={bgX} zoom={bgIntro} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 55% 50%, rgba(0,0,0,0) 55%, rgba(8,4,12,0.5) 100%)', pointerEvents: 'none'}} />
      <Lyrics t={t} />
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${CLIP_VIEW.cx}px 700px`, transform: `scale(${intro}) translate(${catX}px, ${catY}px)`}}>
        <ClipCat t={t} />
      </div>
      <AbsoluteFill style={{background: '#0a0610', opacity: fade, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
