const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('kortexDesktop', {
  isDesktop: true,
  platform: process.platform,
});
