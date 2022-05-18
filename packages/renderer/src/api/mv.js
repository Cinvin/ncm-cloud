import request from '@/utils/request';

export function allMvs({ area, order, type, offset }) {
    return request({
      url: '/mv/all',
      method: 'get',
      params: {
        limit: 12,
        area,
        order,
        type,
        offset
      }
    });
  }

  export const getMvDetail = id => request.get(`/mv/detail?mvid=${id}`)

  export const getMvUrl = id => request.get(`/mv/url?id=${id}`)
  
  export const getSimiMv = id => request.get(`/simi/mv?mvid=${id}`)
  