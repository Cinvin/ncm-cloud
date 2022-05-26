<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
import { loginStatus } from '../api/auth';
import { doLogout } from '../utils/auth'
import { useTaskStatusStore } from "../stores/taskStatus";
import { storeToRefs } from "pinia";

let TaskStatusStore = useTaskStatusStore()
let { working } = storeToRefs(TaskStatusStore)
const router = useRouter();
const route = useRoute();
let profile = reactive({
  nickname:'',
  avatarUrl:'',
})
loginStatus().then((res) => {
  profile.nickname = res.data.profile.nickname
  profile.avatarUrl = res.data.profile.avatarUrl
})

function logout() {
  doLogout()
  router.push({ name: 'login', });
}

</script>

<template>
  <el-container>
    <el-aside width="150px">
      <el-menu :default-active="route.path" router>
        <!-- <el-row align="middle"> -->
        <el-dropdown @command="logout">
          <el-row align="middle">
            <el-avatar v-if="profile.avatarUrl" :src="profile.avatarUrl" />
            <span v-if="profile.nickname">{{ profile.nickname }}</span>
          </el-row>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="1">登出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <!-- </el-row> -->
        <el-menu-item index="/main/MyCloud" :disabled="working" router>
          <span>我的云盘</span>
        </el-menu-item>
        <el-menu-item index="/main/LocalUpload" :disabled="working" router>
          <span>本地上传</span>
        </el-menu-item>
        <el-menu-item index="/main/MiguUpload" :disabled="working" router>
          <span>咪咕源上传</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<style scoped>
</style>
