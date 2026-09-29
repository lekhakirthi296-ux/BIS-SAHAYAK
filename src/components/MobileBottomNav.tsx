import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Search, FileBadge, CheckCircle, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const MobileBottomNav: React.FC = () => {
  const { t } = useApp();

  const links = [
    { to: '/', icon: Home, label: t('navHome') },
    { to: '/chat', icon: MessageSquare, label: t('navChat') },
    { to: '/standards', icon: Search, label: t('navStandards') },
    { to: '/certification', icon: FileBadge, label: t('navCertification') },
    { to: '/verify', icon: CheckCircle, label: t('navVerify') },
    { to: '/complaint', icon: ShieldAlert, label: t('navComplaint') },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border px-1 py-1 shadow-lg transition-colors"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive
                  ? 'text-primary font-bold'
                  : 'text-muted hover:text-text'
              }`
            }
          >
            <link.icon className="w-4 h-4 mb-0.5" />
            <span className="truncate max-w-[60px] text-center">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
