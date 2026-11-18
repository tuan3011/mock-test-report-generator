import { useState, useEffect } from 'react';
import type {
  ReportMetadata,
  StudentData,
  SupportActivitiesState,
  RecommendationsState,
} from './types/report';
import { Header } from './components/Header';
import { StepProgress } from './components/StepProgress';
import { Step1ReportInfo } from './components/Step1ReportInfo';
import { Step2Students } from './components/Step2Students';
import { Step3SupportActivities } from './components/Step3SupportActivities';
import { Step4Recommendations } from './components/Step4Recommendations';
import { Step5PreviewExport } from './components/Step5PreviewExport';

const STORAGE_KEY = 'mock_test_report_form_state_v1';

function getCurrentMonthString(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  return `${m < 10 ? '0' + m : m}/${y}`;
}

const defaultMetadata: ReportMetadata = {
  className: '',
  teacherName: '',
  responsibleSkill: 'Listening',
  otherSkill: '',
  reportMonth: getCurrentMonthString(),
};

const defaultSection2: SupportActivitiesState = {
  selectedActivities: [],
  customDetails: '',
  aiSummary: '',
  summary: '',
  status: 'NOT_GENERATED',
};

const defaultSection3: RecommendationsState = {
  selectedRecommendations: [],
  customDetails: '',
  aiRecommendations: '',
  recommendations: '',
  status: 'NOT_GENERATED',
};

export function App() {
  // Load state from sessionStorage if available
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [metadata, setMetadata] = useState<ReportMetadata>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY + '_metadata');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultMetadata;
  });

  const [students, setStudents] = useState<StudentData[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY + '_students');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'std_' + Date.now(),
        fullName: '',
        score: '',
        evaluations: {},
        aiComment: '',
        comment: '',
        status: 'NOT_GENERATED',
      },
    ];
  });

  const [section2, setSection2] = useState<SupportActivitiesState>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY + '_section2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultSection2;
  });

  const [section3, setSection3] = useState<RecommendationsState>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY + '_section3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultSection3;
  });

  // Save to sessionStorage automatically
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY + '_metadata', JSON.stringify(metadata));
      sessionStorage.setItem(STORAGE_KEY + '_students', JSON.stringify(students));
      sessionStorage.setItem(STORAGE_KEY + '_section2', JSON.stringify(section2));
      sessionStorage.setItem(STORAGE_KEY + '_section3', JSON.stringify(section3));
    } catch {}
  }, [metadata, students, section2, section3]);

  const handleResetAll = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY + '_metadata');
      sessionStorage.removeItem(STORAGE_KEY + '_students');
      sessionStorage.removeItem(STORAGE_KEY + '_section2');
      sessionStorage.removeItem(STORAGE_KEY + '_section3');
    } catch {}

    setMetadata({ ...defaultMetadata, reportMonth: getCurrentMonthString() });
    setStudents([
      {
        id: 'std_' + Date.now(),
        fullName: '',
        score: '',
        evaluations: {},
        aiComment: '',
        comment: '',
        status: 'NOT_GENERATED',
      },
    ]);
    setSection2(defaultSection2);
    setSection3(defaultSection3);
    setCurrentStep(1);
  };

  const updateMetadata = (updates: Partial<ReportMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...updates }));
  };

  const updateSection2 = (updates: Partial<SupportActivitiesState>) => {
    setSection2((prev) => ({ ...prev, ...updates }));
  };

  const updateSection3 = (updates: Partial<RecommendationsState>) => {
    setSection3((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F7FC] font-sans text-[#334155]">
      <Header onResetAll={handleResetAll} />

      <StepProgress
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        metadata={metadata}
        students={students}
        section2={section2}
        section3={section3}
      />

      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
        {currentStep === 1 && (
          <Step1ReportInfo
            metadata={metadata}
            onChange={updateMetadata}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2Students
            students={students}
            metadata={metadata}
            onUpdateStudents={setStudents}
            onPrev={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3SupportActivities
            state={section2}
            metadata={metadata}
            onChange={updateSection2}
            onPrev={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4Recommendations
            state={section3}
            metadata={metadata}
            onChange={updateSection3}
            onPrev={() => setCurrentStep(3)}
            onNext={() => setCurrentStep(5)}
          />
        )}

        {currentStep === 5 && (
          <Step5PreviewExport
            metadata={metadata}
            students={students}
            section2={section2}
            section3={section3}
            onPrev={() => setCurrentStep(4)}
            onJumpToStep={setCurrentStep}
          />
        )}
      </main>

      <footer className="bg-white border-t border-[#E2EAF3] py-4 text-center text-xs text-[#718096]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© Trình tạo Báo cáo sau Mock Test. Phong cách tài liệu văn phòng thanh lịch dành cho giáo viên.</p>
          <p className="text-slate-400">Bảo toàn nguyên vẹn mẫu tài liệu Word chính thức.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
