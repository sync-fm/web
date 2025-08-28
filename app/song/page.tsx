
import type { Metadata } from 'next'
import { SongView } from '@/components/SongView'
import { getConvertedForUrl } from '@/lib/syncfm.server'
import { getThinBackgroundColorFromImageUrl } from '@/lib/serverColors'
import { SyncFMSong } from '@/syncfm.ts';
export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any): Promise<Metadata> {
    const paramsObj = props.params ? await props.params : undefined;
    // Prefer paramsObj.searchParams, fall back to props.searchParams. Use optional chaining to avoid throws.
    const rawUrl = paramsObj?.searchParams?.url ?? await props.searchParams?.url;
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    console.log("url in generateMetadata:", url);
    if (!url) return {};
    try {
        const data = await getConvertedForUrl(url) as SyncFMSong
        if (!data) return {}


        return {
            metadataBase: new URL('https://syncfm.dev'),
            title: `${data.title} — SyncFM`,
            description:
                data.description || (data.artists ? `${data.artists.join(', ')} — ${data.album || ''}` : undefined),
            openGraph: {
                title: `${data.title} — SyncFM`,
                description:
                    data.description || (data.artists ? `${data.artists.join(', ')} — ${data.album || ''}` : undefined),
                images: data.imageUrl ? [{ url: data.imageUrl, alt: data.title }] : undefined,
            },
        }
    } catch {
        return {}
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function SongPage(props: any) {
    const paramsObj = props.params ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? await props.searchParams?.url;
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    console.log("url in SongPage:", url);

    if (!url) {
        return null;
    }

    const data = await getConvertedForUrl(url) as SyncFMSong;
    const thinBg = await getThinBackgroundColorFromImageUrl(data?.imageUrl);

    return (
            <SongView url={url} data={data} thinBackgroundColor={thinBg} />
    );
}