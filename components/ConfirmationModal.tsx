import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-down transform transition-all">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              {cancelLabel}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 font-bold rounded-xl text-white shadow-lg transition-all transform active:scale-95 ${
                isDestructive 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' 
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
