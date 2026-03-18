"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common";
import { initLiffAndGetToken } from "@/lib/line";
import { apiGet } from "@/services/api/client";

type Status = "loading" | "error" | "redirecting";
type ErrorKind = "missing_liff_id" | "liff_init" | "profile" | "check_user";

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
        setErrorKind(result.error === "missing_liff_id" ? "missing_liff_id" : result.error === "no_id_token" ? "profile" : "liff_init");
        setErrorMessage(result.message);
        setStatus("error");
        return;
      }

      setStatus("redirecting");

      const checkResult = await apiGet<{ exists?: boolean }>(
        "/api/check-user",
        result.idToken
      );
      if (cancelled) return;

      if (!checkResult.ok) {
        setErrorKind("check_user");
        setErrorMessage(checkResult.error);
        setStatus("error");
        return;
      }

      if (checkResult.data.exists) {
        router.replace("/dashboard");
      } else {
        router.replace("/register");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "loading" || status === "redirecting") {
    return (
      <LoadingSpinner
        label={status === "redirecting" ? "Taking you to the app…" : "Loading…"}
      />
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full text-center">
          <p className="text-red-600 font-medium">
            {errorKind === "missing_liff_id" && "Configuration error"}
            {errorKind === "liff_init" && "LIFF error"}
            {errorKind === "profile" && "Profile error"}
            {errorKind === "check_user" && "Server error"}
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
