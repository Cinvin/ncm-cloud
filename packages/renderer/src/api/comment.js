import request from '@/utils/request';

// 歌曲评论
export const getSongComment = params =>
  request.get(`/comment/music`, { params })
// 歌单评论
export const getPlaylistComment = params =>
  request.get(`/comment/playlist`, { params })
// 热门评论
export const getHotComment = params =>
  request.get(`/comment/hot`, { params })
// mv评论
export const getMvComment = params =>
  request.get('/comment/mv', { params })