import timing from './timing.json';

export const FPS = 60;
export const SIZE = 1440;
export const DURATION_SEC = 30;
export const AUDIO_FILE = 'clip.mp3';

/** 팔레트: 배경(와인 브라운) / 메인(황동 금색) / 강조(코랄, 청록) */
export const C = {
  wallDeep: '#3a2230',
  wallLight: '#5a3340',
  brick: ['#6d3b43', '#7a4249', '#62363f', '#84504f'],
  wood: '#9a6340',
  woodDark: '#5e3a29',
  woodLight: '#b9794a',
  brass: '#e8ae4c',
  coral: '#ff7a6b',
  teal: '#43b7a9',
  cream: '#f6e6c9',
  ink: '#241a22',
  blush: '#ff9d8d',
  pink: '#ff9aa6',
};

export const COATS = {
  orange: {coat: '#ec9650', belly: '#f8dcb4', accent: '#c9692f'},
  tux: {coat: '#2c2733', belly: '#f6ecd9', accent: '#1b1721'},
  gray: {coat: '#a3acbd', belly: '#e9edf3', accent: '#7c8699'},
  calico: {coat: '#f5dfbd', belly: '#fff3de', accent: '#d9814a'},
  siamese: {coat: '#eedfc6', belly: '#fbf1de', accent: '#5e4337'},
};

export const T = {
  kicks: timing.kicks as number[],
  snares: timing.snares as number[],
  period: timing.beatPeriod as number,
  vocalEnv: timing.vocalEnv as number[],
};
/** 드럼이 쉬는 구간 이후 첫 킥 (크래시 심벌 시점) */
export const CRASH_TIMES: number[] = (() => {
  const out: number[] = [T.kicks[0]];
  for (let i = 1; i < T.kicks.length; i++) if (T.kicks[i] - T.kicks[i - 1] > 0.7) out.push(T.kicks[i]);
  return out;
})();
/** 하이햇: 킥과 킥 사이(엇박) */
export const HAT_TIMES: number[] = T.kicks.slice(0, -1)
  .map((k, i) => [k, T.kicks[i + 1]])
  .filter(([a, b]) => b - a < 0.6)
  .map(([a, b]) => (a + b) / 2);
