/* eslint-disable @next/next/no-img-element */
"use client"

import { motion } from "framer-motion"
import { Play } from "lucide-react"
import type { ServiceName, SyncFMSong } from "syncfm.ts"
import { useState, useEffect, useCallback, useRef } from "react"
import { LoadingUI } from "./ui/LoadingUI"
import { useDominantColors } from "@/lib/useDominantColors"
import { formatDuration } from "@/lib/utils"
import { MusicPlayerCard } from "@/components/ui/MusicPlayerCard"
import { StreamingServiceButtons } from "@/components/ui/StreamingServiceButtons"
import { SERVICE_TO_EXTERNAL_KEY } from "@/lib/utils"

interface SongViewProps {
  url: string
  thinBackgroundColor?: string;
  data?: SyncFMSong;
}

export function SongView({ url, thinBackgroundColor, data }: SongViewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [song, setSong] = useState<SyncFMSong>()
  const { colors: dominantColors, isAnalyzing } = useDominantColors(song?.imageUrl, isLoading);

  useEffect(() => {
    async function fetchSong() {
      if (data) {
        setSong(data);
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/handle/syncfm?url=' + encodeURIComponent(url));
        const data = await response.json();
        setSong(data);
        console.log("Fetched song data:", data);
      } catch (error) {
        console.error("Error fetching song data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSong();
  }, [url, data]);

  const streamingUrlCacheRef = useRef<Map<ServiceName, Promise<string> | string>>(new Map());
  useEffect(() => {
    streamingUrlCacheRef.current.clear();
  }, [song?.syncId]);

  const getStreamingUrl = useCallback(async (service: ServiceName): Promise<string> => {
    if (!song) {
      return Promise.reject(new Error("song not loaded"));
    }

    const cache = streamingUrlCacheRef.current;
    const cached = cache.get(service);
    if (cached) {
      // Already resolved string
      if (typeof cached === "string") {
        return cached;
      }
      // Promise in flight
      return cached;
    }

    const promise = (async (): Promise<string> => {
      // Check direct external id mapping first
      const externalKey = SERVICE_TO_EXTERNAL_KEY[service];
      const externalid = externalKey ? song.externalIds?.[externalKey] : undefined;

      if (externalid) {
        try {
          const createURLRes: { url: string } = await fetch('/api/createUrl', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service: service,
              input: song,
              type: 'song'
            }),
          }).then(res => res.json());
          if (createURLRes && createURLRes.url) {
            streamingUrlCacheRef.current.set(service, createURLRes.url);
            return createURLRes.url;
          }
        } catch (e) {
          console.error("createUrl failed:", e);
          // fall through to default handler below
        }
      }

      const fallback = `/api/handle/${service}?url=${encodeURIComponent(url)}`;
      // cache fallback result
      streamingUrlCacheRef.current.set(service, fallback);
      return fallback;
    })();

    cache.set(service, promise);
    return promise;
  }, [song, url]);

  if (isLoading || !song || isAnalyzing) {
    return <LoadingUI />;
  }

  return (
    <MusicPlayerCard
      imageUrl={song.imageUrl}
      dominantColors={dominantColors}
      thinBackgroundColor={thinBackgroundColor}
    >
      <div className="relative max-w-sm w-full z-10 mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative mb-6"
        >
          <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl relative">
            {song.imageUrl ? (
              <img
                src={song.imageUrl || "/placeholder.svg"}
                alt={`${song.title} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/20 rounded-2xl" />
            <div className="absolute inset-0 backdrop-blur-[0.5px] bg-white/5 rounded-2xl" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl font-bold text-white mb-2 leading-tight drop-shadow-lg [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
            {song.title}
          </h1>
          <p className="text-lg text-white/90 mb-1 drop-shadow-md [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
            {song.artists.join(", ")}
          </p>
          {song.album && (
            <p className="text-sm text-white/80 mb-2 drop-shadow-md [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
              {song.album}
            </p>
          )}
          <p className="text-sm text-white/70 drop-shadow-md [text-shadow:_0_1px_4px_rgb(0_0_0_/_60%)]">
            {formatDuration(song.duration)}
          </p>
        </motion.div>

        <StreamingServiceButtons createUrl={getStreamingUrl} />
      </div>
    </MusicPlayerCard>
  )
}