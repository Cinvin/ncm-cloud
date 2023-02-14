import axios from 'axios'
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
const server = require('NeteaseCloudMusicApi/server')
const { cloud,cloud_match,user_cloud_del } = require('NeteaseCloudMusicApi')

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'ncmCloud',
    width: 1080,
    height: 720,
    minWidth: 1080,
    minHeight: 720,
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    shell.openExternal(url)
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

app.on('ready', () => {
  //ncmapi
  server.serveNcmApi({
    port: 21879,
  }).then((res: any) => {
    const neteaseMusicAPI = res
  })
})
app.whenReady().then(() => {
  ipcMain.on('upload-files', uploadFiles)
  ipcMain.handle('get-data',getData)
})
// ipcMain.handle('get-data', (_ev, url: string) => {
//   getData(_ev,url)
// })

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})


async function uploadFiles(event, tasks) {
  // console.log(tasks)
  if (tasks.data.length == 0) return
  let limit = Math.min(2, tasks.data.length)
  let Pool: Promise<number>[] = []
  let currentTaskIndex = 0
  while (currentTaskIndex < limit) {
    
    Pool.push(uploadFile(tasks.data[currentTaskIndex], currentTaskIndex,tasks.cookie))
    currentTaskIndex++;
  }
  while (currentTaskIndex < tasks.data.length) {
    await Promise.race(Pool).then((finishPoolIndex: number) => {
      Pool[finishPoolIndex] = uploadFile(tasks.data[currentTaskIndex], finishPoolIndex,tasks.cookie)
      currentTaskIndex += 1
    })
  }
  if (Pool.length > 0) {
    Promise.all(Pool).then(() => {
      win.webContents.send('task-finnsh', )
    })
  }
  else {
    win.webContents.send('task-finnsh', )
  }
}

function uploadFile(task, poolIndex = 0,cookie:string) {
  task.status = '下载中'
  task.sort = 2
  win.webContents.send('task-status', task)

  return axios.get(task.miguURL,
    {
      responseType: "arraybuffer",
    })
    .then(async (res) => {
      if (res.status != 200) {
        task.status = '下载失败'
        task.sort = 4
        win.webContents.send('task-status', task)
        return poolIndex
      }
      
      //let buffer =Buffer.from([res.data]) 
      let fileName = `${task.songName}.${task.fileType}`
      let mimetype = undefined
      if (task.fileType=='flac'){
        mimetype='audio/x-flac'
      }
      else if(task.fileType=='mp3'){
        mimetype='audio/mpeg'
      }
      // console.log(res)
      task.status = '上传中'
      task.sort = 1
      win.webContents.send('task-status', task)
      await cloud({
        songFile: {
          name: fileName,
          data: res.data,
          mimetype:mimetype,
        },
        cookie:cookie,
      })
      .then(async (res: any) => {
        if (res.code && res.code !== 200 && res.message) {
          task.status = '上传失败:' + res.message
          task.sort = 4
          win.webContents.send('task-status', task)
          return poolIndex
        }
        else {
          task.status = '已上传'
          if (res.body.privateCloud.songId != task.ncmSongId) {
            if (task.isInCloud) {
              user_cloud_del({id:task.ncmSongId,cookie:cookie})
                .then(() => {
                  task.isInCloud = false
                  cloud_match({ sid: res.body.privateCloud.songId, asid: task.ncmSongId,cookie:cookie }).then(() => {
                    task.status = '已完成'
                    task.sort = 5
                    win.webContents.send('task-status', task)
                    return poolIndex
                  })
                })
                .catch((err) => {
                  task.status = '上传失败:' + err
                  task.sort = 4
                  win.webContents.send('task-status', task)
                  return poolIndex
                })
            }
            else {
              cloud_match({ sid: res.body.privateCloud.songId, asid: task.ncmSongId,cookie:cookie }).then(() => {
                task.status = '已完成'
                task.sort = 5
                win.webContents.send('task-status', task)
                return poolIndex
              })
            }
          }
          else {
            task.status = '已完成'
            task.sort = 5
            win.webContents.send('task-status', task)
            return poolIndex
          }
        }
        return poolIndex
      })
        .catch((err) => {
          console.log(err)
          task.status = '上传失败:' + err
          task.sort = 4
          win.webContents.send('task-status', task)
          return poolIndex
        })
      return poolIndex
    })
    .catch((err) => {
      task.status = '任务失败:' + err
      task.sort = 4
      win.webContents.send('task-status', task)
      return poolIndex
    })
}

async function getData (event, url) {
  return await axios.get(url)
  .then((res)=>{
    // console.log(res)
    return res.data
  })
}