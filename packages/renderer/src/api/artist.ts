import { orderBy } from 'lodash';
import request from '../utils/request';

export function getArtists (id:number ){
    return request.get(`/artists?id=${id}`)
}

export function getArtistSongs (id:number,limit=30,offset=0,order='hot'){
    return request.get(`/artist/songs?id=${id}&limit=${limit}&offset=${offset}&order${order}`)
}

export async function getArtistAllSongs (id:number){
    let songList=[]
    let hasMore=true
    let limit = 100
    let offset = 0
    while (hasMore){
        let response = await getArtistSongs(id,limit,offset)
        // console.log(response)
        hasMore=response.more
        songList.push(...response.songs)
        offset+=limit
    }
    return songList
}