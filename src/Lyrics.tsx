import {AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CUES} from './lyrics';

const CLIP = 5; // 배경 클립 길이(초)
const FONT = "'InterL','NSK',sans-serif";

const Background = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  // 컷마다 줌/위치를 바꿔 장면 전환 느낌
  const idx = CUES.reduce((a, c, i) => (t >= c.start ? i : a), 0);
  const into = t - CUES[idx].start;
  const zoom = 1.12 + (idx % 3) * 0.08 + into * 0.02;
  const shiftX = ((idx * 37) % 5 - 2) * 18;
  const segs = Math.ceil(durationInFrames / (CLIP * fps)) + 1;
  return (
    <AbsoluteFill style={{background: '#000', filter: 'brightness(1.0) contrast(1.08) saturate(0.75) blur(1.4px)', transform: `translateX(${shiftX}px) scale(${zoom})`}}>
      {Array.from({length: segs}).map((_, i) => (
        <Sequence key={i} from={Math.round(i * CLIP * fps)} durationInFrames={Math.round(CLIP * fps)}>
          <OffthreadVideo muted src={staticFile(i % 2 ? 'bg_rev.mp4' : 'bg.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Grain = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.45, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 8} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>
    </AbsoluteFill>
  );
};

const Caption = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const idx = CUES.reduce((a, c, i) => (t >= c.start ? i : a), -1);
  if (idx < 0) return null;
  const c = CUES[idx];
  const end = idx + 1 < CUES.length ? CUES[idx + 1].start : durationInFrames / fps;
  const op = interpolate(t, [c.start, c.start + 0.12, end - 0.1, end], [0, 1, 1, 0], {easing: Easing.out(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: op, padding: '0 120px', textAlign: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 400, color: '#fff', fontSize: 66, lineHeight: 1.25, letterSpacing: -1}}>{c.en}</div>
      <div style={{fontFamily: FONT, fontWeight: 400, color: 'rgba(255,255,255,0.6)', fontSize: 34, marginTop: 26}}>{c.ko}</div>
    </AbsoluteFill>
  );
};

export const Lyrics = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <style>{`@font-face{font-family:'InterL';src:url('${staticFile('inter.woff2')}') format('woff2');}@font-face{font-family:'NSK';src:url('${staticFile('nsk.woff2')}') format('woff2');}`}</style>
    <Background />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.4) 100%)'}} />
    <Grain />
    <Caption />
    <Audio src={staticFile('song.m4a')} />
  </AbsoluteFill>
);
