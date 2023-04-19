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
// import { autoUpdater } from 'electron-updater';
import logger from 'electron-log';
import { resolveHtmlPath } from './util';
import {
  configureIpfs,
  downloadIpfs,
  ipfs,
  ipfsDaemon,
  ipfsIsInstalled,
  ipfsIsRunning,
  ipfsKill,
  waitForIpfs,
} from './ipfs';
import {
  configureFollower,
  downloadFollower,
  follower,
  followerDaemon,
  followerIsInstalled,
  followerKill,
  followerPid,
} from './follower';
import { getDappHost } from './dapps';
import * as settings from './settings';
import http from 'http';
import { proxy } from './proxy';

logger.transports.file.level = 'info';

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// class AppUpdater {
//   constructor() {
//     log.transports.file.level = 'info';
//     autoUpdater.logger = log;
//     autoUpdater.checkForUpdatesAndNotify();
//   }
// }

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

const dapps: { [key: string]: string | undefined } = {
  'kwenta.eth': undefined,
  'staking.synthetix.eth': undefined,
};
const localDapps: { [key: string]: string | undefined } = {
  'kwenta.eth': 'kwenta',
  'staking.synthetix.eth': 'staking',
};

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

function updateContextMenu() {
  const menu = generateMenuItems();
  if (tray && !tray.isDestroyed()) {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        menu.app,
        menu.devTools,
        menu.dock,
        { type: 'separator' },
        ...menu.dapps,
        { type: 'separator' },
        menu.quit,
      ])
    );
  }
  app.dock.setMenu(
    Menu.buildFromTemplate([
      menu.app,
      menu.devTools,
      menu.tray,
      { type: 'separator' },
      ...menu.dapps,
    ])
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    show: true,
    useContentSize: true,
    center: true,
    minWidth: 600,
    minHeight: 470,
    skipTaskbar: true,
    fullscreen: false,
    fullscreenable: false,
    width: 600,
    height: 470,
    frame: false,
    icon: getAssetPath('icon.icns'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  if (isDebug) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
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

  mainWindow.webContents.on('devtools-opened', updateContextMenu);
  mainWindow.webContents.on('devtools-closed', updateContextMenu);
  mainWindow.on('hide', updateContextMenu);
  mainWindow.on('show', updateContextMenu);

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  // new AppUpdater();
}

function generateMenuItems() {
  return {
    app: {
      label: mainWindow?.isVisible() ? 'Hide App' : 'Open App',
      click: () => {
        if (mainWindow?.isVisible()) {
          mainWindow.hide();
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
          }
          return;
        }
        if (!mainWindow) {
          createWindow();
        } else {
          mainWindow.show();
        }
      },
    },
    devTools: {
      label:
        mainWindow && mainWindow.webContents.isDevToolsOpened()
          ? 'Close DevTools'
          : 'Open DevTools',
      click: () => {
        if (mainWindow) {
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
          } else {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
          }
        }
      },
    },
    dock: {
      label: app.dock && app.dock.isVisible() ? 'Hide Dock' : 'Show Dock',
      click: async () => {
        if (app.dock) {
          if (app.dock.isVisible()) {
            await settings.set('dock', false);
            app.dock.hide();
          } else {
            await settings.set('dock', true);
            app.dock.show();
          }
        }
      },
    },
    tray: {
      label: tray && !tray.isDestroyed() ? 'Hide Tray icon' : 'Show Tray icon',
      click: async () => {
        if (tray && !tray.isDestroyed()) {
          await settings.set('tray', false);
          tray.destroy();
          updateContextMenu();
        } else {
          await settings.set('tray', true);
          createTray();
          updateContextMenu();
        }
      },
    },
    separator: {
      type: 'separator',
    },
    dapps: Object.entries(localDapps).map(([name, shortcut]) => {
      return {
        enabled: Boolean(dapps[name]),
        label: name,
        click: () => shell.openExternal(`http://${shortcut}.localhost:8888`),
      };
    }),
    quit: {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  };
}

app.once('ready', async () => {
  // Hide the app from the dock
  if (app.dock && !(await settings.get('dock'))) {
    app.dock.hide();
  }

  if (await settings.get('tray')) {
    createTray();
  }

  updateContextMenu();
});

function createTray() {
  // Create a Tray instance with the icon you want to use for the menu bar
  tray = new Tray(getAssetPath('tray@3x.png'));
  tray.on('mouse-down', (_event) => {
    if (mainWindow?.isVisible()) {
      mainWindow?.focus();
    }
  });
}

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
  .catch(logger.error);

ipcMain.handle('install-ipfs', downloadIpfs);
ipcMain.handle('install-follower', downloadFollower);

ipcMain.handle('ipfs-isInstalled', ipfsIsInstalled);
ipcMain.handle('follower-isInstalled', followerIsInstalled);
ipcMain.handle('ipfs-isRunning', ipfsIsRunning);
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

downloadIpfs();
ipfsDaemon();
const ipfsCheck = setInterval(ipfsDaemon, 10_000);
app.on('will-quit', () => clearInterval(ipfsCheck));

downloadFollower();
followerDaemon();
const followerCheck = setInterval(followerDaemon, 10_000);
app.on('will-quit', () => clearInterval(followerCheck));

ipcMain.handle('dapp', async (_event, ens: string) =>
  dapps[ens] ? `http://${localDapps[ens]}.localhost:8888` : null
);
async function updateAllDapps() {
  Object.keys(dapps).forEach((ens) =>
    getDappHost(ens).then((url) => {
      if (url) {
        dapps[ens] = url;
        updateContextMenu();
      }
    })
  );
}
const dappsUpdater = setInterval(updateAllDapps, 600_000); // 10 minutes
app.on('will-quit', () => clearInterval(dappsUpdater));
waitForIpfs().then(updateAllDapps).catch(logger.error);

http
  .createServer((req, res) => {
    const shortcut = `${req.headers.host}`.replace('.localhost:8888', '');
    const host = Object.keys(localDapps).find(
      (key) => localDapps[key] === shortcut
    );
    if (host && host in dapps && dapps[host]) {
      req.headers.host = dapps[host];
      proxy({ host: '127.0.0.1', port: 8080 }, req, res);
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  })
  .listen(8888, '0.0.0.0');
