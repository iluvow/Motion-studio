import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {DURATION_SEC, FPS, SIZE} from './constants';
import {Video} from './Video';

registerRoot(() => (
  <Composition id="CatGuitar" component={Video} durationInFrames={DURATION_SEC * FPS} fps={FPS} width={SIZE} height={SIZE} />
));
