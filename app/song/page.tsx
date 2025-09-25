
import type { Metadata } from 'next'
import { SongView } from '@/components/SongView'
import { getThinBackgroundColorFromImageUrl } from '@/lib/serverColors'
import { SyncFMSong } from 'syncfm.ts';
import { headers } from 'next/headers';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata(props: any): Promise<Metadata> {
    const paramsObj = (await props.params) ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? (await (await props.searchParams)?.url);
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;
    if (!url) return {};
    try {
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
        const baseUrl = `${protocol}://${host}`;
        const data = await fetch(`${baseUrl}/api/convertAll?url=${encodeURIComponent(url)}`).then(res => res.json()) as SyncFMSong;
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
            twitter: {
                card: "summary",
                title: `${data.title} — SyncFM`,
                description:
                    data.description || (data.artists ? `${data.artists.join(', ')} — ${data.album || ''}` : undefined),
                images: data.imageUrl ? [{ url: data.imageUrl, alt: data.title }] : undefined,
            }
        }
    } catch {
        return {}
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function SongPage(props: any) {
    const paramsObj = (await props.params) ? await props.params : undefined;
    const rawUrl = paramsObj?.searchParams?.url ?? (await (await props.searchParams)?.url);
    const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;

    if (!url) {
        return null;
    }

    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const baseUrl = `${protocol}://${host}`;
    const data = await fetch(`${baseUrl}/api/convertAll?url=${encodeURIComponent(url)}`).then(res => res.json()) as SyncFMSong;
    const thinBg = await getThinBackgroundColorFromImageUrl(data?.imageUrl);

    return (
        <SongView url={url} data={data} thinBackgroundColor={thinBg} />
    );
}