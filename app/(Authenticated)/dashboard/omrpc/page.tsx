"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Copy,
  Disc3,
  Headphones,
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

interface OmrpcState {
  id: string;
  pollingState: string;
  currentTrack: {
    name: string;
    artists: string[];
    albumName: string;
    albumArtUrl: string | null;
    platform: string;
  } | null;
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
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-light transition hover:glass-bg-strong hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
      {label || (copied ? "Copied!" : "Copy")}
    </button>
  );
}

function StepLine({ done, active }: { done: boolean; active: boolean }) {
  return (
    <div className={cn(
      "h-0.5 w-full transition-colors duration-500",
      done ? "bg-primary" : active ? "bg-primary/40" : "glass-bg-medium",
    )} />
  );
}

function StepNumber({ num, done, active }: { num: number; done: boolean; active: boolean }) {
  return (
    <div className={cn(
      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500",
      done ? "bg-primary text-primary-foreground shadow-brand-sm" :
      active ? "border-2 border-primary bg-primary/10 text-primary" :
      "glass-bg-medium text-muted-subtle",
    )}>
      {done ? <Check className="size-4" /> : num}
    </div>
  );
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
        const w = window.open(res.url, "discord-auth", "width=500,height=700");
        if (!w) window.location.href = res.url;
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

  const pollingColors: Record<string, string> = {
    active: "bg-green-900/30 text-green-400 border-green-800",
    poked: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
    api_delayed: "bg-orange-900/30 text-orange-400 border-orange-800",
    idle: "bg-gray-800 text-gray-400 border-gray-700",
    unknown: "bg-gray-800 text-gray-400 border-gray-700",
  };

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Discord Rich Presence"
        subtitle="Show what you're listening to on Discord — no desktop client required."
        icon={Disc3}
      />

      {!isSetupComplete ? (
        /* === SETUP MODE: Step-by-step wizard === */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg space-y-10"
        >
          {/* Progress header */}
          <div className="flex items-center gap-3">
            <StepNumber num={1} done={status?.discordConnected ?? false} active={!status?.discordConnected} />
            <StepLine done={status?.discordConnected ?? false} active={!status?.discordConnected} />
            <StepNumber num={2} done={isSetupComplete ?? false} active={!!(status?.discordConnected && !status?.statsFmConfigured)} />
          </div>

          {/* Step 1: Discord Auth */}
          <motion.div
            layout
            className={cn(
              "rounded-2xl border p-6 shadow-glass-sm transition-colors",
              status?.discordConnected
                ? "border-green-800/40 glass-bg-light"
                : "glass-border-light glass-bg-light",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-foreground">
                  {status?.discordConnected ? "Discord Authenticated" : "1. Authenticate Discord for Rich Presence"}
                </h2>
                <p className="text-sm leading-relaxed text-muted-light">
                  This is a <strong>separate</strong> Discord authorization specifically for Rich Presence — it is not the same as the Discord login you used to sign in to SyncFM.
                  <br className="mt-1" />
                  OMRPC needs its own Discord token to display your music activity on your profile.
                </p>
              </div>
              {status?.discordConnected && (
                <span className="shrink-0 rounded-full border border-green-800 bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-400">
                  Done
                </span>
              )}
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={handleConnectDiscord}
                disabled={connectingDiscord}
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50",
                  status?.discordConnected
                    ? "glass-bg-medium text-muted-light hover:glass-bg-strong hover:text-foreground"
                    : "bg-[#5865F2] text-white hover:bg-[#4752C4] shadow-lg shadow-[#5865F2]/20",
                )}
              >
                {status?.discordConnected ? <Unlink className="size-4" /> : <Link2 className="size-4" />}
                {connectingDiscord ? "Opening Discord..." :
                 status?.discordConnected ? "Reconnect Discord" : "Authenticate with Discord"}
              </button>
            </div>
          </motion.div>

          {/* Step 2: Stats.fm */}
          <motion.div
            layout
            className={cn(
              "rounded-2xl border p-6 shadow-glass-sm transition-colors",
              status?.statsFmConfigured
                ? "border-green-800/40 glass-bg-light"
                : "glass-border-light glass-bg-light",
              !status?.discordConnected && "pointer-events-none opacity-40",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-foreground">
                  {status?.statsFmConfigured ? "Stats.fm Connected" : "2. Connect Stats.fm"}
                </h2>
                <p className="text-sm leading-relaxed text-muted-light">
                  OMRPC uses Stats.fm to know what you&apos;re listening to.
                  {!status?.discordConnected && " Complete step 1 first."}
                </p>
              </div>
              {status?.statsFmConfigured && (
                <span className="shrink-0 rounded-full border border-green-800 bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-400">
                  Done
                </span>
              )}
            </div>
            {!status?.statsFmConfigured && (
              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-subtle">Stats.fm User ID</label>
                    <input
                      type="text" value={sfId} onChange={e => setSfId(e.target.value)}
                      placeholder="Your stats.fm username"
                      className="w-full rounded-xl border glass-border-light glass-bg-medium px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-subtle transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-subtle">Auth Token</label>
                    <input
                      type="password" value={sfToken} onChange={e => setSfToken(e.target.value)}
                      placeholder="Your stats.fm access token"
                      className="w-full rounded-xl border glass-border-light glass-bg-medium px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-subtle transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving || (!sfId && !sfToken)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand-sm transition hover:brightness-105 disabled:opacity-50"
                >
                  <Settings className="size-4" />
                  {saving ? "Saving..." : "Save & Finish Setup"}
                </button>
                {saved && <span className="text-sm text-green-400">Saved!</span>}
              </div>
            )}
          </motion.div>

          <p className="text-center text-xs text-muted-subtle">
            Your credentials are stored securely. You can change them later in settings.
          </p>
        </motion.div>
      ) : (
        /* === DASHBOARD MODE: Now Playing + Status === */
        <>
          {/* Connected status banner */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-green-800/30 bg-green-900/10 px-5 py-3"
          >
            <span className="flex size-2.5 shrink-0 rounded-full bg-green-400 shadow-[0_0_10px_rgb(74,222,128)]" />
            <span className="text-sm text-green-300">
              All set! Your Discord Rich Presence is running{status?.pollingState === "active" ? " and updating live." : status?.pollingState === "poked" ? " and will update every 15s for the next 5 minutes." : "."}
            </span>
          </motion.div>

          {/* Now Playing */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border glass-border-light glass-bg-light p-6 shadow-glass-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Headphones className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Now Playing</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  <button type="button" onClick={fetchState} className="rounded-lg p-2 text-muted-light transition hover:glass-bg-strong hover:text-foreground">
                    <RefreshCw className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePoke}
                    disabled={poking}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-light transition hover:glass-bg-strong hover:text-foreground disabled:opacity-50"
                  >
                    <Zap className={cn("size-3.5", poking && "animate-pulse text-yellow-400")} />
                    {poking ? "Poking..." : "Wake up"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {state?.currentTrack ? (
                <div className="flex items-center gap-5 rounded-xl glass-bg-medium p-5">
                  {state.currentTrack.albumArtUrl && (
                    <img src={state.currentTrack.albumArtUrl} alt="" className="size-20 shrink-0 rounded-xl object-cover shadow-md" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-foreground">{state.currentTrack.name}</p>
                    <p className="truncate text-sm text-muted-light">{state.currentTrack.artists?.join(", ")}</p>
                    <div className="mt-2 flex items-center gap-2.5">
                      <span className="truncate text-xs text-muted-subtle">{state.currentTrack.albumName}</span>
                      <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {state.currentTrack.platform}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl glass-bg-medium py-12 text-center">
                  <Music className="size-10 text-muted-subtle" />
                  <div>
                    <p className="text-sm font-medium text-muted-light">No track currently playing</p>
                    <p className="mt-0.5 text-xs text-muted-subtle">Start playing music on Spotify or Apple Music — it&apos;ll show up here automatically.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status grid */}
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Polling", value: state?.pollingState ?? "unknown", color: pollingColors[state?.pollingState ?? "unknown"] ?? pollingColors.unknown },
                { label: "Discord", value: state?.discordConnected ? "connected" : "disconnected", color: state?.discordConnected ? pollingColors.active : "bg-red-900/30 text-red-400 border-red-800" },
                { label: "Stats.fm", value: state?.statsFmConfigured ? "configured" : "not set", color: state?.statsFmConfigured ? pollingColors.active : pollingColors.idle },
                { label: "Last updated", value: state?.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : "never", color: pollingColors.idle },
              ].map(p => (
                <div key={p.label} className="flex items-center justify-between rounded-xl glass-border-light glass-bg-medium px-4 py-3">
                  <span className="text-sm text-muted-light">{p.label}</span>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", p.color)}>{p.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* === SETTINGS PANEL: API creds, reconfigure, docs — shown regardless but collapsed when in setup mode === */}
      <motion.div
        layout
        className="rounded-2xl border glass-border-light glass-bg-light shadow-glass-sm"
      >
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
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
              <div className="space-y-6 border-t glass-border-light px-6 pb-6 pt-5">
                {/* API Credentials */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">API Credentials</h3>
                  <p className="mt-1 text-xs text-muted-subtle">Use these to interact with the OMRPC API programmatically.</p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl glass-bg-medium px-4 py-3">
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-subtle w-16">User ID</span>
                      <code className="flex-1 truncate font-mono text-sm text-primary">{omrpcId || "—"}</code>
                      {omrpcId && <CopyButton text={omrpcId} />}
                    </div>
                    <div className="flex items-center gap-3 rounded-xl glass-bg-medium px-4 py-3">
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-subtle w-16">Auth Code</span>
                      <code className="flex-1 truncate font-mono text-sm text-green-400">{authCode || "—"}</code>
                      {authCode && <CopyButton text={authCode} />}
                    </div>
                  </div>
                </div>

                {/* API Usage */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Using the API</h3>
                  <p className="mt-1 text-xs text-muted-subtle">All requests need a valid auth code as a query parameter.</p>
                  <div className="mt-3 space-y-2 font-mono text-xs">
                    <div className="rounded-xl glass-bg-medium px-4 py-2.5">
                      <span className="text-muted-subtle"># Get current track</span>
                      <br />
                      <span className="text-green-400">GET</span>
                      <span className="text-muted-light"> /api/user/&#123;id&#125;/state?code=&#123;authCode&#125;</span>
                    </div>
                    <div className="rounded-xl glass-bg-medium px-4 py-2.5">
                      <span className="text-muted-subtle"># Trigger active polling</span>
                      <br />
                      <span className="text-yellow-400">GET</span>
                      <span className="text-muted-light"> /api/user/&#123;id&#125;/poke?code=&#123;authCode&#125;</span>
                    </div>
                    <div className="rounded-xl glass-bg-medium px-4 py-2.5">
                      <span className="text-muted-subtle"># Get user status</span>
                      <br />
                      <span className="text-blue-400">GET</span>
                      <span className="text-muted-light"> /api/user/&#123;id&#125;/status</span>
                    </div>
                  </div>
                </div>

                {/* Reconfigure */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Reconfigure</h3>
                  <p className="mt-1 text-xs text-muted-subtle">Update your Discord connection or Stats.fm credentials.</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleConnectDiscord}
                      disabled={connectingDiscord}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2]/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5865F2] disabled:opacity-50"
                    >
                      <Link2 className="size-4" />
                      {status?.discordConnected ? "Reconnect Discord" : "Connect Discord"}
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        type="text" value={sfId} onChange={e => setSfId(e.target.value)}
                        placeholder="Stats.fm User ID"
                        className="w-40 rounded-xl border glass-border-light glass-bg-medium px-3 py-2 text-xs text-foreground placeholder:text-muted-subtle transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <input
                        type="password" value={sfToken} onChange={e => setSfToken(e.target.value)}
                        placeholder="Auth Token"
                        className="w-40 rounded-xl border glass-border-light glass-bg-medium px-3 py-2 text-xs text-foreground placeholder:text-muted-subtle transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={handleSaveConfig}
                        disabled={saving || (!sfId && !sfToken)}
                        className="inline-flex items-center gap-2 rounded-xl glass-bg-medium px-4 py-2 text-xs font-semibold text-foreground transition hover:glass-bg-strong disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Update Stats.fm"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* API endpoint reference */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border glass-border-light glass-bg-light p-5 shadow-glass-sm"
      >
        <div className="flex items-center gap-3">
          <Terminal className="size-5 text-muted-light" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Quick reference</h3>
            <p className="mt-0.5 text-xs text-muted-subtle">
              Base URL: <code className="rounded bg-glass-bg-medium px-1.5 py-0.5 font-mono text-primary">{OMRPC_API_URL}</code>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
