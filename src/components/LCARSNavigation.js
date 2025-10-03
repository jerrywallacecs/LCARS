import React from 'react';

const LCARSNavigation = ({ 
  buttons = [], 
  className = '',
  soundEffect = false 
}) => {
  
  const handleClick = (onClick, index) => {
    if (soundEffect) {
      // Play LCARS sound effect if available
      const audio = document.getElementById('audio2');
      if (audio) {
        audio.play();
      }
    }
    if (onClick) {
      onClick(index);
    }
  };

  return (
    <nav className={className}>
      {buttons.map((button, index) => (
        <button 
          key={index}
          onClick={() => handleClick(button.onClick, index)}
        >
          {button.label || String(index + 1).padStart(2, '0')}
        </button>
      ))}
    </nav>
  );
};

export default LCARSNavigation;