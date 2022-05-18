import request from '@/utils/request';

export const getArtists = id => request.get(`/artists?id=${id}`)