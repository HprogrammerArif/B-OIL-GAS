import React, { useState } from 'react';
import { Lang, t } from '../../types';
import { useFleetStore, Driver } from '../../store/fleetStore';
import { showToast } from '../../App';
import { X, UserPlus, Check, Award, Phone, ShieldCheck } from 'lucide-react';

interface EnrollDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

export default function EnrollDriverModal({ isOpen, onClose, lang }: EnrollDriverModalProps) {
  const { addDriver, vehicles } = useFleetStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+880 17');
  const [licenseNo, setLicenseNo] = useState(`DK-BRTA-2022-${Math.floor(1000 + Math.random() * 9000)}`);
  const [licenseType, setLicenseType] = useState<Driver['licenseType']>('Heavy Commercial (HAZMAT)');
  const [licenseExpiry, setLicenseExpiry] = useState('18 Oct 2029');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [assignedVehiclePlate, setAssignedVehiclePlate] = useState(vehicles[0]?.plate || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(t('Please enter driver full name.', 'অনুগ্রহ করে চালকের নাম লিখুন।', lang), 'info');
      return;
    }
    if (!licenseNo.trim()) {
      showToast(t('Please enter BRTA commercial license number.', 'অনুগ্রহ করে বিআরটিএ ড্রাইভিং লাইসেন্স নম্বর দিন।', lang), 'info');
      return;
    }

    const created = addDriver({
      name: name.trim(),
      phone: phone.trim(),
      licenseNo: licenseNo.trim(),
      licenseType,
      licenseExpiry,
      bloodGroup,
      assignedVehiclePlate: assignedVehiclePlate || undefined,
    });

    showToast(t(
      `✓ Commercial Driver ${created.name} (${created.id}) enrolled! Sobriety & shift roster initialized.`,
      `✓ চালক ${created.name} সফলভাবে তালিকাভুক্ত হয়েছে!`,
      lang
    ), 'success');

    onClose();
  };

  return (
    <div
      className="modal-bg"
      onClick={onClose}
      style={{
        zIndex: 99999,
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="fleet-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(15, 23, 42, 0.1)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          className="fleet-modal-hd"
          style={{
            padding: '18px 28px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #871424 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                flexShrink: 0,
              }}
            >
              <UserPlus size={20} color="#FFFFFF" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                {t('Enroll New Commercial Fleet Driver', 'নতুন বাণিজ্যিক চালক তালিকাভুক্তি', lang)}
              </h3>
              <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '2px' }}>
                BRTA Commercial Fitness · Sobriety Baseline · Shift Verification
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', overflowY: 'auto' }}>
          <div
            className="fleet-modal-body"
            style={{
              flex: '1 1 auto',
              overflowY: 'auto',
              padding: '26px 32px',
              backgroundColor: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          >
            {/* 2-column legal name & mobile */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '18px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span>{t('Driver Full Legal Name *', 'চালকের পুরো নাম *', lang)}</span>
                </div>
                <input
                  type="text"
                  required
                  className="notice-input"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="e.g. Md. Anowar Hossain"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <div className="notice-field-label">
                  <span>{t('Contact Phone Number *', 'মোবাইল নম্বর *', lang)}</span>
                </div>
                <input
                  type="text"
                  required
                  className="notice-input"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* 2-column BRTA license & expiry */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '18px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span>{t('BRTA License Number *', 'বিআরটিএ লাইসেন্স নম্বর *', lang)}</span>
                </div>
                <input
                  type="text"
                  required
                  className="notice-input"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    boxSizing: 'border-box',
                  }}
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                />
              </div>

              <div>
                <div className="notice-field-label">
                  <span>{t('License Expiry Date', 'মেয়াদ উত্তীর্ণের তারিখ', lang)}</span>
                </div>
                <input
                  type="text"
                  className="notice-input"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                />
              </div>
            </div>

            {/* 2-column class & blood group */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 0.6fr',
                gap: '16px',
                marginBottom: '18px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span>{t('Commercial License Class *', 'লাইসেন্স শ্রেণি *', lang)}</span>
                </div>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value as Driver['licenseType'])}
                  className="notice-select"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Heavy Commercial (HAZMAT)">Heavy Commercial (HAZMAT Bitumen/Petroleum)</option>
                  <option value="PSV Microbus">PSV Microbus (Passenger Service Vehicle)</option>
                  <option value="Light Commercial">Light Commercial (Sedan/Pickup)</option>
                </select>
              </div>

              <div>
                <div className="notice-field-label">
                  <span>{t('Emergency Blood *', 'রক্তের গ্রুপ *', lang)}</span>
                </div>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="notice-select"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="O+">O+</option>
                  <option value="AB+">AB+</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="O-">O-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            {/* Assigned vehicle */}
            <div className="notice-field-group" style={{ marginBottom: '18px' }}>
              <div className="notice-field-label">
                <span>{t('Primary Assigned Vehicle (Optional)', 'প্রাথমিক বরাদ্দকৃত গাড়ি', lang)}</span>
              </div>
              <select
                value={assignedVehiclePlate}
                onChange={(e) => setAssignedVehiclePlate(e.target.value)}
                className="notice-select"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Unassigned (General Pool Driver)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.plate}>
                    {v.plate} — {v.model} ({v.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Sobriety & Security Compliance Card */}
            <div
              style={{
                padding: '14px 18px',
                background: '#F0FDF4',
                borderRadius: '12px',
                border: '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#DCFCE7',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#166534' }}>
                  Sobriety & Road Safety Compliance Protocol
                </div>
                <div style={{ fontSize: '11.5px', color: '#15803D', marginTop: '2px', lineHeight: 1.5 }}>
                  Daily breathalyzer audit records (0.00% BAC) and fitness checks automatically bind to this driver's digital profile before official trip challan passes can be dispatched.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="fleet-modal-ft"
            style={{
              padding: '16px 28px',
              backgroundColor: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              boxSizing: 'border-box',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                cursor: 'pointer',
              }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(165, 28, 48, 0.35)',
              }}
            >
              <Check size={15} />
              {t('Enroll Driver into Roster', 'চালক অন্তর্ভুক্ত করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
