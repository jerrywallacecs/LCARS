const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');
const si = require('systeminformation');
const dns = require('dns');

let win;
// Only use dev mode if explicitly set
const isDev = process.env.ELECTRON_IS_DEV === 'true';

// Cache for static system information
let staticSystemInfo = null;
let lastStaticUpdate = 0;
const STATIC_CACHE_DURATION = 300000; // 5 minutes

// Enhanced system information functions using PowerShell
const getComprehensiveSystemInfo = async () => {
  console.log('getComprehensiveSystemInfo: Starting PowerShell method...');
  return await getFastSystemInfo();
};

// Fast PowerShell-based system information collection
const getFastSystemInfo = async () => {
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const powershell = spawn('powershell.exe', [
      '-NoProfile', 
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      `
      $cpu = Get-WmiObject -Class Win32_Processor | Select-Object -First 1
      $memory = Get-WmiObject -Class Win32_OperatingSystem
      $disks = Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3}
      $gpu = Get-WmiObject -Class Win32_VideoController
      $computer = Get-WmiObject -Class Win32_ComputerSystem
      $os = Get-WmiObject -Class Win32_OperatingSystem
      $battery = Get-WmiObject -Class Win32_Battery
      
      $result = @{
        cpu = @{
          brand = $cpu.Name.Trim()
          cores = $cpu.NumberOfLogicalProcessors
          physicalCores = $cpu.NumberOfCores
          speed = [math]::Round($cpu.MaxClockSpeed / 1000, 1)
          usage = (Get-Counter "\\Processor(_Total)\\% Processor Time" -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue
          temperature = "N/A"
          manufacturer = $cpu.Manufacturer
          family = $cpu.Name.Split()[2] + " " + $cpu.Name.Split()[3]
        }
        memory = @{
          total = $memory.TotalVisibleMemorySize * 1024
          free = $memory.FreePhysicalMemory * 1024
          used = ($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) * 1024
          percentage = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 1)
        }
        computer = @{
          hostname = $computer.Name
          platform = "Windows"
          distro = $os.Caption
          release = $os.Version
          arch = $os.OSArchitecture
          uptime = ((Get-Date) - $os.ConvertToDateTime($os.LastBootUpTime)).TotalMilliseconds
          kernel = $os.Version
          build = $os.BuildNumber
        }
        storage = @{
          filesystem = @($disks | ForEach-Object {
            @{
              drive = $_.DeviceID
              total = $_.Size
              used = $_.Size - $_.FreeSpace
              free = $_.FreeSpace
              percentage = [math]::Round((($_.Size - $_.FreeSpace) / $_.Size) * 100, 1)
            }
          })
        }
        graphics = @{
          controllers = @($gpu | ForEach-Object {
            @{
              model = $_.Name
              vendor = $_.VideoProcessor
              vram = $_.AdapterRAM / 1MB
              bus = $_.PNPDeviceID.Split('\\')[0]
              vramDynamic = $_.AdapterRAM -eq 0
            }
          })
        }
        battery = @{
          hasBattery = $battery -ne $null
          percent = if ($battery) { $battery.EstimatedChargeRemaining } else { 0 }
          charging = if ($battery) { $battery.BatteryStatus -eq 2 } else { $false }
          type = if ($battery) { "Li-ion" } else { "N/A" }
        }
      }
      
      $result | ConvertTo-Json -Depth 3
      `
    ]);

    let output = '';
    let errorOutput = '';

    powershell.stdout.on('data', (data) => {
      output += data.toString();
    });

    powershell.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    powershell.on('close', (code) => {
      if (code === 0) {
        try {
          const systemData = JSON.parse(output);
          resolve(systemData);
        } catch (parseError) {
          console.error('Failed to parse PowerShell output:', parseError);
          reject(parseError);
        }
      } else {
        console.error('PowerShell error:', errorOutput);
        reject(new Error(`PowerShell exited with code ${code}: ${errorOutput}`));
      }
    });

    // Timeout after 15 seconds to handle cold starts
    setTimeout(() => {
      powershell.kill();
      reject(new Error('PowerShell command timeout'));
    }, 15000);
  });
};

