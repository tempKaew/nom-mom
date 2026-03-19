"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainIcon, InfoIcon } from "@/components/icons";
import { DEV_GROUPS, HOW_TO_MAP } from "./development.data";
import { DevelopmentChecklistItem } from "./DevelopmentChecklistItem";
import { DevelopmentCheckSheet } from "./DevelopmentCheckSheet";
import { DevelopmentHowToSheet } from "./DevelopmentHowToSheet";
import type { CheckedMap, DevItem, HowToTarget, PendingTarget } from "./development.types";
import { storageKey, toLocalDatetimeValue } from "./development.utils";

type Props = {
  ageMonths: number | null;
  babyId?: string | null;
};

export function DevelopmentSection({ ageMonths, babyId }: Props) {
  const [checkedMap, setCheckedMap] = useState<CheckedMap>({});
  const [pendingTarget, setPendingTarget] = useState<PendingTarget>(null);
  const [howToTarget, setHowToTarget] = useState<HowToTarget>(null);
  const [pendingAt, setPendingAt] = useState(() => toLocalDatetimeValue(new Date()));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(babyId));
      setCheckedMap(raw ? (JSON.parse(raw) as CheckedMap) : {});
    } catch {
      setCheckedMap({});
    }
  }, [babyId]);

  const persist = (next: CheckedMap) => {
    setCheckedMap(next);
    try {
      localStorage.setItem(storageKey(babyId), JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const completedCount = Object.keys(checkedMap).length;
  const totalCount = DEV_GROUPS.reduce((sum, g) => sum + g.items.length, 0);
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const activeGroupCount = useMemo(() => {
    if (ageMonths == null) return 0;
    return DEV_GROUPS.filter((g) => ageMonths >= g.monthStart && ageMonths <= g.monthEnd).length;
  }, [ageMonths]);

  const handleToggle = (item: DevItem) => {
    if (checkedMap[item.id]) {
      const next = { ...checkedMap };
      delete next[item.id];
      persist(next);
      return;
    }
    setPendingTarget(item);
    setPendingAt(toLocalDatetimeValue(new Date()));
  };

  const confirmCheck = () => {
    if (!pendingTarget) return;
    const next = { ...checkedMap, [pendingTarget.id]: new Date(pendingAt).toISOString() };
    persist(next);
    setPendingTarget(null);
  };

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BrainIcon size={16} className="text-purple-500" />
          <h2 className="text-sm font-bold text-gray-800">พัฒนาการตามช่วงเดือน</h2>
        </div>
        <div className="rounded-xl bg-purple-50/70 px-3 py-2.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <p className="text-purple-700 font-semibold">เช็กแล้ว {completedCount}/{totalCount} รายการ</p>
            <p className="text-purple-600">{progress}%</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-purple-100 overflow-hidden">
            <div className="h-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-purple-600">
            {activeGroupCount > 0
              ? "มีช่วงเดือนที่ตรงกับอายุปัจจุบันของลูก"
              : "เลือกเช็กได้ทุกช่วงเดือนตามพัฒนาการที่สังเกตได้"}
          </p>
        </div>

        <div className="space-y-3">
          {DEV_GROUPS.map((group) => {
            const isActiveAge =
              ageMonths != null &&
              ageMonths >= group.monthStart &&
              ageMonths <= group.monthEnd;
            const doneInGroup = group.items.filter((item) => !!checkedMap[item.id]).length;
            return (
              <div key={group.label} className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className={`px-3 py-2 flex items-center justify-between ${isActiveAge ? "bg-purple-100/70" : "bg-gray-50"}`}>
                  <p className={`text-xs font-bold ${isActiveAge ? "text-purple-700" : "text-gray-600"}`}>
                    {group.label}
                  </p>
                  <span className="text-[11px] text-gray-500">{doneInGroup}/{group.items.length}</span>
                </div>
                <div className="p-2.5 space-y-2">
                  {group.items.map((item) => (
                    <DevelopmentChecklistItem
                      key={item.id}
                      item={item}
                      checkedAt={checkedMap[item.id]}
                      onToggle={handleToggle}
                      onHowTo={setHowToTarget}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <InfoIcon size={16} className="text-emerald-500" />
          <h3 className="text-sm font-bold text-gray-800">หมายเหตุการใช้งาน</h3>
        </div>
        <ul className="space-y-1.5">
          <li className="text-xs text-gray-600 leading-relaxed">• เมื่อกดเช็ก จะให้ระบุวันและเวลาเพื่อเก็บเป็นประวัติ</li>
          <li className="text-xs text-gray-600 leading-relaxed">• สามารถกดซ้ำเพื่อยกเลิกเช็กได้ หากบันทึกผิด</li>
          <li className="text-xs text-gray-600 leading-relaxed">• ข้อมูล checklist ตอนนี้บันทึกในเครื่องแยกตามเด็กแต่ละคน</li>
        </ul>
      </section>

      <DevelopmentCheckSheet
        target={pendingTarget}
        pendingAt={pendingAt}
        onChangePendingAt={setPendingAt}
        onClose={() => setPendingTarget(null)}
        onConfirm={confirmCheck}
      />

      <DevelopmentHowToSheet
        target={howToTarget}
        tips={
          howToTarget
            ? (HOW_TO_MAP[howToTarget.id] ?? [
                "พูดคุย เล่น และทำกิจกรรมนี้บ่อยๆ แบบสั้นแต่สม่ำเสมอ",
                "จัดสภาพแวดล้อมที่ปลอดภัยและเหมาะกับวัย",
                "ชมเชยทุกครั้งที่ลูกพยายาม เพื่อสร้างแรงจูงใจ",
              ])
            : []
        }
        onClose={() => setHowToTarget(null)}
      />
    </div>
  );
}

