import React, { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import CommandPalette from './components/CommandPalette';
import { AppRole, AppView, Lang } from './types';

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

export { showToast };

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<AppRole>('chairman');
  const [view, setView] = useState<AppView>('dashboard');
  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

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
          ? (lang === 'en' ? 'Dark Mode activated for refinery control room.' : 'ডার্ক মোড সক্রিয় করা হয়েছে।')
          : (lang === 'en' ? 'Light Mode restored.' : 'লাইট মোড সক্রিয় করা হয়েছে।'),
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
      <Sidebar
        role={role}
        activeView={view}
        onNavigate={setView}
        lang={lang}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
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
        />

        <main className={`page-content${view === 'inner_circle' ? ' no-padding-chat' : ''}`}>
          <div key={view} className="view-transition-wrapper">
            {view === 'dashboard'      && <DashboardView      role={role} lang={lang} />}
            {view === 'inner_circle'   && <InnerCircleChat    role={role} lang={lang} />}
            {view === 'notesheet'      && <NotesheetView      role={role} lang={lang} />}
            {view === 'compliance'     && <ComplianceView     role={role} lang={lang} />}
            {(view === 'fleet' || view === 'vehicle_request') && <FleetView role={role} lang={lang} />}
            {view === 'bus'            && <BusView            role={role} lang={lang} />}
            {view === 'parcel'         && <ParcelView         role={role} lang={lang} />}
            {view === 'attendance'     && <AttendanceView     role={role} lang={lang} />}
            {view === 'incident'       && <IncidentView       role={role} lang={lang} />}
            {view === 'claims'         && <ClaimsView         role={role} lang={lang} />}
            {view === 'asset'          && <AssetView          role={role} lang={lang} />}
            {view === 'guest'          && <GuestView          role={role} lang={lang} />}
            {view === 'workforce'      && <WorkforceView      role={role} lang={lang} />}
            {view === 'approvals'      && <ApprovalsView      role={role} lang={lang} />}
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={setView}
        onRoleChange={handleRoleChange}
        onToggleTheme={toggleTheme}
        lang={lang}
        currentTheme={theme}
      />

      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
      <ToastManager />
    </div>
  );
}
