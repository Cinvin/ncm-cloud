<script setup lang="ts">
import QRCode from 'qrcode';
import { ref, reactive, onDeactivated } from 'vue'
import { setCookies } from '../utils/auth';
import { useMessageStore } from "../stores/message";
import { useRouter } from "vue-router";
import { loginWithPhone, loginWithEmail, loginQrCodeKey, loginQrCodeCheck } from "../api/auth";

const router = useRouter();

const messageStore = useMessageStore()
let activeName = ref('qr')

let formPhone = reactive({
  phone: '',
  password: '',
})
let formEmail = reactive({
  email: '',
  password: '',
})

let qrCode = reactive({
  key: '',
  svg: '',
  infor: ''
})
let processing = ref(false)

let qrCodeCheckInterval: any = null

// https://github.com/Binaryify/NeteaseCloudMusicApi/blob/master/public/login.html

// 手机
function onPhoneSubmit() {
  if (!formPhone.phone || !formPhone.password) {
    const msg = '请设置你的手机号码和密码'
    messageStore.send(msg, 'error')
    throw new Error(msg)
  }
  loginWithPhone(formPhone)
    .then(handleLoginResponse)
    .catch((error: any) => {
      processing.value = false;
      messageStore.send(`发生错误，请检查你的账号密码是否正确\n${error}`, 'error')
    });
}

// 邮箱
function onEmailSubmit() {
  if (!formEmail.email || !formEmail.password) {
    const msg = '请设置你的手机号码和密码'
    messageStore.send(msg, 'error')
    throw new Error(msg)
  }
  loginWithEmail(formEmail)
    .then(handleLoginResponse)
    .catch((error: any) => {
      processing.value = false;
      messageStore.send(`发生错误，请检查你的账号密码是否正确\n${error}`, 'error')
    });
}

// 二维码
function getQrCodeKey() {
  return loginQrCodeKey().then((result: any) => {
    if (result.code === 200) {
      qrCode.key = result.data.unikey;
      QRCode.toString(
        `https://music.163.com/login?codekey=${qrCode.key}`,
        {
          width: 192,
          margin: 0,
          color: {
            dark: '#335eea',
            light: '#00000000',
          },
          type: 'svg',
        }
      )
        .then(svg => {
          qrCode.svg = `data:image/svg+xml;utf8,${encodeURIComponent(
            svg
          )}`;
        })
        .catch(err => {
          console.error(err);
        })
    }
    checkQrCodeLogin();
  });
}

function checkQrCodeLogin() {
  qrCodeCheckInterval = setInterval(() => {
    if (qrCode.key === '') return;
    loginQrCodeCheck(qrCode.key).then((result: any) => {
      if (result.code === 800) {
        getQrCodeKey(); // 重新生成QrCode
        qrCode.infor = '二维码已失效，请重新扫码'
      } else if (result.code === 802) {
        qrCode.infor = '扫描成功，请在手机上确认登录'
      } else if (result.code === 801) {
        qrCode.infor = '打开网易云音乐APP扫码登录'
      } else if (result.code === 803) {
        clearInterval(qrCodeCheckInterval);
        qrCode.infor = '登录成功，请稍等...'
        result.code = 200;
        result.cookie = result.cookie.replace('HTTPOnly', '');
        handleLoginResponse(result);
      }
    });
  }, 1000);
}
onDeactivated(() => {
  clearInterval(qrCodeCheckInterval);
})
function modeChange(tabname: string) {
  console.log(tabname)
  if (tabname === 'qrCode') {
    checkQrCodeLogin();
  } else {
    clearInterval(qrCodeCheckInterval);
  }
}


function handleLoginResponse(this: any, data: any) {
  if (!data) {
    processing.value = false;
    return;
  }
  if (data.code === 200) {
    setCookies(data.cookie);
    clearInterval(qrCodeCheckInterval);
    router.push({ name: 'main' });
  } else {
    processing.value = false;
    messageStore.send(data.msg ?? data.message ?? '账号或密码错误，请检查', 'error')
  }
}

getQrCodeKey()
</script>

<template>
  <div>
    <el-card class="login-box">
      <el-tabs v-model="activeName" @tab-change="modeChange" stretch>
        <el-tab-pane label="二维码" name="qr">
          <el-row v-show="qrCode.svg" justify="center">
            <img :src="qrCode.svg" class="qrCode" />
          </el-row>
          <el-row v-show="qrCode.infor" justify="center">
            {{ qrCode.infor }}
          </el-row>
        </el-tab-pane>
        <el-tab-pane label="手机" name="phone">
          <el-form label-width="100px" :model="formPhone" style="max-width: 460px">
            <el-form-item label="手机">
              <el-input v-model="formPhone.phone" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="formPhone.password" type="password" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onPhoneSubmit">登录</el-button>
            </el-form-item>

          </el-form>
        </el-tab-pane>
        <el-tab-pane label="邮箱" name="email">
          <el-form label-width="100px" :model="formEmail" style="max-width: 460px">
            <el-form-item label="邮箱">
              <el-input v-model="formEmail.email" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="formEmail.password" type="password" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onEmailSubmit">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.login-box {
  width: 450px;
  height: 300px;
  background-color: #fff;
  border-radius: 3px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.qrCode {
  margin: auto
}
</style>
