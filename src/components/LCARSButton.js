import React from 'react';

const LCARSButton = ({ 
  children, 
  className = '', 
  onClick, 
  href = '#',
  navButton = false,
  panelButton = false,
  soundEffect = false
}) => {
  
  const handleClick = () => {
    if (soundEffect) {
      // Play LCARS sound effect if available
      const audio = document.getElementById('audio2');
      if (audio) {
        audio.play();
      }
    }
    if (onClick) {
      onClick();
    }
  };

  // Use nav button style for smaller buttons
  if (navButton) {
    return (
      <button 
        className={`${className}`}
        onClick={handleClick}
      >
        {children}
      </button>
    );
  }

  // Use panel-1-button style for main LCARS button
  if (panelButton) {
    return (
      <button 
        className={`panel-1-button ${className}`}
        onClick={handleClick}
      >
        {children}
      </button>
    );
  }

  // Default to the library's lcars-button class
  return (
    <button 
      className={`lcars-button ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default LCARSButton;