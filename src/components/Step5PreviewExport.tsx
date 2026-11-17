import React, { useState } from 'react';
import type {
  ReportMetadata,
  StudentData,
  SupportActivitiesState,
  RecommendationsState,
} from '../types/report';
import {
  validateReportForExport,
  generateAndDownloadDocx,
} from '../utils/docxGenerator';
import { buildReportFilename } from '../utils/filename';
import {
  FileDown,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Download,
  AlertCircle,
} from 'lucide-react';

interface Step5PreviewExportProps {
  metadata: ReportMetadata;
  students: StudentData[];
  section2: SupportActivitiesState;
  section3: RecommendationsState;
  onPrev: () => void;
  onJumpToStep: (step: number) => void;
}

export const Step5PreviewExport: React.FC<Step5PreviewExportProps> = ({
  metadata,
  students,
  section2,
  section3,
  onPrev,
  onJumpToStep,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessFile, setExportSuccessFile] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Perform validation
  const validation = validateReportForExport(metadata, students, section2, section3);

  const effectiveSkill =
    metadata.responsibleSkill === 'Other'
      ? metadata.otherSkill?.trim() || 'Khác'
      : metadata.responsibleSkill || '…';

  const filename = buildReportFilename(metadata.className, metadata.teacherName);

  const handleExport = async () => {
    setExportError(null);
    setExportSuccessFile(null);
    setIsExporting(true);

    try {
      const generatedName = await generateAndDownloadDocx(
        metadata,
        students,
        section2,
        section3
      );
      setExportSuccessFile(generatedName);
    } catch (err: any) {
      setExportError(err.message || 'Lỗi khi xuất tệp Word. Vui lòng kiểm tra lại.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-6 rounded-2xl border border-emerald-100 flex items-start gap-4">
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
          <FileDown className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">
            Bước 5: Xem trước & Xuất báo cáo Word (.docx)
          </h2>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Xem lại toàn bộ nội dung báo cáo theo đúng cấu trúc của mẫu chính thức. Hệ thống sẽ xác thực việc phê duyệt từng mục trước khi cho phép tải xuống tệp DOCX.
          </p>
        </div>
      </div>

      {/* Validation Status Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          {validation.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
          Tình trạng phê duyệt & Sẵn sàng xuất báo cáo
        </h3>

        {validation.isValid ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  Báo cáo đã hoàn tất và được duyệt đầy đủ!
                </p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Tên tệp dự kiến: <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono font-semibold text-emerald-900">{filename}</code>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-200 transition shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Đang tạo tệp Word...' : 'TẢI XUỐNG BÁO CÁO WORD (.DOCX)'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Vui lòng hoàn thành và duyệt các mục sau trước khi xuất báo cáo:
              </div>

              <ul className="space-y-1.5 pl-6 list-disc text-xs text-amber-800">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>

            {/* Quick jump buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">Chuyển nhanh đến:</span>
              <button
                type="button"
                onClick={() => onJumpToStep(1)}
                className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Bước 1: Thông tin lớp
              </button>
              <button
                type="button"
                onClick={() => onJumpToStep(2)}
                className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Bước 2: Học viên cần quan tâm
              </button>
              <button
                type="button"
                onClick={() => onJumpToStep(3)}
                className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Bước 3: Hoạt động hỗ trợ
              </button>
              <button
                type="button"
                onClick={() => onJumpToStep(4)}
                className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Bước 4: Đề xuất giải pháp
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {exportSuccessFile && (
          <div className="mt-4 p-4 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Đã tải xuống thành công tệp: <strong>{exportSuccessFile}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              Tải lại
            </button>
          </div>
        )}

        {/* Export Error Alert */}
        {exportError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Lỗi xuất báo cáo:</p>
              <p className="mt-0.5">{exportError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Official Word Document Visual Preview */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-lg p-6 sm:p-12 space-y-6 font-['Times_New_Roman',serif] text-slate-900 text-base leading-relaxed">
        <div className="border-b-2 border-slate-100 pb-4 flex items-center justify-between text-xs text-slate-400 font-sans">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>MẪU BÁO CÁO SAU MOCK TEST (XEM TRƯỚC VĂN BẢN WORD)</span>
          </div>
          <span>Font: Times New Roman 12pt</span>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide">
            BÁO CÁO SAU MOCK TEST THÁNG {metadata.reportMonth.trim() || '…'}
          </h2>
        </div>

        {/* Header Metadata */}
        <div className="space-y-1.5 pt-2">
          <p>
            <strong className="font-bold">Tên lớp:</strong> {metadata.className.trim() || '…'}
          </p>
          <p>
            <strong className="font-bold">Giáo viên phụ trách:</strong> {metadata.teacherName.trim() || '…'}
          </p>
          <p>
            <strong className="font-bold">Kỹ năng phụ trách:</strong> {effectiveSkill}
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-3 pt-3">
          <p>
            <strong className="font-bold">1. Học viên cần quan tâm </strong>
            <span className="italic text-slate-700">
              (các học viên cần lưu ý, điểm mock test thấp, các bạn lười làm bài, lười học bài, không đi học đủ hoặc thái độ không hợp tác trong lớp…)
            </span>
          </p>

          {/* Student Table */}
          <div className="overflow-x-auto border border-black">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-black divide-x divide-black text-center font-bold">
                  <th className="p-3 w-1/4">Họ tên</th>
                  <th className="p-3 w-1/4">
                    Điểm mock test <br />
                    <span className="font-normal italic">(kỹ năng giáo viên phụ trách)</span>
                  </th>
                  <th className="p-3 w-1/2">Nhận xét về quá trình học</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {students.length === 0 ? (
                  <tr className="text-center italic text-slate-400 font-sans">
                    <td colSpan={3} className="p-6">
                      (Chưa có học viên nào được thêm)
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="divide-x divide-black align-top">
                      <td className="p-3 font-semibold">
                        {student.fullName || '(Chưa nhập tên)'}
                      </td>
                      <td className="p-3 text-center">
                        {student.score !== '' ? (
                          <span className="font-bold">{student.score}</span>
                        ) : (
                          <span className="text-slate-400 italic font-sans">(Chưa có)</span>
                        )}
                      </td>
                      <td className="p-3 text-justify leading-relaxed">
                        {student.comment ? (
                          <span>{student.comment}</span>
                        ) : (
                          <span className="text-slate-400 italic font-sans">
                            (Chưa có nhận xét)
                          </span>
                        )}
                        <div className="mt-1 font-sans">
                          {student.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Clock className="w-3 h-3" /> Chưa duyệt ({student.status})
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-2 pt-4">
          <p>
            <strong className="font-bold">
              2. Chia sẻ và nhìn nhận từ giáo viên về quá trình theo sát hỗ trợ lớp và những cách giải quyết mà giáo viên đã thực hiện
            </strong>
          </p>
          <p className="italic text-slate-700">
            Giáo viên đã theo sát, hỗ trợ và giải quyết học viên có vấn đề hoặc cả lớp của mình như thế nào?
          </p>
          <p className="italic text-slate-500 text-xs">
            (nêu cụ thể giúp trung tâm nha mọi người, ví dụ đã làm việc riêng, nói chuyện trực tiếp hoặc nhắn tin nhắc nhở với bạn 1 lần, đã nhắc nhiều lần trên lớp, đã giao bài tập đơn giản hơn để lớp có thể hoàn thành nhưng một bạn vẫn không làm…; nếu giáo viên chưa kịp giải quyết riêng với học viên có vấn đề, giáo viên cũng ghi rõ ra nhé)
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-justify text-slate-900 leading-relaxed min-h-[60px]">
            {section2.summary ? (
              <p>{section2.summary}</p>
            ) : (
              <p className="text-slate-400 italic font-sans text-xs">
                (Chưa có nội dung Mục 2)
              </p>
            )}
            <div className="mt-2 font-sans">
              {section2.status === 'APPROVED' ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Mục 2 đã duyệt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Clock className="w-3 h-3" /> Mục 2 chưa duyệt ({section2.status})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="space-y-2 pt-4">
          <p>
            <strong className="font-bold">
              3. Giáo viên có đề xuất nào cho lớp và cách giải quyết học viên có vấn đề như thế nào không?
            </strong>
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-justify text-slate-900 leading-relaxed min-h-[60px]">
            {section3.recommendations ? (
              <p>{section3.recommendations}</p>
            ) : (
              <p className="text-slate-400 italic font-sans text-xs">
                (Chưa có nội dung Mục 3)
              </p>
            )}
            <div className="mt-2 font-sans">
              {section3.status === 'APPROVED' ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Mục 3 đã duyệt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Clock className="w-3 h-3" /> Mục 3 chưa duyệt ({section3.status})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation & Bottom Export Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại: Đề xuất giải pháp (Mục 3)</span>
        </button>

        <button
          type="button"
          onClick={handleExport}
          disabled={!validation.isValid || isExporting}
          className={`inline-flex items-center gap-2 px-7 py-3 text-sm font-bold rounded-xl shadow-md transition ${
            validation.isValid && !isExporting
              ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Download className="w-5 h-5" />
          <span>{isExporting ? 'Đang xuất tệp Word...' : 'TẢI XUỐNG BÁO CÁO WORD (.DOCX)'}</span>
        </button>
      </div>
    </div>
  );
};
