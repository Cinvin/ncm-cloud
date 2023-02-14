import dayjs from "dayjs";

export function fileSizeDesc(fileSize: number) {
    if (fileSize < 1024) {
        return fileSize.toFixed(2) + 'B'
    } else if (fileSize >= 1024 && fileSize < Math.pow(1024, 2)) {
        return (fileSize / 1024).toFixed(2).toString() + 'K'
    } else if (fileSize >= Math.pow(1024, 2) && fileSize < Math.pow(1024, 3)) {
        return (fileSize / Math.pow(1024, 2)).toFixed(2).toString() + 'M';
    } else if (fileSize > Math.pow(1024, 3)) {
        return (fileSize / Math.pow(1024, 3)).toFixed(2).toString() + 'G';
    } else if (fileSize > Math.pow(1024, 4)) {
        return (fileSize / Math.pow(1024, 4)).toFixed(2).toString() + 'T';
    }
}

export function isAudio(fileName = '') {
    const all = [
        'avi',
        'wmv',
        'mpg',
        'mpeg',
        'mov',
        'rm',
        'ram',
        'swf',
        'flv',
        'mp4',
        'mp3',
        'wma',
        'avi',
        'rm',
        'rmvb',
        'flv',
        'mpg',
        'mkv',
        'flac',
    ];

    const suffix = fileName.split('.').pop() ?? '';
    return all.includes(suffix);
}

export function levelDesc(level: string) {
    switch (level) {
        case 'standard':
            return '标准'
        case 'higher':
            return '较高'
        case 'exhigh':
            return '极高'
        case 'lossless':
            return '无损'
        case 'hires':
            return 'Hi-Res'
        default:
            return ''
    }
}
export function duringTimeDesc(dt = 0) {
    return dayjs(dt).format('mm:ss')
}