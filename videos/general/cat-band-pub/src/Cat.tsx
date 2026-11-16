import React from 'react';
import {C} from './constants';

const mat = (color: string, extra: object = {}) => (
  <meshStandardMaterial color={color} flatShading roughness={0.9} metalness={0} {...extra} />
);

export type CatPose = {
  nod: number; // 0..1 (박자에서 1)
  mouth: number; // 0..1
  blink: number; // 0..1
  tail: number; // 꼬리 위상(라디안)
  ear: number; // 귀 쫑긋 0..1
  armL: [number, number]; // [앞뒤 회전(x), 좌우 회전(z)]
  armR: [number, number];
  bodySway?: number;
  headTilt?: number;
};

export type CatProps = {
  coat: string;
  belly: string;
  accent: string;
  earColor?: string;
  pose: CatPose;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
  patches?: boolean; // 삼색이 얼룩
  bowtie?: string;
  handL?: React.ReactNode;
  handR?: React.ReactNode;
  headExtras?: React.ReactNode;
};

const ARM_LEN = 0.5;

function Arm({side, rot, color, hand}: {side: 1 | -1; rot: [number, number]; color: string; hand?: React.ReactNode}) {
  return (
    <group position={[side * 0.4, 1.0, 0.1]} rotation={[rot[0], 0, rot[1] * side]}>
      <mesh position={[0, -ARM_LEN / 2, 0]}>
        <capsuleGeometry args={[0.1, ARM_LEN - 0.12, 2, 5]} />
        {mat(color)}
      </mesh>
      <mesh position={[0, -ARM_LEN - 0.02, 0.02]} scale={[1, 0.9, 1.05]}>
        <icosahedronGeometry args={[0.125, 0]} />
        {mat(color)}
      </mesh>
      <group position={[0, -ARM_LEN - 0.02, 0.02]}>{hand}</group>
    </group>
  );
}

function Tail({color, tip, phase}: {color: string; tip: string; phase: number}) {
  const segs = [0, 1, 2, 3, 4];
  const build = (i: number): React.ReactNode => {
    if (i >= segs.length) return null;
    const sway = Math.sin(phase - i * 0.55) * (0.1 + i * 0.05);
    return (
      <group rotation={[i === 0 ? -1.0 : 0.3, 0, sway]}>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.075 - i * 0.008, 0.085 - i * 0.008, 0.3, 5]} />
          {mat(i >= 3 ? tip : color)}
        </mesh>
        <group position={[0, 0.28, 0]}>{build(i + 1)}</group>
      </group>
    );
  };
  return <group position={[0, 0.3, -0.38]}>{build(0)}</group>;
}

