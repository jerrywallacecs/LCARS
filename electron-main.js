const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;
const isDev = process.env.ELECTRON_IS_DEV === 'true' || !app.isPackaged;

function createWindow() {
	win = new BrowserWindow({
		width: 1920,
		height: 1080,
		fullscreen: true,
		frame: false,
		resizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false
		},
		backgroundColor: '#000000',
		show: false
	});

	// Load the app
	if (isDev && process.env.NODE_ENV === 'development') {
		win.loadURL('http://localhost:3000');
		win.webContents.openDevTools();
	} else {
		win.loadFile(path.join(__dirname, 'build', 'index.html'));
	}

	win.once('ready-to-show', () => {
		win.show();
	});

	win.on('closed', () => {
		win = null;
	});
}

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
