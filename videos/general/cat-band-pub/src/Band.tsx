import React from 'react';
import {C, COATS, T, HAT_TIMES, CRASH_TIMES} from './constants';
import {Cat, CatPose} from './Cat';
import {beatPhase, nod, pulse, strike, clamp} from './anim';

const mat = (color: string, extra: object = {}) => <meshStandardMaterial color={color} flatShading roughness={0.7} {...extra} />;
const brass = () => mat(C.brass, {metalness: 0.15, roughness: 0.55});

/** 느린 깜빡임: 3.6초 주기, 0.14초 동안 감는다 */
const blinkAt = (t: number, k: number) => {
  const x = (t - (1.2 + k * 0.85) + 360) % 3.6;
  return x < 0.14 ? Math.sin((x / 0.14) * Math.PI) : 0;
};
/** 귀 쫑긋: 몇 초에 한 번 */
const earAt = (t: number, k: number) => {
  const x = (t - (2.5 + k * 1.7) + 360) % 7.3;
  return x < 0.35 ? Math.sin((x / 0.35) * Math.PI) : 0;
};

function base(t: number, k: number, offset = 0): CatPose {
  return {
    nod: nod(t, offset),
    mouth: 0,
    blink: blinkAt(t, k),
    tail: (2 * Math.PI * t) / (T.period * 4) + k,
    ear: earAt(t, k),
    armL: [-0.1, 0.12],
    armR: [-0.1, 0.12],
    bodySway: 0.012 * Math.sin((2 * Math.PI * t) / (T.period * 2) + k),
  };
}

/* ───────────── 악기들 ───────────── */

function Sax({sway}: {sway: number}) {
  return (
    <group rotation={[0, 0, sway]}>
      <mesh position={[0, 1.4, 0.62]} rotation={[0.55, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.3, 5]} />
        {brass()}
      </mesh>
      <mesh position={[0, 0.95, 0.72]}>
        <cylinderGeometry args={[0.07, 0.09, 0.9, 6]} />
        {brass()}
      </mesh>
      <mesh position={[0, 0.5, 0.78]} rotation={[-0.55, 0, 0]}>
        <coneGeometry args={[0.26, 0.4, 6, 1, true]} />
        <meshStandardMaterial color={C.brass} flatShading side={2} metalness={0.15} roughness={0.55} />
      </mesh>
      {[0.8, 1.0, 1.15].map((y, i) => (
        <mesh key={i} position={[0, y, 0.8]}>
          <icosahedronGeometry args={[0.04, 0]} />
          {mat('#fff0c4')}
        </mesh>
      ))}
    </group>
  );
}

function Trombone({slide}: {slide: number}) {
  return (
    <group>
      <mesh position={[0, 1.42, 0.62]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.28, 5]} />
        {brass()}
      </mesh>
      {/* 고정 관 + 벨 */}
      <mesh position={[-0.2, 1.3, 1.1]}>
        <boxGeometry args={[0.06, 0.06, 1.05]} />
        {brass()}
      </mesh>
      <mesh position={[-0.2, 1.3, 1.72]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.3, 0.45, 7, 1, true]} />
        <meshStandardMaterial color={C.brass} flatShading side={2} metalness={0.15} roughness={0.55} />
      </mesh>
      {/* 슬라이드 (박자에 맞춰 앞뒤로) */}
      <group position={[0, 0, slide]}>
        <mesh position={[0.18, 1.3, 1.1]}>
          <boxGeometry args={[0.05, 0.05, 1.0]} />
          {mat('#f2cf8a', {metalness: 0.1})}
        </mesh>
        <mesh position={[0, 1.3, 1.62]}>
          <boxGeometry args={[0.44, 0.05, 0.05]} />
          {mat('#f2cf8a', {metalness: 0.1})}
        </mesh>
      </group>
      <mesh position={[0.1, 1.34, 0.64]}>
        <boxGeometry args={[0.44, 0.05, 0.05]} />
        {brass()}
      </mesh>
    </group>
  );
}

