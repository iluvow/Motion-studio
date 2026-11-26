import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';

export type Line = {en: string; ko: string; sub?: string; start: number; big?: boolean};
export type SongData = {name: string; duration: number; beats: number[]; lines: Line[]};
export type InvertProps = {
  name: string; // public/data/<name>.json
  audio: string; // public/ 아래 음원 파일명
  width: number; height: number;
  colors: [string, string]; // 반전되는 두 색 (배경). 글자는 항상 반대색
  flip: 'event' | 'none'; // event: 큰 단어가 바뀔 때 + 작은 문장 중에는 매 박자
  position: 'center' | 'cycle'; // 작은 문장 위치: 가운데 / 가운데·아래·위 순환
  reveal: 'type' | 'word' | 'none'; // 작은 문장 등장: 글자 하나씩 / 단어 하나씩 / 한 번에
  rgbSplit: boolean; // 글자 RGB 색 번짐
  sparkle: boolean; // 하단 반짝이 장식
  bigTransition: boolean; // 큰 글씨 → 작은 글씨 전환 때 거대한 첫 글자 확대
  fontSize: number; // 작은 문장 글자 크기 (높이 1080 기준)
  glow: boolean; // 밝은 색 배경의 부드러운 그라데이션
  data?: SongData;
};

const FONT = "'InterL','NSK',sans-serif";
const BIG = "'Anton','InterL','NSK',sans-serif";
// 큰 단어가 놓이는 자리(화면 비율). 매번 위치가 바뀜
const BIG_POS: [number, number][] = [[0.5, 0.45], [0.5, 0.68], [0.4, 0.66], [0.56, 0.5], [0.45, 0.72], [0.5, 0.58]];
const SMALL_Y = [0.5, 0.84, 0.18, 0.5];

const mixWhite = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

