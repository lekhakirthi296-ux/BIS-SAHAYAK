import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  FileCheck2,
  CheckCircle2,
  Award,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const HomePage: React.FC = () => {
  const { t, audience, setAudience } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/chat?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/chat');
    }
  };

  const handleSampleClick = (sample: string) => {
    navigate(`/chat?q=${encodeURIComponent(sample)}`);
  };

  const sampleQueries = [
    t('promptSuggestion1'),
    t('promptSuggestion2'),
    t('promptSuggestion3'),
    t('promptSuggestion4'),
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary via-primary-hover to-surface-subtle text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        {/* Subtle decorative background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* National Standards Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/20 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>{t('heroBadge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {t('heroTitle')}
          </h1>

          <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* Audience Switcher Pills */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <span className="text-xs text-white/80 font-medium">Mode:</span>
            <div className="inline-flex p-1 rounded-xl bg-surface/20 backdrop-blur-md border border-white/20 shadow-sm">
              <button
                type="button"
                onClick={() => setAudience('industry')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  audience === 'industry'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-accent" />
                <span>{t('audienceIndustry')}</span>
              </button>
              <button
                type="button"
                onClick={() => setAudience('consumer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  audience === 'consumer'
                    ? 'bg-surface text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>{t('audienceConsumer')}</span>
              </button>
            </div>
          </div>

          {/* Primary Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-4 max-w-3xl mx-auto">
            <div className="relative flex items-center bg-surface rounded-2xl shadow-2xl p-2 border-2 border-accent focus-within:ring-4 focus-within:ring-accent/20 transition-all">
              <div className="pl-3 pr-2 text-muted">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('heroSearchPlaceholder')}
                className="w-full py-3 text-sm sm:text-base text-text placeholder:text-muted bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <span>{t('heroSearchBtn')}</span>
                <Sparkles className="w-4 h-4 text-accent" />
              </button>
            </div>
          </form>

          {/* Sample Query Chips */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-white/80 font-medium">{t('sampleQueries')}</span>
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleClick(sample)}
                className="px-3 py-1.5 rounded-full bg-surface/20 hover:bg-surface/30 text-white border border-white/20 text-xs transition-colors text-left"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Action Service Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Standards & QCO */}
          <div
            onClick={() => navigate('/standards?qco=true')}
            className="group cursor-pointer bg-surface rounded-2xl p-5 shadow-lg border border-border hover:border-primary hover:shadow-xl transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-subtle text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-text text-sm mb-1 group-hover:text-primary transition-colors">
              {t('quickActionQCO')}
            </h3>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              {t('quickActionQCODesc')}
            </p>
            <div className="flex items-center text-xs font-semibold text-primary">
              <span>{t('viewAllStandards')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Verify License */}
          <div
            onClick={() => navigate('/verify')}
            className="group cursor-pointer bg-surface rounded-2xl p-5 shadow-lg border border-border hover:border-emerald-500 hover:shadow-xl transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-bold text-text text-sm mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {t('quickActionVerify')}
            </h3>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              {t('quickActionVerifyDesc')}
            </p>
            <div className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>{t('verifyButton')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Certification Roadmap */}
          <div
            onClick={() => navigate('/certification')}
            className="group cursor-pointer bg-surface rounded-2xl p-5 shadow-lg border border-border hover:border-accent hover:shadow-xl transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-bold text-text text-sm mb-1 group-hover:text-accent transition-colors">
              {t('quickActionGuide')}
            </h3>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              {t('quickActionGuideDesc')}
            </p>
            <div className="flex items-center text-xs font-semibold text-accent">
              <span>{t('generateGuideBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Complaint Draft */}
          <div
            onClick={() => navigate('/complaint')}
            className="group cursor-pointer bg-surface rounded-2xl p-5 shadow-lg border border-border hover:border-rose-500 hover:shadow-xl transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="font-bold text-text text-sm mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              {t('quickActionComplaint')}
            </h3>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              {t('quickActionComplaintDesc')}
            </p>
            <div className="flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400">
              <span>{t('generateComplaintBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Schemes Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-border gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {t('keyPillarsTitle')}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text mt-1">
                {t('keyPillarsSubtitle')}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/standards')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              {t('viewAllStandards')} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div className="space-y-2 p-5 rounded-xl bg-surface-subtle border border-border">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-text">{t('pillar1Title')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary-subtle text-primary font-bold">
                  Scheme I
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t('pillar1Desc')}
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-xl bg-surface-subtle border border-border">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-text">{t('pillar2Title')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary-subtle text-primary font-bold">
                  Scheme II
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t('pillar2Desc')}
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-xl bg-surface-subtle border border-border">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-text">{t('pillar3Title')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-subtle text-accent font-bold">
                  Scheme IV
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t('pillar3Desc')}
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-xl bg-surface-subtle border border-border">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-text">{t('pillar4Title')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                  Sec 16
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {t('pillar4Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-xs space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-text">{t('faqTitle')}</h2>
            <p className="text-xs text-muted mt-1">{t('faqSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2">
              <h4 className="font-bold text-sm text-text">{t('faq1Q')}</h4>
              <p className="text-xs text-muted leading-relaxed">{t('faq1A')}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2">
              <h4 className="font-bold text-sm text-text">{t('faq2Q')}</h4>
              <p className="text-xs text-muted leading-relaxed">{t('faq2A')}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2">
              <h4 className="font-bold text-sm text-text">{t('faq3Q')}</h4>
              <p className="text-xs text-muted leading-relaxed">{t('faq3A')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Compliance Assurance Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary to-primary-hover rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-bold">{t('msmeBenefitsLabel')}</h3>
            </div>
            <p className="text-xs sm:text-sm text-white/90 max-w-xl">
              {t('msmeCheckboxHelp')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/certification')}
            className="shrink-0 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            {t('quickActionGuide')}
          </button>
        </div>
      </section>
    </div>
  );
};
