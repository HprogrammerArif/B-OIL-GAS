import React, { useState } from 'react';
import { AppRole, Lang, ROLE_META, t } from '../types';
import {
  Shield, Key, CheckCircle, Clock, User, Award, Lock, X, LogOut
} from 'lucide-react';
import { showToast } from '../App';
import { useOperationsStore } from '../store/operationsStore';

interface UserProfileModalProps {
  role: AppRole;
  lang: Lang;
  initialTab?: 'profile' | 'security' | 'delegation' | 'audit';
  onClose: () => void;
}

const EXTENDED_ROLE_DATA: Record<AppRole, {
  grade: string;
  reportingTo: string;
  joinDate: string;
  emergencyContact: string;
  accessSummary: string;
}> = {
  chairman: {
    grade: 'Board Leadership (Managing Director)',
    reportingTo: 'Board of Directors, Bashundhara Group',
    joinDate: '01 Jan 1987',
    emergencyContact: 'Chairman Secretariat (+880 1711-000002)',
    accessSummary: 'Full Company Oversight & Final Approval Authority',
  },
  plant_gm: {
    grade: 'Senior Management (General Manager)',
    reportingTo: 'Ahmed Akbar Sobhan (Chairman & MD)',
    joinDate: '15 Mar 2012',
    emergencyContact: 'Mrs. Rashid (+880 1711-002199)',
    accessSummary: 'Plant Operations, Machinery, Permits & Shift Staff',
  },
  hr_admin: {
    grade: 'Senior Management (General Manager)',
    reportingTo: 'Ahmed Akbar Sobhan (Chairman & MD)',
    joinDate: '01 Aug 2015',
    emergencyContact: 'Family Contact (+880 1711-002188)',
    accessSummary: 'Staff Directory, Exit Clearance, Leave & Office Assets',
  },
  transport_admin: {
    grade: 'Management Grade (Supervisor)',
    reportingTo: 'Sayeda Afroza Sultana (GM, HR & Administration)',
    joinDate: '10 Feb 2018',
    emergencyContact: 'Family Contact (+880 1711-002177)',
    accessSummary: 'Company Cars, Shuttle Buses, Visitors & Office Parcels',
  },
  hod: {
    grade: 'Senior Management (Head of Finance)',
    reportingTo: 'Ahmed Akbar Sobhan (Chairman & MD)',
    joinDate: '01 Jun 2014',
    emergencyContact: 'Family Contact (+880 1711-002166)',
    accessSummary: 'Finance Approvals, Expense Claims, Assets & Department Team',
  },
  employee: {
    grade: 'Officer Grade (Senior Sales Officer)',
    reportingTo: 'Farida Begum (Head of Finance & Approver)',
    joinDate: '12 Sep 2021',
    emergencyContact: 'Spouse (+880 1711-002155)',
    accessSummary: 'Attendance, Expense Claims, Car Booking & Assigned Equipment',
  },
  driver: {
    grade: 'Transport Staff (Senior Company Driver)',
    reportingTo: 'Md. Kamruzzaman (Transport & Admin Supervisor)',
    joinDate: '10 Feb 2019',
    emergencyContact: 'Mrs. Rafiqul (+880 1718-445577)',
    accessSummary: 'Assigned Trips, Duty Check-In, Toll Slips & Parcel Delivery',
  },
};

