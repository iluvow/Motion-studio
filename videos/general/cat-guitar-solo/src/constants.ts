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

/** 연주하는 손 높이(이미지 y)별 자세 24장 (내림→올림). 원본 5장 사이를 tools/interp_arm.py가 채운 목록. */
import armPoses from './arm_poses.json';
export const ARM_POSES: {name: string; y: number}[] = armPoses;

/** 가사 자리 표시 (레퍼런스의 글자 타이밍: 약 1.3초 보이고 0.5초 쉼) */
export const LYRICS: {t: number; lines: string[]}[] = [
  {t: 0.94, lines: ['Lyric line one', 'goes right here']},
  {t: 2.57, lines: ['Lyric line two', 'comes next']},
  {t: 4.44, lines: ['Lyric line three', 'follows']},
  {t: 6.31, lines: ['Lyric line four', 'ends it']},
];
export const LYRIC_HOLD = 1.3;
export const LABEL = 'Lone Digger';

/** AI 애니메이션 클립 (tools/prep_clip.py 로 프레임 이미지로 변환한 것) */
import clipMeta from './clips.json';
export const CLIP_META: Record<string, {frames: number; fps: number; duration: number; w: number; h: number; pad: number}> = clipMeta;
/** 클립 안에서 손이 줄을 치는 순간(초). 노래의 킥에 이 순간을 맞춘다. 연주가 거의 없는 클립은 0. */
export const IMPACT: Record<string, number> = {
  strum_A: 24 / 63, strum_B: 24 / 63, headbang: 26 / 63, smirk: 26 / 63, look_down_up: 25 / 63, tail_ear: 26 / 63, idle: 0, final_hit: 0,
};
export const CLIP_BEAT = 30 / 63; // 클립 한 박자(30프레임)
/** 클립 배치표: [시작초, 끝초, 클립]. 킥 시점에서 바꾼다. */
export const SCHEDULE: {from: number; to: number; clip: string}[] = [
  {from: 0, to: 2.905, clip: 'strum_A'},
  {from: 2.905, to: 30, clip: 'strum_B'},
];
/** 클립 화면 배치: 원본 프레임(여백 포함)을 이 배율로 그린다 */
export const CLIP_VIEW = {scale: 1.08, cx: 1290, top: -91};
