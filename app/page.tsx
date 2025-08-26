"use client"

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SiApplemusic, SiSpotify, SiYoutubemusic } from "react-icons/si";

// Container for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

// Updated itemVariants to fix type errors
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 20 } as const,
  },
};

export default function Home() {
  const [stats, setStats] = useState({ songs: 0, albums: 0, artists: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/getStats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 font-sans text-white">
      {/* Dynamic Background with a liquid effect.
        The radial gradient creates a soft, glowing orb effect.
        The moving overlay with a subtle backdrop blur creates the liquid ripple effect.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Main background gradient */}
        <div className="absolute inset-0 opacity-80"
          style={{ background: 'radial-gradient(at 70% 20%, rgba(255, 107, 0, 0.4), transparent 60%), radial-gradient(at 30% 80%, rgba(255, 149, 0, 0.3), transparent 60%)' }}
        ></div>

        {/* Animated background element for dynamic feel */}
        <motion.div
          className="absolute inset-0 opacity-60"
          style={{ background: 'radial-gradient(at 50% 50%, rgba(255, 193, 7, 0.2), transparent)' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Main content container.
        This container has the 'glass' effect. It uses backdrop-blur, a semi-transparent background,
        and a border to give the illusion of floating glass.
      */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-8">
        <motion.div
          className="w-full max-w-xl rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur-3xl shadow-2xl md:p-10"
          initial="hidden"
          animate="show"
          variants={containerVariants}
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl"
              style={{ textShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}
            >
              SyncFM
            </h1>
            <p className="mt-2 text-lg text-white/80 md:text-xl">
              Discover, sync, and explore music across your favorite streaming platforms.
            </p>
          </motion.div>

          {/* Service Icons Section */}
          {/* Replaced react-icons with inline SVG to fix the import error */}
          <motion.div variants={itemVariants} className="mt-6 flex items-center justify-center gap-6">
            <motion.div whileHover={{ scale: 1.1 }} className="rounded-full bg-white/10 p-2 shadow-inner">
              <SiSpotify className="w-8 h-8 text-green-500 drop-shadow-lg" title="Spotify" />

            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="rounded-full bg-white/10 p-2 shadow-inner">

              <SiApplemusic className="w-8 h-8 text-shadow-gray-200 drop-shadow-lg" title="Apple Music" />

            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="rounded-full bg-white/10 p-2 shadow-inner">
              <SiYoutubemusic className="w-8 h-8 text-red-400 drop-shadow-lg" title="YouTube Music" />

            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div variants={itemVariants} className="mt-8 text-center">
            {loading ? (
              <div className="flex justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                <span className="ml-3 text-white/70">Loading stats...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                {/* Song Stats Card */}
                <div className="w-full rounded-2xl bg-white/5 p-4 backdrop-blur-lg shadow-inner sm:w-1/3">
                  <p className="text-2xl font-semibold">{stats.songs.toLocaleString()}</p>
                  <p className="text-sm text-white/60">Songs</p>
                </div>
                {/* Album Stats Card */}
                <div className="w-full rounded-2xl bg-white/5 p-4 backdrop-blur-lg shadow-inner sm:w-1/3">
                  <p className="text-2xl font-semibold">{stats.albums.toLocaleString()}</p>
                  <p className="text-sm text-white/60">Albums</p>
                </div>
                {/* Artist Stats Card */}
                <div className="w-full rounded-2xl bg-white/5 p-4 backdrop-blur-lg shadow-inner sm:w-1/3">
                  <p className="text-2xl font-semibold">{stats.artists.toLocaleString()}</p>
                  <p className="text-sm text-white/60">Artists</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Input & Button Section */}
          <motion.div variants={itemVariants} className="mt-8">
            <input
              type="text"
              placeholder="Paste a music link here..."
              className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-lg text-white placeholder-white/60 backdrop-blur-lg shadow-inner transition duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <motion.button
              className="mt-4 w-full rounded-xl bg-gradient-to-br from-orange-500 to-yellow-400 px-6 py-3 font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-[1.02] active:scale-95"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              Get universal link
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
