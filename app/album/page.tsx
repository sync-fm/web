import type { Metadata } from 'next'
import AlbumView from '@/components/AlbumView'
import { getThinBackgroundColorFromImageUrl } from '@/lib/serverColors'
import { SyncFMAlbum } from "syncfm.ts";
import { headers } from 'next/headers';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any): Promise<Metadata> {
    const paramsObj = (await props.params) ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? (await props.searchParams)?.url;
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    if (!url) return {};
    try {
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
        const baseUrl = `${protocol}://${host}`;
        const data = await fetch(`${baseUrl}/api/convertAll?url=${encodeURIComponent(url)}`).then(res => res.json()) as SyncFMAlbum;
        if (!data) return {}

        return {
            metadataBase: new URL('https://syncfm.dev'),
            title: `${data.title} — SyncFM`,
            description: data.description || (data.artists ? `${data.artists.join(', ')}` : undefined),
            openGraph: {
                title: `${data.title} — SyncFM`,
                description: data.description || (data.artists ? `${data.artists.join(', ')}` : undefined),
                images: data.imageUrl ? [{ url: data.imageUrl, alt: data.title }] : undefined,
            },
            twitter: {
                card: "summary",
                title: `${data.title} — SyncFM`,
                description: data.description || (data.artists ? `${data.artists.join(', ')}` : undefined),
                images: data.imageUrl ? [{ url: data.imageUrl, alt: data.title }] : undefined,
            }
        }
    } catch {
        return {}
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function AlbumPage(props: any) {
    const paramsObj = (await props.params) ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? (await props.searchParams)?.url;
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    if (!url) return null;

    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const baseUrl = `${protocol}://${host}`;
    const data = await fetch(`${baseUrl}/api/convertAll?url=${encodeURIComponent(url)}`).then(res => res.json()) as SyncFMAlbum;
    const thinBg = await getThinBackgroundColorFromImageUrl(data?.imageUrl);

    return (
        <div style={{ backgroundColor: thinBg, minHeight: '100vh' }}>
            <AlbumView url={url} data={data} thinBackgroundColor={thinBg} />
        </div>
    );
}