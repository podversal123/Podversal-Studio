"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      router.replace("/login?error=google_failed");
      return;
    }

    // The callback URL only ever carries an opaque one-time code  the
    // actual tokens are fetched here over a normal POST body, so they
    // never sit in the URL, browser history, or server logs.
    api
      .post("/auth/exchange", { code })
      .then(({ data }) => {
        localStorage.setItem("access_token", data.accessToken);
        localStorage.setItem("refresh_token", data.refreshToken ?? "");
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/dashboard";
      })
      .catch(() => {
        window.location.href = "/login?error=google_failed";
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111111]">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Signing you in...
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111111]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Signing you in...
          </p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
