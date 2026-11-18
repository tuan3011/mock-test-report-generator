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
  Zap,
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

  const handleQuickTemplate = () => {
    setErrorMsg('');
    if (state.selectedActivities.length === 0 && !state.customDetails.trim()) {
      setErrorMsg('Vui lòng tích chọn ít nhất một hoạt động hỗ trợ hoặc ghi chú hành động cụ thể.');
      return;
    }

    const sentences: string[] = [];
    const direct = state.selectedActivities.filter((a) =>
      a.includes('riêng') || a.includes('Nói chuyện') || a.includes('Nhắn tin') || a.includes('phụ huynh')
    );
    const classroom = state.selectedActivities.filter((a) =>
      a.includes('trên lớp') || a.includes('Động viên') || a.includes('tương tác') || a.includes('thái độ')
    );
    const academic = state.selectedActivities.filter((a) =>
      a.includes('bài tập') || a.includes('kiến thức') || a.includes('kết quả')
    );
    const statusItems = state.selectedActivities.filter((a) =>
      a.includes('chuyển biến') || a.includes('thay đổi') || a.includes('hợp tác') || a.includes('chưa kịp') || a.includes('tiếp tục')
    );

    sentences.push(
      `Trong quá trình giảng dạy và theo sát lớp ${metadata.className || ''}, giáo viên đã chủ động triển khai các biện pháp hỗ trợ phù hợp với từng học viên.`
    );

    if (direct.length > 0 || classroom.length > 0) {
      const actions = [...direct, ...classroom].map((a) => a.replace(/\.$/, '').toLowerCase()).join(', ');
      sentences.push(`Cụ thể, giáo viên đã thực hiện ${actions}.`);
    }

    if (academic.length > 0) {
      const acadActions = academic.map((a) => a.replace(/\.$/, '').toLowerCase()).join(', ');
      sentences.push(`Về chuyên môn học tập, giáo viên đã chú trọng ${acadActions}.`);
    }

    if (state.customDetails.trim()) {
      sentences.push(`Đối với các trường hợp cụ thể: ${state.customDetails.trim()}`);
    }

    if (statusItems.length > 0) {
      const statusText = statusItems.map((s) => s.replace(/\.$/, '').toLowerCase()).join('; ');
      sentences.push(`Ghi nhận tình hình theo sát: ${statusText}.`);
    }

    const text = sentences.join(' ');
    onChange({
      aiSummary: text,
      summary: text,
      status: 'DRAFT',
      isGenerating: false,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Intro Card */}
      <div className="bg-[#E5EFFB]/60 p-4 sm:p-5 rounded-xl border border-[#D5E5F8] flex items-start gap-3.5">
        <div className="p-2.5 bg-[#D5E5F8] text-[#426F9F] rounded-lg shadow-xs shrink-0">
          <HeartHandshake className="w-5 h-5 text-[#426F9F]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#334155]">
            Bước 3: Hoạt động hỗ trợ của giáo viên (Mục 2 của Báo cáo)
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#718096] leading-relaxed">
            Chọn các hoạt động và biện pháp giáo viên ĐÃ THỰC HIỆN để theo sát, hỗ trợ và giải quyết vấn đề của lớp/học viên. Gemini AI sẽ tổng hợp thành đoạn văn chuyên nghiệp, trung thực để điền vào Mục 2 của báo cáo.
          </p>
        </div>
      </div>

      {/* Main Checklist Container */}
      <div className="bg-white rounded-xl border border-[#E2EAF3] p-5 sm:p-7 shadow-xs space-y-5">
        <div className="space-y-5">
          {SUPPORT_ACTIVITY_GROUPS.map((group) => (
            <div key={group.id} className="space-y-2.5">
              <h3 className="text-xs font-semibold text-[#426F9F] uppercase tracking-wider pb-1.5 border-b border-[#E2EAF3]">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item) => {
                  const isChecked = state.selectedActivities.includes(item);
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
                        onChange={() => toggleActivity(item)}
                        className="mt-0.5 rounded border-[#D5E5F8] text-[#6F9DD0] focus:ring-[#D5E5F8] h-4 w-4"
                      />
                      <span className="text-xs text-[#334155] leading-snug">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom details textarea */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider">
              E. Các hoạt động hỗ trợ khác / Trường hợp cụ thể (Tùy chọn):
            </label>
            <textarea
              rows={3}
              value={state.customDetails}
              onChange={(e) => handleCustomDetailsChange(e.target.value)}
              placeholder="Nhập các trường hợp đặc biệt (ví dụ: đã gọi điện cho phụ huynh bạn Nam ngày 10/11, giao đề rút gọn 10 câu cho bạn Lan...)"
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
                  Nội dung báo cáo Mục 2 (Sau khi AI tổng hợp)
                </h4>
              </div>
              <p className="text-xs text-[#718096] mt-0.5">
                Được tổng hợp từ các mục đã chọn, mô tả trung thực cách giáo viên theo sát lớp
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
              <StatusBadge status={state.status} size="sm" />

              <button
                type="button"
                onClick={handleQuickTemplate}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#E5EFFB] text-[#426F9F] border border-[#D5E5F8] text-xs font-medium rounded-lg transition shadow-xs"
                title="Tạo nhanh đoạn báo cáo từ các mục đã chọn"
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
            rows={4}
            value={state.summary}
            onChange={(e) => handleSummaryChange(e.target.value)}
            placeholder="Nhấn nút 'Tạo nội dung AI' để tự động tạo đoạn văn hoàn chỉnh hoặc trực tiếp gõ vào đây..."
            className="w-full p-3 bg-white border border-[#E2EAF3] rounded-lg text-sm text-[#334155] placeholder:text-slate-400 focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] transition leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-[#E2EAF3]">
            <div className="text-[11px] text-[#718096]">
              {state.status === 'APPROVED' ? (
                <span className="text-[#1E7E45] font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mục 2 đã được duyệt và sẵn sàng xuất vào tệp Word.
                </span>
              ) : state.status === 'NEEDS_REVIEW' ? (
                <span className="text-[#B76E00] font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Nội dung vừa chỉnh sửa, vui lòng nhấn "Duyệt Mục 2" để xác nhận.
                </span>
              ) : state.status === 'DRAFT' ? (
                <span className="text-[#426F9F] font-medium">
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition shadow-xs ${
                state.status === 'APPROVED'
                  ? 'bg-[#EBF7F0] text-[#1E7E45] border border-[#C3E8D0] cursor-default'
                  : state.summary.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-400 border border-[#E2EAF3] cursor-not-allowed shadow-none'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{state.status === 'APPROVED' ? 'Đã duyệt ✓' : 'Duyệt nội dung Mục 2'}</span>
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
            <span>Quay lại: Học viên</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#6F9DD0] hover:bg-[#5B8BBB] active:bg-[#4E7DAE] rounded-lg shadow-xs transition"
          >
            <span>Tiếp tục: Đề xuất giải pháp (Mục 3)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
