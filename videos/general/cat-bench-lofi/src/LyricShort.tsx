import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {H, SAFE, W} from './constants';
import {MISANS_BOLD} from './fonts';
import {SONG_DURATION, SONG_LINES, SongLine} from './data/luolei_lines';

/* ---- 값 모음 (여기서 조절) ---- */
const FADE_IN = 0.3;           // 줄이 나타나는 시간
const FADE_OUT = 0.4;          // 사라지는 시간 (다음 줄이 나오기 직전에 시작해서 끝남)
const LEAD = 0.08;             // 노래보다 이만큼 먼저 나타남
const TEXT_TOP = 330;
const WIDTH = W - 2 * SAFE.x;
const ZH_FIT = 0.9, ZH_MAX = 270;            // 중국어 크기: 가장 긴 줄 글자 수로 맞춤
const KO_RATIO = 0.5, KO_FIT = 0.92;         // 한국어 크기: 중국어의 절반, 줄 폭 안에서
const TEXT_COLOR = '#FFFBF5';                // 깨끗한 웜 화이트 (크림 기운은 아주 살짝)

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

const FONT_CSS = `
${MISANS_BOLD.map((m) => `@font-face{font-family:'MiSans';font-weight:700;src:url('${staticFile('fonts/misans/' + m.f)}') format('woff2');unicode-range:${m.r};}`).join('\n')}
@font-face{font-family:'SUIT';font-weight:700;src:url('${staticFile('fonts/suit/SUIT-Bold.otf')}') format('opentype');}
`;

export const LyricShort: React.FC<{showIndex?: boolean}> = ({showIndex = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  let a = -1;
  for (let i = 0; i < SONG_LINES.length; i++) if (t >= SONG_LINES[i].start - LEAD) a = i;
  const L: SongLine | null = a >= 0 ? SONG_LINES[a] : null;
  const next = a + 1 < SONG_LINES.length ? SONG_LINES[a + 1] : null;

  const age = L ? t - (L.start - LEAD) : 0;
  const outStart = next ? next.start - LEAD - FADE_OUT : SONG_DURATION - FADE_OUT;
  const alpha = L ? easeInOut(clamp(age / FADE_IN)) * (1 - easeInOut(clamp((t - outStart) / FADE_OUT))) : 0;
  const rise = (1 - easeOut(age / FADE_IN)) * 14;          // 나타날 때 아주 살짝만 아래에서 올라옴

  const zhLines = L ? L.zh.split('\n') : [];
  const m = L ? Math.max(...zhLines.map((x) => Array.from(x).length)) : 4;
  const zs = Math.min(ZH_MAX, Math.floor((WIDTH * ZH_FIT) / (m + 0.35)));
  const ks = L ? Math.min(Math.round(zs * KO_RATIO), Math.floor((WIDTH * KO_FIT) / (Array.from(L.ko).length * 0.86))) : 100;

  // 은은한 가로등 불빛 숨쉬기 (배경과 어울리게)
  const breathe = 0.5 + 0.5 * Math.sin((t / 2.2) * Math.PI * 2);

  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT_CSS}</style>
      <Audio src={staticFile('luolei.mp3')} />
      <OffthreadVideo src={staticFile('bg60.mp4')} muted style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.5) 0%, rgba(8,10,28,0.26) 40%, rgba(8,10,28,0) 58%)'}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 38% 26% at 90% 40%, rgba(255,176,90,${0.08 + 0.05 * breathe}) 0%, rgba(255,176,90,0) 100%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(5,6,16,0.32) 100%)'}} />
      {L && (
        <div style={{position: 'absolute', left: SAFE.x, top: TEXT_TOP, width: WIDTH, opacity: alpha, transform: `translateY(${rise}px)`, color: TEXT_COLOR}}>
          <div style={{fontFamily: "'MiSans', sans-serif", fontWeight: 700, fontSize: zs, lineHeight: 1.16, letterSpacing: 4, whiteSpace: 'pre-line', textShadow: '0 6px 36px rgba(6,8,24,0.45)'}}>{L.zh}</div>
          <div style={{marginTop: 50, fontFamily: "'SUIT', sans-serif", fontWeight: 700, fontSize: ks, lineHeight: 1.3, textShadow: '0 4px 26px rgba(6,8,24,0.45)'}}>{L.ko}</div>
        </div>
      )}
      {showIndex && L && <div style={{position: 'absolute', left: 40, top: 40, fontFamily: 'SUIT, sans-serif', fontSize: 44, color: 'rgba(255,255,255,0.55)'}}>#{a + 1} · {t.toFixed(2)}s</div>}
    </AbsoluteFill>
  );
};
