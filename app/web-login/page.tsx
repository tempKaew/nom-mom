"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { storeWebToken } from "@/lib/line";
import Image from "next/image";

// ─── PIN input — 6 individual boxes ──────────────────────────────────────────

function PinInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const digits = value.padEnd(6, " ").split("").slice(0, 6);
  const filled = value.length;

  return (
    <div
      className="flex gap-3 justify-center"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden real input */}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0"
        autoComplete="one-time-code"
      />
      {digits.map((d, i) => (
        <div
          key={i}
          className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all select-none ${
            i === filled && !disabled
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : d.trim()
                ? "border-gray-300 bg-white text-gray-800"
                : "border-gray-200 bg-gray-50 text-gray-300"
          }`}
        >
          {d.trim() ? "•" : ""}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WebLoginPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (pin.length === 6 && userId.trim()) {
      handleLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleLogin = async () => {
    if (!userId.trim() || pin.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/web-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId.trim(), pin }),
      });
      const json = (await res.json()) as { token?: string; error?: string };

      if (!res.ok || !json.token) {
        setError(json.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        setPin("");
        setLoading(false);
        return;
      }

      storeWebToken(json.token);
      router.replace("/dashboard");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl">
              <Image
                src="/logo-nom-mom.svg"
                alt="nom mom"
                width={64}
                height={64}
              />
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">nom mom</h1>
          <p className="text-sm text-gray-400 mt-1">เข้าสู่ระบบด้วย PIN</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm px-6 py-6 space-y-5">
          {/* User ID */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              disabled={loading}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="block w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 font-mono focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none placeholder:text-gray-300 disabled:opacity-50"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              ดู User ID ได้จากหน้า Profile ในแอป
            </p>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              PIN 6 หลัก
            </label>
            <PinInput value={pin} onChange={setPin} disabled={loading} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading || !userId.trim() || pin.length !== 6}
            className="w-full py-3.5 rounded-2xl bg-blue-500 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-40 touch-manipulation"
          >
            {loading ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
          ต้องเปิดแอปผ่าน LINE ก่อน
          <br />
          เพื่อดู User ID และตั้ง PIN ในหน้า Profile
        </p>
      </div>
    </div>
  );
}
