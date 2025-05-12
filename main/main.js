const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { setupIpcHandlers } = require('./ipcHandlers');

console.log('Starting Electron app...');
console.log('Node environment:', process.env.NODE_ENV);

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// Create the app's data directory if it doesn't exist
const appDataPath = path.join(app.getPath('userData'), 'data');
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    // Give the window a more desktop-app feel
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#fff'
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../build/index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  // In development, load from React dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Clean up window when closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Set up IPC handlers
setupIpcHandlers();

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed, unless on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked and no windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for calendar events will go here 