"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useSelectedBabyId } from "@/hooks/useSelectedBabyId";
import {
  LoadingSpinner,
  ErrorView,
  BottomNav,
  SwitchBabySheet,
} from "@/components/common";
import { calcAge } from "@/utils/time";
import {
  PlusIcon,
  ChevronLeftIcon,
  BabyIcon,
  KeyIcon,
  LinkIcon,
  InfoIcon,
  CheckCircleIcon,
} from "@/components/icons";
import { apiPost } from "@/services/api/client";
import { MESSAGES } from "@/constants/messages";

function RedeemInviteSheet({
  idToken,
  onClose,
  onSuccess,
}: {
  idToken: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    const result = await apiPost<{ success: boolean; baby_id: string }>(
      "/api/invites/redeem",
      idToken,
      { token: trimmed },
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
    setTimeout(() => {
      onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative w-full bg-white rounded-t-3xl px-4 pt-5"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="text-base font-bold text-gray-900 mb-1">กรอกรหัสเชิญ</h2>
        <p className="text-xs text-gray-400 mb-4">
          ขอรหัสเชิญจากผู้ที่สร้างข้อมูลเด็ก เพื่อเข้าถึงข้อมูลร่วมกัน
        </p>

        {done ? (
          <div className="py-8 text-center">
            <CheckCircleIcon
              size={48}
              className="text-emerald-400 mx-auto mb-2"
            />
            <p className="text-green-600 font-semibold text-sm">
              เพิ่มสำเร็จแล้ว!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="วางรหัสเชิญที่นี่..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoFocus
              autoComplete="off"
              className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300 font-mono tracking-wider"
            />
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-60 active:scale-95 transition-transform"
            >
              {loading ? "กำลังตรวจสอบ..." : "ยืนยัน"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { status, idToken, data, errorMessage, refetchMe } = useDashboardAuth();
  const [selectedBabyId, setSelectedBabyId] = useSelectedBabyId(
    data?.babies ?? [],
  );
  const [showSwitchBaby, setShowSwitchBaby] = useState(false);
  const [showRedeemSheet, setShowRedeemSheet] = useState(false);

  if (status === "loading") return <LoadingSpinner />;
  if (status === "error")
    return (
      <ErrorView
        message={errorMessage}
        action={{ label: MESSAGES.UI.RETRY, href: "/dashboard/profile" }}
      />
    );
  if (!data) return null;

  const { user, babies } = data;

  return (
    <div
      className="min-h-screen bg-app-bg-secondary flex flex-col"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      {/* Header */}
      <header className="bg-white px-4 pt-5 pb-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">{MESSAGES.UI.NAV_PROFILE}</h1>
      </header>

      <div className="flex-1 px-4 pt-4 space-y-4">
        {/* User Card */}
        <div className="bg-white rounded-2xl px-4 py-5 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
            {user.picture_url ? (
              <Image
                src={user.picture_url}
                alt=""
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-600 font-bold text-xl">
                {user.display_name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-base truncate">
              {user.display_name ?? "ผู้ใช้"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{MESSAGES.UI.LINE_ACCOUNT}</p>
          </div>
        </div>

        {/* My Babies */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <BabyIcon size={16} className="text-gray-400" />
              <h2 className="text-sm font-bold text-gray-800">เด็กของฉัน</h2>
            </div>
            <Link
              href="/dashboard/babies/new"
              className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center"
            >
              <PlusIcon size={14} className="text-white" />
            </Link>
          </div>

          {babies.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-400 text-sm">{MESSAGES.UI.EMPTY_BABIES}</p>
              <Link
                href="/dashboard/babies/new"
                className="mt-2 inline-block text-blue-500 text-sm font-medium"
              >
                {MESSAGES.UI.ADD_FIRST_BABY}
              </Link>
            </div>
          ) : (
            <div>
              {babies.map((baby) => (
                <Link
                  key={baby.id}
                  href={`/dashboard/babies/${baby.id}/edit`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                    {baby.avatar_url ? (
                      <Image
                        src={baby.avatar_url}
                        alt=""
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-bold text-base">
                        {baby.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {baby.name}
                    </p>
                    {baby.birth_date && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {calcAge(baby.birth_date)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {baby.is_owner && (
                      <span className="text-[10px] bg-blue-50 text-blue-500 font-medium px-2 py-0.5 rounded-full">
                        เจ้าของ
                      </span>
                    )}
                    <ChevronLeftIcon
                      size={16}
                      className="text-gray-300 rotate-180"
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Join with invite code */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
            <KeyIcon size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-800">มีรหัสเชิญ?</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowRedeemSheet(true)}
            className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50 transition-colors"
          >
            <p className="text-sm text-gray-600">
              กรอกรหัสเชิญเพื่อเข้าถึงข้อมูลเด็ก
            </p>
            <ChevronLeftIcon size={16} className="text-gray-300 rotate-180" />
          </button>
        </div>

        {/* Invite Management */}
        {babies.some((b) => b.is_owner) && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
              <LinkIcon size={16} className="text-gray-400" />
              <h2 className="text-sm font-bold text-gray-800">
                จัดการรหัสเชิญ
              </h2>
            </div>
            {babies
              .filter((b) => b.is_owner)
              .map((baby) => (
                <Link
                  key={baby.id}
                  href={`/dashboard/invites?babyId=${encodeURIComponent(baby.id)}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      รหัสเชิญสำหรับ {baby.name}
                    </p>
                  </div>
                  <ChevronLeftIcon
                    size={16}
                    className="text-gray-300 rotate-180"
                  />
                </Link>
              ))}
          </div>
        )}

        {/* App Info */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <InfoIcon size={16} className="text-gray-400" />
            <h2 className="text-sm font-bold text-gray-800">เกี่ยวกับแอป</h2>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">เวอร์ชัน</span>
            <span className="text-sm text-gray-400">1.0.0</span>
          </div>
        </div>
      </div>

      {showRedeemSheet && (
        <RedeemInviteSheet
          idToken={idToken}
          onClose={() => setShowRedeemSheet(false)}
          onSuccess={async () => {
            setShowRedeemSheet(false);
            await refetchMe();
          }}
        />
      )}

      {showSwitchBaby && (
        <SwitchBabySheet
          babies={babies}
          selectedBabyId={selectedBabyId}
          onSelect={(id) => {
            setSelectedBabyId(id);
            setShowSwitchBaby(false);
          }}
          onClose={() => setShowSwitchBaby(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