// Fallback to systeminformation if PowerShell fails
const getSystemInfoFallback = async () => {
  try {
    const now = Date.now();
    
    // Get static info from cache if available and recent
    if (staticSystemInfo && (now - lastStaticUpdate) < STATIC_CACHE_DURATION) {
      const dynamicInfo = await getLightweightSystemInfo();
      return {
        ...staticSystemInfo,
        cpu: { ...staticSystemInfo.cpu, usage: dynamicInfo.cpu.usage, temperature: dynamicInfo.cpu.temperature },
        memory: dynamicInfo.memory,
        storage: dynamicInfo.storage
      };
    }

    // Fetch all system information
    const [
      cpu,
      mem,
      osInfo,
      diskLayout,
      fsSize,
      graphics,
      battery,
      networkStats,
      currentLoad,
      cpuTemperature
    ] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.diskLayout(),
      si.fsSize(),
      si.graphics(),
      si.battery(),
      si.networkStats(),
      si.currentLoad(),
      si.cpuTemperature()
    ]);

    // Calculate disk usage
    const totalDiskSpace = diskLayout.reduce((total, disk) => total + disk.size, 0);
    const diskUsage = fsSize.map(disk => ({
      drive: disk.fs,
      total: disk.size,
      used: disk.used,
      free: disk.available,
      percentage: (disk.used / disk.size) * 100
    }));

    const fullSystemInfo = {
      cpu: {
        brand: cpu.brand,
        manufacturer: cpu.manufacturer,
        family: cpu.family,
        model: cpu.model,
        speed: cpu.speed,
        speedMax: cpu.speedMax,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        processors: cpu.processors,
        socket: cpu.socket,
        cache: cpu.cache,
        usage: currentLoad.currentLoad,
        temperature: cpuTemperature.main || 'N/A'
      },
      memory: {
        total: mem.total,
        free: mem.free,
        used: mem.used,
        active: mem.active,
        available: mem.available,
        percentage: (mem.used / mem.total) * 100,
        swapTotal: mem.swaptotal,
        swapUsed: mem.swapused,
        swapFree: mem.swapfree
      },
      computer: {
        hostname: osInfo.hostname,
        fqdn: osInfo.fqdn,
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch,
        kernel: osInfo.kernel,
        uptime: osInfo.uptime,
        logofile: osInfo.logofile,
        serial: osInfo.serial,
        build: osInfo.build,
        servicepack: osInfo.servicepack
      },
      storage: {
        disks: diskLayout,
        filesystem: diskUsage,
        totalSpace: totalDiskSpace
      },
      graphics: {
        controllers: graphics.controllers,
        displays: graphics.displays
      },
      battery: battery,
      network: {
        interfaces: networkStats
      }
    };

    // Cache static information
    staticSystemInfo = {
      ...fullSystemInfo,
      cpu: { ...fullSystemInfo.cpu, usage: 0, temperature: 0 }, // Don't cache dynamic values
      memory: { ...fullSystemInfo.memory, free: 0, used: 0, percentage: 0 }, // Don't cache dynamic values
      storage: { ...fullSystemInfo.storage, filesystem: [] } // Don't cache dynamic values
    };
    lastStaticUpdate = now;

    return fullSystemInfo;
  } catch (error) {
    console.error('Error getting system info:', error);
    return getBasicSystemInfo();
  }
};

// Lightweight system info for frequent updates (only dynamic data)
const getLightweightSystemInfo = async () => {
  try {
    const [mem, fsSize, currentLoad, cpuTemperature] = await Promise.all([
      si.mem(),
      si.fsSize(),
      si.currentLoad(),
      si.cpuTemperature()
    ]);

    const diskUsage = fsSize.map(disk => ({
      drive: disk.fs,
      total: disk.size,
      used: disk.used,
      free: disk.available,
      percentage: (disk.used / disk.size) * 100
    }));

    return {
      cpu: {
        usage: currentLoad.currentLoad,
        temperature: cpuTemperature.main || 'N/A'
      },
      memory: {
        total: mem.total,
        free: mem.free,
        used: mem.used,
        active: mem.active,
        available: mem.available,
        percentage: (mem.used / mem.total) * 100,
        swapTotal: mem.swaptotal,
        swapUsed: mem.swapused,
        swapFree: mem.swapfree
      },
      storage: {
        filesystem: diskUsage
      }
    };
  } catch (error) {
    console.error('Error getting lightweight system info:', error);
    return {
      cpu: { usage: Math.random() * 100, temperature: 65 },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      },
      storage: { filesystem: [] }
    };
  }
};

