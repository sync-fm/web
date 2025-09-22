export const runtime = 'nodejs';
import { SyncFM } from 'syncfm.ts'
import syncfmconfig from '@/syncfm.config'

let serverSyncfm: SyncFM | null = null;
function getServerSyncfm(): SyncFM {
  if (!serverSyncfm) {
    serverSyncfm = new SyncFM(syncfmconfig);
  }
  return serverSyncfm;
}

export async function getConvertedForUrl(originalUrl: string) {
  if (!originalUrl || !originalUrl.startsWith('http')) return null

  try {
    const ss = getServerSyncfm();
    const inputType = ss.getInputTypeFromUrl(originalUrl)

    if (!inputType) return null

    switch (inputType) {
      case 'song': {
        return await ss.getInputSongInfo(originalUrl)
      }
      case 'album': {
        return await ss.getInputAlbumInfo(originalUrl)
      }
      case 'artist': {
        return await ss.getInputArtistInfo(originalUrl)
      }
      default:
        return null
    }
  } catch (err) {
    // Return null on any error to allow callers (like generateMetadata)
    // to fail gracefully instead of causing a module import-time crash.
    console.warn('getConvertedForUrl failed:', err);
    return null;
  }
}

export { getServerSyncfm as serverSyncfm }
