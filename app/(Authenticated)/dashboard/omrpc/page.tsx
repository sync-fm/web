"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Copy,
  Disc3,
  Link2,
  Music,
  RefreshCw,
  Settings,
  Terminal,
  Unlink,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const OMRPC_API_URL = process.env.NEXT_PUBLIC_OMRPC_API_URL || "http://localhost:3001";

interface TrackInfo {
  name: string;
  artists: string[];
  albumName: string;
  albumArtUrl: string | null;
  artistImageUrl: string | null;
  platform: string;
}

interface OmrpcState {
  id: string;
  pollingState: string;
  currentTrack: TrackInfo | null;
  lastUpdated: number | null;
  discordConnected: boolean;
  statsFmConfigured: boolean;
}

async function api(path: string, options: RequestInit = {}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  const res = await fetch(`${OMRPC_API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, ...options.headers },
  });
  return res.json();
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-light transition hover:bg-white/5 hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
      {label || (copied ? "Copied!" : "Copy")}
    </button>
  );
}

function StatusBadge({ label, value, color, dot }: { label: string; value: string; color: string; dot: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5">
      <span className={`size-2 rounded-full ${dot}`} />
      <div className="flex flex-1 items-center justify-between gap-2">
        <span className="text-xs text-muted-light">{label}</span>
        <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold", color)}>{value}</span>
      </div>
    </div>
  );
}

function RelativeTime({ timestamp }: { timestamp: number | null }) {
  const [label, setLabel] = useState("never");
  useEffect(() => {
    function update() {
      if (!timestamp) { setLabel("never"); return; }
      const diff = Date.now() - timestamp;
      if (diff < 5000) setLabel("just now");
      else if (diff < 60000) setLabel(`${Math.floor(diff / 1000)}s ago`);
      else if (diff < 3600000) setLabel(`${Math.floor(diff / 60000)}m ago`);
      else setLabel(`${Math.floor(diff / 3600000)}h ago`);
    }
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [timestamp]);
  return <span className="text-[11px] font-medium text-muted-subtle">Last updated {label}</span>;
}

export default function OmrpcPage() {
  const [loading, setLoading] = useState(true);
  const [omrpcId, setOmrpcId] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string>("");
  const [state, setState] = useState<OmrpcState | null>(null);
  const [status, setStatus] = useState<{ discordConnected: boolean; statsFmConfigured: boolean; isActive: boolean; pollingState: string } | null>(null);
  const [sfId, setSfId] = useState("");
  const [sfToken, setSfToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connectingDiscord, setConnectingDiscord] = useState(false);
  const [poking, setPoking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isSetupComplete = status?.discordConnected && status?.statsFmConfigured;

  const init = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }
      const res = await api("/api/user/create-with-supabase", { method: "POST" });
      if (res.ok && res.id) {
        setOmrpcId(res.id);
        setAuthCode(res.authCode || "");
      }
    } catch { /* exists already */ }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!omrpcId) return;
    try {
      const res = await api(`/api/user/${omrpcId}/status`);
      if (res.ok) setStatus({
        discordConnected: res.discordConnected ?? false,
        statsFmConfigured: res.statsFmConfigured ?? false,
        isActive: res.isActive ?? false,
        pollingState: res.pollingState ?? "unknown",
      });
    } catch { /* ignore */ }
  }, [omrpcId]);

  const fetchState = useCallback(async () => {
    if (!omrpcId) return;
    try {
      const res = await api(`/api/user/${omrpcId}/state`);
      if (res.ok) setState(res);
    } catch { /* ignore */ }
  }, [omrpcId]);

  useEffect(() => { init().then(() => setLoading(false)); }, [init]);

  useEffect(() => {
    if (!omrpcId) return;
    fetchStatus(); fetchState();
    const si = setInterval(fetchState, 15000);
    return () => clearInterval(si);
  }, [omrpcId, fetchStatus, fetchState]);

  useEffect(() => {
    if (!omrpcId) return;
    const si = setInterval(fetchStatus, 5000);
    return () => clearInterval(si);
  }, [omrpcId, fetchStatus]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "discord-oauth-complete") { fetchStatus(); fetchState(); }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [fetchStatus, fetchState]);

  const handleConnectDiscord = async () => {
    if (!omrpcId) return;
    setConnectingDiscord(true);
    try {
      const res = await api(`/auth/${omrpcId}/url`);
      if (res.url) {
        window.open(res.url, "discord-auth", "width=500,height=700");
      }
    } catch (e) { console.error(e); }
    finally { setTimeout(() => { setConnectingDiscord(false); fetchStatus(); }, 3000); }
  };

  const handleSaveConfig = async () => {
    if (!omrpcId || (!sfId && !sfToken)) return;
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (sfId) body.statsFmUserId = sfId;
      if (sfToken) body.statsFmAuthToken = sfToken;
      const res = await api(`/api/user/${omrpcId}/config`, { method: "POST", body: JSON.stringify(body) });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); fetchStatus(); }
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handlePoke = async () => {
    if (!omrpcId) return;
    setPoking(true);
    try { await api(`/api/user/${omrpcId}/poke`); setTimeout(fetchState, 500); } catch { /* ignore */ }
    setTimeout(() => setPoking(false), 1000);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardHeader
        title="Discord Rich Presence"
        subtitle="Show what you're listening to on Discord - no desktop client required."
        icon={Disc3}
      />

      {!isSetupComplete ? (
        /* === SETUP WIZARD === */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg space-y-6"
        >
          {/* Step 1 */}
          <motion.div layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors",
                status?.discordConnected
                  ? "bg-green-500/20 text-green-400"
                  : "bg-white/10 text-muted-light",
              )}>
                {status?.discordConnected ? <Check className="size-5" /> : "1"}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={cn(
                  "text-sm font-semibold",
                  status?.discordConnected ? "text-green-400" : "text-foreground",
                )}>
                  {status?.discordConnected ? "Discord Authenticated" : "Connect Discord"}
                </h2>
                <p className="mt-0.5 text-xs text-muted-subtle leading-relaxed">
                  This is a separate authorization for Rich Presence&mdash;not the same as SyncFM login.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={handleConnectDiscord}
                disabled={connectingDiscord}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50",
                  status?.discordConnected
                    ? "border border-white/10 bg-white/[0.04] text-muted-light hover:bg-white/[0.08] hover:text-foreground"
                    : "bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-lg shadow-[#5865F2]/20",
                )}
              >
                {connectingDiscord ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : status?.discordConnected ? (
                  <Unlink className="size-4" />
                ) : (
                  <Link2 className="size-4" />
                )}
                {connectingDiscord ? "Opening Discord..." :
                 status?.discordConnected ? "Reconnect" : "Authenticate with Discord"}
              </button>
            </div>
          </motion.div>

          {/* Connector line */}
          <div className="flex justify-center">
            <div className={cn(
              "h-6 w-px transition-colors",
              status?.discordConnected ? "bg-green-500/30" : "bg-white/10",
            )} />
          </div>

          {/* Step 2 */}
          <motion.div
            layout
            className={cn(
              "rounded-2xl border p-6 shadow-sm transition-all",
              status?.statsFmConfigured
                ? "border-green-500/20 bg-green-500/[0.03]"
                : "border-white/10 bg-white/[0.03]",
              !status?.discordConnected && "pointer-events-none opacity-40 saturate-0",
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors",
                status?.statsFmConfigured
                  ? "bg-green-500/20 text-green-400"
                  : "bg-white/10 text-muted-light",
              )}>
                {status?.statsFmConfigured ? <Check className="size-5" /> : "2"}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={cn(
                  "text-sm font-semibold",
                  status?.statsFmConfigured ? "text-green-400" : "text-foreground",
                )}>
                  {status?.statsFmConfigured ? "Stats.fm Connected" : "Connect Stats.fm"}
                </h2>
                <p className="mt-0.5 text-xs text-muted-subtle leading-relaxed">
                  Used to know what you&apos;re listening to.
                  {!status?.discordConnected && " Complete step 1 first."}
                </p>
              </div>
            </div>
            {!status?.statsFmConfigured && (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-subtle">Stats.fm User ID</label>
                    <input
                      type="text" value={sfId} onChange={e => setSfId(e.target.value)}
                      placeholder="e.g. xwxfox"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-subtle transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-subtle">Auth Token</label>
                    <input
                      type="password" value={sfToken} onChange={e => setSfToken(e.target.value)}
                      placeholder="Your stats.fm access token"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-subtle transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={saving || (!sfId && !sfToken)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand-sm transition hover:brightness-105 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Settings className="size-4" />
                    )}
                    {saving ? "Saving..." : "Save & Finish Setup"}
                  </button>
                  {saved && (
                    <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-green-400">
                      Saved!
                    </motion.span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : (
        /* === DASHBOARD === */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl space-y-5"
        >
          {/* Now Playing Card */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent shadow-sm">
            {state?.currentTrack ? (
              <div className="relative">
                {/* Background art blur */}
                {state.currentTrack.albumArtUrl && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={state.currentTrack.albumArtUrl}
                      alt=""
                      className="size-full object-cover opacity-[0.08] blur-3xl"
                    />
                  </div>
                )}
                <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                  {/* Album art */}
                  <div className="relative shrink-0">
                    <div className="relative">
                      {state.currentTrack.albumArtUrl ? (
                        <img
                          src={state.currentTrack.albumArtUrl}
                          alt={`${state.currentTrack.name} album art`}
                          className="size-28 rounded-2xl object-cover shadow-lg ring-1 ring-white/10 sm:size-36"
                        />
                      ) : (
                        <div className="flex size-28 items-center justify-center rounded-2xl bg-white/[0.06] sm:size-36">
                          <Music className="size-10 text-muted-subtle" />
                        </div>
                      )}
                      {/* Spinning record overlay */}
                      <div className="absolute -inset-3 -z-10 flex items-center justify-center">
                        <div className="size-36 animate-[spin_8s_linear_infinite] rounded-full border-2 border-white/[0.03] bg-gradient-to-br from-white/[0.02] to-transparent sm:size-44" />
                      </div>
                    </div>
                  </div>
                  {/* Track info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold text-foreground leading-tight truncate sm:text-2xl">
                      {state.currentTrack.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-light truncate">
                      {state.currentTrack.artists?.join(", ")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-subtle truncate">
                      {state.currentTrack.albumName}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {state.currentTrack.platform}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-md border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold text-green-400">
                        <span className="size-1.5 animate-pulse rounded-full bg-green-400" />
                        Listening
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-white/[0.04]">
                  <Music className="size-8 text-muted-subtle" />
                </div>
                <div>
                  <p className="text-base font-semibold text-muted-light">No track detected</p>
                  <p className="mt-1 text-sm text-muted-subtle leading-relaxed">
                    Play something on Spotify or Apple Music&mdash;it&apos;ll show up here automatically.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom bar: status + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-white/[0.015] px-5 py-3 sm:px-6">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <RelativeTime timestamp={state?.lastUpdated ?? null} />
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "size-1.5 rounded-full",
                    state?.pollingState === "active" || state?.pollingState === "poked"
                      ? "bg-green-400" : "bg-gray-500",
                  )} />
                  <span className="text-[11px] font-medium text-muted-subtle capitalize">{state?.pollingState ?? "unknown"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={fetchState} className="rounded-lg p-2 text-muted-light transition hover:bg-white/[0.06] hover:text-foreground">
                  <RefreshCw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePoke}
                  disabled={poking}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-50"
                >
                  <Zap className={cn("size-3.5", poking && "animate-pulse")} />
                  {poking ? "Poking..." : "Wake up"}
                </button>
              </div>
            </div>
          </div>

          {/* Status grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatusBadge
              label="Discord"
              value={state?.discordConnected ? "Connected" : "Disconnected"}
              color={state?.discordConnected ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}
              dot={state?.discordConnected ? "bg-green-400" : "bg-red-400"}
            />
            <StatusBadge
              label="Stats.fm"
              value={state?.statsFmConfigured ? "Configured" : "Not set"}
              color={state?.statsFmConfigured ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-400"}
              dot={state?.statsFmConfigured ? "bg-green-400" : "bg-gray-500"}
            />
            <StatusBadge
              label="Polling"
              value={state?.pollingState ?? "unknown"}
              color={state?.pollingState === "active" || state?.pollingState === "poked"
                ? "bg-green-500/15 text-green-400"
                : "bg-gray-500/15 text-gray-400"}
              dot={state?.pollingState === "active" || state?.pollingState === "poked"
                ? "bg-green-400" : "bg-gray-500"}
            />
            <StatusBadge
              label="Last updated"
              value={state?.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : "-"}
              color="bg-white/[0.04] text-muted-light"
              dot="bg-white/20"
            />
          </div>
        </motion.div>
      )}

      {/* === SETTINGS PANEL === */}
      <motion.div layout className="rounded-2xl border border-white/10 bg-white/[0.02] shadow-sm">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
        >
          <div className="flex items-center gap-3">
            <Settings className="size-5 text-muted-light" />
            <span className="text-sm font-semibold text-foreground">Settings &amp; API Access</span>
          </div>
          <motion.div animate={{ rotate: showSettings ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="size-4 text-muted-light" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-6 border-t border-white/10 px-5 pb-6 pt-5 sm:px-6">
                {/* API Credentials */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">API Credentials</h3>
                  <p className="mt-1 text-xs text-muted-subtle">Use these to interact with the OMRPC API programmatically.</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-muted-subtle w-16">User ID</span>
                      <code className="flex-1 truncate font-mono text-sm text-primary">{omrpcId || "-"}</code>
                      {omrpcId && <CopyButton text={omrpcId} />}
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-muted-subtle w-16">Auth Code</span>
                      <code className="flex-1 truncate font-mono text-sm text-green-400">{authCode || "-"}</code>
                      {authCode && <CopyButton text={authCode} />}
                    </div>
                  </div>
                </div>

                {/* API Usage */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">API Reference</h3>
                  <p className="mt-1 text-xs text-muted-subtle">All requests need a valid auth code as a query parameter.</p>
                  <div className="mt-3 space-y-1.5 font-mono text-xs">
                    {[
                      { method: "GET", path: `/api/user/{id}/state?code={authCode}`, desc: "Get current track", color: "text-green-400" },
                      { method: "GET", path: `/api/user/{id}/poke?code={authCode}`, desc: "Trigger active polling", color: "text-yellow-400" },
                      { method: "GET", path: `/api/user/{id}/status`, desc: "Get user status", color: "text-blue-400" },
                    ].map(ep => (
                      <div key={ep.path} className="flex items-center gap-3 rounded-xl border border-white/[0.03] bg-white/[0.015] px-4 py-2.5">
                        <span className="shrink-0 rounded-md bg-white/[0.04] px-2 py-0.5 font-bold text-muted-subtle">{ep.desc}</span>
                        <span className={cn("shrink-0 font-bold", ep.color)}>{ep.method}</span>
                        <code className="truncate text-muted-light">{ep.path}</code>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-xs">
                    <Terminal className="size-4 text-muted-light shrink-0" />
                    <span className="text-muted-subtle">Base URL:</span>
                    <code className="font-mono text-primary">{OMRPC_API_URL}</code>
                    <CopyButton text={OMRPC_API_URL} label="Copy URL" />
                  </div>
                </div>

                {/* Reconfigure */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Reconfigure</h3>
                  <p className="mt-1 text-xs text-muted-subtle">Update your Discord connection or Stats.fm credentials.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleConnectDiscord}
                      disabled={connectingDiscord}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2]/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5865F2] disabled:opacity-50"
                    >
                      {connectingDiscord ? (
                        <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Link2 className="size-4" />
                      )}
                      {status?.discordConnected ? "Reconnect Discord" : "Connect Discord"}
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        type="text" value={sfId} onChange={e => setSfId(e.target.value)}
                        placeholder="Stats.fm User ID"
                        className="w-36 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-subtle transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <input
                        type="password" value={sfToken} onChange={e => setSfToken(e.target.value)}
                        placeholder="Auth Token"
                        className="w-36 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-subtle transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={handleSaveConfig}
                        disabled={saving || (!sfId && !sfToken)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-white/[0.08] disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Update"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
