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
  LogOutIcon,
} from "@/components/icons";
import { apiPost } from "@/services/api/client";
import { MESSAGES } from "@/constants/messages";
import { isLineInAppBrowser, clearWebToken } from "@/lib/line";

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

// ─── PIN Setup Sheet ──────────────────────────────────────────────────────────

function PinSetupSheet({
  idToken,
  onClose,
}: {
  idToken: string | null;
  onClose: () => void;
}) {
  const [pin,     setPin]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin))          { setError("PIN ต้องเป็นตัวเลข 6 หลัก"); return; }
    if (pin !== confirm)               { setError("PIN ไม่ตรงกัน"); return; }
    setLoading(true);
    setError("");
    const result = await apiPost<{ success: boolean }>(
      "/api/auth/set-pin", idToken, { pin },
    );
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    setDone(true);
    setTimeout(onClose, 1500);
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
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <KeyIcon size={18} className="text-blue-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900">ตั้ง PIN สำหรับ Web</h2>
        </div>
        <p className="text-xs text-gray-400 mb-5 pl-12">
          ใช้เข้าสู่ระบบในเบราว์เซอร์ทั่วไป ด้วย LINE User ID + PIN 6 หลัก
        </p>

        {done ? (
          <div className="py-8 text-center">
            <CheckCircleIcon size={48} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-green-600 font-semibold text-sm">ตั้ง PIN สำเร็จ!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="PIN ใหม่ (6 ตัวเลข)"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full bg-gray-50 rounded-xl px-3 py-3 text-xl text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300 font-mono tracking-widest text-center"
            />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="ยืนยัน PIN"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full bg-gray-50 rounded-xl px-3 py-3 text-xl text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300 font-mono tracking-widest text-center"
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || pin.length !== 6 || confirm.length !== 6}
              className="w-full bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-60 active:scale-95 transition-transform"
            >
              {loading ? "กำลังบันทึก…" : "ตั้ง PIN"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Line UID display ─────────────────────────────────────────────────────────

function LineUidCard({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(uid).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <KeyIcon size={16} className="text-gray-400" />
        <h2 className="text-sm font-bold text-gray-800">เข้าสู่ระบบผ่านเบราว์เซอร์</h2>
      </div>
      <div className="px-4 py-4 space-y-3">
        <div>
          <p className="text-xs text-gray-400 mb-1">LINE User ID (สำหรับ Web Login)</p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <code className="flex-1 text-xs text-gray-600 font-mono break-all">{uid}</code>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 text-xs font-medium text-blue-500 active:text-blue-700 transition-colors"
            >
              {copied ? "คัดลอกแล้ว!" : "คัดลอก"}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          บันทึก LINE User ID นี้ไว้ แล้วตั้ง PIN ด้านล่าง เพื่อเข้าสู่ระบบในเบราว์เซอร์อื่น
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { status, idToken, data, errorMessage, refetchMe } = useDashboardAuth();
  const [selectedBabyId, setSelectedBabyId] = useSelectedBabyId(
    data?.babies ?? [],
  );
  const [showSwitchBaby,  setShowSwitchBaby]  = useState(false);
  const [showRedeemSheet, setShowRedeemSheet] = useState(false);
  const [showPinSheet,    setShowPinSheet]    = useState(false);

  const inLineBrowser = isLineInAppBrowser();

  const handleWebLogout = () => {
    clearWebToken();
    window.location.replace("/web-login");
  };

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
      {/* ── Gradient hero header ───────────────────────────────────────── */}
      <header
        className="px-4 pt-8 pb-7 flex flex-col items-center text-center"
        style={{ background: "linear-gradient(135deg, #eefbeb 0%, #d3f5cc 100%)" }}
      >
        <div className="w-16 h-16 rounded-full border-2 border-green-200 shadow-sm overflow-hidden bg-white/50 mb-3">
          {user.picture_url ? (
            <Image
              src={user.picture_url}
              alt=""
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-green-700 font-bold text-2xl">
                {user.display_name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            </div>
          )}
        </div>
        <p className="font-bold text-green-900 text-lg leading-tight">
          {user.display_name ?? "ผู้ใช้"}
        </p>
        <p className="text-green-600 text-xs mt-0.5">{MESSAGES.UI.LINE_ACCOUNT}</p>
      </header>

      <div className="flex-1 px-4 pt-4 space-y-4">

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

        {/* Web login section — only visible in LINE browser so user can set their PIN */}
        {inLineBrowser && user.line_user_id && (
          <>
            <LineUidCard uid={user.line_user_id} />

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                <KeyIcon size={16} className="text-gray-400" />
                <h2 className="text-sm font-bold text-gray-800">PIN สำหรับ Web Login</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPinSheet(true)}
                className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50 transition-colors"
              >
                <p className="text-sm text-gray-600">ตั้ง / เปลี่ยน PIN</p>
                <ChevronLeftIcon size={16} className="text-gray-300 rotate-180" />
              </button>
            </div>
          </>
        )}

        {/* Logout — only for web sessions (external browser) */}
        {!inLineBrowser && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={handleWebLogout}
              className="w-full flex items-center gap-3 px-4 py-4 active:bg-red-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <LogOutIcon size={16} className="text-red-400" />
              </div>
              <span className="text-sm font-medium text-red-500">ออกจากระบบ</span>
            </button>
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

      {showPinSheet && (
        <PinSetupSheet
          idToken={idToken}
          onClose={() => setShowPinSheet(false)}
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
