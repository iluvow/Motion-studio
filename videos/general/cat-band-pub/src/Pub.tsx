import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {C} from './constants';

const m = (color: string, extra: object = {}) => <meshStandardMaterial color={color} flatShading roughness={0.95} {...extra} />;
const glow = (color: string) => <meshBasicMaterial color={color} />;

/** 벽돌 벽: 인스턴스 하나로 그린다 */
function BrickWall() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const rows = 15, cols = 30, w = 0.92, h = 0.38;
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    let n = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const off = r % 2 ? w / 2 : 0;
        d.position.set(-14 + c * w + off, 1.9 + r * h, -4.6);
        d.scale.set(1, 1, 1);
        d.updateMatrix();
        ref.current.setMatrixAt(n, d.matrix);
        col.set(C.brick[(r * 7 + c * 3 + ((r * c) % 5)) % C.brick.length]);
        ref.current.setColorAt(n, col);
        n++;
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, rows * cols]}>
      <boxGeometry args={[w - 0.05, h - 0.05, 0.25]} />
      <meshStandardMaterial flatShading roughness={1} />
    </instancedMesh>
  );
}

function PendantLamp({x, z, color}: {x: number; z: number; color: string}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 6.2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 2.2, 4]} />
        {m(C.ink)}
      </mesh>
      <mesh position={[0, 5.05, 0]}>
        <coneGeometry args={[0.55, 0.45, 6, 1, true]} />
        <meshStandardMaterial color={C.brass} flatShading side={THREE.DoubleSide} metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.95, 0]}>
        <icosahedronGeometry args={[0.16, 0]} />
        {glow(color)}
      </mesh>
    </group>
  );
}

function Bottles({x, y}: {x: number; y: number}) {
  const cols = [C.teal, C.coral, C.brass, '#7d9be0', C.cream, '#9ad07a'];
  return (
    <group position={[x, y, -4.3]}>
      <mesh>
        <boxGeometry args={[3.6, 0.1, 0.5]} />
        {m(C.woodDark)}
      </mesh>
      {cols.map((c, i) => (
        <group key={i} position={[-1.5 + i * 0.6, 0.35 + (i % 2) * 0.04, 0]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.17, 0.5 + (i % 3) * 0.08, 6]} />
            {m(c)}
          </mesh>
          <mesh position={[0, 0.38 + (i % 3) * 0.04, 0]}>
            <cylinderGeometry args={[0.055, 0.08, 0.26, 6]} />
            {m(c)}
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Frame({x, y, w, h, color, rot = 0}: {x: number; y: number; w: number; h: number; color: string; rot?: number}) {
  return (
    <group position={[x, y, -4.42]} rotation={[0, 0, rot]}>
      <mesh>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.08]} />
        {m(C.brass)}
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[w, h, 0.04]} />
        {m(color)}
      </mesh>
      <mesh position={[0, -h * 0.15, 0.08]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[w * 0.28, h * 0.5, 3]} />
        {m(C.cream)}
      </mesh>
    </group>
  );
}

function RoundTable({x, z, flame}: {x: number; z: number; flame: number}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 1.0, 5]} />
        {m(C.woodDark)}
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.06, 7]} />
        {m(C.woodDark)}
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.08, 8]} />
        {m(C.woodLight)}
      </mesh>
      <mesh position={[0.1, 1.2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.3, 6]} />
        {m(C.cream)}
      </mesh>
      <mesh position={[0.1, 1.42, 0]} scale={[1, 1.4 + flame * 0.3, 1]}>
        <icosahedronGeometry args={[0.05, 0]} />
        {glow('#ffd27a')}
      </mesh>
      <pointLight position={[0.1, 1.5, 0.2]} color="#ffb870" intensity={0.5} distance={4} />
    </group>
  );
}

function Stool({x, z}: {x: number; z: number}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.9, 5]} />
        {m(C.woodDark)}
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.12, 7]} />
        {m(C.coral)}
      </mesh>
    </group>
  );
}

