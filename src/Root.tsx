import {Composition, staticFile} from 'remotion';
import {Lyrics} from './Lyrics';
import {Invert, InvertProps, SongData} from './Invert';
import {DURATION_SEC, FPS} from './lyrics';

const invertDefaults: InvertProps = {
  name: 'song2', audio: 'song2.m4a', width: 1920, height: 1440,
  colors: ['#2b4dff', '#ffe14a'], glow: true,
  bigH: 0.42, smallH: 0.072, sparkle: true, zoomIn: true, showKo: true, pieceMode: false, accent: '', split: false, dogs: false, dogSegs: [
    {img: 'dog1.png', from: 0, to: 11, x: 0.86, y: 0.79, size: 0.26, spin: true},
    {img: 'dog4.png', from: 12, to: 18, x: 0.14, y: 0.79, size: 0.24},
    {img: 'dog3.png', from: 19, to: 23, x: 0.86, y: 0.79, size: 0.24},
    {img: 'dog2.png', from: 24, to: 24, x: 0.14, y: 0.79, size: 0.26},
  ], warpAmp: 8, warpStretch: 1,
};

export const Root = () => (
  <>
    <Composition id="Lyrics" component={Lyrics} width={1440} height={1080} fps={FPS} durationInFrames={Math.round(DURATION_SEC * FPS)} />
    <Composition
      id="Invert"
      component={Invert}
      width={1920} height={1440} fps={60} durationInFrames={900}
      defaultProps={invertDefaults}
      calculateMetadata={async ({props}) => {
        const data: SongData = await (await fetch(staticFile(`data/${props.name}.json`))).json();
        return {durationInFrames: Math.ceil((data.endTime ?? data.duration + 0.05) * 60), fps: 60, width: props.width, height: props.height, props: {...props, data}};
      }}
    />
  </>
);
