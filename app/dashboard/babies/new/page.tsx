"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLiffAuth } from "@/hooks/useLiffAuth";
import { clearDashboardCache } from "@/hooks/useDashboardAuth";
import { ChevronLeftIcon } from "@/components/icons";
import { LoadingSpinner, ErrorView } from "@/components/common";
import { apiPost } from "@/services/api/client";
import { MESSAGES } from "@/constants/messages";

export default function NewBabyPage() {
  const router = useRouter();
  const liffAuth = useLiffAuth();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const idToken = liffAuth.status === "ready" ? liffAuth.idToken : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken || !name.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    const result = await apiPost<{ babyId?: string }>("/api/babies", idToken, {
      name: name.trim(),
      birth_date: birthDate.trim() || null,
      avatar_url: null,
    });

    if (!result.ok) {
      setError(result.error ?? MESSAGES.BABY.ADD_FAILED);
      setSubmitting(false);
      return;
    }

    clearDashboardCache();
    const newBabyId = result.data?.babyId;
    router.push(newBabyId ? `/dashboard?babyId=${newBabyId}` : "/dashboard");
  };

  if (liffAuth.status === "loading") {
    return <LoadingSpinner />;
  }

  if (liffAuth.status === "error") {
    return (
      <ErrorView
        message={liffAuth.message}
        action={{ label: MESSAGES.UI.BACK_TO_DASHBOARD, href: "/dashboard" }}
      />
    );
  }

  const initial = name.trim() ? name.trim().charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {/* Header */}
      <header className="bg-white px-4 pt-5 pb-4 shadow-sm flex items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="กลับ"
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
        >
          <ChevronLeftIcon size={16} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">เพิ่มข้อมูลเด็ก</h1>
      </header>

      <main className="px-4 pt-5 pb-10 max-w-md mx-auto">
        {/* Avatar preview */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
            <span className="text-blue-600 font-bold text-3xl">{initial}</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            เพิ่มรูปได้หลังจากบันทึกในหน้าแก้ไข
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <div>
              <label
                htmlFor="newBabyName"
                className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5"
              >
                ชื่อเด็ก *
              </label>
              <input
                id="newBabyName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อลูก"
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:bg-white transition-colors"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="newBabyBirthDate"
                className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5"
              >
                วันเกิด
              </label>
              <input
                id="newBabyBirthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="w-full rounded-2xl bg-blue-500 py-3.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 shadow-sm transition-colors mt-2"
          >
            {submitting ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </form>
      </main>
    </div>
  );
}
