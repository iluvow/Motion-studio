import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {AUDIO_FILE, C, CRASH_TIMES, FPS, SIZE, T} from './constants';
import {drumActive, easeInOut, pulse} from './anim';
import {Band} from './Band';
import {Pub} from './Pub';

const Beams = ({beat, crash}: {beat: number; crash: number}) => {
  const op = 0.045 + beat * 0.02 + crash * 0.04;
  const beams: [number, number, string][] = [
    [-2.2, 0.0, C.coral],
    [0.2, -1.6, '#ffd9a0'],
    [2.4, 0.2, C.teal],
  ];
  return (
    <>
      {beams.map(([x, z, col], i) => (
        <mesh key={i} position={[x, 3.6, z]}>
          <coneGeometry args={[1.5, 6.5, 12, 1, true]} />
          <meshBasicMaterial color={col} transparent opacity={op} depthWrite={false} side={2} blending={2} />
        </mesh>
      ))}
    </>
  );
};

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const kick = pulse(T.kicks, t, 0.12) * drumActive(t);
  const crash = pulse(CRASH_TIMES, t, 0.5);

  /* 카메라: 아주 느린 접근 + 살짝 좌우 이동 (급하지 않게) */
  const k = easeInOut(t / 30);
  const dolly = 0.2 + 0.9 * k;
  const rotY = 0.05 * Math.sin((2 * Math.PI * t) / 18);
  const panX = 0.3 + 0.1 * Math.sin((2 * Math.PI * t) / 14);

  const fadeIn = interpolate(frame, [0, 14], [1, 0], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [FPS * 30 - 18, FPS * 30 - 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: C.wallDeep}}>
      <Audio src={staticFile(AUDIO_FILE)} />
      <ThreeCanvas width={SIZE} height={SIZE} camera={{position: [0, 2.4, 12.6], fov: 36, near: 0.1, far: 80, rotation: [-0.03, 0, 0]}}>
        <ambientLight intensity={0.75} color="#ffe2c4" />
        <hemisphereLight args={['#ffe6cc', '#3a2230', 0.55]} />
        <directionalLight position={[2, 7, 9]} intensity={1.15 + kick * 0.15} color="#ffe9cf" />
        <pointLight position={[-5, 4, 3.5]} intensity={22 + kick * 6} color={C.coral} distance={14} />
        <pointLight position={[5.5, 4, 3.5]} intensity={20 + kick * 6} color={C.teal} distance={14} />
        <group position={[panX, 0, dolly]} rotation={[0, rotY, 0]}>
          <Pub beat={kick} />
          <Beams beat={kick} crash={crash} />
          <Band t={t} frame={frame} />
        </group>
      </ThreeCanvas>
      {/* 가장자리를 살짝 어둡게 해서 시선을 무대로 */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 52%, rgba(24,10,22,0.42) 100%)', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: '#150a14', opacity: Math.max(fadeIn, fadeOut), pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
