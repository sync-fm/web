import syncfmconfig from "@/syncfm.config";
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { captureServerEvent, captureServerException } from "@/lib/analytics/server";
import { durationSince } from "@/lib/analytics/utils";

export async function GET() {
    const start = Date.now();
    const respond = (status: number, body: unknown, analytics: Record<string, unknown> = {}) => {
        captureServerEvent("api.getStats.response", {
            route: "api/getStats",
            method: "GET",
            status,
            success: status < 400,
            duration_ms: durationSince(start),
            ...analytics,
        });
        return NextResponse.json(body, { status });
    };

    captureServerEvent("api.getStats.request", {
        route: "api/getStats",
        method: "GET",
    });

    const supabaseUrl = syncfmconfig.SupabaseUrl;
    const supabaseKey = syncfmconfig.SupabaseKey;
    if (!supabaseUrl || !supabaseKey) {
        return respond(500, { error: 'Supabase configuration is missing' }, {
            reason: 'missing_supabase_configuration',
        });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: songCountData, error: songCountError } = await supabase
        .from('songs')
        .select('syncId');
    const { data: albumCountData, error: albumCountError } = await supabase
        .from('albums')
        .select('syncId');
    const { data: artistCountData, error: artistCountError } = await supabase
        .from('artists')
        .select('syncId');

    if (songCountError || albumCountError || artistCountError) {
        console.error('Error fetching stats:', songCountError || albumCountError || artistCountError);
        captureServerException(songCountError || albumCountError || artistCountError, {
            route: "api/getStats",
        });
        return respond(500, { error: 'Error fetching stats' }, {
            stage: 'fetch',
        })
    }

    const payload = {
        songs: songCountData?.length || 0,
        albums: albumCountData?.length || 0,
        artists: artistCountData?.length || 0,
    };

    return respond(200, payload, {
        stage: 'success',
        ...payload,
    });
}