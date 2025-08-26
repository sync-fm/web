import type { Metadata } from 'next'
import AlbumView from '@/components/AlbumView'
import { getConvertedForUrl } from '@/lib/syncfm.server'
import { getThinBackgroundColorFromImageUrl } from '@/lib/serverColors'
import { SyncFMAlbum } from 'syncfm.ts';
export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any): Promise<Metadata> {
    const paramsObj = props.params ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? props.searchParams?.url;
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    if (!url) return {};
    try {
        const data = await getConvertedForUrl(url) as SyncFMAlbum
        if (!data) return {}

        const thinBg = await getThinBackgroundColorFromImageUrl(data.imageUrl);
        return {
            metadataBase: new URL('https://syncfm.dev'),
            title: `${data.title} — SyncFM`,
            description: data.description || (data.artists ? `${data.artists.join(', ')}` : undefined),
            themeColor: thinBg,
            openGraph: {
                title: `${data.title} — SyncFM`,
                description: data.description || (data.artists ? `${data.artists.join(', ')}` : undefined),
                images: data.imageUrl ? [{ url: data.imageUrl, alt: data.title }] : undefined,
            },
        }
    } catch {
        return {}
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function AlbumPage(props: any) {
    const paramsObj = props.params ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? props.searchParams?.url;
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    if (!url) return null;

    const data = await getConvertedForUrl(url) as SyncFMAlbum;
    const thinBg = await getThinBackgroundColorFromImageUrl(data?.imageUrl);

    return (
        <div style={{ backgroundColor: thinBg, minHeight: '100vh' }}>
            <AlbumView url={url} data={data} thinBackgroundColor={thinBg} />
        </div>
    );
}