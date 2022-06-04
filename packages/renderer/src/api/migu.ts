const axios = require('axios')

function search(keyword: string, searchType: number) {
	let filterstr = '{"song":0,"album":0,"singer":1,"tagSong":0,"mvSong":0,"songlist":0,"bestShow":1}';
	if (searchType == 2) {
		filterstr = '{"song":0,"album":1,"singer":0,"tagSong":0,"mvSong":0,"songlist":0,"bestShow":1}';
	}
	else if (searchType == 3) {
		filterstr = '{"song":1,"album":0,"singer":0,"tagSong":0,"mvSong":0,"songlist":0,"bestShow":1}';
	}
	const url =
		'https://pd.musicapp.migu.cn/MIGUM3.0/v1.0/content/search_all.do?' +
		'&ua=Android_migu&version=5.0.1&pageNo=1&pageSize=10&text=' +
		encodeURIComponent(keyword) +
		'&searchSwitch=' + filterstr;

	return axios.get(url)
		.then((response: any) => {
			// console.log(response)
			// console.log(response.data.singerResultData.result)
			return response
		})
		.catch((e: any) => {
			console.log(e)
		})
};
export function searchSinger(keyword: string) {
	return search(keyword, 1).then((res: any) => {
		// console.log(res)
		// [
		// 	{ id: '112', name: '周杰伦', highlightStr: [ '周杰伦' ] },
		// 	{ id: '1002359216', name: '周杰伦战队', highlightStr: [ '周杰伦' ] }
		// ]
		if (res && res.data.singerResultData.result) {
			return res.data.singerResultData.result
		}
		return []
	})
		.catch(() => { return [] })
}

export function searchAlbum(keyword: string) {
	return search(keyword, 2).then((res: any) => {
		// console.log(res)
		// [
		// 	{
		// 	  id: '23799',
		// 	  resourceType: '2003',
		// 	  name: '2004无与伦比演唱会',
		// 	  type: '1',
		// 	  singer: '周杰伦',
		// 	  highlightStr: [ '2004无与伦比演唱会', '2004', '无与伦比', '演唱会' ],
		// 	  publishDate: '2005-01-21',
		// 	  desc: '2005-01-21',
		// 	  imgItems: [ [Object], [Object], [Object] ],
		// 	  albumAliasName: '周杰伦 2004 无与伦比 演唱会 Live CD、Jay Chou 2004 Incomparable Concert Live'
		// 	},
		// ]
		if (res && res.data.albumResultData.result) {
			return res.data.albumResultData.result
		}
		return []
	})
		.catch(() => { return [] })
}

export function searchSong(keyword: string) {
	return search(keyword, 3).then((res: any) => {
		// console.log(res)
		// [
		// 	{
		// 	  id: '1118694834',
		// 	  resourceType: '2',
		// 	  contentId: '600907000009041435',
		// 	  copyrightId: '6005479Z068',
		// 	  name: '说好不哭 (With 五月天阿信)',
		// 	  highlightStr: [ '说好不哭' ],
		// 	  singers: [ [Object] ],
		// 	  albums: [ [Object] ],
		// 	  tags: [
		// 		'流行',     '爱情',
		// 		'国语',     '伤感',
		// 		'黄昏',     '台湾',
		// 		'10年代',   '抖音',
		// 		'抒情流行', '原创单曲',
		// 		'录音室版'
		// 	  ],
		// 	  lyricUrl: 'http://d.musicapp.migu.cn/prod/file-service/file-down/4eedd78464c21ce789dea6928415b323/a7838a4bea1c9c07362b225eb0c75ebc/c8a3e6bd05a3a387c34c603d655e5268',
		// 	  trcUrl: '',
		// 	  imgItems: [ [Object], [Object], [Object] ],
		// 	  televisionNames: [ '' ],
		// 	  tones: [ [Object] ],
		// 	  mvList: [ [Object] ],
		// 	  relatedSongs: [ [Object], [Object], [Object], [Object], [Object] ],
		// 	  toneControl: '111111',
		// 	  rateFormats: [ [Object], [Object], [Object], [Object] ],
		// 	  newRateFormats: [ [Object], [Object], [Object], [Object] ],
		// 	  songType: '01',
		// 	  isInDAlbum: '0',
		// 	  copyright: '1',
		// 	  digitalColumnId: '27486851',
		// 	  mrcurl: 'http://d.musicapp.migu.cn/prod/file-service/file-down/4eedd78464c21ce789dea6928415b323/5ff8fe6e91e0d03b99a2391b58c2fc5d/5fc61c35685ea7c79b74dda9c1c06ded',
		// 	  songDescs: '',
		// 	  songAliasName: "Won't cry",
		// 	  invalidateDate: '2024-12-31',
		// 	  isInSalesPeriod: '0',
		// 	  dalbumId: '600927015009000281',
		// 	  isInSideDalbum: '1',
		// 	  vipType: '1',
		// 	  chargeAuditions: '1',
		// 	  scopeOfcopyright: '01',
		// 	  mvCopyright: '01'
		// 	},
		// ]
		if (res && res.data.songResultData.result) {
			return res.data.songResultData.result
		}
		return []
	})
		.catch(() => { return [] })
}

