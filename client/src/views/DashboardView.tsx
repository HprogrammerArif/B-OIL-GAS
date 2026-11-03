import { useState, useEffect } from 'react';
import { ViewProps, t, AppView } from '../types';
import { Car, ArrowRight, MapPin, Bus, Receipt, QrCode, ShieldAlert, ShieldCheck } from 'lucide-react';
import { showToast } from '../components/ToastManager';
import AnimatedCounter from '../components/AnimatedCounter';
import ApprovalReviewHost from './approvals/ApprovalReviewHost';
import { useCan } from '../auth/session';
import { StatusPill, type StatusTone } from '../components/ui';

import { DASHBOARD_CONFIG, type Tone } from './dashboard/config';
import { useDashboardData } from './dashboard/useDashboardData';

import ChairmanDashboard from './dashboard/ChairmanDashboard';
import PlantGmDashboard from './dashboard/PlantGmDashboard';
import TransportAdminDashboard from './dashboard/TransportAdminDashboard';
import HrAdminDashboard from './dashboard/HrAdminDashboard';
import HodDashboard from './dashboard/HodDashboard';
import EmployeeDashboard from './dashboard/EmployeeDashboard';
import DriverDashboard from './dashboard/DriverDashboard';
import SendVoiceBriefingModal from '../components/dashboard/SendVoiceBriefingModal';
import { useVoiceBriefingStore } from '../store/voiceBriefingStore';

interface DashboardViewProps extends ViewProps {
  onNavigate?: (view: AppView) => void;
}

const TONE_COLOR: Record<Tone, string> = {
  success: 'var(--status-success-bright)',
  info: 'var(--status-info-bright)',
  warning: 'var(--status-warning-bright)',
  danger: 'var(--status-danger-bright)',
  purple: 'var(--status-purple-bright)',
  gold: 'var(--brand-gold)',
  neutral: 'var(--text-inverse-2)',
};

const TONE_PILL: Record<Tone, StatusTone> = {
  success: 'success',
  info: 'info',
  warning: 'warn',
  danger: 'danger',
  purple: 'purple',
  gold: 'gold',
  neutral: 'neutral',
};

