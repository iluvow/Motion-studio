import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

export type Line = {en: string; ko: string; sub?: string; start: number; big?: boolean};
export type SongData = {name: string; duration: number; beats: number[]; lines: Line[]};
export type InvertProps = {
  name: string; // public/data/<name>.json
  audio: string; // public/ 아래 음원 파일명
  width: number; height: number;
  colors: [string, string]; // 반전되는 두 색 (배경). 글자는 항상 반대색
  flip: 'event' | 'beat' | 'none'; // 반전 시점: 줄/큰단어가 바뀔 때 / 매 박자 / 안 함
  position: 'center' | 'alternate'; // 작은 문장 위치: 가운데 / 위·아래 번갈아
  wordByWord: boolean; // 작은 문장 단어 쌓기
  rgbSplit: boolean; // 글자 RGB 색 번짐
  fontSize: number; // 작은 문장 글자 크기
  glow: boolean; // 밝은 색 배경의 부드러운 그라데이션
  data?: SongData;
};

const FONT = "'InterL','NSK',sans-serif";
const BIG = "'Anton','InterL','NSK',sans-serif";

const mixWhite = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

export const Invert = ({data, audio, colors, flip, position, wordByWord, rgbSplit, fontSize, glow}: InvertProps) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  if (!data) return null;
  const t = frame / fps;
  const end = durationInFrames / fps;
  const L = data.lines;
  const idx = L.reduce((a, l, i) => (t >= l.start ? i : a), -1);
  const line = idx >= 0 ? L[idx] : null;
  const next = idx + 1 < L.length ? L[idx + 1].start : end;
  const span = line ? next - line.start : 1;

  // 큰 단어: 줄 구간 안의 박자에 맞춰 단어 시작 시각을 정함 (박자가 부족하면 균등 분할)
  const bigWords = (l: Line) => l.en.split(/[\s-]+/).filter(Boolean);
  const bigTimes = (l: Line, nx: number) => {
    const w = bigWords(l);
    const inside = data.beats.filter((b) => b >= l.start - 0.05 && b < nx - 0.05);
    if (inside.length >= w.length) return w.map((_, i) => inside[Math.floor((i * inside.length) / w.length)]);
    return w.map((_, i) => l.start + (i * (nx - l.start)) / w.length);
  };

  // 반전 이벤트 시각 목록
  const events: number[] = [];
  L.forEach((l, i) => {
    const nx = i + 1 < L.length ? L[i + 1].start : end;
    if (l.big) bigTimes(l, nx).forEach((x) => events.push(x));
    else events.push(l.start);
  });
  let phase = 0;
  if (flip === 'event') phase = Math.max(events.filter((e) => e <= t + 1e-3).length - 1, 0);
  if (flip === 'beat') phase = data.beats.filter((b) => b <= t).length;
  const bg = colors[phase % 2];
  const fg = colors[(phase + 1) % 2];
  const bgStyle = glow && lum(bg) > 0.35 ? `radial-gradient(ellipse at center, ${mixWhite(bg, 0.45)} 0%, ${bg} 75%)` : bg;

  // 글리치 강도: 마지막 이벤트 직후
  const lastEv = Math.max(...events.filter((e) => e <= t + 1e-3), 0);
  const since = t - lastEv;
  const glitch = rgbSplit ? interpolate(since, [0, 0.16], [8, 1.2], {extrapolateRight: 'clamp'}) : 0;
  const jitter = rgbSplit && since < 0.08 ? ((frame % 3) - 1) * 5 : 0;
  const shadow = rgbSplit ? `${-glitch}px 0 rgba(255,40,60,0.8), ${glitch}px 0 rgba(40,220,255,0.8)` : 'none';

  let body: JSX.Element | null = null;
  if (line && line.big) {
    const ws = bigWords(line);
    const times = bigTimes(line, next);
    const wi = times.reduce((a, x, i) => (t >= x - 1e-3 ? i : a), 0);
    const word = ws[wi].replace(/[,.!?;:]+$/, '').toUpperCase();
    const since2 = t - times[wi];
    const pop = interpolate(since2, [0, 0.12], [1.1, 1], {easing: Easing.out(Easing.quad), extrapolateRight: 'clamp'});
    const size = Math.min(height * 0.32, (width * 0.9) / (Math.max(word.length, 2) * 0.47));
    body = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `translateX(${jitter}px) scale(${pop})`}}>
        <div style={{fontFamily: BIG, color: fg, fontSize: size, lineHeight: 1, textShadow: shadow, letterSpacing: 2, whiteSpace: 'nowrap'}}>{word}</div>
        {line.ko && <div style={{position: 'absolute', bottom: height * 0.14, fontFamily: FONT, color: fg, fontSize: fontSize * 0.9, textShadow: shadow}}>{line.ko}</div>}
      </AbsoluteFill>
    );
  } else if (line) {
    const words = line.en.includes('-') && line.en.split('-').every((p) => p.length <= 1) ? line.en.split('-') : line.en.split(' ');
    const appear = Math.min(span * 0.75, 1.1);
    const upper = position === 'alternate' ? idx % 2 === 0 : false;
    body = (
      <AbsoluteFill style={{justifyContent: position === 'alternate' ? (upper ? 'flex-start' : 'flex-end') : 'center', alignItems: 'center', padding: position === 'alternate' ? '28% 80px' : '0 80px', textAlign: 'center', transform: `translateX(${jitter}px)`}}>
        <div style={{fontFamily: FONT, color: fg, fontSize, lineHeight: 1.35, textShadow: shadow, display: 'flex', flexWrap: 'wrap', gap: fontSize * 0.28, justifyContent: 'center'}}>
          {(wordByWord ? words : [line.en]).map((w, i) => {
            const wt = line.start + (i * appear) / words.length;
            const o = wordByWord ? interpolate(t, [wt, wt + 0.06], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
            return <span key={i} style={{opacity: o}}>{w}</span>;
          })}
        </div>
        {line.ko && <div style={{fontFamily: FONT, color: fg, fontSize: fontSize * 0.92, marginTop: 6, textShadow: shadow}}>{line.ko}</div>}
        {line.sub && <div style={{fontFamily: FONT, color: fg, opacity: 0.6, fontSize: fontSize * 0.7, marginTop: 14}}>{line.sub}</div>}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{background: bgStyle}}>
      <style>{`@font-face{font-family:'InterL';src:url('${staticFile('inter.woff2')}') format('woff2');}@font-face{font-family:'NSK';src:url('${staticFile('nsk.woff2')}') format('woff2');}@font-face{font-family:'Anton';src:url('${staticFile('anton.woff2')}') format('woff2');}`}</style>
      {body}
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
