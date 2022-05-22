<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { getSearch } from '../api/search'
import { searchSinger, searchAlbum, searchSong } from '../api/migu'
import { generateSingerTasks, generateAlbumTasks } from '../utils/migu2ncm'
import { uploadSong, cloudDiskTrackMatch } from '../api/cloud'
import { useMessageStore } from '../stores/message'
import { useTaskStatusStore } from '../stores/taskStatus'
import { storeToRefs } from 'pinia'
import axios from 'axios';

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
})

let miguTaget = reactive({
  id: '',
  name: '',
  resourceType: ''
})

let ncmTaget = reactive({
  id: 0,
  name: ''
})

let limitOption = reactive({
  CopyRight: false,
  VIP: false,
  FLAC: false,
})

let taskListData: { ncmSongId: any; migucontentId: any; miguURL: string; miguformatType: string; songName: any; albumName: any; artists: any; isInCloud: any; isNoCopyRight: boolean; isVIP: boolean; status: string }[]
taskListData = []
let taskList = reactive({
  data: taskListData,
})

let statusDesc = ref('')

function itemTypeChange() {
  miguTaget.id = ''
  miguTaget.name = ''
  miguTaget.resourceType = ''
  ncmTaget.id = 0
  ncmTaget.name = ''
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
    if (val.resourceType) {
      dialogSelector.resourceType = val.resourceType
    }
  }
}
function handleSelected() {
  if (dialogSelector.platform == 'migu') {
    miguTaget.id = dialogSelector.selectedId.toString()
    miguTaget.name = dialogSelector.selectedName
    if (dialogSelector.resourceType.length > 0) {
      miguTaget.resourceType = dialogSelector.resourceType
    }
  }
  else if (dialogSelector.platform == 'ncm') {
    ncmTaget.id = Number(dialogSelector.selectedId)
    ncmTaget.name = dialogSelector.selectedName
  }
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
  return miguTaget.id == '' || ncmTaget.id == 0
    || (itemType.value != 3 && (!limitOption.CopyRight && !limitOption.FLAC && !limitOption.VIP))
    || working.value
})

function handleStart() {
  working.value = true
  taskList.data.splice(0)
  if (itemType.value == 1) {
    statusDesc.value = '获取歌曲信息ing'
    generateSingerTasks(ncmTaget.id, miguTaget.id, limitOption).then(async (res) => {
      taskList.data = res
      statusDesc.value = ''
      handleTasks()
    })
  }
  else if (itemType.value == 2) {
    statusDesc.value = '获取歌曲信息ing'
    generateAlbumTasks(ncmTaget.id, miguTaget.id, miguTaget.resourceType, limitOption).then(async (res) => {
      taskList.data = res
      statusDesc.value = ''
      handleTasks()
    })
  }
  console.log('working.value=false')
  working.value = false
}
async function handleTasks() {
  statusDesc.value = '下载上传ing'
  for (var i = 0; i < taskList.data.length; ++i) {
    handleTask(i)
  }
  statusDesc.value = ''
}
async function handleTask(index: number) {
  working.value = true
  let task = taskList.data[index]
  task.status = '下载中'
  await axios.get(task.miguURL, { responseType: "blob" })
    .then((res) => {
      console.log(res)
      if (res.status != 200) {
        task.status = '下载失败'
        return
      }
      task.status = '下载完成'
      let content = res.data
      let fileName = task.miguformatType == 'SQ' ? `${task.songName}.flac` : `${task.songName}.mp3`
      console.log('before fileObj')
      let fileObj = new File([content], fileName)
      console.log(fileObj)
      task.status = '上传中'
      uploadSong(fileObj).then((res: any) => {
        console.log(res)
        if (res.code && res.code !== 200 && res.message) {
          MessageStore.send(res.message, 'warning')
          task.status = '上传失败 ' + res.message
        }
        else {
          task.status = '已上传'
          cloudDiskTrackMatch({ sid: res.privateCloud.songId, asid: task.ncmSongId }).then(() => {
            task.status = '已完成'
          })
        }
      })
        .catch((err) => {
          task.status = '上传失败 ' + err
        })
    })
    .catch((err) => {
      task.status = '下载失败 ' + err
    })
    .finally(() => {
      working.value = false
    })
  // .finally(() => {
  //   doingCount -= 1
  // })
  statusDesc.value = ''
}
</script>

<template>
  <el-radio-group v-model="itemType" @change="itemTypeChange">
    <el-radio :label="1">歌手</el-radio>
    <el-radio :label="2">专辑</el-radio>
    <el-radio :label="3">歌曲</el-radio>
  </el-radio-group>
  <el-row>
    <el-col :span="12">
      <el-row align="middle">
        <el-button @click="OpenDialogSelector('migu')">选择咪咕目标</el-button>
        <div v-if="miguTaget.id.length > 0">已选择{{ miguTaget.name }}</div>
      </el-row>
    </el-col>
    <el-col :span="12">
      <el-row align="middle">
        <el-button @click="OpenDialogSelector('ncm')">选择网易云目标</el-button>
        <div v-if="ncmTaget.id > 0">已选择{{ ncmTaget.name }}</div>
      </el-row>
    </el-col>
  </el-row>

  <el-row justify="end" align="middle">
    <div v-if="statusDesc.length > 0">{{ statusDesc }}</div>
    <div v-if="itemType != 3">
      <el-checkbox v-model="limitOption.CopyRight" label="无版权" />
      <el-checkbox v-model="limitOption.VIP" label="VIP/付费" />
      <el-checkbox v-model="limitOption.FLAC" label="咪咕无损" />
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
      <el-table-column property="status" label="状态" />
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
