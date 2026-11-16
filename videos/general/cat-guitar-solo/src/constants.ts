import timing from './timing.json';

export const FPS = 60;
export const W = 1920;           // 레퍼런스와 같은 4:3 비율
export const H = 1440;
export const DURATION_SEC = 30;
export const AUDIO_FILE = 'clip.mp3';

/** 색 (배경은 임시. 펍 무대 사진으로 교체 예정) */
export const C = {
  bgTop: '#150c16',
  bgMid: '#2a1522',
  amber: '#ffb25a',
  coral: '#ff6f5e',
  teal: '#3aa6a0',
  text: '#ffffff',
};

/** 노래 박자(킥) 시간표 — 클립 시작 기준 초 */
export const KICKS: number[] = timing.kicks;
export const PERIOD: number = timing.beatPeriod;

/** 고양이 이미지 원본 크기와 화면 배치. 무릎 아래는 화면 밖으로 잘린다 (레퍼런스와 같은 구도). */
export const CAT = {w: 978, h: 1608, scale: 1.1, cx: 1290, top: -64};
/** 꼬리가 몸에 붙는 점 (이미지 좌표) */
export const TAIL_PIVOT = {x: 258, y: 1215};

/** 연주하는 손 높이(이미지 y)와 해당 자세 파일 — 위쪽일수록 작은 값 */
export const ARM_POSES: {name: string; y: number}[] = [
  {name: 'down', y: 961},
  {name: 'orig', y: 910},
  {name: 'mid', y: 831},
  {name: 'p17', y: 810},
  {name: 'up', y: 768},
];

/** 가사 자리 표시 (레퍼런스의 글자 타이밍: 약 1.3초 보이고 0.5초 쉼) */
export const LYRICS: {t: number; lines: string[]}[] = [
  {t: 0.94, lines: ['Lyric line one', 'goes right here']},
  {t: 2.57, lines: ['Lyric line two', 'comes next']},
  {t: 4.44, lines: ['Lyric line three', 'follows']},
  {t: 6.31, lines: ['Lyric line four', 'ends it']},
];
export const LYRIC_HOLD = 1.3;
export const LABEL = 'Lone Digger';
