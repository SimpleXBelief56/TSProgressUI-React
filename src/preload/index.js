import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  send: (channel, data) => {
    const allowedChannels = ["get-system-info", "get-printers", "printers-ready-to-despawn", "save-selected-printers", "get-deployment-information"];
    if(allowedChannels.includes(channel)){
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const allowedChannels = ["system-info-data", "printers-data", "printers-data-error", "printers-authentication-error", "printers-proc-despawned", "printer-dictionary-saved", "deployment-information"];
    if(allowedChannels.includes(channel)){
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  removeListener: (channel, func) => {
    ipcRenderer.removeListener(channel, func);
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
