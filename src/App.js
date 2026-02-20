import './App.css';
// Component ported and enhanced from https://codepen.io/JuanFuentes/pen/eYEeoyE

import DitherBG from './DitherBG';

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
          <p>
            I'm a <span className="accent-red">Cornell</span> CS student interested in ML, AI safety, and algorithms.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
