"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorView } from "@/components/common";
import { initLiffAndGetToken } from "@/lib/line";
import { apiPost } from "@/services/api/client";

export default function RegisterPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "form" | "submitting" | "error">("loading");
  const [idToken, setIdToken] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const result = await initLiffAndGetToken();
      if (cancelled) return;

      if (!result.ok) {
        if (result.error === "not_logged_in") return;
        setErrorMessage(result.message);
        setStatus("error");
        return;
      }

      setIdToken(result.idToken);
      setDisplayName(result.profile?.displayName ?? "");
      setStatus("form");
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idToken || status === "submitting") return;

    setStatus("submitting");
    setErrorMessage("");

    const result = await apiPost<{ userId: string }>("/api/register", idToken, {
      displayName: displayName.trim() || null,
      pictureUrl: undefined,
      inviteCode: inviteCode.trim() || null,
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      setStatus("form");
      return;
    }

    router.replace("/dashboard");
  }

  if (status === "loading" || status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        {status === "loading" && <LoadingSpinner />}
        {status === "error" && (
          <ErrorView message={errorMessage} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900">สมัครสมาชิก</h1>
        <p className="mt-1 text-gray-600 text-sm">กรอกข้อมูลเพื่อเริ่มใช้งาน</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              ชื่อที่แสดง
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="ชื่อของคุณ"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
              รหัสเชิญ (ถ้ามี)
            </label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="ใส่รหัสเชิญเพื่อผูกกับเด็ก"
            />
            <p className="mt-1 text-xs text-gray-500">
              ถ้ามีรหัสเชิญจากคนในครอบครัว ใส่ตรงนี้เพื่อผูกกับเด็กได้ทันที
            </p>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {status === "submitting" ? "กำลังสมัคร…" : "สมัคร"}
          </button>
        </form>
      </div>
    </div>
  );
}
