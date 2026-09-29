import React from 'react';
import { ShieldCheck, PhoneCall, Mail, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const Footer: React.FC = () => {
  const { t } = useApp();

  return (
    <footer className="bg-surface border-t border-border text-muted pt-10 pb-20 md:pb-10 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: About BIS Sahayak */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <span className="font-bold text-sm text-text tracking-tight">{t('appTitle')}</span>
            </div>
            <p className="text-muted leading-relaxed text-xs">
              {t('footerAboutText')}
            </p>
            <div className="pt-1">
              <span className="inline-block px-2.5 py-1 rounded-md bg-surface-subtle text-[11px] font-semibold text-text border border-border">
                {t('heroBadge')}
              </span>
            </div>
          </div>

          {/* Col 2: Official Portals */}
          <div className="space-y-2">
            <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">
              {t('footerPortalsTitle')}
            </h4>
            <ul className="space-y-2 text-muted">
              <li>
                <a
                  href="https://www.manakonline.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  Manak Online (e-BIS Portal) <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.bis.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  Bureau of Indian Standards Portal <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.crsbis.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  Compulsory Registration (CRS) Portal <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.services.bis.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  e-Sale of Indian Standards <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Citizen & Consumer Helpline */}
          <div className="space-y-2">
            <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">
              {t('footerHelplineTitle')}
            </h4>
            <div className="space-y-2.5 text-muted">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-text text-xs">1800-11-0001</div>
                  <div className="text-[10px] text-muted">{t('tollFree')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <div className="text-text text-xs font-mono font-semibold">complaints@bis.gov.in</div>
                  <div className="text-[10px] text-muted">Enforcement & Anti-Counterfeiting</div>
                </div>
              </div>
              <div className="pt-1">
                <a
                  href="https://play.google.com/store/apps/details?id=com.bis.mobile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:opacity-80 font-semibold underline inline-flex items-center gap-1"
                >
                  {t('bisCareLine')} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Col 4: Statutory Notice */}
          <div className="space-y-2">
            <h4 className="font-bold text-text uppercase tracking-wider text-[11px]">
              Statutory Quality Notice
            </h4>
            <div className="p-3 rounded-xl bg-surface-subtle border border-border text-muted text-[11px] leading-relaxed">
              Under Section 29 of the BIS Act, 2016, unauthorized use of the standard mark or manufacturing goods without mandatory certification entails imprisonment or monetary fines.
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-muted text-[11px]">
          <div>{t('rightsReserved')}</div>
          <div className="flex items-center gap-4">
            <a href="https://www.bis.gov.in/privacy-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="https://www.bis.gov.in/terms-conditions/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              Terms & Conditions
            </a>
            <span>•</span>
            <a href="https://www.bis.gov.in/hyperlinking-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              Hyperlink Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
