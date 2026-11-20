import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {DURATION_SEC, FPS, H, W} from './constants';
import {Video} from './Video';
import {Mock, MOCK_DEFAULTS} from './Mock';
import {MockZh, ZH_DEFAULTS} from './MockZh';
import {LyricZh} from './LyricZh';
import {LyricShort} from './LyricShort';
import {GlassMock, GLASS_DEFAULTS} from './GlassMock';
import {GlassMock2, GLASS2_DEFAULTS} from './GlassMock2';
import {MockScroll, SCROLL_DEFAULTS} from './MockScroll';
import {ScrollLyric, SCROLL_FRAMES} from './ScrollLyric';
import {SingleMock, SINGLE_DEFAULTS} from './SingleMock';
import {SingleLyric} from './SingleLyric';
import {CaptionMock, CAPTION_DEFAULTS} from './CaptionMock';

registerRoot(() => (
  <>
    <Composition id="CatBench" component={Video} durationInFrames={DURATION_SEC * FPS} fps={FPS} width={W} height={H} />
    <Composition id="LyricShort" component={LyricShort} durationInFrames={Math.ceil(25.47 * FPS)} fps={FPS} width={W} height={H} defaultProps={{showIndex: false}} />
    <Composition id="GlassMock" component={GlassMock} durationInFrames={1} fps={FPS} width={W} height={H} defaultProps={GLASS_DEFAULTS} />
    <Composition id="GlassMock2" component={GlassMock2} durationInFrames={1} fps={FPS} width={W} height={H} defaultProps={GLASS2_DEFAULTS} />
    <Composition id="MockScroll" component={MockScroll} durationInFrames={1} fps={FPS} width={W} height={H} defaultProps={SCROLL_DEFAULTS} />
    <Composition id="ScrollLyric" component={ScrollLyric} durationInFrames={SCROLL_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="ScrollLyricWide" component={ScrollLyric} durationInFrames={SCROLL_FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{layout: 'wide' as const}} />
    <Composition id="SingleMock" component={SingleMock} durationInFrames={1} fps={FPS} width={1920} height={1080} defaultProps={SINGLE_DEFAULTS} />
    <Composition id="SingleLyricWide" component={SingleLyric} durationInFrames={SCROLL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="CaptionMock" component={CaptionMock} durationInFrames={1} fps={FPS} width={1920} height={1080} defaultProps={CAPTION_DEFAULTS} />
 <Composition id="LyricZh" component={LyricZh} durationInFrames={Math.ceil(25.47 * 30)} fps={30} width={W} height={H} />
    <Composition id="MockZh" component={MockZh} durationInFrames={1} fps={FPS} width={W} height={H} defaultProps={ZH_DEFAULTS} />
    <Composition id="Mock" component={Mock} durationInFrames={1} fps={FPS} width={W} height={H} defaultProps={MOCK_DEFAULTS} />
  </>
));
