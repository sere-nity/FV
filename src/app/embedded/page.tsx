"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AuthProvider, useAuth, useEmbeddedAuth } from "@fanvue/builder-sdk/react";
import type { FanvueUser } from "@/lib/fanvue";
import { Profile } from "./profile";

const ERRORS: Record<string, string> = {
  invalid_session_token: "Session expired. Reopen the app from Fanvue.",
  consent_required: "Approve access to this app in Fanvue, then reopen it.",
};

const noopSubscribe = () => () => {};

function Embedded() {
  const { status, error, theme } = useEmbeddedAuth();
  const { authFetch } = useAuth();
  const [user, setUser] = useState<FanvueUser | null>(null);
  const [loadError, setLoadError] = useState(false);
  // The hook reports "idle" until its mount effect reads ?token=, so don't
  // render the "open from Fanvue" state turing prerender/hydration.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    const resolved =
      theme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = resolved;
  }, [theme]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    authFetch("/api/me")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: FanvueUser) => !cancelled && setUser(data))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [status, authFetch]);

  let body: React.ReactNode;
  if (!hydrated) {
    body = <Note>Connecting to Fanvue…</Note>;
  } else if (status === "idle") {
    body = <Note>Open this app from Fanvue.</Note>;
  } else if (status === "error") {
    body = <Note error>{ERRORS[error ?? ""] ?? `Sign-in failed (${error}).`}</Note>;
  } else if (loadError) {
    body = <Note error>Could not load your profile. Reopen the app from Fanvue.</Note>;
  } else if (user) {
    body = <Profile user={user} />;
  } else {
    body = <Note>Connecting to Fanvue…</Note>;
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
      <h1 className="text-lg font-semibold">fanvue-curator</h1>
      {body}
    </main>
  );
}

function Note({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <p className={`text-sm ${error ? "text-red-600" : "text-black/60 dark:text-white/60"}`}>
      {children}
    </p>
  );
}

export default function EmbeddedPage() {
  return (
    <AuthProvider>
      <Embedded />
    </AuthProvider>
  );
}
