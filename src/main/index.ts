import * as commandLineArgs from 'command-line-args';

import { app, BrowserWindow, ipcMain } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { enableLiveReload } from 'electron-compile';
import * as download from 'download';
import * as path from 'path';

import { InjectionResult, Injector } from '../common/injector';
import TAModsUpdater from '../common/updater';
import { downloadLauncherNews } from '../common/launcher-news';

const allowedCliOptions: commandLineArgs.OptionDefinition[] = [
  { name: 'inject', alias: 'i', type: Boolean },
  { name: 'pid', alias: 'p', type: Number },
  { name: 'processname', alias: 'n', type: String },
  { name: 'dll', alias: 'd', type: String }
];

// Handle installer first-time run
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

let mainWindow: Electron.BrowserWindow | null = null;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) {
  enableLiveReload({strategy: 'react-hmr'});
}

const createWindow = async () => {
  // Parse command line options
  let cliOptions;
  try {
    cliOptions = commandLineArgs(allowedCliOptions);
  } catch (err) {
    console.error(`Failed to parse command line arguments: ${err}`);
    process.exit(InjectionResult.UNKNOWN_ERROR);
  }

  if ('inject' in cliOptions) {
    // Should specify dll path, and exactly one of pid, processname
    if (!('dll' in cliOptions) || (('pid' in cliOptions) == ('processname' in cliOptions))) {
      process.exit(InjectionResult.WRONG_NUMBER_OF_ARGUMENTS);
    } else {
      let result: InjectionResult;
      if ('pid' in cliOptions) {
        console.log(`Injecting dll ${cliOptions.dll} into process with pid ${cliOptions.pid}`);
        result = await Injector.injectByPID(cliOptions.pid, cliOptions.dll);
      } else {
        console.log(`Injecting dll ${cliOptions.dll} into process with name ${cliOptions.processname}`);
        result = await Injector.injectByName(cliOptions.processname, cliOptions.dll);
      }
      console.log(`Injection completed with code: ${result}`);
      process.exit(result);
    }
  }

  // Load the app configuration
  // launcherConfig = await loadLauncherConfig(`${app.getPath('userData')}/launcherConfig.json`);
  console.log(__dirname);

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    frame: false,
    icon: path.join(__dirname, 'icon.ico')
  });

  // Pass the appdata path to the renderer process
  // because can't get the userData path from the render process :'(
  // Also, have to stop ts from complaining about adding an extra field
  // @ts-ignore
  mainWindow.userDataPath = app.getPath('userData');

  // Pass the user's config folder location to the renderer process
  // @ts-ignore
  mainWindow.userConfigPath = await TAModsUpdater.getConfigDirectory();

  // Also pass in argv - need to know how the main process was started
  // so that it can be started in injection mode on button press
  // @ts-ignore
  mainWindow.mainProcessArgv = process.argv;

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/../renderer/index.html`);

  // Clicking links should open in the browser, not the electron window
  const handleRedirect = (e: Electron.Event, url: string) => {
    if (url != mainWindow!.webContents.getURL()) {
      e.preventDefault();
      require('electron').shell.openExternal(url);
    }
  };

  mainWindow.webContents.on('will-navigate', handleRedirect);
  mainWindow.webContents.on('new-window', handleRedirect);

  // Open the DevTools.
  if (isDevMode) {
    await installExtension(REACT_DEVELOPER_TOOLS);
    mainWindow.webContents.openDevTools();
  }

  ipcMain.on('update-check-start-request', async (event: any, args: any) => {
    const result = await TAModsUpdater.isUpdateRequired(args[0], args[1], args[2]).catch(err => false);
    event.sender.send('update-check-finished-request', result);
  });

  ipcMain.on('update-start-request', async (event: any, args: any) => {
    await TAModsUpdater.update(args[0], args[1], false, args[2], mainWindow);
    event.sender.send('update-finished-request');
  });

  ipcMain.on('uninstall-start-request', async (event: any, args: any) => {
    await TAModsUpdater.uninstall(args[0], args[1]);
    event.sender.send('uninstall-finished-request');
  });

  ipcMain.on('retrieve-ini-request', async (event: any, args: any) => {
    try {
      const result = await download(args[0]);
      event.sender.send('retrieve-ini-finished', [true, result]);
    } catch (err) {
      event.sender.send('retrieve-ini-finished', [false, err]);
    }
  });

  ipcMain.on('news-request', async (event: any, newsUrl: string) => {
    let result;
    try {
      result = await downloadLauncherNews(newsUrl);
    } catch (err) {
      event.sender.send('news-retrieved', [false, err]);
      return;
    }
    event.sender.send('news-retrieved', [true, result]);
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// When app is about to quit
app.on('will-quit', () => {
  // Save the launcher config
  // if (launcherConfig) {
  //   saveLauncherConfig(launcherConfig, `${app.getPath('userData')}/launcherConfig.json`);
  // }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
