"use client";

import { useState } from "react";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { isLineInAppBrowser } from "@/lib/line";
import { normalizePhoneInput } from "@/lib/phone";
import { apiPost } from "@/services/api/client";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * Blocks LINE users who have not set a phone number yet.
 * Required for web-login migration — existing users must register phone once.
 */
export function PhoneSetupGate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { status, idToken, data, refetchMe } = useDashboardAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  const needsPhone =
    status === "ready" &&
    isLineInAppBrowser() &&
    data?.user &&
    !data.user.phone;

  if (!needsPhone) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError("เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0");
      return;
    }
    setLoading(true);
    setError("");
    const result = await apiPost<{ success: boolean; phone: string }>(
      "/api/auth/set-phone",
      idToken,
      { phone },
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refetchMe();
  };

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 px-4">
        <div
          className="w-full max-w-sm bg-white rounded-3xl px-6 py-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            ระบุเบอร์โทรศัพท์
          </h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            ใช้เบอร์โทรนี้สำหรับเข้าสู่ระบบในเบราว์เซอร์ทั่วไป
            ร่วมกับ PIN 6 หลัก
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                เบอร์โทร 10 หลัก
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(normalizePhoneInput(e.target.value))
                }
                placeholder="0812345678"
                autoFocus
                disabled={loading}
                autoComplete="tel"
                className="block w-full rounded-xl border border-gray-200 px-3 py-3 text-base text-gray-900 tracking-wider focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none placeholder:text-gray-300 disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full py-3.5 rounded-2xl bg-blue-500 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-40 touch-manipulation"
            >
              {loading ? "กำลังบันทึก…" : "บันทึกเบอร์โทร"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
