import electron from 'electron';
const { app, BrowserWindow, Menu, dialog } = electron;
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global crash / rejection handlers to avoid silent failure
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  try {
    dialog.showErrorBox('Main Process Error', err?.stack || err?.message || String(err));
  } catch {}
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  try {
    dialog.showErrorBox('Unhandled Rejection', String(reason));
  } catch {}
});

// Configure writable database path for packaged app before importing db / ipc handlers
if (app.isPackaged) {
  const userDataPath = app.getPath('userData');
  const targetDb = path.join(userDataPath, 'dictation.db');
  
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  if (!fs.existsSync(targetDb)) {
    const seedDb = path.join(app.getAppPath(), 'server', 'data', 'dictation.db');
    if (fs.existsSync(seedDb)) {
      try {
        fs.copyFileSync(seedDb, targetDb);
        console.log(`Copied initial seed database to ${targetDb}`);
      } catch (err) {
        console.error('Failed to copy seed database to userData:', err);
      }
    }
  }
  process.env.DICTATION_DB_PATH = targetDb;
}

// Ensure single instance to prevent database lock conflicts
let mainWindow = null;
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon.png');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 640,
    title: 'English Dictation Practice',
    backgroundColor: '#090d16',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const isDev = !app.isPackaged && devServerUrl;

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load page:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    const { setupIpcHandlers } = await import('./ipc.js');
    setupIpcHandlers();
    createWindow();
  } catch (err) {
    console.error('Failed during app startup:', err);
    dialog.showErrorBox('Startup Error', err?.stack || err?.message || String(err));
  }

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
