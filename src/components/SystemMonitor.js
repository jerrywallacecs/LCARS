import { useState, useEffect } from 'react';

const SystemMonitor = () => {
  const [systemData, setSystemData] = useState({
    cpu: { usage: 0, brand: '', speed: '', cores: 0, temperature: 0 },
    memory: { total: 0, used: 0, free: 0, percentage: 0 },
    storage: { total: 0, used: 0, free: 0, percentage: 0 },
    computer: { hostname: '', platform: '', arch: '', uptime: 0 },
    network: { rx: 0, tx: 0 }
  });

  useEffect(() => {
    // yo make sure you know this is async and how it works. Data fetching and allat.
    const getSystemInfo = async () => {
      try {
        // Check if we're in Electron with access to system APIs , sample data if not.
        if (window.electronAPI) {
          const data = await window.electronAPI.getSystemInfo();
          
          // Add some calculated/simulated fields
          data.storage.free = data.storage.total - data.storage.used;
          data.storage.percentage = (data.storage.used / data.storage.total) * 100;
          
          setSystemData(data);
        } else {
          // Fallback mock data for browser
          const mockData = {
            cpu: { 
              usage: Math.random() * 100, 
              brand: 'Intel Core i7-12700K', 
              speed: '3.6 GHz', 
              cores: 12,
              temperature: 45 + Math.random() * 20
            },
            memory: { 
              total: 32 * 1024 * 1024 * 1024, // 32GB
              used: (16 + Math.random() * 8) * 1024 * 1024 * 1024,
              free: 0,
              percentage: 0
            },
            storage: { 
              total: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
              used: 1.2 * 1024 * 1024 * 1024 * 1024,
              free: 0,
              percentage: 0
            },
            computer: { 
              hostname: 'LCARS-WORKSTATION', 
              platform: 'Windows 11', 
              arch: 'x64',
              uptime: Date.now() - (Math.random() * 86400000 * 7) // Random uptime up to 7 days
            },
            network: { 
              rx: Math.random() * 1000000, 
              tx: Math.random() * 500000 
            }
          };

          // Calculate derived values
          mockData.memory.free = mockData.memory.total - mockData.memory.used;
          mockData.memory.percentage = (mockData.memory.used / mockData.memory.total) * 100;
          
          mockData.storage.free = mockData.storage.total - mockData.storage.used;
          mockData.storage.percentage = (mockData.storage.used / mockData.storage.total) * 100;

          setSystemData(mockData);
        }
      } catch (error) {
        console.error('Error getting system info:', error);
      }
    };

    getSystemInfo();
    const interval = setInterval(getSystemInfo, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (ms) => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${days}d ${hours}h ${minutes}m`;
  };

  return { systemData, formatBytes, formatUptime };
};

export default SystemMonitor;
