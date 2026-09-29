import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, translate } from '../i18n/translations.ts';
import { useTheme, Theme } from './ThemeContext.tsx';

export interface CitationItem {
  title: string;
  source: string;
  url: string;
  lastUpdated: string;
  content?: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  audience: 'industry' | 'consumer';
  setAudience: (aud: 'industry' | 'consumer') => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  sessionId: string;
  resetSession: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  activeCitation: CitationItem | null;
  openCitationDrawer: (citation: CitationItem) => void;
  closeCitationDrawer: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, setTheme, isDark } = useTheme();

  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem('bis_lang') as SupportedLanguage | null;
      if (stored && ['en', 'hi', 'ta', 'te', 'bn', 'mr'].includes(stored)) {
        return stored;
      }
    } catch (e) {}
    return 'en';
  });

  const [audience, setAudienceState] = useState<'industry' | 'consumer'>(() => {
    try {
      const stored = localStorage.getItem('bis_audience') as 'industry' | 'consumer' | null;
      if (stored === 'industry' || stored === 'consumer') {
        return stored;
      }
    } catch (e) {}
    return 'industry';
  });

  const [sessionId, setSessionId] = useState<string>(() => {
    let sid = '';
    try {
      sid = localStorage.getItem('bis_session_id') || '';
    } catch (e) {}
    if (!sid) {
      sid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      try {
        localStorage.setItem('bis_session_id', sid);
      } catch (e) {}
    }
    return sid;
  });

  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply <html lang> instantly on language change
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    try {
      localStorage.setItem('bis_lang', language);
    } catch (e) {}
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    document.documentElement.setAttribute('lang', lang);
    try {
      localStorage.setItem('bis_lang', lang);
    } catch (e) {}
  };

  const setAudience = (aud: 'industry' | 'consumer') => {
    setAudienceState(aud);
    try {
      localStorage.setItem('bis_audience', aud);
    } catch (e) {}
  };

  const toggleDarkMode = () => {
    const nextTheme: Theme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const resetSession = () => {
    const newSid = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setSessionId(newSid);
    try {
      localStorage.setItem('bis_session_id', newSid);
    } catch (e) {}
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(language, key, params);
  };

  const openCitationDrawer = (citation: CitationItem) => {
    setActiveCitation(citation);
  };

  const closeCitationDrawer = () => {
    setActiveCitation(null);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        audience,
        setAudience,
        darkMode: isDark,
        toggleDarkMode,
        theme,
        setTheme,
        sessionId,
        resetSession,
        t,
        activeCitation,
        openCitationDrawer,
        closeCitationDrawer,
        showToast,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-18 md:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border transition-all transform animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-700/60'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-700/60'
                : 'bg-surface text-text border-border'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
