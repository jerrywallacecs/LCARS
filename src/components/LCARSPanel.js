import React from 'react';
import './LCARSPanel.css';

const LCARSPanel = ({ title, children, className = '', color = 'orange' }) => {
  return (
    <div className={`lcars-panel ${className}`}>
      {title && (
        <div className={`panel-header ${color}`}>
          {title}
        </div>
      )}
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
};

export default LCARSPanel;