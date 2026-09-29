import React, { useState } from 'react';
import {
  FileCheck2,
  Building2,
  Globe2,
  Sparkles,
  Printer,
  RotateCcw,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface CertificationGuideResult {
  likelyScheme: 'ISI' | 'CRS' | 'Hallmark' | 'FMCS' | 'Other' | 'Unknown';
  applicableStandards: string[];
  steps: string[];
  documentChecklist: string[];
  estimatedTimeline: string;
  msmeBenefits?: string;
  notes: string;
  disclaimer: string;
}

export const CertificationPage: React.FC = () => {
  const { language, showToast, t } = useApp();

  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState('Household Appliance');
  const [manufacturerType, setManufacturerType] = useState<'indian' | 'foreign'>('indian');
  const [isMSME, setIsMSME] = useState(true);

  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<CertificationGuideResult | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showToast(t('productNameLabel'), 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/certification-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          productType,
          manufacturerType,
          isMSME,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate certification guide.');
      }

      const data = await res.json();
      setGuide(data);
      setCheckedDocs({});
      showToast(t('roadmapTitle'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Error creating guide.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleDocCheck = (idx: number) => {
    setCheckedDocs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-subtle text-accent">
            {t('audienceIndustry')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text mt-1">
            {t('certGuideTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-2xl mt-1">
            {t('certGuideSubtitle')}
          </p>
        </div>

        {guide && (
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-text text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printGuide')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGuide(null);
                setProductName('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('startOver')}</span>
            </button>
          </div>
        )}
      </div>

      {!guide ? (
        /* Input Wizard Form */
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-6 border-b border-border">
              <div className="p-3.5 rounded-xl bg-primary-subtle text-primary border border-primary/20">
                <span className="text-xs font-bold block">1. {t('step1Title')}</span>
                <span className="text-[11px] text-muted">{t('step1Desc')}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-subtle text-text border border-border">
                <span className="text-xs font-bold block">2. {t('step2Title')}</span>
                <span className="text-[11px] text-muted">{t('step2Desc')}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-subtle text-text border border-border">
                <span className="text-xs font-bold block">3. {t('step3Title')}</span>
                <span className="text-[11px] text-muted">{t('step3Desc')}</span>
              </div>
            </div>

            {/* Product Name Input */}
            <div>
              <label htmlFor="productName" className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                {t('productNameLabel')}
              </label>
              <input
                id="productName"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t('productNamePlaceholder')}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface-subtle text-xs sm:text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[11px] text-muted mt-1">
                {t('productNameHelp')}
              </p>
            </div>

            {/* Product Category & Sector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="productType" className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                  {t('productTypeLabel')}
                </label>
                <select
                  id="productType"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-subtle text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="Household Electrical Appliance">Household Electrical Appliance</option>
                  <option value="Electronics & IT Equipment">Electronics & IT Hardware (CRS)</option>
                  <option value="Protective & Safety Gear">Protective Helmets & Safety Gear</option>
                  <option value="Building & Construction">Cement, Steel & Building Materials</option>
                  <option value="Chemicals & Fertilizers">Chemicals & Fertilizers</option>
                  <option value="Food & Drinking Water">Packaged Water & Food Products</option>
                  <option value="Footwear & Leather">Footwear & Leather Goods</option>
                  <option value="Textiles & Apparel">Medical Textiles & Fabrics</option>
                </select>
              </div>

              {/* Manufacturer Location */}
              <div>
                <span className="block text-xs font-bold text-text uppercase tracking-wider mb-1.5">
                  {t('manufacturerTypeLabel')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManufacturerType('indian')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      manufacturerType === 'indian'
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-subtle text-text border-border hover:bg-surface-hover'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{t('domesticManufacturer')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManufacturerType('foreign')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      manufacturerType === 'foreign'
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-subtle text-text border-border hover:bg-surface-hover'
                    }`}
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>{t('foreignManufacturer')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* MSME Udyam Status */}
            <div className="p-4 rounded-xl bg-surface-subtle border border-border">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMSME}
                  onChange={(e) => setIsMSME(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-text block">
                    {t('msmeCheckboxLabel')}
                  </span>
                  <span className="text-[11px] text-muted leading-relaxed block mt-0.5">
                    {t('msmeCheckboxHelp')}
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span>{loading ? t('generatingGuide') : t('generateGuideBtn')}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Results Roadmap Card */
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-xs space-y-6">
            {/* Top Scheme & Standard summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t('likelySchemeLabel')}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-black text-text">
                    Scheme: {guide.likelyScheme}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-accent-subtle text-accent border border-accent/20">
                    {guide.likelyScheme === 'CRS'
                      ? 'Self Declaration (Scheme II)'
                      : guide.likelyScheme === 'FMCS'
                      ? 'Foreign License (AIR Path)'
                      : 'Factory Audit (Scheme I ISI)'}
                  </span>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t('estimatedTimelineLabel')}
                </span>
                <div className="flex items-center gap-1.5 sm:justify-end text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-1">
                  <Clock className="w-4 h-4" />
                  <span>{guide.estimatedTimeline}</span>
                </div>
              </div>
            </div>

            {/* Applicable Standards List */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                {t('applicableStandardsLabel')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {guide.applicableStandards && guide.applicableStandards.length > 0 ? (
                  guide.applicableStandards.map((std, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-primary-subtle text-primary border border-primary/20 font-mono text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{std}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted">Confirm specific standard on manakonline.in</span>
                )}
              </div>
            </div>

            {/* Step-by-Step Roadmap Procedure */}
            <div>
              <h3 className="text-sm font-extrabold text-text mb-3">
                {t('stepsTimelineTitle')}
              </h3>
              <div className="space-y-3">
                {guide.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs sm:text-sm text-text leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Checklist (Interactive) */}
            <div>
              <h3 className="text-sm font-extrabold text-text mb-3">
                {t('documentChecklistTitle')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {guide.documentChecklist.map((doc, idx) => {
                  const isChecked = Boolean(checkedDocs[idx]);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleDocCheck(idx)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-surface-subtle border-border text-text hover:bg-surface-hover'
                      }`}
                    >
                      <div className="mt-0.5">
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${isChecked ? 'line-through opacity-80' : ''}`}>
                        {doc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MSME Concessions & Factory Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {guide.msmeBenefits && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300 mb-1">
                    <Award className="w-4 h-4" />
                    <span>{t('msmeBenefitsLabel')}</span>
                  </div>
                  <p className="text-muted leading-relaxed">
                    {guide.msmeBenefits}
                  </p>
                </div>
              )}

              {guide.notes && (
                <div className="p-4 rounded-xl bg-surface-subtle border border-border text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-text mb-1">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <span>{t('factoryNotesLabel')}</span>
                  </div>
                  <p className="text-muted leading-relaxed">
                    {guide.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="p-4 rounded-xl bg-surface-subtle border border-border text-xs text-muted leading-relaxed">
              <span className="font-bold text-text">Advisory Notice: </span>
              {guide.disclaimer || t('guidanceDisclaimer')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
