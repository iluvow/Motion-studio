import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {DURATION_SEC, FPS, H, W} from './constants';
import {Video} from './Video';
import {Mock, MOCK_DEFAULTS} from './Mock';
import {MockZh, ZH_DEFAULTS} from './MockZh';
import {LyricZh} from './LyricZh';

registerRoot(() => (
  <>
    <Composition id="CatBench" component={Video} durationInFrames={DURATION_SEC * FPS} fps={FPS} width={W} height={H} />
 <Composition id="LyricZh" component={LyricZh} durationInFrames={Math.ceil(25.47 * 30)} fps={30} width={W} height={H} />
    <Composition id="MockZh" component={MockZh} durationInFrames={1} fps={FPS} width={W} height={H} defaultProps={ZH_DEFAULTS} />
    <Composition id="Mock" component={Mock} durationInFrames={1} fps={FPS} width={W} height={H} defaultProps={MOCK_DEFAULTS} />
  </>
));
