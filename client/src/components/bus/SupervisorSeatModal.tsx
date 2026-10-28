import React, { useState, useEffect } from 'react';
import { Seat, RouteInfo } from './busTypes';
import { t } from '../../types';
import {
  Shield, X, CheckCircle, UserMinus, UserCheck, AlertTriangle,
  UserPlus, Phone, Building, Award, Check, Sparkles, MapPin, Clock, Tag
} from 'lucide-react';

interface SupervisorSeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  seat: Seat | null;
  allSeats: Seat[];
  onAssignSeat: (updatedSeat: Seat) => void;
  onVacateSeat: (seatNum: number, reason: string) => void;
  onClearSeat: (seatNum: number) => void;
  activeRoute: RouteInfo;
  lang: 'en' | 'bn';
}

const EMPLOYEE_PRESETS = [
  { name: 'Tanvir Ahmed', staffId: 'EMP-1042', dept: 'Sales & Distribution', phone: '+880 1720-334455', blood: 'B+' },
  { name: 'Engr. Harunur Rashid', staffId: 'EMP-0104', dept: 'Plant GM & Operations', phone: '+880 1711-002101', blood: 'O+' },
  { name: 'Farhana Kabir', staffId: 'EMP-0312', dept: 'EHS Safety Lead', phone: '+880 1819-556677', blood: 'B+' },
  { name: 'Engr. Tariq Ahmed', staffId: 'EMP-0145', dept: 'Maintenance Div.', phone: '+880 1711-002105', blood: 'AB+' },
  { name: 'Mizanur Rahman', staffId: 'EMP-0219', dept: 'Quality Assurance', phone: '+880 1712-441122', blood: 'A+' },
  { name: 'Shariful Islam', staffId: 'EMP-0452', dept: 'Refinery Tech', phone: '+880 1713-998877', blood: 'O+' },
  { name: 'Rezaul Karim', staffId: 'EMP-0678', dept: 'Instrument Specialist', phone: '+880 1814-223344', blood: 'A+' },
  { name: 'Nurul Amin', staffId: 'EMP-0782', dept: 'Plant Accounts', phone: '+880 1715-667788', blood: 'B+' },
  { name: 'Kamrul Hasan', staffId: 'EMP-0891', dept: 'HR & Administration', phone: '+880 1816-554433', blood: 'A+' },
  { name: 'Mainul Islam', staffId: 'EMP-3656', dept: 'Flare System Tech', phone: '+880 1744-990011', blood: 'O+' },
];

