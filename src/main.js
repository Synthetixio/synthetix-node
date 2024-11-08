const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {BrowserWindow, Menu, Tray, app, ipcMain, session, shell} = require('electron');
const logger = require('electron-log');
const {SYNTHETIX_NODE_APP_CONFIG} = require('./const');
const {DAPPS, resolveDapp} = require('./main/dapps');
const {
  configureFollower,
  downloadFollower,
  follower,
  followerDaemon,
  followerId,
  followerIsInstalled,
  followerTeardown,
} = require('./main/follower');
const {
  configureIpfs,
  downloadIpfs,
  ipfsDaemon,
  ipfsIsInstalled,
  ipfsIsRunning,
  ipfsTeardown,
  rpcRequest,
  waitForIpfs,
} = require('./main/ipfs');
const {fetchPeers} = require('./main/peers');
const settings = require('./main/settings');
const {ROOT} = require('./main/settings');

logger.transports.file.level = 'info';

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

fs.rmSync(path.join(ROOT, 'ipfs.pid'), {force: true});
fs.rmSync(path.join(ROOT, 'ipfs-cluster-follow.pid'), {force: true});

let tray = null;
let mainWindow = null;

function updateContextMenu() {
  const menu = generateMenuItems();
  if (tray && !tray.isDestroyed()) {
    tray.setContextMenu(
      Menu.buildFromTemplate([
        menu.app,
        menu.autoStart,
        menu.devTools,
        menu.dock,
        {type: 'separator'},
        ...menu.dapps,
        {type: 'separator'},
        menu.quit,
      ])
    );
  }

  if (app.dock) {
    app.dock.setMenu(
      Menu.buildFromTemplate([
        menu.app,
        menu.autoStart,
        menu.devTools,
        menu.tray,
        {type: 'separator'},
        ...menu.dapps,
      ])
    );
    if (isDebug) {
      app.dock.setIcon(path.join(app.getAppPath(), 'assets/icon.png'));
    }
  }
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
    // frame: false,
    icon: isDebug ? path.join(app.getAppPath(), 'assets/icon.ico') : undefined,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  if (isDebug) {
    mainWindow.webContents.openDevTools({mode: 'detach'});
  }

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return {action: 'deny'};
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
        updateContextMenu();
      },
    },
    autoStart: {
      label: app.getLoginItemSettings().openAtLogin ? 'Disable AutoStart' : 'Enable AutoStart',
      click: () => {
        const settings = app.getLoginItemSettings();
        settings.openAtLogin = !settings.openAtLogin;
        app.setLoginItemSettings(settings);
        updateContextMenu();
      },
    },
    devTools: {
      label: mainWindow?.webContents.isDevToolsOpened() ? 'Close DevTools' : 'Open DevTools',
      click: () => {
        if (mainWindow) {
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
          } else {
            mainWindow.webContents.openDevTools({mode: 'detach'});
          }
        }
        updateContextMenu();
      },
    },
    dock: {
      label: app.dock?.isVisible() ? 'Hide Dock' : 'Show Dock',
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
        updateContextMenu();
      },
    },
    tray: {
      label: tray && !tray.isDestroyed() ? 'Hide Tray icon' : 'Show Tray icon',
      click: async () => {
        if (tray && !tray.isDestroyed()) {
          await settings.set('tray', false);
          tray.destroy();
        } else {
          await settings.set('tray', true);
          createTray();
        }
        updateContextMenu();
      },
    },
    separator: {
      type: 'separator',
    },
    dapps: DAPPS.map((dapp) => {
      return {
        enabled: Boolean(dapp.url),
        label: dapp.label,
        click: () => shell.openExternal(`http://${dapp.id}.localhost:8888`),
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
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "connect-src 'self' http://45.146.7.38:3005 wss://relay.walletconnect.org https://pulse.walletconnect.org https://api.web3modal.org https://rpc.walletconnect.org https://sepolia.optimism.io",
        ],
      },
    });
  });

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
  tray = new Tray(path.join(__dirname, '../../assets/tray@3x.png'));
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
ipcMain.handle('follower-isRunning', () =>
  fs.promises.readFile(path.join(ROOT, 'ipfs-cluster-follow.pid'), 'utf8').catch(() => null)
);

