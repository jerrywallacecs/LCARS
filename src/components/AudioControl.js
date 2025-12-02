import React, { useState, useEffect } from 'react';

const AudioControl = ({ className = '' }) => {
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updatingVolume, setUpdatingVolume] = useState(false);
  const [refreshingBluetooth, setRefreshingBluetooth] = useState(false);

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
          setError('Electron API not available');
          setAudioData(null);
        }
      } catch (err) {
        console.error('Error fetching audio info:', err);
        setError(err.message);
        setAudioData(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch only
    fetchAudioInfo();
  }, []);

  const setMasterVolume = async (volume) => {
    try {
      setUpdatingVolume(true);
      
      if (window.electronAPI && window.electronAPI.setMasterVolume) {
        await window.electronAPI.setMasterVolume(volume);
        // Update local state after successful API call
        setAudioData(prev => ({
          ...prev,
          masterVolume: volume
        }));
        setLastUpdate(new Date());
      } else {
        // For development/web version, just update local state
        setAudioData(prev => ({
          ...prev,
          masterVolume: volume
        }));
        setError('Electron API not available - volume change simulated only');
      }
    } catch (err) {
      console.error('Error setting volume:', err);
      setError(err.message);
    } finally {
      setUpdatingVolume(false);
    }
  };

  const refreshBluetoothDevices = async () => {
    try {
      setRefreshingBluetooth(true);
      setError(null);
      
      if (window.electronAPI && window.electronAPI.getAudioInfo) {
        const data = await window.electronAPI.getAudioInfo();
        setAudioData(prev => ({
          ...prev,
          bluetoothDevices: data.bluetoothDevices
        }));
        setLastUpdate(new Date());
      } else {
        setError('Electron API not available - cannot refresh Bluetooth devices');
      }
    } catch (err) {
      console.error('Error refreshing Bluetooth devices:', err);
      setError(err.message);
    } finally {
      setRefreshingBluetooth(false);
    }
  };

  const toggleBluetoothDevice = async (deviceName) => {
    try {
      const device = audioData.bluetoothDevices.find(d => d.name === deviceName);
      if (!device) return;

      // Update local state immediately
      setAudioData(prev => ({
        ...prev,
        bluetoothDevices: prev.bluetoothDevices.map(d => 
          d.name === deviceName 
            ? { ...d, connected: !d.connected, signalStrength: !d.connected ? 85 : 0 }
            : d
        )
      }));
      
      if (window.electronAPI && window.electronAPI.toggleBluetoothDevice) {
        await window.electronAPI.toggleBluetoothDevice(deviceName);
        setLastUpdate(new Date());
        // Refresh the data to get updated connection status
        if (window.electronAPI.getAudioInfo) {
          try {
            const data = await window.electronAPI.getAudioInfo();
            setAudioData(data);
          } catch (refreshError) {
            console.error('Failed to refresh after toggle:', refreshError);
          }
        }
      } else {
        setError('Electron API not available - cannot control Bluetooth devices');
        // Revert local change
        setAudioData(prev => ({
          ...prev,
          bluetoothDevices: prev.bluetoothDevices.map(d => 
            d.name === deviceName 
              ? { ...d, connected: !d.connected }
              : d
          )
        }));
      }
    } catch (err) {
      console.error('Error toggling Bluetooth device:', err);
      setError(err.message);
      // Revert local change on error by refreshing from API
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

  const getVolumeColor = (volume) => {
    if (volume === 0) return 'var(--red)';
    if (volume < 25) return 'var(--orange)';
    if (volume < 50) return 'var(--butterscotch)';
    if (volume < 75) return 'var(--green)';
    return 'var(--bluey)';
  };

  const getBatteryColor = (batteryLevel) => {
    if (!batteryLevel) return 'var(--gray)';
    if (batteryLevel < 20) return 'var(--red)';
    if (batteryLevel < 50) return 'var(--orange)';
    return 'var(--green)';
  };

  const getDeviceIcon = (deviceType, connected) => {
    const opacity = connected ? 1 : 0.3;
    const iconMap = {
      headphones: 'HDPH',
      speaker: 'SPKR', 
      mouse: 'MOUSE',
      keyboard: 'KYBD',
      gamepad: 'CTRL',
      unknown: 'DEV'
    };
    
    return (
      <span style={{ opacity, fontSize: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
        {iconMap[deviceType] || iconMap.unknown}
      </span>
    );
  };

  const renderVolumeVisualizer = (volume) => {
    const bars = 20;
    const filledBars = Math.floor((volume / 100) * bars);
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'end', 
        gap: '2px', 
        height: '40px',
        justifyContent: 'center',
        marginTop: '1rem'
      }}>
        {Array.from({ length: bars }, (_, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: `${(i + 1) * 2}px`,
              backgroundColor: i < filledBars ? getVolumeColor(volume) : 'var(--gray)',
              borderRadius: '2px 2px 0 0',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={className} style={{ color: 'var(--orange)', textAlign: 'center', padding: '2rem' }}>
        <div>CONNECTING TO AUDIO SYSTEMS...</div>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          Initializing system audio interface
        </div>
      </div>
    );
  }

  if (error && !audioData) {
    return (
      <div className={className} style={{ color: 'var(--red)', textAlign: 'center', padding: '2rem' }}>
        <div>AUDIO SYSTEM ERROR</div>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--orange)' }}>
          {error}
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--gray)' }}>
          Please ensure Electron environment is available
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ color: 'var(--font-color)' }}>
      <style>{`
        .audio-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .audio-panel {
          background: rgba(0, 0, 0, 0.3);
          border-left: 4px solid var(--orange);
          padding: 1rem;
          border-radius: 0 8px 0 0;
          position: relative;
        }
        .audio-panel h3 {
          color: var(--orange);
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          border-bottom: 1px solid var(--orange);
          padding-bottom: 0.5rem;
          text-align: center;
        }
        .master-volume-container {
          grid-column: 1 / -1;
          text-align: center;
          background: rgba(255, 153, 0, 0.1);
          border: 2px solid var(--orange);
          border-radius: 0 12px 0 0;
          padding: 2rem;
          margin-bottom: 1rem;
        }
        .master-volume-title {
          color: var(--orange);
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
          text-shadow: 0 0 10px rgba(255, 153, 0, 0.5);
        }
        .volume-slider-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .master-volume-slider {
          width: 300px;
          height: 40px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 20px;
          outline: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .master-volume-slider:hover {
          box-shadow: 0 0 15px rgba(255, 153, 0, 0.3);
        }
        .master-volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(45deg, var(--orange), var(--butterscotch));
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 153, 0, 0.5);
          transition: all 0.3s ease;
        }
        .master-volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 20px rgba(255, 153, 0, 0.8);
        }
        .master-volume-slider::-moz-range-thumb {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(45deg, var(--orange), var(--butterscotch));
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 153, 0, 0.5);
        }
        .volume-display {
          color: var(--orange);
          font-family: monospace;
          font-size: 2rem;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255, 153, 0, 0.5);
          min-width: 80px;
        }
        .bluetooth-device {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 153, 0, 0.3);
          border-radius: 0 6px 0 0;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .bluetooth-device:hover {
          border-color: var(--orange);
          background: rgba(255, 153, 0, 0.1);
        }
        .bluetooth-device.connected {
          border-color: var(--green);
          background: rgba(0, 255, 0, 0.05);
        }
        .bluetooth-device.disconnected {
          opacity: 0.6;
          border-color: var(--gray);
        }
        .device-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .device-name {
          color: var(--space-white);
          font-weight: bold;
          font-size: 1rem;
        }
        .device-name.connected {
          color: var(--green);
        }
        .connection-button {
          background: transparent;
          border: 1px solid var(--orange);
          color: var(--orange);
          padding: 0.3rem 0.6rem;
          border-radius: 0 4px 0 0;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.7rem;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        .connection-button:hover {
          background: rgba(255, 153, 0, 0.2);
        }
        .connection-button.connected {
          border-color: var(--red);
          color: var(--red);
        }
        .connection-button.connected:hover {
          background: rgba(255, 0, 0, 0.2);
        }
        .device-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          font-size: 0.8rem;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .stat-label {
          color: var(--orange);
          font-size: 0.7rem;
          margin-bottom: 0.25rem;
        }
        .stat-value {
          color: var(--space-white);
          font-weight: bold;
        }
        .battery-bar {
          width: 100%;
          height: 6px;
          background: var(--gray);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        .battery-fill {
          height: 100%;
          border-radius: 3px;
          transition: all 0.3s ease;
        }
        .status-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 0.8rem;
          color: var(--orange);
        }
        .updating {
          color: var(--butterscotch);
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .no-devices {
          text-align: center;
          color: var(--gray);
          padding: 2rem;
          font-style: italic;
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .panel-title {
          color: var(--orange);
          margin: 0;
          font-size: 1.1rem;
          border-bottom: 1px solid var(--orange);
          padding-bottom: 0.5rem;
          flex: 1;
        }
        .refresh-button {
          background: transparent;
          border: 1px solid var(--orange);
          color: var(--orange);
          padding: 0.5rem 1rem;
          border-radius: 0 6px 0 0;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: bold;
          transition: all 0.3s ease;
          margin-left: 1rem;
          min-width: 100px;
        }
        .refresh-button:hover {
          background: rgba(255, 153, 0, 0.2);
          box-shadow: 0 0 10px rgba(255, 153, 0, 0.3);
        }
        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .refresh-button.refreshing {
          color: var(--butterscotch);
          border-color: var(--butterscotch);
          animation: pulse 1s infinite;
        }
      `}</style>

      {/* Status Indicator */}
      <div className="status-indicator">
        {error && <span style={{ color: 'var(--red)' }}>ERROR: {error}</span>}
        {updatingVolume && <span className="updating">UPDATING VOLUME...</span>}
        {refreshingBluetooth && <span className="updating">SCANNING BLUETOOTH...</span>}
        {lastUpdate && !error && !updatingVolume && !refreshingBluetooth && (
          <span>LAST UPDATE: {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>

      <div className="audio-container">
        {/* Master Volume Control */}
        {audioData && typeof audioData.masterVolume !== 'undefined' ? (
          <div className="master-volume-container">
            <div className="master-volume-title">MASTER VOLUME CONTROL</div>
            
            <div className="volume-slider-container">
              <span style={{ color: 'var(--orange)', fontSize: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>MIN</span>
              <input
                type="range"
                min="0"
                max="100"
                value={audioData.masterVolume}
                onChange={(e) => setMasterVolume(parseInt(e.target.value))}
                className="master-volume-slider"
              />
              <span style={{ color: 'var(--orange)', fontSize: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>MAX</span>
            </div>
            
            <div className="volume-display">{audioData.masterVolume}%</div>
            
            {/* Volume Visualizer */}
            {renderVolumeVisualizer(audioData.masterVolume)}
          </div>
        ) : (
          <div className="master-volume-container">
            <div style={{ color: 'var(--red)', textAlign: 'center', padding: '2rem' }}>
              MASTER VOLUME UNAVAILABLE
              <div style={{ fontSize: '0.8rem', color: 'var(--orange)', marginTop: '0.5rem' }}>
                System audio interface not accessible
              </div>
            </div>
          </div>
        )}

        {/* Bluetooth Devices */}
        <div className="audio-panel">
          <div className="panel-header">
            <h3 className="panel-title">BLUETOOTH DEVICES</h3>
            <button
              onClick={refreshBluetoothDevices}
              disabled={refreshingBluetooth}
              className={`refresh-button ${refreshingBluetooth ? 'refreshing' : ''}`}
            >
              {refreshingBluetooth ? 'SCANNING...' : 'REFRESH'}
            </button>
          </div>
          {audioData && audioData.bluetoothDevices && audioData.bluetoothDevices.length > 0 ? (
            audioData.bluetoothDevices.map((device, index) => (
              <div 
                key={index} 
                className={`bluetooth-device ${device.connected ? 'connected' : 'disconnected'}`}
                onClick={() => toggleBluetoothDevice(device.name)}
              >
                <div className="device-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getDeviceIcon(device.deviceType, device.connected)}
                    <div className={`device-name ${device.connected ? 'connected' : ''}`}>
                      {device.name}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBluetoothDevice(device.name);
                    }}
                    className={`connection-button ${device.connected ? 'connected' : ''}`}
                  >
                    {device.connected ? 'DISCONNECT' : 'CONNECT'}
                  </button>
                </div>
                
                <div className="device-stats">
                  <div className="stat-item">
                    <div className="stat-label">TYPE</div>
                    <div className="stat-value">{device.deviceType.toUpperCase()}</div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-label">BATTERY</div>
                    <div 
                      className="stat-value" 
                      style={{ color: getBatteryColor(device.batteryLevel) }}
                    >
                      {device.batteryLevel ? `${device.batteryLevel}%` : 'N/A'}
                    </div>
                    {device.batteryLevel && (
                      <div className="battery-bar">
                        <div 
                          className="battery-fill"
                          style={{ 
                            width: `${device.batteryLevel}%`,
                            backgroundColor: getBatteryColor(device.batteryLevel)
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-devices">
              No Bluetooth devices found<br/>
              <small>Ensure Bluetooth is enabled and devices are paired in Windows Settings</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioControl;