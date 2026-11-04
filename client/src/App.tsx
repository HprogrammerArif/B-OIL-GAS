import React, { Suspense, lazy, useEffect, useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import CommandPalette from './components/CommandPalette';
import AnnouncementBanner from './components/AnnouncementBanner';
import MobileBottomNav from './components/MobileBottomNav';
import BroadcastModal from './components/BroadcastModal';
import DemoPanel from './components/demo/DemoPanel';
import ToastManager, { showToast } from './components/ToastManager';
import ViewSkeleton from './components/ui/ViewSkeleton';
import LoginPage from './views/LoginPage';
import { AppView, Lang } from './types';
import { sessionStore, useCurrentUser } from './auth/session';
import { canAccessView } from './auth/permissions';
import { applyTheme, getInitialTheme, type Theme } from './lib/theme';
import { navigate, useHashView } from './lib/router';

export { showToast };

// Views are code-split so the first paint only loads the shell + landing view.
const DashboardView = lazy(() => import('./views/DashboardView'));
const NotesheetView = lazy(() => import('./views/NotesheetView'));
const ComplianceView = lazy(() => import('./views/ComplianceView'));
const FleetView = lazy(() => import('./views/FleetView'));
const BusView = lazy(() => import('./views/BusView'));
const ParcelView = lazy(() => import('./views/ParcelView'));
const AttendanceView = lazy(() => import('./views/AttendanceView'));
const IncidentView = lazy(() => import('./views/IncidentView'));
const InnerCircleChat = lazy(() => import('./views/InnerCircleChat'));
const ClaimsView = lazy(() => import('./views/ClaimsView'));
const AssetView = lazy(() => import('./views/AssetView'));
const GuestView = lazy(() => import('./views/GuestView'));
const WorkforceView = lazy(() => import('./views/WorkforceView'));
const ApprovalsView = lazy(() => import('./views/ApprovalsView'));

const LANG_KEY = 'oneops.lang.v1';

function getInitialLang(): Lang {
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'bn') return saved;
  } catch {
    /* ignore */
  }
  return 'en';
}

export default function App() {
  const user = useCurrentUser();
  const [routeView, go] = useHashView();
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

  // Resolve the view: unknown hash or a view the role cannot access → dashboard.
  const view: AppView = user && routeView && canAccessView(user.role, routeView) ? routeView : 'dashboard';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  // Keep the URL honest when the resolved view differs from the hash.
  useEffect(() => {
    if (user && routeView !== view) navigate(view, true);
  }, [user, routeView, view]);

  // Global keyboard shortcuts (Ctrl+K search, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global background scroll lock whenever any modal, drawer, or overlay is open
  useEffect(() => {
    const MODAL_SELECTOR =
      '.modal-bg, .app-modal-overlay, .eam-modal-overlay, .apv-drawer-backdrop, .drawer-backdrop, .command-palette-backdrop, .ic-call-overlay, .sidebar-mobile-backdrop, .lock-screen-backdrop';

    const syncBodyScrollLock = () => {
      const hasOpenModal = document.querySelector(MODAL_SELECTOR) !== null;
      const htmlEl = document.documentElement;
      const bodyEl = document.body;

      if (hasOpenModal) {
        if (!bodyEl.classList.contains('modal-scroll-locked')) {
          const scrollbarWidth = window.innerWidth - htmlEl.clientWidth;
          if (scrollbarWidth > 0) {
            bodyEl.style.paddingRight = `${scrollbarWidth}px`;
          }
          htmlEl.classList.add('modal-scroll-locked');
          bodyEl.classList.add('modal-scroll-locked');
        }
      } else if (bodyEl.classList.contains('modal-scroll-locked')) {
        htmlEl.classList.remove('modal-scroll-locked');
        bodyEl.classList.remove('modal-scroll-locked');
        bodyEl.style.paddingRight = '';
      }
    };

    syncBodyScrollLock();
    const observer = new MutationObserver(syncBodyScrollLock);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('modal-scroll-locked');
      document.body.classList.remove('modal-scroll-locked');
      document.body.style.paddingRight = '';
    };
  }, []);

  const toggleLang = () => setLang((l) => (l === 'en' ? 'bn' : 'en'));

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    sessionStore.logout();
    navigate('dashboard', true);
    setShowCommandPalette(false);
    setShowBroadcast(false);
    showToast(lang === 'en' ? 'You have been signed out.' : 'আপনি সাইন আউট হয়েছেন।', 'info');
  };

  const onNavigate = (v: AppView) => {
    go(v);
    setIsMobileSidebarOpen(false);
  };

  const shellClass = `app-shell${lang === 'bn' ? ' lang-bn' : ''}`;

  if (!user) {
    return (
      <div className={shellClass} data-theme={theme}>
        <LoginPage lang={lang} onLangToggle={toggleLang} />
        <DemoPanel lang={lang} theme={theme} onToggleTheme={toggleTheme} onLangToggle={toggleLang} />
        <ToastManager />
      </div>
    );
  }

  const role = user.role;
  const isChat = view === 'inner_circle';

  return (
    <div
      className={`${shellClass}${isSidebarCollapsed ? ' sidebar-collapsed-shell' : ''}${isChat ? ' chat-view-shell' : ''}`}
      data-theme={theme}
    >
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
        onNavigate={onNavigate}
        lang={lang}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className={`main-wrapper${isSidebarCollapsed ? ' sidebar-collapsed' : ''}${isChat ? ' chat-view-wrapper' : ''}`}>
        <Topbar
          role={role}
          lang={lang}
          view={view}
          theme={theme}
          onLangToggle={toggleLang}
          onToggleTheme={toggleTheme}
          onOpenSearch={() => setShowCommandPalette(true)}
          onNavigate={onNavigate}
          onBroadcastOpen={() => setShowBroadcast(true)}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <AnnouncementBanner lang={lang} />

        <main className={`page-content${isChat ? ' no-padding-chat' : ''}`}>
          <div key={view} className="view-transition-wrapper">
            <Suspense fallback={<ViewSkeleton />}>
              {view === 'dashboard'      && <DashboardView      role={role} lang={lang} onNavigate={onNavigate} />}
              {view === 'inner_circle'   && <InnerCircleChat    role={role} lang={lang} />}
              {view === 'notesheet'      && <NotesheetView      role={role} lang={lang} />}
              {view === 'compliance'     && <ComplianceView     role={role} lang={lang} />}
              {(view === 'fleet' || view === 'vehicle_request') && <FleetView role={role} lang={lang} />}
              {view === 'bus'            && <BusView            role={role} lang={lang} />}
              {view === 'parcel'         && <ParcelView         role={role} lang={lang} />}
              {view === 'attendance'     && <AttendanceView     role={role} lang={lang} onNavigate={onNavigate} />}
              {view === 'incident'       && <IncidentView       role={role} lang={lang} onNavigate={onNavigate} />}
              {view === 'claims'         && <ClaimsView         role={role} lang={lang} />}
              {view === 'asset'          && <AssetView          role={role} lang={lang} onNavigate={onNavigate} />}
              {view === 'guest'          && <GuestView          role={role} lang={lang} />}
              {view === 'workforce'      && <WorkforceView      role={role} lang={lang} />}
              {view === 'approvals'      && <ApprovalsView      role={role} lang={lang} />}
            </Suspense>
          </div>
        </main>
      </div>

      <MobileBottomNav
        role={role}
        activeView={view}
        onNavigate={onNavigate}
        lang={lang}
        onOpenMenu={() => setIsMobileSidebarOpen(true)}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={onNavigate}
        onToggleTheme={toggleTheme}
        lang={lang}
        currentTheme={theme}
        role={role}
      />

      {showBroadcast && <BroadcastModal lang={lang} onClose={() => setShowBroadcast(false)} />}
      <DemoPanel lang={lang} theme={theme} onToggleTheme={toggleTheme} onLangToggle={toggleLang} />
      <ToastManager />
    </div>
  );
}
