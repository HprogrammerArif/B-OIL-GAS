import React, { useState } from 'react';
import { Lang, t } from '../../types';
import { Employee, useEmployeeStore } from '../../store/employeeStore';
import { showToast } from '../../App';
import { X, ShieldAlert, CheckCircle, AlertTriangle, RotateCcw, FileText, Check, Lock, Laptop, Key, CreditCard, DollarSign } from 'lucide-react';

interface OffboardClearanceDrawerProps {
  employee: Employee | null;
  onClose: () => void;
  lang: Lang;
}

export default function OffboardClearanceDrawer({ employee, onClose, lang }: OffboardClearanceDrawerProps) {
  const { updateClearanceItem, finalizeOffboarding, reactivateEmployee } = useEmployeeStore();

  const [exitDate, setExitDate] = useState('Today, 05:00 PM');
  const [exitReason, setExitReason] = useState('Voluntary resignation for personal and professional career transition.');
  const [clearanceNotes, setClearanceNotes] = useState('');

  if (!employee) return null;

  const isOffboarded = employee.status === 'offboarded';
  const clearance = employee.clearance || {
    itAccessRevoked: true,
    rfidGateBadgeSurrendered: false,
    vehicleFuelCardReturned: false,
    financeAccountsSettled: false,
  };

  const allCleared =
    clearance.itAccessRevoked &&
    clearance.rfidGateBadgeSurrendered &&
    clearance.vehicleFuelCardReturned &&
    clearance.financeAccountsSettled;

  const handleToggle = (key: 'itAccessRevoked' | 'rfidGateBadgeSurrendered' | 'vehicleFuelCardReturned' | 'financeAccountsSettled') => {
    if (isOffboarded) return;
    updateClearanceItem(employee.id, key, !clearance[key]);
  };

  const handleFinalize = () => {
    if (!allCleared) {
      showToast(t('Please complete all 4 departmental clearance items first.', 'অনুগ্রহ করে চারটি বিভাগের ছাড়পত্র নিশ্চিত করুন।', lang), 'info');
      return;
    }
    finalizeOffboarding(employee.id, 'Sayeda Afroza Sultana (GM HR)', clearanceNotes);
    showToast(t(
      `✓ Separation complete! ${employee.name} (${employee.id}) moved to former personnel archive. Historical records preserved.`,
      `✓ ছাড়পত্র সম্পন্ন! ${employee.name} এর মাস্টার ডাটা নিরাপদে আর্কাইভ করা হয়েছে।`,
      lang
    ), 'gold');
    onClose();
  };

  const handleReactivate = () => {
    reactivateEmployee(employee.id);
    showToast(t(
      `✓ Personnel ${employee.name} (${employee.id}) reactivated to Active Duty roster!`,
      `✓ কর্মচারী ${employee.name} পুনরায় সক্রিয় করা হয়েছে!`,
      lang
    ), 'success');
    onClose();
  };

  return (
    <div className="modal-bg" style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div className="modal-hd" style={{ background: isOffboarded ? '#0A1227' : 'linear-gradient(135deg, #7F1424 0%, #A51C30 100%)', borderBottom: '2px solid var(--brand-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#F8FAFC' }}>
                {isOffboarded
                  ? t('Offboarded Personnel Archive & Exit Dossier', 'সাবেক কর্মচারীর ছাড়পত্র ও নথিপত্র', lang)
                  : t('Personnel Separation & 4-Way Exit Clearance', 'কর্মচারী ছাড়পত্র ও ডিপার্টমেন্টাল ক্লিয়ারেন্স', lang)}
              </h3>
              <div style={{ fontSize: '11px', color: '#FDE68A' }}>
                {employee.name} · {employee.id} · {employee.sapPernr}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Identity Capsule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--brand-slate-100)', borderRadius: '8px', border: '1px solid var(--brand-slate-200)', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: employee.avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
              {employee.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>{employee.name}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                {employee.designation} · <strong>{employee.dept}</strong>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)', marginTop: '2px', fontFamily: 'monospace' }}>
                NID: {employee.nationalId} • Site: {employee.assignedSite.replace('_', ' ')} • Joined: {employee.joinDate}
              </div>
            </div>
            <span className={`badge ${isOffboarded ? 'danger' : 'success'}`}>
              {isOffboarded ? 'OFFBOARDED' : 'ACTIVE DUTY'}
            </span>
          </div>

          {/* Separation Details */}
          {!isOffboarded ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label>{t('Formal Exit Effective Date', 'চাকরি সমাপ্তির তারিখ', lang)}</label>
                  <input
                    type="text"
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                  />
                </div>
                <div>
                  <label>{t('Separation Reason / Justification', 'চাকরি সমাপ্তির কারণ', lang)}</label>
                  <input
                    type="text"
                    value={exitReason}
                    onChange={(e) => setExitReason(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
              <div><strong>Exit Date:</strong> {employee.exitDate}</div>
              <div style={{ marginTop: '3px' }}><strong>Exit Reason:</strong> {employee.exitReason}</div>
              <div style={{ marginTop: '3px', color: '#059669', fontWeight: 700 }}>
                ✓ Authorized by: {clearance.clearedBy} ({clearance.clearedAt})
              </div>
            </div>
          )}

          {/* 4-Way Departmental Exit Clearance Checklist */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--brand-slate-800)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} color="var(--brand-crimson)" />
              {t('4-Way Mandatory Departmental Clearance', 'চারটি বিভাগের বাধ্যতামূলক ছাড়পত্র অডিট', lang)}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. IT & SSO Access */}
              <div
                onClick={() => handleToggle('itAccessRevoked')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--brand-slate-200)',
                  background: clearance.itAccessRevoked ? 'rgba(16, 185, 129, 0.08)' : 'var(--brand-card-bg)',
                  cursor: isOffboarded ? 'default' : 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Laptop size={18} color={clearance.itAccessRevoked ? '#059669' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                      1. IT, Single Sign-On (SSO) & Email Revocation
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                      Corporate email deactivated, laptop/assets returned, ERP credentials purged
                    </div>
                  </div>
                </div>
                <span className={`badge ${clearance.itAccessRevoked ? 'success' : 'warn'}`}>
                  {clearance.itAccessRevoked ? 'REVOKED' : 'PENDING'}
                </span>
              </div>

              {/* 2. Security Gate Badge */}
              <div
                onClick={() => handleToggle('rfidGateBadgeSurrendered')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--brand-slate-200)',
                  background: clearance.rfidGateBadgeSurrendered ? 'rgba(16, 185, 129, 0.08)' : 'var(--brand-card-bg)',
                  cursor: isOffboarded ? 'default' : 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Key size={18} color={clearance.rfidGateBadgeSurrendered ? '#059669' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                      2. Campus Biometric RFID & Gate Security Clearance
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                      Keraniganj Refinery & Baridhara physical access badges surrendered
                    </div>
                  </div>
                </div>
                <span className={`badge ${clearance.rfidGateBadgeSurrendered ? 'success' : 'warn'}`}>
                  {clearance.rfidGateBadgeSurrendered ? 'SURRENDERED' : 'PENDING'}
                </span>
              </div>

              {/* 3. Transport & Fleet */}
              <div
                onClick={() => handleToggle('vehicleFuelCardReturned')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--brand-slate-200)',
                  background: clearance.vehicleFuelCardReturned ? 'rgba(16, 185, 129, 0.08)' : 'var(--brand-card-bg)',
                  cursor: isOffboarded ? 'default' : 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={18} color={clearance.vehicleFuelCardReturned ? '#059669' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                      3. Logistics, Bus Seat & Corporate Fuel Cards
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                      Route-1 bus seat released to FIFO waitlist, fuel card balances settled
                    </div>
                  </div>
                </div>
                <span className={`badge ${clearance.vehicleFuelCardReturned ? 'success' : 'warn'}`}>
                  {clearance.vehicleFuelCardReturned ? 'CLEARED' : 'PENDING'}
                </span>
              </div>

              {/* 4. Finance & Accounts */}
              <div
                onClick={() => handleToggle('financeAccountsSettled')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--brand-slate-200)',
                  background: clearance.financeAccountsSettled ? 'rgba(16, 185, 129, 0.08)' : 'var(--brand-card-bg)',
                  cursor: isOffboarded ? 'default' : 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <DollarSign size={18} color={clearance.financeAccountsSettled ? '#059669' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                      4. Finance, Travel Advance & Final Dues Settlement
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                      Conveyance claims reconciled, unspent tour advance refunded to accounts
                    </div>
                  </div>
                </div>
                <span className={`badge ${clearance.financeAccountsSettled ? 'success' : 'warn'}`}>
                  {clearance.financeAccountsSettled ? 'SETTLED' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {!isOffboarded && (
            <div className="form-group">
              <label>{t('Final HR Clearance Audit Log / Remarks', 'এইচআর অডিট মন্তব্য', lang)}</label>
              <textarea
                rows={2}
                placeholder="e.g. All 4 department clearances verified by HR GM. Final clearance certificate issued."
                value={clearanceNotes}
                onChange={(e) => setClearanceNotes(e.target.value)}
              />
            </div>
          )}

          <div style={{ background: 'var(--brand-slate-100)', border: '1px solid var(--brand-slate-200)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--brand-slate-500)' }}>
            🔒 <strong>Enterprise Compliance:</strong> In accordance with corporate governance policy, employee separation maintains historical foreign key referential integrity in Note-Sheets, Safety Permits, and SAP invoices.
          </div>
        </div>

        <div className="modal-ft">
          <button type="button" className="btn-sm-ghost" onClick={onClose}>
            {t('Close', 'বন্ধ করুন', lang)}
          </button>

          {!isOffboarded ? (
            <button
              type="button"
              className="btn-danger"
              style={{ fontWeight: 800 }}
              onClick={handleFinalize}
            >
              <Check size={14} />
              {t('Finalize Offboarding & Archive', 'ছাড়পত্র চূড়ান্ত ও আর্কাইভ করুন', lang)}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              style={{ fontWeight: 800 }}
              onClick={handleReactivate}
            >
              <RotateCcw size={14} />
              {t('Reactivate to Active Duty', 'পুনরায় ডিউটিতে যুক্ত করুন', lang)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
