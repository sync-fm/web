import type { Metadata } from 'next'
import { ArtistView } from '@/components/ArtistView'
import { getConvertedForUrl } from '@/lib/syncfm.server'
import { getThinBackgroundColorFromImageUrl } from '@/lib/serverColors'
import { SyncFMArtist } from 'syncfm.ts';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any): Promise<Metadata> {
    const paramsObj = props.params ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? props.searchParams?.url;
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    if (!url) return {};
    try {
        const data = await getConvertedForUrl(url) as SyncFMArtist
        if (!data) return {}

        return {
            metadataBase: new URL('https://syncfm.dev'),
            title: `${data.name} — SyncFM`,
            description: `Genres: ${data.genre?.join(", ")}` || undefined,
            openGraph: {
                title: `${data.name} — SyncFM`,
                description: `Genres: ${data.genre?.join(", ")}` || undefined,
                images: data.imageUrl ? [{ url: data.imageUrl, alt: data.name }] : undefined,
            },
        }
    } catch {
        return {}
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function ArtistPage(props: any) {
    const paramsObj = props.params ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? props.searchParams?.url;
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    if (!url) return null;

    const data = await getConvertedForUrl(url) as SyncFMArtist;
    const thinBg = await getThinBackgroundColorFromImageUrl(data?.imageUrl);

    return (
        <div style={{ backgroundColor: thinBg, minHeight: '100vh' }}>
            <ArtistView url={url} data={data} thinBackgroundColor={thinBg} />
        </div>
    );
}