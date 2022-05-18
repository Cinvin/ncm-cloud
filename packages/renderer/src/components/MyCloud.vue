<script setup lang="ts">
import { reactive, watch, onBeforeMount } from 'vue'
import { cloudDisk } from '../api/cloud'
import { fileSizeDesc } from '../utils/file'
import dayjs from 'dayjs'
import path from 'path'
let cloud = reactive({
  data: [],
  count: 0,
  size: '',
  maxSize: '',
  hasMore: true,
  limit: 100,
  offset: 1,
  page_index: 1,
})
function fetchData() {
  cloud.offset = (cloud.page_index - 1) * cloud.limit
  cloudDisk({ limit: cloud.limit, offset: cloud.offset }).then((res: any) => {
    cloud.data = res.data
    cloud.count = res.count
    cloud.size = res.size
    cloud.maxSize = res.maxSize
    cloud.hasMore = res.data
  })

}
onBeforeMount(() => {
  fetchData()
})
watch(
  () => cloud.page_index,
  () => {
    window.scrollTo(0,0);
    fetchData();
  }
);
</script>

<template>
  <div v-if="cloud.size">
   <el-progress 
   :percentage="100 * Number(cloud.size)/Number(cloud.maxSize)">
    {{fileSizeDesc(Number(cloud.size)) + '/' + fileSizeDesc(Number(cloud.maxSize))}}
   </el-progress>
  </div>
  <el-table :data="cloud.data" style="width: 100%">
    <el-table-column label="标题" width="274" show-overflow-tooltip>
      <template #default="scope">
        <div class="song-info">
          <img v-if="scope.row.simpleSong.al" :src="scope.row.simpleSong.al.picUrl + '?param=50y50'" class="song-img" lazy/>
          <img v-else src="http://p4.music.126.net/UeTuwE7pvjBpypWLudqukA==/3132508627578625.jpg?param=50y50">
          <div class="song-info-cont">
            <div class="ellipsis-text">{{ scope.row.songName }}</div>
            <div class="ellipsis-text">
              <template v-if="scope.row.simpleSong.ar && scope.row.simpleSong.ar[0].id > 0">
              <template v-for="(ar, index) in scope.row.simpleSong.ar" :key="index">
                {{ ar.name }}
              <template v-if="index !== scope.row.simpleSong.ar.length - 1" class="separator">,</template>
              </template>
              </template>
              <template v-else>{{scope.row.artist}}</template>
            </div>
          </div>
        </div>
      </template>
    </el-table-column>
    <!-- <el-table-column prop="simpleSong.al.name" label="专辑" width="180" show-overflow-tooltip/> -->
    <el-table-column label="专辑" width="180">
      <template #default="scope">
      <template v-if="scope.row.simpleSong.al && scope.row.simpleSong.al.id > 0">{{scope.row.simpleSong.al.name}}</template>
      <template v-else>{{scope.row.album}}</template>
      </template>
    </el-table-column>
    <el-table-column label="时长" width="100">
      <template #default="scope">
      <div>{{dayjs(scope.row.simpleSong.dt).format('mm:ss')}}</div>
      </template>
    </el-table-column>
    <el-table-column label="文件信息" width="100">
      <template #default="scope">
      <div>{{path.extname(scope.row.fileName)}}</div>
      <div>{{fileSizeDesc(scope.row.fileSize)}}</div>
      </template>
    </el-table-column>
    <el-table-column label="上传时间" width="120">
      <template #default="scope">
      <div>{{dayjs(scope.row.addTime).format('YYYY-MM-DD')}}</div>
      </template>
    </el-table-column>
  </el-table>
  <el-pagination background layout="prev, pager, next, jumper" v-if="cloud.count > cloud.limit" :total="cloud.count"
    :page-size="cloud.limit" v-model:current-page="cloud.page_index" />
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
.ellipsis-text{
  width: 185px;
  overflow: hidden;
  white-space:nowrap;
  text-overflow: ellipsis;
}
</style>