function DoubleBass() {
  return (
    <group position={[0.3, 0, 0.52]}>
      <mesh position={[0, 0.62, 0]} scale={[0.6, 0.72, 0.26]}>
        <icosahedronGeometry args={[1, 1]} />
        {mat('#a8552f')}
      </mesh>
      <mesh position={[0, 1.22, 0]} scale={[0.42, 0.46, 0.24]}>
        <icosahedronGeometry args={[1, 1]} />
        {mat('#b8643a')}
      </mesh>
      <mesh position={[0, 1.95, -0.02]}>
        <boxGeometry args={[0.1, 1.5, 0.06]} />
        {mat(C.woodDark)}
      </mesh>
      <mesh position={[0, 2.78, -0.02]}>
        <icosahedronGeometry args={[0.11, 0]} />
        {mat(C.woodDark)}
      </mesh>
      {[-0.025, 0.025].map((x, i) => (
        <mesh key={i} position={[x, 1.6, 0.04]}>
          <boxGeometry args={[0.008, 2.0, 0.008]} />
          {mat(C.cream)}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.2, 0.95, 0.24]} rotation={[0, 0, s * 0.25]}>
          <boxGeometry args={[0.04, 0.2, 0.01]} />
          {mat(C.ink)}
        </mesh>
      ))}
    </group>
  );
}

function Mic() {
  return (
    <group>
      <mesh position={[0, -0.02, 0.0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.22, 5]} />
        {mat('#3a3a44')}
      </mesh>
      <mesh position={[0, 0.12, 0.0]}>
        <icosahedronGeometry args={[0.075, 1]} />
        {mat('#c8ccd6', {metalness: 0.3})}
      </mesh>
    </group>
  );
}

function Stick() {
  return (
    <mesh position={[0, -0.14, 0.02]}>
      <cylinderGeometry args={[0.018, 0.026, 0.42, 4]} />
      {mat(C.cream)}
    </mesh>
  );
}

function Drums({kick, crash}: {kick: number; crash: number}) {
  return (
    <group>
      {/* 스툴 */}
      <mesh position={[0, 0.12, -0.05]}>
        <cylinderGeometry args={[0.32, 0.36, 0.2, 7]} />
        {mat(C.coral)}
      </mesh>
      {/* 베이스 드럼 */}
      <group position={[0, 0.4, 0.95]} scale={(1 + kick * 0.05) * 0.82}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 0.55, 10]} />
          {mat(C.teal)}
        </mesh>
        <mesh position={[0, 0, 0.29]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.46, 0.46, 0.03, 10]} />
          {mat(C.cream)}
        </mesh>
        <mesh position={[0, 0, 0.31]}>
          <icosahedronGeometry args={[0.11, 0]} />
          {mat(C.coral)}
        </mesh>
      </group>
      {/* 스네어 */}
      <group position={[-0.38, 0.98, 0.9]} rotation={[0.15, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.16, 9]} />
          {mat(C.brass, {metalness: 0.2})}
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.27, 0.27, 0.02, 9]} />
          {mat(C.cream)}
        </mesh>
      </group>
      <mesh position={[-0.38, 0.5, 0.9]}>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 4]} />
        {mat('#3a3a44')}
      </mesh>
      {/* 하이햇 */}
      <group position={[0.66, 1.05, 0.85]}>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.7, 4]} />
          {mat('#3a3a44')}
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 9]} />
          {brass()}
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 9]} />
          {brass()}
        </mesh>
      </group>
      {/* 크래시 심벌 */}
      <group position={[1.05, 1.45, 0.25]} rotation={[0.2 + crash * 0.12 * Math.sin(crash * 20), 0, -0.18]}>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.0, 4]} />
          {mat('#3a3a44')}
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.46, 0.46, 0.02, 10]} />
          {brass()}
        </mesh>
      </group>
      {/* 플로어 탐 */}
      <mesh position={[-1.0, 0.55, 0.35]}>
        <cylinderGeometry args={[0.34, 0.34, 0.45, 9]} />
        {mat(C.coral)}
      </mesh>
      <mesh position={[-1.0, 0.79, 0.35]}>
        <cylinderGeometry args={[0.31, 0.31, 0.02, 9]} />
        {mat(C.cream)}
      </mesh>
    </group>
  );
}

/* ───────────── 멤버 배치 ───────────── */

const STAGE_Y = 0.3;

