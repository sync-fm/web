import syncfmconfig from "@/syncfm.config";
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabaseUrl = syncfmconfig.SupabaseUrl;
    const supabaseKey = syncfmconfig.SupabaseKey;
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase configuration is missing' }, { status: 500 });
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
        return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
    }

    return NextResponse.json({
        songs: songCountData?.length || 0,
        albums: albumCountData?.length || 0,
        artists: artistCountData?.length || 0,
    });
}