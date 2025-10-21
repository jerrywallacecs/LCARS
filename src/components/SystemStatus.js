import React, { useState, useEffect } from 'react';
import LCARSDataCascade from './LCARSDataCascade';

const SystemStatus = ({ className = '' }) => {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchSystemInfo = async (isInitial = false) => {
      try {
        if (!isInitial) setUpdating(true);
        
        if (window.electronAPI) {
          // For initial load, get all data
          // For updates, get only dynamic data. Not really sure if this working. i'll do more testing later.
          const data = isInitial 
            ? await window.electronAPI.getSystemInfo()
            : await window.electronAPI.getSystemInfoLight();
          
          if (isInitial) {
            setSystemData(data);
          } else {
            // Only update dynamic fields. I think this is bad and probs don't need to get all of the data over and over. 
            // Should maybe only getting the usage data like curr cpu data and allat. Can change later.
            setSystemData(prev => ({
              ...prev,
              cpu: { ...prev.cpu, usage: data.cpu.usage, temperature: data.cpu.temperature },
              memory: { ...prev.memory, ...data.memory },
              storage: { ...prev.storage, filesystem: data.storage.filesystem }
            }));
          }
          setError(null);
          setLastUpdate(new Date());
        } else {
          // Fallback for web version, ehehheheheheh dont run on web or else 
          setSystemData(getMockSystemData());
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Error fetching system info:', err);
        setError(err.message);
        if (isInitial) {
          setSystemData(getMockSystemData());
          setLastUpdate(new Date());
        }
      } finally {
        if (isInitial) {
          setLoading(false);
        }
        setUpdating(false);
      }
    };

    // Initial fetch for pc data
    fetchSystemInfo(true);

    // Update only dynamic data every 30 seconds (much less frequent)
    // I found the app will freeze if we do it too often. Thumbs up emoji. 
    const interval = setInterval(() => fetchSystemInfo(false), 30000);

    return () => clearInterval(interval);
  }, []);

  // We dont' really need this but it's useful for the web version ig. 
  // If we wanted to dumb the app down there is a ton of things like this that we could remove.
  // Realy would like to rid of all of this and maybe just have it say "Sys info unavailable" or something related to the web version.
  const getMockSystemData = () => {
    const mockData = {
      cpu: {
        brand: 'Intel(R) Core(TM) i7-13700K CPU @ 3.40GHz',
        cores: 16,
        physicalCores: 8,
        speed: 3.4,
        speedMax: 5.4,
        usage: Math.random() * 100,
        temperature: Math.floor(Math.random() * 20) + 50, // 50-70°C
        manufacturer: 'Intel',
        family: 'Core i7'
      },
      memory: {
        total: 32 * 1024 * 1024 * 1024, // 32GB
        used: (16 + Math.random() * 8) * 1024 * 1024 * 1024, // 16-24GB used
        free: 0,
        percentage: 0,
        swapTotal: 4 * 1024 * 1024 * 1024,
        swapUsed: 512 * 1024 * 1024
      },
      computer: {
        hostname: 'DESKTOP-' + Math.random().toString(36).substr(2, 7).toUpperCase(),
        platform: 'Windows',
        distro: 'Microsoft Windows',
        release: '11',
        arch: 'x64',
        uptime: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000), // Random uptime up to 7 days
        kernel: '10.0.22631',
        build: '22631'
      },
      storage: {
        filesystem: [
          {
            drive: 'C:',
            total: 1000 * 1024 * 1024 * 1024, // 1TB
            used: (600 + Math.random() * 200) * 1024 * 1024 * 1024, // 600-800GB used
            free: 0,
            percentage: 0
          },
          {
            drive: 'D:',
            total: 2000 * 1024 * 1024 * 1024, // 2TB
            used: (800 + Math.random() * 400) * 1024 * 1024 * 1024, // 800-1200GB used
            free: 0,
            percentage: 0
          }
        ]
      },
      graphics: {
        controllers: [
          {
            model: 'NVIDIA GeForce RTX 4080',
            vendor: 'NVIDIA Corporation',
            vram: 16384, // 16GB
            bus: 'PCIe',
            vramDynamic: false
          },
          {
            model: 'Intel(R) UHD Graphics 770',
            vendor: 'Intel Corporation',
            vram: 1024, // 1GB shared
            bus: 'Built-In',
            vramDynamic: true
          }
        ]
      },
      battery: {
        hasBattery: Math.random() > 0.7, // 30% chance of having battery (laptop)
        percent: Math.floor(Math.random() * 100),
        charging: Math.random() > 0.5,
        type: 'Li-ion'
      }
    };

    // Calculate derived values
    mockData.memory.free = mockData.memory.total - mockData.memory.used;
    mockData.memory.percentage = (mockData.memory.used / mockData.memory.total) * 100;

    mockData.storage.filesystem.forEach(disk => {
      disk.free = disk.total - disk.used;
      disk.percentage = (disk.used / disk.total) * 100;
    });

    return mockData;
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatUptime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getUsageColor = (percentage) => {
    if (percentage > 90) return 'var(--red)';
    if (percentage > 70) return 'var(--orange)';
    if (percentage > 50) return 'var(--butterscotch)';
    return 'var(--green)';
  };

  if (loading) {
    return (
      <div style={{ color: 'var(--orange)', textAlign: 'center', padding: '2rem' }}>
        <div>ACCESSING SYSTEM DATA...</div>
        <div style={{ marginTop: '1rem' }}>
          <LCARSDataCascade columns={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'var(--red)', textAlign: 'center', padding: '2rem' }}>
        <div>SYSTEM ACCESS ERROR</div>
        <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</div>
      </div>
    );
  }

  if (!systemData) return null;

  return (
    <div className={className} style={{ color: 'var(--font-color)' }}>
      <style>{`
        .system-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .system-panel {
          background: rgba(0, 0, 0, 0.3);
          border-left: 4px solid var(--orange);
          padding: 1rem;
          border-radius: 0 10px 0 0;
        }
        .system-panel h3 {
          color: var(--h3-color);
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          border-bottom: 1px solid var(--orange);
          padding-bottom: 0.5rem;
        }
        .data-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        .data-label {
          color: var(--orange);
          font-weight: bold;
        }
        .data-value {
          color: var(--space-white);
          font-family: monospace;
        }
        .usage-bar {
          width: 100%;
          height: 20px;
          background: var(--gray);
          border-radius: 10px;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        .usage-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
        .full-width {
          grid-column: 1 / -1;
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
      `}</style>

      {/* Status Indicator */}
      <div className="status-indicator">
        {updating && <span className="updating">⟲ UPDATING...</span>}
        {lastUpdate && !updating && (
          <span>LAST UPDATE: {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>

      <div className="system-grid">
        {/* CPU Information */}
        <div className="system-panel">
          <h3>PROCESSOR</h3>
          <div className="data-row">
            <span className="data-label">Model:</span>
            <span className="data-value">{systemData.cpu.brand}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Cores:</span>
            <span className="data-value">{systemData.cpu.cores} ({systemData.cpu.physicalCores} Physical)</span>
          </div>
          <div className="data-row">
            <span className="data-label">Speed:</span>
            <span className="data-value">{systemData.cpu.speed} GHz</span>
          </div>
          <div className="data-row">
            <span className="data-label">Usage:</span>
            <span className="data-value">{systemData.cpu.usage.toFixed(1)}%</span>
          </div>
          <div className="usage-bar">
            <div 
              className="usage-fill" 
              style={{ 
                width: `${systemData.cpu.usage}%`,
                backgroundColor: getUsageColor(systemData.cpu.usage)
              }}
            ></div>
          </div>
          {systemData.cpu.temperature !== 'N/A' && (
            <div className="data-row" style={{ marginTop: '0.5rem' }}>
              <span className="data-label">Temperature:</span>
              <span className="data-value">{systemData.cpu.temperature}°C</span>
            </div>
          )}
        </div>

        {/* Memory Information */}
        <div className="system-panel">
          <h3>MEMORY</h3>
          <div className="data-row">
            <span className="data-label">Total:</span>
            <span className="data-value">{formatBytes(systemData.memory.total)}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Used:</span>
            <span className="data-value">{formatBytes(systemData.memory.used)}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Free:</span>
            <span className="data-value">{formatBytes(systemData.memory.free)}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Usage:</span>
            <span className="data-value">{systemData.memory.percentage.toFixed(1)}%</span>
          </div>
          <div className="usage-bar">
            <div 
              className="usage-fill" 
              style={{ 
                width: `${systemData.memory.percentage}%`,
                backgroundColor: getUsageColor(systemData.memory.percentage)
              }}
            ></div>
          </div>
        </div>

        {/* Storage Information */}
        <div className="system-panel">
          <h3>STORAGE</h3>
          {systemData.storage.filesystem && systemData.storage.filesystem.map((disk, index) => (
            <div key={index} style={{ marginBottom: index < systemData.storage.filesystem.length - 1 ? '1rem' : '0' }}>
              <div className="data-row">
                <span className="data-label">Drive {disk.drive}:</span>
                <span className="data-value">{formatBytes(disk.free)} free of {formatBytes(disk.total)}</span>
              </div>
              <div className="usage-bar">
                <div 
                  className="usage-fill" 
                  style={{ 
                    width: `${disk.percentage}%`,
                    backgroundColor: getUsageColor(disk.percentage)
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Graphics Information 
        real data, */}
        <div className="system-panel">
          <h3>GRAPHICS</h3>
          {systemData.graphics.controllers && systemData.graphics.controllers.map((gpu, index) => (
            <div key={index}>
              <div className="data-row">
                <span className="data-label">GPU:</span>
                <span className="data-value">{gpu.model}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Vendor:</span>
                <span className="data-value">{gpu.vendor}</span>
              </div>
              {gpu.vram && (
                <div className="data-row">
                  <span className="data-label">VRAM:</span>
                  <span className="data-value">{formatBytes(gpu.vram * 1024 * 1024)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* System Information
        Real data type shi */}
        <div className="system-panel full-width">
          <h3>SYSTEM INFORMATION</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div className="data-row">
                <span className="data-label">Computer Name:</span>
                <span className="data-value">{systemData.computer.hostname}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Platform:</span>
                <span className="data-value">{systemData.computer.platform} {systemData.computer.release}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Architecture:</span>
                <span className="data-value">{systemData.computer.arch}</span>
              </div>
            </div>
            <div>
              <div className="data-row">
                <span className="data-label">Uptime:</span>
                <span className="data-value">{formatUptime(systemData.computer.uptime)}</span>
              </div>
              {systemData.battery && systemData.battery.hasBattery && (
                <>
                  <div className="data-row">
                    <span className="data-label">Battery:</span>
                    <span className="data-value">{systemData.battery.percent}%</span>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-fill" 
                      style={{ 
                        width: `${systemData.battery.percent}%`,
                        backgroundColor: systemData.battery.percent < 20 ? 'var(--red)' : 'var(--green)'
                      }}
                    ></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
