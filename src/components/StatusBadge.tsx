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
          className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-[#EBF7F0] text-[#1E7E45] border border-[#C3E8D0] ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm'
          }`}
        >
          <CheckCircle2 className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Đã duyệt
        </span>
      );

    case 'DRAFT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-[#E5EFFB] text-[#426F9F] border border-[#A9C8EC] ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm'
          }`}
        >
          <Clock className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Bản nháp (Chờ duyệt)
        </span>
      );

    case 'NEEDS_REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-[#FEF5E7] text-[#B76E00] border border-[#FAD8A5] ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm'
          }`}
        >
          <AlertCircle className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Cần xem lại
        </span>
      );

    case 'NOT_GENERATED':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-[#F3F7FC] text-[#718096] border border-[#E2EAF3] ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm'
          }`}
        >
          <CircleDashed className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          Chưa tạo
        </span>
      );
  }
};
