/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, Calendar, Clock } from "lucide-react"
import type { SyncFMArtist, SyncFMExternalIdMapToDesiredService } from "syncfm.ts"
import { SiSpotify } from "react-icons/si";
import { LoadingUI } from "./ui/LoadingUI"
import { useDominantColors } from "@/lib/useDominantColors"
import { formatDuration } from "@/lib/utils"
import { MusicPlayerCard } from "@/components/ui/MusicPlayerCard"
import { StreamingServiceButtons } from "@/components/ui/StreamingServiceButtons"

interface ArtistViewProps {
  url: string
  thinBackgroundColor?: string;
  data?: SyncFMArtist;
}

export function ArtistView({ url, thinBackgroundColor, data }: ArtistViewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [artist, setArtist] = useState<SyncFMArtist>()
  const { colors: dominantColors, isAnalyzing } = useDominantColors(artist?.imageUrl, isLoading);

  useEffect(() => {
    async function fetchArtist() {
      if (data) {
        setArtist(data);
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/handle/syncfm?url=' + encodeURIComponent(url));
        const data = await response.json();
        setArtist(data);
        console.log("Fetched artist data:", data);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArtist();
  }, [url, data])

  const getStreamingUrl = (service: keyof typeof SyncFMExternalIdMapToDesiredService) => {
    return `/api/handle/${service}?url=${encodeURIComponent(url)}`;
  };

  if (isLoading || !artist || isAnalyzing) {
    return <LoadingUI />;
  }

  return (
    <MusicPlayerCard imageUrl={artist.imageUrl} thinBackgroundColor={thinBackgroundColor} dominantColors={dominantColors}>
      {/* Artist Header */}
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        {/* Artist Image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm md:h-56 md:w-56">
            {artist.imageUrl ? (
              <img
                src={artist.imageUrl || "/placeholder.svg"}
                alt={artist.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <SiSpotify className="h-16 w-16 text-white/50" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Artist Info */}
        <div className="flex-1 text-center md:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-4 text-4xl font-bold text-white md:text-5xl"
            style={{
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.6)",
            }}
          >
            {artist.name}
          </motion.h1>

          {/* Genres */}
          {artist.genre && artist.genre.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-6 flex flex-wrap justify-center gap-2 md:justify-start"
            >
              {artist.genre.map((genre, index) => (
                <span
                  key={index}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur-sm"
                  style={{
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
                  }}
                >
                  {genre}
                </span>
              ))}
            </motion.div>
          )}

          <StreamingServiceButtons createUrl={getStreamingUrl} />
        </div>
      </div>

      {/* Popular Tracks */}
      {artist.tracks && artist.tracks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <h2
            className="mb-6 text-2xl font-bold text-white"
            style={{
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.6)",
            }}
          >
            Popular Tracks
          </h2>
          <div className="space-y-3">
            {artist.tracks.slice(0, 5).map((track, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
              >
                {/* Track Thumbnail */}
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white/10">
                  {track.thumbnailUrl ? (
                    <img
                      src={track.thumbnailUrl || "/placeholder.svg"}
                      alt={track.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <SiSpotify className="h-6 w-6 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1">
                  <h3
                    className="font-medium text-white"
                    style={{
                      textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    {track.name}
                  </h3>
                  {track.uploadDate && (
                    <div className="flex items-center gap-1 text-sm text-white/70">
                      <Calendar className="h-3 w-3" />
                      {new Date(track.uploadDate).getFullYear()}
                    </div>
                  )}
                </div>

                {/* Duration */}
                {track.duration && (
                  <div className="flex items-center gap-1 text-sm text-white/70">
                    <Clock className="h-3 w-3" />
                    {formatDuration(track.duration)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </MusicPlayerCard>
  )
}