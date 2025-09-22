/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Clock, Music } from "lucide-react"
import type { ServiceName, SyncFMAlbum } from "syncfm.ts"
import { LoadingUI } from "./ui/LoadingUI"
import { useDominantColors } from "@/lib/useDominantColors"
import { formatDuration, formatTotalDuration } from "@/lib/utils"
import { MusicPlayerCard } from "@/components/ui/MusicPlayerCard"
import { StreamingServiceButtons } from "@/components/ui/StreamingServiceButtons"
import { SERVICE_TO_EXTERNAL_KEY } from "@/lib/utils"

interface AlbumViewProps {
  url: string
  thinBackgroundColor?: string;
  data?: SyncFMAlbum;
}

export default function AlbumView({ url, thinBackgroundColor, data }: AlbumViewProps) {
  const [album, setAlbum] = useState<SyncFMAlbum | null>(null)
  const [isLoading, setIsLoading] = useState(true);
  const { colors: dominantColors, isAnalyzing } = useDominantColors(album?.imageUrl, !true);
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
    async function fetchAlbum() {
      setAlbum(null);
      setIsLoading(true);
      if (data) {
        setAlbum(data);
        if (data.imageUrl) {
          await getBlurHash(data.imageUrl);
        }
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/handle/syncfm?url=' + encodeURIComponent(url));
        const data = await response.json();
        setAlbum(data);
        if (data.imageUrl) {
          await getBlurHash(data.imageUrl);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching album data:", error);
      }
    }
    fetchAlbum();
  }, [url, data]);

  // Use a useMemo hook to ensure the unique songs list is stable
  // and only recomputed when the album object itself changes.
  const uniqueSongs = useMemo(() => {
    if (!album) return [];

    const seen = new Set<string>();
    const uniqueList: typeof album.songs = [];

    album.songs.forEach(song => {
      if (!seen.has(song.syncId)) {
        uniqueList.push(song);
        seen.add(song.syncId);
      } else {
        const existingIndex = uniqueList.findIndex(s => s.syncId === song.syncId);
        if (existingIndex !== -1 && song.artists.length > uniqueList[existingIndex].artists.length) {
          uniqueList[existingIndex] = song;
        }
      }
    });

    return uniqueList;
  }, [album]);

  const streamingUrlCacheRef = useRef<Map<ServiceName, Promise<string> | string>>(new Map());
  useEffect(() => {
    streamingUrlCacheRef.current.clear();
  }, [album?.syncId]);

  const getStreamingUrl = useCallback(async (service: ServiceName): Promise<string> => {
    if (!album) {
      return Promise.reject(new Error("Album not loaded"));
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
      const externalid = externalKey ? album.externalIds?.[externalKey] : undefined;

      if (externalid) {
        try {
          const createURLRes: { url: string } = await fetch('/api/createUrl', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service: service,
              input: album,
              type: 'album'
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
  }, [album, url]);

  if (isLoading || !album || isAnalyzing || !blurHash || typeof blurHash !== 'string') {
    return <LoadingUI />;
  }

  return (
    <MusicPlayerCard
      hash={blurHash}
      dominantColors={dominantColors}
      thinBackgroundColor={thinBackgroundColor || "#000"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={album.syncId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Main Album Info Section */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative flex-shrink-0"
            >
              <div className="relative h-48 w-48 mx-auto md:mx-0 overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src={album.imageUrl || "/placeholder.svg?height=192&width=192&query=album cover"}
                  alt={`${album.title} cover`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </motion.div>

            <div className="flex-1 text-center md:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-white mb-3"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.9)" }}
              >
                {album.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-white/95 mb-4"
                style={{ textShadow: "0 2px 6px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)" }}
              >
                {album.artists.join(", ")}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/90 mb-6"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)" }}
              >
                <div className="flex items-center gap-1">
                  <Music className="h-4 w-4" />
                  <span>
                    {album.totalTracks} track{album.totalTracks !== 1 ? "s" : ""}
                  </span>
                </div>
                {album.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTotalDuration(album.duration)}</span>
                  </div>
                )}
              </motion.div>
              <StreamingServiceButtons createUrl={getStreamingUrl} />
            </div>
          </div>

          {/* Tracks Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-2"
          >
            <h3
              className="text-lg font-semibold text-white mb-4"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)" }}
            >
              Tracks
            </h3>
            <div className="space-y-1">
              <AnimatePresence>
                {uniqueSongs.map((song, index) => (
                  <motion.div
                    key={song.syncId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    transition={{ delay: 0.05 + index * 0.03 }} // Reduced delay for faster animation
                    className="group flex items-center gap-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 transition-all duration-300 hover:bg-white/20 hover:border-white/30"
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      <span
                        className="text-sm text-white/70 group-hover:hidden"
                        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)" }}
                      >
                        {index + 1}
                      </span>
                      <Play className="h-4 w-4 text-white/90 hidden group-hover:block mx-auto" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-white font-medium truncate"
                        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)" }}
                      >
                        {song.title}
                      </p>
                      <p
                        className="text-white/80 text-sm truncate"
                        style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)" }}
                      >
                        {song.artists.join(", ")}
                      </p>
                    </div>
                    <div
                      className="flex-shrink-0 text-white/70 text-sm"
                      style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.9)" }}
                    >
                      {formatDuration(song.duration)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </MusicPlayerCard>
  )
}