// 가사 타이밍(초). 여기만 고치면 됩니다. start = 해당 줄이 나오는 시각.
export type Cue = {start: number; en: string; ko: string};
export const FPS = 30;
export const DURATION_SEC = 14.9;
export const CUES: Cue[] = [
  {start: 0.2, en: 'R-O-F-L-M-A-O', ko: '개웃겨 죽을꺼같아 ㅋㅋ'},
  {start: 3.0, en: 'Less than three, you love me', ko: '<3, 넌 날 사랑해'},
  {start: 4.5, en: 'Typing out my fantasy', ko: '내 상상을 채팅창에 적어'},
  {start: 6.0, en: 'Meet me here on IRC', ko: '여기 IRC에서 만나자'},
  {start: 7.5, en: 'L-O-L-O-L (yeah)', ko: 'L-O-L-O-L (yeah)'},
  {start: 9.0, en: 'Less than three, O-M-G', ko: '<3, O-M-G'},
  {start: 10.5, en: 'Love computer fantasy', ko: '컴퓨터 속 로맨스 판타지'},
  {start: 12.0, en: 'Meet me here on IRC', ko: '여기 IRC에서 만나자'},
  {start: 13.5, en: 'L-O-L-O-L (here we go)', ko: 'L-O-L-O-L (자, 간다)'},
];
