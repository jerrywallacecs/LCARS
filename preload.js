const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getSystemInfoLight: () => ipcRenderer.invoke('get-system-info-light'),
  getGPUPerformance: () => ipcRenderer.invoke('get-gpu-performance'),
  getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
  getWifiNetworks: () => ipcRenderer.invoke('get-wifi-networks'),
  checkInternetConnectivity: () => ipcRenderer.invoke('check-internet-connectivity'),
  exitApp: () => ipcRenderer.invoke('exit-app'),
  
  // Terminal APIs
  createTerminalSession: () => ipcRenderer.invoke('create-terminal-session'),
  executeTerminalCommand: (sessionId, command) => ipcRenderer.invoke('execute-terminal-command', sessionId, command),
  getTerminalHistory: (sessionId) => ipcRenderer.invoke('get-terminal-history', sessionId),
  closeTerminalSession: (sessionId) => ipcRenderer.invoke('close-terminal-session', sessionId),
  onTerminalOutput: (callback) => ipcRenderer.on('terminal-output', callback),
  removeTerminalOutputListener: (callback) => ipcRenderer.removeListener('terminal-output', callback),
  
  // Audio APIs
  getAudioInfo: () => ipcRenderer.invoke('get-audio-info'),
  setMasterVolume: (volume) => ipcRenderer.invoke('set-master-volume', volume),
  setDeviceVolume: (deviceName, volume) => ipcRenderer.invoke('set-device-volume', deviceName, volume),
  toggleDeviceMute: (deviceName) => ipcRenderer.invoke('toggle-device-mute', deviceName),
  toggleBluetoothDevice: (deviceName) => ipcRenderer.invoke('toggle-bluetooth-device', deviceName),
  
  // File System APIs
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  createFile: (filePath) => ipcRenderer.invoke('create-file', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  deleteDirectory: (dirPath) => ipcRenderer.invoke('delete-directory', dirPath),
  renameItem: (oldPath, newPath) => ipcRenderer.invoke('rename-item', oldPath, newPath),
  getItemProperties: (itemPath) => ipcRenderer.invoke('get-item-properties', itemPath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  copyToClipboard: (filePath) => ipcRenderer.invoke('copy-to-clipboard', filePath),
  pasteFromClipboard: (destPath) => ipcRenderer.invoke('paste-from-clipboard', destPath),
  
  isElectron: true
});
