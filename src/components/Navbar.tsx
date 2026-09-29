import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Globe, Moon, Sun, Monitor, Building2, User, Menu, X, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { LANGUAGES, SupportedLanguage } from '../i18n/translations.ts';

export const Navbar: React.FC = () => {
  const { language, setLanguage, audience, setAudience, t } = useApp();
  const { theme, setTheme, isDark } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: t('navHome') },
    { path: '/chat', label: t('navChat') },
    { path: '/standards', label: t('navStandards') },
    { path: '/certification', label: t('navCertification') },
    { path: '/verify', label: t('navVerify') },
    { path: '/complaint', label: t('navComplaint') },
    { path: '/admin', label: t('navAdmin') },
  ];

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border transition-colors">
      {/* Tricolor National Accent Stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600 dark:from-orange-600 dark:via-surface-hover dark:to-emerald-700" />

      {/* Persistent Regulatory Disclaimer Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 text-center text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>{t('disclaimerBanner')}</span>
        <a
          href="https://www.bis.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80 inline-flex items-center gap-0.5 ml-1"
        >
          bis.gov.in <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm ring-1 ring-border group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-text tracking-tight">
                  {t('appTitle')}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-primary-subtle text-primary rounded">
                  Gov-AI
                </span>
              </div>
              <p className="text-[11px] text-muted font-medium hidden sm:block">
                {t('officialGovPortal')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text hover:bg-surface-hover'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audience Switcher (Industry vs Consumer) */}
            <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setAudience('industry')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  audience === 'industry'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-muted hover:text-text'
                }`}
                title={t('audienceIndustry')}
              >
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span className="hidden md:inline">{t('audienceIndustry')}</span>
              </button>
              <button
                type="button"
                onClick={() => setAudience('consumer')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  audience === 'consumer'
                    ? 'bg-surface text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-muted hover:text-text'
                }`}
                title={t('audienceConsumer')}
              >
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">{t('audienceConsumer')}</span>
              </button>
            </div>

            {/* Language Selector */}
            <div className="relative flex items-center">
              <label htmlFor="language-select" className="sr-only">{t('languageSelect')}</label>
              <div className="flex items-center gap-1 px-2 py-1 bg-surface-subtle rounded-lg border border-border text-xs text-text">
                <Globe className="w-3.5 h-3.5 text-muted" />
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  className="bg-transparent text-xs font-semibold text-text cursor-pointer focus:outline-none"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-surface text-text">
                      {lang.nativeLabel} ({lang.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Theme Toggle (Light / Dark / System) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface-hover border border-border focus:outline-none"
                aria-label={t('toggleTheme')}
                title={`${t('toggleTheme')} (${t(theme === 'system' ? 'themeSystem' : theme === 'dark' ? 'themeDark' : 'themeLight')})`}
              >
                {theme === 'system' ? (
                  <Monitor className="w-4 h-4 text-primary" />
                ) : isDark ? (
                  <Moon className="w-4 h-4 text-accent" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
              </button>

              {themeDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-32 rounded-xl bg-surface border border-border shadow-xl p-1 z-50 animate-in fade-in"
                  onClick={() => setThemeDropdownOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      theme === 'light' ? 'bg-primary-subtle text-primary font-bold' : 'text-text hover:bg-surface-hover'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('themeLight')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      theme === 'dark' ? 'bg-primary-subtle text-primary font-bold' : 'text-text hover:bg-surface-hover'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-accent" />
                    <span>{t('themeDark')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      theme === 'system' ? 'bg-primary-subtle text-primary font-bold' : 'text-text hover:bg-surface-hover'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-primary" />
                    <span>{t('themeSystem')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 xl:hidden rounded-lg text-text hover:bg-surface-hover border border-border focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-border grid grid-cols-2 gap-1 animate-in fade-in">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'bg-primary text-white font-bold'
                      : 'text-text hover:bg-surface-hover'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
