import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import LCARSPanel from './components/LCARSPanel';
import LCARSDataCascade from './components/LCARSDataCascade';
import LCARSNavigation from './components/LCARSNavigation';
import SystemStatus from './components/SystemStatus';
import WarpCore from './components/WarpCore';

function App() {
  //default stuf
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentView, setCurrentView] = useState('home');
  const [systemDataPreloaded, setSystemDataPreloaded] = useState(false);
  
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
        try {
          console.log('Preloading system data...');
          await window.electronAPI.getSystemInfo();
          setSystemDataPreloaded(true);
          console.log('System data preloaded successfully');
        } catch (error) {
          console.warn('Failed to preload system data:', error);
        }
      }
    };

    //this is a stratigic timer to not interfere with the first preload.#Goated
    //there's probably a better way to do this but this was the easy quick fix.
    const preloadTimer = setTimeout(preloadSystemData, 2000);
    return () => clearTimeout(preloadTimer);
  }, [systemDataPreloaded]);

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

  // Fetch GPU data when display view is accessed
  useEffect(() => {
    const preloadGPUData = async () => {
      if (window.electronAPI && !gpuDataPreloaded) {
        setGpuLoading(true);
        try {
          console.log('Fetching GPU performance data...');
          const data = await window.electronAPI.getGPUPerformance();
          setGpuData(data);
          setGpuDataPreloaded(true);
          console.log('GPU data fetched:', data);
        } catch (error) {
          console.error('Failed to fetch GPU data:', error);
        } finally {
          setGpuLoading(false);
        }
      }
    };

    if (currentView === 'display') {
      // Add a delay before fetching GPU data to prevent freezing
      const gpuTimer = setTimeout(preloadGPUData, 1500);
      return () => clearTimeout(gpuTimer);
    }
  }, [currentView, gpuDataPreloaded]);

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

