import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// 레퍼런스 규칙을 그대로 옮긴 템플릿
// - 모든 글자는 가로·세로 정중앙 (위치 이동 없음)
// - 큰 단어: 항상 같은 높이(화면 높이 x bigH), 한 번에 한 단어, 단어가 바뀔 때만 색 반전
// - 작은 문장: 노래 음절 단위로 글자가 늘어남, 박자마다 색 반전
// - 큰 단어 -> 작은 문장으로 넘어갈 때: 글자가 ~10배로 확대된 상태에서 4프레임 안에 원래 크기로
export type Line = {en: string; ko: string; sub?: string; start: number; big?: boolean; beatLen?: number; steps?: [number, number][]; pieces?: {t: number; en: string; ko: string}[]};
export type SongData = {name: string; duration: number; beats: number[]; beatStep?: number; lines: Line[]};
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
  dogMoves: {line: number; x: number; y: number}[]; // 가사 줄이 시작할 때 강아지1이 (x,y)=화면 비율 위치로 이동
  accent: string; // 포인트 색(반짝이·줄 시작 섬광). 빈 문자열이면 사용 안 함
  split: boolean; // 틱톡식 청록/빨강 어긋남(글자 가장자리)
  dogs: boolean; // 밈 강아지 (public/dog1.png 회전, dog2.png 하이라이트 줄에서 등장)
  warpAmp: number; // idle 왜곡 세기(px, 1080 기준). 0이면 끔
  warpStretch: number; // 유지되는 동안 늘어남 정도(0~1)
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

