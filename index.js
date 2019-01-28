'use strict';
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');
const { app, BrowserWindow, shell, Tray, Menu } = require('electron');
const appMenu = require('./menu');
const configStore = require('./config');

let mainWindow;
let appIcon;

// Make Focus Window every single hour to update the Tasks
schedule.scheduleJob('0 * * * *', function () {
    let win = BrowserWindow.getAllWindows()[0];
    if (win) {
        win.show();
    }
});


function updateBadge(title) {
    const isOSX = Boolean(app.dock);

    const timer = (/([-0-9]{2}:[-0-9]{2})/).exec(title);
    if (isOSX) {
        app.dock.setBadge(timer ? timer[0] : '');
    }

    if (timer) {
        appIcon.setTitle(timer[0]);
        appIcon.setImage(path.join(__dirname, 'media', 'logo-tray-blue.png'));
    } else {
        appIcon.setImage(path.join(__dirname, 'media', 'logo-tray.png'));
        const win = BrowserWindow.getAllWindows()[0];
        win.show();
    }
}

function createMainWindow() {
    const windowStateKeeper = require('electron-window-state');

    const mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    });

    require('electron-context-menu')({
        // prepend: (params, browserWindow) => [{
        //     // label: 'Rainbow',
        //     // // Only show it when right-clicking images
        //     // visible: true
        // }]
    });

    const win = new BrowserWindow({
        title: app.getName(),
        show: false,
        icon: process.platform === 'linux' && path.join(__dirname, 'media', 'logo.png'),
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 400,
        minHeight: 200,
        webPreferences: {
            preload: path.join(__dirname, 'browser.js'),
            nodeIntegration: false,
            webSecurity: false,
            plugins: true
        },
        icon: path.join(__dirname, 'media/icon.png')
    });

    mainWindowState.manage(win);

    win.loadURL('https://kanbanflow.com/', {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
    });
    win.on('closed', () => app.quit);
    win.on('page-title-updated', (e, title) => updateBadge(title));
    win.on('close', e => {
        if (process.platform === 'darwin' && !win.forceClose) {
            e.preventDefault();
            win.hide();
        } else if (process.platform === 'win32' && configStore.get('closeToTray')) {
            win.hide();
            e.preventDefault();
        }
    });
    win.on('minimize', () => {
        if (process.platform === 'win32' && configStore.get('minimizeToTray')) {
            win.hide();
        }
    });
    return win;
}

function createTray() {
    appIcon = new Tray(path.join(__dirname, 'media', 'logo-tray.png'));
    appIcon.setPressedImage(path.join(__dirname, 'media', 'logo-tray-white.png'));
    appIcon.setContextMenu(appMenu.trayMenu);

    appIcon.on('double-click', () => {
        mainWindow.show();
    });
}


app.on('ready', () => {
    Menu.setApplicationMenu(appMenu.mainMenu);

    mainWindow = createMainWindow();
    createTray();

    const page = mainWindow.webContents;

    page.on('dom-ready', () => {
        page.insertCSS(fs.readFileSync(path.join(__dirname, 'theme.css'), 'utf8'));
        mainWindow.show();
    });

    page.on('new-window', (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
    });

    page.on('did-finish-load', () => {
        mainWindow.setTitle(app.getName());
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    mainWindow.forceClose = true;
});

app.on('activate', () => {
    mainWindow.show();
});
