# LCARS Interface System

A Star Trek-inspired LCARS (Library Computer Access/Retrieval System) interface built with React and Electron.

## Features

- **Authentic LCARS Design**: Recreation of the iconic Star Trek computer interface
- **Real-time System Monitoring**: Live CPU, RAM, and system metrics with animated progress bars
- **Interactive Controls**: Functional buttons and panels with hover effects and state management
- **Fullscreen Electron App**: Immersive desktop experience with frameless window
- **Animated Elements**: Dynamic waveforms, progress bars, and pulsing indicators
- **Responsive Layout**: Adapts to different screen sizes while maintaining LCARS aesthetic
- **Star Trek Authenticity**: Federation logo, stardate calculation, and proper LCARS color scheme

## Components

- **Header**: Federation logo, real-time clock, stardate display, and operations panel
- **Left Sidebar**: Master controls and system navigation with LCARS-style buttons
- **Main Display**: Core utilization, diagnostics, memory usage, and storage information
- **Right Sidebar**: Computer information, system specs, and shutdown controls
- **Status Bars**: Real-time system status indicators

## Installation & Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Build React Frontend**:
```bash
npm run build
```

3. **Run LCARS Interface**:
```bash
npm run electron
```

## Development

For development with hot reloading:

```bash
# Terminal 1: Start React dev server
npm start

# Terminal 2: Start Electron in dev mode (after React server is running)
npm run electron-dev-win
```

## Available Scripts

- `npm start` - Start React development server on http://localhost:3000
- `npm run build` - Build optimized React app for production
- `npm run electron` - Run Electron app with production build
- `npm run electron-dev-win` - Run Electron in development mode (Windows)
- `npm run dist` - Build and run in one command

## Technologies Used

- **React 19.1.1** - Modern frontend framework with hooks
- **Electron 38.0.0** - Cross-platform desktop application framework
- **CSS3** - Advanced styling with animations, gradients, and flexbox
- **Orbitron Font** - Futuristic Google Font for authentic sci-fi look

## Key Features Implemented

### Visual Elements
- LCARS orange/amber color scheme (#ff9900, #ff6600)
- Rounded corner "pill" buttons characteristic of LCARS
- Federation logo with star field
- Real-time clock and stardate calculation
- Animated progress bars and system metrics

### Interactive Elements
- Hover effects on all buttons and controls
- Dynamic system monitoring (CPU, RAM usage)
- Pulsing animations for status indicators
- Waveform visualizations for system activity

### System Integration
- Electron frameless fullscreen window
- Production and development build configurations
- Proper asset loading and routing

## Customization

The interface can be customized by modifying:

- **Colors**: Update CSS custom properties in `src/App.css`
- **Layout**: Modify component structure in `src/App.js`
- **Components**: Add new panels in `src/components/`
- **Animations**: Adjust keyframes and transitions in CSS files
- **System Data**: Modify state management for real data integration

## File Structure

```
src/
├── App.js                 # Main LCARS interface component
├── App.css               # Primary LCARS styling
├── index.js              # React entry point
├── index.css             # Global styles
└── components/           # Reusable LCARS components
    ├── LCARSButton.js    # LCARS-style buttons
    ├── LCARSPanel.js     # Information panels
    ├── SystemStatus.js   # System monitoring
    └── WarpCore.js       # Warp core visualization
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Inspired by Star Trek's LCARS interface design from The Next Generation era
- Color scheme and typography based on canonical LCARS specifications
- Created for educational and entertainment purposes
- Not affiliated with CBS Studios or Paramount Pictures

---

**Live long and prosper!** 🖖
