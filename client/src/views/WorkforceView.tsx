import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { useEmployeeStore, Employee } from '../store/employeeStore';
import { useCurrentUser } from '../auth/session';
import OnboardEmployeeModal from '../components/workforce/OnboardEmployeeModal';
import OffboardClearanceDrawer from '../components/workforce/OffboardClearanceDrawer';
import Pagination from '../components/Pagination';
import {
  Users, UserPlus, UserX, Search, Building, MapPin,
  CheckCircle, FileText, Shield
} from 'lucide-react';

const STAFF_PAGE = 8;

export default function WorkforceView({ lang }: ViewProps) {
  const { activeEmployees, offboardedEmployees } = useEmployeeStore();
  const canManage = !!useCurrentUser()?.permissions.has('workforce:manage');

  const [activeTab, setActiveTab] = useState<'active' | 'offboarded'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSite, setSelectedSite] = useState<string>('ALL');
  const [staffPage, setStaffPage] = useState(1);

  // Modals & Drawers
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedEmployeeForExit, setSelectedEmployeeForExit] = useState<Employee | null>(null);

  // Filtered List
  const displayedList = (activeTab === 'active' ? activeEmployees : offboardedEmployees).filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      emp.name.toLowerCase().includes(q) ||
      emp.id.toLowerCase().includes(q) ||
      emp.sapPernr.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.phone.includes(searchQuery);

    const matchesDept = selectedDept === 'ALL' || emp.dept === selectedDept;
    const matchesSite = selectedSite === 'ALL' || emp.assignedSite === selectedSite;

    return matchesSearch && matchesDept && matchesSite;
  });

  const staffPages = Math.max(1, Math.ceil(displayedList.length / STAFF_PAGE));
  const safeStaffPage = Math.min(staffPage, staffPages);
  const pagedList = displayedList.slice((safeStaffPage - 1) * STAFF_PAGE, safeStaffPage * STAFF_PAGE);

  const plantCount = activeEmployees.filter((e) => e.assignedSite === 'PLANT_KERANIGANJ').length;
  const hqCount = activeEmployees.filter((e) => e.assignedSite === 'HQ_BARIDHARA').length;

  return (
    <div>
      {canManage && (
        <div className="flex-between mb-4" style={{ justifyContent: 'flex-end' }}>
          <div className="flex-gap">
            <button
              className="btn-primary"
              style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowOnboardModal(true)}
            >
              <UserPlus size={15} />
              {t('Add New Employee', 'নতুন কর্মচারী যোগ করুন', lang)}
            </button>
          </div>
        </div>
      )}

      {/* KPI Ribbon */}
      <div className="stats-grid mb-4">
        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-label">{t('Total Active Staff', 'মোট সক্রিয় কর্মী', lang)}</span>
            <div className="stat-icon-wrap"><Users size={16} /></div>
          </div>
          <div className="stat-value">{activeEmployees.length}</div>
          <div className="stat-sub">
            <span className="sub-up">Active on Duty</span> • Regular Payroll
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-label">{t('Refinery Plant Team', 'কেরানীগঞ্জ রিফাইনারি', lang)}</span>
            <div className="stat-icon-wrap"><Building size={16} /></div>
          </div>
          <div className="stat-value">{plantCount}</div>
          <div className="stat-sub">
            Keraniganj Plant • Operations & Engineering
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-top">
            <span className="stat-label">{t('Corporate HQ Team', 'বারিধারা হেড অফিস', lang)}</span>
            <div className="stat-icon-wrap"><MapPin size={16} /></div>
          </div>
          <div className="stat-value">{hqCount}</div>
          <div className="stat-sub">
            Baridhara Office • Management & Sales
          </div>
        </div>

        <div className="stat-card warn">
          <div className="stat-top">
            <span className="stat-label">{t('Former Employees', 'সাবেক কর্মী / ছাড়পত্র প্রাপ্ত', lang)}</span>
            <div className="stat-icon-wrap"><UserX size={16} /></div>
          </div>
          <div className="stat-value">{offboardedEmployees.length}</div>
          <div className="stat-sub">
            Archived Staff Records • Complete Handover
          </div>
        </div>
      </div>

      {/* Main Surface Card */}
      <div className="card">
        {/* Controls Header */}
        <div className="card-hd workforce-toolbar">
          <div className="workforce-tabs" role="group" aria-label={t('Staff list', 'কর্মী তালিকা', lang)}>
            <button
              type="button"
              className={`workforce-tab${activeTab === 'active' ? ' active' : ''}`}
              aria-pressed={activeTab === 'active'}
              onClick={() => { setActiveTab('active'); setStaffPage(1); }}
            >
              {t('Active staff', 'সক্রিয় কর্মী', lang)}
              <b>{activeEmployees.length}</b>
            </button>
            <button
              type="button"
              className={`workforce-tab${activeTab === 'offboarded' ? ' active' : ''}`}
              aria-pressed={activeTab === 'offboarded'}
              onClick={() => { setActiveTab('offboarded'); setStaffPage(1); }}
            >
              {t('Former staff', 'সাবেক কর্মী', lang)}
              <b>{offboardedEmployees.length}</b>
            </button>
          </div>

          <div className="workforce-filter-row">
            <div className="workforce-search-wrap">
              <Search size={14} className="workforce-search-icon" />
              <input
                type="search"
                placeholder={t('Search employee name, ID, phone...', 'কর্মচারীর নাম, আইডি, ফোন নম্বর দিয়ে খুঁজুন...', lang)}
                aria-label={t('Search staff', 'কর্মী খুঁজুন', lang)}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setStaffPage(1); }}
                className="workforce-search-input"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setStaffPage(1); }}
              className="workforce-select"
              aria-label={t('Department', 'বিভাগ', lang)}
            >
              <option value="ALL">{t('All departments', 'সব বিভাগ', lang)}</option>
              <option value="Plant Operations">{t('Plant Operations', 'প্ল্যান্ট অপারেশন', lang)}</option>
              <option value="Sales & Distribution">{t('Sales & Distribution', 'বিক্রয় ও বিতরণ', lang)}</option>
              <option value="Finance & Accounts">{t('Finance & Accounts', 'অর্থ ও হিসাব', lang)}</option>
              <option value="Transport & Logistics">{t('Transport & Logistics', 'পরিবহন ও লজিস্টিকস', lang)}</option>
              <option value="HSE & Compliance">{t('HSE & Safety', 'স্বাস্থ্য, নিরাপত্তা ও পরিবেশ', lang)}</option>
              <option value="Human Resources">{t('Human Resources', 'মানবসম্পদ', lang)}</option>
              <option value="Security Administration">{t('Security Administration', 'নিরাপত্তা প্রশাসন', lang)}</option>
            </select>
            <select
              value={selectedSite}
              onChange={(e) => { setSelectedSite(e.target.value); setStaffPage(1); }}
              className="workforce-select"
              aria-label={t('Location', 'কর্মস্থল', lang)}
            >
              <option value="ALL">{t('All locations', 'সব কর্মস্থল', lang)}</option>
              <option value="PLANT_KERANIGANJ">{t('Keraniganj Plant', 'কেরানীগঞ্জ প্ল্যান্ট', lang)}</option>
              <option value="HQ_BARIDHARA">{t('Baridhara HQ', 'বারিধারা প্রধান কার্যালয়', lang)}</option>
              <option value="TERMINAL_CTG">{t('Chattogram Port Depot', 'চট্টগ্রাম বন্দর ডিপো', lang)}</option>
            </select>
          </div>
        </div>

        {/* 1. Desktop & Tablet Table View */}
        <div className="card-body workforce-desktop-table" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
            <thead>
              <tr>
                <th>{t('Employee Name & ID', 'কর্মচারীর নাম ও পদবি', lang)}</th>
                <th>{t('Department & Reporting Manager', 'বিভাগ ও রিপোর্টিং কর্মকর্তা', lang)}</th>
                <th>{t('Official Contact & Staff ID', 'দাপ্তরিক যোগাযোগ ও আইডি', lang)}</th>
                <th>{t('Work Location', 'কর্মস্থল / সাইট', lang)}</th>
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
                pagedList.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: emp.avatarColor, color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
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
                        {emp.email}
                      </div>
                    </td>

                    <td>
                      <span className="badge info" style={{ fontSize: '10.5px' }}>
                        <MapPin size={11} />
                        {emp.assignedSite === 'PLANT_KERANIGANJ'
                          ? 'Keraniganj Plant'
                          : emp.assignedSite === 'HQ_BARIDHARA'
                          ? 'Baridhara HQ'
                          : 'Chattogram Port Depot'}
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
                      {emp.id === 'EMP-0001' ? (
                        <span className="badge gold" style={{ fontSize: '10.5px' }}>
                          <Shield size={11} /> Executive Office
                        </span>
                      ) : emp.status === 'active' ? (
                        !canManage ? null : <button
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
                          {t('View Clearance File', 'ছাড়পত্র ফাইল দেখুন', lang)}
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

        {/* 2. Mobile Responsive Touch Cards */}
        <div className="workforce-mobile-cards">
          {displayedList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--brand-slate-400)' }}>
              {t('No personnel found matching the specified filters.', 'কোনো কর্মচারী পাওয়া যায়নি।', lang)}
            </div>
          ) : (
            pagedList.map((emp) => (
              <div key={emp.id} className="workforce-card-item">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: emp.avatarColor, color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                      {emp.initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>
                        {emp.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                        {emp.designation} • <span style={{ color: 'var(--brand-crimson)', fontFamily: 'monospace', fontWeight: 700 }}>{emp.id}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {emp.status === 'active' ? (
                      <span className="badge success">Active</span>
                    ) : emp.status === 'on_leave' ? (
                      <span className="badge warn">On Leave</span>
                    ) : (
                      <span className="badge danger">Offboarded</span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'var(--brand-slate-100)', padding: '8px 10px', borderRadius: '6px', fontSize: '11.5px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div><strong>Dept:</strong> {emp.dept} ({emp.reportingHOD.split(' ')[0]})</div>
                  <div><strong>ID:</strong> <span style={{ fontFamily: 'monospace' }}>{emp.sapPernr}</span> • 📞 {emp.phone}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-slate-600)' }}>
                    <MapPin size={11} color="var(--brand-crimson)" />
                    <span>{emp.assignedSite === 'PLANT_KERANIGANJ' ? 'Keraniganj Plant' : emp.assignedSite === 'HQ_BARIDHARA' ? 'Baridhara HQ' : 'Chattogram Port Depot'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--brand-slate-200)' }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>
                    {emp.status === 'offboarded' ? `Exit: ${emp.exitDate}` : `Joined: ${emp.joinDate}`}
                  </span>
                  {emp.id === 'EMP-0001' ? (
                    <span className="badge gold" style={{ fontSize: '10.5px' }}>
                      <Shield size={11} /> Executive Office
                    </span>
                  ) : emp.status === 'active' ? (
                    !canManage ? null : <button
                      className="btn-outline-danger"
                      style={{ fontSize: '11px', padding: '5px 12px' }}
                      onClick={() => setSelectedEmployeeForExit(emp)}
                    >
                      <UserX size={12} />
                      {t('Exit Clearance', 'ছাড়পত্র প্রক্রিয়া', lang)}
                    </button>
                  ) : (
                    <button
                      className="btn-sm-ghost"
                      style={{ fontSize: '11px', padding: '5px 12px' }}
                      onClick={() => setSelectedEmployeeForExit(emp)}
                    >
                      <FileText size={12} />
                      {t('Clearance File', 'ছাড়পত্র ফাইল', lang)}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '4px 16px 12px' }}>
          <Pagination
            currentPage={safeStaffPage}
            totalItems={displayedList.length}
            pageSize={STAFF_PAGE}
            onPageChange={setStaffPage}
            lang={lang}
          />
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
