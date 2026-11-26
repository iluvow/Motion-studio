import {Composition, staticFile} from 'remotion';
import {Lyrics} from './Lyrics';
import {Invert, InvertProps, SongData} from './Invert';
import {DURATION_SEC, FPS} from './lyrics';

const invertDefaults: InvertProps = {
  name: 'song2', audio: 'song2.m4a', width: 1440, height: 1080,
  colors: ['#2b4dff', '#ffe14a'], glow: true,
  bigH: 0.42, smallH: 0.072, sparkle: true, zoomIn: true, showKo: true, pieceMode: false, warpAmp: 8, warpStretch: 1,
};

export const Root = () => (
  <>
    <Composition id="Lyrics" component={Lyrics} width={1440} height={1080} fps={FPS} durationInFrames={Math.round(DURATION_SEC * FPS)} />
    <Composition
      id="Invert"
      component={Invert}
      width={1440} height={1080} fps={30} durationInFrames={450}
      defaultProps={invertDefaults}
      calculateMetadata={async ({props}) => {
        const data: SongData = await (await fetch(staticFile(`data/${props.name}.json`))).json();
        return {durationInFrames: Math.ceil((data.duration + 0.05) * 30), width: props.width, height: props.height, props: {...props, data}};
      }}
    />
  </>
);