/** 무대 뒤 네온 간판 (고양이 얼굴) */
function NeonCat({pulse}: {pulse: number}) {
  const c = pulse > 0.5 ? '#ff9a8c' : C.coral;
  return (
    <group position={[0, 4.1, -4.35]}>
      <mesh>
        <torusGeometry args={[0.62, 0.06, 5, 14]} />
        {glow(c)}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.4, 0.58, 0]} rotation={[0, 0, -s * 0.4]}>
          <torusGeometry args={[0.2, 0.055, 4, 3]} />
          {glow(c)}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.22, 0.06, 0]}>
          <icosahedronGeometry args={[0.05, 0]} />
          {glow(C.teal)}
        </mesh>
      ))}
      <mesh position={[0, -0.14, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.05, 0.06, 3]} />
        {glow(C.teal)}
      </mesh>
    </group>
  );
}

export function Pub({beat}: {beat: number}) {
  const planks = useMemo(() => Array.from({length: 22}), []);
  return (
    <group>
      {/* 바닥 */}
      {planks.map((_, i) => (
        <mesh key={i} position={[0, -0.02, 6 - i * 0.7]}>
          <boxGeometry args={[30, 0.04, 0.66]} />
          {m(i % 2 ? '#6d4430' : '#76492f')}
        </mesh>
      ))}
      {/* 벽 */}
      <mesh position={[0, 1.0, -4.75]}>
        <boxGeometry args={[30, 2.2, 0.2]} />
        {m(C.wallLight)}
      </mesh>
      <mesh position={[0, 0.9, -4.6]}>
        <boxGeometry args={[30, 0.12, 0.3]} />
        {m(C.brass)}
      </mesh>
      <BrickWall />
      <mesh position={[0, 8.7, -4.8]}>
        <boxGeometry args={[30, 4, 0.2]} />
        {m(C.wallDeep)}
      </mesh>
      <mesh position={[0, 9.0, 0]}>
        <boxGeometry args={[30, 0.3, 30]} />
        {m(C.wallDeep)}
      </mesh>

      {/* 무대 */}
      <mesh position={[0, 0.15, -0.2]}>
        <boxGeometry args={[9.2, 0.3, 4.6]} />
        {m(C.wood)}
      </mesh>
      <mesh position={[0, 0.3, 2.14]}>
        <boxGeometry args={[9.2, 0.06, 0.12]} />
        {m(C.brass)}
      </mesh>
      <mesh position={[0, 0.45, -2.0]}>
        <boxGeometry args={[3.2, 0.3, 1.8]} />
        {m(C.woodLight)}
      </mesh>

      {Array.from({length: 11}).map((_, i) => (
        <mesh key={i} position={[-4.2 + i * 0.84, 0.42, 2.18]}>
          <icosahedronGeometry args={[0.07, 0]} />
          {glow(i % 2 ? '#ffd27a' : '#ffb08a')}
        </mesh>
      ))}
      <NeonCat pulse={beat} />
      <Bottles x={-4.6} y={3.3} />
      <Bottles x={4.6} y={2.7} />
      <Frame x={-6.0} y={4.6} w={1.1} h={1.4} color={C.teal} rot={0.04} />
      <Frame x={6.1} y={4.5} w={1.4} h={1.0} color={C.coral} rot={-0.03} />
      <Frame x={-3.3} y={5.3} w={0.8} h={0.8} color={C.brass} />

      <PendantLamp x={-3.2} z={-1} color="#ffd9a0" />
      <PendantLamp x={0} z={-1.8} color="#ffcf8a" />
      <PendantLamp x={3.2} z={-1} color="#ffd9a0" />

      {/* 앞쪽 소품 (깊이감) */}
      <RoundTable x={-2.1} z={6.6} flame={beat} />
      <RoundTable x={2.3} z={6.2} flame={1 - beat} />
      <Stool x={-5.4} z={3.6} />
      <Stool x={5.6} z={3.4} />
    </group>
  );
}
