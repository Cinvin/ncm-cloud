import request from '../utils/request';

export const getSearchSuggest = (keywords: string) => request.get('/search/suggest', { params: { keywords } })
export const getSearchHot = () => request.get('/search/hot')

export const getSearch = (params: any) => request.get(`/search`, { params })

export async function getstrictSearch(artists: string[], album: string, songName: string) {
    let hasMore = true
    let offset = 0
    let limit = 100
    while (hasMore) {
        let res:any = await getSearch({ keywords: songName, type: 1, offset: offset, limit: limit })
        hasMore = res.result.hasMore
        let find = res.result.songs.find((song: { name: string; album: { name: string; }; artists: any; }) => {
            if (song.name == songName && song.album.name == album) {
                let artistflag = true
                for (let artist of artists) {
                    if (song.artists.find((singer: { name: string; }) => singer.name == artist)) {
                        continue
                    }
                    else {
                        artistflag = false
                        break
                    }
                }
                // if (artistflag && artists.length==song.artists.length){
                if (artistflag) {
                    return true
                }
            }
        })
        if (find) {
            return find
        }
        offset += limit
    }
    return null
}

export const getCloudSearch = (params: any) => request.get(`/cloudsearch`, { params })