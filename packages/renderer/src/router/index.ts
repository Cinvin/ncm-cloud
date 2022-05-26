import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '../views/MainPage.vue'
import LoginPage from '../views/LoginPage.vue'

import MyCloud from '../components/MyCloud.vue'
import LocalUpload from '../components/LocalUpload.vue'
import MiguUpload from '../components/MiguUpload.vue'

const routes = [
  { path: '/', redirect: { name: 'MyCloud' } },
  {
    name: 'main', path: '/main', component: MainPage, redirect: { name: 'MyCloud' },
    children: [
      { name: 'MyCloud', path: 'MyCloud', component: MyCloud },
      { name: 'LocalUpload', path: 'LocalUpload', component: LocalUpload },
      { name: 'MiguUpload', path: 'MiguUpload', component: MiguUpload },
    ]
  },
  { name: 'login', path: '/login', component: LoginPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router;