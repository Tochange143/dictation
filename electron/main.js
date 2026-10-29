import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setupIpcHandlers } from './ipc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure single instance to prevent database lock conflicts
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;

// Configure writable database path for packaged app
if (app.isPackaged) {
  const userDataPath = app.getPath('userData');
  const targetDb = path.join(userDataPath, 'dictation.db');
  
  if (!fs.existsSync(targetDb)) {
    const seedDb = path.join(app.getAppPath(), 'server', 'data', 'dictation.db');
    if (fs.existsSync(seedDb)) {
      try {
        fs.mkdirSync(userDataPath, { recursive: true });
        fs.copyFileSync(seedDb, targetDb);
        console.log(`Copied initial seed database to ${targetDb}`);
      } catch (err) {
        console.error('Failed to copy seed database to userData:', err);
      }
    }
  }
  process.env.DICTATION_DB_PATH = targetDb;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 640,
    title: 'English Dictation Practice',
    backgroundColor: '#090d16',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Second instance focus
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const isDev = !app.isPackaged && devServerUrl;

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
    // Optional: Open DevTools in dev mode
    // mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
