<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { getSearch } from '../api/search'
import { searchSinger, searchAlbum, searchSong, songItemformat } from '../api/migu'
import { generateSingerTasks, generateAlbumTasks } from '../utils/migu2ncm'
import { uploadSong, cloudDiskTrackMatch } from '../api/cloud'
import { useMessageStore } from '../stores/message'
import { useTaskStatusStore } from '../stores/taskStatus'
import { storeToRefs } from 'pinia'
import axios from 'axios';
import { shell } from 'electron'

let MessageStore = useMessageStore()
let TaskStatusStore = useTaskStatusStore()
let { working } = storeToRefs(TaskStatusStore)
let itemType = ref(1)
let selectorData: { name: string, id: number }[] = []
let dialogSelector = reactive({
  visiable: false,
  data: selectorData,
  loading: false,
  selectedName: '',
  selectedId: '',
  platform: '',
  keyword: '',
  resourceType: '',
  miguSongItem: {},
})

let miguSingerTaget = reactive({
  id: '',
  name: '',
  link(){
    return `https://music.migu.cn/v3/music/artist/${this.id}`
  }
})
let ncmSingerTaget = reactive({
  id: 0,
  name: '',
  link(){
    return `https://music.163.com/artist?id=${this.id}`
  }
})

let miguAlbumTaget = reactive({
  id: '',
  name: '',
  resourceType: '',
  link(){
    if (this.resourceType=='2003'){
      return `https://music.migu.cn/v3/music/album/${this.id}`
    }
    else if (this.resourceType=='5'){
      return `https://music.migu.cn/v3/music/digital_album/${this.id}`
    }
    return ''
  }
})
let ncmAlbumTaget = reactive({
  id: 0,
  name: '',
  link(){
    return `https://music.163.com/album?id=${this.id}`
  }
})

let miguSongTaget = reactive({
  id: '',
  name: '',
  songItem: {},
  link(){
    return `https://music.migu.cn/v3/music/song/${this.id}`
  }
})
let ncmSongTaget = reactive({
  id: 0,
  name: '',
  link(){
    return `https://music.163.com/song?id=${this.id}`
  }
})

let limitOption = reactive({
  CopyRight: false,
  VIP: false,
  FLAC: false,
})

let taskListData: { ncmSongId: any; migucontentId: any; miguURL: string; miguformatType: string; songName: any; albumName: any; artists: any; isInCloud: boolean; isNoCopyRight: boolean; isVIP: boolean; status: string; sort: number; progress: number; }[]
taskListData = []
let taskList = reactive({
  data: taskListData,
})

let statusDesc = ref('')

