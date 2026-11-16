import timing from './timing.json';

export const FPS = 60;
export const SIZE = 1440;
export const DURATION_SEC = 30;
export const AUDIO_FILE = 'clip.mp3';

/** 색: 배경(해질녘 남색) / 메인(노을 주황) / 강조(따뜻한 크림 윤곽선) */
export const C = {
  skyTop: '#0a1a47',
  skyMid: '#1d3578',
  glow: '#ffae45',
  glowSoft: '#ff7a3c',
  ground: '#1a0f12',
  rim: '#ffeec4',
  text: '#ffffff',
};

/** 노래 박자(킥) 시간표 — 클립 시작 기준 초 */
export const KICKS: number[] = timing.kicks;
export const PERIOD: number = timing.beatPeriod;

/** 화면 배치 (1440 정사각형) */
export const CAT = {w: 978, h: 1608, scale: 0.82, left: 610, top: 100};

/** 가사 자리 표시 (실제 가사로 교체) */
export const LYRICS: {t: number; lines: string[]}[] = [
  {t: 0.5, lines: ['Lyric line one', 'goes right here']},
  {t: 2.9, lines: ['Lyric line two', 'comes next']},
];
export const LABEL = 'Lone Digger';
