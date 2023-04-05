// Disable no-unused-vars, broken for spread args
import type { IpcRendererEvent } from 'electron';
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

const electronHandler = {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
    on: (
      channel: string,
      listener: (event: IpcRendererEvent, ...args: any[]) => void
    ) => {
      ipcRenderer.on(channel, listener);
    },
    removeListener: (
      channel: string,
      listener: (event: IpcRendererEvent, ...args: any[]) => void
    ) => {
      ipcRenderer.removeListener(channel, listener);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
