"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { ChevronLeftIcon } from "@/components/icons";
import { LoadingSpinner, ErrorView } from "@/components/common";
import { apiPost } from "@/services/api/client";
import { authHeaders } from "@/services/api/client";
import { getBaseUrl } from "@/utils/url";
import type { InviteRow } from "@/types/app";
import { MESSAGES } from "@/constants/messages";

function CopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
        copied
          ? "bg-emerald-100 text-emerald-600"
          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
      }`}
    >
      {copied ? "คัดลอกแล้ว ✓" : "คัดลอก"}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600",
    used: "bg-gray-100 text-gray-400",
    expired: "bg-red-50 text-red-400",
  };
  const labels: Record<string, string> = {
    active: MESSAGES.UI.INVITE_ACTIVE,
    used: MESSAGES.UI.INVITE_USED,
    expired: MESSAGES.UI.INVITE_EXPIRED,
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
        styles[status] ?? "bg-gray-100 text-gray-400"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function InvitesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const babyIdParam = searchParams.get("babyId");

  const { status, idToken, data: meData, errorMessage } = useDashboardAuth();
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(
    babyIdParam,
  );
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);

  const fetchInvites = useCallback(
    async (babyId: string) => {
      if (!idToken) return;
      setInvitesLoading(true);
      try {
        const base = getBaseUrl();
        const res = await fetch(
          `${base}/api/invites?babyId=${encodeURIComponent(babyId)}`,
          { headers: authHeaders(idToken) },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load invites");
        setInvites(json.invites ?? []);
      } finally {
        setInvitesLoading(false);
      }
    },
    [idToken],
  );

  useEffect(() => {
    if (meData?.babies) {
      const ownerBabies = meData.babies.filter((b) => b.is_owner);
      if (ownerBabies.length > 0 && !selectedBabyId) {
        setSelectedBabyId(ownerBabies[0].id);
      } else if (babyIdParam && ownerBabies.some((b) => b.id === babyIdParam)) {
        setSelectedBabyId(babyIdParam);
      }
    }
  }, [meData, babyIdParam, selectedBabyId]);

  useEffect(() => {
    if (selectedBabyId && idToken) {
      fetchInvites(selectedBabyId);
    } else {
      setInvites([]);
    }
  }, [selectedBabyId, idToken, fetchInvites]);

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!idToken || !selectedBabyId || !formLabel.trim() || formSubmitting)
      return;

    setFormSubmitting(true);
    setNewToken(null);
    setFormError("");

    const result = await apiPost<{ invite: InviteRow; token: string }>(
      "/api/invites",
      idToken,
      {
        babyId: selectedBabyId,
        label: formLabel.trim(),
        role: "member",
        expiresInDays: 30,
      },
    );

    if (!result.ok) {
      setFormError(result.error ?? MESSAGES.INVITES.CREATE_FAILED);
      setFormSubmitting(false);
      return;
    }

    setFormLabel("");
    setNewToken(result.data.token);
    setInvites((prev) => [result.data.invite, ...prev]);
    setFormSubmitting(false);
  }

  if (status === "loading") return <LoadingSpinner />;
  if (status === "error")
    return (
      <ErrorView
        message={errorMessage}
        action={{ label: MESSAGES.UI.BACK_TO_DASHBOARD, href: "/dashboard" }}
      />
    );

  const ownerBabies = meData?.babies.filter((b) => b.is_owner) ?? [];
  const selectedBaby = ownerBabies.find((b) => b.id === selectedBabyId);

  return (
    <div className="min-h-screen bg-app-bg-secondary flex flex-col">
      {/* ── Gradient header ───────────────────────────────────────────── */}
      <header
        className="px-4 pt-5 pb-5 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #eefbeb 0%, #d3f5cc 100%)" }}
      >
        <Link
          href="/dashboard"
          aria-label="กลับ"
          className="w-8 h-8 rounded-full bg-white/60 border border-green-200 flex items-center justify-center shrink-0"
        >
          <ChevronLeftIcon size={16} className="text-green-700" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-green-900">จัดการรหัสเชิญ</h1>
          {selectedBaby && (
            <p className="text-xs text-green-600 mt-0.5">สำหรับ {selectedBaby.name}</p>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-10 max-w-md mx-auto w-full space-y-3">
        {ownerBabies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-3xl mb-3">🔗</p>
            <p className="text-gray-500 text-sm font-medium">
              คุณยังไม่มีเด็กที่คุณเป็นผู้สร้าง
            </p>
            <p className="text-gray-300 text-xs mt-1 mb-4">จึงไม่สามารถสร้างรหัสเชิญได้</p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-green-600 text-sm font-semibold"
            >
              {MESSAGES.UI.BACK_TO_DASHBOARD}
            </button>
          </div>
        ) : (
          <>
            {/* Baby selector */}
            {ownerBabies.length > 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <label
                  htmlFor="babySelect"
                  className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5"
                >
                  เลือกเด็ก
                </label>
                <select
                  id="babySelect"
                  value={selectedBabyId ?? ""}
                  onChange={(e) => setSelectedBabyId(e.target.value || null)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-400 focus:ring-1 focus:ring-green-400"
                >
                  {ownerBabies.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedBaby && (
              <>
                {/* Create new invite */}
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                    สร้างรหัสเชิญใหม่
                  </p>
                  <form onSubmit={handleCreateInvite} className="space-y-3">
                    <div>
                      <label
                        htmlFor="label"
                        className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5"
                      >
                        ชื่อผู้รับ
                      </label>
                      <input
                        id="label"
                        type="text"
                        value={formLabel}
                        onChange={(e) => setFormLabel(e.target.value)}
                        placeholder="เช่น ป้า, แม่, พ่อ, คุณตา"
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:bg-white transition-colors"
                        required
                      />
                    </div>

                    {formError && (
                      <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                        <p className="text-xs text-red-600">{formError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={formSubmitting || !formLabel.trim()}
                      className="w-full rounded-2xl py-3 text-sm font-bold text-white shadow-sm active:scale-[0.98] transition-transform disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      {formSubmitting ? "กำลังสร้าง…" : "สร้างรหัสเชิญ"}
                    </button>
                  </form>

                  {/* New token result */}
                  {newToken && (
                    <div className="mt-4 bg-green-50 border border-green-100 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide">
                          รหัสเชิญที่สร้างแล้ว ✓
                        </p>
                        <CopyButton token={newToken} />
                      </div>
                      <p className="font-mono text-xs text-green-800 break-all bg-white rounded-xl p-3 border border-green-100">
                        {newToken}
                      </p>
                    </div>
                  )}
                </div>

                {/* Existing invites list */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      รหัสเชิญที่มีอยู่
                    </p>
                  </div>

                  {invitesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : invites.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-gray-400 text-sm">{MESSAGES.UI.EMPTY_INVITES}</p>
                    </div>
                  ) : (
                    <ul>
                      {invites.map((inv, i) => (
                        <li
                          key={inv.id}
                          className={`px-4 py-3.5 ${i < invites.length - 1 ? "border-b border-gray-50" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-sm font-semibold text-gray-800 truncate">
                                {inv.label ?? "(ไม่มี label)"}
                              </span>
                              <StatusBadge status={inv.status} />
                            </div>
                            {inv.status === "active" && <CopyButton token={inv.token} />}
                          </div>
                          <p className={`font-mono text-[11px] break-all leading-relaxed ${
                            inv.status === "active" ? "text-gray-500" : "text-gray-300 line-through"
                          }`}>
                            {inv.token}
                          </p>
                          <p className="text-[10px] text-gray-300 mt-1">
                            หมดอายุ {new Date(inv.expires_at).toLocaleDateString("th-TH")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function InvitesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InvitesContent />
    </Suspense>
  );
}
