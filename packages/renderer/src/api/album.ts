import request from '../utils/request';
export function getAlbum(id:number){
    return request.get(`/album?id=${id}`)
}