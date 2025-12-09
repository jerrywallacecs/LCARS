const path = require('path');
const fs = require('fs');

// Simple MSI creation script using the generated WXS file
async function createSimpleMSI() {
  const wxsPath = path.join(__dirname, 'out', 'make', 'squirrel.windows', 'x64', 'lcars_interface.wxs');
  
  if (fs.existsSync(wxsPath)) {
    console.log('WXS file found at:', wxsPath);
    console.log('You can manually compile this with WiX Toolset if needed.');
    
    // Read the WXS content to see what's available
    const wxsContent = fs.readFileSync(wxsPath, 'utf8');
    console.log('WXS file contains:', wxsContent.substring(0, 500) + '...');
  } else {
    console.log('No WXS file found. The Squirrel MSI is a wrapper, not a true WiX MSI.');
  }
  
  console.log('\nRecommendation: Use LCARS-Setup.exe instead of the MSI.');
  console.log('The EXE installer will work better with Squirrel and your startup handling.');
}

createSimpleMSI().catch(console.error);