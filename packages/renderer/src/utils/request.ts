import axios from 'axios';
import { getCookie } from './auth';

let baseURL = 'http://localhost:21879';

const service = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

service.interceptors.request.use(function (config) {
  if (!config.params) config.params = {};
  if (baseURL[0] !== '/' && !process.env.IS_ELECTRON) {
    config.params.cookie = `MUSIC_U=${getCookie('MUSIC_U')};`;
  }

  return config;
});

service.interceptors.response.use(
  response => {
    const res = response.data;
    return res;
  },
  error => {
    return Promise.reject(error);
  }
);

export default service;