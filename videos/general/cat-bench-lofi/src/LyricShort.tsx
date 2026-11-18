import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/noto-serif-sc/700.css';
import {H, SAFE, W} from './constants';
import {FONT_CSS} from './Video';
import {HOOK, SONG_DURATION, SONG_LINES, TITLE, SongLine} from './data/luolei_lines';

/* ---- 값 모음 (여기서 조절) ---- */
const IN = 0.34;             // 줄이 나타나는 시간
const OUT = 0.14;            // 사라지는 시간
const LEAD = 0.08;           // 노래보다 이만큼 먼저 나타남
const TEXT_TOP = 330;
const COL = {zh: '#fff4e2', ko: '#ffe3bd', key: '#ffb45e', keyKo: '#ff9f6b', pill: 'rgba(255,196,120,0.16)'};

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const easeOutBack = (x: number) => { const c = 1.9; x = clamp(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

/** 강조 단어를 색칠해서 쪼갠다 */
const Highlight: React.FC<{text: string; keyText?: string; color: string; sweep: number}> = ({text, keyText, color, sweep}) => {
  const i = keyText ? text.indexOf(keyText) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span style={{color, position: 'relative', display: 'inline-block'}}>
        {keyText}
        <span style={{position: 'absolute', left: 0, bottom: -6, height: 6, width: `${sweep * 100}%`, borderRadius: 3, background: color, opacity: 0.85}} />
      </span>
      {text.slice(i + keyText!.length)}
    </>
  );
};

export const LyricShort: React.FC<{showIndex?: boolean}> = ({showIndex = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  let a = -1;
  for (let i = 0; i < SONG_LINES.length; i++) if (t >= SONG_LINES[i].start - LEAD) a = i;
  const L: SongLine | null = a >= 0 ? SONG_LINES[a] : null;
  const next = a + 1 < SONG_LINES.length ? SONG_LINES[a + 1] : null;
  const age = L ? t - (L.start - LEAD) : 0;
  const untilNext = next ? next.start - LEAD - t : 99;
  const out = clamp(untilNext / OUT);
  const k = easeOut(age / IN);
  const pop = easeOutBack(age / IN);
  const alpha = clamp(age / (IN * 0.55)) * out * (t > SONG_DURATION - 0.9 ? clamp((SONG_DURATION - t) / 0.9) : 1);
  const isRep = !!L?.rep;
  const size = L ? Math.min(250, Math.floor(1000 / (Math.max(...L.zh.split('\n').map((x) => Array.from(x).length)) + 0.3))) * (isRep ? 1 + 0.07 * (L.rep![0] - 1) : 1) : 150;
  const sweep = easeOut((age - 0.25) / 0.5);

  // 장면 전체의 숨쉬기: 가로등 불빛이 천천히 맥박친다
  const breathe = 0.5 + 0.5 * Math.sin((t / 2.2) * Math.PI * 2);
  const flash = isRep ? Math.exp(-age / 0.22) * 0.28 : Math.exp(-age / 0.18) * 0.12;   // 줄이 바뀔 때 빛이 번쩍

  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT_CSS}</style>
      <Audio src={staticFile('luolei.mp3')} />
      <OffthreadVideo src={staticFile('bg60.mp4')} muted style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
      {/* 글자가 잘 읽히도록 위쪽을 살짝 어둡게 */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.55) 0%, rgba(8,10,28,0.3) 40%, rgba(8,10,28,0) 58%)'}} />
      {/* 가로등 불빛 맥박 + 줄이 바뀔 때 번쩍임 */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 38% 26% at 90% 40%, rgba(255,176,90,${0.10 + 0.06 * breathe + flash}) 0%, rgba(255,176,90,0) 100%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(5,6,16,0.35) 100%)'}} />

      {/* 위쪽 훅 (영상 내내 고정) */}
      <div style={{position: 'absolute', left: SAFE.x, top: 190, display: 'flex', alignItems: 'center', gap: 16, opacity: easeOut(t / 0.5)}}>
        <div style={{width: 14, height: 14, borderRadius: 7, background: COL.key, boxShadow: `0 0 ${14 + 10 * breathe}px ${COL.key}`}} />
        <div style={{fontFamily: 'NotoKR, sans-serif', fontWeight: 700, fontSize: 40, color: '#ffe9cc', background: COL.pill, padding: '10px 26px', borderRadius: 40, border: '1.5px solid rgba(255,196,120,0.35)'}}>{HOOK}</div>
      </div>

      {L && (
        <div style={{position: 'absolute', left: SAFE.x, top: TEXT_TOP, width: 1000, opacity: alpha, transform: `translateY(${(1 - k) * 34}px) scale(${0.94 + 0.06 * pop})`, transformOrigin: '0% 30%', filter: age < IN * 0.7 ? `blur(${(1 - clamp(age / (IN * 0.7))) * 10}px)` : undefined}}>
          <div style={{fontFamily: "'Noto Serif SC', serif", fontWeight: 700, fontSize: size, lineHeight: 1.16, letterSpacing: 4, color: COL.zh, whiteSpace: 'pre-line', textShadow: '0 4px 30px rgba(0,0,0,0.6)'}}>
            <Highlight text={L.zh} keyText={L.zhKey} color={COL.key} sweep={sweep} />
          </div>
          <div style={{marginTop: 54, fontFamily: 'NotoKR, sans-serif', fontWeight: 700, fontSize: Math.round(size * 0.5), lineHeight: 1.3, color: COL.ko, textShadow: '0 3px 20px rgba(0,0,0,0.55)', transform: `translateY(${(1 - easeOut((age - 0.08) / IN)) * 18}px)`, opacity: easeOut((age - 0.05) / (IN * 0.8))}}>
            <Highlight text={L.ko} keyText={L.koKey} color={COL.keyKo} sweep={sweep} />
          </div>
          {L.rep && (
            <div style={{display: 'flex', gap: 14, marginTop: 50, alignItems: 'center'}}>
              {Array.from({length: L.rep[1]}, (_, i) => (
                <div key={i} style={{width: i + 1 === L.rep![0] ? 44 : 14, height: 14, borderRadius: 7, background: i + 1 <= L.rep![0] ? COL.key : 'rgba(255,255,255,0.28)', boxShadow: i + 1 === L.rep![0] ? `0 0 18px ${COL.key}` : undefined}} />
              ))}
              <div style={{marginLeft: 8, fontFamily: 'NotoKR, sans-serif', fontWeight: 700, fontSize: 34, color: 'rgba(255,255,255,0.7)'}}>{L.rep[0]}/{L.rep[1]}</div>
            </div>
          )}
        </div>
      )}
      {showIndex && L && <div style={{position: 'absolute', left: 40, top: 40, fontFamily: 'NotoKR, sans-serif', fontSize: 44, color: 'rgba(255,255,255,0.55)'}}>#{a + 1} · {t.toFixed(2)}s</div>}
    </AbsoluteFill>
  );
};
