import {Composition} from 'remotion';
import {Lyrics} from './Lyrics';
import {DURATION_SEC, FPS} from './lyrics';

export const Root = () => (
  <Composition id="Lyrics" component={Lyrics} width={1440} height={1080} fps={FPS} durationInFrames={Math.round(DURATION_SEC * FPS)} />
);
