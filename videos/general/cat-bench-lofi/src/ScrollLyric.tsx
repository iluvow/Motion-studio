import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {H, SAFE, W} from './constants';
import {SONG_DURATION, SONG_LINES} from './data/yoru_lines';

/* ---- 값 모음 (여기서 조절) ---- */
const LEAD = 0.1;                 // 줄이 시작되기 이만큼 먼저 스크롤을 시작
const MOVE = 0.45;                // 스크롤 시간
const ANCHOR = 235;               // 지금 줄의 위쪽 위치
const WIDTH = W - 2 * SAFE.x;
const EN_CUR = 120, EN_OTHER = 68;      // 영어 글자 크기 (지금 줄 / 나머지)
const KO_SIZE = 66;
const COLOR = '#FFFBF5';
const POP = 0.08, POP_DECAY = 0.11;     // "Bang" 단어가 튀는 크기(8%)와 되돌아오는 시간
const OPACITY_BY_DIST = [1, 0.5, 0.28, 0.1];

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const FONT = `@font-face{font-family:'MiSansLatin';font-weight:700;src:url('${staticFile('fonts/misans-latin/MiSansLatin-Bold.woff2')}') format('woff2');}
@font-face{font-family:'SUIT';font-weight:700;src:url('${staticFile('fonts/suit/SUIT-Bold.otf')}') format('opentype');}`;

/** 글자를 직접 재서 줄바꿈 줄 수를 정한다 (스크롤 거리가 정확해야 해서) */
let ctx: CanvasRenderingContext2D | null = null;
const wordW = (s: string) => {
  ctx = ctx ?? document.createElement('canvas').getContext('2d')!;
  ctx.font = "700 100px 'MiSansLatin'";
  return ctx.measureText(s).width / 100;           // 글자 크기 1 기준 폭
};
const enLines = (text: string, size: number) => {
  let lines = 1, cur = 0;
  for (const w of text.split(' ')) {
    const ww = wordW(w + ' ') * size;
    if (cur + ww > WIDTH + wordW(' ') * size && cur > 0) { lines++; cur = ww; } else cur += ww;
  }
  return lines;
};

export const ScrollLyric: React.FC<{bg?: string}> = ({bg = 'store60.mp4'}) => {
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
  // 줄마다 "지금 줄 정도" c (0~1): 시작 LEAD 전부터 MOVE 동안 올라가고, 다음 줄이 시작될 때 같은 속도로 내려간다
  const c = L.map((l, i) => {
    const up = i === 0 ? 1 : easeOut((t - (l.start - LEAD)) / MOVE);
    const down = i + 1 < L.length ? easeOut((t - (L[i + 1].start - LEAD)) / MOVE) : 0;
    return clamp(up - down);
  });
  const focus = c.reduce((s, ci, i) => s + ci * i, 0);          // 연속적인 "지금 줄 번호"
  const size = (i: number) => EN_OTHER + (EN_CUR - EN_OTHER) * c[i];
  const koH = (i: number) => c[i] * (KO_SIZE * 1.3 + 22);
  const height = (i: number) => enLines(L[i].en, size(i)) * size(i) * 1.12 + koH(i) + 34 + c[i] * 22;
  const top: number[] = [];
  L.reduce((y, _, i) => { top[i] = y; return y + height(i); }, 0);
  const focusTop = c.reduce((s, ci, i) => s + ci * top[i], 0);
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
      <OffthreadVideo src={staticFile(bg)} muted style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.9) 0%, rgba(8,10,28,0.82) 34%, rgba(8,10,28,0.5) 48%, rgba(8,10,28,0) 58%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0) 76%, rgba(8,10,28,0.95) 88%)'}} />
      <div style={{position: 'absolute', left: SAFE.x, top: 0, width: WIDTH, textShadow: '0 6px 36px rgba(6,8,24,0.5)'}}>
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
