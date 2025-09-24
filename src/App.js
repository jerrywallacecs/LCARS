import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cpuUsage, setCpuUsage] = useState(75);
  const [ramUsage, setRamUsage] = useState(68);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Simulate system metrics
    const metricsTimer = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 30) + 60);
      setRamUsage(Math.floor(Math.random() * 25) + 55);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(metricsTimer);
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = () => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return currentTime.toLocaleDateString('en-US', options);
  };

  return (
    <div className="lcars-container">
      {/* Header */}
      <div className="lcars-header">
        <div className="logo-section">
          <div className="federation-logo">
            <div className="logo-circle">
              <div className="stars">★★★</div>
            </div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="computer-time-label">
            COMPUTER TIME
          </div>
          <div className="time-display">
            {formatTime(currentTime)}
          </div>
        </div>

        <div className="header-right">
          <div className="date-section">
            <div className="date">{formatDate()}</div>
            <div className="stardate">Stardate: {(currentTime.getFullYear() - 2000) * 1000 + currentTime.getMonth() * 83 + currentTime.getDate() * 2.7}.{currentTime.getHours()}</div>
          </div>
          <div className="operations-panel">
            <div className="ops-header">OPERATIONS PANEL</div>
            <div className="ops-stats">
              <div>Security: 94%</div>
              <div>Efficiency: 97%</div>
              <div>Core 3 Prs (PSI): 2540</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lcars-main">
        {/* Left Sidebar */}
        <div className="lcars-sidebar-left">
          <div className="sidebar-button active">MASTER CONTROL</div>
          <div className="sidebar-button">ACCESS 247</div>
          <div className="sidebar-button">REFERENCE</div>
          <div className="sidebar-button">MAPS</div>
          <div className="sidebar-button">SHIP SYS</div>
          <div className="sidebar-button">ARCHIVE</div>
          <div className="sidebar-button">CURRENT UTILITIES</div>
          <div className="sidebar-button">MISC</div>
          <div className="sidebar-button">DOCUMENTS</div>
          <div className="sidebar-button">MISC</div>
          <div className="sidebar-button">PICTURES</div>
          <div className="sidebar-button">DOWNLOADS</div>
          <div className="sidebar-button">RECYCLE</div>
          <div className="sidebar-button">PICTURES</div>
          <div className="sidebar-spacer"></div>
          <div className="sidebar-button desktop-btn">DESKTOP</div>
        </div>

        {/* Center Content */}
        <div className="lcars-center">
          {/* Top Row Panels */}
          <div className="top-panels">
            <div className="diagnostics-panel">
              <div className="panel-header">DIAGNOSTICS</div>
              <div className="diagnostics-content">
                <div className="diagnostic-row">
                  <span>CPU</span>
                  <div className="diag-bar">
                    <div className="diag-fill" style={{width: `${cpuUsage}%`}}></div>
                  </div>
                  <span>{cpuUsage}%</span>
                </div>
                <div className="diagnostic-row">
                  <span>RAM 390k</span>
                  <div className="diag-bar">
                    <div className="diag-fill" style={{width: `${ramUsage}%`}}></div>
                  </div>
                  <span>RAM: 380k</span>
                </div>
              </div>
            </div>

            <div className="comms-panel">
              <div className="panel-header">COMMS</div>
            </div>

            <div className="media-panel">
              <div className="panel-header">MEDIA</div>
            </div>
          </div>

          {/* Main Display Area */}
          <div className="main-display-area">
            <div className="core-utilization-panel">
              <div className="panel-header">CORE UTILIZATION</div>
              <div className="core-content">
                <div className="warp-drive-section">
                  <div className="util-label">WARP DRIVE USAGE</div>
                  <div className="util-bar-large">
                    <div className="util-fill-large" style={{width: '75%'}}></div>
                  </div>
                  <div className="util-percentage">75%</div>
                </div>
                
                <div className="power-section">
                  <div className="power-info">42% 8% OFFLINE POWER 1.2M LAG</div>
                  <div className="waveform-display">
                    {Array.from({length: 50}, (_, i) => (
                      <div key={i} className="wave-bar" style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}></div>
                    ))}
                  </div>
                </div>

                <div className="memory-section">
                  <div>MEMORY</div>
                  <div className="memory-indicators">
                    {Array.from({length: 8}, (_, i) => (
                      <div key={i} className={`memory-indicator ${i < 6 ? 'active' : ''}`}></div>
                    ))}
                  </div>
                  <span>RAM: 2.8 GB   RAM Used: 0.8 GB   RAM Free: 100.7 MB</span>
                </div>
                <div className="system-info">
                  <span>SWAP Total: 2.0 GB   SWAP Used: 0.1 GB   SWAP Free: 1.9 GB</span>
                </div>

                <div className="storage-display">
                  <div className="storage-header">STORAGE</div>
                  <div className="pie-chart">
                    <div className="pie-slice" style={{background: 'conic-gradient(#ff6600 0deg 72deg, #333 72deg)'}}></div>
                    <div className="pie-center">20%</div>
                  </div>
                  <div className="storage-details">
                    <div>DOWNLOADS: 5.0 GB</div>
                    <div>UPLOADS: 0.6 GB</div>
                    <div>REP FILES 2%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar HARDCODED FOR NOW*/}
        <div className="lcars-sidebar-right">
          <div className="computer-info-panel">
            <div className="panel-header">COMPUTER INFORMATION</div>
            <div className="computer-details">
              <div className="info-line">COMPUTER NAME: PICARD-PC</div>
              <div className="info-line">FULL COMPUTER NAME: CPU</div>
              <div className="info-line">COMPUTER DESCRIPTION: BTH @ 2.28GHz</div>
              <div className="info-line">WORKGROUP: STARFLEET</div>
              <div className="info-line">SPH CORE COUNT: 4</div>
              <div className="info-line">NETWORK TYPE: 802.11</div>
              <div className="info-line">SAP PROCESSOR: 2600 @ 2.8G</div>
              <div className="info-line">SAP HYPERFR: 3079 @ 8.0G</div>
              <div className="info-line">SAP OPTICS: 2973 @ 6.0G</div>
            </div>
          </div>
          
          <div className="power-controls">
            <div className="shutdown-button">SHUTDOWN</div>
            <div className="power-options">
              <div>LOCK OUT</div>
              <div>SLEEP</div>
              <div>AWAY</div>
            </div>
            <div className="status-bars">
              {Array.from({length: 12}, (_, i) => (
                <div key={i} className="status-bar-item"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bars */}
      <div className="lcars-footer">
        <div className="status-indicator red">STAR DATE</div>
        <div className="status-indicator blue">CURRENT CONDITIONS</div>
      </div>
    </div>
  );
}

export default App;