ipcMain.handle('run-ipfs', async () => {
  await configureIpfs();
  await ipfsDaemon();
});

ipcMain.handle('run-follower', async () => {
  await configureFollower();
  await followerDaemon();
});

ipcMain.handle('ipfs-peers', () => rpcRequest('swarm/peers'));
ipcMain.handle('ipfs-id', () => followerId());
ipcMain.handle('ipfs-repo-stat', () => rpcRequest('repo/stat'));
ipcMain.handle('ipfs-stats-bw', () => rpcRequest('stats/bw'));
ipcMain.handle('ipfs-follower-info', () => follower('synthetix info'));

app.on('will-quit', ipfsTeardown);
app.on('will-quit', followerTeardown);

downloadIpfs();
ipfsDaemon();
const ipfsCheck = setInterval(ipfsDaemon, 10_000);
app.on('will-quit', () => clearInterval(ipfsCheck));

downloadFollower();
followerDaemon();
const followerCheck = setInterval(followerDaemon, 10_000);
app.on('will-quit', () => clearInterval(followerCheck));

ipcMain.handle('dapps', async () => {
  return DAPPS.map((dapp) => ({
    ...dapp,
    url: dapp.url ? `http://${dapp.id}.localhost:8888` : null,
  }));
});
ipcMain.handle('dapp', async (_event, id) => {
  const dapp = DAPPS.find((dapp) => dapp.id === id);
  return dapp?.url ? `http://${dapp.id}.localhost:8888` : null;
});

async function resolveAllDapps() {
  for (const dapp of DAPPS) {
    await resolveDapp(dapp).then(updateContextMenu);
  }
}

const dappsResolver = setInterval(resolveAllDapps, 600_000); // 10 minutes
app.on('will-quit', () => clearInterval(dappsResolver));
waitForIpfs().then(resolveAllDapps).catch(logger.error);

async function updateConfig() {
  const config = JSON.parse(await rpcRequest('cat', [`/ipns/${SYNTHETIX_NODE_APP_CONFIG}`]));
  logger.log('App config fetched', config);
  if (config.dapps) {
    const oldDapps = DAPPS.splice(0);
    for (const dapp of config.dapps) {
      const oldDapp = oldDapps.find((d) => d.id === dapp.id);
      if (oldDapp) {
        DAPPS.push(Object.assign({}, oldDapp, dapp));
      } else {
        DAPPS.push(dapp);
      }
    }
    logger.log('Dapps updated', DAPPS);
    await resolveAllDapps();
  }
}

let dappsUpdaterTimer = null;

async function debouncedDappsUpdater() {
  if (dappsUpdaterTimer) {
    clearTimeout(dappsUpdaterTimer);
    dappsUpdaterTimer = null;
  }
  try {
    await updateConfig();
  } catch (error) {
    logger.error(error);
  }
  // On initial load keep updater interval short and extend to 10m when dapps are already resolved
  dappsUpdaterTimer = setTimeout(debouncedDappsUpdater, DAPPS.length > 0 ? 600_000 : 10_000);
}

waitForIpfs().then(debouncedDappsUpdater).catch(logger.error);

ipcMain.handle('peers', async () => fetchPeers());

http
  .createServer(async (req, res) => {
    const id = `${req.headers.host}`.replace('.localhost:8888', '');
    const dapp = DAPPS.find((dapp) => dapp.id === id);
    if (dapp?.qm) {
      try {
        const response = await fetch(`http://127.0.0.1:8080/ipfs/${dapp.qm}${req.url}`);
        if (response.status !== 404) {
          res.writeHead(response.status, {
            'Content-Length': response.headers.get('content-length'),
            'Content-Type': response.headers.get('content-type'),
          });
          res.end(Buffer.from(await response.arrayBuffer()));
          return;
        }
      } catch (e) {
        logger.error(e);
        res.writeHead(500);
        res.end(e.message);
        return;
      }
    }
    res.writeHead(404);
    res.end('Not found');
  })
  .listen(8888, '0.0.0.0');
