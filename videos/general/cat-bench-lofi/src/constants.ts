export const FPS = 60;
export const W = 1440;          // 2:3 세로 (가사 해석 숏폼 기본 사양)
export const H = 2160;
export const DURATION_SEC = 30;
export const AUDIO_FILE = 'clip.mp3';

/** 안전 여백: 좌우 8%, 아래 18% (틱톡/릴스 버튼과 설명글이 가리는 영역) */
export const SAFE = {x: 115, bottom: 390};

/** 장면 안의 위치 (1440x2160 기준) */
export const LAMP = {x: 1332, y: 1152};            // 가로등 불빛
export const CATS = {left: 690, top: 1350, w: 620, h: 540};   // 고양이+벤치 (prep_layers.py 의 box)

/** 색 */
export const C = {text: '#ffffff', sub: 'rgba(255,255,255,0.62)', amber: '255,176,90', leaf: ['#d9772b', '#b8571f', '#e0a040', '#c2622a']};

/** 가사 해석 자리 표시 (실제 가사와 해석으로 교체) */
export const LINES: {t: number; en: string; ko: string}[] = [
  {t: 0.9, en: 'Original lyric line one', ko: '가사 해석이 이 자리에\n나와요'},
  {t: 2.9, en: 'Original lyric line two', ko: '다음 줄 해석은\n이렇게 바뀌어요'},
];
export const LINE_HOLD = 1.9;
export const LABEL = 'Lone Digger';
