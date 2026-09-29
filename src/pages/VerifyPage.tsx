import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Camera,
  Upload,
  ShieldCheck,
  ExternalLink,
  Award,
  Sparkles,
  Building,
  Calendar,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface LicenseVerificationResult {
  found: boolean;
  status: 'valid' | 'expired' | 'suspended' | 'not_found';
  license: {
    id: string;
    type: 'ISI' | 'CRS' | 'HALLMARK';
    number: string;
    holder: string;
    product: string;
    standard: string;
    validity: string;
    status: 'valid' | 'expired' | 'suspended';
    address: string;
    issueDate: string;
    brand?: string;
  } | null;
  searchedType: string;
  searchedNumber: string;
  disclaimer: string;
  officialVerificationUrl: string;
}

interface LabelScanResult {
  isiMarkDetected: boolean;
  crsMarkDetected: boolean;
  hallmarkDetected: boolean;
  isNumber: string | null;
  registrationOrCml: string | null;
  brandOrManufacturer: string | null;
  productType: string | null;
  markAuthenticity: string;
  observations: string;
  recommendedAction: string;
  disclaimer: string;
}

export const VerifyPage: React.FC = () => {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'license' | 'scan'>('license');

  // License Verification State
  const [licenseType, setLicenseType] = useState<'ISI' | 'CRS' | 'HALLMARK'>('ISI');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [licenseResult, setLicenseResult] = useState<LicenseVerificationResult | null>(null);

  // Label Scanner State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<LabelScanResult | null>(null);

  const handleVerifyLicense = async (numToVerify?: string) => {
    const num = (numToVerify || licenseNumber).trim();
    if (!num) {
      showToast('Please enter a license or registration number.', 'error');
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch(`/api/verify-license?type=${licenseType}&number=${encodeURIComponent(num)}`);
      if (!res.ok) throw new Error('Verification service error.');
      const data = await res.json();
      setLicenseResult(data);
      showToast('License status retrieved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Verification failed.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleQuickDemoFill = (type: 'ISI' | 'CRS' | 'HALLMARK', num: string) => {
    setLicenseType(type);
    setLicenseNumber(num);
    handleVerifyLicense(num);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setScanResult(null);
    }
  };

  const handleScanLabel = async () => {
    if (!selectedFile) {
      showToast('Please upload or snap a photo of a product label.', 'error');
      return;
    }

    setScanning(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/label-scan', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Label scan failed.');
      const data = await res.json();
      setScanResult(data);
      showToast('Product label analysis complete!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Image processing error.', 'error');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Official Anti-Counterfeit Verification
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            License & Label Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mt-1">
            Verify authenticity of ISI CM/L numbers, CRS registration R-numbers, gold jewellery HUIDs, or scan product labels.
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('license')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'license'
                ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Number Verification
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'scan'
                ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Label Scanner AI</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LICENSE NUMBER VERIFICATION */}
      {activeTab === 'license' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            {/* Scheme Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select BIS Scheme Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ISI', label: 'ISI Mark (CM/L)', hint: 'e.g. CM/L-8400123456' },
                  { id: 'CRS', label: 'CRS Scheme (R-No)', hint: 'e.g. R-41001234' },
                  { id: 'HALLMARK', label: 'Hallmark (HUID)', hint: 'e.g. HUID-AB92K4' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLicenseType(item.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      licenseType === item.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Action */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyLicense();
              }}
              className="space-y-3"
            >
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Enter Registration / License Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder={
                      licenseType === 'ISI'
                        ? 'e.g. CM/L-8400123456'
                        : licenseType === 'CRS'
                        ? 'e.g. R-41001234'
                        : 'e.g. HUID-AB92K4'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Verify License'}
                </button>
              </div>
            </form>

            {/* Quick Demo Pre-fill Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-semibold block mb-2">
                Demo License Entries:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('ISI', 'CM/L-8400123456')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-300 text-xs font-mono"
                >
                  Bajaj Geysers (Valid ISI)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('CRS', 'R-41001234')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-300 text-xs font-mono"
                >
                  Samsung Laptops (Valid CRS)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('HALLMARK', 'HUID-AB92K4')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-300 text-xs font-mono"
                >
                  Tanishq Gold 22K (Valid HUID)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('ISI', 'CM/L-6300456123')}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-mono border border-rose-200 dark:border-rose-900"
                >
                  AquaPure Water (Expired)
                </button>
              </div>
            </div>
          </div>

          {/* Verification Result Card */}
          {licenseResult && (
            <div className="animate-in fade-in space-y-4">
              {licenseResult.found && licenseResult.license ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {licenseResult.status === 'valid' ? (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white font-mono">
                            {licenseResult.license.number}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              licenseResult.status === 'valid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {licenseResult.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Scheme: {licenseResult.license.type} Certification
                        </p>
                      </div>
                    </div>

                    <a
                      href={licenseResult.officialVerificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold hover:underline"
                    >
                      <span>Check on e-BIS</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* License Particulars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Licensee / Firm Name
                      </span>
                      <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {licenseResult.license.holder}
                      </p>
                      {licenseResult.license.brand && (
                        <p className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
                          Brand: {licenseResult.license.brand}
                        </p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Indian Standard
                      </span>
                      <p className="font-extrabold text-blue-900 dark:text-blue-300 text-sm font-mono">
                        {licenseResult.license.standard}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                        Product: {licenseResult.license.product}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Validity Period
                      </span>
                      <p className="font-extrabold text-slate-900 dark:text-white">
                        {licenseResult.license.validity}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        First Granted: {licenseResult.license.issueDate}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        Manufacturing Premises
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 text-xs">
                        {licenseResult.license.address}
                      </p>
                    </div>
                  </div>

                  {/* Demo Warning Banner */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
                    <span className="font-medium">{licenseResult.disclaimer}</span>
                    <a
                      href="https://www.manakonline.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline ml-2 shrink-0"
                    >
                      Official Portal →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    License Record Not Found in Demo Database
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    The number <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{licenseResult.searchedNumber}</span> was not found in this sample catalog. Please verify directly on the official BIS portals:
                  </p>
                  <div className="pt-2">
                    <a
                      href={licenseResult.officialVerificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <span>Search on Official Manak Online Database</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCT LABEL SCANNER (AI VISION) */}
      {activeTab === 'scan' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Upload or Snap Product Label Photo</span>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50 dark:bg-slate-800/30">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Product label preview"
                    className="max-h-64 mx-auto rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 object-contain"
                  />
                  <div className="flex items-center justify-center gap-3">
                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300">
                      <span>Change Image</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={handleScanLabel}
                      disabled={scanning}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                    >
                      {scanning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Analyzing Label...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Analyze BIS Markings</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Click to upload label photo or drag & drop
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      JPEG, PNG, WebP up to 10 MB. Ensure ISI logo and text are clearly legible.
                    </p>
                  </div>
                  <label className="inline-block cursor-pointer px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors">
                    <span>Select Photo</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* AI Scan Analysis Results */}
          {scanResult && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    AI Visual Inspection Analysis
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    Label Conformity Assessment
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200">
                  {scanResult.markAuthenticity}
                </span>
              </div>

              {/* Detected Marks Checkboxes */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={`p-3 rounded-xl border text-xs ${scanResult.isiMarkDetected ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500'}`}>
                  <span className="font-bold block">ISI Mark Logo</span>
                  <span className="text-xs font-semibold">{scanResult.isiMarkDetected ? '✓ Detected' : 'Not Detected'}</span>
                </div>
                <div className={`p-3 rounded-xl border text-xs ${scanResult.crsMarkDetected ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500'}`}>
                  <span className="font-bold block">CRS Self-Decl.</span>
                  <span className="text-xs font-semibold">{scanResult.crsMarkDetected ? '✓ Detected' : 'Not Detected'}</span>
                </div>
                <div className={`p-3 rounded-xl border text-xs ${scanResult.hallmarkDetected ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500'}`}>
                  <span className="font-bold block">Hallmark HUID</span>
                  <span className="text-xs font-semibold">{scanResult.hallmarkDetected ? '✓ Detected' : 'Not Detected'}</span>
                </div>
              </div>

              {/* Extracted Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Extracted IS Number
                  </span>
                  <p className="font-extrabold text-blue-900 dark:text-blue-300 text-sm font-mono">
                    {scanResult.isNumber || 'None Legible'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Extracted CM/L or R-Number
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                    {scanResult.registrationOrCml || 'None Legible'}
                  </p>
                </div>
              </div>

              {/* Inspector Observations & Recommendations */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Observations:</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {scanResult.observations}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
                  <span className="font-bold text-blue-900 dark:text-blue-300">Recommended Action:</span>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                    {scanResult.recommendedAction}
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
                {scanResult.disclaimer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
