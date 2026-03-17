"use client";

import { useState } from "react";
import { MESSAGES } from "@/constants/messages";

interface AddBabyFormProps {
  idToken: string | null;
  onSubmit: (payload: {
    name: string;
    birth_date: string | null;
  }) => Promise<{ babyId?: string } | { error: string }>;
  onSuccess: (newBabyId?: string) => void;
  onCancel: () => void;
}

export function AddBabyForm({
  idToken,
  onSubmit,
  onSuccess,
  onCancel,
}: AddBabyFormProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idToken || !name.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    const result = await onSubmit({
      name: name.trim(),
      birth_date: birthDate.trim() || null,
    });

    if ("error" in result) {
      setError(result.error ?? MESSAGES.BABY.ADD_FAILED);
      setSubmitting(false);
      return;
    }

    setName("");
    setBirthDate("");
    onSuccess(result.babyId);
    setSubmitting(false);
  }

  return (
    <div className="mx-4 mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="font-medium text-gray-900 mb-3 italic">เพิ่มข้อมูลเด็ก</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="babyName"
            className="block text-sm font-medium text-gray-700"
          >
            ชื่อเด็ก *
          </label>
          <input
            id="babyName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อลูก"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
            required
          />
        </div>
        <div>
          <label
            htmlFor="babyBirthDate"
            className="block text-sm font-medium text-gray-700"
          >
            วันเกิด (ถ้ารู้)
          </label>
          <input
            id="babyBirthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#f8b4c4] px-4 py-2 text-sm font-medium text-gray-800 hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "กำลังบันทึก…" : "บันทึก"}
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setName("");
              setBirthDate("");
              onCancel();
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
