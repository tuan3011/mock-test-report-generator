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
      <header className="bg-white border-b border-[#E2EAF3] sticky top-0 z-30 shadow-[0_1px_3px_rgba(66,111,159,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Logo and Titles */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E5EFFB] border border-[#D5E5F8] text-[#426F9F] flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-5 h-5 text-[#426F9F]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#334155]">
                    BÁO CÁO SAU MOCK TEST
                  </h1>
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-[#E5EFFB] text-[#426F9F] rounded-md border border-[#D5E5F8]">
                    Mẫu Word .docx
                  </span>
                </div>
                <p className="text-xs text-[#718096] hidden sm:block">
                  Hệ thống hỗ trợ soạn báo cáo chuyên môn - Chuẩn hóa văn phong & Bảo toàn mẫu Word
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsApiKeyOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition shadow-xs ${
                  hasCustomKey
                    ? 'bg-[#EBF7F0] text-[#1E7E45] border-[#C3E8D0] hover:bg-[#DFF1E6]'
                    : 'bg-white text-[#334155] border-[#E2EAF3] hover:bg-[#F3F7FC] hover:border-[#A9C8EC]'
                }`}
                title="Cấu hình Google Gemini API Key"
              >
                <Key className="w-3.5 h-3.5 text-[#426F9F]" />
                <span>API Key {hasCustomKey ? '✓' : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#718096] bg-white border border-[#E2EAF3] rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-xs"
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
