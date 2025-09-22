# SyncFM

Universal music links - convert and open songs, albums, and artists across Spotify, Apple Music, YouTube Music and more.

Built with Next.js + TypeScript and the `syncfm.ts` library to convert streaming links and generate cross-platform URLs or JSON representations.

## Features

- Convert song / album / artist URLs between streaming services.
- Auto-detect input type and service from pasted links.
- Server-side conversion endpoints for safe client usage.
- Beautiful, responsive UI with dominant color extraction for immersive player cards.

## Quick start

Requirements:

- Node.js 18+ (recommended) or Bun my beloved.
- API keys etc in `syncfm.config.ts` - see notes below.

Install dependencies and run locally (using Bun):

```bash
bun install
bun run dev
```

If you prefer npm/yarn/pnpm and the repository contains scripts in `package.json`, use your package manager of choice:

```bash
npm install
npm run dev
```

Build and start (assumes scripts `build` and `start` exist):

```bash
bun run build
bun run start
```

## Configuration

The project imports a local config file: `syncfm.config.ts`. Place any API keys or service configuration there. The app also exposes server endpoints that rely on the `syncfm.ts` library.
By default syncfm.config.ts just reads from process.env, look at .env.example :3

## Usage

- Web UI: open the app and paste a streaming URL (or use the `?url=` query param).
- Direct API:
	- Convert and redirect to a target service: `/api/handle/<service>?url=<ENCODED_URL>` (returns redirects or JSON depending on service).
	- Stats: `/api/getStats` returns repository statistics used on the homepage.

Examples:

```text
https://your-localhost:3000/song?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F...
http://s.syncfm.dev/http://open.spotify.com/track/...  (subdomain shortcuts)
```

The middleware will also detect incoming `/http` or `/https` paths and redirect to the appropriate route.

## Project layout (important files)

- `app/` - Next.js App Router pages and API routes.
	- `app/api/handle/[service]/route.ts` - main conversion/redirect handler.
	- `app/api/getStats/route.ts` - homepage stats endpoint.
- `components/` - React UI components and UI primitives (e.g. `MusicPlayerCard`, `StreamingServiceButtons`).
- `lib/` - server helpers and shared utilities (`syncfm.server.ts`, `useDominantColors.ts`, `StreamingServices.ts`, `utils.ts`).
- `middleware.ts` - path and subdomain handling for smart redirects.
- `syncfm.config.ts` - config for `syncfm.ts`.

## Notes for developers

- The code tries to avoid bundling `syncfm.ts` in the browser. Use the server API routes (in `app/api/handle`) to perform conversions.
- Dominant color extraction is implemented in `lib/useDominantColors.ts` and used by the UI to theme the player cards.

## Contributing

Contributions are welcome. Open issues or PRs for bugs, improvements, or feature requests. Keep changes small and well-scoped.

## License

GPL-3.0 - see `LICENSE`