import type { CaseStatus } from "@prisma/client";

const statusMap: Record<CaseStatus, { label: string; className: string }> = {
  PENDING: {
    label: "受付待ち",
    className: "bg-yellow-100 text-yellow-800",
  },
  ASSIGNED: {
    label: "担当者決定",
    className: "bg-blue-100 text-blue-800",
  },
  IN_PROGRESS: {
    label: "対応中",
    className: "bg-purple-100 text-purple-800",
  },
  COMPLETED: {
    label: "完了",
    className: "bg-green-100 text-green-800",
  },
  CANCELLED: {
    label: "キャンセル",
    className: "bg-gray-100 text-gray-600",
  },
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { label, className } = statusMap[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
