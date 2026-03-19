"use client";

import { useState } from "react";
import { apiPost, apiPatch } from "@/services/api/client";
import {
  XIcon,
  SaveIcon,
  DropletsIcon,
  SproutIcon,
  CirclePileIcon,
  ToiletIcon,
  ClockIcon,
} from "@/components/icons";
import { MESSAGES } from "@/constants/messages";
import { getRecentDateTimeSuggestions, toLocalDatetimeValue } from "@/utils/time";
import type {
  ExcretionType,
  PeeAmount,
  PeeColor,
  PoopColor,
  PoopTexture,
  PoopAmount,
  SmellType,
  CreateExcretionEventPayload,
  ExcretionEvent,
} from "@/types/app";

// ─── Option tables ────────────────────────────────────────────────────────────

const EXCRETION_TYPES: { key: ExcretionType; emoji: React.ReactNode; label: string }[] = [
  { key: "pee",  emoji: <DropletsIcon size={20} />,   label: "ฉี่" },
  { key: "poop", emoji: <CirclePileIcon size={20} />, label: "อึ" },
  { key: "both", emoji: <SproutIcon size={20} />,     label: "ทั้งคู่" },
];

const PEE_AMOUNTS: { key: PeeAmount; label: string }[] = [
  { key: "small", label: "น้อย" },
  { key: "medium", label: "ปกติ" },
  { key: "large", label: "เยอะ" },
];

const PEE_COLORS: { key: PeeColor; label: string; dot: string }[] = [
  { key: "clear",        label: "ใส",         dot: "bg-gray-200" },
  { key: "light_yellow", label: "เหลืองอ่อน", dot: "bg-yellow-200" },
  { key: "dark_yellow",  label: "เหลืองเข้ม", dot: "bg-yellow-500" },
];

const POOP_COLORS: { key: PoopColor; label: string; dot: string }[] = [
  { key: "yellow", label: "เหลือง",   dot: "bg-yellow-400" },
  { key: "green",  label: "เขียว",    dot: "bg-green-500" },
  { key: "brown",  label: "น้ำตาล",   dot: "bg-amber-700" },
  { key: "black",  label: "ดำ",       dot: "bg-gray-900" },
  { key: "pale",   label: "ซีด/ขาว",  dot: "bg-gray-100 border border-gray-300" },
];

const POOP_TEXTURES: { key: PoopTexture; label: string }[] = [
  { key: "watery", label: "เหลว" },
  { key: "soft",   label: "นิ่ม" },
  { key: "normal", label: "ปกติ" },
  { key: "hard",   label: "แข็ง" },
  { key: "mucus",  label: "มีมูก" },
];

const POOP_AMOUNTS: { key: PoopAmount; label: string }[] = [
  { key: "small",  label: "น้อย" },
  { key: "medium", label: "ปกติ" },
  { key: "large",  label: "เยอะ" },
];

const SMELL_OPTIONS: { key: SmellType; label: string }[] = [
  { key: "normal",  label: "ปกติ" },
  { key: "strong",  label: "แรง" },
  { key: "unusual", label: "ผิดปกติ" },
];

// ─── Quick presets ────────────────────────────────────────────────────────────

type Preset = { emoji: React.ReactNode; label: string; values: Partial<FormState> };

const PRESET_PEE:  Partial<FormState> = { peeAmount: "medium", peeColor: "light_yellow" };
const PRESET_POOP: Partial<FormState> = { poopColor: "yellow", poopTexture: "soft", poopAmount: "medium" };

const PRESETS: Preset[] = [
  { emoji: <DropletsIcon size={20} />,   label: "ฉี่ปกติ",    values: { type: "pee",  diaperUsed: true, ...PRESET_PEE } },
  { emoji: <CirclePileIcon size={20} />, label: "อึปกติ",     values: { type: "poop", diaperUsed: true, ...PRESET_POOP } },
  { emoji: <SproutIcon size={20} />,     label: "ทั้งคู่ปกติ", values: { type: "both", diaperUsed: true, ...PRESET_PEE, ...PRESET_POOP } },
];

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  type: ExcretionType;
  diaperUsed: boolean;
  peeAmount: PeeAmount | null;
  peeColor: PeeColor | null;
  poopColor: PoopColor | null;
  poopTexture: PoopTexture | null;
  poopAmount: PoopAmount | null;
  smell: SmellType | null;
  rash: boolean;
  leak: boolean;
  note: string;
};

const DEFAULT_STATE: FormState = {
  type: "pee",
  diaperUsed: true,
  peeAmount: null,
  peeColor: null,
  poopColor: null,
  poopTexture: null,
  poopAmount: null,
  smell: null,
  rash: false,
  leak: false,
  note: "",
};

