
import React from "react";
import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClickSpark from './ClickSpark';
import './App.css';

function Projects() {
  const tildeBoxRef = useRef(null);

  useEffect(() => {
    const tildeBox = tildeBoxRef.current;
    if (!tildeBox) return;

    const HIGHLIGHT_RADIUS = 150;

    const handleMouseMove = (e) => {
      const rect = tildeBox.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
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
      tildeBox.style.setProperty('--mouse-x', `${mouseX}px`);
      tildeBox.style.setProperty('--mouse-y', `${mouseY}px`);
      if (minDistance <= HIGHLIGHT_RADIUS) {
        tildeBox.style.setProperty('--highlight-opacity', '1');
      } else {
        tildeBox.style.setProperty('--highlight-opacity', '0');
      }
    };
    const handleMouseLeave = () => {
      tildeBox.style.setProperty('--highlight-opacity', '0');
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
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
          <div className="header-section" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                ref={tildeBoxRef}
                className="projects-tilde-box table-container"
                style={{
                  width: 56,
                  height: 56,
                  minWidth: 56,
                  minHeight: 56,
                  maxWidth: 56,
                  maxHeight: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  background: 'transparent',
                  position: 'relative',
                }}
              >
                <Link
                  to="/"
                  className="table-link"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '0.375rem',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.875rem',
                    color: '#e4e4e7',
                    background: 'transparent',
                    textDecoration: 'none',
                    fontWeight: 400,
                    textAlign: 'center',
                    border: 'none',
                    position: 'relative',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer',
                  }}
                >
                  ~/ 
                </Link>
                <div className="border-highlight-overlay" style={{ pointerEvents: 'none' }} />
              </div>
              <span
                style={{
                  marginLeft: 20,
                  color: '#fafafa',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '1rem', // match .main-title
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  lineHeight: '2.5rem',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                Projects
              </span>
            </div>
          </div>
          <div className="table-container" style={{ marginTop: '2.5rem' }}>
            <table className="info-table">
              <tbody>
                {/* Example project rows, double height for two lines of text */}
                <tr className="table-row">
                  <td className="table-cell label-cell" style={{ height: '4rem', verticalAlign: 'middle' }}>
                    odds-scraper
                  </td>
                  <td className="table-cell value-cell" style={{ height: '4rem', verticalAlign: 'middle' }}>
                    <div>
                      <a
                        href="https://github.com/pranavbalakri/odds-scraper"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="table-link"
                      >
                        github.com/pranavbalakri/odds-scraper
                      </a>
                      <div style={{ color: '#a1a1aa', fontSize: '0.95em' }}>Scrapes game odds for betting algorithms.</div>
                    </div>
                  </td>
                </tr>
                <tr className="table-row">
                  <td className="table-cell label-cell" style={{ height: '4rem', verticalAlign: 'middle' }}>
                    mini-notes
                  </td>
                  <td className="table-cell value-cell" style={{ height: '4rem', verticalAlign: 'middle' }}>
                    <div>
                      <a
                        href="https://github.com/pranavbalakri/mini-notes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="table-link"
                      >
                        github.com/pranavbalakri/mini-notes
                      </a>
                      <div style={{ color: '#a1a1aa', fontSize: '0.95em' }}>Swift application that displays notes in the menu bar.</div>
                    </div>
                  </td>
                </tr>
                 <tr className="table-row">
                  <td className="table-cell label-cell" style={{ height: '4rem', verticalAlign: 'middle' }}>
                    tradeAdjustment
                  </td>
                  <td className="table-cell value-cell" style={{ height: '4rem', verticalAlign: 'middle' }}>
                    <div>
                      <a
                        href="https://github.com/pranavbalakri/tradeAdjustment"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="table-link"
                      >
                        github.com/pranavbalakri/tradeAdjustment
                      </a>
                      <div style={{ color: '#a1a1aa', fontSize: '0.95em' }}>Data analysis for economics research.</div>
                    </div>
                  </td>
                </tr>
                 <tr className="table-row">
                  <td className="table-cell label-cell" style={{ height: '4rem', verticalAlign: 'middle' }}>
                    geist
                  </td>
                  <td className="table-cell value-cell" style={{ height: '4rem', verticalAlign: 'middle' }}>
                    <div>
                      <a
                        href="https://github.com/pranavbalakri/geist"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="table-link"
                      >
                        github.com/pranavbalakri/geist
                      </a>
                      <div style={{ color: '#a1a1aa', fontSize: '0.95em' }}>.NET application for tracking expenses.</div>
                    </div>
                  </td>
                </tr>
                
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </ClickSpark>
  );
}

export default Projects;
