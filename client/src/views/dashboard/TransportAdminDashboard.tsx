import { DashboardSubViewProps } from './types';
import TransportRequests from './TransportRequests';
import TransportTrips from './TransportTrips';

export default function TransportAdminDashboard({ lang, activeTab }: DashboardSubViewProps) {
  return (
    <>
      {activeTab === 'requisitions' && <TransportRequests lang={lang} />}
      {activeTab === 'corridor' && <TransportTrips lang={lang} />}
    </>
  );
}
