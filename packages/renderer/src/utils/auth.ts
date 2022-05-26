import Cookies from 'js-cookie';
// const logout = require('../api/auth.js');
import { logout } from '../api/auth';

export function setCookies(strCookie:string) {
  let str=strCookie.replace('; ;',';;').replace('; HTTPOnly;',';;')
  const cookies = str.split(';;');
  cookies.map(cookie => {
    document.cookie = cookie;
    const cookieKeyValue = cookie.split(';')[0].split('=');
    localStorage.setItem(`cookie-${cookieKeyValue[0]}`, cookieKeyValue[1]);
  });
}

export function getCookie(key:string) {
  return Cookies.get(key) ?? localStorage.getItem(`cookie-${key}`);
}

export function removeCookie(key:string) {
  Cookies.remove(key);
  localStorage.removeItem(`cookie-${key}`);
}

// MUSIC_U 只有在账户登录的情况下才有
export function isLoggedIn() {
  return getCookie('MUSIC_U') !== null && getCookie('MUSIC_U') !== undefined;
}

export function doLogout() {
  logout();
  removeCookie('MUSIC_U');
  removeCookie('__csrf');
}