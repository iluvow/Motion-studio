import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ARM_POSES, AUDIO_FILE, C, CAT, FPS, H, LABEL, LYRICS, LYRIC_HOLD, PERIOD, TAIL_PIVOT, W} from './constants';
import {active, bump, clamp, cumulative, easeOut, hit, prevIdx, strum} from './anim';

const S = CAT.scale;
const layerStyle = (opacity: number): React.CSSProperties => ({
  position: 'absolute', left: 0, top: 0, width: CAT.w * S, height: CAT.h * S, opacity,
});
const L: React.FC<{file: string; opacity: number}> = ({file, opacity}) =>
  opacity > 0.003 ? <Img src={staticFile(`cat/${file}.png`)} style={layerStyle(opacity)} /> : null;

/** 연주 팔: 손 높이에 가장 가까운 자세 한 장 (섞으면 손이 두 개로 보여서 한 장씩 바꾼다) */
function armPose(p: number) {
  const y = ARM_POSES[0].y - (ARM_POSES[0].y - ARM_POSES[ARM_POSES.length - 1].y) * clamp(p);
  let best = ARM_POSES[0];
  for (const a of ARM_POSES) if (Math.abs(a.y - y) < Math.abs(best.y - y)) best = a;
  return best.name;
}
const ss = (x: number, a: number, b: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const Cat: React.FC<{t: number}> = ({t}) => {
  /* ── 연주 팔 ── */
  const armName = armPose(strum(t));

  /* ── 머리: 한 자세를 유지하다가 아주 짧게 바뀐다 (우선순위: 깜빡임 > 끄덕임 > 갸웃 > 졸린 눈) ── */
  const act = active(t);
  const nodRaw = hit(t, 0.13) * act;                                   // 킥 직후 잠깐 1
  const tiltRaw = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / (PERIOD * 8) + 1);
  const halfRaw = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 5.7);
  const bl = (t - 1.1 + 340) % 3.4;
  const blinkRaw = bl < 0.14 ? 1 : 0;
  const wBlink = ss(blinkRaw, 0.2, 0.9);
  const wNod = (1 - wBlink) * ss(nodRaw, 0.38, 0.5);
  const wTilt = (1 - wBlink) * (1 - wNod) * ss(tiltRaw, 0.62, 0.7);
  const wHalf = (1 - wBlink) * (1 - wNod) * (1 - wTilt) * ss(halfRaw, 0.62, 0.7);
  const wNeutral = Math.max(0, 1 - wBlink - wNod - wTilt - wHalf);
  const hOp = cumulative([wNeutral, wNod, wTilt, wHalf, wBlink]);
  const heads = ['neutral', 'nod', 'tilt', 'half', 'blink'];

  /* ── 꼬리: 기본 ↔ 위로 ↔ 오른쪽, 몸보다 늦게 흔들림 ── */
  const u = (t / (PERIOD * 8)) % 1;
  const up = ss(bump(u, 0.45, 0.14), 0.55, 0.75), sw = ss(bump(u, 0.9, 0.12), 0.55, 0.75);
  const tw = [Math.max(0, 1 - up - sw), up, sw];
  const tOp = cumulative(tw);
  const tailRot = 5 * Math.sin((2 * Math.PI * t) / (PERIOD * 4) - 0.9);

  /* ── 몸 전체: 숨쉬기, 킥에 살짝 눌림, 천천히 기울기 ── */
  const breathe = 1 + 0.004 * Math.sin((2 * Math.PI * t) / 3.1);
  const k = hit(t, 0.12) * act;
  const sway = 0.5 * Math.sin((2 * Math.PI * t) / (PERIOD * 4));

  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, width: CAT.w * S, height: CAT.h * S,
        transformOrigin: `${489 * S}px ${1250 * S}px`,
        transform: `translateY(${k * 9}px) rotate(${sway}deg) scale(${1 + k * 0.004}, ${breathe - k * 0.012})`,
      }}
    >
      {/* 꼬리 (몸 뒤) */}
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${TAIL_PIVOT.x * S}px ${TAIL_PIVOT.y * S}px`, transform: `rotate(${tailRot}deg)`}}>
        <L file="tail_base" opacity={tOp[0]} />
        <L file="tail_up" opacity={tOp[1]} />
        <L file="tail_swish" opacity={tOp[2]} />
      </div>
      <L file={`arm_${armName}`} opacity={1} />
      {heads.map((nm, i) => <L key={nm} file={`head_${nm}`} opacity={hOp[i]} />)}
    </div>
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

  /* 카메라: 처음에 클로즈업에서 빠지며 자리 잡고(0.9초), 이후 8초 주기로 천천히 좌우 흔들림.
     캐릭터는 배경보다 1.7배 더 움직여 깊이감을 준다. (레퍼런스 영상 측정값) */
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
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${CAT.cx}px 700px`, transform: `scale(${intro}) translate(${catX}px, ${catY}px)`}}>
        <div
          style={{
            position: 'absolute', left: CAT.cx - (CAT.w * S) / 2, top: CAT.top, width: CAT.w * S, height: CAT.h * S,
            filter: 'drop-shadow(0 0 3px rgba(255,238,196,0.95)) drop-shadow(0 0 28px rgba(255,150,70,0.4))',
          }}
        >
          <Cat t={t} />
        </div>
      </div>
      <AbsoluteFill style={{background: '#0a0610', opacity: fade, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
