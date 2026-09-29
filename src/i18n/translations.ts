import en from './en.json';
import hi from './hi.json';
import ta from './ta.json';
import te from './te.json';
import bn from './bn.json';
import mr from './mr.json';

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en,
  hi,
  ta,
  te,
  bn,
  mr,
};

export function translate(
  lang: SupportedLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return text;
}
