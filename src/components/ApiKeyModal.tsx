import React, { useState, useEffect } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../utils/apiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey.trim());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cấu hình Google Gemini API</h3>
                <p className="text-xs text-slate-500">Dùng để kích hoạt tính năng viết nhận xét và tóm tắt tự động</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1.5 leading-relaxed">
              <div className="font-semibold flex items-center gap-1.5 text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Bảo mật & Tiện lợi:
              </div>
              <p>
                Nếu ứng dụng đã cấu hình biến môi trường <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900">GEMINI_API_KEY</code> trên Vercel, bạn có thể để trống ô này.
              </p>
              <p>
                Nếu chưa cấu hình server hoặc muốn dùng khóa cá nhân, bạn có thể dán API Key trực tiếp tại đây. Khóa chỉ lưu trong trình duyệt của bạn (localStorage).
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Google Gemini API Key:
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Chưa có khóa API?</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Nhận khóa miễn phí tại Google AI Studio
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-600 hover:text-red-700 font-medium underline"
          >
            Xóa khóa đã lưu
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
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
