/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, Tray, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

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

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 512,
    height: 364,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

app.on('ready', () => {
  // Hide the app from the dock
  if (app.dock) {
    app.dock.hide();
  }

  // Create a Tray instance with the icon you want to use for the menu bar
  tray = new Tray(getAssetPath('synthetix_icon.png'));

  // Create a Menu instance with the options you want
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open App',
      click: () => {
        if (!mainWindow) {
          createWindow();
        } else {
          mainWindow.show();
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
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

const { exec } = require('child_process');

ipcMain.on('ipfs-peers', (event) => {
  exec('ipfs swarm peers', (error: any, stdout: any, stderr: any) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    event.sender.send('ipfs-peers-result', stdout);
  });
});

ipcMain.on('ipfs-id', (event) => {
  exec('ipfs id', (error: any, stdout: any, stderr: any) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    event.sender.send('ipfs-id-result', stdout);
  });
});

ipcMain.on('ipfs-repo-stat', (event) => {
  exec('ipfs repo stat', (error: any, stdout: any, stderr: any) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    event.sender.send('ipfs-repo-stat-result', stdout);
  });
});

ipcMain.on('ipfs-stats-bw', (event) => {
  exec('ipfs stats bw', (error: any, stdout: any, stderr: any) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    event.sender.send('ipfs-stats-bw-result', stdout);
  });
});

ipcMain.on('ipfs-follow-state', (event) => {
  exec(
    'ipfs-cluster-follow synthetix state',
    (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      event.sender.send('ipfs-follow-state-result', stdout);
    }
  );
});

// Copy/paste from https://github.com/Synthetixio/ipfs-follower/blob/master/install-macos.sh for now
const INSTALL_IPFS_COMMAND = `

`;

const INSTALL_FOLLOW_COMMAND = `
#!/bin/bash

# Determine macOS architecture
ARCH=$(uname -m)

# Check if the system is running on ARM or x86_64 architecture
if [ "$ARCH" = "arm64" ]; then
  ARCH="arm64"
elif [ "$ARCH" = "x86_64" ]; then
  ARCH="amd64"
else
  echo "Unsupported architecture."
  exit 1
fi

function install_ipfs_cluster_follow() {
  echo "Checking for existing ipfs-cluster-follow installation..."

  # Get the latest version of ipfs-cluster-follow
  VERSIONS_URL="https://dist.ipfs.tech/ipfs-cluster-follow/versions"
  LATEST_VERSION=$(curl -sSL $VERSIONS_URL | tail -n 1)
  LATEST_VERSION_NUMBER=\${LATEST_VERSION#*v}

  # Check if ipfs-cluster-follow is already installed
  if command -v ipfs-cluster-follow &> /dev/null; then
    INSTALLED_VERSION=$(ipfs-cluster-follow --version | awk '{print $3}')

    if [ "$INSTALLED_VERSION" == "$LATEST_VERSION_NUMBER" ]; then
      echo "ipfs-cluster-follow version $INSTALLED_VERSION is already installed."
      return
    else
      echo "Updating ipfs-cluster-follow from version $INSTALLED_VERSION to $LATEST_VERSION_NUMBER"
    fi
  else
    echo "Installing ipfs-cluster-follow version $LATEST_VERSION_NUMBER"
  fi

  # Download the latest version
  DOWNLOAD_URL="https://dist.ipfs.tech/ipfs-cluster-follow/\${LATEST_VERSION}/ipfs-cluster-follow_\${LATEST_VERSION}_darwin-\${ARCH}.tar.gz"
  echo "DOWNLOAD_URL=$DOWNLOAD_URL"
  curl -sSL -o ipfs-cluster-follow.tar.gz $DOWNLOAD_URL

  # Extract the binary
  tar -xzf ipfs-cluster-follow.tar.gz
  rm ipfs-cluster-follow.tar.gz

  # Move the binary to /usr/local/bin or another directory in your $PATH
  mv ipfs-cluster-follow/ipfs-cluster-follow /usr/local/bin/
  rm -r ipfs-cluster-follow

  # Check if the installation was successful
  if ipfs-cluster-follow --version | grep -q "ipfs-cluster-follow version"; then
    echo "ipfs-cluster-follow version $(ipfs-cluster-follow --version | awk '{print $4}') installed successfully."
  else
    echo "Installation failed."
    exit 1
  fi
}

function configure_ipfs_cluster_follow() {
  echo "Configuring ipfs-cluster-follow..."

  # Initialize ipfs-cluster-follow
  ipfs-cluster-follow synthetix init "http://127.0.0.1:8080/ipns/k51qzi5uqu5dmdzyb1begj16z2v5btbyzo1lnkdph0kn84o9gmc2uokpi4w54c"

  echo "ipfs-cluster-follow has been configured successfully."
}

install_ipfs_cluster_follow
configure_ipfs_cluster_follow


# Check if ipfs-daemon is already loaded
if launchctl list | grep -q "ipfs-cluster-follow"; then
  echo "Unloading existing ipfs-cluster-follow service..."
  launchctl unload ~/Library/LaunchAgents/ipfs-cluster-follow.plist
fi

# Load and start ipfs-daemon service
echo "Loading ipfs-cluster-follow service..."
launchctl load -w ~/Library/LaunchAgents/ipfs-cluster-follow.plist

echo "ipfs-cluster-follow autoloader has been installed successfully."

echo "IPFS and ipfs-cluster-follow have been installed and configured successfully."
`;

ipcMain.on('install-ipfs', (event) => {
  exec(INSTALL_IPFS_COMMAND, (error: any, stdout: any, stderr: any) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    event.sender.send('install-ipfs-result', stdout);
  });
});

ipcMain.on('install-follow', (event) => {
  exec(INSTALL_FOLLOW_COMMAND, (error: any, stdout: any, stderr: any) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    event.sender.send('install-follow-result', stdout);
  });
});
