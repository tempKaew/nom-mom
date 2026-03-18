"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { useLiffAuth } from "@/hooks/useLiffAuth";
import { clearDashboardCache } from "@/hooks/useDashboardAuth";
import { LoadingSpinner, ErrorView } from "@/components/common";
import { getBaseUrl } from "@/utils/url";
import { createCroppedBlob } from "@/utils/crop";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch, apiDelete } from "@/services/api/client";
import { AVATAR_SIZE } from "@/constants/api";
import { MESSAGES } from "@/constants/messages";
import type { BabyDetail } from "@/app/api/babies/[id]/route";
import { ChevronLeftIcon, TrashIcon } from "@/components/icons";

export default function EditBabyPage() {
  const params = useParams();
  const router = useRouter();
  const babyId = params?.id as string | undefined;
  const liffAuth = useLiffAuth();

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [baby, setBaby] = useState<BabyDetail | null>(null);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAreaPixels, setCropAreaPixels] = useState<Area | null>(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const base = getBaseUrl();
  const idToken = liffAuth.status === "ready" ? liffAuth.idToken : null;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!babyId || !idToken) {
        if (liffAuth.status === "error") setStatus("error");
        return;
      }

      try {
        const result = await apiGet<BabyDetail>(
          `/api/babies/${babyId}`,
          idToken,
        );
        if (cancelled) return;
        if (!result.ok) {
          setStatus("error");
          return;
        }
        if (!cancelled) {
          setBaby(result.data);
          setName(result.data.name);
          setBirthDate(result.data.birth_date ?? "");
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [babyId, idToken, liffAuth.status]);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCropAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setCropImageSrc(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropAreaPixels(null);
    e.target.value = "";
  };

  const handleCropCancel = () => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setCropAreaPixels(null);
  };

  const handleCropSave = async () => {
    if (!cropImageSrc || !cropAreaPixels || !babyId || !idToken) return;

    setUploadSubmitting(true);
    setUploadError("");

    try {
      const blob = await createCroppedBlob(
        cropImageSrc,
        cropAreaPixels,
        AVATAR_SIZE,
      );
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
      setCropAreaPixels(null);

      const formData = new FormData();
      formData.append("file", blob, "avatar.png");

      const res = await fetch(`${base}/api/babies/${babyId}/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setUploadError(json?.error ?? MESSAGES.AVATAR.UPLOAD_FAILED);
        return;
      }

      setBaby((prev) =>
        prev ? { ...prev, avatar_url: json.avatar_url } : null,
      );
    } finally {
      setUploadSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!babyId || !idToken || deleteSubmitting) return;
    setDeleteSubmitting(true);
    setDeleteError("");
    const result = await apiDelete<{ success: true }>(
      `/api/babies/${babyId}`,
      idToken,
    );
    if (!result.ok) {
      setDeleteError(result.error ?? "ลบไม่สำเร็จ");
      setDeleteSubmitting(false);
      return;
    }
    // Clear the module-level auth cache so the dashboard re-fetches
    // a fresh babies list without the deleted baby.
    clearDashboardCache();
    router.push("/dashboard");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyId || !idToken || saveSubmitting) return;

    setSaveSubmitting(true);
    setSaveError("");

    const result = await apiPatch<BabyDetail>(
      `/api/babies/${babyId}`,
      idToken,
      {
        name: name.trim(),
        birth_date: birthDate.trim() || null,
      },
    );

    if (!result.ok) {
      setSaveError(result.error ?? MESSAGES.BABY.SAVE_FAILED);
    } else {
      setBaby((prev) => (prev ? { ...prev, ...result.data } : null));
      clearDashboardCache();
      router.push(`/dashboard?babyId=${babyId}`);
    }
    setSaveSubmitting(false);
  };

  if (liffAuth.status === "loading" || status === "loading") {
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

  if (status === "error" || !baby) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] flex flex-col items-center justify-center p-6">
        <p className="text-red-500 text-sm">
          ไม่พบข้อมูลเด็กหรือไม่มีสิทธิ์แก้ไข
        </p>
        <Link
          href="/dashboard"
          className="mt-4 text-blue-500 text-sm font-medium hover:underline"
        >
          {MESSAGES.UI.BACK_TO_DASHBOARD}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg-secondary flex flex-col">
      {/* ── Gradient header with avatar ────────────────────────────────── */}
      <header
        className="px-4 pt-5 pb-7 flex flex-col"
        style={{ background: "linear-gradient(135deg, #eefbeb 0%, #d3f5cc 100%)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/dashboard"
            aria-label="กลับ"
            className="w-8 h-8 rounded-full bg-white/60 border border-green-200 flex items-center justify-center shrink-0"
          >
            <ChevronLeftIcon size={16} className="text-green-700" />
          </Link>
          <h1 className="text-lg font-bold text-green-900">แก้ไขข้อมูลเด็ก</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            {baby.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={baby.avatar_url}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-2 border-green-200 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/60 border-2 border-green-200 shadow-sm flex items-center justify-center">
                <span className="text-green-700 font-black text-3xl">
                  {baby.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <label className="rounded-full bg-white/60 border border-green-200 px-4 py-1.5 text-xs font-semibold text-green-700 cursor-pointer active:bg-white transition-colors">
            {uploadSubmitting ? "กำลังอัพโหลด…" : "เปลี่ยนรูปภาพ"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploadSubmitting}
            />
          </label>
          {uploadError && (
            <p className="mt-2 text-xs text-red-500">{uploadError}</p>
          )}
        </div>
      </header>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 pt-5 pb-10 max-w-md mx-auto w-full">
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <div>
              <label
                htmlFor="editName"
                className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5"
              >
                ชื่อเด็ก <span className="text-red-400">*</span>
              </label>
              <input
                id="editName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:bg-white transition-colors"
                required
              />
            </div>

            <div>
              <label
                htmlFor="editBirthDate"
                className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5"
              >
                วันเกิด
              </label>
              <input
                id="editBirthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-green-400 focus:ring-1 focus:ring-green-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-600">{saveError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saveSubmitting}
            className="w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-md active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
          >
            {saveSubmitting ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </form>

        {/* Danger zone — owner only */}
        {baby.is_owner && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmName("");
                setDeleteError("");
                setShowDeleteModal(true);
              }}
              className="w-full rounded-2xl border border-red-200 py-3.5 text-sm font-medium text-red-400 active:bg-red-50 transition-colors"
            >
              ลบข้อมูลเด็ก
            </button>
          </div>
        )}
      </main>

      {/* Delete confirm modal */}
      {showDeleteModal && baby && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <TrashIcon size={20} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900 text-center mb-1">
              ลบข้อมูลเด็ก
            </h2>
            <p className="text-sm text-gray-500 text-center mb-4">
              การลบจะไม่สามารถกู้คืนได้ กรุณาพิมพ์{" "}
              <span className="font-semibold text-gray-800">{baby.name}</span>{" "}
              เพื่อยืนยัน
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={`พิมพ์ "${baby.name}"`}
              className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400 mb-3"
            />
            {deleteError && (
              <p className="text-sm text-red-600 mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteSubmitting}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteSubmitting || deleteConfirmName !== baby.name}
                className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {deleteSubmitting ? "กำลังลบ…" : "ยืนยันลบ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col">
            <p className="text-white text-center py-3 text-sm">
              ปรับพื้นที่ที่ต้องการ crop (จะย่อเป็น 160×160 px)
            </p>
            <div className="flex-1 relative min-h-[50vh]">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="contain"
                style={{ containerStyle: { background: "#000" } }}
                classes={{ containerClassName: "rounded" }}
              />
            </div>
            <div className="flex gap-3 p-4 bg-gray-900">
              <button
                type="button"
                onClick={handleCropCancel}
                className="flex-1 rounded-2xl border border-gray-600 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={uploadSubmitting || !cropAreaPixels}
                className="flex-1 rounded-2xl bg-blue-500 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {uploadSubmitting ? "กำลังอัพโหลด…" : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
