"use client"

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SiApplemusic, SiSpotify, SiYoutubemusic, SiGithub, SiTypescript, SiNextdotjs, SiTailwindcss } from "react-icons/si";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

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
  const [inputLink, setInputLink] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [split, setSplit] = useState(false);

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
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Main background gradient */}
        <div className="absolute inset-0 opacity-80"
          style={{ background: 'radial-gradient(at 70% 20%, rgba(255, 107, 0, 0.4), transparent 60%), radial-gradient(at 30% 80%, rgba(255, 149, 0, 0.3), transparent 60%)' }}
        ></div>

        {/* Animated background element */}
        <motion.div
          className="absolute inset-0 opacity-60"
          style={{ background: 'radial-gradient(at 50% 50%, rgba(255, 193, 7, 0.2), transparent)' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Main content container. */}
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
              Easy music sharing across streaming platforms.
            </p>
            <p className="mt-2 text-sm text-white/80 md:text-xl">
              Share and enjoy your favorite music with friends on different services.
            </p>
          </motion.div>
          {/* Footer credits */}
          <motion.div variants={itemVariants} className="mt-6 border-t border-white/10 pt-4 text-xs text-white/70">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-2 text-white/80">
                <span>Created with</span>
                <span className="text-red-400">♥</span>
                <SiTypescript className="w-4 h-4" title="TypeScript" />
                <SiNextdotjs className="w-4 h-4" title="Next.js" />
                <SiTailwindcss className="w-4 h-4" title="Tailwind CSS" />
                <span>+</span>
                <a className="ml-2 flex items-center gap-1 text-white/90" href="https://github.com/sync-fm/syncfm.ts" target="_blank" rel="noreferrer noopener">
                  <SiGithub className="w-4 h-4" />
                  <span className="font-mono">syncfm.ts</span>
                </a>
              </div>

              <div className="flex items-center gap-2 text-white/80">
                <span>by</span>
                <span>🦊</span>
                <a className="text-white/90 font-medium" href="https://github.com/xwxfox" target="_blank" rel="noreferrer noopener">xwxfox</a>
                <span className="mx-2">·</span>
                <a className="flex items-center gap-1 text-white/90" href="https://github.com/sync-fm/web" target="_blank" rel="noreferrer noopener">
                  <SiGithub className="w-4 h-4" />
                  <span>Repo</span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Service Icons Section */}
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
                  <p className="text-sm text-white/60">Unique songs (processed)</p>
                </div>
                {/* Album Stats Card */}
                <div className="w-full rounded-2xl bg-white/5 p-4 backdrop-blur-lg shadow-inner sm:w-1/3">
                  <p className="text-2xl font-semibold">{stats.albums.toLocaleString()}</p>
                  <p className="text-sm text-white/60">Unique albums (processed)</p>
                </div>
                {/* Artist Stats Card */}
                <div className="w-full rounded-2xl bg-white/5 p-4 backdrop-blur-lg shadow-inner sm:w-1/3">
                  <p className="text-2xl font-semibold">{stats.artists.toLocaleString()}</p>
                  <p className="text-sm text-white/60">Unique artists (processed)</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* How it works explanation */}
          <motion.div variants={itemVariants} className="mt-8 rounded-2xl bg-white/3 p-4 text-left text-sm text-white/85 shadow-inner">
            <h2 className="text-lg font-semibold">How SyncFM links work</h2>
            <p className="mt-2 text-white/70">
              Paste any streaming URL and SyncFM will create an easy redirect. The behaviour depends on the subdomain used before <strong>syncfm.dev</strong>:
            </p>
            <ul className="mt-3 ml-4 list-disc text-white/65">
              <li className="mt-1">
                <strong>s.syncfm.dev/&lt;url&gt;</strong> - converts and redirects directly to Spotify.
              </li>
              <li className="mt-1">
                <strong>am.syncfm.dev/&lt;url&gt;</strong> - converts and redirects directly to Apple Music.
              </li>
              <li className="mt-1">
                <strong>yt.syncfm.dev/&lt;url&gt;</strong> - converts and redirects directly to YouTube Music.
              </li>
              <li className="mt-1">
                <strong>syncfm.dev/&lt;url&gt;</strong> (no subdomain) - opens the SyncFM Share UI where the visitor can pick which service to open the link with.
              </li>
            </ul>
            <p className="mt-3 text-white/70">Notes:</p>
            <ul className="mt-2 ml-4 list-disc text-white/65">
              <li>&quot;&lt;url&gt;&quot; can be any supported streaming link - for example <span className="font-mono break-words whitespace-normal max-w-full block">https://open.spotify.com/track/1hSiinjZSwghTo3zeoGPOa</span></li>
            </ul>
            <p className="mt-3 text-white/70">Example flow:</p>
            <div className="mt-2 w-full max-w-md rounded-lg bg-white/5 p-3 text-sm text-white/80 space-y-3">
              <div>
                <div className="mb-1 text-xs text-white/60">Original link</div>
                <div className="rounded-md bg-white/6 p-2 font-mono text-sm break-words">https://open.spotify.com/track/1hSiinjZSwghTo3zeoGPOa</div>
              </div>
              <div>
                <div className="mb-1 text-xs text-white/60">Short host-style link (service specific)</div>
                <div className="rounded-md bg-white/6 p-2 font-mono text-sm break-words">am.syncfm.dev/https%3A%2F%2Fopen.spotify.com%2Ftrack%2F1hSiinjZSwghTo3zeoGPOa</div>
              </div>
              <div>
                <div className="mb-1 text-xs text-white/60">Short host-style link (opens Share UI)</div>
                <div className="rounded-md bg-white/6 p-2 font-mono text-sm break-words">syncfm.dev/https%3A%2F%2Fopen.spotify.com%2Ftrack%2F1hSiinjZSwghTo3zeoGPOa</div>
              </div>
            </div>
          </motion.div>

          {/* Input & Button Section */}
          <motion.div variants={itemVariants} className="mt-8">
            <motion.div layout animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.45 }}>
              <div className="relative">
                <motion.input
                  key={inputLink}
                  layout
                  type="text"
                  value={inputLink}
                  onChange={(e) => {
                    setInputLink(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // reuse generate logic
                      const trimmed = inputLink.trim();
                      if (!trimmed) {
                        setError('Please paste a link first.');
                        setShake(true);
                        setTimeout(() => setShake(false), 450);
                        return;
                      }
                      if (trimmed.toLowerCase().includes('syncfm.dev')) {
                        setError('Do not include syncfm.dev in the input.');
                        setShake(true);
                        setTimeout(() => setShake(false), 450);
                        return;
                      }
                      const target = `https://syncfm.dev/${encodeURIComponent(trimmed)}`;
                      setGeneratedUrl(target);
                      setInputLink(target);
                      // copy to clipboard
                      try {
                        navigator.clipboard.writeText(target);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1400);
                      } catch {
                        const ta = document.createElement('textarea');
                        ta.value = target; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1400);
                      }
                    }
                  }}
                  placeholder="Paste a music link here..."
                  aria-label="Music link"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-lg text-white placeholder-white/60 backdrop-blur-lg shadow-inner transition duration-300 focus:outline-none focus:ring-2 focus:ring-white/50"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                />

                {/* non-layout, absolute copied indicator (no layout shift) */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-md bg-black/40 px-3 py-1 text-sm text-white"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={copied ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.18 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="select-none">Copied</span>
                </motion.div>
              </div>
            </motion.div>
            {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
            <div className="mt-4">
              <motion.div layout className="flex gap-3">
                {/* When not split, show a single Generate button */}
                {!split && (
                  <motion.button
                    layout
                    className="flex-1 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-400 px-6 py-3 font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-[1.02] active:scale-95"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      const trimmed = inputLink.trim();
                      if (!trimmed) {
                        setError('Please paste a link first.');
                        setShake(true);
                        setTimeout(() => setShake(false), 450);
                        return;
                      }
                      if (trimmed.toLowerCase().includes('syncfm.dev')) {
                        setError('Do not include syncfm.dev in the input.');
                        setShake(true);
                        setTimeout(() => setShake(false), 450);
                        return;
                      }
                      const target = `https://syncfm.dev/${encodeURIComponent(trimmed)}`;
                      setGeneratedUrl(target);
                      // replace input text with the generated URL
                      setInputLink(target);
                      // copy to clipboard immediately
                      try {
                        await navigator.clipboard.writeText(target);
                        setCopied(true);
                      } catch {
                        const ta = document.createElement('textarea');
                        ta.value = target; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
                        setCopied(true);
                      }
                      // after a short moment, split into Open + Reset buttons
                      setTimeout(() => setSplit(true), 220);
                      // revert copied label after a bit
                      setTimeout(() => setCopied(false), 1400);
                    }}
                  >
                    {copied ? 'Copied!' : 'Generate link'}
                  </motion.button>
                )}

                {/* When split, show Open + Reset */}
                {split && (
                  <>
                    <motion.button
                      layout
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-semibold text-white shadow-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const target = generatedUrl || 'https://syncfm.dev';
                        if (target) window.open(target, '_blank');
                      }}
                    >
                      Open
                    </motion.button>
                    <motion.button
                      layout
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex-1 rounded-xl bg-red-600/90 px-4 py-3 font-semibold text-white shadow-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        // reset everything
                        setGeneratedUrl('');
                        setInputLink('');
                        setCopied(false);
                        setSplit(false);
                        setError('');
                      }}
                    >
                      Reset
                    </motion.button>
                  </>
                )}
              </motion.div>
            </div>

            {/* generated link is shown inside the input to avoid layout shifts */}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
