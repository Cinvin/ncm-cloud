import Cookies from 'js-cookie';
import { logout } from '../api/auth';

export function setCookies(strCookie: string) {
  let cookies = strCookie.split(';;')
  cookies.map((cookie) => {
    document.cookie = cookie
  })
  let strs = strCookie.split(';')
  for (let item of strs) {
    if (item.startsWith('MUSIC_') && item.includes('=')) {
      document.cookie = item
      let spls = item.split('=')
      localStorage.setItem(`cookie-${spls[0]}`, spls[1]);
    }
  }
}

export function getCookie(key: string) {
  return Cookies.get(key) ?? localStorage.getItem(`cookie-${key}`);
}

export function removeCookie(key: string) {
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