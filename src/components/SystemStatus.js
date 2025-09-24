import React, { useState, useEffect } from 'react';
import './SystemStatus.css';

const SystemStatus = () => {
  const [systems, setSystems] = useState({
    warpDrive: { status: 'ONLINE', efficiency: 95 },
    shields: { status: 'ONLINE', efficiency: 87 },
    weapons: { status: 'STANDBY', efficiency: 92 },
    lifSupport: { status: 'ONLINE', efficiency: 99 },
    sensors: { status: 'ONLINE', efficiency: 94 },
    communications: { status: 'ONLINE', efficiency: 88 },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSystems(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          // Randomly fluctuate efficiency
          updated[key].efficiency = Math.max(75, 
            Math.min(100, updated[key].efficiency + (Math.random() - 0.5) * 4)
          );
          
          // Occasionally change status
          if (Math.random() < 0.01) {
            const statuses = ['ONLINE', 'STANDBY', 'MAINTENANCE'];
            updated[key].status = statuses[Math.floor(Math.random() * statuses.length)];
          }
        });
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ONLINE': return '#00ff00';
      case 'STANDBY': return '#ffff00';
      case 'MAINTENANCE': return '#ff9900';
      case 'OFFLINE': return '#ff0000';
      default: return '#ff9900';
    }
  };

  return (
    <div className="system-status">
      <div className="status-header">SYSTEM STATUS</div>
      <div className="status-grid">
        {Object.entries(systems).map(([key, system]) => (
          <div key={key} className="status-item">
            <div className="system-name">
              {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
            </div>
            <div 
              className="system-status-indicator"
              style={{ color: getStatusColor(system.status) }}
            >
              {system.status}
            </div>
            <div className="efficiency-bar">
              <div 
                className="efficiency-fill"
                style={{ width: `${system.efficiency}%` }}
              ></div>
            </div>
            <div className="efficiency-text">{Math.round(system.efficiency)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemStatus;