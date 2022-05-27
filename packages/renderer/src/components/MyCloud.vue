<script setup lang="ts">
import {
  Connection,
  Delete,
  Search,
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { reactive, ref, watch, onBeforeMount } from 'vue'
import { cloudDisk, cloudDiskTrackMatch, cloudDiskTrackDelete } from '../api/cloud'
import { fileSizeDesc } from '../utils/file'
import { getSearch } from '../api/search'
import { useMessageStore } from '../stores/message'
import dayjs from 'dayjs'
import path from 'path'
let MessageStore = useMessageStore()
let cloud = reactive({
  data: [],
  count: 0,
  size: '',
  maxSize: '',
  hasMore: true,
  limit: 100,
  offset: 1,
  page_index: 1,
  loading: false,
})
let dialogConnection = ref(false)
let searchTable = reactive({
  data: [],
  keyword: '',
  loading: false,
  fromId: 0,
  toId: 0,
  tips: '',
})
function fetchData() {
  cloud.offset = (cloud.page_index - 1) * cloud.limit
  cloud.loading = true
  cloudDisk({ limit: cloud.limit, offset: cloud.offset }).then((res: any) => {
    cloud.data = res.data
    cloud.count = res.count
    cloud.size = res.size
    cloud.maxSize = res.maxSize
    cloud.hasMore = res.data
    cloud.loading = false
  })
    .catch(() => {
      cloud.loading = false
    })
}
onBeforeMount(() => {
  fetchData()
})
watch(
  () => cloud.page_index,
  () => {
    window.scrollTo(0, 0);
    fetchData();
  }
);

function onClickConnetion(songItem: any) {
  // if (songItem.simpleSong.t == 0) {
  //   ElMessageBox.confirm(
  //     '该歌曲已匹配，是否修改匹配?',
  //     'Warning',
  //     {
  //       confirmButtonText: 'OK',
  //       cancelButtonText: 'Cancel',
  //       type: 'warning',
  //     }
  //   ).catch(() => {
  //     return
  //   })
  // }
  dialogConnection.value = true
  searchTable.keyword = songItem.songName + ' ' + songItem.album
  searchTable.fromId = songItem.songId
  searchTable.loading = true
  getSearch({ keywords: searchTable.keyword, type: 1, limit: 10 })
    .then((res: any) => {
      searchTable.data = res.result.songs
      searchTable.loading = false
    })
    .catch(() => {
      searchTable.loading = false
    })
}
function handleMatchSearch() {
  searchTable.loading = true
  getSearch({ keywords: searchTable.keyword, type: 1, limit: 10 })
    .then((res: any) => {
      searchTable.data = res.result.songs
      searchTable.loading = false
    })
    .catch(() => {
      searchTable.loading = false
    })
}
const handleConnectionTableCurrentChange = (val: any | undefined) => {
  //选择目标匹配的歌曲
  if (val) {
    searchTable.toId = val.id
  }
}
function handleConnection() {
  if (searchTable.toId == 0) {
    searchTable.tips = '未选择目标匹配歌曲！'
    return
  }
  ElMessageBox.confirm(
    '是否关联?',
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
      center: true,
    }
  ).then(() => {
    cloudDiskTrackMatch({ sid: searchTable.fromId, asid: searchTable.toId }).then(
      () => {
        dialogConnection.value = false
        fetchData();
      }
    )
  })
}
function handleUnConnection() {
  cloudDiskTrackMatch({ sid: searchTable.fromId, asid: 0 }).then(
    () => {
      dialogConnection.value = false
      fetchData();
    }
  )
}
const dialogConnectionBeforeClose = (done: () => void) => {
  searchTable.fromId = 0
  searchTable.toId = 0
  searchTable.keyword = ''
  searchTable.tips = ''
  done()
}

function onClickDelete(songItem: any) {
  ElMessageBox.confirm(
    '是否删除歌曲 ' + songItem.songName + ' ?',
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
      center: true,
    }
  ).then(() => {
    cloudDiskTrackDelete(songItem.songId).then(() => {
      fetchData()
    })
  })
}
</script>