export default function SupervisorSeatModal({
  isOpen,
  onClose,
  seat,
  allSeats,
  onAssignSeat,
  onVacateSeat,
  onClearSeat,
  activeRoute,
  lang,
}: SupervisorSeatModalProps) {
  const [selectedSeatNum, setSelectedSeatNum] = useState<number>(seat?.num || 1);
  const [staffName, setStaffName] = useState(seat?.assignedTo || '');
  const [staffId, setStaffId] = useState(seat?.staffId || 'EMP-');
  const [dept, setDept] = useState(seat?.dept || 'Refinery Operations');
  const [phone, setPhone] = useState(seat?.phone || '+880 17');
  const [pickupPoint, setPickupPoint] = useState(seat?.pickupPoint || activeRoute.inboundStops[0]?.name || 'Mirpur-10');
  const [pickupTime, setPickupTime] = useState(seat?.pickupTime || '07:15 AM');
  const [category, setCategory] = useState<'executive' | 'lady_priority' | 'senior_staff' | 'regular'>(
    seat?.category || 'regular'
  );
  const [bookingType, setBookingType] = useState<'permanent' | 'shift_pass' | 'guest'>(
    seat?.bookingType || 'permanent'
  );
  const [bloodGroup, setBloodGroup] = useState(seat?.bloodGroup || 'B+');
  const [vacateReasonText, setVacateReasonText] = useState('Official Headquarter Tour / Annual Leave');

  // Sync when seat changes from external trigger
  useEffect(() => {
    if (seat) {
      setSelectedSeatNum(seat.num);
      setStaffName(seat.assignedTo || '');
      setStaffId(seat.staffId || 'EMP-');
      setDept(seat.dept || 'Refinery Operations');
      setPhone(seat.phone || '+880 17');
      setPickupPoint(seat.pickupPoint || activeRoute.inboundStops[0]?.name || 'Mirpur-10');
      setPickupTime(seat.pickupTime || '07:15 AM');
      setCategory(seat.category || 'regular');
      setBookingType(seat.bookingType || 'permanent');
      setBloodGroup(seat.bloodGroup || 'B+');
    }
  }, [seat, activeRoute]);

  const handleSeatNumChange = (num: number) => {
    setSelectedSeatNum(num);
    const target = allSeats.find(s => s.num === num);
    if (target) {
      setStaffName(target.assignedTo || '');
      setStaffId(target.staffId || 'EMP-');
      setDept(target.dept || 'Refinery Operations');
      setPhone(target.phone || '+880 17');
      setPickupPoint(target.pickupPoint || activeRoute.inboundStops[0]?.name || 'Mirpur-10');
      setPickupTime(target.pickupTime || '07:15 AM');
      setCategory(target.category || 'regular');
      setBookingType(target.bookingType || 'permanent');
      setBloodGroup(target.bloodGroup || 'B+');
    }
  };

  const handlePickPreset = (preset: typeof EMPLOYEE_PRESETS[0]) => {
    setStaffName(preset.name);
    setStaffId(preset.staffId);
    setDept(preset.dept);
    setPhone(preset.phone);
    setBloodGroup(preset.blood);
  };

  if (!isOpen) return null;

  const currentSelectedSeat = allSeats.find(s => s.num === selectedSeatNum) || seat;
  const rowNumber = Math.ceil(selectedSeatNum / 4);
  const colMod = selectedSeatNum % 4;
  const colPosition = colMod === 1 ? 'Left Window' : colMod === 2 ? 'Left Aisle' : colMod === 3 ? 'Right Aisle' : 'Right Window';

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    const row = Math.ceil(selectedSeatNum / 4);
    const col = colMod === 1 ? 'left_win' : colMod === 2 ? 'left_aisle' : colMod === 3 ? 'right_aisle' : 'right_win';

    const updated: Seat = {
      num: selectedSeatNum,
      row,
      col,
      assignedTo: staffName.trim(),
      staffId: staffId.trim(),
      dept: dept.trim(),
      phone: phone.trim(),
      pickupPoint,
      pickupTime,
      status: 'occupied',
      vacatedReason: undefined,
      bloodGroup,
      boarded: false,
      category,
      bookingType,
    };

    onAssignSeat(updated);
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 9999, backdropFilter: 'blur(6px)' }}>
      <div
        className="modal"
        style={{
          maxWidth: '720px',
          width: '92vw',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #091024 0%, #172554 100%)',
          color: '#FFFFFF',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(212, 175, 55, 0.25)',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              color: '#FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.2px' }}>
                  {t('Supervisor Seat Reservation & Allocation Console', 'সুপারভাইজার সিট বরাদ্দ ও কর্মী সংরক্ষণ কনসোল', lang)}
                </h3>
                <span className="badge gold" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {activeRoute.coachNo}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>
                {activeRoute.name} • {t('Full supervisor override & permanent pass authority', 'পূর্ণ প্রশাসনিক সিট নির্ধারণ ও স্থায়ী পাস ক্ষমতা', lang)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#E2E8F0',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAssignSubmit}>
          <div style={{
            padding: '20px 24px',
            maxHeight: '74vh',
            overflowY: 'auto',
            background: 'var(--brand-card-bg, #FFFFFF)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* ─── SECTION 1: Target Seat Status & Selector ─── */}
            <div style={{
              background: 'linear-gradient(135deg, var(--brand-slate-50, #F8FAFC) 0%, #FFFFFF 100%)',
              border: '1.5px solid #D4AF37',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #091024 0%, #1e293b 100%)',
                  border: '2px solid #D4AF37',
                  color: '#FDE68A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '18px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                }}>
                  #{selectedSeatNum}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--brand-slate-900)' }}>
                      {t('Seat Position', 'আসন অবস্থান', lang)}: #{selectedSeatNum}
                    </span>
                    <span className="badge info" style={{ fontSize: '10px' }}>
                      Row {rowNumber} • {colPosition}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)', marginTop: '4px' }}>
                    {t('Current Status', 'বর্তমান অবস্থা', lang)}:{' '}
                    <strong style={{
                      color: currentSelectedSeat?.status === 'occupied' ? '#059669' : currentSelectedSeat?.status === 'vacated' ? '#D97706' : '#2563EB'
                    }}>
                      {currentSelectedSeat?.status === 'occupied'
                        ? `Occupied by ${currentSelectedSeat.assignedTo}`
                        : currentSelectedSeat?.status === 'vacated'
                        ? 'Vacated for Standby FIFO'
                        : 'Unassigned / Open'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Direct Seat Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-slate-700)' }}>
                  {t('Switch Seat (1–52):', 'সিট বাছুন:', lang)}
                </span>
                <select
                  className="form-input"
                  style={{ width: '105px', padding: '7px 10px', fontSize: '12.5px', borderRadius: '8px', fontWeight: 800 }}
                  value={selectedSeatNum}
                  onChange={e => handleSeatNumChange(Number(e.target.value))}
                >
                  {allSeats.map(s => (
                    <option key={s.num} value={s.num}>
                      Seat #{s.num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─── SECTION 2: Quick-Fill Registered Staff Member Strip ─── */}
            <div style={{
              background: 'var(--brand-slate-50, #F8FAFC)',
              border: '1px solid var(--brand-border, #E2E8F0)',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} color="#B45309" />
                <span>{t('1-Click Quick-Fill Registered Employee:', 'কর্মচারী তালিকা থেকে সরাসরি অটোফিল:', lang)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {EMPLOYEE_PRESETS.map(p => (
                  <button
                    key={p.staffId}
                    type="button"
                    onClick={() => handlePickPreset(p)}
                    style={{
                      background: staffId === p.staffId ? 'rgba(212, 175, 55, 0.2)' : '#FFFFFF',
                      border: staffId === p.staffId ? '1.5px solid #D4AF37' : '1px solid var(--brand-border)',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: staffId === p.staffId ? '#B45309' : 'var(--brand-slate-700)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>👤</span>
                    <span>{p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}</span>
                    <span style={{ opacity: 0.65, fontSize: '9.5px' }}>({p.staffId})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── SECTION 3: Passenger Profile Inputs ─── */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--brand-border, #E2E8F0)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    {t('Employee / Passenger Full Name', 'কর্মচারীর নাম', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    {t('Staff ID / SAP PERNR', 'কর্মচারী আইডি', lang)} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    value={staffId}
                    onChange={e => setStaffId(e.target.value)}
                    placeholder="EMP-1042"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    {t('Department / Plant Division', 'বিভাগ / প্ল্যান্ট শাখা', lang)}
                  </label>
                  <input
                    className="form-input"
                    value={dept}
                    onChange={e => setDept(e.target.value)}
                    placeholder="Sales & Distribution"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    {t('Mobile Contact Number (SMS Gate Pass)', 'মোবাইল নম্বর (গেট পাস SMS)', lang)}
                  </label>
                  <input
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+880 1720-334455"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              {/* Stoppage Point & Timings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    <MapPin size={13} style={{ display: 'inline', marginRight: '4px', color: '#2563EB' }} />
                    {t('Designated Boarding Stoppage', 'বোর্ডিং স্টপেজ পয়েন্ট', lang)}
                  </label>
                  <select
                    className="form-input"
                    value={pickupPoint}
                    onChange={e => {
                      setPickupPoint(e.target.value);
                      const matched = activeRoute.inboundStops.find(s => s.name === e.target.value);
                      if (matched) setPickupTime(matched.scheduledTime);
                    }}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                  >
                    {activeRoute.inboundStops.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.scheduledTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-800)' }}>
                    <Clock size={13} style={{ display: 'inline', marginRight: '4px', color: '#D97706' }} />
                    {t('Morning Boarding Time', 'পিকআপ সময়', lang)}
                  </label>
                  <input
                    className="form-input"
                    value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                    placeholder="07:18 AM"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '12.5px', borderRadius: '8px', fontWeight: 700 }}
                  />
                </div>
              </div>
            </div>

            {/* ─── SECTION 4: Priority Category & Entitlement Mode ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div style={{
                background: 'var(--brand-slate-50, #F8FAFC)',
                border: '1px solid var(--brand-border)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: 'var(--brand-slate-800)', marginBottom: '8px' }}>
                  {t('Seat Priority Classification', 'আসন অগ্রাধিকার শ্রেণী', lang)}
                </label>
                <select
                  className="form-input"
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px' }}
                >
                  <option value="regular">Regular Staff Commuter</option>
                  <option value="executive">Executive / Lead Plant Engineer (Row 1–2)</option>
                  <option value="lady_priority">Lady Priority Dedicated Seat</option>
                  <option value="senior_staff">Senior Management / Specialist</option>
                </select>
              </div>

              <div style={{
                background: 'var(--brand-slate-50, #F8FAFC)',
                border: '1px solid var(--brand-border)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: 'var(--brand-slate-800)', marginBottom: '8px' }}>
                  {t('Reservation Entitlement Mode', 'বরাদ্দের ধরন', lang)}
                </label>
                <select
                  className="form-input"
                  value={bookingType}
                  onChange={e => setBookingType(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px' }}
                >
                  <option value="permanent">Permanent Designated Pass (Everyday Commute)</option>
                  <option value="shift_pass">Monthly Shift Duty Pass</option>
                  <option value="guest">VIP Corporate Guest / Auditor Pass</option>
                </select>
              </div>
            </div>

            {/* ─── SECTION 5: Supervisor Administrative Actions ─── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.4) 0%, rgba(253, 230, 138, 0.15) 100%)',
              border: '1.5px dashed #D4AF37',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400E' }}>
                  {t('Supervisor Administrative Seat Overrides:', 'প্রশাসনিক সিট বিকল্প:', lang)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                  {t('Release seat to standby queue for shift colleagues or reset completely.', 'সিটটি খালি করে ফিফো লাইনে উন্মুক্ত করুন অথবা বরাদ্দ সম্পূর্ণ বাতিল করুন।', lang)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {currentSelectedSeat?.status === 'occupied' && (
                  <button
                    type="button"
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #D4AF37',
                      color: '#B45309',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    onClick={() => {
                      onVacateSeat(selectedSeatNum, vacateReasonText);
                      onClose();
                    }}
                  >
                    <UserMinus size={13} />
                    <span>{t('Vacate to Standby FIFO', 'ফিফোর জন্য উন্মুক্ত করুন', lang)}</span>
                  </button>
                )}

                <button
                  type="button"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #EF4444',
                    color: '#DC2626',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  onClick={() => {
                    onClearSeat(selectedSeatNum);
                    onClose();
                  }}
                >
                  <X size={13} />
                  <span>{t('Clear Seat (Make Empty)', 'সম্পূর্ণ ফাঁকা করুন', lang)}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            background: 'var(--brand-slate-50, #F8FAFC)',
            borderTop: '1px solid var(--brand-border, #E2E8F0)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 600, borderRadius: '8px' }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              className="btn-gold"
              style={{
                padding: '8px 20px',
                fontSize: '12.5px',
                fontWeight: 800,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(212, 175, 55, 0.35)'
              }}
            >
              <CheckCircle size={16} />
              <span>{t(`Reserve / Assign Seat #${selectedSeatNum}`, `সিট #${selectedSeatNum} নিশ্চিত বরাদ্দ করুন`, lang)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
