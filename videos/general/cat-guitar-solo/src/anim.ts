import {KICKS} from './constants';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = (x: number) => Math.pow(clamp(x), 3);
export const easeInOut = (x: number) => {
  x = clamp(x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export function prevIdx(times: number[], t: number) {
  let lo = 0, hi = times.length - 1, r = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (times[m] <= t) { r = m; lo = m + 1; } else hi = m - 1;
  }
  return r;
}

/**
 * 연주 팔 높이: 0 = 줄을 친 순간, 1 = 높이 든 상태.
 * 킥 직후 튕겨 올라가고, 다음 킥 직전에 가속하며 내려와 정확히 킥에서 줄을 친다.
 */
export function strum(t: number) {
  const i = prevIdx(KICKS, t);
  const prev = i >= 0 ? KICKS[i] : -99;
  const next = i + 1 < KICKS.length ? KICKS[i + 1] : 1e9;
  const since = t - prev, toNext = next - t;
  const rest = since < 0.2 ? 1 : 0.3 + 0.7 * Math.exp(-(since - 0.2) * 5);
  if (toNext < 0.3) {
    const x = toNext / 0.3;
    // 줄을 치러 내려올 때는 3제곱 대신 2제곱 가속 (마지막 순간의 속도가 덜 급해서 프레임 사이 점프가 작다)
    return x > 0.4 ? rest + (1 - rest) * easeInOut((1 - x) / 0.6) : 1 - Math.pow(1 - x / 0.4, 2);
  }
  return since < 0.2 ? easeOut(since / 0.2) : rest;
}

/** 킥 순간 1 → 0 으로 사라지는 펄스 */
export function hit(t: number, decay = 0.12) {
  const i = prevIdx(KICKS, t);
  return i < 0 ? 0 : Math.exp(-(t - KICKS[i]) / decay);
}

/** 드럼이 연주 중이면 1, 쉬는 구간이면 낮게 */
export function active(t: number) {
  const i = prevIdx(KICKS, t);
  if (i < 0 || i + 1 >= KICKS.length) return 0.4;
  const a = t - KICKS[i], b = KICKS[i + 1] - t;
  return clamp(1 - (Math.min(a, b) - 0.6) / 0.4, 0.4, 1);
}

/** 겹쳐 그릴 때 가중 평균이 되도록 하는 누적 투명도 */
export function cumulative(weights: number[]) {
  const out: number[] = [];
  let sum = 0;
  for (const w of weights) {
    sum += w;
    out.push(sum > 1e-6 ? clamp(w / sum) : 0);
  }
  return out;
}

export const bump = (x: number, c: number, w: number) => 0.5 * (1 + Math.cos(Math.PI * clamp(Math.abs(x - c) / w)));
