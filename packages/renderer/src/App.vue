<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { useRouter } from "vue-router";

// import { isLoggedIn } from "./utils/auth.js"
// const { isLoggedIn } = require('./utils/auth.js')
import { isLoggedIn } from "./utils/auth"
import { useMessageStore } from "./stores/message";
import { ElMessage } from 'element-plus'
const router = useRouter();
if (isLoggedIn()) {
  router.push({
    name: 'MyCloud'
  });
}
else {
  router.push({
    name: 'login'
  });
}

const messageStore = useMessageStore()
// https://pinia.vuejs.org/core-concepts/actions.html#subscribing-to-actions
const unsubscribe = messageStore.$onAction(
  ({
    name, // name of the action
    store, // store instance, same as `someStore`
    args, // array of parameters passed to the action
    after, // hook after the action returns or resolves
    onError, // hook if the action throws or rejects
  }) => {
    if (name === 'send') {
      ElMessage({
        message: args[0],
        type: args[1],
      })
    }
  }
)

</script>

<template>
  <router-view></router-view>
</template>

<style>
</style>
