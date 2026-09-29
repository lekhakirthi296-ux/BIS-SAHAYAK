import React, { useState } from 'react';
import { X, ThumbsDown, Send } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface FeedbackModalProps {
  messageId: string;
  queryText?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<void>;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  messageId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { showToast, t } = useApp();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(comment);
      showToast(t('feedbackSuccess'), 'success');
      onClose();
    } catch {
      showToast('Failed to save feedback.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-surface text-text rounded-2xl shadow-2xl max-w-md w-full border border-border p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2 text-rose-500">
            <ThumbsDown className="w-5 h-5" />
            <h3 className="font-bold text-base text-text">{t('feedbackModalTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-hover"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted mb-4 leading-relaxed">
          {t('feedbackModalDesc')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={t('feedbackPlaceholder')}
            className="w-full text-xs p-3 rounded-xl border border-border bg-surface-subtle text-text focus:ring-2 focus:ring-primary focus:outline-none"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-muted hover:bg-surface-hover transition-colors"
            >
              {t('feedbackCancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? '...' : t('feedbackSubmit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
