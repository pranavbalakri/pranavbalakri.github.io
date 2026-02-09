import './App.css';
// Component ported and enhanced from https://codepen.io/JuanFuentes/pen/eYEeoyE
  
import ASCIIText from './ASCIIText';

function App() {
  return (
    <div className="App">
      <div className="app-layout">
        <div className="ascii-pane">
          <ASCIIText
            asciiFontSize={8}
            enableWaves
            text="PB"
          />
        </div>
        <div className="text-pane">
          <h1>Pranav Balakrishnan</h1>
          <p>
            I'm a <span className="accent-red">Cornell</span> CS student interested in ML, AI safety, and algorithms. 
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
