import { useState } from 'react';
import './Folder.css';

const darkenColor = (hex, percent) => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map(c => c + c)
      .join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const Folder = ({ color = '#5227FF', size = 1, items = [], className = '' }) => {
  const maxItems = items.length;
  const papers = items.slice(0, maxItems);
  while (papers.length < maxItems) {
    papers.push(null);
  }

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
  const [folderHovered, setFolderHovered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const folderBackColor = darkenColor(color, 0.08);
  const paper1 = darkenColor('#ffffff', 0.1);
  const paper2 = darkenColor('#ffffff', 0.05);
  const paper3 = '#ffffff';

  const handleClick = () => {
    setOpen(prev => !prev);
    setHoveredCard(null);
    if (open) {
      setPaperOffsets(Array.from({ length: maxItems }, () => ({ x: 0, y: 0 })));
    }
  };

  const handlePaperMouseMove = (e, index) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets(prev => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: offsetX, y: offsetY };
      return newOffsets;
    });
  };

  const handlePaperMouseEnter = (index) => {
    setHoveredCard(index);
  };

  const handlePaperMouseLeave = (e, index) => {
    setPaperOffsets(prev => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: 0, y: 0 };
      return newOffsets;
    });
    setHoveredCard(null);
  };

  const handleFolderMouseEnter = () => setFolderHovered(true);
  const handleFolderMouseLeave = () => {
    setFolderHovered(false);
    setOpen(false);
    setHoveredCard(null);
  };

  const folderStyle = {
    '--folder-color': color,
    '--folder-back-color': folderBackColor,
    '--paper-1': paper1,
    '--paper-2': paper2,
    '--paper-3': paper3
  };

  const folderClassName = `folder ${open ? 'open' : ''}`.trim();
  const scaleStyle = { transform: `scale(${size})` };

  // Calculate fan angle and width for each card
  const fanAngle = 60; // total degrees to fan out
  const baseWidth = 180;
  const baseHeight = 120;
  const center = Math.floor((maxItems - 1) / 2);

  return (
    <div style={scaleStyle} className={className}>
      <div
        className={folderClassName}
        style={folderStyle}
        onClick={handleClick}
        onMouseEnter={handleFolderMouseEnter}
        onMouseLeave={handleFolderMouseLeave}
      >
        <div className="folder__back" style={{ width: baseWidth, height: baseHeight }}>
          {papers.map((item, i) => {
            // When closed, cards are stacked. When open, cards fan out.
            const offset = i - center;
            let angle = 0, translateX = 0, translateY = 0, scale = 1, z = 2;
            if (open) {
              angle = (fanAngle / (maxItems - 1 || 1)) * offset;
              translateX = offset * 38;
              translateY = Math.abs(offset) * -10 - 60;
              z = hoveredCard === i ? 20 : 10 + i;
              scale = hoveredCard === i ? 1.13 : 1.08;
            }
            const transform = open
              ? `translate(-50%, 10%) rotate(${angle}deg) translate(${translateX}px, ${translateY}px) scale(${scale})`
              : `translate(-50%, 10%)`;
            return (
              <div
                key={i}
                className={`paper paper-${i + 1}`}
                onMouseMove={e => handlePaperMouseMove(e, i)}
                onMouseLeave={e => handlePaperMouseLeave(e, i)}
                onMouseEnter={() => handlePaperMouseEnter(i)}
                style={{
                  width: baseWidth * 0.85,
                  height: baseHeight * 0.85,
                  left: '50%',
                  bottom: '10%',
                  position: 'absolute',
                  zIndex: z,
                  transform,
                  background: `var(--paper-${i + 1 <= 3 ? i + 1 : 3})`,
                  borderRadius: 10,
                  transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
                  '--magnet-x': open ? `${paperOffsets[i]?.x || 0}px` : undefined,
                  '--magnet-y': open ? `${paperOffsets[i]?.y || 0}px` : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: 0
                }}
              >
                {item}
              </div>
            );
          })}
          <div className="folder__front" style={{ width: baseWidth, height: baseHeight }}></div>
          <div className="folder__front right" style={{ width: baseWidth, height: baseHeight }}></div>
        </div>
      </div>
    </div>
  );
};

export default Folder;
