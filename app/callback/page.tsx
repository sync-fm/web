"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Route } from "next";

export default function CallbackRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Preserve query params when redirecting to the OMRPC callback
    const params = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/dashboard/omrpc/callback${params}` as Route);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
