import request from '@/utils/request';
export const getAlbum=id=>request.get(`/album?id=${id}`)