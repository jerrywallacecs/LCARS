import React, { useState, useEffect } from 'react';

const AudioControl = ({ className = '' }) => {
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch audio information
  useEffect(() => {
    const fetchAudioInfo = async () => {
      try {
        setLoading(true);
        if (window.electronAPI && window.electronAPI.getAudioInfo) {
          const data = await window.electronAPI.getAudioInfo();
          setAudioData(data);
          setError(null);
          setLastUpdate(new Date());
        } else {
          // Fallback mock data for development/web version
          setAudioData(getMockAudioData());
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Error fetching audio info:', err);
        setError(err.message);
        // Use mock data as fallback
        setAudioData(getMockAudioData());
        setLastUpdate(new Date());
      } finally {
        setLoading(false);
      }
    };

    // Only fetch on initial load
    fetchAudioInfo();
  }, []); // Remove the polling interval

  const getMockAudioData = () => ({
    masterVolume: Math.floor(Math.random() * 100),
    devices: [
      {
        name: 'Speakers (Realtek High Definition Audio)',
        type: 'output',
        volume: Math.floor(Math.random() * 100),
        muted: Math.random() > 0.8,
        default: true
      },
      {
        name: 'Headphones (USB Audio Device)',
        type: 'output',
        volume: Math.floor(Math.random() * 100),
        muted: Math.random() > 0.8,
        default: false
      },
      {
        name: 'Microphone (Realtek High Definition Audio)',
        type: 'input',
        volume: Math.floor(Math.random() * 100),
        muted: Math.random() > 0.8,
        default: true
      }
    ],
    applications: [
      {
        name: 'System Sounds',
        volume: Math.floor(Math.random() * 100),
        muted: Math.random() > 0.9
      },
      {
        name: 'Web Browser',
        volume: Math.floor(Math.random() * 100),
        muted: Math.random() > 0.9
      },
      {
        name: 'Music Player',
        volume: Math.floor(Math.random() * 100),
        muted: Math.random() > 0.9
      }
    ]
  });

  const setMasterVolume = async (volume) => {
    try {
      // Update local state immediately for responsive UI
      setAudioData(prev => ({
        ...prev,
        masterVolume: volume
      }));
      
      if (window.electronAPI && window.electronAPI.setMasterVolume) {
        await window.electronAPI.setMasterVolume(volume);
        // Only refresh if we need to get updated data from system
        // For now, trust our local update
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error setting volume:', err);
      setError(err.message);
      // Revert local change on error
      if (window.electronAPI && window.electronAPI.getAudioInfo) {
        try {
          const data = await window.electronAPI.getAudioInfo();
          setAudioData(data);
        } catch (refreshError) {
          console.error('Failed to refresh after error:', refreshError);
        }
      }
    }
  };

  const toggleDeviceMute = async (deviceName) => {
    try {
      // Update local state immediately
      setAudioData(prev => ({
        ...prev,
        devices: prev.devices.map(device => 
          device.name === deviceName 
            ? { ...device, muted: !device.muted }
            : device
        )
      }));
      
      if (window.electronAPI && window.electronAPI.toggleDeviceMute) {
        await window.electronAPI.toggleDeviceMute(deviceName);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error toggling mute:', err);
      setError(err.message);
      // Revert local change on error
      if (window.electronAPI && window.electronAPI.getAudioInfo) {
        try {
          const data = await window.electronAPI.getAudioInfo();
          setAudioData(data);
        } catch (refreshError) {
          console.error('Failed to refresh after error:', refreshError);
        }
      }
    }
  };

  const setDeviceVolume = async (deviceName, volume) => {
    try {
      // Update local state immediately
      setAudioData(prev => ({
        ...prev,
        devices: prev.devices.map(device => 
          device.name === deviceName 
            ? { ...device, volume: volume }
            : device
        )
      }));
      
      if (window.electronAPI && window.electronAPI.setDeviceVolume) {
        await window.electronAPI.setDeviceVolume(deviceName, volume);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error setting device volume:', err);
      setError(err.message);
      // Revert local change on error
      if (window.electronAPI && window.electronAPI.getAudioInfo) {
        try {
          const data = await window.electronAPI.getAudioInfo();
          setAudioData(data);
        } catch (refreshError) {
          console.error('Failed to refresh after error:', refreshError);
        }
      }
    }
  };

  const getVolumeColor = (volume, muted) => {
    if (muted) return 'var(--red)';
    if (volume > 80) return 'var(--orange)';
    if (volume > 50) return 'var(--butterscotch)';
    return 'var(--green)';
  };

  const renderVolumeBar = (volume, muted) => {
    const bars = 10;
    const filledBars = Math.floor((volume / 100) * bars);
    
    return (
      <span style={{ fontFamily: 'monospace', fontSize: '1.2em' }}>
        {Array.from({ length: bars }, (_, i) => (
          <span 
            key={i} 
            style={{ 
              color: i < filledBars && !muted ? getVolumeColor(volume, muted) : 'var(--gray)' 
            }}
          >
            {i < filledBars && !muted ? '█' : '░'}
          </span>
        ))}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={className} style={{ color: 'var(--orange)', textAlign: 'center', padding: '2rem' }}>
        <div>ACCESSING AUDIO SYSTEMS...</div>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          Initializing audio control interface
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ color: 'var(--font-color)' }}>
      <style>{`
        .audio-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .audio-panel {
          background: rgba(0, 0, 0, 0.3);
          border-left: 4px solid var(--orange);
          padding: 0.75rem;
          border-radius: 0 8px 0 0;
        }
        .audio-panel.full-width {
          grid-column: 1 / -1;
        }
        .audio-panel h3 {
          color: var(--h3-color);
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
          border-bottom: 1px solid var(--orange);
          padding-bottom: 0.25rem;
        }
        .audio-device {
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: rgba(255, 153, 0, 0.05);
          border: 1px solid rgba(255, 153, 0, 0.3);
          border-radius: 0 4px 0 0;
        }
        .audio-device:last-child {
          margin-bottom: 0;
        }
        .device-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .device-name {
          color: var(--orange);
          font-weight: bold;
          font-size: 0.9rem;
        }
        .device-type {
          color: var(--space-white);
          font-size: 0.7rem;
          text-transform: uppercase;
          background: rgba(255, 153, 0, 0.2);
          padding: 0.1rem 0.3rem;
          border-radius: 2px;
        }
        .volume-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.3rem;
        }
        .volume-slider {
          flex: 1;
          height: 20px;
          background: var(--gray);
          border-radius: 10px;
          outline: none;
          opacity: 0.7;
          transition: opacity 0.2s;
          cursor: pointer;
        }
        .volume-slider:hover {
          opacity: 1;
        }
        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--orange);
          cursor: pointer;
        }
        .volume-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--orange);
          cursor: pointer;
          border: none;
        }
        .mute-button {
          background: var(--red);
          color: black;
          border: none;
          padding: 0.3rem 0.6rem;
          border-radius: 0 4px 0 0;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.7rem;
          font-weight: bold;
          transition: all 0.2s;
        }
        .mute-button:hover {
          background: var(--butterscotch);
        }
        .mute-button.muted {
          background: var(--gray);
          color: var(--red);
        }
        .volume-display {
          color: var(--space-white);
          font-family: monospace;
          font-size: 0.8rem;
          min-width: 35px;
          text-align: right;
        }
        .status-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 0.8rem;
          color: var(--orange);
        }
        .master-volume {
          text-align: center;
          padding: 1rem;
          background: rgba(255, 153, 0, 0.1);
          border: 2px solid var(--orange);
          border-radius: 0 8px 0 0;
          margin-bottom: 1rem;
        }
        .master-volume h2 {
          color: var(--orange);
          margin: 0 0 1rem 0;
          font-size: 1.2rem;
        }
        .master-volume-control {
          display: flex;
          align-items: center;
          gap: 1rem;
          justify-content: center;
        }
        .master-volume-slider {
          width: 200px;
          height: 30px;
          background: var(--gray);
          border-radius: 15px;
          outline: none;
          cursor: pointer;
        }
        .master-volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--orange);
          cursor: pointer;
        }
        .master-volume-slider::-moz-range-thumb {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--orange);
          cursor: pointer;
          border: none;
        }
        .master-volume-display {
          color: var(--orange);
          font-family: monospace;
          font-size: 1.5rem;
          font-weight: bold;
          min-width: 60px;
        }
      `}</style>

      {/* Status Indicator */}
      <div className="status-indicator">
        {error && <span style={{ color: 'var(--red)' }}>ERROR: {error}</span>}
        {lastUpdate && !error && (
          <span>LAST UPDATE: {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>

      {/* Master Volume Control */}
      {audioData && (
        <div className="master-volume">
          <h2>🔊 MASTER VOLUME</h2>
          <div className="master-volume-control">
            {renderVolumeBar(audioData.masterVolume, false)}
            <input
              type="range"
              min="0"
              max="100"
              value={audioData.masterVolume}
              onChange={(e) => setMasterVolume(parseInt(e.target.value))}
              className="master-volume-slider"
            />
            <div className="master-volume-display">{audioData.masterVolume}%</div>
          </div>
        </div>
      )}

      <div className="audio-grid">
        {/* Audio Devices */}
        <div className="audio-panel">
          <h3>🎧 AUDIO DEVICES</h3>
          {audioData && audioData.devices && audioData.devices.map((device, index) => (
            <div key={index} className="audio-device">
              <div className="device-header">
                <div className="device-name">
                  {device.default ? '★ ' : ''}{device.name}
                </div>
                <div className="device-type">{device.type}</div>
              </div>
              <div className="volume-control">
                {renderVolumeBar(device.volume, device.muted)}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={device.volume}
                  onChange={(e) => setDeviceVolume(device.name, parseInt(e.target.value))}
                  className="volume-slider"
                  disabled={device.muted}
                />
                <div className="volume-display">{device.volume}%</div>
                <button
                  onClick={() => toggleDeviceMute(device.name)}
                  className={`mute-button ${device.muted ? 'muted' : ''}`}
                >
                  {device.muted ? 'UNMUTE' : 'MUTE'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Application Audio */}
        <div className="audio-panel">
          <h3>🎵 APPLICATION AUDIO</h3>
          {audioData && audioData.applications && audioData.applications.map((app, index) => (
            <div key={index} className="audio-device">
              <div className="device-header">
                <div className="device-name">{app.name}</div>
              </div>
              <div className="volume-control">
                {renderVolumeBar(app.volume, app.muted)}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={app.volume}
                  onChange={(e) => {
                    // Mock update for applications
                    setAudioData(prev => ({
                      ...prev,
                      applications: prev.applications.map((application, i) => 
                        i === index 
                          ? { ...application, volume: parseInt(e.target.value) }
                          : application
                      )
                    }));
                  }}
                  className="volume-slider"
                  disabled={app.muted}
                />
                <div className="volume-display">{app.volume}%</div>
                <button
                  onClick={() => {
                    // Mock mute toggle for applications
                    setAudioData(prev => ({
                      ...prev,
                      applications: prev.applications.map((application, i) => 
                        i === index 
                          ? { ...application, muted: !application.muted }
                          : application
                      )
                    }));
                  }}
                  className={`mute-button ${app.muted ? 'muted' : ''}`}
                >
                  {app.muted ? 'UNMUTE' : 'MUTE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AudioControl;