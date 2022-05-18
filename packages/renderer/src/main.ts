import { createApp } from 'vue'
import App from './App.vue'
import './samples/node-api'
import router from './router/index'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app
  .use(router)
  .use(createPinia())
  .mount('#app')
  .$nextTick(window.removeLoading)
