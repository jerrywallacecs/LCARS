import React from 'react';

const LCARSMainPanel = ({ children, className = '' }) => {
  return (
    <section className={`wrap-standard ${className}`} id="column-3">
      <div className="wrap">
        <div className="left-frame-top">
          <button className="panel-1-button">LCARS</button>
          <div className="panel-2">02<span className="hop">-262000</span></div>
        </div>
        <div className="right-frame-top">
          <div className="banner">LCARS &#149; 47988</div>
          <div className="data-cascade-button-group">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LCARSMainPanel;