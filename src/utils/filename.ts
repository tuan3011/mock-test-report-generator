/**
 * Normalizes Vietnamese text to clean ASCII for safe filenames
 * (e.g., "Nguyễn Thị Lan" -> "Nguyen-Thi-Lan")
 */
export function sanitizeFilenamePart(text: string): string {
  if (!text) return 'chua-dat-ten';

  let str = text.trim();
  // Normalize unicode
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  str = str.replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'));

  // Replace invalid filesystem characters and punctuation with hyphens
  str = str.replace(/[\\/:*?"<>|#%&{}\\$!'@+`=~(),;.[\]^]/g, '-');

  // Replace whitespace and multiple underscores/hyphens with a single hyphen
  str = str.replace(/\s+/g, '-');
  str = str.replace(/[-_]+/g, '-');
  str = str.replace(/^-+|-+$/g, '');

  return str || 'chua-dat-ten';
}

/**
 * Builds the official filename according to specification:
 * {CLASS_NAME}_{TEACHER_NAME}_bao-cao-mock-test.docx
 */
export function buildReportFilename(className: string, teacherName: string): string {
  const safeClass = sanitizeFilenamePart(className) || 'CLASS';
  const safeTeacher = sanitizeFilenamePart(teacherName) || 'TEACHER';
  return `${safeClass}_${safeTeacher}_bao-cao-mock-test.docx`;
}
