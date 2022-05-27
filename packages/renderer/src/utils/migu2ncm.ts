
import { getAlbum } from '../api/album';
import { getArtistAllSongs } from '../api/artist'
import { getSingerAlbumsSongs,getAlbumSongs } from '../api/migu'
export function generateSingerTasks(ncmId: number, miguId: string,
    limitOption:{CopyRight: boolean,VIP: boolean,FLAC: boolean}) {
    let promisencm = getArtistAllSongs(ncmId);
    let promisemigu = getSingerAlbumsSongs(miguId)
    return Promise.all([promisencm,promisemigu]).then((values)=>{
        let ncmSongs=values[0]
        let miguSongs=values[1]
        
        //step.1 匹配 去重(如 英雄:英雄和周杰伦的床边故事:英雄 是同一文件(同一contentId))
        let matchList=[]
        for (let ncmSong of ncmSongs){
            let find=miguSongs.find((song)=>{
                // console.log(song.artists.split('|').sort().toString(),ncmSong.ar.map((artist)=>(artist.name)).sort().toString())
                return song.name == ncmSong.name
                 && song.album == ncmSong.al.name
                 && song.artists.split('|').sort().toString()==ncmSong.ar.map((artist: { name: any; })=>(artist.name)).sort().toString()
            })
            if (find){
                let findmatch=matchList.find((match)=>{
                    return match.migucontentId==find?.contentId 
                })
                if (findmatch){
                    continue
                }
                let matchItem={
                    ncmSongId:ncmSong.id,
                    migucontentId:find.contentId,
                    miguURL:find.bestQualityUrl,
                    miguformatType:find.bestQualityformatType,
                    songName:ncmSong.name,
                    albumName:ncmSong.al.name,
                    artists:find.artists,
                    isInCloud:ncmSong.privilege.cs,
                    isNoCopyRight:ncmSong.privilege.st==-200,
                    isVIP:ncmSong.fee==1 || ncmSong.fee==4,
                    status:'未开始',
                    sort:3,
                    progress:0,
                }
                matchList.push(matchItem)
            }
        }
        // console.log(matchList)
        //step.2 过滤
        let taskList=[]
        for (let item of matchList){
            if (item.isInCloud){
                continue
            }
            if ((limitOption.CopyRight&&item.isNoCopyRight)||
            (limitOption.VIP&&item.isVIP)||
            (limitOption.FLAC&&item.miguformatType=='SQ')){
                taskList.push(item)
            }
        }
        return taskList
    })
}

export function generateAlbumTasks(ncmId: number, miguId: string,miguresourceType:string,
    limitOption:{CopyRight: boolean,VIP: boolean,FLAC: boolean}) {
    let promisencm = getAlbum(ncmId);
    let promisemigu = getAlbumSongs(miguId,miguresourceType)
    return Promise.all([promisencm,promisemigu]).then((values:any)=>{
        let ncmSongs=values[0].songs
        let miguSongs=values[1]
        
        let matchList=[]
        for (let ncmSong of ncmSongs){
            //已在云盘 跳过
            // if(ncmSong.privilege.cs){
            //     continue
            // }
            let find=miguSongs.find((song: { name: any; artists: { split: (arg0: string) => { (): any; new(): any; sort: { (): { (): any; new(): any; toString: { (): any; new(): any; }; }; new(): any; }; }; }; })=>{
                return song.name == ncmSong.name
                 && song.artists.split('|').sort().toString()==ncmSong.ar.map((artist: { name: any; })=>(artist.name)).sort().toString()
            })
            if (find){
                let findmatch=matchList.find((match)=>{
                    return match.migucontentId==find?.contentId 
                })
                if (findmatch){
                    continue
                }
                let matchItem={
                    ncmSongId:ncmSong.id,
                    migucontentId:find.contentId,
                    miguURL:find.bestQualityUrl,
                    miguformatType:find.bestQualityformatType,
                    songName:ncmSong.name,
                    albumName:ncmSong.al.name,
                    artists:find.artists,
                    isInCloud:ncmSong.privilege.cs,
                    isNoCopyRight:ncmSong.privilege.st==-200,
                    isVIP:ncmSong.fee==1 || ncmSong.fee==4,
                    status:'未开始',
                    sort:3,
                    progress:0,
                }
                matchList.push(matchItem)
            }
        }
        // console.log(matchList)
        //step.2 过滤
        let taskList=[]
        for (let item of matchList){
            if (item.isInCloud){
                continue
            }
            if ((limitOption.CopyRight&&item.isNoCopyRight)||
            (limitOption.VIP&&item.isVIP)||
            (limitOption.FLAC&&item.miguformatType=='SQ')){
                taskList.push(item)
            }
        }
        return taskList
    })
}