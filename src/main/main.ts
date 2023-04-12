/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, ipcMain, Menu, shell, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';
import {
  configureIpfs,
  downloadIpfs,
  ipfs,
  ipfsDaemon,
  ipfsIsInstalled,
  ipfsKill,
  ipfsPid,
} from './ipfs';
import {
  configureFollower,
  downloadFollower,
  follower,
  followerDaemon,
  followerIsInstalled,
  followerPid,
  followerKill,
} from './follower';

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    show: true,
    useContentSize: true,
    center: true,
    minWidth: 600 * (isDebug ? 3 : 1),
    minHeight: 364 * (isDebug ? 2 : 1),
    skipTaskbar: true,
    fullscreen: false,
    fullscreenable: false,
    width: 600 * (isDebug ? 3 : 1),
    height: 364 * (isDebug ? 2 : 1),
    frame: false,
    icon: getAssetPath('icon.icns'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  if (isDebug) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

app.once('ready', () => {
  // // Hide the app from the dock
  // if (app.dock) {
  //   app.dock.hide();
  // }

  // Create a Tray instance with the icon you want to use for the menu bar
  tray = new Tray(getAssetPath('icons/24x24@3x.png'));

  // Create a Menu instance with the options you want
  const contextMenu = Menu.buildFromTemplate([
    {
      label: mainWindow?.isVisible() ? 'Hide App' : 'Open App',
      click: () => {
        if (mainWindow?.isVisible()) {
          mainWindow.hide();
          return;
        }
        if (!mainWindow) {
          createWindow();
        } else {
          mainWindow.show();
        }
      },
    },
    {
      label: 'Debug',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.on('mouse-down', (_event) => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
      return;
    }
    if (!mainWindow) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });

  // Set the context menu for the tray icon
  tray?.setContextMenu(contextMenu);
});

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        createWindow();
      }
    });
  })
  .catch(console.error);

ipcMain.handle('install-ipfs', downloadIpfs);
ipcMain.handle('install-follower', downloadFollower);
ipcMain.handle('ipfs-isInstalled', ipfsIsInstalled);
ipcMain.handle('follower-isInstalled', followerIsInstalled);
ipcMain.handle('ipfs-isRunning', ipfsPid);
ipcMain.handle('follower-isRunning', followerPid);

ipcMain.handle('run-ipfs', async () => {
  await configureIpfs();
  await ipfsDaemon();
});

ipcMain.handle('run-follower', async () => {
  await configureFollower();
  await followerDaemon();
});

ipcMain.handle('ipfs-peers', () => ipfs('swarm peers'));
ipcMain.handle('ipfs-id', () => ipfs('id'));
ipcMain.handle('ipfs-repo-stat', () => ipfs('repo stat'));
ipcMain.handle('ipfs-stats-bw', () => ipfs('stats bw'));
ipcMain.handle('ipfs-follower-info', () => follower('synthetix info'));

app.on('will-quit', ipfsKill);
app.on('will-quit', followerKill);

ipfsDaemon();
const ipfsCheck = setInterval(ipfsDaemon, 10_000);
app.on('will-quit', () => clearInterval(ipfsCheck));

followerDaemon();
const followerCheck = setInterval(followerDaemon, 10_000);
app.on('will-quit', () => clearInterval(followerCheck));