function initialFormState(data?: ExcretionEvent): FormState {
  if (!data) return DEFAULT_STATE;
  return {
    type:        data.type as ExcretionType,
    diaperUsed:  data.diaper_used,
    peeAmount:   (data.pee_amount as PeeAmount | null) ?? null,
    peeColor:    (data.pee_color as PeeColor | null) ?? null,
    poopColor:   (data.poop_color as PoopColor | null) ?? null,
    poopTexture: (data.poop_texture as PoopTexture | null) ?? null,
    poopAmount:  (data.poop_amount as PoopAmount | null) ?? null,
    smell:       (data.smell as SmellType | null) ?? null,
    rash:        data.rash ?? false,
    leak:        data.leak ?? false,
    note:        data.note ?? "",
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  idToken: string | null;
  babyId: string;
  /** Pass to open in edit mode — fields are pre-filled and PATCH is used. */
  initialData?: ExcretionEvent;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChipGroup<T extends string>({
  options, value, onChange, colorDot,
}: {
  options: { key: T; label: string; dot?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  colorDot?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.key} type="button" onClick={() => onChange(o.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 touch-manipulation ${
            value === o.key
              ? "bg-yellow-100 border-yellow-400 text-yellow-800"
              : "border-gray-200 bg-white text-gray-500"
          }`}>
          {colorDot && o.dot && <span className={`inline-block w-3 h-3 rounded-full ${o.dot}`} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">{children}</p>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all touch-manipulation ${
        checked ? "bg-blue-100 border-blue-400 text-blue-800" : "border-gray-200 bg-white text-gray-400"
      }`}>
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${checked ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
        {checked && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AddExcretionEventModal({ idToken, babyId, initialData, onClose, onSuccess }: Props) {
  const isEdit = !!initialData;

  const [form, setForm]           = useState<FormState>(() => initialFormState(initialData));
  const [datetime, setDatetime]   = useState(() =>
    initialData ? toLocalDatetimeValue(new Date(initialData.datetime)) : toLocalDatetimeValue(new Date())
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const recentTimeSuggestions = getRecentDateTimeSuggestions();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (preset: Preset) => {
    setForm({ ...DEFAULT_STATE, ...preset.values } as FormState);
    setError("");
  };

  const selectType = (t: ExcretionType) => {
    if (t === "both") {
      setForm((prev) => ({ ...prev, type: "both", ...PRESET_PEE, ...PRESET_POOP }));
    } else {
      set("type", t);
    }
    setError("");
  };

  const handleSubmit = async () => {
    if (!idToken || submitting) return;
    setSubmitting(true);
    setError("");

    const datetimeISO = new Date(datetime).toISOString();

    let result;
    if (isEdit) {
      result = await apiPatch(`/api/excretion-event?id=${initialData!.id}`, idToken, {
        baby_id:      babyId,
        type:         form.type,
        datetime:     datetimeISO,
        diaper_used:  form.diaperUsed,
        pee_amount:   form.type !== "poop" ? form.peeAmount  : null,
        pee_color:    form.type !== "poop" ? form.peeColor   : null,
        poop_color:   form.type !== "pee"  ? form.poopColor  : null,
        poop_texture: form.type !== "pee"  ? form.poopTexture : null,
        poop_amount:  form.type !== "pee"  ? form.poopAmount : null,
        smell:        form.smell,
        rash:         form.rash || null,
        leak:         form.leak || null,
        note:         form.note.trim() || null,
      });
    } else {
      const payload: CreateExcretionEventPayload = {
        baby_id:     babyId,
        type:        form.type,
        datetime:    datetimeISO,
        diaper_used: form.diaperUsed,
        pee:  form.type !== "poop" ? { amount: form.peeAmount ?? undefined,  color: form.peeColor ?? undefined } : null,
        poop: form.type !== "pee"  ? { color: form.poopColor ?? undefined, texture: form.poopTexture ?? undefined, amount: form.poopAmount ?? undefined } : null,
        smell: form.smell,
        rash:  form.rash || null,
        leak:  form.leak || null,
        note:  form.note.trim() || null,
      };
      result = await apiPost("/api/excretion-event", idToken, payload);
    }

    if (!result.ok) {
      setError(result.error ?? MESSAGES.EXCRETION.ADD_FAILED);
      setSubmitting(false);
      return;
    }
    onSuccess();
  };

  const showPee  = form.type === "pee"  || form.type === "both";
  const showPoop = form.type === "poop" || form.type === "both";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-full bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <ToiletIcon size={20} className="text-diaper" />
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "แก้ไขการขับถ่าย" : "บันทึกการขับถ่าย"}
            </h2>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-5">

          {/* วันและเวลา */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ClockIcon size={11} className="text-gray-400" />
              <SectionLabel>วันและเวลา</SectionLabel>
            </div>
            <input type="datetime-local" value={datetime} max={toLocalDatetimeValue(new Date())}
              onChange={(e) => setDatetime(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none" />
            <div className="flex flex-wrap gap-2 mt-2">
              {recentTimeSuggestions.map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDatetime(dt)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 touch-manipulation ${
                    datetime === dt
                      ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {new Date(dt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </button>
              ))}
            </div>
          </div>

          {/* ลัดด่วน (add mode only) */}
          {!isEdit && (
            <div>
              <SectionLabel>ลัดด่วน</SectionLabel>
              <div className="flex gap-2">
                {PRESETS.map((p) => (
                  <button key={p.label} type="button" onClick={() => applyPreset(p)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 active:scale-95 transition-transform touch-manipulation">
                    <span>{p.emoji}</span> {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ประเภท */}
          <div>
            <SectionLabel>ประเภท</SectionLabel>
            <div className="flex gap-2">
              {EXCRETION_TYPES.map((t) => (
                <button key={t.key} type="button" onClick={() => selectType(t.key)}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-all active:scale-95 touch-manipulation flex flex-col items-center gap-0.5 ${
                    form.type === t.key
                      ? "bg-yellow-100 border-yellow-400 text-yellow-800 shadow-sm"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}>
                  <span className="text-xl">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ใส่ผ้าอ้อม */}
          <div>
            <SectionLabel>ใส่ผ้าอ้อม</SectionLabel>
            <div className="flex gap-2">
              <Toggle checked={form.diaperUsed} onChange={(v) => set("diaperUsed", v)} label="ใส่ผ้าอ้อม" />
            </div>
          </div>

          {/* ฉี่ */}
          {showPee && (
            <div className="space-y-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100">
              <p className="text-sm font-bold text-blue-600 flex items-center gap-1">
                <DropletsIcon size={20} /> ฉี่
              </p>
              <div>
                <SectionLabel>ปริมาณ</SectionLabel>
                <ChipGroup options={PEE_AMOUNTS} value={form.peeAmount} onChange={(v) => set("peeAmount", v)} />
              </div>
              <div>
                <SectionLabel>สี</SectionLabel>
                <ChipGroup options={PEE_COLORS} value={form.peeColor} onChange={(v) => set("peeColor", v)} colorDot />
              </div>
            </div>
          )}

          {/* อึ */}
          {showPoop && (
            <div className="space-y-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
              <p className="text-sm font-bold text-amber-700 flex items-center gap-1">
                <CirclePileIcon size={20} /> อึ
              </p>
              <div>
                <SectionLabel>สี</SectionLabel>
                <ChipGroup options={POOP_COLORS} value={form.poopColor} onChange={(v) => set("poopColor", v)} colorDot />
              </div>
              <div>
                <SectionLabel>เนื้อสัมผัส</SectionLabel>
                <ChipGroup options={POOP_TEXTURES} value={form.poopTexture} onChange={(v) => set("poopTexture", v)} />
              </div>
              <div>
                <SectionLabel>ปริมาณ</SectionLabel>
                <ChipGroup options={POOP_AMOUNTS} value={form.poopAmount} onChange={(v) => set("poopAmount", v)} />
              </div>
            </div>
          )}

          {/* รายละเอียดเพิ่มเติม */}
          <div className="space-y-3">
            <div>
              <SectionLabel>กลิ่น <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>
              <ChipGroup options={SMELL_OPTIONS} value={form.smell} onChange={(v) => set("smell", v)} />
            </div>
            <div>
              <SectionLabel>อาการอื่น <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>
              <div className="flex gap-2 flex-wrap">
                <Toggle checked={form.rash} onChange={(v) => set("rash", v)} label="มีผื่น" />
                <Toggle checked={form.leak} onChange={(v) => set("leak", v)} label="รั่ว" />
              </div>
            </div>
            <div>
              <SectionLabel>หมายเหตุ <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>
              <input type="text" value={form.note} onChange={(e) => set("note", e.target.value)}
                placeholder="บันทึกเพิ่มเติม…"
                className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none placeholder:text-gray-300" />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 flex gap-2 shrink-0 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={submitting}
            className="w-24 shrink-0 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-50 touch-manipulation">
            ยกเลิก
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-3.5 rounded-2xl bg-yellow-400 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2">
            {submitting ? "กำลังบันทึก…" : <><SaveIcon size={16} /> บันทึก</>}
          </button>
        </div>
      </div>
    </div>
  );
}
