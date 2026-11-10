import { useState, useEffect, type ReactNode } from 'react';
import { ViewProps, t, AppView } from '../types';
import { Car, MapPin, Bus, Receipt, QrCode, CalendarCheck, Mic } from 'lucide-react';
import { showToast } from '../components/ToastManager';
import AnimatedCounter from '../components/AnimatedCounter';
import ApprovalReviewHost from './approvals/ApprovalReviewHost';
import { useCan } from '../auth/session';
import { Button } from '../components/ui';

import { DASHBOARD_CONFIG, type AttentionItem } from './dashboard/config';
import { useDashboardData } from './dashboard/useDashboardData';
import NeedsYou from './dashboard/NeedsYou';
import VoiceBriefingBar from './dashboard/VoiceBriefingBar';

import ChairmanDashboard from './dashboard/ChairmanDashboard';
import PlantGmDashboard from './dashboard/PlantGmDashboard';
import TransportAdminDashboard from './dashboard/TransportAdminDashboard';
import HrAdminDashboard from './dashboard/HrAdminDashboard';
import HodDashboard from './dashboard/HodDashboard';
import EmployeeDashboard from './dashboard/EmployeeDashboard';
import DriverDashboard from './dashboard/DriverDashboard';
import SendVoiceBriefingModal from '../components/dashboard/SendVoiceBriefingModal';

interface DashboardViewProps extends ViewProps {
  onNavigate?: (view: AppView) => void;
}

interface ActionTileProps {
  tone: 'info' | 'warning' | 'success' | 'purple';
  icon: ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}

/** Big, tappable shortcut for an everyday task: what it is, and where it stands. */
function ActionTile({ tone, icon, title, hint, onClick }: ActionTileProps) {
  return (
    <button type="button" className={`dash-tile tone-${tone}`} onClick={onClick}>
      <span className="dash-tile-icon" aria-hidden>{icon}</span>
      <strong>{title}</strong>
      <small>{hint}</small>
    </button>
  );
}

