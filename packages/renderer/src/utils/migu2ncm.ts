
import { getAlbum } from '../api/album';
import { getArtistAllSongs } from '../api/artist'
import { getSingerAlbumsSongs,getAlbumSongs } from '../api/migu'
import { cloudDiskTrackDetail } from '../api/cloud'
export function generateSingerTasks(ncmId: number, miguId: string,
    limitOption:{CopyRight: boolean,VIP: boolean,FLAC: boolean}) {
    let promisencm = getArtistAllSongs(ncmId);
    let promisemigu = getSingerAlbumsSongs(miguId)
    return Promise.all([promisencm,promisemigu]).then(async (values)=>{
        let ncmSongs=values[0]
        let miguSongs=values[1]
        // console.log(ncmSongs)
        // console.log(miguSongs)
        //step.1 匹配 去重(如 英雄:英雄和周杰伦的床边故事:英雄 是同一文件(同一contentId))
        let matchList=[]
        let inCloudList=[]
        let inCloudIdList=[]
        let contentIdList=[]
        for (let ncmSong of ncmSongs){

            let ncmSongSubName=''
            if (ncmSong.name.indexOf('(')>=0){
                ncmSongSubName=ncmSong.name.split('(')[0].trim()
                if (ncmSongs.find((song)=>{
                    return song.name.startsWith(ncmSongSubName) && song.al.id==song.al.id && song.id!=ncmSong.id
                })){
                    ncmSongSubName=''
                }
            }

            let find=miguSongs.find((song)=>{
                // console.log(song.artists.split('|').sort().toString(),ncmSong.ar.map((artist)=>(artist.name)).sort().toString())
                return (song.name == ncmSong.name || song.subName == ncmSongSubName)
                 && song.album == ncmSong.al.name
                //  && song.artists.split('|').sort().toString()==ncmSong.ar.map((artist: { name: any; })=>(artist.name)).sort().toString()
            })
            if (find){
                let findmatch=contentIdList.find((match)=>{
                    return match==find?.contentId 
                })
                if (findmatch){
                    continue
                }
                else{
                    contentIdList.push(find.contentId)
                }
                let matchItem={
                    ncmSongId:ncmSong.id,
                    migucontentId:find.contentId,
                    miguURL:find.bestQualityUrl,
                    miguformatType:find.bestQualityformatType,
                    miguFileType:find.bestQualityFileType,
                    miguSize:find.bestQualitySize,
                    songName:ncmSong.name,
                    albumName:ncmSong.al.name,
                    artists:find.artists,
                    isInCloud:ncmSong.privilege.cs==true,
                    isNoCopyRight:ncmSong.privilege.st==-200,
                    isVIP:ncmSong.fee==1 || ncmSong.fee==4,
                    status:'未开始',
                    sort:3,
                    progress:0,
                }
                if (matchItem.isInCloud){
                    inCloudList.push(matchItem)
                    inCloudIdList.push(Number(matchItem.ncmSongId))
                }
                else{
                    matchList.push(matchItem)
                }
            }
        }

        if (inCloudList.length>0){
            let cloudDetailList=await cloudDiskTrackDetail(inCloudIdList)
            // console.log(cloudDetailList)
            for (let item of cloudDetailList.data){
                let taskItem=inCloudList.find((match)=>{
                    return match.ncmSongId==item.simpleSong.id})
                    // console.log(item)
                    // console.log(taskItem)
                if (taskItem && taskItem.miguSize>item.fileSize){
                    matchList.push(taskItem)
                }
            }
        }

        // console.log(matchList)
        //step.2 过滤
        let taskList=[]
        for (let item of matchList){
            // if (item.isInCloud){
            //     continue
            // }
            
            if ((limitOption.CopyRight&&item.isNoCopyRight)||
            (limitOption.VIP&&item.isVIP)||
            (limitOption.FLAC&&item.miguFileType!='mp3')){
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
    return Promise.all([promisencm,promisemigu]).then(async (values:any)=>{
        let ncmSongs=values[0].songs
        let miguSongs=values[1]
        
        let matchList=[]
        let inCloudList=[]
        let inCloudIdList=[]
        let contentIdList=[]
        for (let ncmSong of ncmSongs){
            
            let ncmSongSubName=''
            if (ncmSong.name.indexOf('(')>=0){
                ncmSongSubName=ncmSong.name.split('(')[0].trim()
                if (ncmSongs.find((song: { name: string; id: any; })=>{
                    return song.name.startsWith(ncmSongSubName) && song.id!=ncmSong.id
                })){
                    ncmSongSubName=''
                }
            }


            let find=miguSongs.find((song: { name: any; subName: string; artists: { split: (arg0: string) => { (): any; new(): any; sort: { (): { (): any; new(): any; toString: { (): any; new(): any; }; }; new(): any; }; }; }; })=>{
                return (song.name == ncmSong.name || song.subName == ncmSongSubName)
                //  && song.artists.split('|').sort().toString()==ncmSong.ar.map((artist: { name: any; })=>(artist.name)).sort().toString()
            })

            if (find){
                let findmatch=contentIdList.find((match)=>{
                    return match==find?.contentId 
                })
                if (findmatch){
                    continue
                }
                else{
                    contentIdList.push(find.contentId)
                }
                let matchItem={
                    ncmSongId:ncmSong.id,
                    migucontentId:find.contentId,
                    miguURL:find.bestQualityUrl,
                    miguformatType:find.bestQualityformatType,
                    miguFileType:find.bestQualityFileType,
                    miguSize:find.bestQualitySize,
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
                if (matchItem.isInCloud){
                    inCloudList.push(matchItem)
                    inCloudIdList.push(matchItem.ncmSongId)
                }
                else{
                    matchList.push(matchItem)
                }
            }
        }

        if (inCloudList.length>0){
            let cloudDetailList=await cloudDiskTrackDetail(inCloudIdList)
            for (let item of cloudDetailList.data){
                let taskItem=inCloudList.find((match)=>{
                    return match.ncmSongId==item.simpleSong.id})
                if (taskItem && taskItem.miguSize>item.fileSize){
                    matchList.push(taskItem)
                }
            }
        }

        // console.log(matchList)
        //step.2 过滤
        let taskList=[]
        for (let item of matchList){
            // if (item.isInCloud){
            //     continue
            // }
            if ((limitOption.CopyRight&&item.isNoCopyRight)||
            (limitOption.VIP&&item.isVIP)||
            (limitOption.FLAC&&item.miguFileType!='mp3')){
                taskList.push(item)
            }
        }
        return taskList
    })
}