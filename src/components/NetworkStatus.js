import React, { useState, useEffect } from 'react';

const NetworkStatus = () => {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('CHECKING...');
  const [ipAddress, setIpAddress] = useState('Loading...');
  const [dnsServers, setDnsServers] = useState('Loading...');
  const [wifiNetworks, setWifiNetworks] = useState([]);
  const [wifiLoading, setWifiLoading] = useState(false);

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        const networkInfo = await window.electronAPI.getNetworkInfo();
        
        // Filter out virtual IPs like the original code
        const realIPs = networkInfo.ipAddresses.filter(ip => {
          const addr = ip.address;
          return !addr.startsWith('127.') &&           // Loopback
                 !addr.startsWith('169.254.') &&       // APIPA
                 !addr.startsWith('192.168.229.') &&   // VMware virtual adapters
                 !addr.startsWith('192.168.188.') &&   // VirtualBox/other virtual adapters
                 !addr.startsWith('10.0.75.') &&       // Hyper-V virtual adapters
                 !addr.startsWith('172.16.') &&        // Docker/container networks (partial range)
                 addr !== '::1' &&                     // IPv6 loopback
                 !addr.startsWith('fe80:');            // IPv6 link-local
        });

        const ip = realIPs.length > 0 ? realIPs.map(i => i.address) : ['No Real Network'];
        const dns = networkInfo.dns.length ? networkInfo.dns.join(', ') : 'No DNS';
        
        // Check for real network connectivity using filtered IPs
        const hasRealIP = realIPs.length > 0 && realIPs.some(ip => 
          ip.address !== 'No Real Network'
        );
        const hasRealDNS = dns !== 'DISCONNECTED' && dns !== 'No DNS';
        
        const isConnected = hasRealIP && hasRealDNS;
        
        setConnectionStatus(isConnected ? 'CONNECTED' : 'DISCONNECTED');
        setIpAddress(ip.join(', '));
        setDnsServers(dns);
        setNetworkData(networkInfo);
      } catch (error) {
        console.error('Network data fetch error:', error);
        setConnectionStatus('ERROR');
        setIpAddress('Failed to retrieve');
        setDnsServers('Failed to retrieve');
      } finally {
        setLoading(false);
      }
    };

    const fetchWifiNetworks = async () => {
      if (window.electronAPI?.getWifiNetworks) {
        try {
          setWifiLoading(true);
          console.log('Fetching WiFi networks...');
          const networks = await window.electronAPI.getWifiNetworks();
          console.log('WiFi networks received:', networks);
          setWifiNetworks(networks || []);
        } catch (error) {
          console.error('WiFi scan error:', error);
          setWifiNetworks([]);
        } finally {
          setWifiLoading(false);
        }
      } else {
        console.warn('getWifiNetworks API not available');
      }
    };

    fetchNetworkData();
    fetchWifiNetworks();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNetworkData();
      fetchWifiNetworks();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        color: 'var(--orange)', 
        fontSize: '14px',
        padding: '2rem',
        textAlign: 'center'
      }}>
        Loading network information...
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'row',
      gap: '1rem',
      padding: '0.5rem'
    }}>
      <style>{`
        .system-panel {
          background: linear-gradient(135deg, rgba(255,153,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
          border: 1px solid rgba(255,153,0,0.3);
          border-radius: 8px;
          padding: 1rem;
          overflow-y: auto;
        }
        
        .data-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          padding: 0.25rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .data-label {
          color: var(--orange);
          font-weight: bold;
          flex: 1;
        }
        
        .data-value {
          color: var(--font-color);
          flex: 1;
          text-align: right;
        }
      `}</style>

      {/* Network Status Panel */}
      <div className="system-panel" style={{ flex: '0 0 40%' }}>
        <h2 style={{ color: 'var(--h2-color)', marginBottom: '1rem', marginTop: 0 }}>
          NETWORK STATUS
        </h2>
        
        <div className="data-row">
          <span className="data-label">Connection Status:</span>
          <span className="data-value" style={{ 
            color: connectionStatus === 'CONNECTED' ? 'var(--green)' : 
                   connectionStatus === 'ERROR' ? 'var(--red)' : 'var(--orange)'
          }}>
            {connectionStatus}
          </span>
        </div>
        
        <div className="data-row">
          <span className="data-label">IP Address:</span>
          <span className="data-value">{ipAddress}</span>
        </div>
        
        <div className="data-row">
          <span className="data-label">Router IP:</span>
          <span className="data-value">{dnsServers}</span>
        </div>
      </div>

      {/* WiFi Networks Panel */}
      <div className="system-panel" style={{ flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{ color: 'var(--h2-color)', margin: 0 }}>
            AVAILABLE NETWORKS
          </h2>
          {wifiLoading && (
            <span style={{ fontSize: '12px', color: 'var(--orange)' }}>
              Scanning...
            </span>
          )}
        </div>
        
        {wifiNetworks.length > 0 ? (
          wifiNetworks.map((network, index) => (
            <div key={index} className="data-row">
              <span className="data-label">{network.ssid}</span>
              <span className="data-value" style={{ 
                color: network.security === 'Open' ? 'var(--red)' : 'var(--green)'
              }}>
                {network.security}
              </span>
            </div>
          ))
        ) : (
          <div style={{ 
            color: 'var(--text-muted)', 
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '2rem'
          }}>
            {wifiLoading ? 'Scanning for networks...' : 'No networks found'}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;