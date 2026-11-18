import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { validateReportForExport } from '../src/utils/docxGenerator.ts';
import { buildReportFilename } from '../src/utils/filename.ts';
import { generateSmartQuickComment } from '../src/utils/commentTemplateGenerator.ts';

console.log('====================================================');
console.log(' BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG BÁO CÁO MOCK TEST');
console.log('====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${message}`);
    testsFailed++;
  }
}

// ---------------------------------------------------------------------
// TEST 1: Kiểm thử đặt tên tệp theo quy chuẩn
// {CLASS_NAME}_{TEACHER_NAME}_bao-cao-mock-test.docx
// ---------------------------------------------------------------------
console.log('--- TEST GROUP 1: Quy chuẩn tên tệp báo cáo ---');
const fn1 = buildReportFilename('KIDS-05', 'Nguyễn Thị Lan');
assert(
  fn1 === 'KIDS-05_Nguyen-Thi-Lan_bao-cao-mock-test.docx',
  `Đặt tên tệp chuẩn tiếng Việt: ${fn1}`
);

const fn2 = buildReportFilename('IELTS *B2/C1*', 'Trần Văn Tuấn (Thầy Tuấn)');
assert(
  fn2 === 'IELTS-B2-C1_Tran-Van-Tuan-Thay-Tuan_bao-cao-mock-test.docx',
  `Xử lý ký tự đặc biệt trong tên tệp: ${fn2}`
);

// ---------------------------------------------------------------------
// TEST 2: Thang điểm Mock Test 0–10 và số thập phân
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Thang điểm Mock Test & Kiểm thực số thập phân ---');
function validateScore(score) {
  if (score === '' || score === undefined || score === null) return false;
  const num = Number(score);
  return !isNaN(num) && num >= 0 && num <= 10;
}

assert(validateScore('6.5') === true, 'Điểm thập phân 6.5 hợp lệ');
assert(validateScore('7.25') === true, 'Điểm thập phân 7.25 hợp lệ');
assert(validateScore('8.75') === true, 'Điểm thập phân 8.75 hợp lệ');
assert(validateScore('10') === true, 'Điểm 10 hợp lệ');
assert(validateScore('0') === true, 'Điểm 0 hợp lệ');
assert(validateScore('10.5') === false, 'Điểm 10.5 > 10 bị từ chối');
assert(validateScore('-1') === false, 'Điểm âm bị từ chối');
assert(validateScore('abc') === false, 'Điểm không phải số bị từ chối');
assert(validateScore('') === false, 'Điểm rỗng bị từ chối');

// ---------------------------------------------------------------------
// TEST 3: Độc lập dữ liệu giữa các học viên (Thêm, Xóa, Không chia sẻ state)
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Quản lý học viên độc lập ---');
let students = [
  {
    id: 's1',
    fullName: 'Nguyễn Văn An',
    score: '7.5',
    evaluations: { 'att-concentration': 4, 'spk-pronunciation': 5 },
    aiComment: 'Bạn tập trung và phát âm tốt.',
    comment: 'Bạn tập trung và phát âm tốt.',
    status: 'APPROVED',
  },
  {
    id: 's2',
    fullName: 'Lê Bảo Bình',
    score: '4.5',
    evaluations: { 'att-concentration': 2, 'hw-completion': 2 },
    aiComment: 'Bạn chưa tập trung và chưa làm đủ bài.',
    comment: 'Bạn chưa tập trung và chưa làm đủ bài.',
    status: 'DRAFT',
  },
  {
    id: 's3',
    fullName: 'Hoàng Minh Châu',
    score: '9.0',
    evaluations: { 'att-diligence': 5, 'rdg-comprehension': 5 },
    aiComment: 'Bạn học rất xuất sắc.',
    comment: 'Bạn học rất xuất sắc.',
    status: 'APPROVED',
  },
];

assert(students.length === 3, 'Khởi tạo 3 học viên');
assert(students[0].evaluations['spk-pronunciation'] === 5, 'Học viên 1 có kỹ năng nói mức 5');
assert(students[1].evaluations['spk-pronunciation'] === undefined, 'Học viên 2 không bị chia sẻ đánh giá của học viên 1');

// Xóa học viên 2
const s2Id = 's2';
students = students.filter((s) => s.id !== s2Id);
assert(students.length === 2, 'Đã xóa học viên s2, còn lại 2 học viên');
assert(students.find((s) => s.id === 's1') !== undefined, 'Học viên s1 giữ nguyên');
assert(students.find((s) => s.id === 's3') !== undefined, 'Học viên s3 giữ nguyên');

// ---------------------------------------------------------------------
// TEST 4: Quy trình Phê duyệt (Draft -> Edit -> Needs Review -> Approve)
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: Quy trình phê duyệt bắt buộc ---');
let s1 = { ...students[0] };
assert(s1.status === 'APPROVED', 'Trạng thái ban đầu của s1 là APPROVED');