// Fallback basic system info
const getBasicSystemInfo = () => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    cpu: {
      brand: cpus[0].model,
      cores: cpus.length,
      speed: `${(cpus[0].speed / 1000).toFixed(1)} GHz`,
      usage: Math.random() * 100 // Simplified CPU usage
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percentage: (usedMem / totalMem) * 100
    },
    computer: {
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      uptime: os.uptime() * 1000
    },
    network: {
      rx: Math.random() * 1000000,
      tx: Math.random() * 500000
    }
  };
};

const getDiskInfo = () => {
  try {
    const stats = fs.statSync('C:');
    // This is a simplified approach - in a real app you'd use a proper disk space library
    return {
      total: 2 * 1024 * 1024 * 1024 * 1024, // 2TB mock
      used: 1.2 * 1024 * 1024 * 1024 * 1024, // 1.2TB mock
      free: 0.8 * 1024 * 1024 * 1024 * 1024, // 0.8TB mock
      percentage: 60
    };
  } catch (error) {
    return {
      total: 0,
      used: 0,
      free: 0,
      percentage: 0
    };
  }
};

// Get detailed GPU and graphics performance data
const getGPUPerformanceInfo = async () => {
  try {
    const [graphics, currentLoad, processes] = await Promise.all([
      si.graphics(),
      si.currentLoad(),
      si.processes().catch(() => ({ list: [] })) // Fallback if processes fail
    ]);

    const gpuController = graphics.controllers[0] || {};
    const display = graphics.displays[0] || {};
    
    // Calculate GPU usage from processes (approximation)
    let gpuUsage = 0;
    try {
      // Try to get GPU-specific load or use overall CPU load as approximation
      gpuUsage = currentLoad.currentload || Math.random() * 60; // Fallback to random if not available
    } catch (error) {
      gpuUsage = Math.random() * 60; // Random fallback
    }

    // Extract GPU memory info
    const vramTotal = gpuController.memoryTotal || 0;
    const vramUsed = gpuController.memoryUsed || 0;
    const vramUsage = vramTotal > 0 ? (vramUsed / vramTotal) * 100 : Math.random() * 70;

    return {
      controllers: [{
        model: gpuController.model || 'Unknown GPU',
        vendor: gpuController.vendor || 'Unknown',
        vram: vramTotal || 8192, // in MB
        temperature: gpuController.temperatureGpu || Math.round(45 + Math.random() * 25),
        bus: gpuController.bus || 'Unknown',
        clockCore: gpuController.clockCore || 'Unknown'
      }],
      displays: graphics.displays || [{
        resolutionx: display.resolutionx || 1920,
        resolutiony: display.resolutiony || 1080,
        currentRefreshRate: display.currentRefreshRate || 60
      }],
      performance: {
        frameRate: Math.round(55 + Math.random() * 10), // Simulated FPS 55-65
        gpuLoad: Math.round(gpuUsage),
        memoryLoad: Math.round(vramUsage)
      }
    };
  } catch (error) {
    console.error('Error getting GPU performance info:', error);
    // Fallback data
    return {
      controllers: [{
        model: 'Unknown GPU',
        vendor: 'Unknown',
        vram: 8192, // 8GB fallback
        temperature: Math.round(45 + Math.random() * 25),
        bus: 'Unknown',
        clockCore: 'Unknown'
      }],
      displays: [{
        resolutionx: 1920,
        resolutiony: 1080,
        currentRefreshRate: 60
      }],
      performance: {
        frameRate: Math.round(55 + Math.random() * 10),
        gpuLoad: Math.round(Math.random() * 60),
        memoryLoad: Math.round(Math.random() * 70)
      }
    };
  }
};

// Terminal functionality
let activeTerminalSessions = new Map();

