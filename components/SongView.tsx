/* eslint-disable @next/next/no-img-element */
"use client"

import { motion } from "framer-motion"
import { Play } from "lucide-react"
import type { SyncFMSong } from "syncfm.ts"
import { useState, useEffect } from "react"
import { LoadingUI } from "./ui/LoadingUI"
import { useDominantColors } from "@/lib/useDominantColors"
import { formatDuration } from "@/lib/utils"
import { MusicPlayerCard } from "@/components/ui/MusicPlayerCard"
import { StreamingServiceButtons } from "@/components/ui/StreamingServiceButtons"
import type { SyncFMExternalIdMapToDesiredService } from "syncfm.ts"

interface SongViewProps {
  url: string
  thinBackgroundColor?: string;
  data?: SyncFMSong;
}

export function SongView({ url, thinBackgroundColor, data }: SongViewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [song, setSong] = useState<SyncFMSong>()
  const { colors: dominantColors, isAnalyzing } = useDominantColors(song?.imageUrl, true);
  const [blurHash, setBlurHash] = useState<string | undefined>();

  useEffect(() => {
    async function getBlurHash(imageUrl: string) {
      try {
        const response = await fetch('/api/getBackgroundBlurHash?url=' + encodeURIComponent(imageUrl));
        const data = await response.json();
        if (data.hash) {
          setBlurHash(data.hash);
          console.log("Fetched blur hash:", data.hash);
        } else {
          console.warn("No blur hash returned from API");
        }
      } catch (error) {
        console.error("Error fetching blur hash:", error);
      }
    }
    async function fetchSong() {
      if (data) {
        setSong(data);
        if (data.imageUrl) {
          await getBlurHash(data.imageUrl);
        }
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/handle/syncfm?url=' + encodeURIComponent(url));
        const data = await response.json();
        setSong(data);
        console.log("Fetched song data:", data);

        if (data.imageUrl) {
          await getBlurHash(data.imageUrl);
        }

      } catch (error) {
        console.error("Error fetching song data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSong();
  }, [url, data])

  const getStreamingUrl = (service: keyof typeof SyncFMExternalIdMapToDesiredService) => {
    return `/api/handle/${service}?url=${encodeURIComponent(url)}`;
  };

  if (isLoading || !song || isAnalyzing || !blurHash || typeof blurHash !== 'string') {
    return <LoadingUI />;
  }

  return (
    <MusicPlayerCard
      hash={blurHash}
      dominantColors={dominantColors}
      thinBackgroundColor={thinBackgroundColor || "#000"}
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