const Star = ({size, color, filled}: {size: number; color: string; filled: boolean}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 1 C12.8 8 16 11.2 23 12 C16 12.8 12.8 16 12 23 C11.2 16 8 12.8 1 12 C8 11.2 11.2 8 12 1Z" fill={filled ? color : 'none'} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

export const Invert = ({data, audio, colors, flip, position, reveal, rgbSplit, sparkle, bigTransition, fontSize, glow}: InvertProps) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  if (!data) return null;
  const t = frame / fps;
  const end = durationInFrames / fps;
  const L = data.lines;
  const nextStart = (i: number) => (i + 1 < L.length ? L[i + 1].start : end);
  const idx = L.reduce((a, l, i) => (t >= l.start ? i : a), -1);
  const line = idx >= 0 ? L[idx] : null;
  const next = idx >= 0 ? nextStart(idx) : end;
  const span = next - (line ? line.start : 0);
  const k = height / 1080; // 크기 보정

  const bigWords = (l: Line) => l.en.split(/[\s-]+/).filter(Boolean);
  const bigTimes = (l: Line, nx: number) => {
    const w = bigWords(l);
    const inside = data.beats.filter((b) => b >= l.start - 0.05 && b < nx - 0.05);
    const ts = inside.length >= w.length ? w.map((_, i) => inside[Math.floor((i * inside.length) / w.length)]) : w.map((_, i) => l.start + (i * (nx - l.start)) / w.length);
    ts[0] = l.start; // 줄의 첫 단어는 줄 시작과 동시에
    return ts;
  };

  // 반전 이벤트 + 큰 단어/작은 문장 순번 계산
  const events: number[] = [];
  const bigOrder: Record<string, number> = {};
  const smallOrder: Record<number, number> = {};
  let bc = 0, sc = 0;
  L.forEach((l, i) => {
    const nx = nextStart(i);
    if (l.big) {
      bigTimes(l, nx).forEach((x, wi) => { events.push(x); bigOrder[`${i}:${wi}`] = bc++; });
    } else {
      smallOrder[i] = sc++;
      events.push(l.start);
      data.beats.filter((b) => b > l.start + 0.2 && b < nx - 0.12).forEach((b) => events.push(b));
    }
  });
  events.sort((a, b) => a - b);
  const phase = flip === 'event' ? Math.max(events.filter((e) => e <= t + 1e-3).length - 1, 0) : 0;
  const bg = colors[phase % 2];
  const fg = colors[(phase + 1) % 2];
  const bgStyle = glow && lum(bg) > 0.35 ? `radial-gradient(ellipse at center, ${mixWhite(bg, 0.45)} 0%, ${bg} 78%)` : bg;

  const lastEv = Math.max(...events.filter((e) => e <= t + 1e-3), 0);
  const since = t - lastEv;
  const glitch = rgbSplit ? interpolate(since, [0, 0.14], [7 * k, 1 * k], {extrapolateRight: 'clamp'}) : 0;
  const jitter = rgbSplit && since < 0.07 ? ((frame % 3) - 1) * 4 * k : 0;
  const shadow = rgbSplit ? `${-glitch}px 0 rgba(255,40,60,0.75), ${glitch}px 0 rgba(40,220,255,0.75)` : 'none';
  const stroke = (px: number) => ({WebkitTextStroke: `${px * k}px ${fg}`} as const);

  let body: JSX.Element | null = null;
  let giant: JSX.Element | null = null;
  if (line && line.big) {
    const ws = bigWords(line);
    const times = bigTimes(line, next);
    const wi = times.reduce((a, x, i) => (t >= x - 1e-3 ? i : a), 0);
    const word = ws[wi].replace(/[,.!?;:]+$/, '').toUpperCase();
    const since2 = t - times[wi];
    const pop = interpolate(since2, [0, 0.1], [1.12, 1], {easing: Easing.out(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const fade = wi === 0 ? interpolate(since2, [0, 0.07], [0.3, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
    const size = Math.min(height * 0.3, (width * 0.5) / (Math.max(word.length, 2) * 0.46));
    const [px, py] = BIG_POS[bigOrder[`${idx}:${wi}`] % BIG_POS.length];
    body = (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: `${px * 100}%`, top: `${py * 100}%`, transform: `translate(-50%,-50%) translateX(${jitter}px) scale(${pop})`, fontFamily: BIG, color: fg, opacity: fade, fontSize: size, lineHeight: 1, textShadow: shadow, whiteSpace: 'nowrap', ...stroke(5)}}>{word}</div>
        {line.ko && <div style={{position: 'absolute', left: 0, right: 0, bottom: height * 0.1, textAlign: 'center', fontFamily: FONT, color: fg, fontSize: fontSize * 0.62 * k, textShadow: shadow, ...stroke(0.6)}}>{line.ko}</div>}
      </AbsoluteFill>
    );
  } else if (line) {
    const sIdx = smallOrder[idx];
    const y = position === 'cycle' ? SMALL_Y[sIdx % SMALL_Y.length] : 0.5;
    const appear = Math.min(span * 0.72, 0.95);
    const prog = interpolate(t, [line.start, line.start + appear], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    let text = line.en;
    if (reveal === 'type') text = line.en.slice(0, Math.max(1, Math.ceil(prog * line.en.length)));
    if (reveal === 'word') { const ws = line.en.split(' '); text = ws.slice(0, Math.max(1, Math.ceil(prog * ws.length))).join(' '); }
    body = (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, right: 0, top: `${y * 100}%`, transform: `translateY(-50%) translateX(${jitter}px)`, textAlign: 'center', padding: `0 ${width * 0.08}px`}}>
          <div style={{fontFamily: FONT, color: fg, fontSize: fontSize * k, lineHeight: 1.3, textShadow: shadow, ...stroke(1)}}>{text}</div>
          {line.ko && <div style={{fontFamily: FONT, color: fg, fontSize: fontSize * 0.86 * k, marginTop: 4 * k, textShadow: shadow, ...stroke(0.8)}}>{line.ko}</div>}
          {line.sub && <div style={{fontFamily: FONT, color: fg, opacity: 0.65, fontSize: fontSize * 0.62 * k, marginTop: 10 * k}}>{line.sub}</div>}
        </div>
      </AbsoluteFill>
    );
    // 큰 단어 다음 작은 문장으로 넘어갈 때: 거대한 첫 글자가 확 줄어들며 전환
    const prev = idx > 0 ? L[idx - 1] : null;
    const sinceLine = t - line.start;
    if (bigTransition && prev && prev.big && sinceLine < 0.16) {
      const ch = line.en.replace(/^[(\s]+/, '').charAt(0).toUpperCase() || line.en.charAt(0);
      giant = (
        <AbsoluteFill style={{overflow: 'hidden', justifyContent: 'center', alignItems: 'flex-start'}}>
          <div style={{fontFamily: BIG, color: fg, fontSize: height * interpolate(sinceLine, [0, 0.16], [1.7, 0.9]), lineHeight: 1, marginLeft: width * 0.06, opacity: interpolate(sinceLine, [0.04, 0.16], [1, 0], {extrapolateLeft: 'clamp'})}}>{ch}</div>
        </AbsoluteFill>
      );
    }
  }

  const starFilled = phase % 2 === 0;
  return (
    <AbsoluteFill style={{background: bgStyle}}>
      <style>{`@font-face{font-family:'InterL';src:url('${staticFile('inter.woff2')}') format('woff2');}@font-face{font-family:'NSK';src:url('${staticFile('nsk.woff2')}') format('woff2');}@font-face{font-family:'Anton';src:url('${staticFile('anton.woff2')}') format('woff2');}`}</style>
      {sparkle && line && (
        <div style={{position: 'absolute', left: '50%', bottom: height * 0.035, transform: 'translateX(-50%)', display: 'flex', gap: 22 * k, alignItems: 'center'}}>
          <Star size={26 * k} color={fg} filled={starFilled} />
          <Star size={15 * k} color={fg} filled={!starFilled} />
        </div>
      )}
      {body}
      {giant}
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
