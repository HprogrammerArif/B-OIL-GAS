import type { AppView } from '../../types';
import { DashboardSubViewProps } from './types';
import HrClearances from './HrClearances';
import HrSites from './HrSites';

interface HrAdminDashboardProps extends DashboardSubViewProps {
  onNavigate?: (view: AppView) => void;
}

export default function HrAdminDashboard({ lang, activeTab, onNavigate }: HrAdminDashboardProps) {
  const openWorkforce = () => onNavigate?.('workforce');

  return (
    <>
      {activeTab === 'clearance' && <HrClearances lang={lang} onOpenWorkforce={openWorkforce} />}
      {activeTab === 'sites' && <HrSites lang={lang} onOpenWorkforce={openWorkforce} />}
    </>
  );
}
