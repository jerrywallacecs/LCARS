import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import LCARSPanel from './components/LCARSPanel';
import LCARSDataCascade from './components/LCARSDataCascade';
import LCARSNavigation from './components/LCARSNavigation';
import SystemStatus from './components/SystemStatus';
import NetworkStatus from './components/NetworkStatus';
import WarpCore from './components/WarpCore';
import AudioControl from './components/AudioControl';
import FileExplorer from './components/FileExplorer';
import NetworkAlert from './components/NetworkAlert';

function App() {
  //default stuf
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentView, setCurrentView] = useState('home');
  const [systemDataPreloaded, setSystemDataPreloaded] = useState(false);
  
  // System data state
  const [systemData, setSystemData] = useState(null);
  const [systemDataLoading, setSystemDataLoading] = useState(false);
  
  // Terminal state
  const [terminalSessionId, setTerminalSessionId] = useState(null);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('C:\\');
  
  // GPU performance state
  const [gpuData, setGpuData] = useState(null);
  const [gpuLoading, setGpuLoading] = useState(false);
  const [gpuDataPreloaded, setGpuDataPreloaded] = useState(false);
  
  // File Explorer state
  const [fileExplorerPreloaded, setFileExplorerPreloaded] = useState(false);
  const [fileExplorerLoading, setFileExplorerLoading] = useState(false);
  
  // Network state
  const [networkDataPreloaded, setNetworkDataPreloaded] = useState(false);
  const [networkLoading, setNetworkLoading] = useState(false);
  
  // Terminal state
  const [terminalPreloaded, setTerminalPreloaded] = useState(false);
  
  // Audio state
  const [audioPreloaded, setAudioPreloaded] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  
  // Simple network state for warning only
  const [isConnectedToInternet, setIsConnectedToInternet] = useState(true);
  
  // auto scroll ref
  const terminalRef = useRef(null);

  //tHIS is just to autoscroll as new output comes in the terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  //preload allat data for the system and any other stuff we need.
  useEffect(() => {
    const preloadSystemData = async () => {
      if (window.electronAPI && !systemDataPreloaded) {
        setSystemDataLoading(true);
        try {
          console.log('Preloading system data...');
          const startTime = Date.now();
          const data = await window.electronAPI.getSystemInfo();
          const endTime = Date.now();
          console.log(`System data preloaded successfully in ${endTime - startTime}ms`, data);
          setSystemData(data);
          setSystemDataPreloaded(true);
        } catch (error) {
          console.warn('Failed to preload system data:', error);
          setSystemData(null);
        } finally {
          setSystemDataLoading(false);
        }
      }
    };

    // Start preloading immediately when electronAPI is available
    if (window.electronAPI) {
      preloadSystemData();
    } else {
      // If electronAPI isn't ready yet, try again in 100ms
      const preloadTimer = setTimeout(() => {
        if (window.electronAPI) {
          preloadSystemData();
        }
      }, 100);
      return () => clearTimeout(preloadTimer);
    }
  }, [systemDataPreloaded]);

  // Preload all component data at startup
  useEffect(() => {
    const preloadAllComponents = async () => {
      if (!window.electronAPI) return;

      // Preload GPU data
      if (!gpuDataPreloaded) {
        setGpuLoading(true);
        try {
          console.log('Preloading GPU data...');
          const data = await window.electronAPI.getGPUPerformance();
          setGpuData(data);
          setGpuDataPreloaded(true);
          console.log('GPU data preloaded successfully');
        } catch (error) {
          console.warn('Failed to preload GPU data:', error);
        } finally {
          setGpuLoading(false);
        }
      }

      // Preload network data
      if (!networkDataPreloaded) {
        setNetworkLoading(true);
        try {
          console.log('Preloading network data...');
          await getNetwork(); // This already sets network status
          setNetworkDataPreloaded(true);
          console.log('Network data preloaded successfully');
        } catch (error) {
          console.warn('Failed to preload network data:', error);
        } finally {
          setNetworkLoading(false);
        }
      }

      // Preload terminal capability
      if (!terminalPreloaded) {
        try {
          console.log('Checking terminal capability...');
          // Just check if terminal API is available
          if (window.electronAPI.createTerminalSession) {
            setTerminalPreloaded(true);
            console.log('Terminal capability confirmed');
          }
        } catch (error) {
          console.warn('Terminal not available:', error);
        }
      }

      // Preload file explorer capability
      if (!fileExplorerPreloaded) {
        setFileExplorerLoading(true);
        try {
          console.log('Checking file explorer capability...');
          // Simulate file explorer check - you could add an actual API check here
          setTimeout(() => {
            setFileExplorerPreloaded(true);
            setFileExplorerLoading(false);
            console.log('File explorer capability confirmed');
          }, 500);
        } catch (error) {
          console.warn('File explorer not available:', error);
          setFileExplorerLoading(false);
        }
      }

      // Preload audio capability
      if (!audioPreloaded) {
        setAudioLoading(true);
        try {
          console.log('Checking audio capability...');
          // Check if audio elements exist
          const audioElement = document.getElementById('audio2');
          if (audioElement) {
            setAudioPreloaded(true);
            console.log('Audio capability confirmed');
          }
        } catch (error) {
          console.warn('Audio not available:', error);
        } finally {
          setAudioLoading(false);
        }
      }
    };

    // Start preloading after system data is done
    if (systemDataPreloaded && window.electronAPI) {
      setTimeout(preloadAllComponents, 100);
    }
  }, [systemDataPreloaded, gpuDataPreloaded, networkDataPreloaded, terminalPreloaded, fileExplorerPreloaded, audioPreloaded]);

  // TERMINAL FUNCTIONS
  const initializeTerminal = useCallback(async () => {
    if (!window.electronAPI || terminalSessionId) return;

    setTerminalLoading(true);
    try {
      const result = await window.electronAPI.createTerminalSession();
      if (result.success) {
        setTerminalSessionId(result.sessionId);
        setTerminalOutput([{
          type: 'system',
          content: 'LCARS Terminal v24.2 - Starfleet Command Interface\nCopyright (c) 2399 United Federation of Planets\nPowerShell Integration Active\n',
          timestamp: Date.now()
        }]);
        
        //this should get the current directory on init, 
        // may change this later to get just the C drive. Not sure how this will perform on others devices? Shall see 
        setTimeout(async () => {
          try {
            await window.electronAPI.executeTerminalCommand(result.sessionId, 'pwd');
          } catch (error) {
            console.log('Could not get initial directory');
          }
        }, 1000);
        
        //  real-time output listener for that dawg in the terminal
        window.electronAPI.onTerminalOutput((event, data) => {
          if (data.sessionId === result.sessionId) {
            const output = data.content;
            
            // um there may be a better way to do this. Regex came to mind first so thot I would try it and it worked. 
            if (data.type === 'output') {
              // full path
              const fullPathMatch = output.match(/^([A-Z]:\\[^\r\n]*?)[\r\n]*$/m);
              if (fullPathMatch) {
                const newPath = fullPathMatch[1].trim();
                if (newPath.length > 3) { // More than just "C:\" could change this like I said earlier.
                  setCurrentDirectory(newPath);
                }
              }
              
              // Also check for PowerShell location output format, not sure If i like this either, but seems to work.
              const psPathMatch = output.match(/Path\s*\r?\n-+\r?\n([A-Z]:\\[^\r\n]*)/);
              if (psPathMatch) {
                setCurrentDirectory(psPathMatch[1].trim());
              }
            }
            
            setTerminalOutput(prev => [...prev, {
              type: data.type,
              content: output,
              timestamp: Date.now()
            }]);
          }
        });
      } 
    } catch (error) { //error stuff yk
      console.error('Failed to initialize terminal:', error);
      setTerminalOutput([{
        type: 'error',
        content: 'Failed to initialize terminal session\n',
        timestamp: Date.now()
      }]);
    } finally {
      setTerminalLoading(false);
    }
  }, [terminalSessionId]);

  const executeCommand = async () => {
    if (!terminalSessionId || !terminalInput.trim()) return;

    const command = terminalInput.trim();
    setTerminalInput('');
    
    // made this similar to yaml scripts. Takes a script type and content. They are pr much just added together to get one command. Very useful 
    setTerminalOutput(prev => [...prev, {
      type: 'command',
      content: `PS ${currentDirectory}> ${command}\n`,
      timestamp: Date.now()
    }]);

    try {
      await window.electronAPI.executeTerminalCommand(terminalSessionId, command);
      
      // When commands are executed that would change the directory we should output the new directory I think.
      // This is not necessary but I found ti to be pleasing to thy eyes.
      if (command.toLowerCase().startsWith('cd') || command.toLowerCase().startsWith('set-location')) {
        setTimeout(async () => {
          try {
            await window.electronAPI.executeTerminalCommand(terminalSessionId, 'pwd');
          } catch (error) {
            console.log('Could not get directory after cd');
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to execute command:', error);
      setTerminalOutput(prev => [...prev, {
        type: 'error',
        content: `Error executing command: ${error.message}\n`,
        timestamp: Date.now()
      }]);
    }
  };

  const handleTerminalKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeCommand();
    }
  };

  // Terminal init when we click the view. Could do this when we open the app and keep the state active. Really up to the team
  useEffect(() => {
    if (currentView === 'terminal' && !terminalSessionId && !terminalLoading) {
      initializeTerminal();
    }
  }, [currentView, terminalSessionId, terminalLoading, initializeTerminal]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  //Top right nav buttons. Idk what to put up here so there are some repeats. 
  // We could remove them altogether and just leave the exit button. Team decisiion ts
  const navButtons = [
    { label: 'HOME', onClick: () => setCurrentView('home') },
    { label: 'EXIT', onClick: () => handleExit() },
  ];

  const handleExit = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.exitApp();
      } catch (error) {
        console.error('Error closing app:', error);
      }
    } else {
      // Fallback for web version, not really needed but always good to ahve error catcehs.
      if (window.confirm('Are you sure you want to exit?')) {
        window.close();
      }
    }
  };

