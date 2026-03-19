"use client";

import { LoadingSpinner } from "@/components/common";
import {
  TrendUpIcon,
  ScaleIcon,
  RulerIcon,
  BrainIcon,
  PencilIcon,
  WeightIcon,
} from "@/components/icons";
import { MESSAGES } from "@/constants/messages";
import type { GrowthRecord } from "@/types/app";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  records: GrowthRecord[];
  loading: boolean;
  onEdit: (record: GrowthRecord) => void;
};

function MetricChip({
  tone,
  icon,
  value,
  unit,
  extra,
}: {
  tone: "blue" | "emerald" | "purple";
  icon: React.ReactNode;
  value: string;
  unit: string;
  extra?: string | null;
}) {
  const toneClass =
    tone === "blue"
      ? {
          bg: "bg-blue-50",
          icon: "text-blue-400",
          value: "text-blue-600",
          unit: "text-blue-400",
        }
      : tone === "emerald"
        ? {
            bg: "bg-emerald-50",
            icon: "text-emerald-400",
            value: "text-emerald-600",
            unit: "text-emerald-400",
          }
        : {
            bg: "bg-purple-50",
            icon: "text-purple-400",
            value: "text-purple-600",
            unit: "text-purple-400",
          };

  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 ${toneClass.bg}`}
    >
      <span className={toneClass.icon}>{icon}</span>
      <span className={`text-sm font-bold ${toneClass.value}`}>{value}</span>
      <span className={`text-[10px] ${toneClass.unit}`}>{unit}</span>
      {extra ? (
        <span className="text-[10px] font-semibold ml-0.5">{extra}</span>
      ) : null}
    </div>
  );
}

function GrowthRecordItem({
  record,
  prev,
  onEdit,
}: {
  record: GrowthRecord;
  prev?: GrowthRecord;
  onEdit: (record: GrowthRecord) => void;
}) {
  const weightDiff =
    record.weight_kg != null && prev?.weight_kg != null
      ? record.weight_kg - prev.weight_kg
      : null;

  return (
    <div className="px-4 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-400 mb-2">
            {formatDate(record.recorded_at)}
          </p>

          <div className="flex gap-3 flex-wrap">
            {record.weight_kg != null && (
              <MetricChip
                tone="blue"
                icon={<WeightIcon size={12} />}
                value={record.weight_kg.toFixed(2)}
                unit="kg"
                extra={
                  weightDiff !== null
                    ? `${weightDiff >= 0 ? "+" : ""}${weightDiff.toFixed(2)}`
                    : null
                }
              />
            )}
            {record.height_cm != null && (
              <MetricChip
                tone="emerald"
                icon={<RulerIcon size={12} />}
                value={record.height_cm.toFixed(1)}
                unit="cm"
              />
            )}
            {record.head_circumference_cm != null && (
              <MetricChip
                tone="purple"
                icon={<BrainIcon size={12} />}
                value={record.head_circumference_cm.toFixed(1)}
                unit="cm"
              />
            )}
          </div>
          {record.notes && (
            <p className="text-xs text-gray-500 mt-1.5 italic">
              {record.notes}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEdit(record)}
          className="shrink-0 p-2 rounded-lg hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer self-center"
          aria-label="แก้ไขข้อมูลการเติบโต"
        >
          <PencilIcon size={12} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
}

export function GrowthHistorySection({ records, loading, onEdit }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
        <TrendUpIcon size={16} className="text-emerald-500" />
        <h2 className="text-sm font-bold text-gray-800">ประวัติการเติบโต</h2>
      </div>

      {loading ? (
        <LoadingSpinner
          className="text-xs"
          label="กำลังโหลดประวัติการเติบโต..."
        />
      ) : records.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-4xl mb-3">📏</p>
          <p className="text-gray-500 text-sm font-medium">
            {MESSAGES.UI.EMPTY_GROWTH}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {MESSAGES.UI.EMPTY_GROWTH_HINT}
          </p>
        </div>
      ) : (
        <div>
          {records.map((r, idx) => {
            return (
              <GrowthRecordItem
                key={r.id}
                record={r}
                prev={records[idx + 1]}
                onEdit={onEdit}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
