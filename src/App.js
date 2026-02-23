import './App.css';
import ClickSpark from './ClickSpark';
import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Projects from './Projects';

function Home() {
  const tableContainerRef = useRef(null);
  const [rowPositions, setRowPositions] = useState([]);

  const links = [
    { label: "Linkedin", value: "linkedin.com/in/pranavbalakri", href: "https://linkedin.com/in/pranavbalakri", external: true },
    { label: "Github", value: "github.com/pranavbalakri", href: "https://github.com/pranavbalakri", external: true },
    { label: "Email", value: "pb629@cornell.edu", href: "mailto:pb629@cornell.edu", external: true },
    { label: "Projects", value: "~/projects", href: "/projects", external: false }
  ];

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (!tableContainer) return;

    const HIGHLIGHT_RADIUS = 150;

    // Calculate row line positions
    const updateRowPositions = () => {
      const rows = tableContainer.querySelectorAll('.table-row');
      const containerRect = tableContainer.getBoundingClientRect();
      
      const positions = [];
      rows.forEach((row, index) => {
        if (index === rows.length - 1) return; // Skip last row
        const rowRect = row.getBoundingClientRect();
        // The border sits at the bottom of each row
        positions.push(rowRect.bottom - containerRect.top - 1);
      });
      setRowPositions(positions);
    };

    updateRowPositions();
    window.addEventListener('resize', updateRowPositions);

    const handleMouseMove = (e) => {
      const rect = tableContainer.getBoundingClientRect();
      
      // Calculate mouse position relative to the table container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate distance from mouse to the nearest edge
      const distanceToLeft = Math.abs(e.clientX - rect.left);
      const distanceToRight = Math.abs(e.clientX - rect.right);
      const distanceToTop = Math.abs(e.clientY - rect.top);
      const distanceToBottom = Math.abs(e.clientY - rect.bottom);
      
      const minDistance = Math.min(
        distanceToLeft,
        distanceToRight,
        distanceToTop,
        distanceToBottom
      );
      
      // Set mouse position on the container for all borders to use
      tableContainer.style.setProperty('--mouse-x', `${mouseX}px`);
      tableContainer.style.setProperty('--mouse-y', `${mouseY}px`);
      
      // Only show the highlight when mouse is near the edges
      if (minDistance <= HIGHLIGHT_RADIUS) {
        tableContainer.style.setProperty('--highlight-opacity', '1');
      } else {
        tableContainer.style.setProperty('--highlight-opacity', '0');
      }
    };

    const handleMouseLeave = () => {
      tableContainer.style.setProperty('--highlight-opacity', '0');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', updateRowPositions);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <ClickSpark
      sparkColor="#ef4444"
      sparkSize={10}
      sparkRadius={20}
      sparkCount={8}
      duration={500}
    >
      <div className="app-container">
        <main className="main-content">
          <div className="header-section">
            <h1 className="main-title">
              Pranav Balakrishnan : <span className="accent-red">Cornell CS</span>
            </h1>
            <p className="subtitle">
              In high school, I found policy debate and fell in love with answering hard questions. Now, I'm interested in ML, AI safety, and financial technology.
            </p>
          </div>

          <div className="table-container" ref={tableContainerRef}>
            <div className="border-highlight-overlay">
              {rowPositions.map((top, index) => (
                <div
                  key={index}
                  className="row-line"
                  style={{ top: `${top}px` }}
                />
              ))}
            </div>
            <table className="info-table">
              <tbody>
                {links.map((link, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell label-cell">{link.label}</td>
                    <td className="table-cell value-cell">
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-link"
                        >
                          {link.value}
                        </a>
                      ) : (
                        <Link to={link.href} className="table-link">
                          {link.value}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </ClickSpark>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
      </Routes>
    </Router>
  );
}

export default App;
