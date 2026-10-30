import React, { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import CommandPalette from './components/CommandPalette';
import { AppRole, AppView, Lang, t } from './types';
import { useNoticeStore } from './store/noticeStore';
import { Megaphone, CheckCircle2, X } from 'lucide-react';

// Views
import LoginPage from './views/LoginPage';
import DashboardView from './views/DashboardView';
import NotesheetView from './views/NotesheetView';
import ComplianceView from './views/ComplianceView';
import FleetView from './views/FleetView';
import BusView from './views/BusView';
import ParcelView from './views/ParcelView';
import AttendanceView from './views/AttendanceView';
import IncidentView from './views/IncidentView';
import InnerCircleChat from './views/InnerCircleChat';
import ClaimsView from './views/ClaimsView';
import AssetView from './views/AssetView';
import GuestView from './views/GuestView';
import WorkforceView from './views/WorkforceView';
import ApprovalsView from './views/ApprovalsView';
import ToastManager, { showToast } from './components/ToastManager';
import BroadcastModal from './components/BroadcastModal';
import MobileBottomNav from './components/MobileBottomNav';

export { showToast };

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<AppRole>('chairman');
  const [view, setView] = useState<AppView>('dashboard');
  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const { activeBroadcast, dismissActiveBroadcast, acknowledgeNotice } = useNoticeStore();

  // Sync theme to HTML root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogin = (selectedRole: AppRole) => {
    setRole(selectedRole);
    setView('dashboard');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    showToast(lang === 'en' ? 'Signed out of BOGCL OneOps.' : 'লগআউট সম্পন্ন হয়েছে।', 'info');
  };

  const handleRoleChange = (newRole: AppRole) => {
    setRole(newRole);
    setView('dashboard');
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      showToast(
        next === 'dark'
          ? (lang === 'en' ? 'Dark Mode turned on.' : 'ডার্ক মোড চালু করা হয়েছে।')
          : (lang === 'en' ? 'Light Mode restored.' : 'লাইট মোড চালু করা হয়েছে।'),
        'info'
      );
      return next;
    });
  };

  if (!isLoggedIn) {
    return (
      <div
        className={`app-shell${lang === 'bn' ? ' lang-bn' : ''}`}
        data-theme={theme}
      >
        <LoginPage
          onLogin={handleLogin}
          lang={lang}
          onLangToggle={() => setLang((l) => (l === 'en' ? 'bn' : 'en'))}
        />
        <ToastManager />
      </div>
    );
  }

  return (
    <div
      className={`app-shell${lang === 'bn' ? ' lang-bn' : ''}${isSidebarCollapsed ? ' sidebar-collapsed-shell' : ''}${view === 'inner_circle' ? ' chat-view-shell' : ''}`}
      data-theme={theme}
    >
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar menu"
        />
      )}

      <Sidebar
        role={role}
        activeView={view}
        onNavigate={(v) => {
          setView(v);
          setIsMobileSidebarOpen(false);
        }}
        lang={lang}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className={`main-wrapper${isSidebarCollapsed ? ' sidebar-collapsed' : ''}${view === 'inner_circle' ? ' chat-view-wrapper' : ''}`}>
        <Topbar
          role={role}
          lang={lang}
          view={view}
          theme={theme}
          onRoleChange={handleRoleChange}
          onLangToggle={() => setLang((l) => (l === 'en' ? 'bn' : 'en'))}
          onToggleTheme={toggleTheme}
          onOpenSearch={() => setShowCommandPalette(true)}
          onNavigate={setView}
          onBroadcastOpen={() => setShowBroadcast(true)}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Live Company-Wide Announcement Banner */}
        {activeBroadcast && (
          <div
            className="announcement-banner"
            style={{
              background: 'linear-gradient(135deg, #881337 0%, #A51C30 60%, #7F1D1D 100%)',
              color: '#FFFFFF',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
              borderBottom: '2px solid var(--brand-gold, #D4AF37)',
              boxShadow: '0 4px 12px rgba(165, 28, 48, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: '1 1 320px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Megaphone size={16} color="#FDE047" />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#FDE047', color: '#78350F', padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}>
                    {t('COMPANY ANNOUNCEMENT', 'বিশেষ ঘোষণা', lang)}
                  </span>
                  <span>{activeBroadcast.title}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.9)', marginTop: '2px', lineHeight: 1.45 }}>
                  {activeBroadcast.body} — <strong style={{ color: '#FDE047' }}>{activeBroadcast.author}</strong>
                </div>
              </div>
            </div>

            <div className="announcement-banner-actions">
              {activeBroadcast.requireAck && (
                <button
                  type="button"
                  onClick={() => {
                    acknowledgeNotice(`NOT-${activeBroadcast.id}`);
                    dismissActiveBroadcast();
                    showToast(
                      t('Announcement acknowledged and saved to Notice Board.', 'ঘোষণাটি পঠিত হিসেবে নিশ্চিত করা হয়েছে।', lang),
                      'gold'
                    );
                  }}
                  style={{
                    background: '#FDE047',
                    color: '#78350F',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>{t('Acknowledge', 'পঠিত নিশ্চিত করুন', lang)}</span>
                </button>
              )}
              <button
                type="button"
                onClick={dismissActiveBroadcast}
                title={t('Dismiss banner', 'বন্ধ করুন', lang)}
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <main className={`page-content${view === 'inner_circle' ? ' no-padding-chat' : ''}`}>
          <div key={view} className="view-transition-wrapper">
            {view === 'dashboard'      && <DashboardView      role={role} lang={lang} onNavigate={setView} />}
            {view === 'inner_circle'   && <InnerCircleChat    role={role} lang={lang} />}
            {view === 'notesheet'      && <NotesheetView      role={role} lang={lang} />}
            {view === 'compliance'     && <ComplianceView     role={role} lang={lang} />}
            {(view === 'fleet' || view === 'vehicle_request') && <FleetView role={role} lang={lang} />}
            {view === 'bus'            && <BusView            role={role} lang={lang} />}
            {view === 'parcel'         && <ParcelView         role={role} lang={lang} />}
            {view === 'attendance'     && <AttendanceView     role={role} lang={lang} />}
            {view === 'incident'       && <IncidentView       role={role} lang={lang} onNavigate={setView} />}
            {view === 'claims'         && <ClaimsView         role={role} lang={lang} />}
            {view === 'asset'          && <AssetView          role={role} lang={lang} onNavigate={setView} />}
            {view === 'guest'          && <GuestView          role={role} lang={lang} />}
            {view === 'workforce'      && <WorkforceView      role={role} lang={lang} />}
            {view === 'approvals'      && <ApprovalsView      role={role} lang={lang} />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Navigation Bar */}
      <MobileBottomNav
        role={role}
        activeView={view}
        onNavigate={(v) => {
          setView(v);
          setIsMobileSidebarOpen(false);
        }}
        lang={lang}
        onOpenMenu={() => setIsMobileSidebarOpen(true)}
      />

      {/* Global Search & Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={setView}
        onRoleChange={handleRoleChange}
        onToggleTheme={toggleTheme}
        lang={lang}
        currentTheme={theme}
        role={role}
      />

      {showBroadcast && <BroadcastModal lang={lang} onClose={() => setShowBroadcast(false)} />}
      <ToastManager />
    </div>
  );
}
