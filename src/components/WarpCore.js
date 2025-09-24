import React, { useState, useEffect } from 'react';
import './WarpCore.css';

const WarpCore = () => {
  const [warpLevel, setWarpLevel] = useState(0);
  const [coreTemp, setCoreTemp] = useState(2500);
  const [antimatterFlow, setAntimatterFlow] = useState(1.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setWarpLevel(prev => {
        const change = (Math.random() - 0.5) * 0.5;
        return Math.max(0, Math.min(9.9, prev + change));
      });
      
      setCoreTemp(prev => prev + (Math.random() - 0.5) * 50);
      setAntimatterFlow(prev => {
        const change = (Math.random() - 0.5) * 0.1;
        return Math.max(0.8, Math.min(2.0, prev + change));
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="warp-core">
      <div className="core-container">
        <div className="core-visual">
          <div className="core-center">
            <div className="antimatter-stream"></div>
            <div className="energy-rings">
              {Array.from({length: 8}, (_, i) => (
                <div 
                  key={i} 
                  className="energy-ring" 
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    opacity: warpLevel > i ? 1 : 0.3
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="core-readouts">
          <div className="readout-item">
            <span className="label">WARP FACTOR:</span>
            <span className="value">{warpLevel.toFixed(1)}</span>
          </div>
          <div className="readout-item">
            <span className="label">CORE TEMP:</span>
            <span className="value">{Math.round(coreTemp)}K</span>
          </div>
          <div className="readout-item">
            <span className="label">ANTIMATTER FLOW:</span>
            <span className="value">{antimatterFlow.toFixed(2)} L/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarpCore;