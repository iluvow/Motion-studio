import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {DURATION_SEC, FPS, H, W} from './constants';
import {Video} from './Video';

registerRoot(() => (
  <Composition id="CatBench" component={Video} durationInFrames={DURATION_SEC * FPS} fps={FPS} width={W} height={H} />
));
