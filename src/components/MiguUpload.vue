<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, computed } from 'vue'
import { getSearch } from '../api/search'
import { searchSinger, searchAlbum } from '../api/migu'
import { generateSingerTasks, generateAlbumTasks } from '../utils/migu2ncm'
import { useMessageStore } from '../stores/message'
import { useTaskStatusStore } from '../stores/taskStatus'
import { storeToRefs } from 'pinia'
import { shell, ipcRenderer } from 'electron'
import { getCookie } from '../utils/auth'

let MessageStore = useMessageStore()
let TaskStatusStore = useTaskStatusStore()
let { working } = storeToRefs(TaskStatusStore)
let itemType = ref(1)
let selectorData: { name: string, id: number, obj: any }[] = []
let dialogSelector = reactive({
  visiable: false,
  data: selectorData,
  loading: false,
  selectedName: '',
  selectedId: '',
  platform: '',
  keyword: '',
  resourceType: '',
})

let miguSingerTaget = reactive({
  id: '',
  name: '',
  link() {
    return `https://music.migu.cn/v3/music/artist/${this.id}`
  }
})
let ncmSingerTaget = reactive({
  id: 0,
  name: '',
  link() {
    return `https://music.163.com/artist?id=${this.id}`
  }
})

let miguAlbumTaget = reactive({
  id: '',
  name: '',
  resourceType: '',
  link() {
    if (this.resourceType == '2003') {
      return `https://music.migu.cn/v3/music/album/${this.id}`
    }
    else if (this.resourceType == '5') {
      return `https://music.migu.cn/v3/music/digital_album/${this.id}`
    }
    return ''
  }
})
let ncmAlbumTaget = reactive({
  id: 0,
  name: '',
  link() {
    return `https://music.163.com/album?id=${this.id}`
  }
})

let miguSongTaget = reactive({
  id: '',
  name: '',
  songItem: <any>null,
  link() {
    return `https://music.migu.cn/v3/music/song/${this.id}`
  }
})
let ncmSongTaget = reactive({
  id: 0,
  name: '',
  link() {
    return `https://music.163.com/song?id=${this.id}`
  }
})

let limitOption = reactive({
  CopyRight: false,
  VIP: false,
  FLAC: false,
})

let taskListData: { ncmSongId: any; migucontentId: any; miguURL: string; miguformatType: string; fileType: string; songName: any; albumName: any; artists: any; isInCloud: boolean; isNoCopyRight: boolean; isVIP: boolean; status: string; sort: number; progress: number; }[]
taskListData = []
let taskList = reactive({
  data: taskListData,
})

let statusDesc = ref('')

function openExternal(url: string) {
  shell.openExternal(url)
}

function OpenDialogSelector(platform: string) {
  dialogSelector.platform = platform
  dialogSelector.visiable = true
}

function fetchDialogData() {
  if (itemType.value === 1) {
    if (dialogSelector.platform === 'ncm') {
      getSearch({ keywords: dialogSelector.keyword, type: 100, limit: 10 })
        .then((res: any) => {
          dialogSelector.data = res.result.artists
        })
    }
    else {
      searchSinger(dialogSelector.keyword)
        .then((res: any) => {
          dialogSelector.data = res
        })
    }
  }
  else if (itemType.value === 2) {
    if (dialogSelector.platform === 'ncm') {
      getSearch({ keywords: dialogSelector.keyword, type: 10, limit: 10 })
        .then((res: any) => {
          dialogSelector.data = res.result.albums
        })
    }
    else {
      searchAlbum(dialogSelector.keyword)
        .then((res: any) => {
          dialogSelector.data = res
        })
    }
  }
}

