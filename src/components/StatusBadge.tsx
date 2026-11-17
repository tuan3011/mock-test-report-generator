import React from 'react';
import type { ApprovalStatus } from '../types/report';
import { CheckCircle2, AlertCircle, Clock, CircleDashed } from 'lucide-react';

interface StatusBadgeProps {
  status: ApprovalStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'APPROVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
          }`}
        >
          <CheckCircle2 className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Đã duyệt
        </span>
      );

    case 'DRAFT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-300 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
          }`}
        >
          <Clock className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Bản nháp (Chờ duyệt)
        </span>
      );

    case 'NEEDS_REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-orange-100 text-orange-800 border border-orange-300 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
          }`}
        >
          <AlertCircle className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Cần xem lại (Đã chỉnh sửa)
        </span>
      );

    case 'NOT_GENERATED':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-300 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm'
          }`}
        >
          <CircleDashed className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Chưa tạo
        </span>
      );
  }
};
