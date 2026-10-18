import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { useEmployeeStore, Employee } from '../store/employeeStore';
import OnboardEmployeeModal from '../components/workforce/OnboardEmployeeModal';
import OffboardClearanceDrawer from '../components/workforce/OffboardClearanceDrawer';
import {
  Users, UserPlus, UserX, Search, Filter, ShieldCheck, MapPin,
  Building, Phone, Mail, Award, CheckCircle, FileText, ArrowRight,
  Sparkles, RefreshCw
} from 'lucide-react';

export default function WorkforceView({ role, lang }: ViewProps) {
  const { employees, activeEmployees, offboardedEmployees } = useEmployeeStore();

  const [activeTab, setActiveTab] = useState<'active' | 'offboarded'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSite, setSelectedSite] = useState<string>('ALL');

  // Modals & Drawers
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedEmployeeForExit, setSelectedEmployeeForExit] = useState<Employee | null>(null);

  // Filtered List
  const displayedList = (activeTab === 'active' ? activeEmployees : offboardedEmployees).filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.sapPernr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery);

    const matchesDept = selectedDept === 'ALL' || emp.dept === selectedDept;
    const matchesSite = selectedSite === 'ALL' || emp.assignedSite === selectedSite;

    return matchesSearch && matchesDept && matchesSite;
  });

  const plantCount = activeEmployees.filter((e) => e.assignedSite === 'PLANT_KERANIGANJ').length;
  const hqCount = activeEmployees.filter((e) => e.assignedSite === 'HQ_BARIDHARA').length;

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-4">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
            {t('Workforce Master Directory & Human Capital Desk', 'জনবল মাস্টার ডিরেক্টরি ও মানবসম্পদ প্রশাসন', lang)}
          </h2>
          <p className="text-muted">
            {t(
              'Enterprise Personnel Master • Automated 4-Way Exit Clearance • Geofence Site Allocation • SAP S/4HANA Personnel Sync',
              'কর্মচারী মাস্টার ডাটা • চাকরি সমাপ্তির ৪-ধাপীয় ছাড়পত্র • প্ল্যান্ট জিওফেন্স বণ্টন • এসএপি পার্সোনেল সিঙ্ক',
              lang
            )}
          </p>
        </div>

        <div className="flex-gap">
          <button
            className="btn-primary"
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowOnboardModal(true)}
          >
            <UserPlus size={15} />
            {t('Onboard New Personnel', 'নতুন কর্মচারী অনবোর্ডিং', lang)}
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="stats-grid mb-4">
        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-label">{t('Total Active Staff', 'মোট সক্রিয় জনবল', lang)}</span>
            <div className="stat-icon-wrap"><Users size={16} /></div>
          </div>
          <div className="stat-value">{activeEmployees.length}</div>
          <div className="stat-sub">
            <span className="sub-up">100% Verified</span> • SAP PERNR Bound
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-label">{t('Refinery Plant Team', 'কেরানীগঞ্জ রিফাইনারি', lang)}</span>
            <div className="stat-icon-wrap"><Building size={16} /></div>
          </div>
          <div className="stat-value">{plantCount}</div>
          <div className="stat-sub">
            Site B Geofence • 24/7 Operations
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-top">
            <span className="stat-label">{t('Corporate HQ Team', 'বারিধারা করপোরেট হেডকোয়ার্টার', lang)}</span>
            <div className="stat-icon-wrap"><MapPin size={16} /></div>
          </div>
          <div className="stat-value">{hqCount}</div>
          <div className="stat-sub">
            Site A Geofence • Executive & Sales
          </div>
        </div>

        <div className="stat-card warn">
          <div className="stat-top">
            <span className="stat-label">{t('Offboarded / Former', 'সাবেক / ছাড়পত্র প্রাপ্ত', lang)}</span>
            <div className="stat-icon-wrap"><UserX size={16} /></div>
          </div>
          <div className="stat-value">{offboardedEmployees.length}</div>
          <div className="stat-sub">
            Audit Retained • Never Hard-Deleted
          </div>
        </div>
      </div>

      {/* Main Surface Card */}
      <div className="card">
        {/* Controls Header */}
        <div className="card-hd" style={{ flexWrap: 'wrap', gap: '12px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-sm-ghost ${activeTab === 'active' ? 'active-filter' : ''}`}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                background: activeTab === 'active' ? 'var(--brand-crimson)' : 'transparent',
                color: activeTab === 'active' ? '#fff' : 'var(--brand-slate-600)',
                borderColor: activeTab === 'active' ? 'var(--brand-crimson)' : 'var(--brand-slate-200)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => setActiveTab('active')}
            >
              <Users size={14} />
              {t('Active Enterprise Staff', 'সক্রিয় কর্মকর্তা-কর্মচারী', lang)}
              <span style={{ background: activeTab === 'active' ? 'rgba(255,255,255,0.25)' : 'var(--brand-slate-200)', color: activeTab === 'active' ? '#fff' : 'var(--brand-slate-800)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
                {activeEmployees.length}
              </span>
            </button>

            <button
              className={`btn-sm-ghost ${activeTab === 'offboarded' ? 'active-filter' : ''}`}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                background: activeTab === 'offboarded' ? 'var(--brand-slate-900)' : 'transparent',
                color: activeTab === 'offboarded' ? 'var(--brand-gold)' : 'var(--brand-slate-600)',
                borderColor: activeTab === 'offboarded' ? 'var(--brand-gold)' : 'var(--brand-slate-200)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => setActiveTab('offboarded')}
            >
              <UserX size={14} />
              {t('Former Staff / Exit Archive', 'সাবেক জনবল / আর্কাইভ', lang)}
              <span style={{ background: activeTab === 'offboarded' ? 'rgba(212,175,55,0.3)' : 'var(--brand-slate-200)', color: activeTab === 'offboarded' ? '#fff' : 'var(--brand-slate-800)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
                {offboardedEmployees.length}
              </span>
            </button>
          </div>

          {/* Search & Department Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end', minWidth: '320px' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--brand-slate-400)' }} />
              <input
                type="text"
                placeholder={t('Search staff, ID, SAP...', 'খুঁজুন...', lang)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '30px', height: '34px', fontSize: '12px' }}
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ height: '34px', fontSize: '11.5px', width: '160px' }}
            >
              <option value="ALL">All Departments</option>
              <option value="Plant Operations">Plant Operations</option>
              <option value="Sales & Distribution">Sales & Distribution</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
              <option value="Transport & Logistics">Transport & Logistics</option>
              <option value="HSE & Compliance">HSE & Compliance</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Security Administration">Security Admin</option>
            </select>

            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              style={{ height: '34px', fontSize: '11.5px', width: '150px' }}
            >
              <option value="ALL">All Facilities</option>
              <option value="PLANT_KERANIGANJ">Keraniganj Refinery</option>
              <option value="HQ_BARIDHARA">Baridhara HQ</option>
              <option value="TERMINAL_CTG">Chattogram Port</option>
            </select>
          </div>
        </div>

        {/* Workforce Table */}
        <div className="card-body" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('Personnel Identity', 'কর্মচারী পরিচয়', lang)}</th>
                <th>{t('Department & Unit', 'বিভাগ ও ইউনিট', lang)}</th>
                <th>{t('SAP & Corporate Contact', 'এসএপি ও যোগাযোগ', lang)}</th>
                <th>{t('Geofence Facility', 'কর্মস্থল / সাইট', lang)}</th>
                <th>{t('Status / Joined', 'অবস্থা ও যোগদান', lang)}</th>
                <th style={{ textAlign: 'right' }}>{t('Actions', 'পদক্ষেপ', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--brand-slate-400)' }}>
                    {t('No personnel found matching the specified filters.', 'কোনো কর্মচারী পাওয়া যায়নি।', lang)}
                  </td>
                </tr>
              ) : (
                displayedList.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: emp.avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                          {emp.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-slate-900)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                            {emp.designation}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--brand-crimson)', fontFamily: 'monospace', fontWeight: 700 }}>
                            {emp.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--brand-slate-800)' }}>
                        {emp.dept}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                        Reports to: {emp.reportingHOD}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '11.5px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-slate-700)' }}>
                        {emp.sapPernr}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                        📞 {emp.phone}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                        ✉️ {emp.email}
                      </div>
                    </td>

                    <td>
                      <span className="badge info" style={{ fontSize: '10.5px' }}>
                        <MapPin size={11} />
                        {emp.assignedSite === 'PLANT_KERANIGANJ'
                          ? 'Keraniganj Refinery'
                          : emp.assignedSite === 'HQ_BARIDHARA'
                          ? 'Baridhara HQ'
                          : 'Chattogram Marine Terminal'}
                      </span>
                    </td>

                    <td>
                      <div>
                        {emp.status === 'active' ? (
                          <span className="badge success">Active Duty</span>
                        ) : emp.status === 'on_leave' ? (
                          <span className="badge warn">On Leave</span>
                        ) : (
                          <span className="badge danger">Offboarded</span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)', marginTop: '3px' }}>
                        {emp.status === 'offboarded'
                          ? `Exit: ${emp.exitDate}`
                          : `Joined: ${emp.joinDate}`}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {emp.status === 'active' ? (
                        <button
                          className="btn-outline-danger"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                          onClick={() => setSelectedEmployeeForExit(emp)}
                        >
                          <UserX size={12} />
                          {t('Exit Clearance', 'ছাড়পত্র প্রক্রিয়া', lang)}
                        </button>
                      ) : (
                        <button
                          className="btn-sm-ghost"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                          onClick={() => setSelectedEmployeeForExit(emp)}
                        >
                          <FileText size={12} />
                          {t('View Exit Dossier', 'নথিপত্র দেখুন', lang)}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Drawers */}
      <OnboardEmployeeModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        lang={lang}
      />

      <OffboardClearanceDrawer
        employee={selectedEmployeeForExit}
        onClose={() => setSelectedEmployeeForExit(null)}
        lang={lang}
      />
    </div>
  );
}
