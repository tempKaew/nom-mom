"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common";
import { initLiffAndGetToken } from "@/lib/line";

type Status = "loading" | "error";
type ErrorKind = "missing_liff_id" | "liff_init" | "profile";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const result = await initLiffAndGetToken();
      if (cancelled) return;

      if (!result.ok) {
        if (result.error === "not_logged_in") return;
        // External browser with no session → send to web login page
        if (result.error === "no_web_session") {
          router.replace("/web-login");
          return;
        }
        setErrorKind(
          result.error === "missing_liff_id"
            ? "missing_liff_id"
            : result.error === "no_id_token"
            ? "profile"
            : "liff_init"
        );
        setErrorMessage(result.message);
        setStatus("error");
        return;
      }

      // LIFF auth succeeded — redirect to dashboard.
      // useDashboardAuth will call check-user once there and redirect to
      // /register if the user hasn't registered yet.
      router.replace("/dashboard");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "loading") {
    return <LoadingSpinner label="Loading…" />;
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 font-medium">
            {errorKind === "missing_liff_id" && "Configuration error"}
            {errorKind === "liff_init" && "LIFF error"}
            {errorKind === "profile" && "Profile error"}
          </p>
          <p className="mt-2 text-gray-600 text-sm">{errorMessage}</p>
          {errorKind === "liff_init" && (
            <p className="mt-4 text-gray-500 text-sm">
              Open this app from the LINE app for the best experience.
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
