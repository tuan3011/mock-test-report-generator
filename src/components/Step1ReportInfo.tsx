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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Card */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-6 rounded-2xl border border-indigo-100 flex items-start gap-4">
        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Bước 1: Thông tin báo cáo & Lớp học
          </h2>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Nhập các thông tin cơ bản về lớp, giáo viên và kỹ năng phụ trách. Dữ liệu này sẽ tự động điền vào tiêu đề và phần thông tin mở đầu của tệp Word mẫu chính thức.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tên lớp */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Tên lớp: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.className}
              onChange={(e) => onChange({ className: e.target.value })}
              placeholder="Ví dụ: KIDS-05, IELTS-B2, STARTERS-01..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              required
            />
            <p className="mt-1.5 text-xs text-slate-500">Mã hoặc tên định danh của lớp học</p>
          </div>

          {/* Giáo viên phụ trách */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Giáo viên phụ trách: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.teacherName}
              onChange={(e) => onChange({ teacherName: e.target.value })}
              placeholder="Ví dụ: Nguyễn Thị Lan, Thầy Tuấn..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              required
            />
            <p className="mt-1.5 text-xs text-slate-500">Họ và tên giáo viên soạn báo cáo</p>
          </div>

          {/* Kỹ năng phụ trách */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Kỹ năng phụ trách: <span className="text-red-500">*</span>
            </label>
            <select
              value={metadata.responsibleSkill}
              onChange={(e) => onChange({ responsibleSkill: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              {RESPONSIBLE_SKILL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">Kỹ năng bạn trực tiếp giảng dạy và chấm Mock Test</p>
          </div>

          {/* Tháng báo cáo */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Tháng báo cáo:
            </label>
            <input
              type="text"
              value={metadata.reportMonth}
              onChange={(e) => onChange({ reportMonth: e.target.value })}
              placeholder="Ví dụ: 11/2026, 11..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <p className="mt-1.5 text-xs text-slate-500">Hiển thị ở tiêu đề "BÁO CÁO SAU MOCK TEST THÁNG ..."</p>
          </div>
        </div>

        {/* Input kỹ năng khác nếu chọn 'Other' */}
        {isOtherSkill && (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 animate-in fade-in duration-200">
            <label className="block text-sm font-semibold text-amber-900">
              Nhập tên kỹ năng phụ trách khác: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.otherSkill || ''}
              onChange={(e) => onChange({ otherSkill: e.target.value })}
              placeholder="Ví dụ: Listening & Speaking, Giao tiếp nâng cao..."
              className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              required
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Thông tin được lưu tự động trong suốt phiên làm việc</span>
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={!isFormValid}
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition shadow-xs ${
              isFormValid
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Tiếp tục: Thêm học viên</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
