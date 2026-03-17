import type { DiaperLog } from "@/types/app";

interface DiaperLogsListProps {
  logs: DiaperLog[];
  loading: boolean;
  maxItems?: number;
}

export function DiaperLogsList({
  logs,
  loading,
  maxItems = 5,
}: DiaperLogsListProps) {
  if (loading) return <p className="text-gray-500 text-sm">โหลด…</p>;
  if (logs.length === 0)
    return <p className="text-gray-500 text-sm">ยังไม่มีรายการผ้าอ้อม</p>;

  return (
    <ul className="space-y-1.5">
      {logs.slice(0, maxItems).map((log) => (
        <li
          key={log.id}
          className="text-sm text-gray-800 flex flex-wrap gap-x-2"
        >
          <span className="capitalize">{log.type}</span>
          <span className="text-gray-500">
            {new Date(log.logged_at).toLocaleString("th-TH")}
          </span>
        </li>
      ))}
    </ul>
  );
}
