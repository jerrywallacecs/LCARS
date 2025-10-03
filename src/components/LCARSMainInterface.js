import React, { useState, useEffect } from 'react';
import SystemMonitor from './SystemMonitor';

const LCARSMainInterface = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { systemData, formatBytes, formatUptime } = SystemMonitor();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getStardate = (date) => {
    const base = (date.getFullYear() - 2000) * 1000;
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const decimal = (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400;
    return (base + dayOfYear + decimal).toFixed(2);
  };

  const generateBarGraph = (percentage) => {
    const bars = 20;
    const filledBars = Math.floor((percentage / 100) * bars);
    return '█'.repeat(filledBars) + '░'.repeat(bars - filledBars);
  };

  return (
    <div style={{ 
      height: '100vh', 
      background: '#000', 
      color: 'var(--orange)', 
      fontFamily: 'Antonio, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        height: '80px',
        background: 'linear-gradient(to right, var(--bluey), var(--orange))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        borderBottom: '4px solid var(--orange)'
      }}>
        {/* UFP Logo */}
        <div style={{ 
          width: '60px', 
          height: '60px', 
          background: 'var(--bluey)', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px'
        }}>
          ★
        </div>

        {/* Computer Time */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            background: 'var(--african-violet)', 
            color: 'black', 
            padding: '5px 15px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            COMPUTER TIME
          </div>
          <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold',
            color: 'var(--orange)',
            marginTop: '5px'
          }}>
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Date and Operations */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>
            {formatDate(currentTime)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--african-violet)' }}>
            Light Fog
          </div>
          <div style={{ 
            background: 'var(--orange)', 
            color: 'black', 
            padding: '2px 8px',
            fontSize: '10px',
            marginTop: '5px'
          }}>
            OPERATIONS PANEL
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        
        {/* Left Sidebar */}
        <div style={{ 
          width: '180px', 
          background: 'var(--african-violet)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {[
            'MASTER SYSTEMS DISPLAY',
            'ACCESS 247',
            'REFERENCE',
            'MAPS',
            'SHIP SYS',
            'ARCHIVE',
            'CURRENT UTILITIES',
            'MISC',
            'DOCUMENTS',
            'MISC',
            'PICTURES',
            'DOWNLOADS',
            'DOCUMENTS'
          ].map((item, index) => (
            <div key={index} style={{
              padding: '8px 15px',
              background: index === 0 ? 'var(--orange)' : 'var(--african-violet)',
              color: 'black',
              borderBottom: '2px solid black',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              {item}
            </div>
          ))}
        </div>

        {/* Main Panel */}
        <div style={{ flex: 1, padding: '20px', background: '#001' }}>
          
          {/* CPU Section */}
          <div style={{ 
            background: 'var(--orange)', 
            color: 'black', 
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '0 20px 0 0'
          }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>CORE UTILIZATION</h2>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>
              PROC RING USAGE
            </div>
            <div style={{ 
              background: 'black', 
              color: 'var(--orange)', 
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <div>CPU: {generateBarGraph(systemData.cpu.usage)} {systemData.cpu.usage.toFixed(1)}%</div>
              <div style={{ marginTop: '5px' }}>
                {systemData.cpu.brand} @ {systemData.cpu.speed} | {systemData.cpu.cores} cores
              </div>
              <div style={{ marginTop: '5px' }}>
                Temp: {systemData.cpu.temperature.toFixed(1)}°C
              </div>
            </div>
          </div>

          {/* Memory Section */}
          <div style={{ 
            background: 'var(--red)', 
            color: 'black', 
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '0 20px 0 0'
          }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>MEMORY</h2>
            <div style={{ 
              background: 'black', 
              color: 'var(--orange)', 
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <div>RAM: {generateBarGraph(systemData.memory.percentage)} {systemData.memory.percentage.toFixed(1)}%</div>
              <div style={{ marginTop: '5px' }}>
                Used: {formatBytes(systemData.memory.used)} | Free: {formatBytes(systemData.memory.free)}
              </div>
              <div style={{ marginTop: '5px' }}>
                Total: {formatBytes(systemData.memory.total)}
              </div>
            </div>
          </div>

          {/* Storage Section */}
          <div style={{ 
            background: 'var(--bluey)', 
            color: 'black', 
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '0 20px 0 0'
          }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>STORAGE</h2>
            <div style={{ 
              background: 'black', 
              color: 'var(--orange)', 
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <div>DISK: {generateBarGraph(systemData.storage.percentage)} {systemData.storage.percentage.toFixed(1)}%</div>
              <div style={{ marginTop: '5px' }}>
                Used: {formatBytes(systemData.storage.used)} | Free: {formatBytes(systemData.storage.free)}
              </div>
              <div style={{ marginTop: '5px' }}>
                Total: {formatBytes(systemData.storage.total)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width: '280px', background: 'var(--orange)', color: 'black' }}>
          <div style={{ 
            background: 'var(--red)', 
            padding: '10px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            COMPUTER INFORMATION
          </div>
          
          <div style={{ padding: '15px', fontSize: '12px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>COMPUTER NAME:</strong> {systemData.computer.hostname}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>FULL COMPUTER NAME:</strong> {systemData.computer.hostname}.local
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>COMPUTER DESCRIPTION:</strong> LCARS Workstation
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>WORKGROUP:</strong> STARFLEET
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>SYSTEM UPTIME:</strong> {formatUptime(Date.now() - systemData.computer.uptime)}
            </div>
            
            <div style={{ 
              background: 'var(--african-violet)', 
              padding: '10px',
              marginBottom: '10px'
            }}>
              <div><strong>NET INFO</strong></div>
              <div>RX: {formatBytes(systemData.network.rx)}</div>
              <div>TX: {formatBytes(systemData.network.tx)}</div>
            </div>

            <div style={{ 
              background: 'var(--bluey)', 
              padding: '10px',
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ 
                fontSize: '48px',
                color: 'var(--orange)',
                textAlign: 'center'
              }}>
                SHUTDOWN<br/>
                <div style={{ fontSize: '12px' }}>CLICK HERE</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '30px',
        background: 'var(--orange)',
        color: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        <div>STARDATE: {getStardate(currentTime)}</div>
        <div>DESKTOP</div>
      </div>
    </div>
  );
};

export default LCARSMainInterface;