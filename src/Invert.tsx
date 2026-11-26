import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// 레퍼런스 규칙을 그대로 옮긴 템플릿
// - 모든 글자는 가로·세로 정중앙 (위치 이동 없음)
// - 큰 단어: 항상 같은 높이(화면 높이 x bigH), 한 번에 한 단어, 단어가 바뀔 때만 색 반전
// - 작은 문장: 노래 음절 단위로 글자가 늘어남, 박자마다 색 반전
// - 큰 단어 -> 작은 문장으로 넘어갈 때: 글자가 ~10배로 확대된 상태에서 4프레임 안에 원래 크기로
export type Line = {en: string; ko: string; sub?: string; start: number; big?: boolean; steps?: [number, number][]; pieces?: {t: number; en: string; ko: string}[]};
export type SongData = {name: string; duration: number; beats: number[]; lines: Line[]};
export type InvertProps = {
  name: string; // public/data/<name>.json
  audio: string; // public/ 아래 음원 파일명
  width: number; height: number;
  colors: [string, string]; // 반전되는 두 색. 글자는 항상 반대색
  glow: boolean; // 밝은 색 배경의 가운데가 밝은 그라데이션
  bigH: number; // 큰 단어 대문자 높이 (화면 높이 비율)
  smallH: number; // 작은 문장 글자 크기 (화면 높이 비율)
  sparkle: boolean; // 하단 반짝이
  zoomIn: boolean; // 큰 단어 -> 작은 문장 전환 줌
  showKo: boolean; // 한글 해석 표시
  pieceMode: boolean; // 한 단어(조각)씩 크게 보여주기 (lines[].pieces 필요)
  data?: SongData;
};

const FONT = "'InterL','NSK',sans-serif";
const BIG = "'Anton','InterL','NSK',sans-serif";
const ANTON_CAP = 0.859; // Anton 대문자 높이 / em
const ZOOM_STEPS = [11, 8, 5.2, 2.8]; // 전환 프레임별 배율

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

const wordsOf = (en: string) => {
  const out: {w: string; i: number}[] = [];
  const re = /[^\s-]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(en))) out.push({w: m[0], i: m.index});
  return out;
};

export const Invert = ({data, audio, colors, glow, bigH, smallH, sparkle, zoomIn, showKo, pieceMode}: InvertProps) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  if (!data) return null;
  const t = frame / fps + 1e-4;
  const end = durationInFrames / fps;
  const L = data.lines;
  if (pieceMode) {
    // 한 번에 한 조각: 조각이 바뀔 때마다 색 반전. 글자는 정중앙, 높이 고정.
    const all = L.flatMap((l) => l.pieces || []).sort((a, b) => a.t - b.t);
    const n = all.filter((p) => p.t <= t).length;
    const cur = n > 0 ? all[n - 1] : null;
    const ph = Math.max(n - 1, 0);
    const bgc = colors[ph % 2];
    const fgc = colors[(ph + 1) % 2];
    const bgs = glow && lum(bgc) > 0.35 ? `radial-gradient(ellipse at center, ${mixWhite(bgc, 0.45)} 0%, ${bgc} 78%)` : bgc;
    const word = cur ? cur.en.replace(/[,.]+$/, '').toUpperCase() : '';
    const fs = (height * bigH) / ANTON_CAP;
    const kk = height / 1080;
    return (
      <AbsoluteFill style={{background: bgs}}>
        <style>{`@font-face{font-family:'BHS';src:url('${staticFile('bhs.woff2')}') format('woff2');}@font-face{font-family:'NSK';font-weight:400;src:url('${staticFile('nsk.woff2')}') format('woff2');}@font-face{font-family:'Anton';src:url('${staticFile('anton.woff2')}') format('woff2');}`}</style>
        {cur && (
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <div style={{fontFamily: "'Anton','BHS',sans-serif", color: fgc, fontSize: fs, lineHeight: 1, letterSpacing: -fs * 0.01, whiteSpace: 'nowrap', WebkitTextStroke: `${6 * kk}px ${fgc}`}}>{word}</div>
            {showKo && <div style={{fontFamily: "'BHS','NSK',sans-serif", color: fgc, fontSize: height * 0.105, lineHeight: 1, marginTop: height * 0.05}}>{cur.ko}</div>}
          </AbsoluteFill>
        )}
        {sparkle && cur && (
          <div style={{position: 'absolute', left: '50%', bottom: height * 0.045, transform: 'translateX(-50%)'}}>
            <Star size={30 * kk} color={fgc} filled={ph % 2 === 0} />
          </div>
        )}
        <Audio src={staticFile(audio)} />
      </AbsoluteFill>
    );
  }
  const nextStart = (i: number) => (i + 1 < L.length ? L[i + 1].start : end);

  // 큰 단어: 각 단어가 처음 나오는 시각 (첫 글자가 노래에서 불리는 시점)
  const wordTimes = (l: Line, nx: number) => {
    const ws = wordsOf(l.en);
    return ws.map((x, k) => {
      if (l.steps) {
        const s = l.steps.find((st) => st[1] > x.i);
        if (s) return s[0];
      }
      return l.start + (k * (nx - l.start)) / ws.length;
    });
  };

  // 색 반전 이벤트: 큰 단어가 바뀔 때 / 작은 문장이 시작할 때와 그 안의 매 박자
  const events: number[] = [];
  L.forEach((l, i) => {
    const nx = nextStart(i);
    if (l.big) wordTimes(l, nx).forEach((x) => events.push(x));
    else {
      events.push(l.start);
      data.beats.filter((b) => b > l.start + 0.12 && b < nx - 0.12).forEach((b) => events.push(b));
    }
  });
  events.sort((a, b) => a - b);
  const phase = Math.max(events.filter((e) => e <= t).length - 1, 0);
  const bg = colors[phase % 2];
  const fg = colors[(phase + 1) % 2];
  const bgStyle = glow && lum(bg) > 0.35 ? `radial-gradient(ellipse at center, ${mixWhite(bg, 0.45)} 0%, ${bg} 78%)` : bg;

  const idx = L.reduce((a, l, i) => (t >= l.start ? i : a), -1);
  const line = idx >= 0 ? L[idx] : null;
  const next = idx >= 0 ? nextStart(idx) : end;

  let body: JSX.Element | null = null;
  if (line && line.big) {
    const ws = wordsOf(line.en);
    const times = wordTimes(line, next);
    const wi = times.reduce((a, x, i) => (t >= x ? i : a), 0);
    const word = ws[wi].w.replace(/[,.!?;:]+$/, '').toUpperCase();
    let fs = (height * bigH) / ANTON_CAP;
    const approxW = word.length * 0.54 * fs;
    if (approxW > width * 0.92) fs *= (width * 0.92) / approxW;
    body = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{fontFamily: BIG, color: fg, fontSize: fs, lineHeight: 1, whiteSpace: 'nowrap', WebkitTextStroke: `${height * 0.004}px ${fg}`}}>{word}</div>
        {showKo && line.ko && <div style={{position: 'absolute', left: 0, right: 0, bottom: height * 0.12, textAlign: 'center', fontFamily: FONT, color: fg, fontSize: height * smallH * 0.62}}>{line.ko}</div>}
      </AbsoluteFill>
    );
  } else if (line) {
    let n = line.en.length;
    if (line.steps) {
      const st = line.steps.filter((s) => s[0] <= t);
      n = st.length ? st[st.length - 1][1] : line.steps[0][1];
    }
    const text = line.en.slice(0, n);
    const prev = idx > 0 ? L[idx - 1] : null;
    const f = Math.round((t - line.start) * fps);
    const zoom = zoomIn && prev && prev.big && f >= 0 && f < ZOOM_STEPS.length ? ZOOM_STEPS[f] : 1;
    body = (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', overflow: 'hidden'}}>
        <div style={{transform: `scale(${zoom})`, textAlign: 'center', padding: `0 ${width * 0.06}px`}}>
          <div style={{fontFamily: FONT, fontWeight: 600, color: fg, fontSize: height * smallH, lineHeight: 1.3, whiteSpace: 'pre'}}>{text}</div>
          {showKo && line.ko && <div style={{fontFamily: FONT, fontWeight: 700, color: fg, fontSize: height * smallH * 0.82, marginTop: height * 0.006}}>{line.ko}</div>}
          {showKo && line.sub && <div style={{fontFamily: FONT, color: fg, opacity: 0.65, fontSize: height * smallH * 0.6, marginTop: height * 0.012}}>{line.sub}</div>}
        </div>
      </AbsoluteFill>
    );
  }

  const k = height / 1080;
  return (
    <AbsoluteFill style={{background: bgStyle}}>
      <style>{`@font-face{font-family:'InterL';font-weight:600;src:url('${staticFile('inter600.woff2')}') format('woff2');}@font-face{font-family:'NSK';font-weight:700;src:url('${staticFile('nsk700.woff2')}') format('woff2');}@font-face{font-family:'NSK';font-weight:400;src:url('${staticFile('nsk.woff2')}') format('woff2');}@font-face{font-family:'Anton';src:url('${staticFile('anton.woff2')}') format('woff2');}`}</style>
      {sparkle && line && (
        <div style={{position: 'absolute', left: '50%', bottom: height * 0.045, transform: 'translateX(-50%)'}}>
          <Star size={30 * k} color={fg} filled={phase % 2 === 0} />
        </div>
      )}
      {body}
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
