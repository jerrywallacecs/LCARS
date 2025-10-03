import React, { useState, useEffect } from 'react';

// honestly, This was just a tempalte I foudnn online. I don't think we really need it but it's here for now. 
// Would be nice to rid of ths and make it so that the app isn't scrollable for ease of use.
// I'll prolly do that.
//BUT in our template there is a portion that shows some categories maybe? That's the main reason it is here. Could swap it with the other data 
// and use it as subtitles or wtvr.

const WarpCore = ({ className = '' }) => {
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
    <div className={`wrap ${className}`}>
      <div className="left-frame">
        <div>
          <div className="panel-3">WRP<span className="hop">-CORE</span></div>
          <div className="panel-4">
            WARP<span className="hop">-{warpLevel.toFixed(1)}</span>
          </div>
          <div className="panel-5">
            TEMP<span className="hop">-{Math.round(coreTemp)}K</span>
          </div>
          <div className="panel-6">
            FLOW<span className="hop">-{antimatterFlow.toFixed(1)}</span>
          </div>
          <div className="panel-7">
            PWR<span className="hop">-{Math.round(warpLevel * 11)}%</span>
          </div>
        </div>
      </div>
      <div className="right-frame">
        <div className="bar-panel">
          <div 
            className="bar-6" 
            style={{ 
              width: `${(warpLevel / 9.9) * 100}%`,
              backgroundColor: warpLevel > 5 ? 'var(--red)' : 'var(--orange)'
            }}
          ></div>
          <div 
            className="bar-7" 
            style={{ 
              width: `${Math.min(100, (coreTemp - 2000) / 1500 * 100)}%`,
              backgroundColor: coreTemp > 3000 ? 'var(--red)' : 'var(--butterscotch)'
            }}
          ></div>
          <div 
            className="bar-8" 
            style={{ 
              width: `${(antimatterFlow / 2.0) * 100}%`,
              backgroundColor: 'var(--bluey)'
            }}
          ></div>
          <div 
            className="bar-9" 
            style={{ 
              width: `${(warpLevel * 11)}%`,
              backgroundColor: 'var(--african-violet)'
            }}
          ></div>
        </div>
        
        {/* Visual warp core representation using LCARS elements */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          padding: '2rem',
          height: '300px',
          justifyContent: 'center'
        }}>
          {Array.from({length: 8}, (_, i) => (
            <div 
              key={i}
              style={{
                width: `${60 + i * 10}px`,
                height: '20px',
                backgroundColor: warpLevel > i ? 'var(--moonlit-violet)' : 'var(--gray)',
                margin: '4px',
                borderRadius: '10px',
                opacity: warpLevel > i ? 1 : 0.3,
                animation: warpLevel > i ? `pulse 1s infinite ${i * 0.1}s` : 'none'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WarpCore;