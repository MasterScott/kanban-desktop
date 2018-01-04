'use strict';
const { app, BrowserWindow, Menu, shell } = require('electron');
const { download } = require('electron-dl');
const isDev = require('electron-is-dev');
const os = require('os');
const configStore = require('./config');

const appName = app.getName();

const webContents = win => win.webContents || win.getWebContents();

function restoreWindow() {
    const win = BrowserWindow.getAllWindows()[0];
    win.show();
    return win;
}

function sendAction(action) {
    const win = BrowserWindow.getAllWindows()[0];
    win.webContents.send(action);
}

const trayTpl = [
    {
        label: 'Show',
        click() {
            restoreWindow();
        }
    },
    {
        type: 'separator'
    },
    {
        label: `Quit ${appName}`,
        click() {
            app.exit(0);
        }
    }
];

const viewTpl = {
    label: 'View',
    submenu: [
        {
            label: 'Reset Text Size',
            accelerator: 'CmdOrCtrl+0',
            click() {
                configStore.set('zoomLevel', 0);
                sendAction('updateZoomLevel');
            }
        },
        {
            label: 'Increase Text Size',
            accelerator: 'CmdOrCtrl+Plus',
            click() {
                configStore.set('zoomLevel', configStore.get('zoomLevel') + 1);
                sendAction('updateZoomLevel');
            }
        },
        {
            label: 'Decrease Text Size',
            accelerator: 'CmdOrCtrl+-',
            click() {
                configStore.set('zoomLevel', configStore.get('zoomLevel') - 1);
                sendAction('updateZoomLevel');
            }
        }
    ]
};

const darwinTpl = [
    {
        label: `${appName}`,
        submenu: [
            {
                label: `About ${appName}`,
                role: 'about'
            },
            {
                type: 'separator'
            },
            {
                label: 'Services',
                role: 'services',
                submenu: []
            },
            {
                type: 'separator'
            },
            {
                label: `Hide ${appName}`,
                accelerator: 'Cmd+H',
                role: 'hide'
            },
            {
                label: 'Hide Others',
                accelerator: 'Cmd+Shift+H',
                role: 'hideothers'
            },
            {
                label: 'Show All',
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: `Quit ${appName}`,
                accelerator: 'Cmd+Q',
                click() {
                    app.quit();
                }
            }
        ]
    },
    {
        label: "Edit",
        submenu: [
            { 
                label: "Undo", 
                accelerator: "CmdOrCtrl+Z", 
                selector: "undo:" 
            },
            { 
                label: "Redo", 
                accelerator: "Shift+CmdOrCtrl+Z", 
                selector: "redo:" 
            },
            { 
                type: "separator" 
            },
            { 
                label: "Cut", 
                accelerator: "CmdOrCtrl+X", 
                selector: "cut:" 
            },
            { 
                label: "Copy", 
                accelerator: "CmdOrCtrl+C", 
                selector: "copy:" 
            },
            { 
                label: "Paste", 
                accelerator: "CmdOrCtrl+V", 
                selector: "paste:" 
            },
            { 
                label: "Select All", 
                accelerator: "CmdOrCtrl+A", 
                selector: "selectAll:" 
            }
        ]
    },
    viewTpl,
    {
        label: 'Window',
        role: 'window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            },
            {
                type: 'separator'
            },
            {
                label: 'Bring All to Front',
                role: 'front'
            },
            {
                label: 'Toggle Full Screen',
                accelerator: 'Ctrl+Cmd+F',
                click() {
                    const win = BrowserWindow.getAllWindows()[0];
                    win.setFullScreen(!win.isFullScreen());
                }
            }
        ]
    },
    {
        label: 'Help',
        role: 'help'
    }
];

const linuxTpl = [
    viewTpl,
    {
        label: 'Help',
        role: 'help'
    }
];

const winTpl = [
    viewTpl,
    {
        label: 'Help',
        role: 'help'
    }
];

const helpSubmenu = [
    {
        label: `${appName} Website...`,
        click() {
            shell.openExternal('https://github.com/amitkmr/KanbanDesktop');
        }
    },
    {
        label: 'Report an Issue...',
        click() {
            const body = `
**Please succinctly describe your issue and steps to reproduce it.**

-

${app.getName()} ${app.getVersion()}
${process.platform} ${process.arch} ${os.release()}`;

            shell.openExternal(`https://github.com/amitkmr/KanbanDesktop/issues/new?body=${encodeURIComponent(body)}`);
        }
    }
];

let tpl;
if (process.platform === 'darwin') {
    tpl = darwinTpl;
} else if (process.platform === 'win32') {
    tpl = winTpl;
} else {
    tpl = linuxTpl;
}

tpl[tpl.length - 1].submenu = helpSubmenu;

module.exports = {
    mainMenu: Menu.buildFromTemplate(tpl),
    trayMenu: Menu.buildFromTemplate(trayTpl),
};