export function songItemformat(song: any) {
	let item = {
		id: song.songId,
		name: dealSongName(song.songName || song.name),
		album: song.album || song.albums && song.albums[0],
		artists: song.singer || song.singers,
		contentId: song.contentId,
		bestQualityformatType: '',
		bestQualityUrl: ''
	};
	let resources = song.newRateFormats.map((detail: any) => ({
		formatType: detail.formatType,
		url: encodeURI(detail.url || detail.androidUrl),
	}))
	if (resources.length > 0) {
		resources.sort((a: { formatType: string }, b: { formatType: string }) => {
			return formatTypePriority(a.formatType) - formatTypePriority(b.formatType)
		})
		let tageturl = resources[0].url
		if (tageturl.startsWith('$')) {
			item.bestQualityformatType = resources[0].formatType;
			let toneFlag = item.bestQualityformatType
			item.bestQualityUrl = `https://app.pd.nf.migu.cn/MIGUM3.0/v1.0/content/sub/listenSong.do?channel=mx&copyrightId=${song.copyrightId}&contentId=${song.contentId}&toneFlag=${toneFlag}&resourceType=${song.resourceType}&userId=15548614588710179085069&netType=00`;
		}
		else {
			let urlObj = new URL(resources[0].url);
			urlObj.protocol = 'http';
			urlObj.hostname = 'freetyst.nf.migu.cn';
			item.bestQualityUrl = urlObj.href;
			item.bestQualityformatType = resources[0].formatType;
		}
	}
	return item
};
function formatTypePriority(formatType: string) {
	return ['SQ', 'HQ', 'PQ', 'LQ', 'ZQ'].indexOf(formatType)
}
function dealSongName(songName: string) {
	if (songName.endsWith('曲)') || songName.endsWith('原声带)') || songName.endsWith('背景音乐)')) {
		let splits = songName.split('(')
		if (splits.length > 2) {
			splits.pop()
			songName = splits.join('(')
		}
		else {
			songName = splits[0]
		}
	}

	songName = songName.replace('(Live版)', '(Live)')
		.replace('（Live）', '(Live)')
		.replace('(live版)', '(Live)')
		.replace('(现场版)', '(Live)')
		.replace('(数字专辑)', '')
		// .replace(/\s*\(/, '(')
		.trim()
		
	return songName
}

async function getSingerSongs(id: string) {
	let songList = []
	let url = `https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/song-list/release?pageNo=1&pageSize=50&singerId=${id}&songType=0&templateVersion=1`
	while (true) {
		let response = await axios.get(url)
		// console.log(response.data.data.contentItemList[0].itemList)
		let itemlist = response.data.data.contentItemList[0].itemList

		for (let item of itemlist) {
			if (item.song) {
				songList.push(songItemformat(item.song))
			}
		}

		if (response.data.data.nextPageUrl) {
			url = response.data.data.nextPageUrl
		}
		else {
			break;
		}
	}
	console.log(songList)
	return songList
}

export async function getSingerAlbumsSongs(id: string) {
	let songList = []
	let albumList = await getSingerAlbums(id)
	for (let album of albumList) {
		let albumSongs = await getAlbumSongs(album.id, album.resourceType)
		songList.push(...albumSongs)
	}
	return songList
}

async function getSingerAlbums(id: string) {
	let albumList = []
	let url = `https://app.c.nf.migu.cn/MIGUM3.0/v1.0/template/singerAlbum/release?singerId=${id}&templateVersion=1`
	while (true) {
		let response = await axios.get(url)
		// console.log(response.data.data)
		let itemlist = response.data.data.contentItemList[1].itemList

		for (let item of itemlist) {
			if (item.title) {
				albumList.push({ name: item.title, id: item.actionUrl.match(/(\d*?)$/)[0], resourceType: item.actionUrl.startsWith('mgmusic://album-info') ? '2003' : '5' })
			}
		}

		if (response.data.data.nextPageUrl) {
			url = response.data.data.nextPageUrl
		}
		else {
			break;
		}
	}
	// console.log(albumList)
	return albumList
}
export async function getAlbumSongs(id: string, resourceType: string) {
	//resourceType:2003:普通专辑 5:数字专辑
	let songList = []
	// backUP:https://app.c.nf.migu.cn/MIGUM3.0/resource/album/song/v2.0?albumId=600927015009000351
	// backup:https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/queryAlbumSong?albumId=${id}&pageNo=1
	let url = `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/resourceinfo.do?needSimple=01&resourceId=${id}&resourceType=${resourceType}`
	let response = await axios.get(url)
	if (response.data.resource[0] && response.data.resource[0].songItems) {
		for (let item of response.data.resource[0].songItems) {
			songList.push(songItemformat(item))
		}
	}
	return songList
}