import {AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CUES} from './lyrics';

const CLIP = 5; // 배경 클립 길이(초)
export const TINT = true; // 파란 틴트 on/off
const FONT = "'InterL','NSK',sans-serif";

const Background = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const zoom = 1.1 + (frame / fps) * 0.012; // 천천히 밀고 들어가는 느낌
  return (
    <AbsoluteFill style={{background: '#000', filter: 'brightness(1.0) contrast(1.08) saturate(0.75) blur(1.2px)', transform: `scale(${zoom})`}}>
      <OffthreadVideo muted src={staticFile('bg_slow.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
  const glow = '0 0 4px rgba(90,170,255,0.95), 0 0 12px rgba(50,130,255,0.85), 0 0 26px rgba(30,100,255,0.6), 0 2px 3px rgba(0,20,70,0.9)';
  const first = idx === 0;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: op, padding: '0 120px', textAlign: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 400, color: '#e8f3ff', fontSize: 46, lineHeight: 1.3, letterSpacing: first ? 14 : 0.5, textShadow: glow}}>{c.en}</div>
      <div style={{fontFamily: FONT, fontWeight: 400, color: '#e8f3ff', fontSize: 40, marginTop: 8, textShadow: glow}}>{c.ko}</div>
    </AbsoluteFill>
  );
};

export const Lyrics = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <style>{`@font-face{font-family:'InterL';src:url('${staticFile('inter.woff2')}') format('woff2');}@font-face{font-family:'NSK';src:url('${staticFile('nsk.woff2')}') format('woff2');}`}</style>
    <Background />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.4) 100%)'}} />
    {TINT && <AbsoluteFill style={{background: 'rgb(70,120,255)', mixBlendMode: 'soft-light', opacity: 0.14}} />}
    {TINT && <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(40,90,255,0) 45%, rgba(40,90,255,0.16) 100%)', mixBlendMode: 'screen'}} />}
    <Grain />
    <Caption />
    <Audio src={staticFile('song.m4a')} />
  </AbsoluteFill>
);