// provides dynamic network info - currently updates connection status, ip, and dns. we still need default gateway. this still needs more work but it works for now.
  async function getNetwork() {
	try {
		const networkInfo = await window.electronAPI.getNetworkInfo();

		const ip = networkInfo.ipAddresses.map(i => i.address);
		const ipText = `IP Address: ${ip}`;
		const ipDiv = document.getElementById('ip');
		if (ipDiv) ipDiv.textContent = ipText;

		const dns = networkInfo.dns.length ? networkInfo.dns.join(', ') : 'No DNS';
		const dnsText = `DNS: ${dns}`;
		const dnsDiv = document.getElementById('dns');
		if (dnsDiv) dnsDiv.textContent = dnsText;
		
		const statusText = networkInfo.ipAddresses.length > 0 ? 'Status: CONNECTED' : 'Status: DISCONNECTED';
		const statusDiv = document.getElementById('connectionStatus');
		if (statusDiv) statusDiv.textContent = statusText;
		
	} catch (err) {
		console.error(err);
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
          <div>
            <h1 style={{ color: 'var(--h1-color)' }}>SYSTEM DATA</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
              <div>
                <h3 style={{ color: 'var(--h3-color)' }}>System Status</h3>
                <SystemStatus />
              </div>
              <div>
                <h3 style={{ color: 'var(--h3-color)' }}>Warp Core</h3>
                <WarpCore />
              </div>
            </div>
            <div style={{ marginTop: '2rem' }}>
            </div>
          </div>
        );
      case 'files': 
        return (
          <div>
            <h1 style={{ color: 'var(--h1-color)' }}>FILE EXPLORER</h1>
            <div style={{ 
              background: 'var(--space-white)', 
              color: 'black', 
              padding: '1rem',
              borderRadius: 'var(--radius-content-top)',
              marginTop: '1rem'
            }}>
              <div style={{ display: 'flex', marginBottom: '1rem' }}>
                <div style={{ 
                  background: 'var(--orange)', 
                  color: 'black', 
                  padding: '0.5rem 1rem',
                  marginRight: '0.5rem',
                  fontWeight: 'bold'
                }}>
                  C:\
                </div>
                <div style={{ 
                  background: 'var(--bluey)', 
                  color: 'black', 
                  padding: '0.5rem 1rem',
                  marginRight: '0.5rem',
                  fontWeight: 'bold'
                }}>
                  Users
                </div>
                <div style={{ 
                  background: 'var(--african-violet)', 
                  color: 'black', 
                  padding: '0.5rem 1rem',
                  fontWeight: 'bold'
                }}>
                  Documents
                </div>
              </div>
              <div style={{ fontSize: '14px' }}>
                {['📁 Desktop', '📁 Downloads', '📁 Pictures', '📁 Videos', '📄 Document.txt', '📄 Report.pdf', '📁 Projects'].map((item, index) => (
                  <div key={index} style={{ 
                    padding: '0.5rem', 
                    borderBottom: '1px solid #ccc',
                    cursor: 'pointer',
                    ':hover': { background: '#f0f0f0' }
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'network':
        return (
          <div>
            <h1 style={{ color: 'var(--h1-color)' }}>NETWORK STATUS</h1>
            <div style={{ marginTop: '2rem' }}>
              <div style={{ 
                background: 'var(--orange)', 
                color: 'black', 
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '0 20px 0 0'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>CONNECTION STATUS</h3>
                <div style={{ fontSize: '14px' }}>
                  <div id="connectionStatus"></div>
                  <div id="ip"></div>
                  <div>Gateway: 192.168.1.1</div>
                  <div id="dns"></div>
                </div>
              </div>
              
              <div style={{ 
                background: 'var(--bluey)', 
                color: 'black', 
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '0 20px 0 0'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>NETWORK TRAFFIC</h3>
                <div style={{ fontSize: '14px' }}>
                  <div>Download: {(Math.random() * 100).toFixed(1)} Mbps</div>
                  <div>Upload: {(Math.random() * 50).toFixed(1)} Mbps</div>
                  <div>Packets Sent: {Math.floor(Math.random() * 10000)}</div>
                  <div>Packets Received: {Math.floor(Math.random() * 15000)}</div>
                </div>
              </div>

              <div style={{ 
                background: 'var(--red)', 
                color: 'black', 
                padding: '1rem',
                borderRadius: '0 20px 0 0'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>ACTIVE CONNECTIONS</h3>
                <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                  <div>tcp 192.168.1.100:443 → github.com:443 ESTABLISHED</div>
                  <div>tcp 192.168.1.100:3000 → localhost:3000 LISTENING</div>
                  <div>udp 192.168.1.100:53 → 8.8.8.8:53 ACTIVE</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'terminal':
        return (
          <div>
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
          <div>
              <div style={{ 
                background: 'var(--orange)', 
                color: 'black', 
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '0 20px 0 0'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>AUDIO LEVELS</h3>
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    Master Volume: <span style={{ fontFamily: 'monospace' }}>{'█'.repeat(7)}{'░'.repeat(3)}</span> 70%
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    Communications: <span style={{ fontFamily: 'monospace' }}>{'█'.repeat(8)}{'░'.repeat(2)}</span> 80%
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    Alerts: <span style={{ fontFamily: 'monospace' }}>{'█'.repeat(9)}{'░'.repeat(1)}</span> 90%
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    Computer Voice: <span style={{ fontFamily: 'monospace' }}>{'█'.repeat(6)}{'░'.repeat(4)}</span> 60%
                  </div>
                </div>
              </div>
            </div>
        );
        {/*
              This is also not done. Same reason as above. Not really sure what we should all include here.
          */}
      case 'display': // uh it works now. I think we should test mor
        return (
          <div>
            <div style={{ 
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem'
            }}>
              <div style={{ 
          background: 'var(--bluey)', 
          color: 'black', 
          padding: '1rem',
          marginBottom: '1rem',
          borderRadius: '0 20px 0 0'
              }}>
          <h3 style={{ margin: '0 0 10px 0' }}>MONITOR CONFIGURATION</h3>
          <div style={{ fontSize: '14px' }}>
            <div>Primary Display: 1920x1080 @ 60Hz</div>
            <div>Secondary Display: 2560x1440 @ 144Hz</div>
            <div>Color Depth: 32-bit</div>
            <div>Refresh Rate: Variable</div>
          </div>
              </div>

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
        {/* Do we really want this? I thot we could just get the weather info from the users pc but turns out that is not really reliably possilbe. 
            We would unfortunately need an api key and service. There are free ones out there such as open-meteo but they are not super reliable.
            I added some dummy data to show what it could look like. We can remove this if the team decides against it. 
            #EMOJIS*/}
      case 'weather':
        return (
          <div>
            <h1 style={{ color: 'var(--h1-color)' }}>WEATHER SYSTEMS</h1>
            <div style={{ marginTop: '2rem' }}>
              <div style={{ 
                background: 'var(--orange)', 
                color: 'black', 
                padding: '1rem',
                marginBottom: '1rem',
                borderRadius: '0 20px 0 0'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>CURRENT CONDITIONS</h3>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '1rem' }}>
                  🌤️ Partly Cloudy - 22°C
                </div>
                <div style={{ fontSize: '14px' }}>
                  <div>Humidity: 65%</div>
                  <div>Wind: 15 km/h NW</div>
                  <div>Pressure: 1013 hPa</div>
                  <div>Visibility: 10 km</div>
                </div>
              </div>

              <div style={{ 
                background: 'var(--african-violet)', 
                color: 'black', 
                padding: '1rem',
                borderRadius: '0 20px 0 0'
              }}>
                <h3 style={{ margin: '0 0 10px 0' }}>5-DAY FORECAST</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {[
                    { day: 'Today', icon: '🌤️', temp: '22°' },
                    { day: 'Tomorrow', icon: '☀️', temp: '25°' },
                    { day: 'Friday', icon: '🌧️', temp: '18°' },
                    { day: 'Saturday', icon: '⛈️', temp: '16°' },
                    { day: 'Sunday', icon: '🌈', temp: '20°' }
                  ].map((forecast, index) => (
                    <div key={index} style={{ 
                      background: 'var(--space-white)', 
                      padding: '0.5rem', 
                      textAlign: 'center',
                      fontSize: '12px'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>{forecast.day}</div>
                      <div style={{ fontSize: '20px', margin: '0.5rem 0' }}>{forecast.icon}</div>
                      <div>{forecast.temp}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      // THIS IS THE main page view. Defaults currently, buuut I want to add a button to get here. Would be easy just dk where to put it.
              // Note that this is were we set the current views and allat as I mentioned at the top of this switch statement.
        case 'home':
        return (
          <div>
            <h1 style={{ color: 'var(--h1-color)' }}>WinLCARS INTERFACE</h1>
            <p style={{ color: 'var(--font-color)' }}>
              Library Computer Access/Retrieval System. Select a system from the left navigation panel.
            </p>
         
            <h2 style={{ color: 'var(--h2-color)' }}>Available Systems</h2>
            <ul style={{ color: 'var(--font-color)' }}>
              <li>System Data - Real-time system monitoring</li>
              <li>File Explorer - Browse and manage files</li>
              <li>Network - Network status and connections</li>
              <li>Terminal - Command line interface</li>
              <li>Audio - Audio systems and communications</li>
              <li>Display - Monitor and graphics settings</li>
            </ul>
          </div>
        );
      default:
        return (
          <div style={{ marginTop: 0 }}>
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
            <div className="panel-2">24<span className="hop">-{currentTime.getFullYear()}</span></div>
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
          
          <div className="content-area">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
