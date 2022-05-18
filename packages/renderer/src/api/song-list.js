import request from '@/utils/request';

export const getListDetail = params =>
  request.get('/playlist/detail', { params })