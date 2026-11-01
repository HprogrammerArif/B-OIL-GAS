import React, { useEffect, useState } from 'react';
import { AppRole, Lang, ROLE_META, SYSTEM_TODAY, t } from '../../types';
import { sessionStore, useCurrentUser } from '../../auth/session';
import type { Theme } from '../../lib/theme';
import { X, RotateCcw, Moon, Sun, Globe, UserRound } from 'lucide-react';

interface DemoPanelProps {
  lang: Lang;
  theme: Theme;
  onToggleTheme: () => void;
  onLangToggle: () => void;
}

const ROLES = Object.keys(ROLE_META) as AppRole[];

/**
 * Presenter controls. Hidden by default; toggled with Ctrl+Shift+D.
 * Nothing here is reachable from the product UI.
 */
export default function DemoPanel({ lang, theme, onToggleTheme, onLangToggle }: DemoPanelProps) {
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const resetDemo = () => {
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith('oneops.') && k !== 'oneops.theme.v1')
        .forEach((k) => window.localStorage.removeItem(k));
      window.sessionStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  return (
    <div className="demo-panel" role="dialog" aria-label="Presenter controls">
      <div className="demo-panel-hd">
        <div>
          <div className="demo-panel-title">{t('Presenter controls', 'উপস্থাপক নিয়ন্ত্রণ', lang)}</div>
          <div className="demo-panel-sub">Ctrl+Shift+D · {t('System date', 'সিস্টেম তারিখ', lang)}: {SYSTEM_TODAY}</div>
        </div>
        <button type="button" className="demo-panel-close" onClick={() => setOpen(false)} aria-label="Close">
          <X size={14} />
        </button>
      </div>

      <div className="demo-panel-section">
        <div className="demo-panel-label">
          <UserRound size={12} />
          {user ? t('Switch persona', 'ব্যক্তিত্ব পরিবর্তন', lang) : t('Sign in as', 'হিসেবে সাইন ইন', lang)}
        </div>
        <div className="demo-panel-grid">
          {ROLES.map((r) => {
            const m = ROLE_META[r];
            const active = user?.role === r;
            return (
              <button
                key={r}
                type="button"
                className={`demo-panel-persona${active ? ' active' : ''}`}
                onClick={() => {
                  sessionStore.switchPersona(r);
                  setOpen(false);
                }}
                title={`${m.name} · ${m.empId}`}
              >
                <span className="demo-panel-avatar" style={{ background: m.avatarColor }}>{m.initials}</span>
                <span className="demo-panel-persona-text">
                  <strong>{m.shortName}</strong>
                  <span>{t(m.label, m.labelBn, lang)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="demo-panel-section demo-panel-actions">
        <button type="button" className="demo-panel-btn" onClick={onToggleTheme}>
          {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
          {theme === 'light' ? t('Dark mode', 'ডার্ক মোড', lang) : t('Light mode', 'লাইট মোড', lang)}
        </button>
        <button type="button" className="demo-panel-btn" onClick={onLangToggle}>
          <Globe size={13} />
          {lang === 'en' ? 'বাংলা' : 'English'}
        </button>
        {user && (
          <button type="button" className="demo-panel-btn" onClick={() => { sessionStore.logout(); setOpen(false); }}>
            <X size={13} />
            {t('Sign out', 'সাইন আউট', lang)}
          </button>
        )}
        <button type="button" className="demo-panel-btn danger" onClick={resetDemo}>
          <RotateCcw size={13} />
          {t('Reset demo data', 'ডেমো ডেটা রিসেট', lang)}
        </button>
      </div>

      <div className="demo-panel-foot">
        {t('Credentials', 'লগইন তথ্য', lang)}: <code>{ROLE_META.chairman.email}</code> / <code>bogcl2026</code>
      </div>
    </div>
  );
}