export default function UserProfileModal({
  role,
  lang,
  initialTab = 'profile',
  onClose,
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'delegation' | 'audit'>(initialTab);
  const { profilePrefs, updateProfilePrefs, revokeSession } = useOperationsStore();
  const [delegationScope, setDelegationScope] = useState('Routine Department Approvals & Urgent Bills (up to ৳5,00,000)');

  const meta = ROLE_META[role];
  const ext = EXTENDED_ROLE_DATA[role];

  const handleToggleDelegation = () => {
    const nextActive = !profilePrefs.delegationActive;
    updateProfilePrefs({ delegationActive: nextActive });
    showToast(
      nextActive
        ? t(
            `Acting handover activated for ${profilePrefs.delegateToName} until ${profilePrefs.delegateUntil}.`,
            `${profilePrefs.delegateToName}-এর নিকট সাময়িক দায়িত্ব হস্তান্তর চালু করা হয়েছে।`,
            lang
          )
        : t(
            'Handover turned off. All requests now come directly to you.',
            'দায়িত্ব হস্তান্তর বন্ধ করা হয়েছে। এখন সকল আবেদন সরাসরি আপনার কাছে আসবে।',
            lang
          ),
      'gold'
    );
  };

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 1400 }}>
      <div
        className="modal"
        style={{ maxWidth: '680px', width: '95vw', padding: 0, overflow: 'hidden', borderRadius: '14px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0B132B 0%, #111A38 100%)',
            padding: '20px 24px',
            color: '#fff',
            borderBottom: '2px solid var(--brand-gold)',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: meta.avatarColor,
                color: '#fff',
                border: '2.5px solid var(--brand-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '19px',
                fontWeight: 800,
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              }}
            >
              {meta.initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  {t(meta.name, meta.nameBn, lang)}
                </h3>
                <span className="badge gold" style={{ fontSize: '10px', fontFamily: 'monospace' }}>{meta.empId}</span>
                <span className="badge success" style={{ fontSize: '10px' }}>
                  🟢 {t('Active Staff', 'সক্রিয় কর্মী', lang)}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--brand-gold)', fontWeight: 600, marginTop: '2px' }}>
                {t(meta.label, meta.labelBn, lang)} • {ext.grade}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                {meta.email} • {t(meta.dept, meta.deptBn, lang)}
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', overflowX: 'auto' }}>
            {[
              { id: 'profile',    label: 'Employee Info',         labelBn: 'কর্মী তথ্য',           icon: <User size={13} /> },
              { id: 'security',   label: 'Password & Security',   labelBn: 'পাসওয়ার্ড ও নিরাপত্তা', icon: <Shield size={13} /> },
              { id: 'delegation', label: 'Leave Handover',        labelBn: 'দায়িত্ব হস্তান্তর',     icon: <Award size={13} /> },
              { id: 'audit',      label: 'Devices & Sign-In Log', labelBn: 'ডিভাইস ও লগইন লগ',     icon: <Clock size={13} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  background: activeTab === tab.id ? 'var(--brand-crimson)' : 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  border: activeTab === tab.id ? '1px solid var(--brand-gold)' : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.icon}
                <span>{t(tab.label, tab.labelBn, lang)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                <div style={{ background: 'var(--brand-slate-100)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                    {t('Work Email', 'অফিস ইমেইল', lang)}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '2px', wordBreak: 'break-all' }}>
                    {meta.email}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#059669', marginTop: '2px' }}>
                    ✓ {t('Verified Company Account', 'যাচাইকৃত অফিস ইমেইল', lang)}
                  </div>
                </div>

                <div style={{ background: 'var(--brand-slate-100)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                    {t('Mobile Number', 'মোবাইল নম্বর', lang)}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '2px' }}>
                    {meta.phone}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                    {t('Official Contact Number', 'অফিসিয়াল যোগাযোগ নম্বর', lang)}
                  </div>
                </div>

                <div style={{ background: 'var(--brand-slate-100)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                    {t('Primary Workplace', 'প্রধান কর্মস্থল', lang)}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '2px' }}>
                    {t(meta.siteLabel, meta.siteLabelBn, lang)}
                  </div>
                </div>

                <div style={{ background: 'var(--brand-slate-100)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                    {t('Reports To', 'ঊর্ধ্বতন কর্মকর্তা', lang)}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand-slate-900)', marginTop: '2px' }}>
                    {ext.reportingTo}
                  </div>
                </div>
              </div>

              {/* HR Records */}
              <div style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ background: 'var(--brand-slate-100)', padding: '10px 14px', fontWeight: 700, fontSize: '12px', borderBottom: '1px solid var(--brand-slate-200)' }}>
                  {t('Official HR & ID Card Details', 'এইচআর ও পরিচয়পত্রের বিবরণ', lang)}
                </div>
                <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Joining Date:', 'যোগদানের তারিখ:', lang)}</span>{' '}
                    <strong>{ext.joinDate}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Blood Group:', 'রক্তের গ্রুপ:', lang)}</span>{' '}
                    <strong style={{ color: 'var(--brand-crimson)' }}>{meta.bloodGroup}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Portal Access:', 'পোর্টাল অ্যাক্সেস:', lang)}</span>{' '}
                    <strong>{ext.accessSummary}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Emergency Contact:', 'জরুরি যোগাযোগ:', lang)}</span>{' '}
                    <strong>{ext.emergencyContact}</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: '#065F46' }}>
                <CheckCircle size={16} />
                <span>
                  <strong>{t('Employee Gate ID Active:', 'কর্মী গেট আইডি সক্রিয়:', lang)}</strong>{' '}
                  {t(
                    'Valid for entry at Baridhara Head Office and Keraniganj Plant gates.',
                    'বারিধারা প্রধান কার্যালয় এবং কেরানীগঞ্জ প্ল্যান্ট গেটে প্রবেশের জন্য অনুমোদিত।',
                    lang
                  )}
                </span>
              </div>
            </div>
          )}

          {/* 2. Security Tab */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--brand-slate-50, #F8FAFC)', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{t('2-Step Login Verification', '২-ধাপ লগইন যাচাইকরণ', lang)}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {t('Protects your account with mobile verification on new computers', 'নতুন ডিভাইসে লগইনের সময় মোবাইল কোড যাচাই সক্রিয়', lang)}
                    </div>
                  </div>
                </div>
                <span className="badge success">{t('Active', 'চালু আছে', lang)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--brand-slate-50, #F8FAFC)', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{t('Official Digital Approval Stamp', 'দাপ্তরিক ডিজিটাল স্বাক্ষর সনদ', lang)}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {t('Verified employee signature for official documents and vouchers', 'নোট-শিট ও ভাউচার স্বাক্ষরের জন্য অনুমোদিত ডিজিটাল সিল', lang)}
                    </div>
                  </div>
                </div>
                <span className="badge gold">{t('Valid till Dec 2027', 'ডিসেম্বর ২০২৭ পর্যন্ত বৈধ', lang)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'var(--brand-slate-50, #F8FAFC)', borderRadius: '8px', border: '1px solid var(--brand-slate-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FDF2F8', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{t('Account Password', 'অ্যাকাউন্ট পাসওয়ার্ড', lang)}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {t('Last updated 35 days ago', 'সর্বশেষ পরিবর্তন ৩৫ দিন আগে', lang)}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-outline"
                  style={{ fontSize: '11px', padding: '5px 12px' }}
                  onClick={() =>
                    showToast(
                      t(
                        'Password change link sent to your official email (' + meta.email + ').',
                        'আপনার অফিস ইমেইলে পাসওয়ার্ড পরিবর্তনের লিংক পাঠানো হয়েছে।',
                        lang
                      ),
                      'info'
                    )
                  }
                >
                  {t('Change Password', 'পাসওয়ার্ড পরিবর্তন', lang)}
                </button>
              </div>
            </div>
          )}

          {/* 3. Leave Handover / Delegation Tab (Persisted in OperationsStore!) */}
          {activeTab === 'delegation' && (
            <div>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#92400E', fontSize: '13px' }}>
                  <Award size={16} />
                  <span>{t('Leave & Travel Duty Handover', 'ছুটি বা সফরকালীন দায়িত্ব হস্তান্তর', lang)}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#B45309' }}>
                  {t(
                    'When you are away on leave or visiting a site, choose a trusted senior colleague to review urgent requests on your behalf.',
                    'আপনি ছুটিতে বা সফরে থাকলে জরুরি অনুমোদন ও কাজ পরিচালনার জন্য একজন সহকর্মীকে দায়িত্ব দিন।',
                    lang
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--brand-slate-800)' }}>
                      {t('Acting Colleague:', 'দায়িত্বপ্রাপ্ত সহকর্মী:', lang)}
                    </label>
                    <select
                      value={profilePrefs.delegateToName}
                      onChange={(e) => updateProfilePrefs({ delegateToName: e.target.value })}
                      className="form-control"
                      style={{ width: '100%', fontSize: '12.5px' }}
                    >
                      <option value="Farida Begum (Head of Finance)">Farida Begum (Head of Finance)</option>
                      <option value="Engr. Md. Harunur Rashid (Plant GM)">Engr. Md. Harunur Rashid (Plant GM)</option>
                      <option value="Sayeda Afroza Sultana (GM, HR & Admin)">Sayeda Afroza Sultana (GM, HR & Admin)</option>
                      <option value="Adv. Karim Molla (Head of Legal & Permits)">Adv. Karim Molla (Head of Legal & Permits)</option>
                      <option value="Engr. Tariqul Islam (Senior Plant Engineer)">Engr. Tariqul Islam (Senior Plant Engineer)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--brand-slate-800)' }}>
                      {t('Handover Until:', 'মেয়াদ শেষ:', lang)}
                    </label>
                    <input
                      type="text"
                      value={profilePrefs.delegateUntil}
                      onChange={(e) => updateProfilePrefs({ delegateUntil: e.target.value })}
                      className="form-control"
                      style={{ width: '100%', fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--brand-slate-800)' }}>
                    {t('What They Can Approve:', 'হস্তান্তরিত দায়িত্বের পরিধি:', lang)}
                  </label>
                  <input
                    type="text"
                    value={delegationScope}
                    onChange={(e) => setDelegationScope(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', fontSize: '12.5px' }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: profilePrefs.delegationActive ? '#ECFDF5' : 'var(--brand-slate-50, #F8FAFC)',
                    borderRadius: '8px',
                    border: '1px solid var(--brand-slate-200)',
                    marginTop: '6px',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: profilePrefs.delegationActive ? '#065F46' : 'var(--brand-slate-800)' }}>
                      {profilePrefs.delegationActive
                        ? t(`Handover Active → ${profilePrefs.delegateToName}`, `হস্তান্তর চালু → ${profilePrefs.delegateToName}`, lang)
                        : t('Status: Off (You are handling your own requests)', 'স্ট্যাটাস: বন্ধ (আপনি নিজেই দায়িত্ব পালন করছেন)', lang)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {profilePrefs.delegationActive
                        ? t(`Active until ${profilePrefs.delegateUntil}. Saved automatically.`, `${profilePrefs.delegateUntil} পর্যন্ত কার্যকর থাকবে।`, lang)
                        : t('Turn this on before starting annual leave or outstation travel.', 'ছুটি বা সফরে যাওয়ার আগে এটি চালু করুন।', lang)}
                    </div>
                  </div>
                  <button
                    className={profilePrefs.delegationActive ? 'btn-outline-danger' : 'btn-gold'}
                    style={{ fontSize: '11.5px', padding: '7px 14px', fontWeight: 700 }}
                    onClick={handleToggleDelegation}
                  >
                    {profilePrefs.delegationActive
                      ? t('Turn Off Handover', 'হস্তান্তর বন্ধ করুন', lang)
                      : t('Turn On Handover', 'হস্তান্তর চালু করুন', lang)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. Active Devices & Sign-In Log Tab */}
          {activeTab === 'audit' && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-slate-800)', marginBottom: '8px' }}>
                {t('Signed-In Devices', 'বর্তমানে লগইনকৃত ডিভাইসসমূহ', lang)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {profilePrefs.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: sess.isCurrent ? '#F0FDF4' : 'var(--brand-slate-50, #F8FAFC)',
                      borderRadius: '8px',
                      border: sess.isCurrent ? '1px solid #BBF7D0' : '1px solid var(--brand-slate-200)',
                      fontSize: '12px',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>{sess.device}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {sess.location} • {sess.lastActive}
                      </div>
                    </div>
                    {sess.isCurrent ? (
                      <span className="badge success" style={{ fontSize: '10px' }}>
                        {t('This Computer', 'এই ডিভাইস', lang)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-outline-danger"
                        style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          revokeSession(sess.id);
                          showToast(t('Signed out from other device.', 'অন্য ডিভাইস থেকে সাইন আউট করা হয়েছে।', lang), 'info');
                        }}
                      >
                        <LogOut size={12} />
                        <span>{t('Sign Out Device', 'ডিভাইস লগআউট', lang)}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-slate-800)', marginBottom: '8px' }}>
                {t('Recent Sign-In History', 'সাম্প্রতিক লগইন ইতিহাস', lang)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { time: 'Today, 08:50 AM', loc: meta.siteLabel, device: 'Office Computer · Chrome Browser', status: 'Signed In' },
                  { time: '28 Oct 2026, 08:45 AM', loc: meta.siteLabel, device: 'Office Computer · Chrome Browser', status: 'Signed In' },
                  { time: '27 Oct 2026, 09:02 AM', loc: 'Keraniganj Plant Wi-Fi', device: 'Company Mobile App', status: 'Signed In' },
                ].map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--brand-slate-50, #F8FAFC)',
                      borderRadius: '6px',
                      border: '1px solid var(--brand-slate-200)',
                      fontSize: '11.5px',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--brand-slate-900)' }}>{log.time}</strong> •{' '}
                      <span style={{ color: 'var(--brand-slate-600)' }}>{log.loc}</span>
                      <div style={{ fontSize: '10.5px', color: '#64748B' }}>{log.device}</div>
                    </div>
                    <span className="badge success" style={{ fontSize: '10px' }}>{log.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: 'var(--brand-slate-50, #F8FAFC)',
            borderTop: '1px solid var(--brand-slate-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
            {t(`Bashundhara Oil & Gas Co. Ltd. • Employee ID: ${meta.empId}`, `বসুন্ধরা অয়েল অ্যান্ড গ্যাস • কর্মী আইডি: ${meta.empId}`, lang)}
          </div>
          <button className="btn-primary" onClick={onClose} style={{ fontSize: '12px', padding: '6px 16px' }}>
            {t('Close', 'বন্ধ করুন', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
