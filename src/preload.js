const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('env', {
  API_URL: process.env.API_URL,
  PROJECTID: process.env.PROJECTID,
});

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
