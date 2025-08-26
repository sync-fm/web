import type { Metadata } from 'next'
import AlbumView from '@/components/AlbumView'
import { getConvertedForUrl } from '@/lib/syncfm.server'
export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any): Promise<Metadata> {
    const paramsObj = props.params ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? props.searchParams?.url;
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    if (!url) return {};
    try {
        const data = await getConvertedForUrl(url)
        if (!data) return {}

        return {
            metadataBase: new URL('https://syncfm.dev'),
            title: `${data.title || data.name} — SyncFM`,
            description: data.description || (data.artists ? `${data.artists.join(', ')}` : undefined),
            openGraph: {
                title: `${data.title || data.name} — SyncFM`,
                description: data.description || (data.artists ? `${data.artists.join(', ')}` : undefined),
                images: data.imageUrl ? [{ url: data.imageUrl, alt: data.title || data.name }] : undefined,
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
    return <AlbumView url={url} />;
}