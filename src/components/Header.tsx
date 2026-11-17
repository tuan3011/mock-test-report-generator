import React, { useState } from 'react';
import { FileText, Key, RotateCcw } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { ConfirmModal } from './ConfirmModal';
import { getStoredApiKey } from '../utils/apiClient';

interface HeaderProps {
  onResetAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetAll }) => {
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const hasCustomKey = Boolean(getStoredApiKey());

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Logo and Titles */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    BÁO CÁO SAU MOCK TEST
                  </h1>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                    Mẫu chính thức .DOCX
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Tối ưu hóa báo cáo chuyên môn - Đảm bảo tính trung thực và bảo toàn mẫu Word
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsApiKeyOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition ${
                  hasCustomKey
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Cấu hình Google Gemini API Key"
              >
                <Key className="w-3.5 h-3.5 text-indigo-500" />
                <span>API Key {hasCustomKey ? '✓' : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                title="Xóa toàn bộ nội dung để bắt đầu báo cáo mới"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <ApiKeyModal isOpen={isApiKeyOpen} onClose={() => setIsApiKeyOpen(false)} />

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Xác nhận làm mới toàn bộ báo cáo"
        message="Hành động này sẽ xóa toàn bộ danh sách học viên, nhận xét và đề xuất đã soạn thảo. Bạn có chắc chắn muốn làm mới?"
        confirmLabel="Làm mới"
        cancelLabel="Giữ lại"
        isDanger={true}
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          onResetAll();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </>
  );
};
