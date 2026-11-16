import {T} from './constants';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = (x: number) => Math.pow(clamp(x), 3);
export const easeInOut = (x: number) => {
  x = clamp(x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** times 중 t 이하인 마지막 인덱스 */
export function prevIdx(times: number[], t: number) {
  let lo = 0, hi = times.length - 1, r = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (times[m] <= t) { r = m; lo = m + 1; } else hi = m - 1;
  }
  return r;
}

/**
 * 타격 동작: 0 = 타격 순간(스틱이 닿는 때), 1 = 최대로 들어 올린 상태.
 * 타격 직후 튕겨 올라가고, 다음 타격 직전에 가속하며 내려온다 (예비 동작 + 반동).
 */
export function strike(times: number[], t: number) {
  const i = prevIdx(times, t);
  const prev = i >= 0 ? times[i] : -99;
  const next = i + 1 < times.length ? times[i + 1] : 1e9;
  const since = t - prev;
  const toNext = next - t;
  const rest = since < 0.2 ? 1 : 0.25 + 0.75 * Math.exp(-(since - 0.2) * 5);
  if (toNext < 0.3) {
    const x = toNext / 0.3;
    return x > 0.4 ? rest + (1 - rest) * easeInOut((1 - x) / 0.6) : 1 - easeIn(1 - x / 0.4);
  }
  return since < 0.2 ? easeOut(since / 0.2) : rest;
}

/** 직전 이벤트 이후 감쇠 펄스 (타격 순간 1 → 0) */
export function pulse(times: number[], t: number, decay = 0.14) {
  const i = prevIdx(times, t);
  if (i < 0) return 0;
  return Math.exp(-(t - times[i]) / decay);
}

/** 드럼이 연주 중이면 1, 쉬는 구간이면 0.45 (부드럽게 전환) */
export function drumActive(t: number) {
  const i = prevIdx(T.kicks, t);
  const a = i >= 0 ? t - T.kicks[i] : 99;
  const b = i + 1 < T.kicks.length ? T.kicks[i + 1] - t : 99;
  const d = Math.min(a, b);
  return clamp(1 - (d - 0.6) / 0.4, 0.45, 1);
}

/** 박자 위상 0..1 (킥 격자 기준, 0 = 박자 시작) */
export function beatPhase(t: number, offset = 0) {
  const p = (t - T.kicks[0] - offset) / T.period;
  return p - Math.floor(p);
}

/** 박자에 맞춘 고개 끄덕임: 박자에서 가장 낮고 부드럽게 올라온다 */
export function nod(t: number, offset = 0) {
  const ph = beatPhase(t, offset);
  const c = 0.5 + 0.5 * Math.cos(2 * Math.PI * ph);
  return c * c * drumActive(t);
}
