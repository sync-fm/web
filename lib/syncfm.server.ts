export const runtime = 'nodejs';
import { SyncFM } from '@/syncfm.ts'
import syncfmconfig from '@/syncfm.config'

const serverSyncfm = new SyncFM(syncfmconfig)

export async function getConvertedForUrl(originalUrl: string) {
  if (!originalUrl || !originalUrl.startsWith('http')) return null

  const inputType = serverSyncfm.getInputTypeFromUrl(originalUrl)
  if (!inputType) return null

  switch (inputType) {
    case 'song': {
      const input = await serverSyncfm.getInputSongInfo(originalUrl)
      return await serverSyncfm.convertSong(input, 'spotify')
    }
    case 'album': {
      const input = await serverSyncfm.getInputAlbumInfo(originalUrl)
      return await serverSyncfm.convertAlbum(input, 'spotify')
    }
    case 'artist': {
      const input = await serverSyncfm.getInputArtistInfo(originalUrl)
      return await serverSyncfm.convertArtist(input, 'spotify')
    }
    default:
      return null
  }
}

export { serverSyncfm }
