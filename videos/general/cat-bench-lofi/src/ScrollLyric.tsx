import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {H, SAFE, W} from './constants';
import {SONG_DURATION, SONG_LINES} from './data/yoru_lines';

/* ---- 값 모음 (여기서 조절) ---- */
const LEAD = 0.12;                // 줄이 시작되기 이만큼 먼저 스크롤을 시작
const SPRING_OMEGA = 16, SPRING_ZETA = 0.72;   // 스프링 세기 (클수록 빠름) / 감쇠 (작을수록 더 튕김)
const MOVE = 0.7;                 // 스크롤 시간
/** 화면 구성: portrait = 2:3 세로, wide = 16:9 가로 (가사는 하늘 쪽 오른쪽 영역에, 고양이는 왼쪽) */
const LAYOUTS = {
  portrait: {w: W, h: H, left: SAFE.x, width: W - 2 * SAFE.x, anchor: 235, enCur: 120, enOther: 68, ko: 66, bg: 'store60.mp4', overlay: true},
  wide: {w: 1920, h: 1080, left: 890, width: 940, anchor: 165, enCur: 108, enOther: 60, ko: 60, bg: 'store_wide60.mp4', overlay: false},
};
const COLOR = '#FFFBF5';
const POP = 0.08, POP_DECAY = 0.11;     // "Bang" 단어가 튀는 크기(8%)와 되돌아오는 시간
const OPACITY_BY_DIST = [1, 0.5, 0.28, 0.1];

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
/** 부드러운 이동: 출발할 때 천천히 가속하고(smoothstep) 끝에서 길게 감속(easeOut)하는 혼합 */
const smooth = (x: number) => { x = clamp(x); return 0.6 * x * x * (3 - 2 * x) + 0.4 * (1 - Math.pow(1 - x, 3)); };
const FONT = `@font-face{font-family:'MiSansLatin';font-weight:700;src:url('${staticFile('fonts/misans-latin/MiSansLatin-Bold.woff2')}') format('woff2');}
@font-face{font-family:'SUIT';font-weight:700;src:url('${staticFile('fonts/suit/SUIT-Bold.otf')}') format('opentype');}`;

/** 글자를 직접 재서 줄바꿈 줄 수를 정한다 (스크롤 거리가 정확해야 해서) */
let ctx: CanvasRenderingContext2D | null = null;
const wordW = (s: string) => {
  ctx = ctx ?? document.createElement('canvas').getContext('2d')!;
  ctx.font = "700 100px 'MiSansLatin'";
  return ctx.measureText(s).width / 100;           // 글자 크기 1 기준 폭
};
const enLines = (text: string, size: number, WIDTH: number) => {
  let lines = 1, cur = 0;
  for (const w of text.split(' ')) {
    const ww = wordW(w + ' ') * size;
    if (cur + ww > WIDTH + wordW(' ') * size && cur > 0) { lines++; cur = ww; } else cur += ww;
  }
  return lines;
};