<template>
  <div v-if="cloud.size">
    <el-progress :percentage="100 * Number(cloud.size) / Number(cloud.maxSize)">
      {{ fileSizeDesc(Number(cloud.size)) + '/' + fileSizeDesc(Number(cloud.maxSize)) + ' 共' + cloud.count + '首'}}
    </el-progress>
  </div>
  <el-table :data="cloud.data" row-key="songId" v-loading="cloud.loading" style="width: 100%">
    <el-table-column label="标题" width="274" show-overflow-tooltip>
      <template #default="scope">
        <div class="song-info">
          <img v-if="scope.row.simpleSong.al" :src="scope.row.simpleSong.al.picUrl + '?param=50y50'" class="song-img"
            lazy />
          <img v-else src="http://p4.music.126.net/UeTuwE7pvjBpypWLudqukA==/3132508627578625.jpg?param=50y50">
          <div class="song-info-cont">
            <div class="ellipsis-text">{{ scope.row.simpleSong.name }}</div>
            <div class="ellipsis-text">
              <template v-if="scope.row.simpleSong.ar && scope.row.simpleSong.ar[0].id > 0">
                <template v-for="(ar, index) in scope.row.simpleSong.ar" :key="index">
                  {{ ar.name }}
                  <template v-if="index !== scope.row.simpleSong.ar.length - 1" class="separator">,</template>
                </template>
              </template>
              <template v-else>{{ scope.row.artist }}</template>
            </div>
          </div>
        </div>
      </template>
    </el-table-column>
    <!-- <el-table-column prop="simpleSong.al.name" label="专辑" width="180" show-overflow-tooltip/> -->
    <el-table-column label="专辑" width="180">
      <template #default="scope">
        <template v-if="scope.row.simpleSong.al && scope.row.simpleSong.al.id > 0">{{ scope.row.simpleSong.al.name
        }}</template>
        <template v-else>{{ scope.row.album }}</template>
      </template>
    </el-table-column>
    <el-table-column label="时长" width="100">
      <template #default="scope">
        <div>{{ dayjs(scope.row.simpleSong.dt).format('mm:ss') }}</div>
      </template>
    </el-table-column>
    <el-table-column label="文件信息" width="100">
      <template #default="scope">
        <div>{{ path.extname(scope.row.fileName) }}</div>
        <div>{{ fileSizeDesc(scope.row.fileSize) }}</div>
      </template>
    </el-table-column>
    <el-table-column label="上传时间" width="120">
      <template #default="scope">
        <div>{{ dayjs(scope.row.addTime).format('YYYY-MM-DD') }}</div>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="150">
      <template #default="scope">
        <!-- <el-button :icon="Download" circle /> -->
        <el-button :icon="Delete" circle @click="onClickDelete(scope.row)" />
        <el-button :icon="Connection" circle @click="onClickConnetion(scope.row)" />
      </template>
    </el-table-column>
  </el-table>
  <el-pagination background layout="prev, pager, next, jumper" v-if="cloud.count > cloud.limit" :total="cloud.count"
    :page-size="cloud.limit" v-model:current-page="cloud.page_index" />

  <el-dialog v-model="dialogConnection" :before-close="dialogConnectionBeforeClose" title="匹配歌曲">
    <el-input v-model="searchTable.keyword" placeholder="Search" @blur="handleMatchSearch">
      <template #prefix>
        <el-icon class="el-input__icon">
          <Search />
        </el-icon>
      </template>
    </el-input>
    <el-table v-loading="searchTable.loading" highlight-current-row :data="searchTable.data"
      @current-change="handleConnectionTableCurrentChange">
      <el-table-column property="name" label="标题" width="150" />
      <el-table-column label="歌手" width="120">
        <template #default="scope">
          <template v-if="scope.row.artists">
            <template v-for="(ar, index) in scope.row.artists" :key="index">
              {{ ar.name }}
              <template v-if="index !== scope.row.artists.length - 1" class="separator">,</template>
            </template>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="专辑" width="150">
        <template #default="scope">
          <template v-if="scope.row.album">
            {{ scope.row.album.name }}
          </template>
        </template>
      </el-table-column>
      <el-table-column label="时长" width="100">
        <template #default="scope">
          <template v-if="scope.row.duration">
            {{ dayjs(scope.row.duration).format('mm:ss') }}
          </template>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <span class="dialog-footer">
        <span v-if="searchTable.tips">{{ searchTable.tips }}</span>
        <!-- <el-button type="primary" @click="handleUnConnection()"></el-button> -->
        <el-button type="primary" @click="handleConnection()">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.song-info {
  display: flex;
  align-items: center;
  /* padding-bottom: 20px;
    border-bottom: 2px;
    margin-bottom: 20px; */
}

/* .song-img {
    width: 120px;
    height: 120px;
    border-radius: 50%;
} */
.song-info-cont {
  padding-left: 10px;
  flex: 1;
  /* font-size: 14px; */
}

.ellipsis-text {
  width: 185px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
