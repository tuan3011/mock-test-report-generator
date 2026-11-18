import React from 'react';
import {
  FileSpreadsheet,
  Users,
  HeartHandshake,
  Lightbulb,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import type {
  ReportMetadata,
  StudentData,
  SupportActivitiesState,
  RecommendationsState,
} from '../types/report';

interface StepProgressProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  metadata: ReportMetadata;
  students: StudentData[];
  section2: SupportActivitiesState;
  section3: RecommendationsState;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  onSelectStep,
  metadata,
  students,
  section2,
  section3,
}) => {
  // Compute completion indicators
  const isStep1Done = Boolean(metadata.className.trim() && metadata.teacherName.trim());
  const approvedStudentsCount = students.filter((s) => s.status === 'APPROVED').length;
  const isStep2Done = students.length > 0 && approvedStudentsCount === students.length;
  const isStep3Done = section2.status === 'APPROVED';
  const isStep4Done = section3.status === 'APPROVED';
  const isStep5Ready = isStep1Done && isStep2Done && isStep3Done && isStep4Done;

  const steps = [
    {
      num: 1,
      title: 'Thông tin chung',
      subtitle: metadata.className ? `${metadata.className}` : 'Lớp & Giáo viên',
      icon: FileSpreadsheet,
      isComplete: isStep1Done,
    },
    {
      num: 2,
      title: 'Học viên cần quan tâm',
      subtitle: `${approvedStudentsCount}/${students.length} đã duyệt`,
      icon: Users,
      isComplete: isStep2Done,
    },
    {
      num: 3,
      title: 'Hoạt động hỗ trợ',
      subtitle: section2.status === 'APPROVED' ? 'Đã duyệt' : 'Mục 2 báo cáo',
      icon: HeartHandshake,
      isComplete: isStep3Done,
    },
    {
      num: 4,
      title: 'Đề xuất giải pháp',
      subtitle: section3.status === 'APPROVED' ? 'Đã duyệt' : 'Mục 3 báo cáo',
      icon: Lightbulb,
      isComplete: isStep4Done,
    },
    {
      num: 5,
      title: 'Xem trước & Xuất Word',
      subtitle: isStep5Ready ? 'Sẵn sàng tải về' : 'Kiểm tra & duyệt',
      icon: FileDown,
      isComplete: isStep5Ready,
    },
  ];

  return (
    <nav className="bg-white border-b border-[#E2EAF3] py-2.5 shadow-[0_1px_2px_rgba(66,111,159,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {steps.map((step) => {
            const isActive = currentStep === step.num;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => onSelectStep(step.num)}
                className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition relative ${
                  isActive
                    ? 'border-[#6F9DD0] bg-[#E5EFFB] shadow-xs'
                    : 'border-[#E2EAF3] bg-white hover:border-[#A9C8EC] hover:bg-[#F3F7FC]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#426F9F] text-white shadow-xs'
                      : step.isComplete
                      ? 'bg-[#EBF7F0] text-[#1E7E45] border border-[#C3E8D0]'
                      : 'bg-[#F3F7FC] text-[#718096] border border-[#E2EAF3]'
                  }`}
                >
                  {step.isComplete && !isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E7E45]" />
                  ) : (
                    <span>{step.num}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold truncate ${
                      isActive ? 'text-[#426F9F]' : 'text-[#334155]'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[11px] text-[#718096] truncate">
                    {step.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