function openExternal(url:string){
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
          console.log(res)
          dialogSelector.data = res.result.artists
        })
    }
    else {
      searchSinger(dialogSelector.keyword)
        .then((res: any) => {
          console.log(res)
          dialogSelector.data = res
        })
    }
  }
  else if (itemType.value === 2) {
    if (dialogSelector.platform === 'ncm') {
      getSearch({ keywords: dialogSelector.keyword, type: 10, limit: 10 })
        .then((res: any) => {
          console.log(res)
          dialogSelector.data = res.result.albums
        })
    }
    else {
      searchAlbum(dialogSelector.keyword)
        .then((res: any) => {
          console.log(res)
          dialogSelector.data = res
        })
    }
  }
  else if (itemType.value === 3) {
    if (dialogSelector.platform === 'ncm') {
      getSearch({ keywords: dialogSelector.keyword, type: 1, limit: 10 })
        .then((res: any) => {
          console.log(res)
          dialogSelector.data = res.result.songs
        })
    }
    else {
      searchSong(dialogSelector.keyword)
        .then((res: any) => {
          console.log(res)
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
    if (itemType.value == 3 && dialogSelector.platform == 'migu') {
      dialogSelector.miguSongItem = songItemformat(val)
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
    else if (itemType.value == 3) {
      miguSongTaget.id = dialogSelector.selectedId.toString()
      miguSongTaget.name = dialogSelector.selectedName
      miguSongTaget.songItem = dialogSelector.miguSongItem
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
    else if (itemType.value == 3) {
      ncmSongTaget.id = Number(dialogSelector.selectedId)
      ncmSongTaget.name = dialogSelector.selectedName
    }
  }
  autoFillAnother()
  dialogSelector.selectedId = ''
  dialogSelector.selectedName = ''
  dialogSelector.platform = ''
  dialogSelector.keyword = ''
  dialogSelector.resourceType = ''
  dialogSelector.miguSongItem = {}
  dialogSelector.data.splice(0, dialogSelector.data.length);
  dialogSelector.visiable = false
}
const dialogBeforeClose = (done: () => void) => {
  dialogSelector.selectedId = ''
  dialogSelector.selectedName = ''
  dialogSelector.platform = ''
  dialogSelector.keyword = ''
  dialogSelector.resourceType = ''
  dialogSelector.miguSongItem = {}
  dialogSelector.data.splice(0, dialogSelector.data.length);
  done()
}

let startButtonDisabled = computed(() => {
    return working.value
    || (itemType.value==1 && miguSingerTaget.id == '' || ncmSingerTaget.id == 0)
    || (itemType.value==2 && miguAlbumTaget.id == '' || ncmAlbumTaget.id == 0)
    || (itemType.value==3 && miguSongTaget.id == '' || ncmSongTaget.id == 0)
    || (itemType.value != 3 && (!limitOption.CopyRight && !limitOption.FLAC && !limitOption.VIP))
})

function autoFillAnother() {
  if (itemType.value === 1) {
    if (miguSingerTaget.id !== '' && ncmSingerTaget.id == 0) {
      getSearch({ keywords: dialogSelector.keyword, type: 100, limit: 10 })
        .then((res: any) => {
          let artists = res.result.artists
          for (let artist of artists) {
            if (artist.name == miguSingerTaget.name) {
              ncmSingerTaget.id = artist.id
              ncmSingerTaget.name = artist.name
            }
          }
        })
    }
    else if (miguSingerTaget.name.length == 0 && ncmSingerTaget.id > 0) {
      searchSinger(dialogSelector.keyword)
        .then((res: any) => {
          let artists = res
          for (let artist of artists) {
            if (artist.name == miguSingerTaget.name) {
              ncmSingerTaget.id = artist.id
              ncmSingerTaget.name = artist.name
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
  else if (itemType.value == 3) {
    let matchItem = {
      ncmSongId: ncmSongTaget.id,
      migucontentId: miguSongTaget.songItem.contentId,
      miguURL: miguSongTaget.songItem.bestQualityUrl,
      miguformatType: miguSongTaget.songItem.bestQualityformatType,
      songName: miguSongTaget.name,
      albumName: miguSongTaget.songItem.album.name,
      artists: miguSongTaget.songItem.artists.map((a: { name: any }) => { return a.name }).toString(),
      isInCloud: false,
      isNoCopyRight: false,
      isVIP: false,
      status: '未开始',
      sort: 3,
      progress: 0,
    }
    taskList.data = [matchItem]
    handleTask(0)
  }
  console.log('working.value=false')
  working.value = false
}
async function handleTasks() {
  if (taskList.data.length == 0) return
  statusDesc.value = '下载上传ing'
  working.value = true
  let limit = Math.min(4, taskList.data.length)
  let Pool: Promise<number>[] = []
  let currentTaskIndex = 0
  while (currentTaskIndex < limit) {
    Pool.push(handleTask(currentTaskIndex, Pool.length))
    currentTaskIndex++;
  }
  while (currentTaskIndex < taskList.data.length) {
    await Promise.race(Pool).then((finishPoolIndex: number) => {
      Pool[finishPoolIndex] = handleTask(currentTaskIndex, finishPoolIndex)
      currentTaskIndex += 1
    })
  }
  if (Pool.length > 0) {
    Promise.all(Pool).then(() => {
      statusDesc.value = ''
      working.value = false
    })
  }
  else {
    statusDesc.value = ''
    working.value = false
  }
}

function handleReTryTask(taskIndex: number) {
  statusDesc.value = '下载上传ing'
  working.value = true
  handleTask(taskIndex).finally(() => {
    statusDesc.value = ''
    working.value = false
  })
}

function handleTask(taskIndex: number, poolIndex = 0) {
  let task = taskList.data[taskIndex]
  task.status = '下载中'
  task.sort = 2
  return axios.get(task.miguURL,
    {
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          //属性lengthComputable主要表明总共需要完成的工作量和已经完成的工作是否可以被测量
          //如果lengthComputable为false，就获取不到progressEvent.total和progressEvent.loaded
          task.progress = progressEvent.loaded / progressEvent.total * 100 //实时获取最新下载进度
        }
      }
    })
    .then(async (res) => {
      console.log(res)
      if (res.status != 200) {
        task.status = '下载失败'
        task.sort = 4
        return poolIndex
      }
      let content = res.data
      let fileName = task.miguformatType == 'SQ' ? `${task.songName}.flac` : `${task.songName}.mp3`
      console.log('before fileObj')
      let fileObj = new File([content], fileName)
      console.log(fileObj)
      task.status = '上传中'
      task.sort = 1
      await uploadSong(fileObj).then((res: any) => {
        console.log(res)
        if (res.code && res.code !== 200 && res.message) {
          MessageStore.send(res.message, 'warning')
          task.status = '上传失败 ' + res.message
          task.sort = 4
        }
        else {
          task.status = '已上传'
          cloudDiskTrackMatch({ sid: res.privateCloud.songId, asid: task.ncmSongId }).then(() => {
            task.status = '已完成'
            task.sort = 5
          })
        }
        // return poolIndex
      })
        .catch((err) => {
          task.status = '上传失败 ' + err
          task.sort = 4
        })
      return poolIndex
    })
    .catch((err) => {
      task.status = '下载失败 ' + err
      task.sort = 4
      return poolIndex
    })
}
</script>

<template>
  <el-radio-group v-model="itemType">
    <el-radio :label="1">歌手</el-radio>
    <el-radio :label="2">专辑</el-radio>
    <el-radio :label="3">歌曲</el-radio>
  </el-radio-group>
  <el-row>
    <el-col :span="12">
      <el-row align="middle">
        <el-button @click="OpenDialogSelector('migu')">选择咪咕目标</el-button>
        <div v-if="itemType==1 && miguSingerTaget.id.length > 0"><el-link type="primary" @click="openExternal(miguSingerTaget.link())">已选择：{{ miguSingerTaget.name }}</el-link></div>
        <div v-else-if="itemType==2 && miguAlbumTaget.id.length > 0"><el-link type="primary" @click="openExternal(miguAlbumTaget.link())">已选择：{{ miguAlbumTaget.name }}</el-link></div>
        <div v-else-if="itemType==3 && miguSongTaget.id.length > 0"><el-link type="primary" @click="openExternal(miguSongTaget.link())">已选择：{{ miguSongTaget.name }}</el-link></div>
      </el-row>
    </el-col>
    <el-col :span="12">
      <el-row align="middle">
        <el-button @click="OpenDialogSelector('ncm')">选择网易云目标</el-button>
        <div v-if="itemType==1 && ncmSingerTaget.id > 0"><el-link type="primary" @click="openExternal(ncmSingerTaget.link())">已选择：{{ ncmSingerTaget.name }}</el-link></div>
        <div v-else-if="itemType==2 && ncmAlbumTaget.id > 0"><el-link type="primary" @click="openExternal(ncmAlbumTaget.link())">已选择：{{ ncmAlbumTaget.name }}</el-link></div>
        <div v-else-if="itemType==3 && ncmSongTaget.id > 0"><el-link type="primary" @click="openExternal(ncmSongTaget.link())">已选择：{{ ncmSongTaget.name }}</el-link></div>
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
    <el-table :data="taskList.data" :default-sort="{ prop: 'sort' }">
      <el-table-column property="songName" label="歌名" />
      <el-table-column property="artists" label="歌手" />
      <el-table-column property="albumName" label="专辑" />
      <el-table-column property="miguformatType" label="品质" />
      <el-table-column label="状态" sortable :sort-by="['sort']">
        <template #default="scope">
          <el-button v-if="scope.row.sort == 4" :disabled="working" @click="handleReTryTask(scope.$index)">重试
          </el-button>
          <el-progress v-if="scope.row.sort == 2" :percentage="scope.row.progress"></el-progress>
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
      <!-- 歌曲的歌手 -->
      <el-table-column v-if="itemType == 3" label="歌手" width="200">
        <template #default="scope">
          <template v-if="dialogSelector.platform == 'ncm'">
            <template v-for="(ar, index) in scope.row.artists" :key="index">
              {{ ar.name }}
              <template v-if="index !== scope.row.artists.length - 1" class="separator">,</template>
            </template>
          </template>
          <template v-else>
            <template v-for="(singer, index) in scope.row.singers" :key="index">
              {{ singer.name }}
              <template v-if="index !== scope.row.singers.length - 1" class="separator">,</template>
            </template>
          </template>
        </template>
      </el-table-column>
      <!-- 歌曲的专辑 -->
      <el-table-column v-if="itemType == 3" label="专辑" width="200">
        <template #default="scope">
          <template v-if="dialogSelector.platform == 'ncm'">
            {{ scope.row.album.name }}
          </template>
          <template v-else>
            <template v-for="(album, index) in scope.row.albums" :key="index">
              {{ album.name }}
              <template v-if="index !== scope.row.albums.length - 1" class="separator">,</template>
            </template>
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
