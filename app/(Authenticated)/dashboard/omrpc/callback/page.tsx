"use client";

import { useEffect } from "react";

export default function OmrpcCallbackPage() {
  useEffect(() => {
    // This page is opened as a popup during Discord OAuth.
    // The OMRPC server redirects here after the user authorizes.
    // We notify the parent window and close the popup.
    if (window.opener) {
      window.opener.postMessage({ type: "discord-oauth-complete" }, "*");
      window.close();
    } else {
      // If not a popup, redirect back to the OMRPC dashboard
      window.location.href = "/dashboard/omrpc";
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-light">Completing Discord connection...</p>
      </div>
    </div>
  );
}
