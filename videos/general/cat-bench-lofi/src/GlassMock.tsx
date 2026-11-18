import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '@fontsource/noto-sans-sc/800.css';
import {H, SAFE, W} from './constants';
import {FONT_CSS} from './Video';
import {SONG_LINES} from './data/luolei_lines';

/** 리퀴드 글라스 글자 시안 (스틸 전용). ko: 'glass' = 한국어도 유리, 'solid' = 한국어는 불투명 크림색 */
export type GlassProps = {line: number; time: string; ko: 'glass' | 'solid'};
export const GLASS_DEFAULTS: GlassProps = {line: 4, time: '8.3', ko: 'glass'};

const TOP = 330, WIDTH = W - 2 * SAFE.x;

export const GlassMock: React.FC<GlassProps> = ({line, time, ko}) => {
  const L = SONG_LINES[line];
  const zhLines = L.zh.split('\n');
  const m = Math.max(...zhLines.map((x) => Array.from(x).length));
  const zs = Math.min(300, Math.floor(WIDTH / (m + 0.35)));
  const ks = Math.min(Math.round(zs * 0.46), Math.floor(WIDTH / (Array.from(L.ko).length * 0.86)));
  const zhY = (i: number) => TOP + zs * (0.92 + 1.14 * i);
  const koY = zhY(zhLines.length - 1) + 40 + ks * 1.05;
  const img = staticFile(`gm_${time}.png`), blur = staticFile(`gm_${time}_blur.png`);
  const zhText = (extra: React.SVGProps<SVGTextElement>, key?: string) => (
    <text key={key} x={SAFE.x} fontFamily="'Noto Sans SC', sans-serif" fontWeight={800} fontSize={zs} letterSpacing={6} {...extra}>
      {zhLines.map((s, i) => <tspan key={i} x={SAFE.x} y={zhY(i)}>{s}</tspan>)}
    </text>
  );
  const koText = (extra: React.SVGProps<SVGTextElement>) => (
    <text x={SAFE.x} y={koY} fontFamily="NotoKR, sans-serif" fontWeight={700} fontSize={ks} {...extra}>{L.ko}</text>
  );
  const bx = SAFE.x - 20, by = TOP - 10, bw = WIDTH + 40, bh = koY - TOP + 60;
  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT_CSS}</style>
      <Img src={img} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.5) 0%, rgba(8,10,28,0.26) 40%, rgba(8,10,28,0) 58%)'}} />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <clipPath id="zh">{zhText({})}</clipPath>
          <clipPath id="kg">{koText({})}</clipPath>
          <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="0.55" stopColor="#fff0d8" stopOpacity="0.74" />
            <stop offset="1" stopColor="#ffc27a" stopOpacity="0.62" />
          </linearGradient>
          <filter id="rim" x="-5%" y="-5%" width="110%" height="110%">
            <feMorphology in="SourceAlpha" operator="erode" radius="3" result="e" />
            <feComposite in="SourceAlpha" in2="e" operator="out" result="edge" />
            <feFlood floodColor="#ffffff" floodOpacity="1" />
            <feComposite in2="edge" operator="in" />
          </filter>
          <filter id="rimk" x="-5%" y="-5%" width="110%" height="110%">
            <feMorphology in="SourceAlpha" operator="erode" radius="2" result="e" />
            <feComposite in="SourceAlpha" in2="e" operator="out" result="edge" />
            <feFlood floodColor="#ffffff" floodOpacity="1" />
            <feComposite in2="edge" operator="in" />
          </filter>
          <filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur stdDeviation="16" /></filter>
        </defs>
        {/* 그림자 */}
        <g filter="url(#sh)" opacity={0.55} transform="translate(0 14)">{zhText({fill: '#05060f'})}{ko === 'glass' && koText({fill: '#05060f'})}</g>
        {/* 유리 몸체: 흐린 배경 + 흰 안개 + 위는 밝고 아래는 노을빛 */}
        <g clipPath="url(#zh)">
          <image href={blur} x={-30} y={-30} width={W + 60} height={H + 60} />
          <rect x={bx} y={by} width={bw} height={bh} fill="url(#gl)" />
          <image href={img} x={-60} y={-60 + 14} width={W + 120} height={H + 120} opacity={0.18} />
        </g>
        <g filter="url(#rim)" opacity={0.95}>{zhText({fill: '#000'})}</g>
        {ko === 'glass' ? (
          <>
            <g clipPath="url(#kg)">
              <image href={blur} x={-30} y={-30} width={W + 60} height={H + 60} />
              <rect x={bx} y={by} width={bw} height={bh} fill="url(#gl)" />
            </g>
            <g filter="url(#rimk)" opacity={0.95}>{koText({fill: '#000'})}</g>
          </>
        ) : (
          koText({fill: '#ffe6c2', style: {filter: 'drop-shadow(0 3px 14px rgba(0,0,0,0.55))'}})
        )}
      </svg>
    </AbsoluteFill>
  );
};