export function Cat(p: CatProps) {
  const {pose} = p;
  const sc = p.scale ?? 1;
  const headY = 1.62 - pose.nod * 0.045;
  const earRot = 0.28 + pose.ear * 0.22;
  return (
    <group position={p.position} rotation={[0, p.rotationY ?? 0, 0]} scale={sc}>
      {/* 바닥 그림자 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0.05]}>
        <circleGeometry args={[0.85, 12]} />
        <meshBasicMaterial color="#120a10" transparent opacity={0.38} depthWrite={false} />
      </mesh>

      <group rotation={[0, 0, pose.bodySway ?? 0]} position={[0, -pose.nod * 0.012, 0]}>
        {/* 몸통 */}
        <mesh position={[0, 0.72, 0]} scale={[1.05, 1, 0.92]}>
          <capsuleGeometry args={[0.4, 0.32, 2, 6]} />
          {mat(p.coat)}
        </mesh>
        {/* 배 */}
        <mesh position={[0, 0.7, 0.28]} scale={[0.75, 0.9, 0.35]}>
          <icosahedronGeometry args={[0.38, 1]} />
          {mat(p.belly)}
        </mesh>
        {p.patches && (
          <>
            <mesh position={[-0.24, 0.95, 0.22]} scale={[1, 0.9, 0.5]}>
              <icosahedronGeometry args={[0.2, 0]} />
              {mat('#d9814a')}
            </mesh>
            <mesh position={[0.28, 0.5, 0.2]} scale={[1, 1, 0.5]}>
              <icosahedronGeometry args={[0.18, 0]} />
              {mat('#4a3d40')}
            </mesh>
          </>
        )}
        {/* 발 */}
        <mesh position={[-0.2, 0.1, 0.32]} scale={[1.1, 0.7, 1.4]}>
          <icosahedronGeometry args={[0.16, 0]} />
          {mat(p.coat)}
        </mesh>
        <mesh position={[0.2, 0.1, 0.32]} scale={[1.1, 0.7, 1.4]}>
          <icosahedronGeometry args={[0.16, 0]} />
          {mat(p.coat)}
        </mesh>
        {p.bowtie && (
          <group position={[0, 1.2, 0.42]}>
            <mesh position={[-0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.09, 0.14, 3]} />
              {mat(p.bowtie)}
            </mesh>
            <mesh position={[0.09, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.09, 0.14, 3]} />
              {mat(p.bowtie)}
            </mesh>
            <mesh>
              <icosahedronGeometry args={[0.04, 0]} />
              {mat(p.bowtie)}
            </mesh>
          </group>
        )}

        <Tail color={p.coat} tip={p.accent} phase={pose.tail} />
        <Arm side={-1} rot={pose.armL} color={p.coat} hand={p.handL} />
        <Arm side={1} rot={pose.armR} color={p.coat} hand={p.handR} />

        {/* 머리 */}
        <group position={[0, headY, 0.05]} rotation={[pose.nod * 0.07, 0, pose.headTilt ?? 0]}>
          <mesh scale={[1.12, 0.94, 1]}>
            <icosahedronGeometry args={[0.52, 1]} />
            {mat(p.coat)}
          </mesh>
          {/* 입가 */}
          <mesh position={[0, -0.14, 0.4]} scale={[1.2, 0.8, 0.8]}>
            <icosahedronGeometry args={[0.2, 1]} />
            {mat(p.belly)}
          </mesh>
          {/* 귀 */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.34, 0.42, -0.02]} rotation={[-0.1, 0, -s * earRot]}>
              <mesh>
                <coneGeometry args={[0.2, 0.38, 3]} />
                {mat(p.earColor ?? p.coat)}
              </mesh>
              <mesh position={[0, -0.02, 0.05]} scale={[0.6, 0.7, 0.6]}>
                <coneGeometry args={[0.2, 0.38, 3]} />
                {mat(C.pink)}
              </mesh>
            </group>
          ))}
          {/* 눈 */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.2, 0.06, 0.46]} scale={[1, Math.max(0.1, 1 - pose.blink * 0.9), 1]}>
              <mesh>
                <icosahedronGeometry args={[0.085, 1]} />
                <meshStandardMaterial color={C.ink} flatShading roughness={0.4} />
              </mesh>
              <mesh position={[0.025, 0.03, 0.06]}>
                <icosahedronGeometry args={[0.026, 0]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
          {/* 볼터치 */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.34, -0.1, 0.4]} rotation={[0, s * -0.5, 0]}>
              <circleGeometry args={[0.07, 6]} />
              <meshBasicMaterial color={C.blush} transparent opacity={0.75} />
            </mesh>
          ))}
          {/* 코 */}
          <mesh position={[0, -0.04, 0.55]} rotation={[Math.PI, 0, 0]} scale={[1, 0.7, 0.8]}>
            <coneGeometry args={[0.05, 0.06, 3]} />
            {mat(C.pink)}
          </mesh>
          {/* 입 */}
          <mesh position={[0, -0.17, 0.5]} scale={[1, 0.05 + pose.mouth * 0.9, 1]}>
            <icosahedronGeometry args={[0.065, 0]} />
            <meshStandardMaterial color="#5c2430" flatShading />
          </mesh>
          {/* 수염 */}
          {[-1, 1].map((s) =>
            [0, 1].map((k) => (
              <mesh key={`${s}${k}`} position={[s * 0.36, -0.08 - k * 0.05, 0.42]} rotation={[0, s * -0.55, s * (0.12 - k * 0.25)]}>
                <boxGeometry args={[0.28, 0.012, 0.012]} />
                {mat(C.cream)}
              </mesh>
            )),
          )}
          {p.headExtras}
        </group>
      </group>
    </group>
  );
}