const handleSelectTableCurrentChange = (val: any | undefined) => {
  if (val) {
    dialogSelector.selectedId = val.id
    dialogSelector.selectedName = val.name
    if (dialogSelector.platform == 'migu' && val.resourceType) {
      dialogSelector.resourceType = val.resourceType
    }
  }
}
function handleSelected() {
  if (dialogSelector.platform == 'migu') {
    if (itemType.value == 1) {
      miguSingerTaget.id = dialogSelector.selectedId.toString()
      miguSingerTaget.name = dialogSelector.selectedName
    }
    else if (itemType.value == 2) {
      miguAlbumTaget.id = dialogSelector.selectedId.toString()
      miguAlbumTaget.name = dialogSelector.selectedName
      miguAlbumTaget.resourceType = dialogSelector.resourceType
    }
  }
  else if (dialogSelector.platform == 'ncm') {
    if (itemType.value == 1) {
      ncmSingerTaget.id = Number(dialogSelector.selectedId)
      ncmSingerTaget.name = dialogSelector.selectedName
    }
    else if (itemType.value == 2) {
      ncmAlbumTaget.id = Number(dialogSelector.selectedId)
      ncmAlbumTaget.name = dialogSelector.selectedName
    }
  }
  autoFillAnother()
  dialogSelector.selectedId = ''
  dialogSelector.selectedName = ''
  dialogSelector.platform = ''
  dialogSelector.keyword = ''
  dialogSelector.resourceType = ''
  dialogSelector.data.splice(0, dialogSelector.data.length);
  dialogSelector.visiable = false
}
const dialogBeforeClose = (done: () => void) => {
  dialogSelector.selectedId = ''
  dialogSelector.selectedName = ''
  dialogSelector.platform = ''
  dialogSelector.keyword = ''
  dialogSelector.resourceType = ''
  dialogSelector.data.splice(0, dialogSelector.data.length);
  done()
}

let startButtonDisabled = computed(() => {
  return working.value
    || (itemType.value == 1 && (miguSingerTaget.id == '' || ncmSingerTaget.id == 0))
    || (itemType.value == 2 && (miguAlbumTaget.id == '' || ncmAlbumTaget.id == 0))
    || (!limitOption.CopyRight && !limitOption.FLAC && !limitOption.VIP)
})

function autoFillAnother() {
  if (itemType.value === 1) {
    if (miguSingerTaget.name.length > 0 && ncmSingerTaget.name !== miguSingerTaget.name) {
      getSearch({ keywords: dialogSelector.keyword, type: 100, limit: 10 })
        .then((res: any) => {
          let artists = res.result.artists
          for (let artist of artists) {
            if (artist.name == miguSingerTaget.name) {
              ncmSingerTaget.id = artist.id
              ncmSingerTaget.name = artist.name
              break;
            }
          }
        })
    }
    else if (ncmSingerTaget.name.length > 0 && miguSingerTaget.name !== ncmSingerTaget.name) {
      searchSinger(dialogSelector.keyword)
        .then((res: any) => {
          let artists = res
          for (let artist of artists) {
            if (artist.name == ncmSingerTaget.name) {
              miguSingerTaget.id = artist.id
              miguSingerTaget.name = artist.name
              break;
            }
          }
        })
    }
  }
}

function handleStart() {
  working.value = true
  taskList.data.splice(0)
  if (itemType.value == 1) {
    statusDesc.value = '获取歌曲信息ing'
    generateSingerTasks(ncmSingerTaget.id, miguSingerTaget.id, limitOption).then(async (res) => {
      taskList.data = res
      statusDesc.value = ''
      handleTasks()
    })
  }
  else if (itemType.value == 2) {
    statusDesc.value = '获取歌曲信息ing'
    generateAlbumTasks(ncmAlbumTaget.id, miguAlbumTaget.id, miguAlbumTaget.resourceType, limitOption).then(async (res) => {
      taskList.data = res
      statusDesc.value = ''
      handleTasks()
    })
  }
  working.value = false
}
function handleTasks() {
  if (taskList.data.length == 0) return

  statusDesc.value = '下载上传ing'
  working.value = true
  let datas: { ncmSongId: any; miguURL: string; songName: any; fileType: string; isInCloud: boolean; status: string; sort: number }[] =[]
  taskList.data.forEach(item => {
    datas.push({ncmSongId:item.ncmSongId,miguURL:item.miguURL,songName:item.songName,fileType:item.fileType,isInCloud:item.isInCloud,status:item.status,sort:item.sort})
    });
  ipcRenderer.send('upload-files', { data: datas, cookie: `MUSIC_U=${getCookie('MUSIC_U')};` })
}
function handleReTryTask(taskItem: any) {
  statusDesc.value = '下载上传ing'
  working.value = true
  let datas =[{ncmSongId:taskItem.ncmSongId,miguURL:taskItem.miguURL,songName:taskItem.songName,fileType:taskItem.fileType,isInCloud:taskItem.isInCloud,status:taskItem.status,sort:taskItem.sort}]
  ipcRenderer.send('upload-files', { data: datas, cookie: `MUSIC_U=${getCookie('MUSIC_U')};`})
}
ipcRenderer.on('task-status', (_event, task) => {
    taskList.data.forEach(item => {
      if (item.ncmSongId == task.ncmSongId) {
        item.status = task.status
        item.sort = task.sort
      }
    });
  })
  ipcRenderer.on('task-finnsh', (_event, val) => {
    statusDesc.value = ''
    working.value = false
  })
