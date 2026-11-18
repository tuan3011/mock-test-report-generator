import React, { useState } from 'react';
import type {
  StudentData,
  PerformanceLevel,
  ReportMetadata,
} from '../types/report';
import {
  EVALUATION_GROUPS,
  PERFORMANCE_LEVELS,
  PERFORMANCE_LEVEL_LIST,
} from '../constants/evaluationData';
import { StatusBadge } from './StatusBadge';
import { ConfirmModal } from './ConfirmModal';
import { requestStudentComment } from '../utils/apiClient';
import { generateSmartQuickComment } from '../utils/commentTemplateGenerator';
import {
  UserPlus,
  Trash2,
  Sparkles,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Zap,
} from 'lucide-react';

interface Step2StudentsProps {
  students: StudentData[];
  metadata: ReportMetadata;
  onUpdateStudents: (updater: (prev: StudentData[]) => StudentData[]) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const Step2Students: React.FC<Step2StudentsProps> = ({
  students,
  metadata,
  onUpdateStudents,
  onPrev,
  onNext,
}) => {
  // Collapsed state for each student card
  const [expandedStudentId, setExpandedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  // Delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  // Error state for AI generation per student
  const [generationErrors, setGenerationErrors] = useState<Record<string, string>>({});

  // Helper to add student
  const handleAddStudent = () => {
    const newId = 'std_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newStudent: StudentData = {
      id: newId,
      fullName: '',
      score: '',
      evaluations: {},
      aiComment: '',
      comment: '',
      status: 'NOT_GENERATED',
    };
    onUpdateStudents((prev) => [...prev, newStudent]);
    setExpandedStudentId(newId);
  };

  // Helper to delete student
  const handleDeleteStudent = (id: string) => {
    onUpdateStudents((prev) => prev.filter((s) => s.id !== id));
    if (expandedStudentId === id) {
      const remaining = students.filter((s) => s.id !== id);
      setExpandedStudentId(remaining[0]?.id || '');
    }
    setDeleteTargetId(null);
  };

  // Helper to update specific student field
  const updateStudent = (id: string, updates: Partial<StudentData>) => {
    onUpdateStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return { ...s, ...updates };
      })
    );
  };

  // Helper to set evaluation level
  const handleSelectLevel = (
    studentId: string,
    itemId: string,
    level: PerformanceLevel
  ) => {
    onUpdateStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const newEvaluations = { ...s.evaluations };
        if (newEvaluations[itemId] === level) {
          // If clicked same, unselect
          delete newEvaluations[itemId];
        } else {
          newEvaluations[itemId] = level;
        }

        // If comment was approved, changing evaluation flags for review
        const newStatus = s.status === 'APPROVED' ? 'NEEDS_REVIEW' : s.status;

        return {
          ...s,
          evaluations: newEvaluations,
          status: newStatus,
        };
      })
    );
  };

  // Handle comment editing
  const handleCommentChange = (studentId: string, newText: string) => {
    onUpdateStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        // If teacher edits approved content, revert to NEEDS_REVIEW
        const newStatus = s.status === 'APPROVED' ? 'NEEDS_REVIEW' : s.status;
        return {
          ...s,
          comment: newText,
          status: newStatus,
        };
      })
    );
  };

  // Approve student comment
  const handleApproveComment = (studentId: string) => {
    onUpdateStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        if (!s.comment.trim()) return s;
        return {
          ...s,
          status: 'APPROVED',
        };
      })
    );
  };

  // AI Comment Generation
  const handleGenerateComment = async (student: StudentData) => {
    setGenerationErrors((prev) => ({ ...prev, [student.id]: '' }));

    if (!student.fullName.trim()) {
      setGenerationErrors((prev) => ({
        ...prev,
        [student.id]: 'Vui lòng nhập Họ và tên học viên trước khi tạo nhận xét.',
      }));
      return;
    }

    if (student.score === '' || student.score === undefined) {
      setGenerationErrors((prev) => ({
        ...prev,
        [student.id]: 'Vui lòng nhập điểm Mock Test (từ 0 đến 100).',
      }));
      return;
    }

    const scoreNum = Number(student.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setGenerationErrors((prev) => ({
        ...prev,
        [student.id]: 'Điểm Mock Test không hợp lệ. Vui lòng nhập số từ 0 đến 100 (ví dụ: 65, 72.5, 85.75).',
      }));
      return;
    }

    // Build evaluations payload
    const evalItems: Array<{
      category: string;
      characteristic: string;
      level: PerformanceLevel;
      levelText: string;
    }> = [];

    EVALUATION_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        const lvl = student.evaluations[item.id];
        if (lvl) {
          evalItems.push({
            category: group.nameVi,
            characteristic: item.nameVi,
            level: lvl,
            levelText: PERFORMANCE_LEVELS[lvl].vietnamese,
          });
        }
      });
    });

    if (evalItems.length === 0) {
      setGenerationErrors((prev) => ({
        ...prev,
        [student.id]: 'Vui lòng đánh giá ít nhất một tiêu chí trong 10 nhóm bên dưới.',
      }));
      return;
    }

    updateStudent(student.id, { isGenerating: true });

    try {
      const effectiveSkill =
        metadata.responsibleSkill === 'Other'
          ? metadata.otherSkill || 'Chuyên môn'
          : metadata.responsibleSkill;

      const res = await requestStudentComment({
        studentName: student.fullName.trim(),
        score: student.score,
        responsibleSkill: effectiveSkill,
        evaluations: evalItems,
      });

      updateStudent(student.id, {
        aiComment: res.comment,
        comment: res.comment,
        status: 'DRAFT', // Always starts at DRAFT per mandatory workflow
        isGenerating: false,
      });
    } catch (err: any) {
      setGenerationErrors((prev) => ({
        ...prev,
        [student.id]: err.message || 'Lỗi khi tạo nhận xét. Vui lòng thử lại.',
      }));
      updateStudent(student.id, { isGenerating: false });
    }
  };

  const handleUseQuickTemplate = (student: StudentData) => {
    setGenerationErrors((prev) => ({ ...prev, [student.id]: '' }));

    if (!student.fullName.trim()) {
      setGenerationErrors((prev) => ({
        ...prev,
        [student.id]: 'Vui lòng nhập Họ và tên học viên trước.',
      }));
      return;
    }

    const quickText = generateSmartQuickComment(student);
    updateStudent(student.id, {
      aiComment: quickText,
      comment: quickText,
      status: 'DRAFT',
      isGenerating: false,
    });
  };

  const studentToDelete = students.find((s) => s.id === deleteTargetId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Bước 2: Học viên cần quan tâm (Mục 1 của báo cáo)
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              {students.length} học viên
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-2xl">
            Đánh giá học viên theo 10 nhóm tiêu chí và thang điểm 5 mức độ. Sử dụng Gemini AI để tạo đoạn nhận xét quá trình học tự nhiên, sau đó duyệt để đưa vào tệp Word.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddStudent}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-xs transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm học viên</span>
        </button>
      </div>

      {/* Empty State */}
      {students.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Chưa có học viên nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Nhấn nút bên dưới để thêm học viên cần lưu ý hoặc cần theo sát sau bài thi Mock Test.
          </p>
          <button
            type="button"
            onClick={handleAddStudent}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm học viên đầu tiên</span>
          </button>
        </div>
      )}

      {/* Student Cards */}
      <div className="space-y-5">
        {students.map((student, idx) => {
          const isExpanded = expandedStudentId === student.id;
          const evaluatedCount = Object.keys(student.evaluations).length;
          const scoreNum = Number(student.score);
          const isScoreInvalid =
            student.score !== '' &&
            (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100);

          return (
            <div
              key={student.id}
              className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden ${
                student.status === 'APPROVED'
                  ? 'border-emerald-200 ring-1 ring-emerald-100'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div
                className={`p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none transition ${
                  isExpanded ? 'bg-slate-50/80 border-b border-slate-200' : 'hover:bg-slate-50/50'
                }`}
                onClick={() =>
                  setExpandedStudentId(isExpanded ? '' : student.id)
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                        {student.fullName || '(Chưa nhập tên học viên)'}
                      </span>
                      {student.score !== '' && !isScoreInvalid && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                          Điểm: {student.score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đã đánh giá: <span className="font-semibold text-slate-700">{evaluatedCount}/30</span> tiêu chí
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge status={student.status} size="sm" />

                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(student.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Xóa học viên này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedStudentId(isExpanded ? '' : student.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Card Body (Expanded) */}
              {isExpanded && (
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Basic Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Họ và tên học viên: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={student.fullName}
                        onChange={(e) => updateStudent(student.id, { fullName: e.target.value })}
                        placeholder="Nhập đầy đủ họ và tên..."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Điểm Mock Test (Thang 0–100): <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        value={student.score}
                        onChange={(e) => updateStudent(student.id, { score: e.target.value })}
                        placeholder="Ví dụ: 72.5 hoặc 85.75..."
                        className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                          isScoreInvalid
                            ? 'border-red-400 focus:ring-red-400'
                            : 'border-slate-300 focus:ring-indigo-500'
                        }`}
                      />
                      {isScoreInvalid && (
                        <p className="mt-1 text-xs text-red-600">
                          Điểm phải là số từ 0 đến 100 (chấp nhận số thập phân).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 10 Evaluation Groups */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        Đánh giá 10 nhóm tiêu chí học tập:
                      </h4>
                      <span className="text-xs text-slate-500">
                        (Có thể bỏ qua tiêu chí không đánh giá)
                      </span>
                    </div>

                    {/* Scale legend */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-600 mr-1">Thang mức độ:</span>
                      {PERFORMANCE_LEVEL_LIST.map((lvl) => (
                        <span
                          key={lvl.score}
                          className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${lvl.badgeBg}`}
                        >
                          {lvl.shortLabel}
                        </span>
                      ))}
                    </div>

                    {/* Groups list */}
                    <div className="space-y-3">
                      {EVALUATION_GROUPS.map((group) => {
                        return (
                          <div
                            key={group.id}
                            className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition"
                          >
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                                {group.order}. {group.nameVi} ({group.nameEn})
                              </span>
                            </div>

                            <div className="space-y-2">
                              {group.items.map((item) => {
                                const currentLevel = student.evaluations[item.id];

                                return (
                                  <div
                                    key={item.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition"
                                  >
                                    <span className="text-xs font-medium text-slate-800">
                                      • {item.nameVi} <span className="text-slate-400 text-[11px]">({item.nameEn})</span>
                                    </span>

                                    <div className="flex items-center gap-1 shrink-0 flex-wrap">
                                      {PERFORMANCE_LEVEL_LIST.map((lvl) => {
                                        const isSelected = currentLevel === lvl.score;

                                        return (
                                          <button
                                            key={lvl.score}
                                            type="button"
                                            onClick={() =>
                                              handleSelectLevel(student.id, item.id, lvl.score)
                                            }
                                            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition text-center ${
                                              isSelected
                                                ? lvl.borderActive
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                            title={`${lvl.shortLabel}: ${lvl.description}`}
                                          >
                                            {lvl.score} - {lvl.vietnamese}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Generation Error Alert with Quick Fallback */}
                  {generationErrors[student.id] && (
                    <div className="p-4 bg-red-50/90 border border-red-200 rounded-xl text-xs text-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <div>
                          <p className="font-semibold">Thông báo từ hệ thống AI:</p>
                          <p className="mt-0.5 text-red-600">{generationErrors[student.id]}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUseQuickTemplate(student)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 font-semibold rounded-lg text-xs shrink-0 transition"
                        title="Điền ngay nhận xét mẫu dựa trên các tiêu chí đã chọn mà không cần chờ AI"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dùng mẫu nhận xét nhanh</span>
                      </button>
                    </div>
                  )}

                  {/* Comment Generation & Approval Workflow */}
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-white rounded-xl border border-indigo-100 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          Nhận xét về quá trình học (Cột 3 của Báo cáo)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tự động sinh nhận xét học thuật chuẩn mực, xưng hô "bạn" theo văn phong sư phạm
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                        <StatusBadge status={student.status} size="sm" />

                        <button
                          type="button"
                          onClick={() => handleUseQuickTemplate(student)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                          title="Điền nhận xét mẫu tức thì theo tiêu chí đã chọn"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>Mẫu nhanh</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGenerateComment(student)}
                          disabled={student.isGenerating}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                        >
                          {student.isGenerating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang kết nối AI...</span>
                            </>
                          ) : student.status === 'NOT_GENERATED' ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Tạo nhận xét AI</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Tạo lại AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Textarea for Comment */}
                    <div>
                      <textarea
                        rows={3}
                        value={student.comment}
                        onChange={(e) => handleCommentChange(student.id, e.target.value)}
                        placeholder="Nhấn nút 'Tạo nhận xét AI' hoặc tự viết nhận xét tại đây..."
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition leading-relaxed"
                      />
                    </div>

                    {/* Approval & Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-indigo-100/60">
                      <div className="text-[11px] text-slate-500">
                        {student.status === 'APPROVED' ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Nhận xét này đã được duyệt và sẽ xuất vào tệp Word.
                          </span>
                        ) : student.status === 'NEEDS_REVIEW' ? (
                          <span className="text-orange-700 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Nội dung vừa chỉnh sửa, vui lòng nhấn "Duyệt nhận xét" để xác nhận.
                          </span>
                        ) : student.status === 'DRAFT' ? (
                          <span className="text-amber-700 font-medium">
                            Bản nháp đã tạo. Hãy đọc lại và nhấn "Duyệt nhận xét".
                          </span>
                        ) : (
                          <span>Vui lòng tạo hoặc nhập nhận xét trước khi duyệt.</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApproveComment(student.id)}
                        disabled={!student.comment.trim() || student.status === 'APPROVED'}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition ${
                          student.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                            : student.comment.trim()
                            ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{student.status === 'APPROVED' ? 'Đã duyệt ✓' : 'Duyệt nhận xét này'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Bước 1</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition"
        >
          <span>Tiếp tục: Hoạt động hỗ trợ (Mục 2)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Xác nhận xóa học viên"
        message={`Bạn có chắc chắn muốn xóa học viên "${studentToDelete?.fullName || 'này'}" khỏi danh sách? Toàn bộ đánh giá và nhận xét đã lưu của học viên này sẽ bị xóa.`}
        confirmLabel="Xóa học viên"
        cancelLabel="Hủy"
        isDanger={true}
        onConfirm={() => deleteTargetId && handleDeleteStudent(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