export const ScrollLyric: React.FC<{layout?: 'portrait' | 'wide'; bg?: string}> = ({layout = 'portrait', bg}) => {
  const LY = LAYOUTS[layout];
  const WIDTH = LY.width, ANCHOR = LY.anchor, EN_CUR = LY.enCur, EN_OTHER = LY.enOther, KO_SIZE = LY.ko;
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load("700 100px 'MiSansLatin'"), document.fonts.load("700 66px 'SUIT'")])
      .then(() => { setReady(true); continueRender(handle); }).catch((e) => cancelRender(e));
  }, [handle]);
  if (!ready) return <AbsoluteFill style={{background: '#0b0d1a'}}><style>{FONT}</style></AbsoluteFill>;

  const L = SONG_LINES;
  // 스프링: 줄이 바뀔 때마다 "지금 줄 번호"가 용수철처럼 다음 번호로 튕겨 가서 안착한다 (슝~ 하고 지나가며 살짝 넘쳤다가 멈춤)
  const springStep = (tau: number) => {
    if (tau <= 0) return 0;
    const z = SPRING_ZETA, w = SPRING_OMEGA, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * tau));
  };
  const f = L.reduce((s, l, i) => (i === 0 ? s : s + springStep(t - (l.start - LEAD))), 0);   // 각 단계가 +1 칸씩
  const c = L.map((_, i) => clamp(1 - Math.abs(f - i)));
  const focus = f;
  const size = (i: number) => EN_OTHER + (EN_CUR - EN_OTHER) * c[i];
  const koH = (i: number) => c[i] * (KO_SIZE * 1.3 + 22);
  const hEn = (i: number) => enLines(L[i].en, EN_OTHER, WIDTH) * EN_OTHER * 1.12 * (1 - c[i]) + enLines(L[i].en, EN_CUR, WIDTH) * EN_CUR * 1.12 * c[i];   // 줄 수가 바뀌어도 높이가 튀지 않게 섞는다
  const height = (i: number) => hEn(i) + koH(i) + 34 + c[i] * 22;
  const top: number[] = [];
  L.reduce((y, _, i) => { top[i] = y; return y + height(i); }, 0);
  const lo = Math.max(0, Math.min(L.length - 2, Math.floor(f)));
  const focusTop = top[lo] + (top[lo + 1] - top[lo]) * (f - lo);      // 넘쳤다 돌아오는 구간도 끊김 없이 이어지게 선형으로 계산
  const shift = ANCHOR - focusTop;

  const opacityAt = (d: number) => {
    const i = Math.min(Math.floor(d), OPACITY_BY_DIST.length - 2), f = d - Math.floor(d);
    return d >= OPACITY_BY_DIST.length - 1 ? OPACITY_BY_DIST[OPACITY_BY_DIST.length - 1] : OPACITY_BY_DIST[i] + (OPACITY_BY_DIST[i + 1] - OPACITY_BY_DIST[i]) * f;
  };

  const renderEn = (i: number) => {
    const l = L[i];
    if (!l.pops) return l.en;
    return l.en.split(' ').map((w, k) => {
      const tp = l.pops![k];
      const dt = tp === undefined ? -1 : t - tp;
      const s = dt >= 0 ? 1 + POP * Math.exp(-dt / POP_DECAY) : 1;
      return <span key={k} style={{display: 'inline-block', transform: `scale(${s})`, transformOrigin: '50% 80%', marginRight: '0.28em'}}>{w}</span>;
    });
  };

  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT}</style>
      <Audio src={staticFile('yoru.mp3')} />
      <OffthreadVideo src={staticFile(bg ?? LY.bg)} muted style={{position: 'absolute', left: 0, top: 0, width: LY.w, height: LY.h}} />
      {LY.overlay && <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.9) 0%, rgba(8,10,28,0.82) 34%, rgba(8,10,28,0.5) 48%, rgba(8,10,28,0) 58%)'}} />}
      {LY.overlay && <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0) 76%, rgba(8,10,28,0.95) 88%)'}} />}
      <div style={{position: 'absolute', left: LY.left, top: 0, width: WIDTH, textShadow: '0 6px 36px rgba(6,8,24,0.5)'}}>
        {L.map((l, i) => {
          const d = Math.abs(i - focus);
          if (d > 3.2) return null;
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: top[i] + shift, width: WIDTH, opacity: opacityAt(d), filter: d > 0.05 ? `blur(${Math.min(5, 2.5 * d)}px)` : undefined}}>
              <div style={{fontFamily: "'MiSansLatin', sans-serif", fontWeight: 700, fontSize: size(i), lineHeight: 1.12, letterSpacing: -1, color: COLOR}}>{renderEn(i)}</div>
              {c[i] > 0.02 && <div style={{fontFamily: 'SUIT, sans-serif', fontWeight: 700, fontSize: KO_SIZE, lineHeight: 1.3, marginTop: 22 * c[i], color: COLOR, opacity: clamp((c[i] - 0.15) / 0.85)}}>{l.ko}</div>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
export const SCROLL_FRAMES = Math.ceil(SONG_DURATION * 60);
