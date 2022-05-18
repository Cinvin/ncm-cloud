<script setup lang="ts">
import { ref } from 'vue'
import fs from 'fs'
import path from 'path'
import { isAudio } from '../utils/file'
import { uploadSong } from '../api/cloud'
import {useMessageStore} from '../stores/message'
import type { UploadUserFile, UploadRawFile } from 'element-plus'
let UpLoading = ref(false)
let fileList = ref<UploadUserFile[]>([])
let MessageStore = useMessageStore()
function beforeUpload(rawFile: UploadRawFile) {
  console.log(rawFile)
  if (rawFile.type.match(/audio/)){
    let res=uploadSong(rawFile).then((res:any)=>{
    if (res.code && res.code!==200 && res.message){
      MessageStore.send(res.message,'warning')
    }
    else{
      // todo match
      let songid=res.privateCloud.songId
    }
    console.log(res)
  })
  }
  else if(rawFile.type===''){
    UploadFloder(rawFile.path)
  }
  else{
    MessageStore.send('请选择音频文件','error')
  }
  return false
}
function UploadFloder(dir: string) {
  fs.readdir(dir, { withFileTypes: true }, function (err, files) {
    if (err) {
      console.log('上传失败，读取文件夹失败：', dir, err);
    }
    for (let fileitem of files) {
      let fileName = path.join(dir, fileitem.name)
      if (fileitem.isDirectory()) {
        UploadFloder(fileName)
      }
      else if(isAudio(fileName)){
        let fileBlob=fs.readFileSync(fileName)
        let FileObj=new File([fileBlob],fileName)
        console.log(FileObj)
        uploadSong(FileObj)
      }
    }
  });
}
</script>

<template>
  <el-upload class="upload-demo" drag multiple access="audio/*" :before-upload="beforeUpload">
    <el-icon class="el-icon--upload">
      <upload-filled />
    </el-icon>
    <div class="el-upload__text">
      拖拽文件 或<em>点击上传</em>
    </div>
  </el-upload>
</template>

<style scoped>
</style>
