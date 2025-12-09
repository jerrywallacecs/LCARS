const path = require('path');
const { MSICreator } = require('electron-wix-msi');

async function createMSI() {
  // Step 1: Instantiate the MSICreator
  const msiCreator = new MSICreator({
    appDirectory: path.join(__dirname, 'out', 'lcars_interface-win32-x64'),
    outputDirectory: path.join(__dirname, 'out', 'make'),
    
    // Configure metadata
    exe: 'lcars_interface.exe',
    name: 'LCARS Interface',
    version: '0.1.0',
    manufacturer: 'TealInc',
    description: 'WinLCARS Interface - Library Computer Access/Retrieval System for Windows',
    
    // Configure app details  
    appUserModelId: 'com.tealinc.lcars',
    programFilesFolderName: 'LCARS',
    shortName: 'LCARS',
    shortcutFolderName: 'LCARS',
    
    // Explicitly provide icon path
    appIconPath: path.join(__dirname, 'public', 'Images', 'star-trek-png-logo-3554.png'),
    
    // Configure UI
    ui: {
      chooseDirectory: true,
      template: 'advanced'
    },
    
    // Configure features
    features: {
      autoUpdate: false,
      autoLaunch: false
    }
  });

  // Step 2: Create the .wxs template
  await msiCreator.create();

  // Step 3: Compile the MSI
  await msiCreator.compile();
  
  console.log('MSI created successfully!');
}

createMSI().catch(console.error);