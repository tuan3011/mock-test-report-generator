import React, { useState } from 'react';
import type {
  RecommendationsState,
  ReportMetadata,
} from '../types/report';
import { RECOMMENDATION_GROUPS } from '../constants/evaluationData';
import { StatusBadge } from './StatusBadge';
import { requestRecommendations } from '../utils/apiClient';
import {
  Lightbulb,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

interface Step4RecommendationsProps {
  state: RecommendationsState;
  metadata: ReportMetadata;
  onChange: (updates: Partial<RecommendationsState>) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const Step4Recommendations: React.FC<Step4RecommendationsProps> = ({
  state,
  metadata,
  onChange,
  onPrev,
  onNext,
}) => {
  const [errorMsg, setErrorMsg] = useState('');

  const toggleRecommendation = (rec: string) => {
    const exists = state.selectedRecommendations.includes(rec);
    const newSelected = exists
      ? state.selectedRecommendations.filter((r) => r !== rec)
      : [...state.selectedRecommendations, rec];

    const newStatus = state.status === 'APPROVED' ? 'NEEDS_REVIEW' : state.status;
    onChange({ selectedRecommendations: newSelected, status: newStatus });
  };

  const handleCustomDetailsChange = (text: string) => {
    const newStatus = state.status === 'APPROVED' ? 'NEEDS_REVIEW' : state.status;
    onChange({ customDetails: text, status: newStatus });
  };

  const handleRecommendationsChange = (text: string) => {
    const newStatus = state.status === 'APPROVED' ? 'NEEDS_REVIEW' : state.status;
    onChange({ recommendations: text, status: newStatus });
  };

  const handleApprove = () => {
    if (!state.recommendations.trim()) return;
    onChange({ status: 'APPROVED' });
  };

  const handleGenerate = async () => {
    setErrorMsg('');

    if (state.selectedRecommendations.length === 0 && !state.customDetails.trim()) {
      setErrorMsg('Vui lòng tích chọn ít nhất một đề xuất hoặc nhập đề xuất bổ sung của bạn.');
      return;
    }

    onChange({ isGenerating: true });

    try {
      const effectiveSkill =
        metadata.responsibleSkill === 'Other'
          ? metadata.otherSkill || 'Chuyên môn'
          : metadata.responsibleSkill;

      const res = await requestRecommendations({
        className: metadata.className,
        teacherName: metadata.teacherName,
        responsibleSkill: effectiveSkill,
        selectedRecommendations: state.selectedRecommendations,
        customDetails: state.customDetails,
      });

      onChange({
        aiRecommendations: res.recommendations,
        recommendations: res.recommendations,
        status: 'DRAFT',
        isGenerating: false,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo đề xuất. Vui lòng thử lại.');
      onChange({ isGenerating: false });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent p-6 rounded-2xl border border-amber-100 flex items-start gap-4">
        <div className="p-3 bg-amber-600 text-white rounded-xl shadow-sm shrink-0">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Bước 4: Đề xuất của giáo viên (Mục 3 của Báo cáo)
          </h2>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Chọn các giải pháp, phương hướng hỗ trợ tiếp theo dành cho học viên, lớp học và sự phối hợp từ phía trung tâm. Gemini AI sẽ tổng hợp thành văn bản đề xuất sư phạm rõ ràng, thực tiễn cho Mục 3.
          </p>
        </div>
      </div>

      {/* Main Checklist Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-6">
          {RECOMMENDATION_GROUPS.map((group) => (
            <div key={group.id} className="space-y-3">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider pb-1 border-b border-slate-100">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.items.map((item) => {
                  const isChecked = state.selectedRecommendations.includes(item);
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
                        onChange={() => toggleRecommendation(item)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-xs text-slate-800 leading-snug">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom recommendations textarea */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              E. Đề xuất khác của giáo viên (Tùy chọn):
            </label>
            <textarea
              rows={3}
              value={state.customDetails}
              onChange={(e) => handleCustomDetailsChange(e.target.value)}
              placeholder="Nhập thêm đề xuất riêng biệt (ví dụ: đề nghị đổi giáo trình bổ trợ, đề nghị trung tâm sắp xếp phụ đạo 1 buổi kèm riêng...)"
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
        <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50/40 via-slate-50 to-white rounded-2xl border border-amber-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Nội dung đề xuất Mục 3 (Sau khi AI tổng hợp)
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Được phân nhóm logic theo từng đối tượng: học viên, lớp học và trung tâm
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
                    <span>Tạo đề xuất AI</span>
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
            value={state.recommendations}
            onChange={(e) => handleRecommendationsChange(e.target.value)}
            placeholder="Nhấn nút 'Tạo đề xuất AI' để tạo đoạn đề xuất hoàn chỉnh hoặc trực tiếp gõ vào đây..."
            className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-amber-100/60">
            <div className="text-xs text-slate-500">
              {state.status === 'APPROVED' ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Mục 3 đã được duyệt và sẵn sàng xuất vào tệp Word.
                </span>
              ) : state.status === 'NEEDS_REVIEW' ? (
                <span className="text-orange-700 font-medium flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Nội dung vừa chỉnh sửa, vui lòng nhấn "Duyệt Mục 3" để xác nhận.
                </span>
              ) : state.status === 'DRAFT' ? (
                <span className="text-amber-700 font-medium">
                  Bản nháp đã tạo. Hãy xem lại và nhấn "Duyệt Mục 3".
                </span>
              ) : (
                <span>Vui lòng tạo hoặc nhập nội dung trước khi duyệt.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleApprove}
              disabled={!state.recommendations.trim() || state.status === 'APPROVED'}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl transition ${
                state.status === 'APPROVED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                  : state.recommendations.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{state.status === 'APPROVED' ? 'Đã duyệt ✓' : 'Duyệt nội dung Mục 3'}</span>
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
            <span>Quay lại: Hoạt động hỗ trợ (Mục 2)</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition"
          >
            <span>Tiếp tục: Xem trước & Xuất Word</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
