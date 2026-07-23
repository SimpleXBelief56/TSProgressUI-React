import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import NTSEnvironment from '../libs/sms'
import Printer from '../libs/printer'
import Authentication from '../libs/authentication'

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const systemInformation = require("systeminformation");
const authentication = new Authentication();
const printers = new Printer();
const ntsEnvironment = new NTSEnvironment();
const args = process.argv.slice(1);
const enableDevAuthority = args.includes("--enable-web-authority");

function CloseProcess(){
  const command = `WMIC PROCESS WHERE Name="notepad.exe" CALL Terminate`;
    
  exec(command, (error, stdout, stderr) => {
    if(error){
      console.log(`Error killing process: ${error.message}`);
    }

    if(stderr){
      console.log(`Stderr: ${stderr}`);
    }

    console.log("Despawned Process");
  });
}


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    // width: 1920,
    // height: 1440,
    fullscreen: true,
    show: false,
    autoHideMenuBar: true,
    kiosk: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.webContents.setZoomFactor(1.0);
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.setIcon(join(__dirname, '../../resources/modern-toolbox-nobg.png'));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Supress Terminal Stdout If Not Present
  if(!process.stdout.isTTY){
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
  }
  console.log(`Args: ${args}`);
  console.log("Enable Web Authority: " + enableDevAuthority);
  console.log(app.getVersion());
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.mdt.tsprogressui');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on("get-deployment-information", async (event) => {
    console.log("Request Deployment Information");
    if(ntsEnvironment.isComObject()){
      ntsEnvironment.getDeploymentStatus().then(deployment => {
        console.log(`Multicast Progress: ${deployment.multicastProgress}`);
        event.reply("deployment-information", deployment);
      });
      // console.log("Deployment Information: ", JSON.stringify(deploymentInformation))
      // event.reply("deployment-information", JSON.stringify(ntsEnvironment.getDeploymentInformation()));
    } else {
      event.reply("deployment-information", {"currentAction": "Deploying Image"});
    }
  });

  // S-IPC Handlers
  ipcMain.on("get-system-info", async(event) => {
    console.log("System Information Request Received");
    try{
      const systemData = await systemInformation.system();
      ntsEnvironment.getDeploymentInformation().then(info => {
        systemData.OSDComputerName = info.computerName;
        event.reply("system-info-data", systemData);
      }).catch(error => {
        // ISComObject Failed / SMS Failed To Hook-On
        event.reply("system-info-data", {error: "Failed to get system information"});
      })
    } catch(error){
      event.reply("system-info-data", {error: "Failed to get system information"});
    }
  });

  ipcMain.on("get-printers", async(event, data) => {
    try{
      console.log("Request to get Printers was sent -> " + JSON.stringify(data));
      await authentication.authenticateUser(data.username, data.password, data.printServer);
      console.log("User authenticated");
      const networkPrintersData = await authentication.getNetworkPrintersData();
      const networkPrinters =  printers.getNetworkPrinters(networkPrintersData);
      console.log(networkPrinters);
      await authentication.deauthenticateUser();
      event.reply("printers-data", JSON.stringify(networkPrinters));
    } catch (error){
      event.reply("printers-authentication-error", "Error: Username Or Password Is Incorrect");
    }
  });

  ipcMain.on("printers-ready-to-despawn", async(event, data) => {
    event.reply("printers-proc-despawned");
    CloseProcess();
  });

  ipcMain.on("save-selected-printers", async (event, data) => {
    console.log("Saving file....");
    const printers = data.printers.join("\n");
    const rootDrive = path.parse(process.cwd()).root;
    const filePath = path.join(rootDrive, "printerdictionary.txt");

    fs.appendFile(filePath, printers + "\n", (error) => {
      event.reply("printer-dictionary-saved");
      console.log("File Saved");
      CloseProcess();
    });
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Prevent Alt-Tab-ing out of the window
app.on("browser-window-blur", (e, bw) => {
  bw.restore();
  bw.focus();
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
