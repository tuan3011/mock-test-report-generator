import type {
  EvaluationGroup,
  LevelInfo,
  PerformanceLevel,
} from '../types/report';

export const RESPONSIBLE_SKILL_OPTIONS = [
  { value: 'Listening', label: 'Listening (Nghe)' },
  { value: 'Speaking', label: 'Speaking (Nói)' },
  { value: 'Reading', label: 'Reading (Đọc)' },
  { value: 'Writing', label: 'Writing (Viết)' },
  { value: 'Grammar', label: 'Grammar (Ngữ pháp)' },
  { value: 'Vocabulary', label: 'Vocabulary (Từ vựng)' },
  { value: 'Overall Skills', label: 'Overall Skills (Tổng hợp kỹ năng)' },
  { value: 'Other', label: 'Khác (Tự nhập...)' },
];

export const PERFORMANCE_LEVELS: Record<PerformanceLevel, LevelInfo> = {
  5: {
    score: 5,
    level: 'Excellent',
    vietnamese: 'Rất tốt',
    shortLabel: '5 - Rất tốt',
    description: 'Thực hiện xuất sắc, vượt trội',
    bgLight: 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800',
    borderActive: 'border-emerald-600 bg-emerald-600 text-white shadow-xs',
    textActive: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  },
  4: {
    score: 4,
    level: 'Good',
    vietnamese: 'Tốt',
    shortLabel: '4 - Tốt',
    description: 'Nắm vững kiến thức, làm tốt',
    bgLight: 'bg-[#E5EFFB] hover:bg-[#D5E5F8] border-[#A9C8EC] text-[#426F9F]',
    borderActive: 'border-[#426F9F] bg-[#426F9F] text-white shadow-xs',
    textActive: 'text-[#426F9F]',
    badgeBg: 'bg-[#E5EFFB] text-[#426F9F] border border-[#A9C8EC]',
  },
  3: {
    score: 3,
    level: 'Average',
    vietnamese: 'Khá ổn',
    shortLabel: '3 - Khá ổn',
    description: 'Mức độ trung bình, ổn định',
    bgLight: 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-amber-800',
    borderActive: 'border-amber-600 bg-amber-600 text-white shadow-xs',
    textActive: 'text-amber-700',
    badgeBg: 'bg-amber-50 text-amber-800 border border-amber-200',
  },
  2: {
    score: 2,
    level: 'Needs Improvement',
    vietnamese: 'Cần cải thiện',
    shortLabel: '2 - Cần cải thiện',
    description: 'Cần nỗ lực rèn luyện thêm',
    bgLight: 'bg-orange-50/70 hover:bg-orange-100/70 border-orange-200 text-orange-800',
    borderActive: 'border-orange-500 bg-orange-500 text-white shadow-xs',
    textActive: 'text-orange-700',
    badgeBg: 'bg-orange-50 text-orange-800 border border-orange-200',
  },
  1: {
    score: 1,
    level: 'Not Yet Demonstrated',
    vietnamese: 'Chưa thể hiện được',
    shortLabel: '1 - Chưa thể hiện',
    description: 'Chưa bộc lộ hoặc gặp nhiều khó khăn',
    bgLight: 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700',
    borderActive: 'border-slate-600 bg-slate-600 text-white shadow-xs',
    textActive: 'text-slate-700',
    badgeBg: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
};

export const PERFORMANCE_LEVEL_LIST: LevelInfo[] = [
  PERFORMANCE_LEVELS[5],
  PERFORMANCE_LEVELS[4],
  PERFORMANCE_LEVELS[3],
  PERFORMANCE_LEVELS[2],
  PERFORMANCE_LEVELS[1],
];

export const EVALUATION_GROUPS: EvaluationGroup[] = [
  {
    id: '01-attitude',
    order: '01',
    nameEn: 'Attitude',
    nameVi: 'Thái độ',
    items: [
      { id: 'att-concentration', nameEn: 'Concentration', nameVi: 'Tập trung' },
      { id: 'att-initiative', nameEn: 'Initiative', nameVi: 'Chủ động' },
      { id: 'att-cooperation', nameEn: 'Cooperation', nameVi: 'Hợp tác' },
      { id: 'att-diligence', nameEn: 'Diligence', nameVi: 'Chăm chỉ' },
    ],
  },
  {
    id: '02-participation',
    order: '02',
    nameEn: 'Participation',
    nameVi: 'Mức độ tham gia',
    items: [
      { id: 'part-class-participation', nameEn: 'Class Participation', nameVi: 'Tham gia hoạt động' },
      { id: 'part-interaction', nameEn: 'Interaction', nameVi: 'Tương tác' },
      { id: 'part-answering-questions', nameEn: 'Answering Questions', nameVi: 'Trả lời câu hỏi' },
    ],
  },
  {
    id: '03-listening',
    order: '03',
    nameEn: 'Listening',
    nameVi: 'Kỹ năng nghe',
    items: [
      { id: 'list-listening-comprehension', nameEn: 'Listening Comprehension', nameVi: 'Nghe hiểu' },
      { id: 'list-keyword-recognition', nameEn: 'Keyword Recognition', nameVi: 'Nhận biết từ khóa' },
      { id: 'list-following-instructions', nameEn: 'Following Instructions', nameVi: 'Làm theo hướng dẫn' },
    ],
  },
  {
    id: '04-speaking',
    order: '04',
    nameEn: 'Speaking',
    nameVi: 'Kỹ năng nói',
    items: [
      { id: 'spk-pronunciation', nameEn: 'Pronunciation', nameVi: 'Phát âm' },
      { id: 'spk-fluency', nameEn: 'Fluency', nameVi: 'Độ lưu loát' },
      { id: 'spk-expression', nameEn: 'Expression', nameVi: 'Diễn đạt' },
      { id: 'spk-communication', nameEn: 'Communication', nameVi: 'Giao tiếp' },
    ],
  },
  {
    id: '05-vocabulary',
    order: '05',
    nameEn: 'Vocabulary',
    nameVi: 'Từ vựng',
    items: [
      { id: 'voc-recognition', nameEn: 'Vocabulary Recognition', nameVi: 'Nhận biết từ vựng' },
      { id: 'voc-retention', nameEn: 'Vocabulary Retention', nameVi: 'Ghi nhớ từ vựng' },
      { id: 'voc-usage', nameEn: 'Vocabulary Usage', nameVi: 'Sử dụng từ vựng' },
    ],
  },
  {
    id: '06-grammar',
    order: '06',
    nameEn: 'Grammar',
    nameVi: 'Ngữ pháp',
    items: [
      { id: 'grm-understanding', nameEn: 'Grammar Understanding', nameVi: 'Hiểu ngữ pháp' },
      { id: 'grm-sentence-construction', nameEn: 'Sentence Construction', nameVi: 'Đặt câu' },
      { id: 'grm-application', nameEn: 'Grammar Application', nameVi: 'Vận dụng cấu trúc' },
    ],
  },
  {
    id: '07-reading',
    order: '07',
    nameEn: 'Reading',
    nameVi: 'Kỹ năng đọc',
    items: [
      { id: 'rdg-comprehension', nameEn: 'Reading Comprehension', nameVi: 'Đọc hiểu' },
      { id: 'rdg-word-recognition', nameEn: 'Word Recognition', nameVi: 'Nhận diện từ' },
      { id: 'rdg-fluency', nameEn: 'Reading Fluency', nameVi: 'Độ lưu loát khi đọc' },
    ],
  },
  {
    id: '08-writing',
    order: '08',
    nameEn: 'Writing',
    nameVi: 'Kỹ năng viết',
    items: [
      { id: 'wrt-spelling', nameEn: 'Spelling', nameVi: 'Chính tả' },
      { id: 'wrt-sentence-writing', nameEn: 'Sentence Writing', nameVi: 'Viết câu' },
      { id: 'wrt-accuracy', nameEn: 'Writing Accuracy', nameVi: 'Độ chính xác khi viết' },
    ],
  },
  {
    id: '09-homework',
    order: '09',
    nameEn: 'Homework',
    nameVi: 'Bài tập',
    items: [
      { id: 'hw-completion', nameEn: 'Homework Completion', nameVi: 'Hoàn thành bài tập' },
      { id: 'hw-accuracy', nameEn: 'Homework Accuracy', nameVi: 'Độ chính xác bài tập' },
      { id: 'hw-preparation', nameEn: 'Preparation', nameVi: 'Chuẩn bị bài' },
    ],
  },
  {
    id: '10-improvement',
    order: '10',
    nameEn: 'Improvement',
    nameVi: 'Sự tiến bộ',
    items: [
      { id: 'imp-learning-progress', nameEn: 'Learning Progress', nameVi: 'Tiến bộ' },
      { id: 'imp-consistency', nameEn: 'Consistency', nameVi: 'Duy trì phong độ' },
      { id: 'imp-areas-improvement', nameEn: 'Areas for Improvement', nameVi: 'Điểm cần cải thiện' },
    ],
  },
];

export interface ChecklistGroup {
  id: string;
  title: string;
  items: string[];
}

export const SUPPORT_ACTIVITY_GROUPS: ChecklistGroup[] = [
  {
    id: 'direct-communication',
    title: 'A. Trao đổi trực tiếp (Direct Communication)',
    items: [
      'Trao đổi riêng với học viên.',
      'Nói chuyện trực tiếp với học viên trên lớp.',
      'Nhắn tin nhắc nhở học viên một lần.',
      'Nhắn tin nhắc nhở học viên nhiều lần.',
      'Liên hệ phụ huynh để trao đổi tình hình học tập.',
    ],
  },
  {
    id: 'classroom-management',
    title: 'B. Quản lý lớp học (Classroom Management)',
    items: [
      'Nhắc nhở học viên nhiều lần trong lớp.',
      'Động viên và khuyến khích học viên.',
      'Tăng cường tương tác với học viên.',
      'Theo dõi thái độ và mức độ tham gia của học viên.',
    ],
  },
  {
    id: 'academic-support',
    title: 'C. Hỗ trợ học tập (Academic Support)',
    items: [
      'Giao thêm bài tập bổ trợ.',
      'Điều chỉnh bài tập phù hợp với năng lực.',
      'Hướng dẫn lại kiến thức chưa nắm vững.',
      'Hỗ trợ riêng trong quá trình làm bài.',
      'Theo dõi kết quả học tập sau khi hỗ trợ.',
    ],
  },
  {
    id: 'follow-up-status',
    title: 'D. Tình trạng theo dõi (Follow-up Status)',
    items: [
      'Học viên đã có chuyển biến tích cực.',
      'Học viên chưa có nhiều thay đổi.',
      'Học viên vẫn chưa hợp tác.',
      'Giáo viên chưa kịp trao đổi riêng với học viên.',
      'Cần tiếp tục theo dõi.',
    ],
  },
];

export const RECOMMENDATION_GROUPS: ChecklistGroup[] = [
  {
    id: 'student-recommendations',
    title: 'A. Đề xuất về học viên (Student Recommendations)',
    items: [
      'Tiếp tục theo dõi sát sao học viên.',
      'Trao đổi riêng với học viên.',
      'Phối hợp với phụ huynh.',
      'Động viên học viên cải thiện thái độ học tập.',
      'Đặt mục tiêu học tập cụ thể cho học viên.',
      'Theo dõi tiến độ cải thiện định kỳ.',
    ],
  },
  {
    id: 'academic-recommendations',
    title: 'B. Đề xuất về chuyên môn & học tập (Academic Recommendations)',
    items: [
      'Tăng cường bài tập bổ trợ.',
      'Tổ chức ôn tập kiến thức còn yếu.',
      'Bổ sung bài tập thực hành.',
      'Điều chỉnh nội dung học phù hợp với năng lực.',
      'Tăng cường luyện tập kỹ năng phụ trách.',
      'Hỗ trợ học viên ngoài giờ học khi cần thiết.',
    ],
  },
  {
    id: 'classroom-recommendations',
    title: 'C. Đề xuất về lớp học (Classroom Recommendations)',
    items: [
      'Tăng cường hoạt động tương tác.',
      'Tăng cơ hội phát biểu và thực hành.',
      'Điều chỉnh phương pháp giảng dạy.',
      'Theo dõi sát hơn tình hình của cả lớp.',
    ],
  },
  {
    id: 'center-recommendations',
    title: 'D. Đề xuất hỗ trợ từ trung tâm (Center Support Recommendations)',
    items: [
      'Nhờ trung tâm phối hợp liên hệ phụ huynh.',
      'Đề xuất trung tâm hỗ trợ theo dõi học viên.',
      'Đề xuất tư vấn lộ trình học tập phù hợp.',
    ],
  },
];
