import React, { useState } from 'react';
import { Lang, t } from '../../types';
import { Employee, useEmployeeStore } from '../../store/employeeStore';
import { useAssetStore } from '../../store/assetStore';
import { showToast } from '../../App';
import { X, ShieldAlert, CheckCircle, RotateCcw, Laptop, Key, CreditCard, DollarSign, Wrench, Check } from 'lucide-react';

interface OffboardClearanceDrawerProps {
  employee: Employee | null;
  onClose: () => void;
  lang: Lang;
}

export default function OffboardClearanceDrawer({ employee, onClose, lang }: OffboardClearanceDrawerProps) {
  const { employees, updateClearanceItem, finalizeOffboarding, reactivateEmployee } = useEmployeeStore();
  const { assets, reclaimEmployeeAssets } = useAssetStore();

  const [exitDate, setExitDate] = useState('29 Oct 2026, 05:00 PM');
  const [exitReason, setExitReason] = useState('Voluntary resignation for personal career progression.');
  const [clearanceNotes, setClearanceNotes] = useState('');

  if (!employee) return null;

  // Reactive live employee record
  const currentEmp = employees.find((e) => e.id === employee.id) || employee;

  const heldAssets = assets.filter(
    (a) =>
      a.lifecycleStage !== 'disposed' &&
      a.lifecycleStage !== 'in_stock' &&
      (a.custodianEmpId === currentEmp.id || a.custodian.toLowerCase() === currentEmp.name.toLowerCase())
  );

  const isOffboarded = currentEmp.status === 'offboarded';
  const clearance = currentEmp.clearance || {
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
    updateClearanceItem(currentEmp.id, key, !clearance[key]);
  };

  const handleReclaimAssets = () => {
    const count = reclaimEmployeeAssets(currentEmp.id, currentEmp.name, 'Sayeda Afroza Sultana (GM HR)');
    if (count > 0) {
      updateClearanceItem(currentEmp.id, 'itAccessRevoked', true);
      showToast(
        t(
          `✓ ${count} assigned company equipment returned by ${currentEmp.name} to Central Store Pool!`,
          `✓ ${currentEmp.name}-এর কাছ থেকে ${count}টি সম্পদ কোম্পানি স্টোরে জমা দেওয়া হয়েছে!`,
          lang
        ),
        'success'
      );
    }
  };

  const handleFinalize = () => {
    if (heldAssets.length > 0) {
      showToast(
        t(
          `Action Required: ${currentEmp.name} still has ${heldAssets.length} active company equipment checked out. Please return items to Central Store first.`,
          `সতর্কতা: ${currentEmp.name}-এর দায়িত্বে এখনো ${heldAssets.length}টি সম্পদ রয়েছে। প্রথমে সম্পদ কোম্পানি স্টোরে জমা দিন।`,
          lang
        ),
        'warn'
      );
      return;
    }
    if (!allCleared) {
      showToast(t('Please complete all 4 department clearance items first.', 'অনুগ্রহ করে চারটি বিভাগের ছাড়পত্র নিশ্চিত করুন।', lang), 'info');
      return;
    }
    finalizeOffboarding(currentEmp.id, 'Sayeda Afroza Sultana (GM HR)', clearanceNotes, exitDate, exitReason);
    showToast(t(
      `✓ Separation complete! ${currentEmp.name} (${currentEmp.id}) moved to former employee archive. Records saved.`,
      `✓ ছাড়পত্র সম্পন্ন! ${currentEmp.name}-এর প্রোফাইল সফলভাবে আর্কাইভ করা হয়েছে।`,
      lang
    ), 'gold');
    onClose();
  };

  const handleReactivate = () => {
    reactivateEmployee(currentEmp.id);
    showToast(t(
      `✓ Employee ${currentEmp.name} (${currentEmp.id}) reactivated to Active Duty!`,
      `✓ কর্মচারী ${currentEmp.name} পুনরায় সক্রিয় করা হয়েছে!`,
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
                  ? t('Former Employee Clearance Record', 'সাবেক কর্মচারীর ছাড়পত্র রেকর্ড', lang)
                  : t('Employee Exit & Department Clearance', 'কর্মচারী ছাড়পত্র ও বিভাগীয় ক্লিয়ারেন্স', lang)}
              </h3>
              <div style={{ fontSize: '11px', color: '#FDE68A' }}>
                {currentEmp.name} · {currentEmp.id} · {currentEmp.dept}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Identity Capsule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--brand-slate-100)', borderRadius: '8px', border: '1px solid var(--brand-slate-200)', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: currentEmp.avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
              {currentEmp.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>{currentEmp.name}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)' }}>
                {currentEmp.designation} · <strong>{currentEmp.dept}</strong>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                NID: {currentEmp.nationalId} • Site: {currentEmp.assignedSite.replace('_', ' ')} • Joined: {currentEmp.joinDate}
              </div>
            </div>
            <span className={`badge ${isOffboarded ? 'danger' : 'success'}`}>
              {isOffboarded ? 'OFFBOARDED' : 'ACTIVE DUTY'}
            </span>
          </div>

          {/* Separation Details */}
          {!isOffboarded ? (
            <div style={{ marginBottom: '16px' }}>
              <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '10px' }}>
                <div>
                  <label>{t('Formal Exit Effective Date', 'চাকরি সমাপ্তির তারিখ', lang)}</label>
                  <input
                    type="text"
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                  />
                </div>
                <div>
                  <label>{t('Reason for Departure', 'চাকরি সমাপ্তির কারণ', lang)}</label>
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
              <div><strong>Exit Date:</strong> {currentEmp.exitDate}</div>
              <div style={{ marginTop: '3px' }}><strong>Reason for Leaving:</strong> {currentEmp.exitReason}</div>
              <div style={{ marginTop: '3px', color: '#059669', fontWeight: 700 }}>
                ✓ Cleared & Authorized by: {clearance.clearedBy} ({clearance.clearedAt})
              </div>
            </div>
          )}

          {/* Assigned Equipment Return Section */}
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: heldAssets.length > 0 ? '1.5px solid #F59E0B' : '1px solid rgba(16, 185, 129, 0.35)',
              background: heldAssets.length > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.07)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: heldAssets.length > 0 ? '10px' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={15} color={heldAssets.length > 0 ? '#D97706' : '#059669'} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                    {t('Company Equipment & Asset Return', 'কোম্পানির সম্পদ ও যন্ত্রপাতি জমা', lang)}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                    {heldAssets.length > 0
                      ? t(
                          `${heldAssets.length} company asset(s) currently assigned to ${currentEmp.name}. Must be returned before final clearance.`,
                          `${currentEmp.name}-এর হেফাজতে ${heldAssets.length}টি সম্পদ রয়েছে যা ছাড়পত্রের পূর্বে জমা দিতে হবে।`,
                          lang
                        )
                      : t(
                          'All equipment returned. No company assets currently held by this employee.',
                          'সমস্ত যন্ত্রপাতি জমা সম্পন্ন হয়েছে। এই কর্মীর দায়িত্বে কোনো কোম্পানি সম্পদ নেই।',
                          lang
                        )}
                  </div>
                </div>
              </div>
              {heldAssets.length > 0 && !isOffboarded ? (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ fontSize: '11px', padding: '6px 11px', fontWeight: 700 }}
                  onClick={handleReclaimAssets}
                >
                  <RotateCcw size={12} />
                  {t('Return All to Company Store', 'সব সম্পদ স্টোরে জমা নিন', lang)}
                </button>
              ) : (
                <span className="badge success">{t('NO ASSETS HELD', 'সম্পদ জমা সম্পন্ন', lang)}</span>
              )}
            </div>

            {heldAssets.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                {heldAssets.map((ast) => (
                  <div
                    key={ast.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: 'var(--brand-card-bg)',
                      border: '1px solid var(--brand-slate-200)',
                      fontSize: '11.5px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-crimson)', marginRight: '6px' }}>
                        {ast.tag}
                      </span>
                      <strong style={{ color: 'var(--brand-slate-900)' }}>{ast.name}</strong>
                      <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', marginTop: '1px' }}>
                        Location: {ast.functionalLocation}
                      </div>
                    </div>
                    <span className="badge warn" style={{ flexShrink: 0 }}>
                      ৳{ast.purchaseCost.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4-Way Department Clearance Checklist */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--brand-slate-800)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} color="var(--brand-crimson)" />
              {t('4-Step Department Clearance Checklist', 'চারটি বিভাগের বাধ্যতামূলক ছাড়পত্র যাচাই', lang)}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 1. IT & Email Access */}
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
                      1. IT, Email & System Accounts
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                      Company email closed, IT equipment returned, login access deactivated
                    </div>
                  </div>
                </div>
                <span className={`badge ${clearance.itAccessRevoked ? 'success' : 'warn'}`}>
                  {clearance.itAccessRevoked ? 'COMPLETED' : 'PENDING'}
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
                      2. Office & Plant Gate Pass / Security Badge
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                      Keraniganj Plant & Baridhara Head Office security ID badge surrendered
                    </div>
                  </div>
                </div>
                <span className={`badge ${clearance.rfidGateBadgeSurrendered ? 'success' : 'warn'}`}>
                  {clearance.rfidGateBadgeSurrendered ? 'COMPLETED' : 'PENDING'}
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
                      3. Company Bus Seat & Vehicle Fuel Cards
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                      Office commute bus seat surrendered, any fuel cards returned
                    </div>
                  </div>
                </div>
                <span className={`badge ${clearance.vehicleFuelCardReturned ? 'success' : 'warn'}`}>
                  {clearance.vehicleFuelCardReturned ? 'COMPLETED' : 'PENDING'}
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
                      4. Finance, Travel Advance & Final Dues
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)' }}>
                      Conveyance claims reconciled, outstanding advances and final settlement cleared
                    </div>
                  </div>
                </div>
                <span className={`badge ${clearance.financeAccountsSettled ? 'success' : 'warn'}`}>
                  {clearance.financeAccountsSettled ? 'COMPLETED' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {!isOffboarded && (
            <div className="form-group">
              <label>{t('HR Clearance Notes & Remarks', 'এইচআর মন্তব্য ও ছাড়পত্র নোট', lang)}</label>
              <textarea
                rows={2}
                placeholder="e.g. All 4 department clearances verified by HR GM. Final clearance certificate issued."
                value={clearanceNotes}
                onChange={(e) => setClearanceNotes(e.target.value)}
              />
            </div>
          )}

          <div style={{ background: 'var(--brand-slate-100)', border: '1px solid var(--brand-slate-200)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--brand-slate-500)' }}>
            🔒 <strong>Corporate Policy:</strong> Offboarding preserves historical records in past notesheets, safety permits, and financial expense approvals for company audits.
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
              {t('Finalize Clearance & Archive', 'ছাড়পত্র সম্পন্ন ও আর্কাইভ করুন', lang)}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              style={{ fontWeight: 800 }}
              onClick={handleReactivate}
            >
              <RotateCcw size={14} />
              {t('Reactivate Employee', 'পুনরায় সক্রিয় করুন', lang)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
