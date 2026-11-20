import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SONG_DURATION, SONG_LINES} from './data/yoru_lines';

/* ---- 값 모음 (여기서 조절) ---- */
const BOX = {left: 890, top: 40, width: 940, height: 700};   // 가사가 나오는 영역 (하늘 쪽 오른쪽)
const LEAD = 0.1;                                  // 노래보다 이만큼 먼저 바뀌기 시작
const SPRING_OMEGA = 18, SPRING_ZETA = 0.74;       // 줄이 올라오는 스프링 세기 / 감쇠
const RISE = 70, EXIT = 80;                        // 새 줄이 아래에서 올라오는 거리 / 이전 줄이 위로 빠지는 거리 (px)
const POP = 0.08, POP_DECAY = 0.11;                // "Bang" 단어 튀는 크기와 되돌아오는 시간
const COLOR = '#FFFBF5';
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const FONT = `@font-face{font-family:'MiSansLatin';font-weight:700;src:url('${staticFile('fonts/misans-latin/MiSansLatin-Bold.woff2')}') format('woff2');}
@font-face{font-family:'SUIT';font-weight:700;src:url('${staticFile('fonts/suit/SUIT-Bold.otf')}') format('opentype');}`;
const sizeFor = (en: string) => (en.length <= 18 ? 156 : en.length <= 24 ? 132 : 112);
const spring = (tau: number) => {
  if (tau <= 0) return 0;
  const z = SPRING_ZETA, w = SPRING_OMEGA, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * tau));
};

export const SingleLyric: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load("700 100px 'MiSansLatin'"), document.fonts.load("700 66px 'SUIT'")]).then(() => { setReady(true); continueRender(handle); }).catch((e) => cancelRender(e));
  }, [handle]);

  const L = SONG_LINES;
  let a = 0;
  for (let i = 0; i < L.length; i++) if (t >= L[i].start - LEAD) a = i;
  const p = a === 0 ? 1 : spring(t - (L[a].start - LEAD));          // 새 줄이 자리 잡은 정도 (0→1, 살짝 넘쳤다 돌아옴)
  const endFade = t > SONG_DURATION - 0.5 ? clamp((SONG_DURATION - t) / 0.5) : 1;

  const Line: React.FC<{i: number; style: React.CSSProperties}> = ({i, style}) => {
    const l = L[i], s = sizeFor(l.en);
    const words = l.pops ? l.en.split(' ').map((w, k) => {
      const dt = l.pops![k] === undefined ? -1 : t - l.pops![k];
      const sc = dt >= 0 ? 1 + POP * Math.exp(-dt / POP_DECAY) : 1;
      return <span key={k} style={{display: 'inline-block', transform: `scale(${sc})`, transformOrigin: '50% 80%', marginRight: '0.28em'}}>{w}</span>;
    }) : l.en;
    return (
      <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', transformOrigin: '0% 50%', ...style}}>
        <div style={{fontFamily: "'MiSansLatin', sans-serif", fontWeight: 700, fontSize: s, lineHeight: 1.1, letterSpacing: -2, color: COLOR, textWrap: 'balance' as any}}>{words}</div>
        <div style={{fontFamily: 'SUIT, sans-serif', fontWeight: 700, fontSize: Math.round(s * 0.5), lineHeight: 1.3, marginTop: 30, color: COLOR, opacity: 0.95}}>{l.ko}</div>
      </div>
    );
  };

  const inOp = clamp(p * 1.7), outOp = 1 - clamp(p * 2.0);
  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT}</style>
      <Audio src={staticFile('yoru.mp3')} />
      <OffthreadVideo src={staticFile('store_wide60.mp4')} muted style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}} />
      {ready && (
        <div style={{position: 'absolute', left: BOX.left, top: BOX.top, width: BOX.width, height: BOX.height, textShadow: '0 6px 36px rgba(6,8,24,0.55)', opacity: endFade}}>
          {a > 0 && outOp > 0.01 && <Line i={a - 1} style={{opacity: outOp, transform: `translateY(${-EXIT * Math.min(p, 1.2)}px) scale(${1 - 0.06 * clamp(p)})`, filter: `blur(${clamp(p) * 5}px)`}} />}
          <Line i={a} style={{opacity: inOp, transform: `translateY(${(1 - p) * RISE}px) scale(${0.96 + 0.04 * Math.min(p, 1)})`, filter: p < 0.7 ? `blur(${(1 - p / 0.7) * 8}px)` : undefined}} />
        </div>
      )}
    </AbsoluteFill>
  );
};