// provides dynamic network info using ipify API, hope tis more reliable than electron API
// may still fetch dns with electron API later not sure yet.
  async function getNetwork() {
	try {
		// Get public IP from ipify
		const ipResponse = await fetch('https://api.ipify.org?format=json');
		const ipData = await ipResponse.json();
		const publicIP = ipData.ip;

		// Update IP display
		const ipText = `IP Address: ${publicIP}`;
		const ipDiv = document.getElementById('ip');
		if (ipDiv) ipDiv.textContent = ipText;

		// Get dns
		let dns = 'Google DNS: 8.8.8.8, 8.8.4.4';
		const dnsText = `DNS: ${dns}`;
		const dnsDiv = document.getElementById('dns');
		if (dnsDiv) dnsDiv.textContent = dnsText;
		
		// Check connectivity - if we got a response from ipify, we're connected
		const isConnected = publicIP && publicIP !== '';
		const statusText = isConnected ? 'Status: CONNECTED' : 'Status: DISCONNECTED';
		const statusDiv = document.getElementById('connectionStatus');
		if (statusDiv) statusDiv.textContent = statusText;
		
		// Update state for warning
		setIsConnectedToInternet(isConnected);
		
	} catch (err) {
		console.error('Network check failed:', err);
		
		// If ipify fails, we're likely disconnected
		const ipDiv = document.getElementById('ip');
		if (ipDiv) ipDiv.textContent = 'IP Address: DISCONNECTED';
		
		const dnsDiv = document.getElementById('dns');
		if (dnsDiv) dnsDiv.textContent = 'DNS: DISCONNECTED';
		
		const statusDiv = document.getElementById('connectionStatus');
		if (statusDiv) statusDiv.textContent = 'Status: DISCONNECTED';
		
		setIsConnectedToInternet(false);
	}
  }
	
	getNetwork();
  
  ////////////////////////////////////////////////////////////////////////////////
  /*
  
  
  This is the main juice of the app and how the main-content knows wtf to show. 
  Really understand this and you'll be chilling with the rest of this app.

    VIEWS: What they are?
    They show the user what they are viewing. Big surprise.

    The case system logic comes from the buttons. In the navButtons array above AND These methods. I'll reference the code below to show.
        <div>
            <LCARSPanel title="SYS DATA" panelNumber={3} onClick={() => setCurrentView('system')} />
            <LCARSPanel title="FILES" panelNumber={4} onClick={() => setCurrentView('files')} />
            <LCARSPanel title="NETWORK" panelNumber={5} onClick={() => setCurrentView('network')} />
            <LCARSPanel title="TERMINAL" panelNumber={6} onClick={() => setCurrentView('terminal')} />
            <LCARSPanel title="AUDIO" panelNumber={7} onClick={() => setCurrentView('audio')} />
            <LCARSPanel title="DISPLAY" panelNumber={8} onClick={() => setCurrentView('display')} />
          </div>
    Each of these methods are setting the app variable to the said view name. The switch statement then decides what to render based on the current view.

    Not Bard. Each one just returns some html in it with some styling. Some will have some "Special" tags. 
    These tags reference the component that gets put there. 

    I believe taht is the big picture. Reach out if you have questions on how to setup another view or anything else. Sometimes to make changes
    to a tab you need to alter the component. Not the view here. Really depends on what you are trying to do. 

    BIG TIP:
    if you are confused on what to change in the ui, click ctrl + shift + i to open the dev tools and then just inspect the element you want to change.
    then come to the code and search for that html tag or the inner text.

   */
  ////////////////////////////////////////////////////////////////////////////////



  // React lowkey cool. A lot of the styling comes from the library that I found. Reference it in the public/libraries if curious.
  const renderMainContent = () => {
    switch(currentView) {
      case 'system':
        return (
          <div style={{ overflow: 'hidden', height: '100%' }}>
            <div style={{ display: 'grid', gap: '0.5rem 2rem', paddingTop: '0.3rem', overflow: 'hidden', height: '100%' }}>
              <div>
                <SystemStatus 
                  systemData={systemData}
                  loading={systemDataLoading}
                />
              </div>
              {/* <div>
                <h3 style={{ color: 'var(--h3-color)' }}>Warp Core</h3>
                <WarpCore />
              </div> */}
            </div>
            {/* <div style={{ marginTop: '2rem' }}>
            </div> */}
          </div>
        );
      case 'files': 
        return (
          <div style={{ overflow: 'hidden', height: '100%' }}>
            <div style={{ 
              background: '#1a1a1a', 
              color: 'black', 
              padding: '0.5rem',
              borderRadius: 'var(--radius-content-top)',
              marginTop: '1rem',
              height: '70vh',
              overflow: 'hidden'
            }}>
              <FileExplorer />
            </div>
          </div>
        );
      case 'network':
        return (
          <div style={{ overflow: 'hidden', height: '100%' }}>
            <NetworkStatus />
          </div>
        );
      case 'terminal':
        return (
          <div style={{ overflow: 'hidden', height: '100%' }}>
            <div 
              ref={terminalRef}
              style={{ 
                background: '#000', 
                color: 'var(--orange)', 
                padding: '1rem',
                marginTop: '1rem',
                fontFamily: 'monospace',
                fontSize: '14px',
                height: '400px',
                overflow: 'auto',
                border: '2px solid var(--orange)',
                display: 'flex',
                flexDirection: 'column'
              }}
            > {/* 
              thinking about adding some loading texts. Maybe a spinner ion know yet. 
                  Okay I did it. But should we change this to a spinner or something cool? 
                  */}
              {terminalLoading ? (
                <div style={{ color: 'var(--orange)' }}>
                  Initializing LCARS Terminal Interface...
                </div>
              ) : (
                <>
                  {/* Terminal Output */}
                  <div style={{ flex: 1 }}>
                    {terminalOutput.map((entry, index) => (
                      <div key={index} style={{
                        color: entry.type === 'error' ? 'var(--red)' : 
                               entry.type === 'command' ? 'var(--space-white)' :
                               entry.type === 'system' ? 'var(--orange)' :
                               'var(--orange)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {entry.content}
                      </div>
                    ))}
                  </div>
                  
                  {/* Command Input at Bottom 
                   I stole some of this stuff from the interweb. Mostly just the styling.*/}
                  {terminalSessionId && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255, 153, 0, 0.3)',
                      paddingTop: '0.5rem',
                      marginTop: '0.5rem'
                    }}>
                      <span style={{ color: 'var(--orange)', marginRight: '0.5rem' }}>
                        PS {currentDirectory}&gt;
                      </span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyPress={handleTerminalKeyPress}
                        style={{
                          flex: 1,
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: 'var(--orange)',
                          fontFamily: 'monospace',
                          fontSize: '14px'
                        }}
                        placeholder="Enter command..."
                        autoFocus
                      />
                      <span style={{ 
                        color: 'var(--orange)', 
                        animation: 'blink 1s infinite',
                        marginLeft: '2px'
                      }}>
                        _
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Terminal Controls 
              Okay. This is weird. Idk if I like it or not yet. i want to do some more testing with the terminal.
              I've added more buttons to fill some of the empty space. 
              the commands clear do not work in powershell so I just clear the state with the button.BUT we could fix this
              and jsut clear the msg state if the command is clear yk. IDK, I kind of like it with the buttons
            */}
            <div style={{ 
              marginTop: '1rem',
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => executeCommand()}
                disabled={!terminalSessionId || !terminalInput.trim()}
                style={{
                  background: 'var(--orange)',
                  color: 'black',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  opacity: (!terminalSessionId || !terminalInput.trim()) ? 0.5 : 1
                }}
              >
                EXECUTE
              </button>
              
              <button
                onClick={() => {
                  setTerminalInput('');
                  setTerminalOutput([]);
                  if (terminalSessionId) {
                    window.electronAPI.closeTerminalSession(terminalSessionId);
                    setTerminalSessionId(null);
                  }
                  initializeTerminal();
                }}
                style={{
                  background: 'var(--red)',
                  color: 'black',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                RESET TERMINAL
              </button>
              
              <button
                onClick={() => {
                  setTerminalOutput([]);
                }}
                style={{
                  background: 'var(--bluey)',
                  color: 'black',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                CLEAR
              </button>
            </div>
          </div>
        );
        {/*
          This is not done. Doesn't work. May assign this to a team member later. Really don't feel like finishing this or making a comp for it.
           */}
      case 'audio':
        return (
          <div style={{ height: '100%' }}>
            <AudioControl />
          </div>
        );
        {/*
              This is also not done. Same reason as above. Not really sure what we should all include here.
          */}
      case 'display': // uh it works now. I think we should test mor
        return (
          <div style={{ overflow: 'hidden', height: '100%' }}>
            <div style={{ 
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              overflow: 'hidden',
              height: '100%'
            }}>

              <div style={{ 
          background: 'var(--red)', 
          color: 'black', 
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '0 20px 0 0'
              }}>
          <h3 style={{ margin: '0 0 10px 0' }}>GRAPHICS PERFORMANCE</h3>
          {gpuLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Loading GPU data...
            </div>
          ) : gpuData && gpuData.controllers && gpuData.controllers.length > 0 ? (
            <div>
              {gpuData.controllers.map((gpu, index) => (
                <div key={index} style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '12px', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    {gpu.model || `GPU ${index + 1}`}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    VRAM: {gpu.vram ? `${Math.round(gpu.vram / 1024)}GB` : 'Unknown'}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    Temperature: {gpu.temperature ? `${gpu.temperature}°C` : 'N/A'}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    Bus: {gpu.bus || 'Unknown'}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    Vendor: {gpu.vendor || 'Unknown'}
                  </div>
                </div>
              ))}
              {gpuData.displays && gpuData.displays.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Display Configuration:
                  </div>
                  {gpuData.displays.map((display, index) => (
                    <div key={index} style={{ fontSize: '12px', marginBottom: '0.2rem' }}>
                      Display {index + 1}: {display.resolutionx}x{display.resolutiony} @ {display.currentRefreshRate}Hz
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '1rem', fontSize: '10px', opacity: 0.7 }}>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              GPU data unavailable
            </div>
          )}
              </div>
            </div>
          </div>
        );
      // THIS IS THE main page view. Defaults currently, buuut I want to add a button to get here. Would be easy just dk where to put it.
              // Note that this is were we set the current views and allat as I mentioned at the top of this switch statement.
        case 'home':
        return (
          <div style={{ overflow: 'hidden', height: '100%' }}>
            <h1 style={{ color: 'var(--h1-color)' }}>WinLCARS INTERFACE</h1>
            <p style={{ color: 'var(--font-color)' }}>
              Library Computer Access/Retrieval System. Select a system from the left navigation panel.
            </p>
         
            <h2 style={{ color: 'var(--h2-color)' }}>Available Systems</h2>
            <ul style={{ color: 'var(--font-color)' }}>
              <li>System Data - Real-time system monitoring {systemDataLoading ? <span style={{ color: 'var(--orange)' }}>(Loading...)</span> : systemDataPreloaded ? <span style={{ color: 'var(--green)' }}>✓ Ready</span> : <span style={{ color: 'var(--red)' }}>⚠ Offline</span>}</li>
              <li>File Explorer - Browse and manage files {fileExplorerLoading ? <span style={{ color: 'var(--orange)' }}>(Loading...)</span> : fileExplorerPreloaded ? <span style={{ color: 'var(--green)' }}>✓ Ready</span> : <span style={{ color: 'var(--red)' }}>⚠ Offline</span>}</li>
              <li>Network - Network status and connections {networkLoading ? <span style={{ color: 'var(--orange)' }}>(Loading...)</span> : networkDataPreloaded ? <span style={{ color: 'var(--green)' }}>✓ Ready</span> : <span style={{ color: 'var(--red)' }}>⚠ Offline</span>}</li>
              <li>Terminal - Command line interface {terminalPreloaded ? <span style={{ color: 'var(--green)' }}>✓ Ready</span> : <span style={{ color: 'var(--red)' }}>⚠ Offline</span>}</li>
              <li>Audio - Audio systems and communications {audioLoading ? <span style={{ color: 'var(--orange)' }}>(Loading...)</span> : audioPreloaded ? <span style={{ color: 'var(--green)' }}>✓ Ready</span> : <span style={{ color: 'var(--red)' }}>⚠ Offline</span>}</li>
              <li>Display - Monitor and graphics settings {gpuLoading ? <span style={{ color: 'var(--orange)' }}>(Loading...)</span> : gpuDataPreloaded ? <span style={{ color: 'var(--green)' }}>✓ Ready</span> : <span style={{ color: 'var(--red)' }}>⚠ Offline</span>}</li>
            </ul>
          </div>
        );
      default:
        return (
          <div style={{ marginTop: 0, overflow: 'hidden', height: '100%' }}>
            <h1 style={{ color: 'var(--h1-color)', marginTop: 0 }}>WinLCARS INTERFACE</h1>
            <p style={{ color: 'var(--font-color)' }}>
              Library Computer Access/Retrieval System. Select a system from the left navigation panel.
            </p>
          </div>
        );
    }
  };

  return (
    <div>
      <style>{`
        body, html, #root {
          overflow: hidden !important;
          height: 100vh;
          margin: 0;
          padding: 0;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .clickable:hover {
          filter: brightness(1.1) !important;
        }
        .exit-button {
          background-color: var(--red) !important;
          color: black !important;
        }
        .exit-button:hover {
          filter: brightness(1.2) !important;
          box-shadow: 0 0 10px var(--red) !important;
        }
      `}</style>
      <section className="wrap-standard" id="column-3">
        <div className="wrap">
          <div className="left-frame-top">
            <button className="panel-1-button">LCARS</button>
            <div className="panel-2">{currentTime.getMonth() + 1}-{currentTime.getDate()}<span className="hop">-{currentTime.getFullYear()}</span></div>
          </div>
          <div className="right-frame-top">
            <div className="banner">LCARS &#149; STARDATE {Math.floor((currentTime.getFullYear() - 2000) * 1000 + currentTime.getMonth() * 83 + currentTime.getDate() * 2.7)}.{currentTime.getHours()}</div>
            <div className="data-cascade-button-group">
              <LCARSDataCascade columns={12} rows={4} />
              <LCARSNavigation 
                buttons={navButtons}
                soundEffect={true}
              />
            </div>
            <div className="bar-panel first-bar-panel">
              <div className="bar-1"></div>
              <div className="bar-2"></div>
              <div className="bar-3"></div>
              <div className="bar-4"></div>
              <div className="bar-5"></div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap" id="gap">
        <div className="left-frame">
          <button id="topBtn" style={{display: 'none'}}>
            <span className="hop">screen</span> top
          </button>
          <div>
            <LCARSPanel title="SYS DATA" panelNumber={3} onClick={() => setCurrentView('system')} />
            <LCARSPanel title="FILES" panelNumber={4} onClick={() => setCurrentView('files')} />
            <LCARSPanel title="NETWORK" panelNumber={5} onClick={() => setCurrentView('network')} />
            <LCARSPanel title="TERMINAL" panelNumber={6} onClick={() => setCurrentView('terminal')} />
            <LCARSPanel title="AUDIO" panelNumber={7} onClick={() => setCurrentView('audio')} />
            <LCARSPanel title="DISPLAY" panelNumber={8} onClick={() => setCurrentView('display')} />
          </div>
        </div>
        <div className="right-frame">
          <div className="bar-panel">
            <div className="bar-6"></div>
            <div className="bar-7"></div>
            <div className="bar-8"></div>
            <div className="bar-9"></div>
            <div className="bar-10"></div>
          </div>
          
          <div className="content-area" style={{ overflow: 'hidden', height: '100vh', maxHeight: '100vh' }}>
            {renderMainContent()}
          </div>
        </div>
      </div>
      
      <NetworkAlert 
        isDisconnected={!isConnectedToInternet} 
        onClose={() => {}} // should auto hide when reconnected
      />
    </div>
  );
}

export default App;