export const Invert = ({data, audio, colors, glow, bigH, smallH, sparkle, zoomIn, showKo, pieceMode, accent, split, dogs, dogMoves, warpAmp, warpStretch}: InvertProps) => {
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
    const bt = data.beatStep || 0.468;
    const lastLine = L[L.length - 1];
    const lastEnd = lastLine.start + (lastLine.beatLen || 2) * bt + 0.15;
    const firstT = all.length ? all[0].t : 0;
    const ph = Math.max(n - 1, 0);
    const bgc = colors[ph % 2];
    const fgc = colors[(ph + 1) % 2];
    const bgs = glow && lum(bgc) > 0.35 ? `radial-gradient(ellipse at center, ${mixWhite(bgc, 0.45)} 0%, ${bgc} 78%)` : bgc;
    const word = cur ? cur.en.replace(/[,.]+$/, '').toUpperCase() : '';
    let fs = (height * bigH) / ANTON_CAP;
    const wide = word.length * 0.54 * fs;
    if (wide > width * 0.9) fs *= (width * 0.9) / wide; // 긴 조각은 쪼개지 않고 크기를 줄여 폭에 맞춤
    const kk = height / 1080;
    return (
      <AbsoluteFill style={{background: bgs}}>
        <style>{`@font-face{font-family:'BHS';src:url('${staticFile('bhs.woff2')}') format('woff2');}@font-face{font-family:'NSK';font-weight:400;src:url('${staticFile('nsk.woff2')}') format('woff2');}@font-face{font-family:'Anton';src:url('${staticFile('anton.woff2')}') format('woff2');}`}</style>
        {dogs && (() => {
          const kk2 = height / 1080;
          const outline = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => `drop-shadow(${a * 4 * kk2}px ${b * 4 * kk2}px 0 #fff)`).join(' ');
          const gap = !cur || t >= lastEnd; // 가사 없는 구간(인트로/아웃트로): 가운데에 크게
          const bp = ((t - (data.beats[0] || 0)) / bt) % 1;
          const bpp = bp < 0 ? bp + 1 : bp;
          const bounce = 1 + 0.035 * Math.pow(Math.cos(Math.PI * bpp), 2); // 박자에 맞춘 부드러운 숨쉬기
          const outBack = (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
          const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
          const imgs: JSX.Element[] = [];
          // 강아지1 경로: 가운데(인트로) -> 오른쪽 아래(가사 시작) -> dogMoves 순서대로
          const wps = [{t: firstT, x: 0.86, y: 0.79, s: 0.27, d: 0.7}, ...dogMoves.map((m) => ({t: L[m.line].start, x: m.x, y: m.y, s: 0.27, d: 0.65}))];
          const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
          let pos = {x: 0.5, y: 0.5, s: 0.55};
          let extraSpin = 0;
          if (!gap) {
            for (const w of wps) {
              if (t < w.t) break;
              const q = Math.min(1, (t - w.t) / w.d);
              const e = inOut(q), c = inOut(q); // 튕김 없이 부드럽게 가속·감속
              if (q < 1) { pos = {x: pos.x + (w.x - pos.x) * e, y: pos.y + (w.y - pos.y) * e, s: pos.s + (w.s - pos.s) * c}; extraSpin += 360 * c; break; }
              pos = {x: w.x, y: w.y, s: w.s}; extraSpin += 360; // 이동할 때마다 한 바퀴 반 더 돌며 날아감
            }
          }
          const ang = (t / (bt * 4)) * 360 + extraSpin;
          imgs.push(<Img key="d1" src={staticFile('dog1.png')} style={{position: 'absolute', left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, height: height * pos.s, transform: `translate(-50%,-50%) rotate(${ang}deg) scale(${bounce})`, filter: outline}} />);
          // 하이라이트(big) 줄: 강아지2 등장
          if (!gap) {
            let li = -1;
            for (let i = 0; i < L.length; i++) if (t >= L[i].start) li = i;
            if (li >= 0 && L[li].big) {
              let j = li; while (j > 0 && L[j - 1].big) j--;
              const sc2 = outCubic(Math.min(1, (t - L[j].start) / 0.3));
              const shake = Math.sin((t / bt) * Math.PI) * 5;
              imgs.push(<Img key="d2" src={staticFile('dog2.png')} style={{position: 'absolute', left: '15%', top: '78%', height: height * 0.3, transform: `translate(-50%,-50%) rotate(${shake}deg) scale(${sc2 * bounce})`, filter: outline, opacity: 0.9 + 0.1 * Math.sin(t * 12)}} />);
            }
          }
          return <AbsoluteFill>{imgs}</AbsoluteFill>;
        })()}
        {cur && (() => {
          // 레퍼런스에서 측정한 idle: 조각이 유지되는 동안 위치마다 다르게 천천히 일렁이며 늘어남
          const since = t - cur.t;
          const p = Math.min(since / 0.9, 1);
          const sx = 1 + warpStretch * 0.03 * p, sy = 1 + warpStretch * 0.01 * p;
          const bfx = 0.006 + 0.002 * Math.sin(t * 0.9), bfy = 0.012 + 0.003 * Math.cos(t * 0.7);
          const first = since < 1 / fps + 1e-4 && (L.some((l) => l.pieces && l.pieces[0] && l.pieces[0].t === cur.t));
          const rgb = (h: string, a: number) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
          return (
            <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: first ? 0.35 : 1}}>
              <svg width="0" height="0" style={{position: 'absolute'}}>
                <filter id="warp" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency={`${bfx} ${bfy}`} numOctaves={1} seed={4} result="n" />
                  <feDisplacementMap in="SourceGraphic" in2="n" scale={warpAmp * kk} xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </svg>
              <div style={{filter: warpAmp > 0 ? 'url(#warp)' : undefined, transform: `scale(${sx},${sy})`, transformOrigin: '50% 100%', textAlign: 'center'}}>
                <div style={{fontFamily: "'Anton','BHS',sans-serif", color: fgc, fontSize: fs, lineHeight: 1, letterSpacing: -fs * 0.01, whiteSpace: 'nowrap', WebkitTextStroke: `${6 * kk}px ${fgc}`, textShadow: split ? `${-4 * kk}px 0 rgba(37,244,238,0.9), ${4 * kk}px 0 rgba(254,44,85,0.9)` : `${4 * kk}px ${4 * kk}px 0 ${rgb(fgc, 0.28)}`}}>{word}</div>
                {showKo && <div style={{fontFamily: "'BHS','NSK',sans-serif", color: fgc, fontSize: height * 0.105, lineHeight: 1, marginTop: height * 0.05, textShadow: split ? `${-3 * kk}px 0 rgba(37,244,238,0.9), ${3 * kk}px 0 rgba(254,44,85,0.9)` : `${3 * kk}px ${3 * kk}px 0 ${rgb(fgc, 0.28)}`}}>{cur.ko}</div>}
              </div>
            </AbsoluteFill>
          );
        })()}
        {sparkle && cur && (
          <div style={{position: 'absolute', left: '50%', bottom: height * 0.045, transform: 'translateX(-50%)'}}>
            <Star size={30 * kk} color={accent || fgc} filled={ph % 2 === 0} />
          </div>
        )}
        {accent && cur && (() => {
          const isLineStart = L.some((l) => l.pieces && l.pieces[0] && Math.abs(l.pieces[0].t - cur.t) < 1e-3);
          const f = Math.max(0, 1 - (t - cur.t) / 0.14);
          return isLineStart && f > 0 ? <AbsoluteFill style={{background: accent, opacity: 0.32 * f, mixBlendMode: 'screen'}} /> : null;
        })()}
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
