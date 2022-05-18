<script setup lang="ts">
// import { ref } from 'vue'
// defineProps<{ msg: string }>()
// const count = ref(0)
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
import { useProfileStore } from '../stores/profile';
import { loginStatus } from '../api/auth';
const router = useRouter();
const route = useRoute();
const profile = useProfileStore()

loginStatus().then((res) => {
  profile.$state = res.data.profile
})
console.log('route.path',route.path)
</script>

<template>
  <el-container>
    <el-aside width="150px">
      <el-menu :default-active="route.path" router>
        <div class="profile-info">
          <el-avatar :src="profile.avatarUrl" />
          {{ profile.nickname }}
        </div>
        <el-menu-item index="/main/MyCloud" router>
          <span>我的云盘</span>
        </el-menu-item>
        <el-menu-item index="/main/LocalUpload" router>
          <span>本地上传</span>
        </el-menu-item>
        <el-menu-item index="/main/MiguUpload" router>
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