</script>

<template>
  <el-radio-group v-model="itemType">
    <el-radio :label="1">歌手</el-radio>
    <el-radio :label="2">专辑</el-radio>
  </el-radio-group>
  <el-row>
    <el-col :span="12">
      <el-row align="middle">
        <el-button @click="OpenDialogSelector('migu')">选择咪咕目标</el-button>
        <div v-if="itemType == 1 && miguSingerTaget.id.length > 0">
          <el-link type="primary" @click="openExternal(miguSingerTaget.link())">已选择：{{ miguSingerTaget.name }}</el-link>
        </div>
        <div v-else-if="itemType == 2 && miguAlbumTaget.id.length > 0">
          <el-link type="primary" @click="openExternal(miguAlbumTaget.link())">已选择：{{ miguAlbumTaget.name }}</el-link>
        </div>
      </el-row>
    </el-col>
    <el-col :span="12">
      <el-row align="middle">
        <el-button @click="OpenDialogSelector('ncm')">选择网易云目标</el-button>
        <div v-if="itemType == 1 && ncmSingerTaget.id > 0">
          <el-link type="primary" @click="openExternal(ncmSingerTaget.link())">已选择：{{ ncmSingerTaget.name }}</el-link>
        </div>
        <div v-else-if="itemType == 2 && ncmAlbumTaget.id > 0">
          <el-link type="primary" @click="openExternal(ncmAlbumTaget.link())">已选择：{{ ncmAlbumTaget.name }}</el-link>
        </div>
      </el-row>
    </el-col>
  </el-row>

  <el-row justify="end" align="middle">
    <div v-if="statusDesc.length > 0">{{ statusDesc }}</div>
    <div v-if="itemType != 3">
      <el-tooltip effect="dark" content="网易云里无版权" placement="top">
        <el-checkbox v-model="limitOption.CopyRight" label="无版权" />
      </el-tooltip>
      <el-tooltip effect="dark" content="网易云VIP单曲或付费专辑" placement="top">
        <el-checkbox v-model="limitOption.VIP" label="VIP/付费" />
      </el-tooltip>
      <el-tooltip effect="dark" content="咪咕SQ品质" placement="top">
        <el-checkbox v-model="limitOption.FLAC" label="咪咕无损" />
      </el-tooltip>
    </div>
    <div>
      <el-button type="primary" @click="handleStart" :disabled="startButtonDisabled">开始</el-button>
    </div>
  </el-row>

  <el-row v-if="taskList.data.length > 0">
    <el-table :data="taskList.data">
      <el-table-column property="songName" label="歌名" />
      <el-table-column property="artists" label="歌手" />
      <el-table-column property="albumName" label="专辑" />
      <el-table-column property="miguformatType" label="品质" />
      <el-table-column label="状态" sortable :sort-by="['sort']">
        <template #default="scope">
          <el-button v-if="scope.row.sort == 4" :disabled="working" @click="handleReTryTask(scope.row)">重试
          </el-button>
          {{ scope.row.status }}
        </template>
      </el-table-column>
    </el-table>
  </el-row>

  <el-dialog v-model="dialogSelector.visiable" :before-close="dialogBeforeClose" title="请选择">
    <el-input v-model="dialogSelector.keyword" placeholder="Search" @keyup.enter="fetchDialogData">
      <template #prefix>
        <el-icon class="el-input__icon">
          <Search />
        </el-icon>
      </template>
    </el-input>
    <el-table v-loading="dialogSelector.loading" highlight-current-row :data="dialogSelector.data"
      @current-change="handleSelectTableCurrentChange">
      <el-table-column property="name" label="标题" width="200" />
      <!-- 专辑的歌手 -->
      <el-table-column v-if="itemType == 2" label="歌手" width="200">
        <template #default="scope">
          <template v-if="dialogSelector.platform == 'ncm'">
            <template v-for="(ar, index) in scope.row.artists" :key="index">
              {{ ar.name }}
              <template v-if="index !== scope.row.artists.length - 1" class="separator">,</template>
            </template>
          </template>
          <template v-else>
            {{ scope.row.singer }}
          </template>
        </template>
      </el-table-column>
      <el-table-column property="id" label="ID" />
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <!-- <el-button type="primary" @click="handleUnConnection()"></el-button> -->
        <el-button type="primary" @click="handleSelected">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>

</style>
