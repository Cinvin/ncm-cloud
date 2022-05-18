import request from '@/utils/request';

export const getSearchSuggest = (keywords) => request.get('/search/suggest', { params: { keywords } })
export const getSearchHot = () => request.get('/search/hot')

export const getSearch = (params) => request.get(`/search`, { params })