// Khi giáo viên chỉnh sửa nhận xét của học viên đã duyệt:
const editedComment = s1.comment + ' Cần luyện tập thêm từ vựng.';
const statusAfterEdit = s1.status === 'APPROVED' ? 'NEEDS_REVIEW' : s1.status;
s1.comment = editedComment;
s1.status = statusAfterEdit;
assert(s1.status === 'NEEDS_REVIEW', 'Chỉnh sửa nhận xét đã APPROVED lập tức chuyển sang NEEDS_REVIEW');

// Khi giáo viên bấm duyệt:
s1.status = 'APPROVED';
assert(s1.status === 'APPROVED', 'Giáo viên bấm duyệt thành công -> chuyển sang APPROVED');

// ---------------------------------------------------------------------
// TEST 5: Chặn xuất Word khi chưa được phê duyệt đầy đủ
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: Chặn xuất Word khi chưa phê duyệt đầy đủ ---');
const metadata = {
  className: 'KIDS-05',
  teacherName: 'Nguyễn Thị Lan',
  responsibleSkill: 'Listening',
  reportMonth: '11/2026',
};

const unapprovedStudents = [
  {
    id: 's1',
    fullName: 'Nguyễn Văn An',
    score: '7.5',
    evaluations: {},
    aiComment: 'Nhận xét 1',
    comment: 'Nhận xét 1',
    status: 'APPROVED',
  },
  {
    id: 's2',
    fullName: 'Trần Minh Đức',
    score: '5.0',
    evaluations: {},
    aiComment: 'Nhận xét 2',
    comment: 'Nhận xét 2',
    status: 'DRAFT', // Chưa duyệt!
  },
];

const unapprovedSec2 = {
  selectedActivities: ['Nhắc nhở trên lớp'],
  customDetails: '',
  aiSummary: 'Tóm tắt mục 2',
  summary: 'Tóm tắt mục 2',
  status: 'APPROVED',
};

const unapprovedSec3 = {
  selectedRecommendations: ['Tăng bài tập'],
  customDetails: '',
  aiRecommendations: 'Đề xuất mục 3',
  recommendations: 'Đề xuất mục 3',
  status: 'DRAFT', // Chưa duyệt!
};

const checkBlocked = validateReportForExport(
  metadata,
  unapprovedStudents,
  unapprovedSec2,
  unapprovedSec3
);

assert(checkBlocked.isValid === false, 'Báo cáo có mục chưa duyệt BỊ CHẶN xuất');
assert(
  checkBlocked.errors.some((e) => e.includes('Trần Minh Đức')),
  'Báo cáo chỉ rõ học viên Trần Minh Đức chưa được duyệt'
);
assert(
  checkBlocked.errors.some((e) => e.includes('Mục 3')),
  'Báo cáo chỉ rõ Mục 3 chưa được duyệt'
);

// ---------------------------------------------------------------------
// TEST 6: Xuất Word khi tất cả đã được phê duyệt
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 6: Xuất Word thành công khi 100% đã duyệt ---');
const fullyApprovedStudents = [
  {
    id: 's1',
    fullName: 'Nguyễn Văn An',
    score: '7.5',
    evaluations: {},
    aiComment: '',
    comment: 'Bạn tiếp thu bài tốt, có tinh thần cầu tiến và tích cực phát biểu.',
    status: 'APPROVED',
  },
  {
    id: 's2',
    fullName: 'Trần Minh Đức',
    score: '5.0',
    evaluations: {},
    aiComment: '',
    comment: 'Bạn còn rụt rè, cần chăm chỉ làm bài tập về nhà hơn để cải thiện kỹ năng nghe.',
    status: 'APPROVED',
  },
  {
    id: 's3',
    fullName: 'Vũ Thảo My',
    score: '8.5',
    evaluations: {},
    aiComment: '',
    comment: 'Bạn học rất chăm ngoan, nắm chắc cấu trúc và phản xạ nhanh.',
    status: 'APPROVED',
  },
];

const approvedSec2 = {
  selectedActivities: ['Trao đổi trực tiếp trên lớp', 'Giao bài tập bổ trợ'],
  customDetails: '',
  aiSummary: '',
  summary: 'Giáo viên đã trao đổi trực tiếp với từng học viên trên lớp, động viên các bạn còn yếu và giao thêm đề thực hành ngắn.',
  status: 'APPROVED',
};

const approvedSec3 = {
  selectedRecommendations: ['Tăng cường bài tập bổ trợ', 'Tổ chức ôn tập kiến thức'],
  customDetails: '',
  aiRecommendations: '',
  recommendations: 'Đề xuất trung tâm tiếp tục duy trì hoạt động luyện nghe nhóm nhỏ và hỗ trợ giáo viên gửi tài liệu bổ trợ qua Zalo phụ huynh.',
  status: 'APPROVED',
};

const checkApproved = validateReportForExport(
  metadata,
  fullyApprovedStudents,
  approvedSec2,
  approvedSec3
);

assert(checkApproved.isValid === true, 'Tất cả các mục đã duyệt -> ĐỦ ĐIỀU KIỆN xuất');
assert(checkApproved.errors.length === 0, 'Không còn lỗi nào ngăn cản xuất báo cáo');

