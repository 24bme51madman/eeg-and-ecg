const { app, BrowserWindow, Menu, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

let mainWindow = null;
let localServer = null;
let bluetoothScanTimeout = null;

let latestPacket = {
  ch1: 14.2,
  ch2: -8.4,
  ref: 0.1,
  battery: 92,
  isCharging: false,
  deviceId: 'headband-kortex-01',
  impedance: [6.8, 7.2, 4.2],
  timestamp: Date.now(),
};
let packetCounter = 0;
const sseClients = new Set();

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-ID',
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function createDesktopServer(distDir) {
  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(reqUrl.pathname);

    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-ID',
      });
      res.end();
      return;
    }

    if (pathname === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, {
        status: 'ok',
        hostType: 'desktop',
        activeSubscribers: sseClients.size,
        packetsIngested: packetCounter,
        latestTimestamp: latestPacket.timestamp,
      });
      return;
    }

    if (pathname === '/api/db/status' && req.method === 'GET') {
      sendJson(res, 200, {
        connected: false,
        mode: 'desktop-local',
        message: 'Running in Kortex-Kare Desktop local mode',
      });
      return;
    }

    if (pathname === '/api/db/history' && req.method === 'GET') {
      sendJson(res, 200, { count: 0, logs: [] });
      return;
    }

    if (pathname === '/api/hardware/proxy' && req.method === 'GET') {
      const targetUrl = reqUrl.searchParams.get('url') || 'http://192.168.4.1/data';
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const upstream = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (!upstream.ok) {
          sendJson(res, upstream.status, {
            error: `Upstream returned status ${upstream.status}`,
          });
          return;
        }
        const data = await upstream.json();
        sendJson(res, 200, data);
      } catch (err) {
        sendJson(res, 503, {
          error: 'Device not reachable',
          message: (err && err.message) || 'Connection to http://192.168.4.1/data failed',
        });
      }
      return;
    }

    if (pathname === '/api/telemetry' && req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const now = Date.now();
        let packet;
        if (Array.isArray(body)) {
          packet = {
            ch1: Number(body[0]) || 0,
            ch2: Number(body[1]) || 0,
            ref: Number(body[2]) || 0,
            battery: latestPacket.battery,
            timestamp: now,
          };
        } else {
          packet = {
            ch1: Number(body.ch1 ?? body.fp1 ?? body[0] ?? 0),
            ch2: Number(body.ch2 ?? body.fp2 ?? body[1] ?? 0),
            ref: Number(body.ref ?? body.ground ?? body[2] ?? 0),
            battery: typeof body.battery === 'number' ? body.battery : latestPacket.battery,
            isCharging:
              typeof body.isCharging === 'boolean'
                ? body.isCharging
                : body.charging ?? latestPacket.isCharging,
            deviceId: body.deviceId || 'kortex-headband-desktop',
            impedance:
              Array.isArray(body.impedance) && body.impedance.length === 3
                ? [Number(body.impedance[0]), Number(body.impedance[1]), Number(body.impedance[2])]
                : latestPacket.impedance,
            ecgMv:
              typeof body.ecgMv === 'number'
                ? body.ecgMv
                : typeof body.ecg === 'number'
                  ? body.ecg
                  : undefined,
            heartRateBpm:
              typeof body.heartRateBpm === 'number'
                ? body.heartRateBpm
                : typeof body.hr === 'number'
                  ? body.hr
                  : undefined,
            delta: typeof body.delta === 'number' ? body.delta : undefined,
            theta: typeof body.theta === 'number' ? body.theta : undefined,
            alpha: typeof body.alpha === 'number' ? body.alpha : undefined,
            beta: typeof body.beta === 'number' ? body.beta : undefined,
            leadsOff: typeof body.leadsOff === 'boolean' ? body.leadsOff : undefined,
            timestamp: now,
          };
        }
        latestPacket = packet;
        packetCounter += 1;

        const message = `data: ${JSON.stringify(packet)}\n\n`;
        for (const client of sseClients) {
          try {
            client.write(message);
          } catch {
            sseClients.delete(client);
          }
        }

        sendJson(res, 200, {
          success: true,
          packetsIngested: packetCounter,
          subscribersNotified: sseClients.size,
        });
      } catch (err) {
        sendJson(res, 400, { error: (err && err.message) || 'Invalid telemetry payload' });
      }
      return;
    }

    if (pathname === '/api/telemetry/latest' && req.method === 'GET') {
      sendJson(res, 200, {
        latestPacket,
        totalPackets: packetCounter,
        activeSubscribers: sseClients.size,
        serverTime: Date.now(),
      });
      return;
    }

    if (pathname === '/api/telemetry/stream' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      sseClients.add(res);
      res.write(`data: ${JSON.stringify(latestPacket)}\n\n`);

      const heartbeat = setInterval(() => {
        try {
          res.write(`: heartbeat ${Date.now()}\n\n`);
        } catch {
          clearInterval(heartbeat);
          sseClients.delete(res);
        }
      }, 12000);

      req.on('close', () => {
        clearInterval(heartbeat);
        sseClients.delete(res);
      });
      return;
    }

    // Static asset serving from dist/
    const safeRelative = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = path.join(distDir, safeRelative === '/' || safeRelative === '\\' ? 'index.html' : safeRelative);

    if (!filePath.startsWith(distDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Failed to load application asset');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });

  return server;
}

function listenDesktopServer(server) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      if (err && err.code === 'EADDRINUSE') {
        server.removeListener('error', onError);
        server.listen(0, '127.0.0.1', () => {
          const addr = server.address();
          resolve(typeof addr === 'object' && addr ? addr.port : 3000);
        });
      } else {
        reject(err);
      }
    };

    server.once('error', onError);
    server.listen(3000, '127.0.0.1', () => {
      server.removeListener('error', onError);
      const addr = server.address();
      resolve(typeof addr === 'object' && addr ? addr.port : 3000);
    });
  });
}

function buildAppMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Print / Save PDF Report',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.print({ printBackground: true });
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'close' }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  const distDir = path.join(__dirname, '..', 'dist');
  localServer = createDesktopServer(distDir);
  const port = await listenDesktopServer(localServer);

  const iconPath = path.join(
    __dirname,
    '..',
    'desktop-assets',
    process.platform === 'win32' ? 'icon.ico' : 'icon.png',
  );

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 390,
    minHeight: 680,
    title: 'Kortex-Kare',
    backgroundColor: '#F6F5F0',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Support Web Bluetooth device selection inside Desktop Chromium
  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    if (bluetoothScanTimeout) {
      clearTimeout(bluetoothScanTimeout);
      bluetoothScanTimeout = null;
    }

    const preferred = deviceList.find((d) =>
      /kortex|eeg|ecg|esp32|nRF|headband/i.test(d.deviceName || ''),
    );
    if (preferred) {
      callback(preferred.deviceId);
      return;
    }

    if (deviceList.length > 0) {
      bluetoothScanTimeout = setTimeout(() => {
        callback(deviceList[0].deviceId);
      }, 1500);
    } else {
      bluetoothScanTimeout = setTimeout(() => {
        callback('');
      }, 6000);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1') || url.startsWith('blob:') || url.startsWith('about:')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.kortexkare.app');
    }
    buildAppMenu();
    await createWindow();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (bluetoothScanTimeout) {
    clearTimeout(bluetoothScanTimeout);
    bluetoothScanTimeout = null;
  }
  for (const client of sseClients) {
    try {
      client.end();
    } catch {
      // ignore
    }
  }
  sseClients.clear();
  if (localServer) {
    localServer.close();
    localServer = null;
  }
});
