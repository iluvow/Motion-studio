import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type Line = {en: string; ko: string; sub?: string; start: number};
export type SongData = {name: string; duration: number; beats: number[]; lines: Line[]};
export type InvertProps = {
  name: string; // public/data/<name>.json
  audio: string; // public/ 아래 음원 파일명
  width: number; height: number;
  colors: [string, string]; // 반전되는 두 색 (배경). 글자는 항상 반대색
  flip: 'line' | 'beat' | 'none'; // 반전 시점: 줄 바뀔 때 / 매 박자 / 안 함
  position: 'center' | 'alternate'; // 줄 위치: 가운데 / 위·아래 번갈아
  wordByWord: boolean; // 단어 하나씩 등장
  rgbSplit: boolean; // 글자 RGB 색 번짐
  fontSize: number;
  data?: SongData; // calculateMetadata가 채움
};

const FONT = "'InterL','NSK',sans-serif";

export const Invert = ({data, audio, colors, flip, position, wordByWord, rgbSplit, fontSize}: InvertProps) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  if (!data) return null;
  const t = frame / fps;
  const end = durationInFrames / fps;
  const idx = data.lines.reduce((a, l, i) => (t >= l.start ? i : a), -1);
  const line = idx >= 0 ? data.lines[idx] : null;

  // 반전 상태: 줄/박자가 지날 때마다 0,1 토글
  let phase = 0;
  if (flip === 'line') phase = Math.max(idx, 0);
  if (flip === 'beat') phase = data.beats.filter((b) => b <= t).length;
  const bg = colors[phase % 2];
  const fg = colors[(phase + 1) % 2];

  // 컷 직후 몇 프레임 동안 번짐/떨림을 크게
  const since = line ? t - line.start : 9;
  const glitch = rgbSplit ? interpolate(since, [0, 0.18], [7, 1.2], {extrapolateRight: 'clamp'}) : 0;
  const jitter = rgbSplit && since < 0.1 ? ((frame % 3) - 1) * 4 : 0;

  const next = idx + 1 < data.lines.length ? data.lines[idx + 1].start : end;
  const words = line ? (line.en.includes('-') && line.en.split('-').every((p) => p.length <= 1) ? line.en.split('-') : line.en.split(' ')) : [];
  const appear = line ? Math.min((next - line.start) * 0.75, 1.1) : 1;
  const upper = position === 'alternate' ? idx % 2 === 0 : false;
  const shadow = rgbSplit ? `${-glitch}px 0 rgba(255,40,60,0.85), ${glitch}px 0 rgba(40,220,255,0.85)` : 'none';

  return (
    <AbsoluteFill style={{background: bg}}>
      <style>{`@font-face{font-family:'InterL';src:url('${staticFile('inter.woff2')}') format('woff2');}@font-face{font-family:'NSK';src:url('${staticFile('nsk.woff2')}') format('woff2');}`}</style>
      {line && (
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
      )}
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
