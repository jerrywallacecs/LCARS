import React from 'react';
import './LCARSButton.css';

const LCARSButton = ({ 
  children, 
  className = '', 
  onClick, 
  active = false, 
  color = 'orange',
  size = 'normal'
}) => {
  return (
    <div 
      className={`lcars-button ${className} ${active ? 'active' : ''} ${color} ${size}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default LCARSButton;