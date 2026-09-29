import React, { useState } from 'react';
import {
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Printer,
  Sparkles,
  PhoneCall,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface ComplaintDraftResult {
  subject: string;
  recipient: string;
  letter: string;
  filingSteps: string[];
  bisChannels: string[];
  requiredEvidence: string[];
}

export const ComplaintPage: React.FC = () => {
  const { language, showToast } = useApp();

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [issue, setIssue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isNumber, setIsNumber] = useState('');
  const [sellerName, setSellerName] = useState('');

  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<ComplaintDraftResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !issue.trim()) {
      showToast('Product name and issue description are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/complaint-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          brand: brand.trim(),
          issue: issue.trim(),
          purchaseDate: purchaseDate.trim(),
          isNumber: isNumber.trim(),
          sellerName: sellerName.trim(),
          language,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate legal complaint draft.');
      const data = await res.json();
      setDraft(data);
      showToast('Formal complaint letter generated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating complaint.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (draft?.letter) {
      navigator.clipboard.writeText(draft.letter);
      setCopied(true);
      showToast('Letter text copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            Enforcement & Consumer Rights
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Grievance & Fake Mark Complaint Helper
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mt-1">
            Draft formal legal complaint letters under the BIS Act 2016 for counterfeit ISI marks, defective products, or fraudulent hallmarking.
          </p>
        </div>

        {draft && (
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Letter'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="print:hidden bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Electric Geyser, Helmet, Gold Ring..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Brand / Manufacturer Name
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Acme Appliances or Local Vendor"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Seller / Platform Name
            </label>
            <input
              type="text"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="e.g. Retail Store or E-commerce Site"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Date of Purchase
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Indian Standard (Optional)
            </label>
            <input
              type="text"
              value={isNumber}
              onChange={(e) => setIsNumber(e.target.value)}
              placeholder="e.g. IS 302-2-21 or IS 1417"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Specific Defect / Quality Issue / Fake Mark Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            rows={3}
            placeholder="Describe what occurred (e.g. Geyser caught fire due to missing thermal cut-out, or ISI mark had no valid 7-digit CM/L number, or gold was tested below 22K)..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            required
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>{loading ? 'Drafting Legal Complaint...' : 'Draft Formal Complaint'}</span>
          </button>
        </div>
      </form>

      {/* Generated Complaint Letter Output */}
      {draft && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-in fade-in">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Legal Draft Under BIS Act 2016
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1">
              {draft.subject}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Addressed to: {draft.recipient}
            </p>
          </div>

          {/* Letter Body Preview */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all">
            {draft.letter}
          </div>

          {/* 4-Step Official Filing Guide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Official Filing Steps:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {draft.filingSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Required Evidence Checklist */}
          {draft.requiredEvidence && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                Evidence to Attach with Your Complaint:
              </span>
              <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                {draft.requiredEvidence.map((ev, eIdx) => (
                  <li key={eIdx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* BIS Contact Channels */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-4">
            <span className="font-bold text-slate-800 dark:text-slate-200">Official Lodging Channels:</span>
            <span className="inline-flex items-center gap-1 font-mono text-emerald-600">
              <PhoneCall className="w-3.5 h-3.5" /> 1800-11-0001
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-blue-600">
              <Mail className="w-3.5 h-3.5" /> complaints@bis.gov.in
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
