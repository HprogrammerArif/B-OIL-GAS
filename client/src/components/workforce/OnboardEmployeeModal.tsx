import React, { useState } from 'react';
import { Lang, t, AppRole } from '../../types';
import { Employee, useEmployeeStore } from '../../store/employeeStore';
import { showToast } from '../../App';
import { X, UserPlus, Shield, Building, MapPin, Phone, Mail, Award, Check } from 'lucide-react';

interface OnboardEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

export default function OnboardEmployeeModal({ isOpen, onClose, lang }: OnboardEmployeeModalProps) {
  const { addEmployee } = useEmployeeStore();

  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+880 17');
  const [sapPernr, setSapPernr] = useState(`SAP-${Math.floor(10000 + Math.random() * 89999)}`);
  const [dept, setDept] = useState<Employee['dept']>('Plant Operations');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<AppRole>('employee');
  const [assignedSite, setAssignedSite] = useState<Employee['assignedSite']>('PLANT_KERANIGANJ');
  const [reportingHOD, setReportingHOD] = useState('EMP-0012 (Engr. Harunur Rashid)');
  const [nationalId, setNationalId] = useState('199' + Math.floor(1000000000000 + Math.random() * 900000000000));
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [emergencyContact, setEmergencyContact] = useState('+880 1819-000000');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(t('Please enter employee full name.', 'অনুগ্রহ করে কর্মচারীর পুরো নাম লিখুন।', lang), 'info');
      return;
    }
    if (!designation.trim()) {
      showToast(t('Please enter official designation.', 'অনুগ্রহ করে পদবি লিখুন।', lang), 'info');
      return;
    }

    const created = addEmployee({
      sapPernr,
      name,
      nameBn: nameBn || undefined,
      email: email || `${name.toLowerCase().replace(/[^a-z]/g, '')}@bashundhara.com`,
      phone,
      dept,
      designation,
      role,
      assignedSite,
      reportingHOD,
      nationalId,
      bloodGroup,
      emergencyContact,
      avatarColor: role === 'chairman' ? '#A51C30' : role === 'plant_gm' ? '#0369A1' : role === 'hr_admin' ? '#BE185D' : role === 'transport_admin' ? '#059669' : role === 'hod' ? '#7C3AED' : '#0284C7',
    });

    showToast(t(
      `✓ New Employee ${created.name} (${created.id} · ${created.sapPernr}) onboarded! Credentials & Geofence access dispatched.`,
      `✓ নতুন কর্মচারী ${created.name} (${created.id}) সফলভাবে অন্তর্ভুক্ত হয়েছে!`,
      lang
    ), 'success');

    onClose();
  };

  return (
    <div className="modal-bg" style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: '680px' }}>
        <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #0A1227 0%, #111E3D 100%)', borderBottom: '2px solid var(--brand-crimson)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(225,29,72,0.2)', color: 'var(--brand-crimson)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#F8FAFC' }}>
                {t('Onboard New Enterprise Personnel', 'নতুন কর্মচারী অনবোর্ডিং ও মাস্টার প্রোফাইল', lang)}
              </h3>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>BOGCL Workforce Master Registry · SAP S/4HANA Personnel Sync</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Full Name (English) *', 'পুরো নাম (ইংরেজি) *', lang)}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Ashraful Alam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('Full Name (Bengali)', 'পুরো নাম (বাংলা)', lang)}</label>
                <input
                  type="text"
                  placeholder="উদাঃ মোঃ আশরাফুল আলম"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Official Email Address *', 'দাপ্তরিক ইমেইল *', lang)}</label>
                <input
                  type="email"
                  placeholder="ashraful.refinery@bashundhara.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('Duty Mobile Phone *', 'ডিউটি মোবাইল নম্বর *', lang)}</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Designation / Official Title *', 'পদবি *', lang)}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Asphalt Quality Chemist"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('SAP Personnel No (PERNR)', 'এসএপি পার্সোনেল নং', lang)}</label>
                <input
                  type="text"
                  style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  value={sapPernr}
                  onChange={(e) => setSapPernr(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Department Unit *', 'বিভাগ *', lang)}</label>
                <select value={dept} onChange={(e) => setDept(e.target.value as Employee['dept'])}>
                  <option value="Plant Operations">Plant Operations (Keraniganj Refinery)</option>
                  <option value="Sales & Distribution">Sales & Distribution (Highway Projects)</option>
                  <option value="Finance & Accounts">Finance & Accounts Department</option>
                  <option value="Transport & Logistics">Transport & Logistics Fleet Division</option>
                  <option value="HSE & Compliance">HSE, Fire & Compliance Directorate</option>
                  <option value="Human Resources">Human Resources & Corporate Services</option>
                  <option value="Security Administration">Security & Gate Administration</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('System RBAC Role Access *', 'সিস্টেম এক্সেস রোল *', lang)}</label>
                <select value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
                  <option value="employee">Staff Self-Service Portal (Standard Staff)</option>
                  <option value="hod">Head of Department / Approver (HOD)</option>
                  <option value="transport_admin">Transport & Admin Supervisor</option>
                  <option value="plant_gm">Plant General Manager (Refinery Ops)</option>
                  <option value="hr_admin">GM, HR & Corporate Services (HR Admin)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Assigned Geofence Terminal *', 'কর্মস্থল / জিওফেন্স টার্মিনাল *', lang)}</label>
                <select value={assignedSite} onChange={(e) => setAssignedSite(e.target.value as Employee['assignedSite'])}>
                  <option value="PLANT_KERANIGANJ">Site B: Keraniganj Bitumen Refinery Complex</option>
                  <option value="HQ_BARIDHARA">Site A: Corporate Headquarters (Baridhara)</option>
                  <option value="TERMINAL_CTG">Site C: Chattogram Coastal Marine Terminal</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('Blood Group & Emergency Phone', 'রক্তের গ্রুপ ও জরুরি যোগাযোগ', lang)}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px' }}>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                    <option value="AB-">AB-</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Emergency Contact"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--brand-slate-100)', border: '1px solid var(--brand-slate-200)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '11.5px', color: 'var(--brand-slate-600)' }}>
              🔒 <strong>Corporate Governance:</strong> Submitting this profile generates a verifiable Personnel Master Record, binds geofence biometric check-in rights, and provisions corporate email & single sign-on.
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button type="submit" className="btn-primary" style={{ fontWeight: 800 }}>
              <Check size={14} />
              {t('Onboard & Grant System Access', 'অনবোর্ডিং সম্পন্ন করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
