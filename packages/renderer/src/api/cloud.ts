import request from '../utils/request';
/**
 * 上传歌曲到云盘（需要登录）
 */
export function uploadSong(file:File) {
    let formData = new FormData();
    formData.append('songFile', file);
    return request({
        url: '/cloud',
        method: 'post',
        params: {
            timestamp: new Date().getTime(),
        },
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        timeout: 200000,
    })
}

/**
 * 获取云盘歌曲（需要登录）
 * 说明 : 登录后调用此接口 , 可获取云盘数据 , 获取的数据没有对应 url, 需要再调用一 次 /song/url 获取 url
 * - limit : 返回数量 , 默认为 200
 * - offset : 偏移数量，用于分页 , 如 :( 页数 -1)*200, 其中 200 为 limit 的值 , 默认为 0
 * @param {Object} params
 * @param {number} params.limit
 * @param {number=} params.offset
 */
export function cloudDisk(params:{ limit: number, offset: number, [timestamp: string]: any}) {
    params.timestamp = new Date().getTime();
    return request({
        url: '/user/cloud',
        method: 'get',
        params,
    });
}

/**
 * 获取云盘歌曲详情（需要登录）
 */
export function cloudDiskTrackDetail(id: number) {
    return request({
        url: '/user/cloud/detail',
        method: 'get',
        params: {
            timestamp: new Date().getTime(),
            id,
        },
    });
}

/**
 * 删除云盘歌曲（需要登录）
 * @param {Array} id
 */
export function cloudDiskTrackDelete(id: number) {
    return request({
        url: '/user/cloud/del',
        method: 'get',
        params: {
            timestamp: new Date().getTime(),
            id,
        },
    });
}

/**
* 云盘歌曲匹配纠正（需要登录）
* 说明 : 登录后调用此接口,可对云盘歌曲信息匹配纠正,如需取消匹配,asid 需要传 0
* uid: 用户 id
* sid: 云盘的歌曲 id
* asid: 要匹配的歌曲 id
* @param {Object} params
* @param {number} params.uid
* @param {number} params.sid
* @param {number} params.asid
*/
export function cloudDiskTrackMatch(params: Object) {
    return request({
        url: '/cloud/match',
        method: 'get',
        params,
    });
}