import React, { useState, useEffect } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
} from '../utils/apiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'gemini-3.5-flash-lite (Khuyên dùng - Phản hồi < 1s, chống quá tải 503)',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'gemini-2.5-flash-lite (Ổn định, phản xạ nhanh)',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'gemini-3.1-flash-lite (Tiết kiệm & tốc độ)',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'gemini-3.8-flash (Mô hình mới - Có thể quá tải giờ cao điểm)',
  },
];

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash-lite');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setSelectedModel(getStoredModel());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey.trim());
    setStoredModel(selectedModel.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKey('');
    setStoredApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-lg border border-[#E2EAF3] overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E2EAF3]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#E5EFFB] text-[#426F9F] rounded-lg border border-[#D5E5F8]">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#334155]">Cấu hình Google Gemini AI</h3>
                <p className="text-xs text-[#718096]">Quản lý API Key và Mô hình AI xử lý báo cáo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#718096] hover:text-[#334155] hover:bg-[#F3F7FC] p-1 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            <div className="p-3 bg-[#E5EFFB]/60 border border-[#D5E5F8] rounded-lg text-xs text-[#334155] space-y-1 leading-relaxed">
              <div className="font-semibold flex items-center gap-1.5 text-[#426F9F]">
                <ShieldCheck className="w-4 h-4 text-[#426F9F]" />
                Cơ chế tự động chống nghẽn (Auto-fallback):
              </div>
              <p className="text-[#718096]">
                Hệ thống tự động sử dụng mô hình tối ưu <code className="bg-white px-1.5 py-0.5 rounded border border-[#D5E5F8] text-[#426F9F] font-mono text-[11px]">gemini-3.5-flash-lite</code> với tốc độ phản hồi cực nhanh (~1 giây) và tự động chuyển đổi mô hình dự phòng nếu máy chủ Google gặp quá tải 503.
              </p>
            </div>

            {/* Model Selection Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#426F9F]" />
                Mô hình Gemini sử dụng:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2EAF3] rounded-lg text-xs sm:text-sm text-[#334155] focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] transition"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Google Gemini API Key:
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... hoặc AQ..."
                className="w-full px-3 py-2 bg-white border border-[#E2EAF3] rounded-lg text-sm text-[#334155] placeholder:text-slate-400 focus:outline-none focus:border-[#6F9DD0] focus:ring-2 focus:ring-[#D5E5F8] transition"
              />
              <p className="mt-1 text-[11px] text-[#718096]">
                Nếu đã điền trong tệp .env, bạn có thể để trống ô này.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-[#718096] pt-0.5">
              <span>Chưa có khóa API?</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#426F9F] hover:text-[#33557C] font-medium"
              >
                Lấy khóa miễn phí tại Google AI Studio
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[#F8FAFD] border-t border-[#E2EAF3] flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium underline"
          >
            Xóa khóa đã lưu
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#334155] bg-white border border-[#E2EAF3] rounded-lg hover:bg-[#F3F7FC] transition"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#6F9DD0] hover:bg-[#5B8BBB] active:bg-[#4E7DAE] rounded-lg shadow-xs transition"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Đã lưu!
                </>
              ) : (
                'Lưu cấu hình'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
