const path = require('path');
const { app, BrowserWindow, dialog } = require('electron');
const ifaces = require('os').networkInterfaces();
const ejse = require('ejs-electron');
const { is } = require('electron-util');
const contextMenu = require('electron-context-menu');
const Server = require('./src/index');

contextMenu();

// Prevent window from being garbage collected
let mainWindow;

const port = process.env.PORT || 8999;
let address;

Object.keys(ifaces).forEach((dev) => {
  ifaces[dev].forEach((details) => {
    if (details.family === 'IPv4' && details.internal === false) {
      address = details.address;
    }
  });
});

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

// Data initialization, updated by websocket if necessary
ejse.data({
  CDMIp: address,
  CDMPort: 9999,
  address: `http://${address}:${port}`,
  clientConnected: 0,
  version: process.env.npm_package_version,
  repoAddress: process.env.npm_package_repository_url,
});

const createMainWindow = async () => {
  const win = new BrowserWindow({
    title: 'Télécomande CDM-Rail',
    frame: false,
    transparent: true,
    show: true,
    width: 600,
    height: 500,
    resizable: false,
    icon: path.join(__dirname, '/static/icons/icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  win.on('close', (e) => {
    const choice = dialog.showMessageBoxSync(win,
      {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'CDM-Rail Remote',
        message: 'Êtes-vous sûr de vouloir quitter ?',
      });
    if (choice === 1) {
      e.preventDefault();
    }
  });

  win.on('closed', () => {
    // Dereference the window
    // For multiple windows store them in an array
    mainWindow = undefined;
  });

  await win.loadFile(path.join(__dirname, 'views/home.ejs'));

  return win;
};

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
  }
});

app.on('window-all-closed', () => {
  if (!is.macos) {
    app.quit();
  }
});

app.on('activate', async () => {
  if (!mainWindow) {
    mainWindow = await createMainWindow();
  }
});

(async () => {
  await app.whenReady();
  mainWindow = await createMainWindow();

  // Start backend Server
  new Server({ address, port }).start();
})();