export default function DashboardView({ role, lang, onNavigate }: DashboardViewProps) {
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showBatchReleaseModal, setShowBatchReleaseModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showVoiceBriefingModal, setShowVoiceBriefingModal] = useState(false);

  const { activeBriefing, isPlaying, setIsPlaying } = useVoiceBriefingStore();
  const data = useDashboardData();
  const cfg = DASHBOARD_CONFIG[role];
  const canBroadcast = useCan('notices:broadcast');
  const heroStats = cfg.hero(data);
  const tabs = cfg.tabs(data);
  const stats = cfg.stats(data);
  const jumpCards = cfg.jumpCards(data);

  const handleToggleRibbonPlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsPlaying(true);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && activeBriefing) {
        window.speechSynthesis.cancel();
        const textToSpeak = lang === 'bn' ? activeBriefing.transcriptBn : activeBriefing.transcript;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  useEffect(() => {
    setActiveTab('overview');
  }, [role]);

  /* Chairman's briefing — three points derived from live data */
  const briefingPoints = (() => {
    const top = data.approvals.highestValue;
    const lic = data.compliance.nearest;
    const open = data.incidents.open.length;
    return [
      top
        ? t(`Highest-value file awaiting you: ${top.title}${top.amount ? ` (${top.amount})` : ''}`, `আপনার অপেক্ষায় সর্বোচ্চ মূল্যের ফাইল: ${top.titleBn || top.title}${top.amount ? ` (${top.amount})` : ''}`, lang)
        : t('No high-value files are waiting on your signature', 'আপনার স্বাক্ষরের অপেক্ষায় কোনো উচ্চমূল্যের ফাইল নেই', lang),
      lic
        ? t(`${lic.title} renewal due in ${lic.daysLeft} days`, `${lic.titleBn} নবায়ন ${lic.daysLeft.toLocaleString('bn-BD')} দিনের মধ্যে`, lang)
        : t('No statutory permits fall due in the next 90 days', 'আগামী ৯০ দিনে কোনো লাইসেন্স নবায়ন নেই', lang),
      t(`${open} open incident ${open === 1 ? 'file' : 'files'}, ${data.incidents.highRisk} rated high or extreme risk`, `${open.toLocaleString('bn-BD')}টি খোলা দুর্ঘটনা ফাইল, ${data.incidents.highRisk.toLocaleString('bn-BD')}টি উচ্চ ঝুঁকির`, lang),
    ];
  })();

  const topRiskIncident = data.incidents.open.find((i) => i.riskCategory === 'extreme' || i.riskCategory === 'high') ?? null;
  const myRequisition = data.fleet.myRequisitions[0] ?? null;
  const myRecord = data.workforce.myRecord;
  const punchedIn = !!myRecord && myRecord.locationStatus !== 'absent';

  return (
    <div className="view-container page-enter-active">

      {/* ═══════════════════════════════════════════
          HERO STRIP — three live numbers for this role
          ═══════════════════════════════════════════ */}
      <div className="roi-banner" style={role === 'chairman' ? { borderTop: '3px solid var(--brand-gold)' } : undefined}>
        <div className="roi-stats-row">
          {heroStats.map((s, i) => (
            <div key={i} className="roi-stat-item">
              <div className="val" style={s.tone && s.tone !== 'gold' ? { color: TONE_COLOR[s.tone] } : undefined}>
                <AnimatedCounter value={typeof s.value === 'string' ? s.value : t(s.value[0], s.value[1], lang)} />
              </div>
              <div className="lbl">{t(s.label[0], s.label[1], lang)}</div>
            </div>
          ))}
        </div>

        {/* Primary action for this role */}
        {role === 'plant_gm' && (
          <button className="btn-gold" style={{ fontSize: '11.5px', padding: '6px 14px', fontWeight: 800 }}
            onClick={() => setShowBatchReleaseModal(true)}>
            ★ {t('Release Bitumen Batch', 'বিটুমিন ব্যাচ রিলিজ', lang)}
          </button>
        )}

        {role === 'employee' && (
          <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}
            onClick={() => setShowGatePassModal(true)}>
            <QrCode size={13} style={{ display: 'inline', marginRight: '5px' }} />
            {t('Digital Gate Pass', 'ডিজিটাল গেট পাস', lang)}
          </button>
        )}

        {role === 'driver' && (
          <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}
            onClick={() => showToast(t('Emergency alert sent to the transport desk with your last known location.', 'জরুরি সংকেত আপনার সর্বশেষ অবস্থানসহ পরিবহন ডেস্কে পাঠানো হয়েছে।', lang), 'danger')}>
            🚨 {t('Emergency SOS', 'জরুরি এসওএস', lang)}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          COCKPIT SEGMENTED TABS BAR
          ═══════════════════════════════════════════ */}
      <div className="cockpit-tabs-container mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`cockpit-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{t(tab.label[0], tab.label[1], lang)}</span>
            {tab.badge !== undefined && (
              <span className={`cockpit-tab-badge ${tab.badgeType || ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TAB CONTENT: OVERVIEW
          ═══════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="tab-pane-fade">
          {/* CHAIRMAN: Decision briefing with voice memo player */}
          {role === 'chairman' && (
            <div className="exec-ribbon" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div className="ribbon-left">
                  <div className="ribbon-icon">👑</div>
                  <div className="ribbon-text">
                    <h4>{t('Today\'s decision briefing', 'আজকের সিদ্ধান্ত ব্রিফিং', lang)}</h4>
                    <p>{briefingPoints.map((p, i) => `${i + 1}. ${p}`).join(' • ')}</p>
                  </div>
                </div>
                {canBroadcast && (
                  <button
                    type="button"
                    className="btn-ribbon"
                    onClick={() => setShowVoiceBriefingModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
                  >
                    🎙️ {t('Send Voice Briefing', 'ভয়েস ব্রিফিং পাঠান', lang)}
                  </button>
                )}
              </div>

              {activeBriefing && (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
                    <button
                      type="button"
                      onClick={handleToggleRibbonPlay}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: isPlaying ? 'var(--status-success-solid)' : 'var(--brand-gold)',
                        border: 'none',
                        color: 'var(--text-1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: 900,
                        fontSize: '13px',
                        flexShrink: 0,
                        boxShadow: isPlaying ? '0 0 12px rgba(16, 185, 129, 0.6)' : '0 2px 6px rgba(0,0,0,0.3)',
                      }}
                      title={isPlaying ? t('Pause voice briefing', 'ভয়েস ব্রিফিং থামান', lang) : t('Listen to voice briefing', 'ভয়েস ব্রিফিং শুনুন', lang)}
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--status-warning-bright)' }}>
                          🎙️ {t(activeBriefing.title, activeBriefing.titleBn, lang)}
                        </span>
                        <span className="badge" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          {t('Voice memo', 'ভয়েস মেমো', lang)}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-inverse-2)', marginTop: '2px', fontStyle: 'italic', maxWidth: '580px' }}>
                        "{t(activeBriefing.transcript, activeBriefing.transcriptBn, lang)}"
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '18px' }}>
                      {[12, 18, 8, 22, 14, 20, 10, 16].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            width: '2.5px',
                            height: isPlaying ? `${Math.max(4, (h * (1 + Math.sin(i + Date.now() / 150))) % 20)}px` : '4px',
                            background: isPlaying ? 'var(--status-success-bright)' : 'var(--surface-inverse-3)',
                            borderRadius: '1px',
                            transition: 'height 0.15s ease',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      00:{activeBriefing.durationSeconds < 10 ? `0${activeBriefing.durationSeconds}` : activeBriefing.durationSeconds}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                      • {activeBriefing.recordedAt}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PLANT GM: Safety status strip driven by the incident register */}
          {role === 'plant_gm' && (
            topRiskIncident ? (
              <div className="dcs-alarm-banner">
                <div className="ribbon-left">
                  <div className="ribbon-icon"><ShieldAlert size={22} /></div>
                  <div className="ribbon-text">
                    <h4>{t('High-risk incident open', 'উচ্চ ঝুঁকির দুর্ঘটনা খোলা আছে', lang)} — {topRiskIncident.incNo}</h4>
                    <p>{t(topRiskIncident.title, topRiskIncident.titleBn, lang)} · {topRiskIncident.location} · {t('Risk score', 'ঝুঁকি স্কোর', lang)} {topRiskIncident.riskScore}/25</p>
                  </div>
                </div>
                <button className="btn-ribbon" style={{ background: 'var(--status-danger-solid)' }} onClick={() => onNavigate?.('incident')}>
                  {t('Open incident file', 'দুর্ঘটনা ফাইল খুলুন', lang)}
                </button>
              </div>
            ) : (
              <div className="exec-ribbon">
                <div className="ribbon-left">
                  <div className="ribbon-icon"><ShieldCheck size={22} /></div>
                  <div className="ribbon-text">
                    <h4>{t('No high-risk incidents open', 'কোনো উচ্চ ঝুঁকির দুর্ঘটনা খোলা নেই', lang)}</h4>
                    <p>{t(`${data.incidents.open.length} incident files in progress · ${data.maintenance.openWorkOrders} open work orders`, `${data.incidents.open.length.toLocaleString('bn-BD')}টি দুর্ঘটনা ফাইল চলমান · ${data.maintenance.openWorkOrders.toLocaleString('bn-BD')}টি খোলা কার্যাদেশ`, lang)}</p>
                  </div>
                </div>
                <button className="btn-ribbon" onClick={() => onNavigate?.('incident')}>
                  {t('Incident register', 'দুর্ঘটনা রেজিস্টার', lang)}
                </button>
              </div>
            )
          )}

          {/* EMPLOYEE: Quick actions */}
          {role === 'employee' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--status-info-border)', background: 'var(--status-info-bg)' }}
                  onClick={() => onNavigate?.('attendance')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--status-info-solid)', color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <MapPin size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--status-info-text)' }}>{t('Attendance', 'উপস্থিতি', lang)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--status-info-bright)', marginTop: '2px' }}>
                    {punchedIn && myRecord ? t(`Punched in ${myRecord.inTime}`, `পাঞ্চ-ইন ${myRecord.inTime}`, lang) : t('Punch in now', 'এখন পাঞ্চ-ইন করুন', lang)}
                  </div>
                </div>

                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--brand-gold-muted)', background: 'var(--brand-card-bg)' }}
                  onClick={() => onNavigate?.('fleet')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--status-warning-solid)', color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Car size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-gold-dark)' }}>{t('Request Vehicle', 'গাড়ি আবেদন', lang)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                    {data.fleet.myRequisitions.length > 0
                      ? t(`${data.fleet.myRequisitions.length} active request${data.fleet.myRequisitions.length === 1 ? '' : 's'}`, `${data.fleet.myRequisitions.length.toLocaleString('bn-BD')}টি সক্রিয় আবেদন`, lang)
                      : t('Duty travel', 'অফিসিয়াল ভ্রমণ', lang)}
                  </div>
                </div>

                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--status-success-border)', background: 'var(--status-success-bg)' }}
                  onClick={() => onNavigate?.('bus')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--status-success-solid)', color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Bus size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--status-success-text)' }}>{t('Shuttle Bus', 'শাটল বাস', lang)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--status-success)', marginTop: '2px' }}>
                    {data.shuttle.mySeat
                      ? t(`Seat #${data.shuttle.mySeat.num} confirmed`, `আসন #${data.shuttle.mySeat.num} নিশ্চিত`, lang)
                      : t('Book a seat', 'আসন বুক করুন', lang)}
                  </div>
                </div>

                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--status-purple-border)', background: 'var(--status-purple-bg)' }}
                  onClick={() => onNavigate?.('claims')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--status-purple-solid)', color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Receipt size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--status-purple-text)' }}>{t('Submit Claim', 'দাবি জমা দিন', lang)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--status-purple)', marginTop: '2px' }}>
                    {data.claims.minePending.length > 0
                      ? t(`${data.claims.minePending.length} under review`, `${data.claims.minePending.length.toLocaleString('bn-BD')}টি পর্যালোচনাধীন`, lang)
                      : t('TA/DA & conveyance', 'টিএ/ডিএ ও যাতায়াত', lang)}
                  </div>
                </div>
              </div>

              {/* My active vehicle requisition */}
              {myRequisition && (
                <div className="card mb-4" style={{ background: myRequisition.status === 'pending' ? 'var(--status-warning-bg)' : 'var(--status-success-bg)', border: `1px solid ${myRequisition.status === 'pending' ? 'var(--status-warning-bright)' : 'var(--status-success-bright)'}`, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Car size={20} color={myRequisition.status === 'pending' ? 'var(--status-warning)' : 'var(--status-success)'} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-1)' }}>
                          {myRequisition.status === 'pending'
                            ? t('Vehicle requisition awaiting the transport desk', 'যানবাহন আবেদন পরিবহন ডেস্কের অপেক্ষায়', lang)
                            : myRequisition.status === 'in_transit'
                              ? t('Your trip is in progress', 'আপনার ট্রিপ চলমান', lang)
                              : t('Vehicle and driver allocated for your trip', 'আপনার ট্রিপের জন্য গাড়ি ও চালক বরাদ্দ', lang)}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-2)' }}>
                          {myRequisition.id} • {myRequisition.from.split(',')[0]} ➔ {myRequisition.to.split(',')[0]} ({myRequisition.tripType === 'round_trip' ? t('Round trip', 'যাওয়া-আসা', lang) : t('One-way', 'একমুখী', lang)}) • {t('Departure', 'ছাড়বে', lang)}: {myRequisition.departureTime}
                        </div>
                        {myRequisition.assignedVehiclePlate && (
                          <div style={{ fontSize: '12px', color: 'var(--status-success-text)', fontWeight: 700, marginTop: '3px' }}>
                            {myRequisition.assignedVehiclePlate} • {myRequisition.assignedDriverName}{myRequisition.assignedDriverPhone ? ` (📞 ${myRequisition.assignedDriverPhone})` : ''}{myRequisition.tripPassNo ? ` • ${t('Pass', 'পাস', lang)} #${myRequisition.tripPassNo}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${myRequisition.status === 'pending' ? 'warn' : 'success'}`}>
                      {myRequisition.status === 'pending' ? t('Pending', 'অপেক্ষমান', lang) : myRequisition.status === 'in_transit' ? t('In transit', 'চলমান', lang) : t('Assigned', 'বরাদ্দকৃত', lang)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* CHAIRMAN: Quick-Action Command Bar */}
          {role === 'chairman' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                className="btn-gold"
                style={{ fontSize: '12px', padding: '8px 16px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', flex: '1 1 auto', justifyContent: 'center' }}
                onClick={() => setActiveTab('approvals')}
              >
                ⚡ {t(`Sign Pending Files (${data.approvals.pending.length})`, `ফাইলে স্বাক্ষর করুন (${data.approvals.pending.length})`, lang)}
              </button>
              <button
                className="btn-outline"
                style={{ fontSize: '12px', padding: '8px 16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', flex: '1 1 auto', justifyContent: 'center' }}
                onClick={() => setActiveTab('notices')}
              >
                📢 {t('Publish Notice', 'নোটিশ প্রকাশ করুন', lang)}
              </button>
              <button
                className="btn-outline"
                style={{ fontSize: '12px', padding: '8px 16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', flex: '1 1 auto', justifyContent: 'center' }}
                onClick={() => setActiveTab('inner_circle')}
              >
                👥 {t('Inner Circle', 'ইনার সার্কেল', lang)}
              </button>
            </div>
          )}

          {/* KPI GRID */}
          <div className="stats-grid mb-5">
            {stats.map((s, i) => {
              // Chairman stat cards navigate to relevant tabs/views on click
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

          {/* JUMP CARDS */}
          <div className="tab-jump-grid">
            {jumpCards.map((card) => (
              <div key={card.tab} className="tab-jump-card interactive-row" onClick={() => setActiveTab(card.tab)}>
                <div className="tab-jump-top">
                  <div className="tab-jump-title">
                    {card.icon}
                    <span>{t(card.title[0], card.title[1], lang)}</span>
                  </div>
                  <StatusPill tone={TONE_PILL[card.badge.tone]}>{t(card.badge.text[0], card.badge.text[1], lang)}</StatusPill>
                </div>
                <div className="tab-jump-desc">{t(card.desc[0], card.desc[1], lang)}</div>
                <div className="tab-jump-footer">
                  <span>{t(card.cta[0], card.cta[1], lang)}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          ROLE SUB-DASHBOARDS
          ═══════════════════════════════════════════ */}
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

      {role === 'employee' && (
        <EmployeeDashboard
          role={role}
          lang={lang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showGatePassModal={showGatePassModal}
          setShowGatePassModal={setShowGatePassModal}
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
