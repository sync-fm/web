"use client"

import { motion } from "framer-motion"
import { SiApplemusic, SiSpotify, SiYoutubemusic } from "react-icons/si"
import { SyncFMExternalIdMapToDesiredService } from '@/syncfm.ts';

const streamingServices = [
  { name: "Spotify", service: "spotify", color: "rgb(30, 215, 96)", Logo: SiSpotify },
  { name: "YouTube Music", service: "ytmusic", color: "rgb(255, 0, 0)", Logo: SiYoutubemusic },
  { name: "Apple Music", service: "applemusic", color: "rgb(250, 250, 250)", Logo: SiApplemusic },
]

interface StreamingServiceButtonsProps {
  createUrl: (service: keyof typeof SyncFMExternalIdMapToDesiredService) => string
}

export function StreamingServiceButtons({ createUrl }: StreamingServiceButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-wrap items-stretch justify-center gap-3 md:justify-start"
    >
      {streamingServices.map(({ name, service, color, Logo }) => {
        const url = createUrl(service as keyof typeof SyncFMExternalIdMapToDesiredService)
        if (!url) return null

        return (
          <motion.a
            key={service}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex flex-1 basis-[160px] items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300"
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(255, 255, 255, 0.15) 0%,
                  rgba(255, 255, 255, 0.05) 100%
                ),
                rgba(0, 0, 0, 0.2)
              `,
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="flex items-center gap-2">
              <Logo className="h-4 w-4 text" style={{ color: color }} />
              <span
                className="text-sm font-medium text-white/90"
                style={{
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.6)",
                }}
              >
                {name}
              </span>
            </div>
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20"
              style={{ backgroundColor: color }}
            />
          </motion.a>
        )
      })}
    </motion.div>
  )
}