/** 삼색이: 머리 얼룩 */
const CalicoHead = (
  <>
    <mesh position={[-0.22, 0.3, 0.34]} scale={[1.1, 0.8, 0.45]}>
      <icosahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial color="#e2893f" flatShading roughness={0.9} />
    </mesh>
    <mesh position={[0.3, 0.12, 0.33]} scale={[0.9, 1, 0.45]}>
      <icosahedronGeometry args={[0.17, 0]} />
      <meshStandardMaterial color="#4d3f43" flatShading roughness={0.9} />
    </mesh>
  </>
);
/** 샴: 얼굴 가운데 어두운 마스크 */
const SiameseMask = (
  <mesh position={[0, -0.06, 0.33]} scale={[1.0, 0.85, 0.62]}>
    <icosahedronGeometry args={[0.3, 1]} />
    <meshStandardMaterial color="#6a4d40" flatShading roughness={0.9} />
  </mesh>
);

export function Band({t, frame}: {t: number; frame: number}) {
  const ph = beatPhase(t);
  const swayBeat = Math.sin(2 * Math.PI * ph * 0.5); // 2박에 한 번 좌우
  const slide = 0.16 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / (T.period * 4) - 1.2));

  /* 보컬 */
  const vocal = base(t, 0, 0.012);
  const env = T.vocalEnv[Math.min(T.vocalEnv.length - 1, Math.max(0, frame))] ?? 0;
  vocal.mouth = clamp(Math.pow(env, 0.8) * 1.0);
  vocal.armR = [-2.15, -0.12];
  vocal.armL = [-0.25 + 0.06 * Math.sin(t * 2.1), 0.3];
  vocal.headTilt = 0.05 * Math.sin((2 * Math.PI * t) / (T.period * 8));
  vocal.bodySway = 0.03 * swayBeat;

  /* 색소폰 */
  const sax = base(t, 1, 0.02);
  sax.armL = [-1.3, -0.62];
  sax.armR = [-1.3, -0.62];
  sax.bodySway = 0.035 * swayBeat;

  /* 트롬본 */
  const tb = base(t, 2, 0.015);
  tb.armL = [-1.35, -0.2];
  tb.armR = [-1.4 + (slide - 0.08) * 0.8, -0.5];
  tb.bodySway = -0.03 * swayBeat;

  /* 베이스 */
  const bs = base(t, 3, 0.008);
  const pluck = pulse(T.kicks, t, 0.12);
  bs.armL = [-1.95, -1.22];
  bs.armR = [-1.3 - 0.1 * pluck, -1.15];
  bs.bodySway = 0.03 * swayBeat;

  /* 드럼 */
  const dr = base(t, 4, 0.0);
  const rs = strike(T.snares, t);
  const rh = strike(HAT_TIMES, t);
  dr.armL = [-1.25 - 1.1 * rs, -0.12];
  dr.armR = [-1.25 - 1.1 * rh, -0.12];
  dr.bodySway = 0.012 * swayBeat;

  const kick = pulse(T.kicks, t, 0.1);
  const crash = pulse(CRASH_TIMES, t, 0.6);

  return (
    <group position={[0, STAGE_Y, 0]}>
      {/* 드럼 (뒤, 단 위) */}
      <group position={[0.95, 0.3, -2.0]} rotation={[0, -0.05, 0]}>
        <Cat {...COATS.siamese} earColor="#5e4337" headExtras={SiameseMask} pose={dr} handL={<Stick />} handR={<Stick />} bowtie={C.coral} />
        <Drums kick={kick} crash={crash} />
      </group>

      {/* 베이스 */}
      <group position={[-3.3, 0, 0.1]} rotation={[0, 0.3, 0]}>
        <Cat {...COATS.calico} patches headExtras={CalicoHead} pose={bs} />
        <DoubleBass />
      </group>

      {/* 색소폰 */}
      <group position={[-1.95, 0, 0.55]} rotation={[0, 0.18, 0]}>
        <Cat {...COATS.tux} pose={sax} bowtie={C.coral} />
        <Sax sway={-0.03 * swayBeat} />
      </group>

      {/* 보컬 (앞 중앙) */}
      <group position={[-0.65, 0, 1.35]}>
        <Cat {...COATS.orange} pose={vocal} handR={<Mic />} />
      </group>

      {/* 트롬본 */}
      <group position={[2.4, 0, 0.55]} rotation={[0, -0.2, 0]}>
        <Cat {...COATS.gray} pose={tb} bowtie={C.teal} />
        <group rotation={[0, 0.5, 0]}>
          <Trombone slide={slide} />
        </group>
      </group>
    </group>
  );
}
