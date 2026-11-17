import React, { useState } from 'react';
import type {
  SupportActivitiesState,
  ReportMetadata,
} from '../types/report';
import { SUPPORT_ACTIVITY_GROUPS } from '../constants/evaluationData';
import { StatusBadge } from './StatusBadge';
import { requestSupportSummary } from '../utils/apiClient';
import {
  HeartHandshake,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

interface Step3SupportActivitiesProps {
  state: SupportActivitiesState;
  metadata: ReportMetadata;
  onChange: (updates: Partial<SupportActivitiesState>) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const Step3SupportActivities: React.FC<Step3SupportActivitiesProps> = ({
  state,
  metadata,
  onChange,
  onPrev,
  onNext,
}) => {
  const [errorMsg, setErrorMsg] = useState('');

  const toggleActivity = (activity: string) => {
    const exists = state.selectedActivities.includes(activity);
    const newSelected = exists
      ? state.selectedActivities.filter((a) => a !== activity)
      : [...state.selectedActivities, activity];

    const newStatus = state.status === 'APPROVED' ? 'NEEDS_REVIEW' : state.status;
    onChange({ selectedActivities: newSelected, status: newStatus });
  };

  const handleCustomDetailsChange = (text: string) => {
    const newStatus = state.status === 'APPROVED' ? 'NEEDS_REVIEW' : state.status;
    onChange({ customDetails: text, status: newStatus });
  };

  const handleSummaryChange = (text: string) => {
    const newStatus = state.status === 'APPROVED' ? 'NEEDS_REVIEW' : state.status;
    onChange({ summary: text, status: newStatus });
  };

  const handleApprove = () => {
    if (!state.summary.trim()) return;
    onChange({ status: 'APPROVED' });
  };

  const handleGenerate = async () => {
    setErrorMsg('');

    if (state.selectedActivities.length === 0 && !state.customDetails.trim()) {
      setErrorMsg('Vui lòng tích chọn ít nhất một hoạt động hỗ trợ hoặc ghi chú hành động cụ thể.');
      return;
    }

    onChange({ isGenerating: true });

    try {
      const effectiveSkill =
        metadata.responsibleSkill === 'Other'
          ? metadata.otherSkill || 'Chuyên môn'
          : metadata.responsibleSkill;

      const res = await requestSupportSummary({
        className: metadata.className,
        teacherName: metadata.teacherName,
        responsibleSkill: effectiveSkill,
        selectedActivities: state.selectedActivities,
        customDetails: state.customDetails,
      });

      onChange({
        aiSummary: res.summary,
        summary: res.summary,
        status: 'DRAFT',
        isGenerating: false,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo nội dung hỗ trợ. Vui lòng thử lại.');
      onChange({ isGenerating: false });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Card */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
        <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
          <HeartHandshake className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Bước 3: Hoạt động hỗ trợ của giáo viên (Mục 2 của Báo cáo)
          </h2>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Chọn các hoạt động và biện pháp giáo viên ĐÃ THỰC HIỆN để theo sát, hỗ trợ và giải quyết vấn đề của lớp/học viên. Gemini AI sẽ tổng hợp thành đoạn văn chuyên nghiệp, trung thực để điền vào Mục 2 của báo cáo.
          </p>
        </div>
      </div>

      {/* Main Checklist Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-6">
          {SUPPORT_ACTIVITY_GROUPS.map((group) => (
            <div key={group.id} className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider pb-1 border-b border-slate-100">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.items.map((item) => {
                  const isChecked = state.selectedActivities.includes(item);
                  return (
                    <label
                      key={item}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleActivity(item)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-xs text-slate-800 leading-snug">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom details textarea */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              E. Các hoạt động hỗ trợ khác / Trường hợp cụ thể (Tùy chọn):
            </label>
            <textarea
              rows={3}
              value={state.customDetails}
              onChange={(e) => handleCustomDetailsChange(e.target.value)}
              placeholder="Nhập các trường hợp đặc biệt (ví dụ: đã gọi điện cho phụ huynh bạn Nam ngày 10/11, giao đề rút gọn 10 câu cho bạn Lan...)"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition leading-relaxed"
            />
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* AI Generation Box */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-white rounded-2xl border border-indigo-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Nội dung báo cáo Mục 2 (Sau khi AI tổng hợp)
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Được tổng hợp từ các mục đã chọn, mô tả trung thực cách giáo viên theo sát lớp
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <StatusBadge status={state.status} size="sm" />

              <button
                type="button"
                onClick={handleGenerate}
                disabled={state.isGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                {state.isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tổng hợp...</span>
                  </>
                ) : state.status === 'NOT_GENERATED' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo nội dung AI</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tạo lại</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <textarea
            rows={5}
            value={state.summary}
            onChange={(e) => handleSummaryChange(e.target.value)}
            placeholder="Nhấn nút 'Tạo nội dung AI' để tự động tạo đoạn văn hoàn chỉnh hoặc trực tiếp gõ vào đây..."
            className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-indigo-100/60">
            <div className="text-xs text-slate-500">
              {state.status === 'APPROVED' ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Mục 2 đã được duyệt và sẵn sàng xuất vào tệp Word.
                </span>
              ) : state.status === 'NEEDS_REVIEW' ? (
                <span className="text-orange-700 font-medium flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Nội dung vừa chỉnh sửa, vui lòng nhấn "Duyệt Mục 2" để xác nhận.
                </span>
              ) : state.status === 'DRAFT' ? (
                <span className="text-amber-700 font-medium">
                  Bản nháp đã tạo. Hãy xem lại và nhấn "Duyệt Mục 2".
                </span>
              ) : (
                <span>Vui lòng tạo hoặc nhập nội dung trước khi duyệt.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleApprove}
              disabled={!state.summary.trim() || state.status === 'APPROVED'}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl transition ${
                state.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                  : state.summary.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{state.status === 'APPROVED' ? 'Đã duyệt ✓' : 'Duyệt nội dung Mục 2'}</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại: Học viên</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition"
          >
            <span>Tiếp tục: Đề xuất giải pháp (Mục 3)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
