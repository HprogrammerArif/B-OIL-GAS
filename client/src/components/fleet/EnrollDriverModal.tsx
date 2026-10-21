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
      name,
      phone,
      licenseNo,
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
    <div className="modal-bg" style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #0A1227 0%, #111E3D 100%)', borderBottom: '2px solid var(--brand-crimson)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(225,29,72,0.2)', color: 'var(--brand-crimson)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#F8FAFC' }}>
                {t('Enroll New Commercial Fleet Driver', 'নতুন বাণিজ্যিক চালক তালিকাভুক্তি', lang)}
              </h3>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>BRTA Commercial Fitness · Sobriety Baseline · Shift Verification</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Driver Full Legal Name *', 'চালকের পুরো নাম *', lang)}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Anowar Hossain"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('BRTA License Number *', 'বিআরটিএ লাইসেন্স নম্বর *', lang)}</label>
                <input
                  type="text"
                  required
                  style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>{t('License Expiry Date', 'মেয়াদ উত্তীর্ণের তারিখ', lang)}</label>
                <input
                  type="text"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                />
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label>{t('Commercial License Class *', 'লাইসেন্স শ্রেণি *', lang)}</label>
                <select value={licenseType} onChange={(e) => setLicenseType(e.target.value as Driver['licenseType'])}>
                  <option value="Heavy Commercial (HAZMAT)">Heavy Commercial (HAZMAT Bitumen/Petroleum)</option>
                  <option value="PSV Microbus">PSV Microbus (Passenger Service Vehicle)</option>
                  <option value="Light Commercial">Light Commercial (Sedan/Pickup)</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('Emergency Blood Group *', 'রক্তের গ্রুপ *', lang)}</label>
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
              </div>
            </div>

            <div className="form-group">
              <label>{t('Primary Assigned Vehicle (Optional)', 'প্রাথমিক বরাদ্দকৃত গাড়ি', lang)}</label>
              <select value={assignedVehiclePlate} onChange={(e) => setAssignedVehiclePlate(e.target.value)}>
                <option value="">Unassigned (General Pool Driver)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.plate}>
                    {v.plate} — {v.model} ({v.type})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ background: 'var(--brand-slate-100)', border: '1px solid var(--brand-slate-200)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--brand-slate-500)' }}>
              🔒 <strong>Sobriety Baseline Initialized:</strong> Daily breathalyzer audit records will automatically bind to this driver before duty trip pass dispatch is authorized.
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button type="submit" className="btn-primary" style={{ fontWeight: 800 }}>
              <Check size={14} />
              {t('Enroll Driver into Roster', 'চালক অন্তর্ভুক্ত করুন', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