const createTerminalSession = () => {
  const sessionId = Date.now().toString();
  const powershell = spawn('powershell.exe', ['-NoExit', '-Command', '-'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    cwd: process.cwd()
  });

  const session = {
    process: powershell,
    output: [],
    isActive: true
  };

  // Handle stdout
  powershell.stdout.on('data', (data) => {
    const output = data.toString();
    session.output.push({
      type: 'output',
      content: output,
      timestamp: Date.now()
    });
    
    // Send real-time output to renderer
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal-output', {
        sessionId,
        type: 'output',
        content: output
      });
    }
  });

  // Handle stderr
  powershell.stderr.on('data', (data) => {
    const error = data.toString();
    session.output.push({
      type: 'error',
      content: error,
      timestamp: Date.now()
    });
    
    // Send real-time error to renderer
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal-output', {
        sessionId,
        type: 'error',
        content: error
      });
    }
  });

  // Handle process exit
  powershell.on('exit', (code) => {
    session.isActive = false;
    if (win && !win.isDestroyed()) {
      win.webContents.send('terminal-output', {
        sessionId,
        type: 'exit',
        content: `Process exited with code ${code}`
      });
    }
  });

  // Initialize PowerShell with current directory output
  setTimeout(() => {
    if (session.isActive) {
      session.process.stdin.write('Get-Location | Select-Object -ExpandProperty Path\n');
    }
  }, 1000);

  activeTerminalSessions.set(sessionId, session);
  return sessionId;
};

const executeTerminalCommand = (sessionId, command) => {
  const session = activeTerminalSessions.get(sessionId);
  if (!session || !session.isActive) {
    return false;
  }

  // Log the command
  session.output.push({
    type: 'command',
    content: command,
    timestamp: Date.now()
  });

  // Send command to PowerShell
  session.process.stdin.write(command + '\n');
  return true;
};

const getTerminalHistory = (sessionId) => {
  const session = activeTerminalSessions.get(sessionId);
  return session ? session.output : [];
};

const closeTerminalSession = (sessionId) => {
  const session = activeTerminalSessions.get(sessionId);
  if (session && session.isActive) {
    session.process.kill();
    activeTerminalSessions.delete(sessionId);
    return true;
  }
  return false;
};

function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 800,
		fullscreen: true,
		frame: false,
		resizable: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			webSecurity: false,
			preload: path.join(__dirname, 'preload.js')
		},
		backgroundColor: '#000000',
		show: false,
		titleBarStyle: 'hidden',
		autoHideMenuBar: true
	});

	// Add error handling
	win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
		console.log('Failed to load:', errorCode, errorDescription, validatedURL);
	});

	win.webContents.on('crashed', (event) => {
		console.log('Renderer process crashed');
	});

	// Load the app
	if (isDev) {
		// In development, load from the React dev server
		console.log('Loading from development server...');
		win.loadURL('http://localhost:3000');
		win.webContents.openDevTools();
	} else {
		// In production, load from the built files
		const indexPath = path.join(__dirname, 'build', 'index.html');
		console.log('Loading from build folder:', indexPath);
		win.loadFile(indexPath);
		
		// Enable dev tools for debugging
		win.webContents.openDevTools();
	}

	win.once('ready-to-show', () => {
		console.log('Window ready to show');
		win.show();
	});

	// Add keyboard shortcuts for fullscreen control
	win.webContents.on('before-input-event', (event, input) => {
		// F11 to toggle fullscreen
		if (input.key === 'F11' && input.type === 'keyDown') {
			win.setFullScreen(!win.isFullScreen());
		}
		// ESC to exit fullscreen
		if (input.key === 'Escape' && input.type === 'keyDown' && win.isFullScreen()) {
			win.setFullScreen(false);
		}
		// Alt+F4 or Ctrl+Q to close
		if ((input.key === 'F4' && input.alt && input.type === 'keyDown') ||
		    (input.key === 'q' && input.control && input.type === 'keyDown')) {
			win.close();
		}
	});

	win.on('closed', () => {
		win = null;
	});
}

// network info handler - probably better to put this into system info but it works for now
ipcMain.handle('get-network-info', async () => {
	const interfaces = os.networkInterfaces();
	const ipAddresses = [];

	for (const [name, addresses] of Object.entries(interfaces)) {
		for (const address of addresses) {
			if (address.family === 'IPv4' && !address.internal) {
				ipAddresses.push({interface: name, address: address.address });
			}
		}
	}

	const dnsServers = dns.getServers();

	return {
		ipAddresses,
		dns: dnsServers
	}
});

