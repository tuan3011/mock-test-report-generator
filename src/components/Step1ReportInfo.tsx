import React from 'react';
import type { ReportMetadata } from '../types/report';
import { RESPONSIBLE_SKILL_OPTIONS } from '../constants/evaluationData';
import { FileSpreadsheet, ArrowRight, Sparkles } from 'lucide-react';

interface Step1ReportInfoProps {
  metadata: ReportMetadata;
  onChange: (updates: Partial<ReportMetadata>) => void;
  onNext: () => void;
}

export const Step1ReportInfo: React.FC<Step1ReportInfoProps> = ({
  metadata,
  onChange,
  onNext,
}) => {
  const isOtherSkill = metadata.responsibleSkill === 'Other';

  const isFormValid =
    metadata.className.trim() !== '' &&
    metadata.teacherName.trim() !== '' &&
    (isOtherSkill ? Boolean(metadata.otherSkill?.trim()) : metadata.responsibleSkill !== '');

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Intro Card */}
      <div className="bg-[#E5EFFB]/60 p-4 sm:p-5 rounded-xl border border-[#D5E5F8] flex items-start gap-3.5">
        <div className="p-2.5 bg-[#D5E5F8] text-[#426F9F] rounded-lg shadow-xs shrink-0">
          <FileSpreadsheet className="w-5 h-5 text-[#426F9F]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#334155]">
            Bước 1: Thông tin báo cáo & Lớp học
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#718096] leading-relaxed">
            Nhập các thông tin cơ bản về lớp, giáo viên và kỹ năng phụ trách. Dữ liệu này sẽ tự động điền vào tiêu đề và phần thông tin mở đầu của tệp Word mẫu chính thức.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl border border-[#E2EAF3] p-5 sm:p-7 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Tên lớp */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Tên lớp: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.className}
              onChange={(e) => onChange({ className: e.target.value })}
              placeholder="Ví dụ: KIDS-05, IELTS-B2, STARTERS-01..."
              className="w-full h-10 px-3.5 bg-white border border-[#E2EAF3] rounded-lg text-sm text-[#334155] placeholder:text-slate-400 focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] transition"
              required
            />
            <p className="mt-1 text-xs text-[#718096]">Mã hoặc tên định danh của lớp học</p>
          </div>

          {/* Giáo viên phụ trách */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Giáo viên phụ trách: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.teacherName}
              onChange={(e) => onChange({ teacherName: e.target.value })}
              placeholder="Ví dụ: Nguyễn Thị Lan, Thầy Tuấn..."
              className="w-full h-10 px-3.5 bg-white border border-[#E2EAF3] rounded-lg text-sm text-[#334155] placeholder:text-slate-400 focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] transition"
              required
            />
            <p className="mt-1 text-xs text-[#718096]">Họ và tên giáo viên soạn báo cáo</p>
          </div>

          {/* Kỹ năng phụ trách */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Kỹ năng phụ trách: <span className="text-rose-500">*</span>
            </label>
            <select
              value={metadata.responsibleSkill}
              onChange={(e) => onChange({ responsibleSkill: e.target.value })}
              className="w-full h-10 px-3.5 bg-white border border-[#E2EAF3] rounded-lg text-sm text-[#334155] focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] transition"
            >
              {RESPONSIBLE_SKILL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[#718096]">Kỹ năng bạn trực tiếp giảng dạy và chấm Mock Test</p>
          </div>

          {/* Tháng báo cáo */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Tháng báo cáo:
            </label>
            <input
              type="text"
              value={metadata.reportMonth}
              onChange={(e) => onChange({ reportMonth: e.target.value })}
              placeholder="Ví dụ: 11/2026, 11..."
              className="w-full h-10 px-3.5 bg-white border border-[#E2EAF3] rounded-lg text-sm text-[#334155] placeholder:text-slate-400 focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] transition"
            />
            <p className="mt-1 text-xs text-[#718096]">Hiển thị ở tiêu đề "BÁO CÁO SAU MOCK TEST THÁNG ..."</p>
          </div>
        </div>

        {/* Input kỹ năng khác nếu chọn 'Other' */}
        {isOtherSkill && (
          <div className="p-3.5 bg-[#FEF5E7] border border-[#FAD8A5] rounded-lg space-y-1.5 animate-in fade-in duration-150">
            <label className="block text-xs font-semibold text-[#B76E00]">
              Nhập tên kỹ năng phụ trách khác: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.otherSkill || ''}
              onChange={(e) => onChange({ otherSkill: e.target.value })}
              placeholder="Ví dụ: Listening & Speaking, Giao tiếp nâng cao..."
              className="w-full h-10 px-3.5 bg-white border border-[#FAD8A5] rounded-lg text-[#334155] text-sm focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] transition"
              required
            />
          </div>
        )}

        <div className="pt-4 border-t border-[#E2EAF3] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#718096]">
            <Sparkles className="w-3.5 h-3.5 text-[#426F9F]" />
            <span>Thông tin được lưu tự động trong suốt phiên làm việc</span>
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={!isFormValid}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition shadow-xs ${
              isFormValid
                ? 'bg-[#6F9DD0] text-white hover:bg-[#5B8BBB] active:bg-[#4E7DAE]'
                : 'bg-slate-100 text-slate-400 border border-[#E2EAF3] cursor-not-allowed shadow-none'
            }`}
          >
            <span>Tiếp tục: Thêm học viên</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
