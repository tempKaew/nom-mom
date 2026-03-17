import type { MilkLog } from "@/types/app";

interface MilkLogsListProps {
  logs: MilkLog[];
  loading: boolean;
  maxItems?: number;
}

export function MilkLogsList({
  logs,
  loading,
  maxItems = 5,
}: MilkLogsListProps) {
  if (loading) return <p className="text-gray-500 text-sm">โหลด…</p>;
  if (logs.length === 0) return <p className="text-gray-500 text-sm">ยังไม่มีรายการนม</p>;

  return (
    <ul className="space-y-1.5">
      {logs.slice(0, maxItems).map((log) => (
        <li
          key={log.id}
          className="text-sm text-gray-800 flex flex-wrap gap-x-2 gap-y-0"
        >
          <span className="capitalize">{log.type}</span>
          {log.amount_ml != null && <span>{log.amount_ml} ml</span>}
          {log.duration_minutes != null && (
            <span>{log.duration_minutes} นาที</span>
          )}
          <span className="text-gray-500">
            {new Date(log.logged_at).toLocaleString("th-TH")}
          </span>
        </li>
      ))}
    </ul>
  );
}
