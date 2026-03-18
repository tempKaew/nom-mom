"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorView } from "@/components/common";
import { initLiffAndGetToken } from "@/lib/line";
import { apiPost } from "@/services/api/client";
import { CheckCircleIcon } from "@/components/icons";

export default function RegisterPage() {
  const router = useRouter();
  const [status, setStatus]             = useState<"loading" | "form" | "submitting" | "error">("loading");
  const [idToken, setIdToken]           = useState<string | null>(null);
  const [displayName, setDisplayName]   = useState("");
  const [inviteCode, setInviteCode]     = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const result = await initLiffAndGetToken(true);
      if (cancelled) return;

      if (!result.ok) {
        if (result.error === "not_logged_in" || result.error === "no_web_session") return;
        setErrorMessage(result.message);
        setStatus("error");
        return;
      }

      setIdToken(result.idToken);
      setDisplayName(result.profile?.displayName ?? "");
      setStatus("form");
    }

    init();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idToken || status === "submitting") return;

    setStatus("submitting");
    setErrorMessage("");

    const result = await apiPost<{ userId: string }>("/api/register", idToken, {
      displayName: displayName.trim() || null,
      pictureUrl:  undefined,
      inviteCode:  inviteCode.trim() || null,
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      setStatus("form");
      return;
    }

    router.replace("/dashboard");
  }

  if (status === "loading") return <LoadingSpinner />;
  if (status === "error")   return <ErrorView message={errorMessage} />;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(160deg, #eefbeb 0%, #d3f5cc 45%, #f3f4f9 45%)",
      }}
    >
      {/* Top brand area */}
      <div className="pt-16 pb-10 flex flex-col items-center text-center px-6">
        <div className="w-16 h-16 rounded-3xl bg-white/60 shadow-sm flex items-center justify-center mb-4 border border-green-200">
          <span className="text-4xl">🍼</span>
        </div>
        <h1 className="text-3xl font-black text-green-900 tracking-tight">nom mom</h1>
        <p className="text-green-600 text-sm mt-1 font-medium">ติดตามการเติบโตของลูกน้อย</p>
      </div>

      {/* Form card */}
      <div className="flex-1 px-5 pb-10">
        <div className="bg-white rounded-3xl shadow-xl px-6 py-7 max-w-sm mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-0.5">ยินดีต้อนรับ!</h2>
          <p className="text-sm text-gray-400 mb-6">กรอกข้อมูลเพื่อเริ่มใช้งาน</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name */}
            <div>
              <label htmlFor="displayName" className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                ชื่อที่แสดง
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ชื่อของคุณ"
                autoComplete="name"
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:bg-white transition-colors"
              />
            </div>

            {/* Invite code */}
            <div>
              <label htmlFor="inviteCode" className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                รหัสเชิญ
                <span className="normal-case font-normal text-gray-300 ml-1">(ถ้ามี)</span>
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="ใส่รหัสเชิญเพื่อผูกกับเด็กได้ทันที"
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 font-mono focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:bg-white transition-colors"
              />
              <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
                ถ้ามีรหัสเชิญจากคนในครอบครัว ใส่ตรงนี้เพื่อเชื่อมกับข้อมูลเด็ก
              </p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.98] transition-transform disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
            >
              {status === "submitting" ? "กำลังสมัคร…" : "เริ่มต้นใช้งาน"}
            </button>
          </form>

          {/* Feature highlights */}
          <div className="mt-6 pt-5 border-t border-gray-50 space-y-2.5">
            {[
              "บันทึกการป้อนนม การนอน และการขับถ่าย",
              "ติดตามการเติบโตและนัดหมายแพทย์",
              "แชร์กับคนในครอบครัวได้",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2">
                <CheckCircleIcon size={14} className="text-indigo-400 shrink-0" />
                <span className="text-xs text-gray-500">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
