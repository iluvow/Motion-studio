import {Composition, staticFile} from 'remotion';
import {Lyrics} from './Lyrics';
import {Invert, InvertProps, SongData} from './Invert';
import {DURATION_SEC, FPS} from './lyrics';

const invertDefaults: InvertProps = {
  name: 'test', audio: 'song.m4a', width: 1080, height: 1920,
  colors: ['#000000', '#ff8fe8'], flip: 'event', position: 'alternate',
  wordByWord: true, rgbSplit: true, fontSize: 44, glow: true,
};

export const Root = () => (
  <>
    <Composition id="Lyrics" component={Lyrics} width={1440} height={1080} fps={FPS} durationInFrames={Math.round(DURATION_SEC * FPS)} />
    <Composition
      id="Invert"
      component={Invert}
      width={1080} height={1920} fps={30} durationInFrames={450}
      defaultProps={invertDefaults}
      calculateMetadata={async ({props}) => {
        const data: SongData = await (await fetch(staticFile(`data/${props.name}.json`))).json();
        return {durationInFrames: Math.ceil((data.duration + 0.05) * 30), width: props.width, height: props.height, props: {...props, data}};
      }}
    />
  </>
);