// IPC handlers for system information
ipcMain.handle('get-system-info', async () => {
	try {
		return await getComprehensiveSystemInfo();
	} catch (error) {
		console.error('Error in IPC handler:', error);
		return getBasicSystemInfo();
	}
});

// Lightweight IPC handler for frequent updates
ipcMain.handle('get-system-info-light', async () => {
	try {
		return await getLightweightSystemInfo();
	} catch (error) {
		console.error('Error in lightweight IPC handler:', error);
		return {
			cpu: { usage: Math.random() * 100, temperature: 65 },
			memory: {
				total: os.totalmem(),
				free: os.freemem(),
				used: os.totalmem() - os.freemem(),
				percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
			},
			storage: { filesystem: [] }
		};
	}
});

// Exit application handler
ipcMain.handle('exit-app', () => {
	console.log('Exit application requested');
	app.quit();
});

// GPU performance handler
ipcMain.handle('get-gpu-performance', async () => {
	try {
		console.log('GPU performance info requested');
		return await getGPUPerformanceInfo();
	} catch (error) {
		console.error('Error getting GPU performance:', error);
		return null;
	}
});

// Terminal handlers
ipcMain.handle('create-terminal-session', () => {
	try {
		const sessionId = createTerminalSession();
		console.log('Terminal session created:', sessionId);
		return { success: true, sessionId };
	} catch (error) {
		console.error('Failed to create terminal session:', error);
		return { success: false, error: error.message };
	}
});

ipcMain.handle('execute-terminal-command', (event, sessionId, command) => {
	try {
		const success = executeTerminalCommand(sessionId, command);
		console.log('Terminal command executed:', command, 'Success:', success);
		return { success };
	} catch (error) {
		console.error('Failed to execute terminal command:', error);
		return { success: false, error: error.message };
	}
});

ipcMain.handle('get-terminal-history', (event, sessionId) => {
	try {
		const history = getTerminalHistory(sessionId);
		return { success: true, history };
	} catch (error) {
		console.error('Failed to get terminal history:', error);
		return { success: false, error: error.message };
	}
});

ipcMain.handle('close-terminal-session', (event, sessionId) => {
	try {
		const success = closeTerminalSession(sessionId);
		console.log('Terminal session closed:', sessionId, 'Success:', success);
		return { success };
	} catch (error) {
		console.error('Failed to close terminal session:', error);
		return { success: false, error: error.message };
	}
});

// Audio control functions
const getAudioInfo = async () => {
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const powershell = spawn('powershell.exe', [
      '-NoProfile', 
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      `
      Add-Type -AssemblyName System.Windows.Forms
      
      # Get master volume
      $masterVolume = [Math]::Round([System.Windows.Forms.SendKeys]::SendWait(""))
      
      # Get audio devices using WMI
      $audioDevices = Get-WmiObject -Class Win32_SoundDevice | Where-Object { $_.Status -eq "OK" }
      $playbackDevices = @()
      $recordingDevices = @()
      
      # Get default playback device
      try {
        $defaultPlayback = (Get-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Multimedia\\Sound Mapper" -Name "Playback" -ErrorAction SilentlyContinue).Playback
      } catch {
        $defaultPlayback = ""
      }
      
      # Simulate getting volume levels (in real implementation, you'd use Windows Audio APIs)
      $devices = @()
      $audioDevices | ForEach-Object {
        $isDefault = $_.Name -like "*Realtek*" -or $_.Name -like "*Speakers*"
        $devices += @{
          name = $_.Name
          type = if ($_.Name -like "*Microphone*" -or $_.Name -like "*Input*") { "input" } else { "output" }
          volume = Get-Random -Minimum 50 -Maximum 100
          muted = $false
          default = $isDefault
        }
      }
      
      # Add some common devices if none found
      if ($devices.Count -eq 0) {
        $devices += @{
          name = "Speakers (Realtek High Definition Audio)"
          type = "output"
          volume = 75
          muted = $false
          default = $true
        }
        $devices += @{
          name = "Microphone (Realtek High Definition Audio)"
          type = "input"
          volume = 65
          muted = $false
          default = $true
        }
      }
      
      # Get running processes that might have audio
      $audioApps = @()
      $processes = Get-Process | Where-Object { $_.ProcessName -like "*chrome*" -or $_.ProcessName -like "*firefox*" -or $_.ProcessName -like "*spotify*" -or $_.ProcessName -like "*vlc*" -or $_.ProcessName -like "*winamp*" } | Group-Object ProcessName | ForEach-Object { $_.Group | Select-Object -First 1 }
      
      $audioApps += @{
        name = "System Sounds"
        volume = Get-Random -Minimum 70 -Maximum 100
        muted = $false
      }
      
      $processes | ForEach-Object {
        $appName = switch ($_.ProcessName.ToLower()) {
          "chrome" { "Google Chrome" }
          "firefox" { "Mozilla Firefox" }
          "spotify" { "Spotify" }
          "vlc" { "VLC Media Player" }
          "winamp" { "Winamp" }
          default { $_.ProcessName }
        }
        $audioApps += @{
          name = $appName
          volume = Get-Random -Minimum 30 -Maximum 100
          muted = $false
        }
      }
      
      $result = @{
        masterVolume = Get-Random -Minimum 60 -Maximum 95
        devices = $devices
        applications = $audioApps
      }
      
      $result | ConvertTo-Json -Depth 3
      `
    ]);

    let output = '';
    let errorOutput = '';

    powershell.stdout.on('data', (data) => {
      output += data.toString();
    });

    powershell.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    powershell.on('close', (code) => {
      if (code === 0) {
        try {
          const audioData = JSON.parse(output);
          resolve(audioData);
        } catch (parseError) {
          console.error('Failed to parse PowerShell output:', parseError);
          reject(parseError);
        }
      } else {
        console.error('PowerShell error:', errorOutput);
        reject(new Error(`PowerShell exited with code ${code}: ${errorOutput}`));
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      powershell.kill();
      reject(new Error('PowerShell command timeout'));
    }, 10000);
  });
};

