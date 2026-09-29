import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Beaker,
  Calendar,
  Layers,
  X,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface StandardItem {
  isNumber: string;
  title: string;
  year: string;
  scopeSummary: string;
  productCategory: string;
  scheme: 'ISI' | 'CRS' | 'Hallmark' | 'FMCS' | 'Other';
  qcoApplicable: boolean;
  mandatoryDate?: string;
  labTestParameters?: string[];
}

export const StandardsPage: React.FC = () => {
  const { t } = useApp();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || '');
  const [selectedScheme, setSelectedScheme] = useState(searchParams.get('scheme') || '');
  const [qcoOnly, setQcoOnly] = useState(searchParams.get('qco') === 'true');

  const [standards, setStandards] = useState<StandardItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [schemes, setSchemes] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail drawer
  const [activeStandard, setActiveStandard] = useState<StandardItem | null>(null);

  const fetchStandards = async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: query,
        category: selectedCategory,
        scheme: selectedScheme,
        qco: qcoOnly ? 'true' : 'false',
        page: targetPage.toString(),
        limit: '9',
      });

      const res = await fetch(`/api/standards?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load Indian Standards catalog.');
      const data = await res.json();

      setStandards(data.standards || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setCategories(data.categories || []);
      setSchemes(data.schemes || []);
    } catch (err: any) {
      setError(err.message || 'Error loading standards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandards(1);
  }, [query, selectedCategory, selectedScheme, qcoOnly]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchStandards(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedScheme('');
    setQcoOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-subtle text-accent">
              {t('statsStandards')}
            </span>
            <span className="text-xs text-muted">• {t('showingResults', { count: standards.length, total })}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text mt-1">
            {t('standardsTitle')}
          </h1>
          <p className="text-xs text-muted max-w-2xl mt-1">
            {t('standardsSubtitle')}
          </p>
        </div>

        <a
          href="https://www.services.bis.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <span>{t('viewOfficialSource')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Search & Filters Control Panel */}
      <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchStandardsPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface-subtle text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-subtle text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-surface text-text">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Scheme Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedScheme}
              onChange={(e) => setSelectedScheme(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-subtle text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="">{t('allSchemes')}</option>
              {schemes.map((sch) => (
                <option key={sch} value={sch} className="bg-surface text-text">
                  {sch}
                </option>
              ))}
            </select>
          </div>

          {/* QCO Mandatory Toggle & Clear */}
          <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text">
              <input
                type="checkbox"
                checked={qcoOnly}
                onChange={(e) => setQcoOnly(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
              <span>{t('qcoMandatoryOnly')}</span>
            </label>

            {(query || selectedCategory || selectedScheme || qcoOnly) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 text-muted hover:text-text rounded-lg hover:bg-surface-hover transition-colors"
                title={t('resetFilters')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-48 rounded-2xl bg-surface-subtle animate-pulse border border-border p-5 space-y-3"
            >
              <div className="w-24 h-4 bg-muted/20 rounded" />
              <div className="w-3/4 h-5 bg-muted/20 rounded" />
              <div className="w-full h-12 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-surface rounded-2xl border border-border">
          <p className="text-sm text-rose-500 font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => fetchStandards(page)}
            className="mt-3 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : standards.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-2xl border border-border space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-subtle text-muted flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-text">
            {t('noStandardsFound')}
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Try adjusting your search query, selecting "All Categories", or unchecking the QCO filter.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('resetFilters')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {standards.map((std) => (
            <div
              key={std.isNumber}
              className="bg-surface rounded-2xl p-5 border border-border shadow-xs hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-sm text-primary tracking-tight font-mono">
                    {std.isNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-subtle text-primary">
                      {std.scheme}
                    </span>
                    {std.qcoApplicable ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {t('qcoMandatoryBadge')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-subtle text-muted">
                        {t('qcoVoluntaryBadge')}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-text text-sm line-clamp-2 leading-snug">
                  {std.title}
                </h3>

                <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                  {std.scopeSummary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs">
                <span className="text-[11px] text-muted font-medium truncate max-w-[150px]">
                  {std.productCategory}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveStandard(std)}
                  className="font-bold text-primary hover:opacity-80 transition-opacity"
                >
                  {t('viewScopeDetails')} →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface px-5 py-3 rounded-2xl border border-border shadow-xs text-xs">
          <span className="text-muted">
            {t('paginationPageOf', { current: page, total: totalPages })}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="p-2 rounded-lg border border-border text-text hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
              title={t('paginationPrev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-text">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="p-2 rounded-lg border border-border text-text hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
              title={t('paginationNext')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal / Drawer */}
      {activeStandard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface text-text rounded-2xl shadow-2xl max-w-xl w-full border border-border p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <span className="font-mono text-sm font-extrabold text-primary">
                  {activeStandard.isNumber} ({activeStandard.year})
                </span>
                <h3 className="font-bold text-base text-text mt-1">
                  {activeStandard.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveStandard(null)}
                className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border">
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">{t('colCategory')}</span>
                  <span className="font-semibold text-text">{activeStandard.productCategory}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">{t('colScheme')}</span>
                  <span className="font-semibold text-text">{activeStandard.scheme}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px] uppercase font-bold">{t('colQcoStatus')}</span>
                  <span className={`font-bold ${activeStandard.qcoApplicable ? 'text-rose-600 dark:text-rose-400' : 'text-muted'}`}>
                    {activeStandard.qcoApplicable ? t('qcoMandatoryBadge') : t('qcoVoluntaryBadge')}
                  </span>
                </div>
                {activeStandard.mandatoryDate && (
                  <div>
                    <span className="text-muted block text-[10px] uppercase font-bold">{t('mandatoryEnforcementDate')}</span>
                    <span className="font-semibold text-text">{activeStandard.mandatoryDate}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-text uppercase tracking-wider text-[11px] mb-1">
                  Scope Summary
                </h4>
                <p className="text-muted leading-relaxed p-3.5 rounded-xl bg-surface-subtle border border-border">
                  {activeStandard.scopeSummary}
                </p>
              </div>

              {activeStandard.labTestParameters && activeStandard.labTestParameters.length > 0 && (
                <div>
                  <h4 className="font-bold text-text uppercase tracking-wider text-[11px] mb-1">
                    {t('labTestParameters')}
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeStandard.labTestParameters.map((param, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-subtle border border-border text-muted font-medium"
                      >
                        <Beaker className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{param}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <a
                href="https://www.services.bis.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>{t('viewOfficialSource')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
