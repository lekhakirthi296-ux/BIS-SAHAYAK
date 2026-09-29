import { useApp } from '../context/AppContext.tsx';
import { translate, SupportedLanguage } from './translations.ts';

export function useTranslation() {
  const { language, setLanguage } = useApp();

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(language, key, params);
  };

  return {
    t,
    language,
    setLanguage: (lang: SupportedLanguage) => setLanguage(lang),
  };
}
