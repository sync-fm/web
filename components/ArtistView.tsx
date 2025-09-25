/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Play, Pause, Calendar, Clock } from "lucide-react"
import type { ServiceName, SyncFMArtist, SyncFMArtistTrack } from "syncfm.ts"
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
  const { colors: dominantColors, isAnalyzing } = useDominantColors(artist?.imageUrl, true);
  const [blurHash, setBlurHash] = useState<string | undefined>();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => {
        audioEl.play();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        audioEl.pause();
      });
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audioEl.addEventListener("play", handlePlay);
    audioEl.addEventListener("pause", handlePause);

    return () => {
      audioEl.removeEventListener("play", handlePlay);
      audioEl.removeEventListener("pause", handlePause);
    };
  }, []);

  const handlePlayPause = (track: SyncFMArtistTrack) => {
    if (!track.contentUrl || !audioRef.current || !artist) return;

    if (currentlyPlaying === track.contentUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    } else {
      setCurrentlyPlaying(track.contentUrl);
      audioRef.current.src = track.contentUrl;
      audioRef.current.play();

      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: artist.name,
          album: 'Top Tracks',
          artwork: [{ src: track.thumbnailUrl || "/placeholder.svg" }],
        });
      }
    }
  };

  useEffect(() => {
    async function getBlurHash(imageUrl: string) {
      try {
        const response = await fetch('/api/getBackgroundBlurHash?url=' + encodeURIComponent(imageUrl));
        const data = await response.json();
        if (data.hash) setBlurHash(data.hash);
      } catch (error) {
        console.error("Error fetching blur hash:", error);
      }
    }
    async function fetchArtist() {
      if (data) {
        setArtist(data);
        if (data.imageUrl) await getBlurHash(data.imageUrl);
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/handle/syncfm?url=' + encodeURIComponent(url));
        const fetchedData = await response.json();
        setArtist(fetchedData);
        if (fetchedData.imageUrl) await getBlurHash(fetchedData.imageUrl);
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArtist();
  }, [url, data])

  const streamingUrlCacheRef = useRef<Map<ServiceName, Promise<string> | string>>(new Map());
  useEffect(() => {
    streamingUrlCacheRef.current.clear();
  }, [artist?.syncId]);

  const getStreamingUrl = useCallback(async (service: ServiceName): Promise<string> => {
    if (!artist) return Promise.reject(new Error("Artist not loaded"));

    const cache = streamingUrlCacheRef.current;
    const cached = cache.get(service);
    if (cached) return cached;

    const promise = (async (): Promise<string> => {
      try {
        const res = await fetch('/api/createUrl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service, input: artist, type: 'artist' }),
        });
        const { url: createdUrl } = await res.json();
        if (createdUrl) {
          streamingUrlCacheRef.current.set(service, createdUrl);
          return createdUrl;
        }
      } catch (e) {
        console.error("createUrl failed:", e);
      }
      return `/api/handle/${service}?url=${encodeURIComponent(url)}`;
    })();

    cache.set(service, promise);
    return promise;
  }, [artist, url]);

  if (isLoading || !artist || isAnalyzing || !blurHash || typeof blurHash !== 'string') {
    return <LoadingUI />;
  }

  return (
    <MusicPlayerCard
      hash={blurHash}
      dominantColors={dominantColors}
      thinBackgroundColor={thinBackgroundColor || "#000"}
    >
      {/* hidden audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current && "mediaSession" in navigator) {
            navigator.mediaSession.setPositionState?.({
              duration: audioRef.current.duration,
              position: audioRef.current.currentTime,
            });
          }
        }}
      />

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
                  style={{ textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)" }}
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
            {artist.tracks.slice(0, 5).map((track, index) => {
              const isActive = currentlyPlaying === track.contentUrl;
              const hasPreview = !!track.contentUrl;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  onClick={() => handlePlayPause(track)}
                  className={`group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 ${hasPreview ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    }`}
                >
                  {/* Track Thumbnail */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
                    {track.thumbnailUrl ? (
                      <img
                        src={track.thumbnailUrl || "/placeholder.svg"}
                        alt={track.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <SiSpotify className="h-6 w-6 text-white/50" />
                      </div>
                    )}
                    {/* Play/Pause icon */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      {isActive && isPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
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
                      {track.title}
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
              );
            })}
          </div>
        </motion.div>
      )}
    </MusicPlayerCard>
  )
}