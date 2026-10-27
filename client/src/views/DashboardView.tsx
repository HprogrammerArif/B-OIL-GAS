import React, { useState, useEffect } from 'react';
import { ViewProps, t } from '../types';
import {
  Users, FileCheck, Crown, Gauge, Truck, Car, Briefcase,
  BarChart3, Navigation, Bell, UserCheck, Activity,
  Lock, ArrowRight, MapPin, Bus, Receipt, QrCode
} from 'lucide-react';
import { showToast } from '../App';
import AnimatedCounter from '../components/AnimatedCounter';
import Sparkline from '../components/Sparkline';
import DetailDrawer, { DetailDrawerData } from '../components/DetailDrawer';
import { useFleetStore } from '../store/fleetStore';

import {
  ROLE_STATS,
  PENDING_APPROVALS,
  INNER_CIRCLE,
  NOTICE_BOARD,
  DCS_ALARMS,
  INITIAL_LOTO_PERMITS,
  INITIAL_HOD_QUEUE
} from './dashboard/dashboardData';

import ChairmanDashboard from './dashboard/ChairmanDashboard';
import PlantGmDashboard from './dashboard/PlantGmDashboard';
import TransportAdminDashboard from './dashboard/TransportAdminDashboard';
import HrAdminDashboard from './dashboard/HrAdminDashboard';
import HodDashboard from './dashboard/HodDashboard';
import EmployeeDashboard from './dashboard/EmployeeDashboard';
import DriverDashboard from './dashboard/DriverDashboard';

