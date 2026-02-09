import './App.css';
// Component ported and enhanced from https://codepen.io/JuanFuentes/pen/eYEeoyE

import ASCIIText from './ASCIIText';
import DitherBG from './DitherBG';
import GlassSurface from './glass';

function App() {
  return (
    <div className="App">
      <div className="full-screen-bg" aria-hidden="true">
        <DitherBG
          waveColor={[0.4, 0.4, 0.4]}
          disableAnimation={false}
          enableMouseInteraction={false}
          mouseRadius={0.3}
          colorNum={23.8}
          waveAmplitude={0.2}
          waveFrequency={6.1}
          waveSpeed={0.01}
          colorIntensity={0.4}
        />
      </div>
      <div className="app-layout">
        <div className="text-pane">
          <div className="ascii-title" aria-label="Pranav Balakrishnan">
            <ASCIIText
              text="Pranav Balakrishnan"
              asciiFontSize={4}
              textFontSize={30}
              enableWaves={true}
              enableMouseInteraction={false}
            />
          </div>
          <p>
            I'm a <span className="accent-red">Cornell</span> CS student interested in ML, AI safety, and algorithms.
          </p>
        </div>
      </div>
      <div className="button-row">
        <GlassSurface className="button-surface" width="100%" height={56} borderRadius={18} blur={12}>
          <button className="primary-btn" type="button">Projects</button>
        </GlassSurface>
        <GlassSurface className="button-surface" width="100%" height={56} borderRadius={18} blur={12}>
          <button className="primary-btn" type="button">About</button>
        </GlassSurface>
        <GlassSurface className="button-surface" width="100%" height={56} borderRadius={18} blur={12}>
          <button className="primary-btn" type="button">Contact</button>
        </GlassSurface>
      </div>
    </div>
  );
}

export default App;
