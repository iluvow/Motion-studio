import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import '@fontsource/noto-sans-sc/800.css';
import {H, SAFE, W} from './constants';
import {FONT_CSS} from './Video';
import {SONG_LINES} from './data/luolei_lines';

/** iOS 26 리퀴드 글라스 스타일 시안: 가장자리에서 배경이 굴절·일그러지고, 둥근 물방울 엣지와 반사광이 있는 유리 글자 */
export type Glass2Props = {line: number; time: string; refract?: number; ko?: 'solid' | 'glass'};
export const GLASS2_DEFAULTS: Glass2Props = {line: 4, time: '8.3', refract: 90, ko: 'solid'};

const TOP = 330, WIDTH = W - 2 * SAFE.x;
const ZH_FIT = 0.9, KO_RATIO = 0.5, KO_FIT = 0.92;      // 글자 크기 비중 (중국어 ↓, 한국어 ↑)

export const GlassMock2: React.FC<Glass2Props> = ({line, time, refract = 90, ko = 'solid'}) => {
  const L = SONG_LINES[line];
  const zhLines = L.zh.split('\n');
  const m = Math.max(...zhLines.map((x) => Array.from(x).length));
  const zs = Math.min(270, Math.floor((WIDTH * ZH_FIT) / (m + 0.35)));
  const ks = Math.min(Math.round(zs * KO_RATIO), Math.floor((WIDTH * KO_FIT) / (Array.from(L.ko).length * 0.86)));
  const zhY = (i: number) => TOP + zs * (0.92 + 1.14 * i);
  const koY = zhY(zhLines.length - 1) + 44 + ks * 1.05;
  const img = staticFile(`gm_${time}.png`);
  const zhText = (fill: string) => (
    <text fontFamily="'Noto Sans SC', sans-serif" fontWeight={800} fontSize={zs} letterSpacing={6} fill={fill}>
      {zhLines.map((s, i) => <tspan key={i} x={SAFE.x} y={zhY(i)}>{s}</tspan>)}
    </text>
  );
  const y0 = TOP - 40, fh = zhY(zhLines.length - 1) - TOP + zs * 0.6;
  const kx: Record<string, string> = {x: '-1 0 1 -2 0 2 -1 0 1', y: '-1 -2 -1 0 0 0 1 2 1'};
  return (
    <AbsoluteFill style={{background: '#0b0d1a'}}>
      <style>{FONT_CSS}</style>
      <Img src={img} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,10,28,0.5) 0%, rgba(8,10,28,0.26) 40%, rgba(8,10,28,0) 58%)'}} />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <filter id="shadow" x={0} y={y0} width={W} height={fh + 80} filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="24" /></filter>
          <filter id="lg" x={0} y={y0} width={W} height={fh + 80} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            {/* 1. 모서리를 둥글게 (물방울처럼): 살짝 흐렸다가 다시 또렷하게 */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="b1" />
            <feComponentTransfer in="b1" result="shape"><feFuncA type="linear" slope="12" intercept="-5.5" /></feComponentTransfer>
            {/* 2. 높이 지도: 글자 가장자리가 볼록한 유리처럼 */}
            <feGaussianBlur in="shape" stdDeviation="14" result="h" />
            <feColorMatrix in="h" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="hg" />
            <feConvolveMatrix in="hg" order="3" kernelMatrix={kx.x} divisor="0.35" bias="0.5" preserveAlpha="true" edgeMode="duplicate" result="gx" />
            <feConvolveMatrix in="hg" order="3" kernelMatrix={kx.y} divisor="0.35" bias="0.5" preserveAlpha="true" edgeMode="duplicate" result="gy" />
            <feColorMatrix in="gx" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1" result="mx" />
            <feColorMatrix in="gy" type="matrix" values="0 0 0 0 0  1 0 0 0 0  0 0 0 0 0  0 0 0 0 1" result="my" />
            <feComposite in="mx" in2="my" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="map" />
            {/* 3. 확대한 배경을 가장자리 기울기대로 밀어서 굴절 */}
            <feImage href={img} x={-W * 0.03} y={-H * 0.03} width={W * 1.06} height={H * 1.06} preserveAspectRatio="none" result="bg" />
            <feComponentTransfer in="bg" result="bgl"><feFuncR type="linear" slope="1.9" intercept="0.14" /><feFuncG type="linear" slope="1.9" intercept="0.14" /><feFuncB type="linear" slope="1.9" intercept="0.14" /></feComponentTransfer>
            <feDisplacementMap in="bgl" in2="map" scale={refract} xChannelSelector="R" yChannelSelector="G" result="refr" />
            <feComposite in="refr" in2="shape" operator="in" result="glass" />
            {/* 4. 은은한 흰 막 */}
            <feFlood floodColor="#fff6e6" floodOpacity="0.2" />
            <feComposite in2="shape" operator="in" result="tint" />
            {/* 5. 반사광: 왼쪽 위에서 오는 흰 하이라이트 + 오른쪽 아래의 노을빛 반사 */}
            <feSpecularLighting in="h" surfaceScale="6" specularConstant="0.85" specularExponent="34" lightingColor="#ffffff" result="s1"><feDistantLight azimuth="235" elevation="48" /></feSpecularLighting>
            <feComposite in="s1" in2="shape" operator="in" result="spec1" />
            <feSpecularLighting in="h" surfaceScale="6" specularConstant="0.7" specularExponent="30" lightingColor="#ffb86b" result="s2"><feDistantLight azimuth="50" elevation="40" /></feSpecularLighting>
            <feComposite in="s2" in2="shape" operator="in" result="spec2" />
            {/* 6. 가장자리 얇은 테두리 빛 */}
            <feMorphology in="shape" operator="erode" radius="2.5" result="er" />
            <feComposite in="shape" in2="er" operator="out" result="edge" />
            <feColorMatrix in="edge" type="matrix" values="1 1 1 0 0  1 1 1 0 0  1 1 1 0 0  0 0 0 0.55 0" result="rim" />
            <feMerge><feMergeNode in="glass" /><feMergeNode in="tint" /><feMergeNode in="spec2" /><feMergeNode in="spec1" /><feMergeNode in="rim" /></feMerge>
          </filter>
        </defs>
        <g filter="url(#shadow)" opacity={0.32} transform="translate(0 20)">{zhText('#05060f')}</g>
        <g filter="url(#lg)">{zhText('#000')}</g>
        {ko === 'solid' ? (
          <text x={SAFE.x} y={koY} fontFamily="NotoKR, sans-serif" fontWeight={700} fontSize={ks} fill="#ffe6c2" style={{filter: 'drop-shadow(0 3px 14px rgba(0,0,0,0.55))'}}>{L.ko}</text>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