export default function DashboardView({ role, lang }: ViewProps) {
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<DetailDrawerData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showBatchReleaseModal, setShowBatchReleaseModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [approvedAmountSum, setApprovedAmountSum] = useState(0);

  const { requisitions: sharedRequisitions } = useFleetStore();
  const stats = ROLE_STATS[role] || ROLE_STATS.chairman;

  useEffect(() => {
    setActiveTab('overview');
  }, [role]);

  const getRoleTabs = () => {
    switch (role) {
      case 'chairman':
        return [
          { id: 'overview',     label: 'Strategic Cockpit',    labelBn: 'কক্পিট সংক্ষিপ্ত', icon: <Crown size={15} /> },
          { id: 'approvals',    label: 'Priority Approvals',   labelBn: 'জরুরি অনুমোদন',    icon: <FileCheck size={15} />, badge: PENDING_APPROVALS.length, badgeType: 'danger' as const },
          { id: 'inner_circle', label: 'Inner Circle Roster',  labelBn: 'ইনার সার্কেল',      icon: <Users size={15} />, badge: INNER_CIRCLE.length, badgeType: 'info' as const },
          { id: 'notices',      label: 'Corporate Notices',    labelBn: 'নোটিশ বোর্ড',      icon: <Bell size={15} />, badge: NOTICE_BOARD.filter(n => !n.read).length || undefined, badgeType: 'warn' as const },
        ];
      case 'plant_gm':
        return [
          { id: 'overview',    label: 'Plant SCADA Console',  labelBn: 'প্ল্যান্ট কনসোল',    icon: <Gauge size={15} />, badge: DCS_ALARMS.length, badgeType: 'danger' as const },
          { id: 'refinery',    label: 'Refinery Production',  labelBn: 'উৎপাদন চার্ট',      icon: <BarChart3 size={15} /> },
          { id: 'safety_loto', label: 'LOTO Safety & Shifts', labelBn: 'নিরাপত্তা পারমিট',  icon: <Lock size={15} />, badge: INITIAL_LOTO_PERMITS.length, badgeType: 'warn' as const },
        ];
      case 'transport_admin':
        return [
          { id: 'overview',     label: 'Fleet Operations',     labelBn: 'ফ্লিট হাব',         icon: <Truck size={15} /> },
          { id: 'requisitions', label: 'Travel Requisitions',  labelBn: 'যানবাহন আবেদন',    icon: <Car size={15} />, badge: sharedRequisitions.filter(r => r.status === 'pending').length, badgeType: 'warn' as const },
          { id: 'corridor',     label: 'Corridor Transit HUD', labelBn: 'টোল করিডোর',       icon: <Navigation size={15} /> },
        ];
      case 'hod':
        return [
          { id: 'overview',  label: 'Department Hub',        labelBn: 'বিভাগ হাব',          icon: <Briefcase size={15} /> },
          { id: 'approvals', label: 'Omni-Approval Queue',   labelBn: 'অনুমোদন সারি',       icon: <FileCheck size={15} />, badge: INITIAL_HOD_QUEUE.length, badgeType: 'danger' as const },
        ];
      case 'hr_admin':
        return [
          { id: 'overview',  label: 'Workforce Cockpit',     labelBn: 'কর্মী কক্পিট',      icon: <Users size={15} /> },
          { id: 'clearance', label: 'Exit Clearances',       labelBn: 'ছাড়পত্র অডিট',     icon: <UserCheck size={15} />, badge: '1', badgeType: 'warn' as const },
          { id: 'sites',     label: 'Site Deployment Nodes', labelBn: 'আঞ্চলিক নোড',      icon: <Building2Icon size={15} /> },
        ];
      case 'driver':
        return [
          { id: 'overview', label: 'Duty Cockpit',     labelBn: 'ডিউটি কক্পিট',  icon: <Gauge size={15} /> },
          { id: 'mission',  label: 'Active Mission',   labelBn: 'বর্তমান ট্রিপ',   icon: <Navigation size={15} />, badge: 'LIVE', badgeType: 'info' as const },
          { id: 'tolls',    label: 'Toll & Slips',     labelBn: 'টোল ও স্লিপ',   icon: <Receipt size={15} /> },
        ];
      case 'employee':
      default:
        return [
          { id: 'overview', label: 'Employee Dashboard', labelBn: 'কর্মী ড্যাশবোর্ড', icon: <Users size={15} /> },
          { id: 'activity', label: 'Activity & Leave',   labelBn: 'কার্যক্রম ও ছুটি', icon: <Activity size={15} /> },
        ];
    }
  };

  return (
    <div className="view-container page-enter-active">

      {/* ═══════════════════════════════════════════
          ROI BANNER — Role-specific messaging
          ═══════════════════════════════════════════ */}
      <div className="roi-banner">
        <div className="roi-stats-row">
          {role === 'chairman' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="৳ 4,82,50,000" /></div>
                <div className="lbl">{t('Net Realized Savings & Loss Mitigation', 'সাশ্রয় ও ক্ষতি প্রতিরোধ (চলতি অর্থবছর)', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="284 Days" /></div>
                <div className="lbl">{t('Zero-Shutdown Safety Record', 'শূন্য শাটডাউন নিরাপদ কর্মদিবস', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#38BDF8' }}><AnimatedCounter value="৳ 18.2 Cr" /></div>
                <div className="lbl">{t('October Revenue (Running)', 'অক্টোবর রাজস্ব (চলমান)', lang)}</div>
              </div>
            </>
          )}
          {role === 'plant_gm' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="5,000 MT/Day" /></div>
                <div className="lbl">{t('Refinery Output — Keraniganj', 'রিফাইনারি উৎপাদন — কেরানীগঞ্জ', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="96.3%" /></div>
                <div className="lbl">{t('Overall Equipment Effectiveness (OEE)', 'যন্ত্রপাতি সামগ্রিক কার্যকারিতা', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#FBBF24' }}><AnimatedCounter value="2 Active LOTO" /></div>
                <div className="lbl">{t('Lockout-Tagout Safety Isolations', 'সক্রিয় এলওটিও নিরাপত্তা ট্যাগ', lang)}</div>
              </div>
            </>
          )}
          {role === 'transport_admin' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="24 Heavy Fleet" /></div>
                <div className="lbl">{t('Tankers & Executive Pool', 'ট্যাংকার ও নির্বাহী বহর', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="0.00% Zero Theft" /></div>
                <div className="lbl">{t('Fuel Dip-Rod Variance Today', 'জ্বালানি পরিমাপ নির্ভুলতা', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#38BDF8' }}><AnimatedCounter value="৳ 14,80,000" /></div>
                <div className="lbl">{t('Fleet Cost Savings (AI Pooling)', 'ফ্লিট পুলিং সাশ্রয়', lang)}</div>
              </div>
            </>
          )}
          {role === 'hr_admin' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="743 Personnel" /></div>
                <div className="lbl">{t('Active Group Workforce (3 Sites)', 'মোট জনবল (৩টি আঞ্চলিক নোড)', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="94.8%" /></div>
                <div className="lbl">{t('Haversine Geofence Punch Compliance', 'বায়োমেট্রিক উপস্থিতি হার', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#A78BFA' }}><AnimatedCounter value="100% SAP Synced" /></div>
                <div className="lbl">{t('Zero Payroll Variance in S/4HANA', 'এসএপি পেরোল নির্ভুলতা', lang)}</div>
              </div>
            </>
          )}
          {role === 'hod' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="৳ 38,40,000" /></div>
                <div className="lbl">{t('Department OPEX Burned (72% utilized)', 'চলতি প্রান্তিকে বাজেট ব্যয় (৭২%)', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="৳ 14,80,000" /></div>
                <div className="lbl">{t('Approved Buffer Remaining', 'অনুমোদিত অবশিষ্ট তহবিল', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#F87171' }}><AnimatedCounter value="2 Overdue" /></div>
                <div className="lbl">{t('Claims Requiring Action Today', 'জরুরি অনুমোদন বাকি', lang)}</div>
              </div>
            </>
          )}
          {role === 'employee' && (
            <>
              <div className="roi-stat-item">
                <div className="val"><AnimatedCounter value="22 Days" /></div>
                <div className="lbl">{t('On-Time Attendance This Month', 'চলতি মাসে পূর্ণ উপস্থিতি', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="৳ 4,850" /></div>
                <div className="lbl">{t('Conveyance Claim Under Review', 'যাতায়াত বিল প্রক্রিয়াধীন', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#38BDF8' }}><AnimatedCounter value="8 Days Leave" /></div>
                <div className="lbl">{t('Casual Leave Balance Remaining', 'অবশিষ্ট ক্যাজুয়াল ছুটি স্থিতি', lang)}</div>
              </div>
            </>
          )}
          {role === 'driver' && (
            <>
              <div className="roi-stat-item">
                <div className="val" style={{ color: '#34D399' }}><AnimatedCounter value="0.00% BAC" /></div>
                <div className="lbl">{t('Pre-Trip Breathalyzer Verified', 'ব্রিদলাইজার অ্যালকোহল টেস্ট উত্তীর্ণ', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#38BDF8' }}><AnimatedCounter value="4.2 / 8.0 Hrs" /></div>
                <div className="lbl">{t('Duty Hours Logged Today', 'দৈনিক ড্রাইভিং কর্মঘণ্টা', lang)}</div>
              </div>
              <div className="roi-stat-item divider">
                <div className="val" style={{ color: '#FBBF24' }}><AnimatedCounter value="4.9 / 5.0 ★" /></div>
                <div className="lbl">{t('Passenger Safety & Punctuality Rating', 'যাত্রী নিরাপত্তা ও সময়ানুবর্তিতা রেটিং', lang)}</div>
              </div>
            </>
          )}
        </div>

        {/* Action button inside banner */}
        {role === 'chairman' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 12px' }}
              onClick={() => showToast(t('Executive Audit Report generated.', 'অডিট রিপোর্ট প্রস্তুত', lang), 'gold')}>
              📊 {t('Executive ROI Dossier', 'আরওআই বিবরণী', lang)}
            </button>
          </div>
        )}

        {role === 'plant_gm' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gold" style={{ fontSize: '11.5px', padding: '6px 14px', fontWeight: 800 }}
              onClick={() => setShowBatchReleaseModal(true)}>
              ★ {t('Release Bitumen Batch', 'বিটুমিন ব্যাচ রিলিজ', lang)}
            </button>
          </div>
        )}

        {role === 'hr_admin' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}
              onClick={() => showToast(t('Workforce monthly compliance digest dispatched to Chairman.', 'কর্মশক্তি মাসিক কমপ্লায়েন্স রিপোর্ট প্রস্তুত।', lang), 'gold')}>
              📋 {t('Workforce Audit Dossier', 'কর্মী অডিট বিবরণী', lang)}
            </button>
          </div>
        )}

        {role === 'employee' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}
              onClick={() => setShowGatePassModal(true)}>
              <QrCode size={13} style={{ display: 'inline', marginRight: '5px' }} />
              {t('Digital Gate Pass', 'ডিজিটাল গেট পাস', lang)}
            </button>
          </div>
        )}

        {role === 'driver' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gold" style={{ fontSize: '11px', padding: '6px 14px' }}
              onClick={() => showToast(t('🚨 Central Dispatch notified: GPS location locked and assistance alerted.', 'জরুরি সংকেত ডিসপ্যাচ ডেস্কে পাঠানো হয়েছে।', lang), 'danger')}>
              🚨 {t('Emergency SOS Alert', 'জরুরি রোডসাইড এসওএস', lang)}
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          COCKPIT SEGMENTED TABS BAR
          ═══════════════════════════════════════════ */}
      <div className="cockpit-tabs-container mb-4">
        {getRoleTabs().map(tab => (
          <button
            key={tab.id}
            className={`cockpit-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{t(tab.label, tab.labelBn, lang)}</span>
            {tab.badge !== undefined && (
              <span className={`cockpit-tab-badge ${tab.badgeType || ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TAB CONTENT: OVERVIEW (Lightweight & Uncluttered)
          ═══════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="tab-pane-fade">
          {/* CHAIRMAN: Executive Ribbon */}
          {role === 'chairman' && (
            <div className="exec-ribbon">
              <div className="ribbon-left">
                <div className="ribbon-icon">👑</div>
                <div className="ribbon-text">
                  <h4>{t('Chairman\'s 3-Point Decision Briefing', 'চেয়ারম্যান মহোদয়ের ৩-দফা নীতিগত ব্রিফিং', lang)}</h4>
                  <p>{t(
                    '1. Keraniganj Output: 5,000 MT/Day (96.3%) • 2. Net Cash Outflow Pending: ৳ 48.5L • 3. Explosives License Due: 18 Days',
                    '১. কেরানীগঞ্জ উৎপাদন: ৫,০০০ মে.টন/দিন (৯৬.৩%) • ২. বকেয়া অনুমোদন: ৪৮.৫ লাখ • ৩. বিস্ফোরক লাইসেন্স: ১৮ দিন বাকি',
                    lang
                  )}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-ribbon" onClick={() => showToast('60-Sec Voice Memo delivered.', 'gold')}>
                  🎙️ {t('Send Voice Briefing', 'ভয়েস ব্রিফিং পাঠান', lang)}
                </button>
              </div>
            </div>
          )}

          {/* PLANT GM: DCS Alarm Banner */}
          {role === 'plant_gm' && (
            <div className="dcs-alarm-banner">
              <div className="ribbon-left">
                <div className="ribbon-icon">🔴</div>
                <div className="ribbon-text">
                  <h4>{t('DCS SCADA Alarm Console — Keraniganj Complex Unit-1 & Unit-2', 'ডিসিএস স্ক্যাডা অ্যালার্ম কনসোল', lang)}</h4>
                  <p>{t('Column C-102 top temp 342°C (Set Point 335°C). Reflux pump P-102 operating at 85% capacity. All vacuum seals nominal.', 'কলাম C-102 তাপমাত্রা ৩৪২°C। রিফ্লাক্স পাম্প ৮৫% গতিতে সক্রিয়।', lang)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-ribbon" style={{ background: '#DC2626' }} onClick={() => showToast('🔴 Alarm acknowledged. Set point trimmed by 2°C.', 'danger')}>
                  ⚡ {t('Acknowledge Alarm', 'অ্যালার্ম স্বীকৃতি', lang)}
                </button>
              </div>
            </div>
          )}

          {/* EMPLOYEE: Quick Action Launchpad */}
          {role === 'employee' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #BFDBFE', background: '#EFF6FF' }}
                  onClick={() => showToast('📍 Geofence verified: Punched In at South Gate Keraniganj Complex (08:52 AM)', 'success')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <MapPin size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E40AF' }}>Clock-In Geofence</div>
                  <div style={{ fontSize: '11px', color: '#60A5FA', marginTop: '2px' }}>Verified Biometric GPS</div>
                </div>

                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--brand-gold-muted)', background: 'var(--brand-card-bg)' }}
                  onClick={() => showToast('🚗 Duty Vehicle requisition modal initiated.', 'info')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Car size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--brand-gold-dark)' }}>Request Vehicle</div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>Inter-terminal transit</div>
                </div>

                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #A7F3D0', background: '#ECFDF5' }}
                  onClick={() => showToast('🚌 Commuter Shuttle Pass: Seat #7, Mirpur-Keraniganj Express Active', 'success')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Bus size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#065F46' }}>Shuttle Bus Pass</div>
                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>Seat #7 Confirmed</div>
                </div>

                <div
                  className="card interactive-row"
                  style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: '1px solid #DDD6FE', background: '#F5F3FF' }}
                  onClick={() => showToast('🧾 Local Conveyance & Tour Claim form ready.', 'info')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Receipt size={20} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#5B21B6' }}>Submit Claim</div>
                  <div style={{ fontSize: '11px', color: '#7C3AED', marginTop: '2px' }}>Grade 7-10 Matrix</div>
                </div>
              </div>

              {/* Active Requisition Status Banner for Employee */}
              {sharedRequisitions.filter(r => r.requesterName.includes('Tanvir')).slice(0, 1).map(myReq => (
                <div key={myReq.id} className="card mb-4" style={{ background: myReq.status === 'assigned' ? '#F0FDF4' : '#FFFBEB', border: myReq.status === 'assigned' ? '1px solid #86EFAC' : '1px solid #FDE68A', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Car size={20} color={myReq.status === 'assigned' ? '#16A34A' : '#D97706'} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                          {myReq.status === 'assigned' ? '✓ Vehicle & Driver Allocated for Your Duty Travel' : '⏳ Vehicle Requisition Under Review by Transport Admin (Md. Kamruzzaman)'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)' }}>
                          {myReq.id} • {myReq.from.split(',')[0]} ➔ {myReq.to.split(',')[0]} ({myReq.tripType === 'round_trip' ? 'Round Trip' : 'One-Way'}) • Departure: {myReq.departureTime}
                        </div>
                        {myReq.status === 'assigned' && (
                          <div style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, marginTop: '3px' }}>
                            Car: {myReq.assignedVehiclePlate} • Driver: {myReq.assignedDriverName} (📞 {myReq.assignedDriverPhone}) • Pass #{myReq.tripPassNo}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${myReq.status === 'assigned' ? 'success' : 'warn'}`}>
                      {myReq.status === 'assigned' ? 'DISPATCH READY' : 'PENDING ADMIN'}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* STATS GRID — High-level KPI cards with sparklines */}
          <div className="stats-grid mb-5">
            {stats.map((s, i) => (
              <div key={i} className={`stat-card ${s.type}`}>
                <div className="stat-top">
                  <div className="stat-label">{t(s.label, s.labelBn, lang)}</div>
                  <div className="stat-icon-wrap">{s.icon}</div>
                </div>
                <div className="stat-main-row">
                  <div className="stat-value"><AnimatedCounter value={s.value} /></div>
                  <Sparkline data={s.sparkline} color={s.sparkColor} />
                </div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* PROGRESSIVE DISCLOSURE JUMP CARDS (Zero clutter — clean direct pathways) */}
          <div className="tab-jump-grid">
            {role === 'chairman' && (
              <>
                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('approvals')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <FileCheck size={18} color="var(--brand-crimson)" />
                      <span>{t('Priority Approvals', 'জরুরি অনুমোদন', lang)}</span>
                    </div>
                    <span className="badge danger">3 {t('Pending', 'অপেক্ষমান', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('High-value files awaiting Chairman\'s signature: ASME Safety Valves (৳48.5L), Grade 7-10 HR Policy, and Q4 Utility Budget (৳1.2 Cr).', 'চেয়ারম্যান মহোদয়ের স্বাক্ষরের অপেক্ষায় ৩টি উচ্চমূল্যের ফাইল: সেফটি ভালভ (৪৮.৫ লাখ), এইচআর নীতিমালা ও কিউ৪ ইউটিলিটি বাজেট।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Open Approval Queue', 'অনুমোদন সারি দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('inner_circle')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Users size={18} color="var(--brand-gold-dark)" />
                      <span>{t('Executive Inner Circle', 'ইনার সার্কেল নেতৃত্ব', lang)}</span>
                    </div>
                    <span className="badge info">8 {t('Tracked', 'ট্র্যাকড', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Live presence roster of key leadership: 4 Present at Plant/HQ, 1 Board Meeting, 1 BSTI Travel, 🔴 1 Uninformed Absent.', 'মূল নেতৃত্বের রিয়েল-টাইম উপস্থিতি: ৪ জন কর্মস্থলে, ১ জন মিটিংয়ে, ১ জন সরকারি পরিদর্শনে, ১ জন অননুমোদিত অনুপস্থিত।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('View Executive Roster', 'নেতৃত্ব উপস্থিতি তালিকা', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('notices')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Bell size={18} color="#0284C7" />
                      <span>{t('Enterprise Notices', 'এন্টারপ্রাইজ নোটিশ বোর্ড', lang)}</span>
                    </div>
                    <span className="badge gold">{NOTICE_BOARD.length} {t('Circulars', 'বিজ্ঞপ্তি', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Latest circulars & announcements: Chairman\'s Eid Message, Mandatory Q4 Plant Safety Briefing, HSE Incident protocol.', 'সর্বশেষ নোটিশ ও ঘোষণা: চেয়ারম্যানের বার্তা, চতুর্থ ত্রৈমাসিক নিরাপত্তা ব্রিফিং ও এইচএসই প্রটোকল।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Open Notice Board', 'নোটিশ বোর্ড দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </>
            )}

            {role === 'plant_gm' && (
              <>
                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('refinery')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <BarChart3 size={18} color="#0284C7" />
                      <span>{t('Refinery Telemetry & Output', 'উৎপাদন ও ডিস্টিলেশন চার্ট', lang)}</span>
                    </div>
                    <span className="badge success">5,000 MT/Day</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('96.3% Overall Equipment Effectiveness (OEE). 24-hour Bitumen 60/70 & 80/100 production yield graph and furnace vacuum seals.', '৯৬.৩% সামগ্রিক কার্যকারিতা। ২৪ ঘণ্টার বিটুমিন উৎপাদন লেখচিত্র এবং ফার্নেস ভ্যাকুয়াম অবস্থা।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Inspect Refinery Production', 'উৎপাদন গ্রাফ দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('safety_loto')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Lock size={18} color="var(--brand-crimson)" />
                      <span>{t('LOTO Safety & Shift Handover', 'এলওটিও নিরাপত্তা ও শিফট লগ', lang)}</span>
                    </div>
                    <span className="badge danger">{INITIAL_LOTO_PERMITS.length} {t('Active Isolations', 'সক্রিয় আইসোলেশন', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('OSHA 1910.147 Control of Hazardous Energy permits & shift handover continuity between Shift-A, B and C engineers.', 'ঝুঁকিপূর্ণ শক্তি নিয়ন্ত্রণ পারমিট এবং এ, বি ও সি শিফটের প্রকৌশলীদের ধারাবাহিকতা লগ।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('View LOTO Permits & Shifts', 'পারমিট ও শিফট লগ দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </>
            )}

            {role === 'transport_admin' && (
              <>
                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('requisitions')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Car size={18} color="#D97706" />
                      <span>{t('Duty Travel Requisitions', 'অফিসিয়াল যানবাহন আবেদন', lang)}</span>
                    </div>
                    <span className="badge warn">{sharedRequisitions.filter(r => r.status === 'pending').length} {t('Pending', 'বাকি', lang)}</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Review inter-depot and headquarters transport applications. Assign roadworthy vehicles and certified drivers.', 'হেডকোয়ার্টার ও ডিপো যাতায়াত আবেদন পর্যালোচনা এবং চালক ও গাড়ি বরাদ্দ নিশ্চিত করুন।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Manage Requisitions', 'আবেদন নিষ্পত্তি করুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('corridor')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Navigation size={18} color="#059669" />
                      <span>{t('Corridor Transit & Toll Alerts', 'ট্যাংকার করিডোর ও টোল সতর্কতা', lang)}</span>
                    </div>
                    <span className="badge success">Live Telematics</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Live telematics for Babubazar Bridge, Postogola Toll Plaza and Padma Bridge Expressway heavy carrier corridor.', 'বাবুবাজার ব্রিজ, পোস্তগোলা টোল ও পদ্মা সেতু এক্সপ্রেসওয়েতে ভারী ট্যাংকার করিডোরের লাইভ তথ্য।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Open Corridor HUD', 'করিডোর ট্র্যাকার দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </>
            )}

            {role === 'hr_admin' && (
              <>
                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('clearance')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <UserCheck size={18} color="var(--brand-crimson)" />
                      <span>{t('Exit Clearance Audits', 'বহির্গমন ছাড়পত্র অডিট', lang)}</span>
                    </div>
                    <span className="badge warn">1 In Progress</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Track 4-way separation audits (IT, Security, Fleet, Finance) for resigning personnel prior to final settlement.', 'চাকরি ইস্তফাদানকারী কর্মীদের ৪-ধাপ নিরীক্ষা (আইটি, সিকিউরিটি, ফ্লিট, ফিন্যান্স) ট্র্যাকিং।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('View Clearance Checklists', 'ছাড়পত্র বিবরণী দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>

                <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('sites')}>
                  <div className="tab-jump-top">
                    <div className="tab-jump-title">
                      <Building2Icon size={18} color="#0284C7" />
                      <span>{t('Regional Deployment Nodes', 'আঞ্চলিক জনবল ডেপ্লয়মেন্ট', lang)}</span>
                    </div>
                    <span className="badge info">743 Staff</span>
                  </div>
                  <div className="tab-jump-desc">
                    {t('Deployment distribution across Dhaka HQ (420), Keraniganj Bitumen Refinery (218) and Chattogram Terminal (105).', 'ঢাকা সদর দপ্তর (৪২০), কেরানীগঞ্জ রিফাইনারি (২১৮) ও চট্টগ্রাম টার্মিনালে (১০৫) জনবল বণ্টন।', lang)}
                  </div>
                  <div className="tab-jump-footer">
                    <span>{t('Inspect Site Nodes', 'আঞ্চলিক নোড দেখুন', lang)}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </>
            )}

            {role === 'hod' && (
              <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('approvals')}>
                <div className="tab-jump-top">
                  <div className="tab-jump-title">
                    <FileCheck size={18} color="var(--brand-crimson)" />
                    <span>{t('Omni-Approval Inbox & OPEX Ceiling', 'বিভাগীয় অনুমোদন ইনবক্স ও বাজেট', lang)}</span>
                  </div>
                  <span className="badge danger">{INITIAL_HOD_QUEUE.length} {t('Pending', 'বাকি', lang)}</span>
                </div>
                <div className="tab-jump-desc">
                  {t('Multi-category triage for employee conveyance claims, duty travel, stationery POs, and leave applications. Safe OPEX buffer remaining: ৳', 'যাতায়াত দাবি, ভ্রমণ, স্টেশনারি ক্রয় ও ছুটির অনুমোদন। অবশিষ্ট নিরাপদ পরিচালন বাজেট: ৳', lang)}{(5320000 - (3840000 + approvedAmountSum)).toLocaleString()}.
                </div>
                <div className="tab-jump-footer">
                  <span>{t('Open Approval Queue & Batch Actions', 'অনুমোদন সারি ও ব্যাচ অ্যাকশন খুলুন', lang)}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            )}

            {role === 'employee' && (
              <div className="tab-jump-card interactive-row" onClick={() => setActiveTab('activity')}>
                <div className="tab-jump-top">
                  <div className="tab-jump-title">
                    <Activity size={18} color="#059669" />
                    <span>{t('Recent Activity & Leave Entitlements', 'সাম্প্রতিক কার্যক্রম ও ছুটি স্থিতি', lang)}</span>
                  </div>
                  <span className="badge success">Active</span>
                </div>
                <div className="tab-jump-desc">
                  {t('Check your biometric punch timeline, shuttle pass details, approved requisitions, and casual/sick leave balances.', 'আপনার বায়োমেট্রিক পাঞ্চ টাইমলাইন, শাটল পাস, অনুমোদিত রিকুইজিশন এবং ক্যাজুয়াল/মেডিকেল ছুটি স্থিতি দেখুন।', lang)}
                </div>
                <div className="tab-jump-footer">
                  <span>{t('View Detailed Activity & Leave Ledger', 'বিস্তারিত কার্যক্রম ও ছুটি লেজার দেখুন', lang)}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          DELEGATED ROLE SUB-DASHBOARDS
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
        />
      )}

      {role === 'hod' && (
        <HodDashboard
          role={role}
          lang={lang}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          approvedAmountSum={approvedAmountSum}
          setApprovedAmountSum={setApprovedAmountSum}
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

      {/* Slide-in Detail Drawer */}
      <DetailDrawer
        data={selectedDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        lang={lang}
      />
    </div>
  );
}

function Building2Icon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </svg>
  );
}