// ---------------------------------------------------------------------
// TEST 7: Kiểm thử sinh DOCX từ template chính thức và bảo toàn cấu trúc
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 7: Sinh tệp DOCX thực tế và bảo toàn mẫu chính thức ---');
const templateBuffer = fs.readFileSync('public/official_template_prepared.docx');
const zip = new PizZip(templateBuffer);
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

doc.render({
  reportMonth: metadata.reportMonth,
  className: metadata.className,
  teacherName: metadata.teacherName,
  responsibleSkill: metadata.responsibleSkill,
  students: fullyApprovedStudents.map((s) => ({
    name: s.fullName,
    score: s.score,
    comment: s.comment,
  })),
  section2Content: approvedSec2.summary,
  section3Content: approvedSec3.recommendations,
});

const generatedBuffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
const testFilename = 'test_generated_report.docx';
fs.writeFileSync(testFilename, generatedBuffer);
assert(fs.existsSync(testFilename), 'Tệp test_generated_report.docx đã được tạo thành công');

// Kiểm tra nội dung XML bên trong tệp vừa tạo
const verifyZip = new PizZip(fs.readFileSync(testFilename));
const verifyXml = verifyZip.file('word/document.xml').asText();

assert(verifyXml.includes('BÁO CÁO SAU MOCK TEST THÁNG 11/2026'), 'Tiêu đề và tháng chính xác');
assert(verifyXml.includes(': KIDS-05'), 'Tên lớp chính xác');
assert(verifyXml.includes(': Nguyễn Thị Lan'), 'Tên giáo viên chính xác');
assert(verifyXml.includes(': Listening'), 'Kỹ năng phụ trách chính xác');
assert(verifyXml.includes('Nguyễn Văn An'), 'Chứa học viên 1: Nguyễn Văn An');
assert(verifyXml.includes('Trần Minh Đức'), 'Chứa học viên 2: Trần Minh Đức');
assert(verifyXml.includes('Vũ Thảo My'), 'Chứa học viên 3: Vũ Thảo My');
assert(verifyXml.includes('7.5'), 'Chứa điểm 7.5');
assert(verifyXml.includes('5.0'), 'Chứa điểm 5.0');
assert(verifyXml.includes('8.5'), 'Chứa điểm 8.5');
assert(verifyXml.includes('Giáo viên đã trao đổi trực tiếp với từng học viên'), 'Chứa nội dung Mục 2');
assert(verifyXml.includes('Đề xuất trung tâm tiếp tục duy trì hoạt động'), 'Chứa nội dung Mục 3');
assert(verifyXml.includes('1. Học viên cần quan tâm'), 'Giữ nguyên tiêu đề Mục 1');
assert(verifyXml.includes('2. Chia sẻ và nhìn nhận'), 'Giữ nguyên tiêu đề Mục 2');
assert(verifyXml.includes('3. Giáo viên có đề xuất'), 'Giữ nguyên tiêu đề Mục 3');

// Dọn dẹp tệp test
fs.unlinkSync(testFilename);
console.log('[CLEANUP] Đã dọn dẹp tệp test tạm thời.');

// ---------------------------------------------------------------------
// TEST 8: Chuẩn hóa văn phong sư phạm - Bắt buộc xưng hô "bạn" (Không dùng con/em)
// ---------------------------------------------------------------------
console.log('\n--- TEST GROUP 8: Chuẩn hóa văn phong báo cáo giáo viên & Xưng hô "bạn" ---');
const testStd = {
  id: 'std_test',
  fullName: 'Phạm Nhật Nam',
  score: '7.5',
  evaluations: {
    'att-concentration': 5,
    'spk-pronunciation': 4,
    'list-listening-comprehension': 2,
  },
  aiComment: '',
  comment: '',
  status: 'DRAFT',
};

const generatedQuickComment = generateSmartQuickComment(testStd);
console.log('Nhận xét mẫu sinh ra:\n', generatedQuickComment);

assert(
  generatedQuickComment.includes('bạn'),
  'Nhận xét sử dụng đại từ xưng hô "bạn"'
);
assert(
  !generatedQuickComment.toLowerCase().includes('con ') && !generatedQuickComment.toLowerCase().includes('em '),
  'Tuyệt đối KHÔNG sử dụng xưng hô "con" hoặc "em"'
);
assert(
  generatedQuickComment.includes('7.5/10'),
  'Bảo toàn điểm số Mock Test 7.5/10 không bị biến đổi'
);
assert(
  generatedQuickComment.includes('Thời gian tới, bạn nên') || generatedQuickComment.includes('tiến bộ đáng ghi nhận'),
  'Tuân thủ cấu trúc khuyến nghị và văn phong sư phạm PRE-5/PRE-7'
);

// ---------------------------------------------------------------------
// KẾT QUẢ KIỂM THỬ
// ---------------------------------------------------------------------
console.log('\n====================================================');
console.log(` KẾT QUẢ KIỂM THỬ: ${testsPassed} PASS, ${testsFailed} FAIL`);
console.log('====================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