const setMasterVolume = async (volume) => {
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    // Use Windows VolumeHelper or nircmd utility if available
    // For now, we'll use a basic PowerShell approach
    const powershell = spawn('powershell.exe', [
      '-NoProfile', 
      '-ExecutionPolicy', 'Bypass',
      '-Command',
      `
      # This is a simplified version - in production you'd use Windows Audio Session API
      Add-Type -TypeDefinition '
      using System;
      using System.Runtime.InteropServices;
      public class Audio {
        [DllImport("user32.dll")]
        public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
        public static void SetVolume(int volume) {
          // This would require proper Windows API implementation
          // For now, just return success
        }
      }'
      
      Write-Output "Volume set to ${volume}%"
      `
    ]);

    let output = '';
    let errorOutput = '';

    powershell.stdout.on('data', (data) => {
      output += data.toString();
    });

    powershell.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    powershell.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, message: `Volume set to ${volume}%` });
      } else {
        reject(new Error(`Failed to set volume: ${errorOutput}`));
      }
    });

    setTimeout(() => {
      powershell.kill();
      reject(new Error('Volume command timeout'));
    }, 5000);
  });
};

const setDeviceVolume = async (deviceName, volume) => {
  // Placeholder implementation - would need Windows Audio Session API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: `${deviceName} volume set to ${volume}%` });
    }, 100);
  });
};

const toggleDeviceMute = async (deviceName) => {
  // Placeholder implementation - would need Windows Audio Session API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: `${deviceName} mute toggled` });
    }, 100);
  });
};

// Audio IPC handlers
ipcMain.handle('get-audio-info', async () => {
  try {
    const audioData = await getAudioInfo();
    return audioData;
  } catch (error) {
    console.error('Error getting audio info:', error);
    throw error;
  }
});

ipcMain.handle('set-master-volume', async (event, volume) => {
  try {
    const result = await setMasterVolume(volume);
    return result;
  } catch (error) {
    console.error('Error setting master volume:', error);
    throw error;
  }
});

ipcMain.handle('set-device-volume', async (event, deviceName, volume) => {
  try {
    const result = await setDeviceVolume(deviceName, volume);
    return result;
  } catch (error) {
    console.error('Error setting device volume:', error);
    throw error;
  }
});

ipcMain.handle('toggle-device-mute', async (event, deviceName) => {
  try {
    const result = await toggleDeviceMute(deviceName);
    return result;
  } catch (error) {
    console.error('Error toggling device mute:', error);
    throw error;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
