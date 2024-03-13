const { contextBridge, ipcRenderer } = require('electron');

const electronHandler = {
  ipcRenderer: {
    invoke: (func, ...args) => ipcRenderer.invoke(func, ...args),
    send: (channel, ...args) => {
      ipcRenderer.send(channel, ...args);
    },
    on: (channel, listener) => {
      ipcRenderer.on(channel, listener);
    },
    removeListener: (channel, listener) => {
      ipcRenderer.removeListener(channel, listener);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
