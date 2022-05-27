<script setup lang="ts">
import { reactive } from 'vue'
import fs from 'fs'
import path from 'path'
import { isAudio } from '../utils/file'
import { uploadSong,cloudDiskTrackMatch } from '../api/cloud'
import { getstrictSearch } from '../api/search'
import { useMessageStore } from '../stores/message'
import type { UploadRawFile } from 'element-plus'
import { useTaskStatusStore } from '../stores/taskStatus'
import { storeToRefs } from 'pinia'

let fileListarr: { path: string, status: string }[] = []
let fileList = reactive({
  arr: fileListarr
})
let TaskStatusStore = useTaskStatusStore()
let { working } = storeToRefs(TaskStatusStore)
let MessageStore = useMessageStore()
function beforeUpload(rawFile: UploadRawFile) {
  working.value=true
  if (rawFile.type.match(/audio/)) {
    startUploadSong(rawFile)
  }
  else if (rawFile.type === '') {
    UploadFloder(rawFile.path)
  }
  else {
    MessageStore.send('请选择音频文件', 'error')
  }
  working.value=false
  return false
}
function UploadFloder(dir: string) {
  fs.readdir(dir, { withFileTypes: true }, function (err, files) {
    if (err) {
      console.log(dir, err);
    }
    for (let fileitem of files) {
      let fileName = path.join(dir, fileitem.name)
      if (fileitem.isDirectory()) {
        UploadFloder(fileName)
      }
      else if (isAudio(fileName)) {
        let fileBlob = fs.readFileSync(fileName)
        let FileObj = new File([fileBlob], fileName)
        startUploadSong(FileObj)
      }
    }
  });
}

function startUploadSong(FileObj: File) {
  let path = FileObj.path
  if (path.length==0){
    path = FileObj.name
  }

  updateFileList(path, '上传中')
  uploadSong(FileObj).then((res: any) => {
    if (res.code && res.code !== 200 && res.message) {
      MessageStore.send(res.message, 'warning')
      updateFileList(path, '失败')
    }
    else {
      updateFileList(path, '已上传')
      let songid = res.privateCloud.songId
      let patharr = path.split('/')
      let songName = patharr.pop()
      if (!songName) {
        return
      }
      else {
        songName = songName.split('.')[0]
      }
      let album = patharr.pop()
      if (!album) {
        return
      }
      let artist = patharr.pop()
      if (!artist) {
        return
      }
      getstrictSearch([artist], album, songName).then((searchRes) => {
        if (searchRes) {
          cloudDiskTrackMatch({sid:songid,asid:searchRes.id}).then(()=>{
            updateFileList(path, '已匹配')
          })
        }
      })
    }
  })
  .catch((err)=>{
    updateFileList(path, '上传失败：'+err)
  })
  .finally
}


function updateFileList(path: string, status: string) {
  for (let item of fileList.arr){
    if (item.path==path){
      item.status=status
      return
    }
  }
  fileList.arr.push({ path: path, status: status })
}
</script>

<template>
  <el-upload class="upload-demo" drag multiple access="audio/*" :before-upload="beforeUpload">
    <el-icon class="el-icon--upload">
      <upload-filled />
    </el-icon>
    <div class="el-upload__text">
      拖拽文件(夹) 或<em>点击上传</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
        若目录结构为/歌手名/专辑名/歌曲名.后缀 上传后会根据此信息尝试匹配歌曲
      </div>
    </template>
  </el-upload>
  <el-table :data="fileList.arr" v-if="fileList.arr.length > 0" row-key="path" style="width: 100%">
    <el-table-column property="path" label="文件" width="400" />
    <el-table-column property="status" label="状态" width="100" />
  </el-table>
</template>

<style scoped>
</style>
