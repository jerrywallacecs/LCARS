# LCARS Interface - Using Official LCARS Library

This project has been updated to use the official LCARS library (version 24.2) instead of custom CSS. All components have been recreated to leverage the authentic LCARS styling and functionality.

## Components Created

### 1. LCARSButton
A button component that can render in different LCARS styles:

```jsx
import LCARSButton from './components/LCARSButton';

// Standard LCARS button
<LCARSButton onClick={handleClick} soundEffect={true}>
  BUTTON TEXT
</LCARSButton>

// Navigation style button (smaller)
<LCARSButton navButton={true} onClick={handleClick}>
  NAV
</LCARSButton>

// Panel style button (main LCARS button)
<LCARSButton panelButton={true} soundEffect={true}>
  LCARS
</LCARSButton>
```

### 2. LCARSPanel
Creates LCARS-style panels with proper numbering and styling:

```jsx
import LCARSPanel from './components/LCARSPanel';

<LCARSPanel title="MAIN SYS" panelNumber={3} />
<LCARSPanel title="SENSORS" panelNumber={4} />
```

### 3. LCARSMainPanel
The main LCARS interface wrapper that provides the classic layout:

```jsx
import LCARSMainPanel from './components/LCARSMainPanel';

<LCARSMainPanel>
  {/* Your content goes here */}
</LCARSMainPanel>
```

### 4. LCARSDataCascade
Animated data cascade displaying scrolling technical readouts:

```jsx
import LCARSDataCascade from './components/LCARSDataCascade';

// Standard data cascade
<LCARSDataCascade columns={6} />

// Frozen data cascade (no animation)
<LCARSDataCascade columns={8} frozen={true} />
```

### 5. LCARSNavigation
Navigation component with multiple buttons:

```jsx
import LCARSNavigation from './components/LCARSNavigation';

const navButtons = [
  { label: 'MAIN', onClick: () => console.log('Main') },
  { label: 'SYSTEMS', onClick: () => console.log('Systems') },
  { label: 'DATA', onClick: () => console.log('Data') },
  { label: 'COMMS', onClick: () => console.log('Communications') }
];

<LCARSNavigation 
  buttons={navButtons}
  soundEffect={true}
/>
```

### 6. SystemStatus (Updated)
System status display using LCARS panel styling:

```jsx
import SystemStatus from './components/SystemStatus';

<SystemStatus />
```

### 7. WarpCore (Updated)
Warp core monitoring display using LCARS styling:

```jsx
import WarpCore from './components/WarpCore';

<WarpCore />
```

## LCARS Library Features Used

### CSS Variables
The library provides many CSS variables for consistent coloring:

- `--orange`: Primary orange color
- `--red`: Red color for alerts
- `--bluey`: Blue variant
- `--african-violet`: Purple color
- `--butterscotch`: Yellow-orange color
- `--space-white`: Background white
- And many more...

### Layout Classes
- `wrap-standard`: Standard LCARS layout wrapper
- `left-frame-top`, `right-frame-top`: Frame sections
- `panel-1` through `panel-15`: Various panel styles
- `bar-1` through `bar-10`: Decorative bars
- `data-cascade-wrapper`: Data cascade container
- `banner`: Header banner style

### Sound Effects
The library includes authentic LCARS sound effects:
- `audio1`, `audio2`, `audio3`, `audio4`: Different beep sounds
- Use `playSoundAndRedirect()` function for navigation with sound

## File Structure

```
src/
├── components/
│   ├── LCARSButton.js          # Button component
│   ├── LCARSPanel.js           # Panel component
│   ├── LCARSMainPanel.js       # Main layout wrapper
│   ├── LCARSDataCascade.js     # Data cascade component
│   ├── LCARSNavigation.js      # Navigation component
│   ├── LCARSExamples.js        # Example usage component
│   ├── SystemStatus.js         # Updated system status
│   └── WarpCore.js             # Updated warp core display
├── App.js                      # Main application
└── index.js                    # Entry point

public/
├── Libraries/
│   └── LCARS-24.2/            # Official LCARS library
│       ├── assets/
│       │   ├── classic.css    # Main LCARS stylesheet
│       │   ├── lcars.js       # LCARS JavaScript functions
│       │   ├── beep1.mp3      # Sound effects
│       │   ├── beep2.mp3
│       │   ├── beep3.mp3
│       │   └── beep4.mp3
│       └── *.html             # Example layouts
└── index.html                 # Updated to include LCARS assets
```

## Key Changes Made

1. **Removed custom CSS files** - Now using official LCARS library CSS
2. **Updated index.html** - Includes LCARS CSS and audio files
3. **Recreated all components** - Using authentic LCARS classes and structure
4. **Added sound effects** - Buttons can play authentic LCARS sounds
5. **Proper LCARS layout** - Following the library's layout patterns
6. **CSS variables** - Using the library's color system

## Usage Examples

See `src/components/LCARSExamples.js` for comprehensive examples of how to use each component.

## LCARS Library Documentation

The original LCARS library includes several example HTML files in `public/Libraries/LCARS-24.2/` that demonstrate different layouts:
- `classic-standard.html`
- `classic-ultra.html` 
- `nemesis-blue-standard.html`
- And others...

These can be used as reference for creating more complex layouts.

## Running the Application

```bash
npm start
```

The application will start with the authentic LCARS interface using the official library components.