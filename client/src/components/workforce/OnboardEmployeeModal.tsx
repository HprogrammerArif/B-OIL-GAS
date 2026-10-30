import React, { useState } from 'react';
import { Lang, t, AppRole } from '../../types';
import { Employee, useEmployeeStore } from '../../store/employeeStore';
import { showToast } from '../../App';
import { X, UserPlus, Check } from 'lucide-react';

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
  const [sapPernr, setSapPernr] = useState(`EMP-${Math.floor(1000 + Math.random() * 8999)}`);
  const [dept, setDept] = useState<Employee['dept']>('Plant Operations');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState<AppRole>('employee');
  const [assignedSite, setAssignedSite] = useState<Employee['assignedSite']>('PLANT_KERANIGANJ');
  const [nationalId, setNationalId] = useState('199' + Math.floor(1000000000000 + Math.random() * 900000000000));
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [emergencyContact, setEmergencyContact] = useState('+880 1819-000000');

  if (!isOpen) return null;

  const resolveManagerByDept = (d: Employee['dept']) => {
    switch (d) {
      case 'Plant Operations': return 'Engr. Harunur Rashid (EMP-0012)';
      case 'Finance & Accounts': return 'A.T.M. Mostafa (EMP-0004)';
      case 'Human Resources': return 'Sayeed Ahmed (EMP-0003)';
      case 'Transport & Logistics': return 'Kazi Masud (EMP-0007)';
      case 'Sales & Distribution': return 'Shahidul Alam (EMP-0006)';
      case 'HSE & Compliance': return 'Dr. Farhana Yasmin (EMP-0005)';
      default: return 'Sayeed Ahmed (EMP-0003)';
    }
  };

  const handleDeptChange = (newDept: Employee['dept']) => {
    setDept(newDept);
  };

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

    const reportingHOD = resolveManagerByDept(dept);

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
      avatarColor: role === 'chairman' ? '#A51C30' : role === 'plant_gm' ? '#0369A1' : role === 'hr_admin' ? '#BE185D' : role === 'transport_admin' ? '#059669' : role === 'hod' ? '#7C3AED' : role === 'driver' ? '#F59E0B' : '#0284C7',
    });

    showToast(t(
      `✓ New Employee ${created.name} (${created.id}) registered successfully! Access rights assigned.`,
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
                {t('Add New Employee to Directory', 'নতুন কর্মী অন্তর্ভুক্তিকরণ', lang)}
              </h3>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>BOGCL Staff Directory & Payroll Profile</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
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

            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
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
                <label>{t('Contact Phone Number *', 'মোবাইল নম্বর *', lang)}</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Designation / Job Title *', 'পদবি *', lang)}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Asphalt Quality Chemist"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('Payroll Staff Reference ID', 'পেরোল / কর্মী রেফারেন্স আইডি', lang)}</label>
                <input
                  type="text"
                  style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  value={sapPernr}
                  onChange={(e) => setSapPernr(e.target.value)}
                />
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Department Unit *', 'বিভাগ *', lang)}</label>
                <select value={dept} onChange={(e) => handleDeptChange(e.target.value as Employee['dept'])}>
                  <option value="Plant Operations">Plant Operations (Keraniganj Refinery)</option>
                  <option value="Sales & Distribution">Sales & Distribution (Highway Projects)</option>
                  <option value="Finance & Accounts">Finance & Accounts Department</option>
                  <option value="Transport & Logistics">Transport & Logistics Fleet Division</option>
                  <option value="HSE & Compliance">HSE & Safety Department</option>
                  <option value="Human Resources">Human Resources & Corporate Administration</option>
                  <option value="Security Administration">Security & Facility Gate Control</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('System Access Role *', 'সিস্টেম এক্সেস রোল *', lang)}</label>
                <select value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
                  <option value="employee">Standard Staff (Self-Service Portal)</option>
                  <option value="driver">Driver (Fleet & Trips App)</option>
                  <option value="hod">Head of Department (Reviewer & Approver)</option>
                  <option value="transport_admin">Transport Supervisor (Fleet Manager)</option>
                  <option value="plant_gm">Plant General Manager (Refinery Ops)</option>
                  <option value="hr_admin">HR Administrator (People & Personnel)</option>
                </select>
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Primary Work Location *', 'প্রাথমিক কর্মস্থল *', lang)}</label>
                <select value={assignedSite} onChange={(e) => setAssignedSite(e.target.value as Employee['assignedSite'])}>
                  <option value="PLANT_KERANIGANJ">Keraniganj Bitumen Refinery Plant</option>
                  <option value="HQ_BARIDHARA">Baridhara Corporate Head Office</option>
                  <option value="TERMINAL_CTG">Chattogram Marine Port Depot</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('Blood Group & Emergency Contact', 'রক্তের গ্রুপ ও জরুরি ফোন নম্বর', lang)}</label>
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
              🔒 <strong>Company Policy:</strong> Adding this profile creates a staff master record, assigns reporting hierarchy to <strong>{resolveManagerByDept(dept)}</strong>, and authorizes site attendance.
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button type="submit" className="btn-primary" style={{ fontWeight: 800 }}>
              <Check size={14} />
              {t('Save & Create Profile', 'সংরক্ষণ করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
