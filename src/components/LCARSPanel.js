import React from 'react';

const LCARSPanel = ({ 
  title, 
  children, 
  className = '', 
  panelNumber = 3,
  showCode = true,
  onClick
}) => {
  
  // Handle click with sound effect
  const handleClick = () => {
    if (onClick) {
      // Play LCARS sound effect using the same audio element as LCARSNavigation
      const audio = document.getElementById('audio2');
      if (audio) {
        audio.play();
      }
      onClick();
    }
  };

  // Generate panel classes based on panel number
  const panelClass = `panel-${panelNumber}`;
  
  // Create panel with LCARS numbering pattern
  const renderPanelContent = () => {
    if (title) {
      return (
        <>
          {String(panelNumber).padStart(2, '0')}
          <span className="hop">-{title}</span>
        </>
      );
    }
    return children;
  };

  return (
    <div 
      className={`${panelClass} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={handleClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...(onClick && {
          transition: 'all 0.2s ease',
          ':hover': {
            filter: 'brightness(1.1)'
          }
        })
      }}
    >
      {renderPanelContent()}
    </div>
  );
};

export default LCARSPanel;