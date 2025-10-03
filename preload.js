const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getSystemInfoLight: () => ipcRenderer.invoke('get-system-info-light'),
  getGPUPerformance: () => ipcRenderer.invoke('get-gpu-performance'),
  exitApp: () => ipcRenderer.invoke('exit-app'),
  
  // Terminal APIs
  createTerminalSession: () => ipcRenderer.invoke('create-terminal-session'),
  executeTerminalCommand: (sessionId, command) => ipcRenderer.invoke('execute-terminal-command', sessionId, command),
  getTerminalHistory: (sessionId) => ipcRenderer.invoke('get-terminal-history', sessionId),
  closeTerminalSession: (sessionId) => ipcRenderer.invoke('close-terminal-session', sessionId),
  onTerminalOutput: (callback) => ipcRenderer.on('terminal-output', callback),
  removeTerminalOutputListener: (callback) => ipcRenderer.removeListener('terminal-output', callback),
  
  isElectron: true
});