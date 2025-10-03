import React from 'react';
import LCARSButton from './LCARSButton';
import LCARSPanel from './LCARSPanel';
import LCARSNavigation from './LCARSNavigation';
import LCARSDataCascade from './LCARSDataCascade';

const LCARSExamples = () => {
  const handleButtonClick = (buttonName) => {
    console.log(`${buttonName} clicked`);
  };

  const navButtons = [
    { label: 'MAIN', onClick: () => handleButtonClick('Main') },
    { label: 'SYSTEMS', onClick: () => handleButtonClick('Systems') },
    { label: 'DATA', onClick: () => handleButtonClick('Data') },
    { label: 'COMMS', onClick: () => handleButtonClick('Communications') }
  ];

  return (
    <div>
      <h1 style={{ color: 'var(--h1-color)', margin: '2rem 0' }}>LCARS Component Examples</h1>
      
      {/* Standard LCARS Layout */}
      <section className="wrap-standard" id="column-3">
        <div className="wrap">
          <div className="left-frame-top">
            <LCARSButton panelButton={true} soundEffect={true}>
              LCARS
            </LCARSButton>
            <div className="panel-2">02<span className="hop">-262000</span></div>
          </div>
          <div className="right-frame-top">
            <div className="banner">LCARS EXAMPLES &#149; 47988</div>
            <div className="data-cascade-button-group">
              <LCARSDataCascade columns={6} />
              <LCARSNavigation 
                buttons={navButtons}
                soundEffect={true}
              />
            </div>
            <div className="bar-panel first-bar-panel">
              <div className="bar-1"></div>
              <div className="bar-2"></div>
              <div className="bar-3"></div>
              <div className="bar-4"></div>
              <div className="bar-5"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Content with side panels  Currently using lcars terms but I think we should change this */}
      <div className="wrap" id="gap">
        <div className="left-frame">
          <div>
            <LCARSPanel title="MAIN MENU" panelNumber={3} />
            <LCARSPanel title="SHIP SYS" panelNumber={4} />
            <LCARSPanel title="SENSORS" panelNumber={5} />
            <LCARSPanel title="NAV DATA" panelNumber={6} />
            <LCARSPanel title="SHIELDS" panelNumber={7} />
            <LCARSPanel title="WEAPONS" panelNumber={8} />
            <LCARSPanel title="COMMS" panelNumber={9} />
          </div>
          <div>
            <LCARSPanel title="ARCHIVE" panelNumber={10} />
          </div>
        </div>
        
        <div className="right-frame">
          <div className="bar-panel">
            <div className="bar-6"></div>
            <div className="bar-7"></div>
            <div className="bar-8"></div>
            <div className="bar-9"></div>
            <div className="bar-10"></div>
          </div>
          
          {/* Main content area */}
          <div className="content-area" style={{ 
            padding: '2rem', 
            background: 'var(--space-white)', 
            color: 'black', 
            minHeight: '400px',
            borderRadius: 'var(--radius-content-top)'
          }}>
            <h2 style={{ color: 'var(--h2-color)' }}>Individual Component Examples</h2>
            
            <h3 style={{ color: 'var(--h3-color)' }}>Buttons</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <LCARSButton 
                onClick={() => handleButtonClick('Standard')}
                soundEffect={true}
              >
                STANDARD
              </LCARSButton>
              
              <LCARSButton 
                navButton={true}
                onClick={() => handleButtonClick('Nav')}
                soundEffect={true}
              >
                NAV STYLE
              </LCARSButton>
            </div>

            <h3 style={{ color: 'var(--h3-color)' }}>Data Cascade</h3>
            <p>The data cascade shows streaming technical data in the classic LCARS style:</p>
            <div style={{ height: '200px', overflow: 'hidden', margin: '1rem 0' }}>
              <LCARSDataCascade columns={8} />
            </div>

            <h3 style={{ color: 'var(--h3-color)' }}>Using CSS Variables</h3>
            <p>The LCARS library provides many CSS variables for colors:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', margin: '1rem 0' }}>
              <div style={{ background: 'var(--orange)', padding: '1rem', color: 'black' }}>Orange</div>
              <div style={{ background: 'var(--red)', padding: '1rem', color: 'white' }}>Red</div>
              <div style={{ background: 'var(--bluey)', padding: '1rem', color: 'black' }}>Bluey</div>
              <div style={{ background: 'var(--african-violet)', padding: '1rem', color: 'black' }}>African Violet</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="wrap">
        <div className="left-frame-bottom">
          <div className="panel-11">
            <span className="hop">Examples</span> <span>Active</span>
          </div>
        </div>
        <div className="right-frame-bottom">
          <div className="bar-panel last-bar-panel">
            <div className="bar-1"></div>
            <div className="bar-2"></div>
            <div className="bar-3"></div>
            <div className="bar-4"></div>
            <div className="bar-5"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LCARSExamples;