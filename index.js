const { app, BrowserWindow } = require('electron');
const validateLicense = require('./validate_license'); // Import your validation script

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // 1. Initial check on startup
  if (!validateLicense()) {
    console.error('License invalid or expired on launch. Terminating...');
    process.exit(1);
  }

  // 2. Continuous background check every 30 seconds
  setInterval(() => {
    if (!validateLicense()) {
      console.error('License expired during runtime. Terminating...');
      process.exit(1);
    }
  }, 30000);

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});