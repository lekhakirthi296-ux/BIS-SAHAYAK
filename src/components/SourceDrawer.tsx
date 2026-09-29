import React from 'react';
import { X, ExternalLink, Calendar, BookOpen, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const SourceDrawer: React.FC = () => {
  const { activeCitation, closeCitationDrawer, t } = useApp();

  if (!activeCitation) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeCitationDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface text-text shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between bg-surface-subtle">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-subtle text-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">{t('citationsTitle')}</h3>
                <p className="text-[11px] text-muted">{t('officialGovPortal')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeCitationDrawer}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-hover"
              aria-label={t('drawerClose')}
              title={t('drawerClose')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-5 text-sm">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-subtle text-primary mb-2">
                Document / Standard Record
              </span>
              <h4 className="text-base font-bold text-text leading-snug">
                {activeCitation.title}
              </h4>
            </div>

            <div className="bg-surface-subtle rounded-xl p-4 border border-border space-y-3">
              <div className="flex items-start gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-text">Authoritative Source:</span>
                  <p className="text-muted">{activeCitation.source}</p>
                </div>
              </div>

              {activeCitation.lastUpdated && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-muted shrink-0" />
                  <div>
                    <span className="font-semibold text-text">{t('lastUpdatedDate')}</span>
                    <p className="text-muted ml-1 inline">{activeCitation.lastUpdated}</p>
                  </div>
                </div>
              )}
            </div>

            {activeCitation.content && (
              <div>
                <h5 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Scope & Technical Provisions
                </h5>
                <div className="bg-surface-subtle rounded-xl p-4 text-xs text-text leading-relaxed font-mono border border-border">
                  {activeCitation.content}
                </div>
              </div>
            )}

            <div className="pt-2">
              <a
                href={activeCitation.url || 'https://www.bis.gov.in'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition-colors"
              >
                <span>{t('viewOfficialSource')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[11px] text-muted text-center mt-2">
                Official Bureau of Indian Standards authenticated record portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
