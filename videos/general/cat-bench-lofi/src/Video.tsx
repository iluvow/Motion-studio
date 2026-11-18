import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AUDIO_FILE, C, CATS, FPS, H, LABEL, LAMP, LINES, LINE_HOLD, SAFE, W} from './constants';

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

/* 글꼴: Noto Sans KR (npm @fontsource) */
const FONT_CSS = `
@font-face{font-family:'NotoKR';font-weight:800;src:url(${staticFile('fonts/noto-sans-kr-korean-800-normal.woff2')}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F;}
@font-face{font-family:'NotoKR';font-weight:700;src:url(${staticFile('fonts/noto-sans-kr-korean-700-normal.woff2')}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F;}
@font-face{font-family:'NotoKR';font-weight:800;src:url(${staticFile('fonts/noto-sans-kr-latin-800-normal.woff2')}) format('woff2');unicode-range:U+0000-00FF;}
@font-face{font-family:'NotoKR';font-weight:700;src:url(${staticFile('fonts/noto-sans-kr-latin-700-normal.woff2')}) format('woff2');unicode-range:U+0000-00FF;}
`;

/* 결정적 난수 (렌더할 때마다 같은 낙엽 경로) */
const rnd = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const LEAVES = (() => {
  const r = rnd(11);
  return Array.from({length: 7}, (_, i) => ({
    x0: 260 + r() * 900, y0: 900 + r() * 1200, speed: 34 + r() * 26, sway: 26 + r() * 34, period: 6 + r() * 5,
    phase: r() * 6.28, rot0: r() * 360, rotSpeed: (r() - 0.5) * 70, size: 13 + r() * 11, color: C.leaf[i % C.leaf.length],
  }));
})();

const Leaves: React.FC<{t: number}> = ({t}) => (
  <>
    {LEAVES.map((l, i) => {
      const span = H - 800;                                             // 아래쪽 절반에서만 천천히 떨어진다
      const y = 800 + ((l.y0 - 800 + t * l.speed) % span);
      const x = l.x0 + l.sway * Math.sin((2 * Math.PI * t) / l.period + l.phase) - t * 6;
      const fade = clamp(Math.min(y - 800, H - 20 - y) / 120);             // 위/아래 끝에서 자연스럽게 사라짐
      return (
        <div key={i} style={{position: 'absolute', left: x, top: y, width: l.size, height: l.size * 1.5, opacity: 0.8 * fade,
          transform: `rotate(${l.rot0 + t * l.rotSpeed}deg)`, background: l.color, clipPath: 'polygon(50% 0%, 92% 38%, 70% 100%, 30% 100%, 8% 38%)'}} />
      );
    })}
  </>
);

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  /* 아주 작은 움직임들 (카메라는 고정) */
  const flicker = 0.22 + 0.035 * Math.sin(t * 2.3) + 0.022 * Math.sin(t * 6.1 + 1) + 0.012 * Math.sin(t * 13.7);   // 가로등 불빛
  const breathe = 1 + 0.0035 * Math.sin((2 * Math.PI * t) / 3.4);                                                    // 고양이 숨쉬기
  const sky = 0.035 + 0.025 * Math.sin((2 * Math.PI * t) / 9);                                                       // 하늘빛 숨쉬기
  const grainIdx = Math.floor(t * 12) % 8;
  const fade = interpolate(frame, [0, 24], [1, 0], {extrapolateRight: 'clamp'});

  /* 글자 */
  let cur = null as null | (typeof LINES)[number];
  for (const l of LINES) if (t >= l.t) cur = l;
  const age = cur ? t - cur.t : 99;
  const show = !!cur && age < LINE_HOLD;
  const k = show ? easeOut(age / 0.25) : 0;
  const out = show ? clamp((LINE_HOLD - age) / 0.15) : 0;

  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT_CSS}</style>
      <Audio src={staticFile(AUDIO_FILE)} />
      <Img src={staticFile('scene.png')} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
      {/* 고양이: 숨쉬기만 (바닥 기준으로 0.35%) */}
      <Img src={staticFile('cats.png')} style={{position: 'absolute', left: CATS.left, top: CATS.top, width: CATS.w, height: CATS.h, transformOrigin: '50% 90%', transform: `scaleY(${breathe})`}} />
      {/* 가로등 불빛 깜빡임 */}
      <div style={{position: 'absolute', left: LAMP.x - 520, top: LAMP.y - 520, width: 1040, height: 1040, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${C.amber},${flicker}) 0%, rgba(${C.amber},${flicker * 0.45}) 28%, rgba(${C.amber},0) 66%)`, mixBlendMode: 'screen'}} />
      {/* 하늘빛 숨쉬기 */}
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(8,10,28,${sky}) 0%, rgba(8,10,28,0) 60%)`}} />
      <Leaves t={t} />
      {/* 필름 그레인 */}
      <Img src={staticFile(`grain_${grainIdx}.png`)} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: 0.1, mixBlendMode: 'overlay'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 58%, rgba(5,6,16,0.38) 100%)'}} />

      {/* 가사 해석 (자리 표시) */}
      <div style={{position: 'absolute', left: SAFE.x, top: 300, width: W - SAFE.x * 2, fontFamily: 'NotoKR, Inter, sans-serif', color: C.text}}>
        <div style={{display: 'flex', gap: 14, marginBottom: 34, opacity: 0.9}}>
          <div style={{width: 20, height: 20, borderRadius: 10, background: '#fff'}} />
          <div style={{width: 20, height: 20, borderRadius: 10, background: '#fff'}} />
        </div>
        <div style={{minHeight: 520, opacity: k * out, transform: `translateY(${(1 - k) * 34}px)`}}>
          {show && (
            <>
              <div style={{fontSize: 46, fontWeight: 700, color: C.sub, marginBottom: 26, letterSpacing: 0.5}}>{cur!.en}</div>
              <div style={{fontSize: 108, fontWeight: 800, lineHeight: 1.22, letterSpacing: -2, whiteSpace: 'pre-line', textShadow: '0 4px 24px rgba(0,0,0,0.5)'}}>{cur!.ko}</div>
            </>
          )}
        </div>
        <div style={{marginTop: 30, fontSize: 44, fontWeight: 700, opacity: 0.8}}>{LABEL} ♪</div>
      </div>
      <AbsoluteFill style={{background: '#06070f', opacity: fade, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