export default function DashboardView({ role, lang, onNavigate }: DashboardViewProps) {
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showBatchReleaseModal, setShowBatchReleaseModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showVoiceBriefingModal, setShowVoiceBriefingModal] = useState(false);
  const [driverSosSent, setDriverSosSent] = useState(false);

  const data = useDashboardData();
  const cfg = DASHBOARD_CONFIG[role];
  const canBroadcast = useCan('notices:broadcast');
  const tabs = cfg.tabs(data);
  const stats = cfg.stats(data);
  const attention = cfg.attention(data);

  useEffect(() => {
    setActiveTab('overview');
  }, [role]);

  const openAttention = (item: AttentionItem) => {
    if (item.tab) setActiveTab(item.tab);
    else if (item.view) onNavigate?.(item.view);
  };

  const showVoiceBriefing = role === 'chairman' && canBroadcast;
  const hasHeaderActions =
    showVoiceBriefing || role === 'plant_gm' || role === 'employee' || role === 'driver';
  const showTabs = tabs.length > 1;

  const myRequisition = data.fleet.myRequisitions[0] ?? null;
  const myRecord = data.workforce.myRecord;
  const punchedIn = !!myRecord && myRecord.locationStatus !== 'absent';
  const bnNum = (n: number) => (lang === 'bn' ? n.toLocaleString('bn-BD') : String(n));

  return (
    <div className="view-container page-enter-active">
      {(showTabs || hasHeaderActions) && (
        <div className="cockpit-tabs-sticky-wrapper">
            {showTabs && (
              <div className="cockpit-tabs-container" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`cockpit-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    <span>{t(tab.label[0], tab.label[1], lang)}</span>
                    {tab.badge !== undefined && (
                      <span className={`cockpit-tab-badge ${tab.badgeType || ''}`}>{tab.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {hasHeaderActions && (
              <div className="cockpit-toolbar-actions">
                {showVoiceBriefing && (
                  <Button variant="gold" size="sm" icon={<Mic size={13} />} onClick={() => setShowVoiceBriefingModal(true)}>
                    {t('Send voice briefing', 'ভয়েস ব্রিফিং পাঠান', lang)}
                  </Button>
                )}
                {role === 'plant_gm' && (
                  <Button variant="gold" size="sm" onClick={() => setShowBatchReleaseModal(true)}>
                    {t('Release bitumen batch', 'বিটুমিন ব্যাচ রিলিজ', lang)}
                  </Button>
                )}
                {role === 'employee' && (
                  <Button variant="gold" size="sm" icon={<QrCode size={13} />} onClick={() => setShowGatePassModal(true)}>
                    {t('Digital gate pass', 'ডিজিটাল গেট পাস', lang)}
                  </Button>
                )}
                {role === 'driver' && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={driverSosSent}
                    onClick={() => {
                      setDriverSosSent(true);
                      showToast(t('Emergency alert sent to the transport desk with your last known location.', 'জরুরি সংকেত আপনার সর্বশেষ অবস্থানসহ পরিবহন ডেস্কে পাঠানো হয়েছে।', lang), 'danger');
                    }}
                  >
                    {driverSosSent
                      ? t('Alert sent', 'সংকেত পাঠানো হয়েছে', lang)
                      : t('Emergency SOS', 'জরুরি এসওএস', lang)}
                  </Button>
                )}
              </div>
            )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="tab-pane-fade dash-overview">
          <NeedsYou items={attention} lang={lang} onOpen={openAttention} />

          {role === 'chairman' && <VoiceBriefingBar lang={lang} />}

          {role === 'employee' && (
            <>
              <div className="dash-tiles">
                <ActionTile
                  tone="info" icon={<MapPin size={20} />}
                  title={t('Attendance', 'উপস্থিতি', lang)}
                  hint={punchedIn && myRecord ? t(`Punched in ${myRecord.inTime}`, `পাঞ্চ-ইন ${myRecord.inTime}`, lang) : t('Punch in now', 'এখন পাঞ্চ-ইন করুন', lang)}
                  onClick={() => onNavigate?.('attendance')}
                />
                <ActionTile
                  tone="warning" icon={<Car size={20} />}
                  title={t('Request a vehicle', 'গাড়ি আবেদন', lang)}
                  hint={data.fleet.myRequisitions.length > 0
                    ? t(`${data.fleet.myRequisitions.length} active`, `${bnNum(data.fleet.myRequisitions.length)}টি সক্রিয়`, lang)
                    : t('For duty travel', 'অফিসিয়াল ভ্রমণের জন্য', lang)}
                  onClick={() => onNavigate?.('fleet')}
                />
                <ActionTile
                  tone="success" icon={<Bus size={20} />}
                  title={t('Shuttle bus', 'শাটল বাস', lang)}
                  hint={data.shuttle.mySeat
                    ? t(`Seat #${data.shuttle.mySeat.num} confirmed`, `আসন #${data.shuttle.mySeat.num} নিশ্চিত`, lang)
                    : t('Book a seat', 'আসন বুক করুন', lang)}
                  onClick={() => onNavigate?.('bus')}
                />
                <ActionTile
                  tone="purple" icon={<Receipt size={20} />}
                  title={t('Submit a claim', 'দাবি জমা দিন', lang)}
                  hint={data.claims.minePending.length > 0
                    ? t(`${data.claims.minePending.length} under review`, `${bnNum(data.claims.minePending.length)}টি পর্যালোচনাধীন`, lang)
                    : t('Travel and conveyance', 'ভ্রমণ ও যাতায়াত', lang)}
                  onClick={() => onNavigate?.('claims')}
                />
                <ActionTile
                  tone="info" icon={<CalendarCheck size={20} />}
                  title={t('My leave', 'আমার ছুটি', lang)}
                  hint={t(`${data.workforce.myCasualLeaveBalance} casual days left`, `${bnNum(data.workforce.myCasualLeaveBalance)} দিন ক্যাজুয়াল ছুটি বাকি`, lang)}
                  onClick={() => setActiveTab('activity')}
                />
              </div>

              {myRequisition && (
                <section className={`dash-trip ${myRequisition.status === 'pending' ? 'is-pending' : 'is-ready'}`} aria-label={t('Your vehicle request', 'আপনার যানবাহন আবেদন', lang)}>
                  <Car size={20} aria-hidden />
                  <div>
                    <strong>
                      {myRequisition.status === 'pending'
                        ? t('Waiting for the transport desk to assign a vehicle', 'পরিবহন ডেস্কের গাড়ি বরাদ্দের অপেক্ষায়', lang)
                        : myRequisition.status === 'in_transit'
                          ? t('Your trip is in progress', 'আপনার ট্রিপ চলমান', lang)
                          : t('Vehicle and driver assigned for your trip', 'আপনার ট্রিপের জন্য গাড়ি ও চালক বরাদ্দ', lang)}
                    </strong>
                    <span>
                      {myRequisition.from.split(',')[0]} → {myRequisition.to.split(',')[0]} · {t('departs', 'ছাড়বে', lang)} {myRequisition.departureTime}
                    </span>
                    {myRequisition.assignedVehiclePlate && (
                      <span className="dash-trip-who">
                        {myRequisition.assignedVehiclePlate} · {myRequisition.assignedDriverName}
                        {myRequisition.assignedDriverPhone ? ` · ${myRequisition.assignedDriverPhone}` : ''}
                      </span>
                    )}
                  </div>
                </section>
              )}

              <EmployeeDashboard
                role={role}
                lang={lang}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                showGatePassModal={showGatePassModal}
                setShowGatePassModal={setShowGatePassModal}
                onNavigate={onNavigate}
              />
            </>
          )}

          {stats.length > 0 && (
            <div className="stats-grid mb-5">
              {stats.map((s, i) => {
                // Chairman stat cards open the matching tab or module on click.
                const chairmanNavTargets: Array<{ tab?: string; view?: AppView }> = [
                  { view: 'workforce' },
                  { tab: 'approvals' },
                  { view: 'compliance' },
                  { view: 'incident' },
                ];
                const navTarget = role === 'chairman' ? chairmanNavTargets[i] : null;
                const isClickable = !!navTarget;
                return (
                  <div
                    key={i}
                    className={`stat-card ${s.type}${isClickable ? ' interactive-row' : ''}`}
                    style={isClickable ? { cursor: 'pointer' } : undefined}
                    onClick={isClickable ? () => {
                      if (navTarget?.tab) setActiveTab(navTarget.tab);
                      else if (navTarget?.view) onNavigate?.(navTarget.view);
                    } : undefined}
                    title={isClickable ? t('Click to view details', 'বিস্তারিত দেখুন', lang) : undefined}
                  >
                    <div className="stat-top">
                      <div className="stat-label">{t(s.label[0], s.label[1], lang)}</div>
                      <div className="stat-icon-wrap">{s.icon}</div>
                    </div>
                    <div className="stat-main-row">
                      <div className="stat-value"><AnimatedCounter value={s.value} /></div>
                    </div>
                    <div className="stat-sub">{t(s.sub[0], s.sub[1], lang)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Per-role tabs */}
      {role === 'chairman' && (
        <ChairmanDashboard
          role={role}
          lang={lang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenDetailDrawer={setSelectedDrawerItem}
        />
      )}

      {role === 'plant_gm' && (
        <PlantGmDashboard
          role={role}
          lang={lang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showBatchReleaseModal={showBatchReleaseModal}
          setShowBatchReleaseModal={setShowBatchReleaseModal}
        />
      )}

      {role === 'transport_admin' && (
        <TransportAdminDashboard
          role={role}
          lang={lang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {role === 'hr_admin' && (
        <HrAdminDashboard
          role={role}
          lang={lang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigate={onNavigate}
        />
      )}

      {role === 'hod' && (
        <HodDashboard
          role={role}
          lang={lang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {role === 'employee' && activeTab !== 'overview' && (
        <EmployeeDashboard
          role={role}
          lang={lang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showGatePassModal={showGatePassModal}
          setShowGatePassModal={setShowGatePassModal}
          onNavigate={onNavigate}
        />
      )}

      {role === 'driver' && (
        <DriverDashboard
          role={role}
          lang={lang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      <ApprovalReviewHost openId={selectedDrawerItem} lang={lang} onOpen={setSelectedDrawerItem} />

      {canBroadcast && (
        <SendVoiceBriefingModal
          isOpen={showVoiceBriefingModal}
          onClose={() => setShowVoiceBriefingModal(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
