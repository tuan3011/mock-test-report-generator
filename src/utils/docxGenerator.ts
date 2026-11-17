import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type {
  ReportMetadata,
  StudentData,
  SupportActivitiesState,
  RecommendationsState,
} from '../types/report';
import { buildReportFilename } from './filename';

/**
 * Downloads a Blob directly in modern browsers without external dependencies
 */
export function downloadBlobInBrowser(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates report before allowing DOCX generation.
 * Blocks export if any required content has not been approved.
 */
export function validateReportForExport(
  metadata: ReportMetadata,
  students: StudentData[],
  section2: SupportActivitiesState,
  section3: RecommendationsState
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Metadata validation
  if (!metadata.className?.trim()) {
    errors.push('Mục 1: Vui lòng nhập Tên lớp.');
  }

  if (!metadata.teacherName?.trim()) {
    errors.push('Mục 1: Vui lòng nhập Tên giáo viên phụ trách.');
  }

  const effectiveSkill =
    metadata.responsibleSkill === 'Other'
      ? metadata.otherSkill?.trim()
      : metadata.responsibleSkill?.trim();

  if (!effectiveSkill) {
    errors.push('Mục 1: Vui lòng chọn hoặc nhập Kỹ năng phụ trách.');
  }

  // Step 2: Students validation
  if (!students || students.length === 0) {
    errors.push('Mục 1: Chưa có học viên nào trong danh sách học viên cần quan tâm.');
  } else {
    students.forEach((student, idx) => {
      const studentLabel = student.fullName?.trim() || `Học viên #${idx + 1}`;

      if (!student.fullName?.trim()) {
        errors.push(`Mục 1: Học viên #${idx + 1} chưa nhập họ và tên.`);
      }

      if (student.score === undefined || student.score === null || student.score === '') {
        errors.push(`Mục 1: Học viên "${studentLabel}" chưa nhập điểm Mock Test.`);
      } else {
        const scoreNum = Number(student.score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
          errors.push(`Mục 1: Điểm Mock Test của "${studentLabel}" không hợp lệ (${student.score}). Phải từ 0 đến 10.`);
        }
      }

      if (student.status !== 'APPROVED') {
        let statusText = 'chưa được tạo nhận xét';
        if (student.status === 'DRAFT') statusText = 'mới chỉ có bản nháp, chưa được duyệt';
        if (student.status === 'NEEDS_REVIEW') statusText = 'đã bị chỉnh sửa, cần được xem lại và duyệt';
        errors.push(`Mục 1: Nhận xét của "${studentLabel}" ${statusText}.`);
      } else if (!student.comment?.trim()) {
        errors.push(`Mục 1: Nhận xét của "${studentLabel}" đang để trống.`);
      }
    });
  }

  // Step 3: Section 2 validation
  if (section2.status !== 'APPROVED') {
    let statusText = 'chưa được tạo';
    if (section2.status === 'DRAFT') statusText = 'mới chỉ có bản nháp, chưa được duyệt';
    if (section2.status === 'NEEDS_REVIEW') statusText = 'đã bị chỉnh sửa, cần được xem lại và duyệt';
    errors.push(`Mục 2 (Hoạt động hỗ trợ): Nội dung ${statusText}.`);
  } else if (!section2.summary?.trim()) {
    errors.push('Mục 2 (Hoạt động hỗ trợ): Nội dung đã duyệt đang để trống.');
  }

  // Step 4: Section 3 validation
  if (section3.status !== 'APPROVED') {
    let statusText = 'chưa được tạo';
    if (section3.status === 'DRAFT') statusText = 'mới chỉ có bản nháp, chưa được duyệt';
    if (section3.status === 'NEEDS_REVIEW') statusText = 'đã bị chỉnh sửa, cần được xem lại và duyệt';
    errors.push(`Mục 3 (Đề xuất của giáo viên): Nội dung ${statusText}.`);
  } else if (!section3.recommendations?.trim()) {
    errors.push('Mục 3 (Đề xuất của giáo viên): Nội dung đã duyệt đang để trống.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generates and downloads the official DOCX report
 */
export async function generateAndDownloadDocx(
  metadata: ReportMetadata,
  students: StudentData[],
  section2: SupportActivitiesState,
  section3: RecommendationsState
): Promise<string> {
  // Validate first
  const validation = validateReportForExport(metadata, students, section2, section3);
  if (!validation.isValid) {
    throw new Error(
      `Không thể xuất báo cáo do còn thông tin chưa hoàn thành hoặc chưa duyệt:\n\n` +
        validation.errors.map((e) => `• ${e}`).join('\n')
    );
  }

  // Fetch prepared template from public folder
  const response = await fetch('/official_template_prepared.docx');
  if (!response.ok) {
    throw new Error('Không thể tải tệp mẫu báo cáo Word từ máy chủ. Vui lòng thử lại sau.');
  }

  const templateArrayBuffer = await response.arrayBuffer();
  const zip = new PizZip(templateArrayBuffer);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const effectiveSkill =
    metadata.responsibleSkill === 'Other'
      ? metadata.otherSkill?.trim() || 'Khác'
      : metadata.responsibleSkill?.trim() || '…';

  const reportMonthStr = metadata.reportMonth?.trim() || '…';

  // Render official document template
  doc.render({
    reportMonth: reportMonthStr,
    className: metadata.className.trim(),
    teacherName: metadata.teacherName.trim(),
    responsibleSkill: effectiveSkill,
    students: students.map((s) => ({
      name: s.fullName.trim(),
      score: String(s.score).trim(),
      comment: s.comment.trim(),
    })),
    section2Content: section2.summary.trim(),
    section3Content: section3.recommendations.trim(),
  });

  const outBlob = doc.getZip().generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  const filename = buildReportFilename(metadata.className, metadata.teacherName);
  downloadBlobInBrowser(outBlob, filename);

  return filename;
}
