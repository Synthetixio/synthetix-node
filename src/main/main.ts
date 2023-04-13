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
import { getDappUrl } from './dapps';

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
  tray?.setContextMenu(generateContextMenu());
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

function generateContextMenu() {
  return Menu.buildFromTemplate([
    {
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
    {
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
    { type: 'separator' },
    ...Object.entries(dapps).map(([name, url]) => {
      return {
        enabled: Boolean(url),
        label: name,
        click: () => {
          if (url) {
            shell.openExternal(url);
          }
        },
      };
    }),
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);
}

app.once('ready', () => {
  // // Hide the app from the dock
  // if (app.dock) {
  //   app.dock.hide();
  // }

  // Create a Tray instance with the icon you want to use for the menu bar
  tray = new Tray(getAssetPath('tray@3x.png'));

  tray.on('mouse-down', (_event) => {
    if (mainWindow?.isVisible()) {
      mainWindow?.focus();
      //     mainWindow.hide();
      //     return;
    }
    //   if (!mainWindow) {
    //     createWindow();
    //   } else {
    //     mainWindow.show();
    //     mainWindow.webContents.focus();
    //   }
  });

  // Set the context menu for the tray icon
  tray?.setContextMenu(generateContextMenu());
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

ipcMain.handle('dapp', async (_event, ens: string) => {
  if (!(ens in dapps)) {
    dapps[ens] = undefined;
  }
  return dapps[ens];
});
async function updateAllDapps() {
  for (const ens of Object.keys(dapps)) {
    dapps[ens] = await getDappUrl(ens);
    updateContextMenu();
  }
}
const dappsUpdater = setInterval(updateAllDapps, 600_000); // 10 minutes
app.on('will-quit', () => clearInterval(dappsUpdater));
waitForIpfs().then(updateAllDapps).catch(logger.error);
