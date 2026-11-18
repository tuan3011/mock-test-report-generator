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
  Zap,
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

  const handleQuickTemplate = () => {
    setErrorMsg('');
    if (state.selectedRecommendations.length === 0 && !state.customDetails.trim()) {
      setErrorMsg('Vui lòng tích chọn ít nhất một đề xuất hoặc nhập đề xuất bổ sung của bạn.');
      return;
    }

    const sentences: string[] = [];
    const studentRecs = state.selectedRecommendations.filter((r) =>
      (r.includes('học viên') || r.includes('phụ huynh') || r.includes('thái độ') || r.includes('mục tiêu')) &&
      !r.includes('trung tâm')
    );
    const academicRecs = state.selectedRecommendations.filter((r) =>
      r.includes('bài tập') || r.includes('ôn tập') || r.includes('thực hành') || r.includes('kỹ năng') || r.includes('ngoài giờ')
    );
    const classRecs = state.selectedRecommendations.filter((r) =>
      r.includes('tương tác') || r.includes('phát biểu') || r.includes('phương pháp') || r.includes('cả lớp')
    );
    const centerRecs = state.selectedRecommendations.filter((r) =>
      r.includes('trung tâm') || r.includes('lộ trình')
    );

    sentences.push(
      `Để nâng cao chất lượng học tập cho lớp ${metadata.className || ''} sau đợt Mock Test, giáo viên xin đề xuất một số giải pháp trọng tâm:`
    );

    if (studentRecs.length > 0) {
      const recText = studentRecs.map((r) => r.replace(/\.$/, '').toLowerCase()).join(', ');
      sentences.push(`Đối với các học viên cần quan tâm, kiến nghị ${recText}.`);
    }

    if (academicRecs.length > 0 || classRecs.length > 0) {
      const acadText = [...academicRecs, ...classRecs].map((r) => r.replace(/\.$/, '').toLowerCase()).join('; ');
      sentences.push(`Về công tác chuyên môn trên lớp, giáo viên sẽ tập trung ${acadText}.`);
    }

    if (centerRecs.length > 0) {
      const cenText = centerRecs.map((r) => r.replace(/\.$/, '').toLowerCase()).join(', ');
      sentences.push(`Đồng thời, mong muốn phía trung tâm hỗ trợ ${cenText}.`);
    }

    if (state.customDetails.trim()) {
      sentences.push(`Đề xuất bổ sung từ giáo viên: ${state.customDetails.trim()}`);
    }

    const text = sentences.join(' ');
    onChange({
      aiRecommendations: text,
      recommendations: text,
      status: 'DRAFT',
      isGenerating: false,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Intro Card */}
      <div className="bg-[#E5EFFB]/60 p-4 sm:p-5 rounded-xl border border-[#D5E5F8] flex items-start gap-3.5">
        <div className="p-2.5 bg-[#D5E5F8] text-[#426F9F] rounded-lg shadow-xs shrink-0">
          <Lightbulb className="w-5 h-5 text-[#426F9F]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#334155]">
            Bước 4: Đề xuất của giáo viên (Mục 3 của Báo cáo)
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#718096] leading-relaxed">
            Chọn các giải pháp, phương hướng hỗ trợ tiếp theo dành cho học viên, lớp học và sự phối hợp từ phía trung tâm. Gemini AI sẽ tổng hợp thành văn bản đề xuất sư phạm rõ ràng, thực tiễn cho Mục 3.
          </p>
        </div>
      </div>

      {/* Main Checklist Container */}
      <div className="bg-white rounded-xl border border-[#E2EAF3] p-5 sm:p-7 shadow-xs space-y-5">
        <div className="space-y-5">
          {RECOMMENDATION_GROUPS.map((group) => (
            <div key={group.id} className="space-y-2.5">
              <h3 className="text-xs font-semibold text-[#426F9F] uppercase tracking-wider pb-1.5 border-b border-[#E2EAF3]">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item) => {
                  const isChecked = state.selectedRecommendations.includes(item);
                  return (
                    <label
                      key={item}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition ${
                        isChecked
                          ? 'border-[#6F9DD0] bg-[#E5EFFB]/60 shadow-xs'
                          : 'border-[#E2EAF3] bg-white hover:bg-[#F8FAFD] hover:border-[#A9C8EC]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRecommendation(item)}
                        className="mt-0.5 rounded border-[#D5E5F8] text-[#6F9DD0] focus:ring-[#D5E5F8] h-4 w-4"
                      />
                      <span className="text-xs text-[#334155] leading-snug">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom recommendations textarea */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider">
              E. Đề xuất khác của giáo viên (Tùy chọn):
            </label>
            <textarea
              rows={3}
              value={state.customDetails}
              onChange={(e) => handleCustomDetailsChange(e.target.value)}
              placeholder="Nhập thêm đề xuất riêng biệt (ví dụ: đề nghị đổi giáo trình bổ trợ, đề nghị trung tâm sắp xếp phụ đạo 1 buổi kèm riêng...)"
              className="w-full p-3 bg-[#F8FAFD] border border-[#E2EAF3] rounded-lg text-xs text-[#334155] placeholder:text-slate-400 focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] focus:bg-white transition leading-relaxed"
            />
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* AI Generation Box */}
        <div className="p-4 sm:p-5 bg-[#F8FAFD] rounded-xl border border-[#D5E5F8] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#426F9F]" />
                <h4 className="text-xs sm:text-sm font-semibold text-[#334155]">
                  Nội dung đề xuất Mục 3 (Sau khi AI tổng hợp)
                </h4>
              </div>
              <p className="text-xs text-[#718096] mt-0.5">
                Được phân nhóm logic theo từng đối tượng: học viên, lớp học và trung tâm
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
              <StatusBadge status={state.status} size="sm" />

              <button
                type="button"
                onClick={handleQuickTemplate}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#E5EFFB] text-[#426F9F] border border-[#D5E5F8] text-xs font-medium rounded-lg transition shadow-xs"
                title="Tạo nhanh đoạn đề xuất từ các mục đã chọn"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Mẫu nhanh</span>
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={state.isGenerating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#6F9DD0] hover:bg-[#5B8BBB] active:bg-[#4E7DAE] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium rounded-lg shadow-xs transition"
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
            rows={4}
            value={state.recommendations}
            onChange={(e) => handleRecommendationsChange(e.target.value)}
            placeholder="Nhấn nút 'Tạo đề xuất AI' để tạo đoạn đề xuất hoàn chỉnh hoặc trực tiếp gõ vào đây..."
            className="w-full p-3 bg-white border border-[#E2EAF3] rounded-lg text-sm text-[#334155] placeholder:text-slate-400 focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] transition leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-[#E2EAF3]">
            <div className="text-[11px] text-[#718096]">
              {state.status === 'APPROVED' ? (
                <span className="text-[#1E7E45] font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mục 3 đã được duyệt và sẵn sàng xuất vào tệp Word.
                </span>
              ) : state.status === 'NEEDS_REVIEW' ? (
                <span className="text-[#B76E00] font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Nội dung vừa chỉnh sửa, vui lòng nhấn "Duyệt Mục 3" để xác nhận.
                </span>
              ) : state.status === 'DRAFT' ? (
                <span className="text-[#426F9F] font-medium">
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition shadow-xs ${
                state.status === 'APPROVED'
                  ? 'bg-[#EBF7F0] text-[#1E7E45] border border-[#C3E8D0] cursor-default'
                  : state.recommendations.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-400 border border-[#E2EAF3] cursor-not-allowed shadow-none'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{state.status === 'APPROVED' ? 'Đã duyệt ✓' : 'Duyệt nội dung Mục 3'}</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E2EAF3]">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-[#334155] bg-white border border-[#E2EAF3] rounded-lg hover:bg-[#F3F7FC] hover:border-[#A9C8EC] transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại: Hoạt động hỗ trợ (Mục 2)</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#6F9DD0] hover:bg-[#5B8BBB] active:bg-[#4E7DAE] rounded-lg shadow-xs transition"
          >
            <span>Tiếp tục: Xem trước & Xuất Word</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
