import React, { useState, useEffect } from 'react';
import { Seat, RouteInfo } from './busTypes';
import { t } from '../../types';
import { Shield, X, CheckCircle, UserMinus, UserCheck, AlertTriangle, UserPlus, Phone, Building } from 'lucide-react';

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
  const [vacateReasonText, setVacateReasonText] = useState('Official Headquarter Tour / Leave');

  // When seat changes from outside
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

  // When seat number dropdown is changed
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

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    const row = Math.ceil(selectedSeatNum / 4);
    const colMod = selectedSeatNum % 4;
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
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd" style={{ background: '#0F172A', color: '#FFFFFF' }}>
          <div className="modal-hd-left">
            <div className="modal-hd-icon" style={{ background: 'rgba(212, 175, 55, 0.25)', color: '#FCD34D' }}>
              <Shield size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ color: '#FFFFFF' }}>
                {t('Supervisor Seat Allocation & Staff Reservation Console', 'সুপারভাইজার সিট বরাদ্দ ও কর্মী সংরক্ষণ কনসোল', lang)}
              </h3>
              <div className="modal-subtitle" style={{ color: '#94A3B8' }}>
                {activeRoute.name} ({activeRoute.coachNo})
              </div>
            </div>
          </div>
          <button className="modal-close" style={{ color: '#FFFFFF' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAssignSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            {/* Target Seat Status Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--brand-slate-50, #F8FAFC)',
              border: '1px solid var(--brand-border)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: '#0F172A',
                  color: '#FCD34D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '16px'
                }}>
                  #{selectedSeatNum}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>
                    {t('Target Commuter Seat', 'নির্বাচিত আসন', lang)}: #{selectedSeatNum}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                    {t('Current Status', 'বর্তমান অবস্থা', lang)}:{' '}
                    <span className={`badge ${currentSelectedSeat?.status === 'occupied' ? 'success' : currentSelectedSeat?.status === 'vacated' ? 'gold' : 'info'}`}>
                      {currentSelectedSeat?.status === 'occupied'
                        ? `Occupied by ${currentSelectedSeat.assignedTo}`
                        : currentSelectedSeat?.status === 'vacated'
                        ? 'Vacated (Available for FIFO)'
                        : 'Unassigned / Empty'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seat Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--brand-slate-600)' }}>{t('Switch Seat:', 'আসন পরিবর্তন:', lang)}</span>
                <select
                  className="form-input"
                  style={{ width: '90px', padding: '6px' }}
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

            {/* Quick Pick Employee Preset Strip */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-slate-600)', marginBottom: '6px' }}>
                ⚡ {t('Quick-Fill Registered Staff Member:', 'কর্মচারী তালিকা থেকে সরাসরি নির্বাচন:', lang)}
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
                {EMPLOYEE_PRESETS.slice(0, 5).map(p => (
                  <button
                    key={p.staffId}
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '10.5px', padding: '4px 8px', whiteSpace: 'nowrap' }}
                    onClick={() => handlePickPreset(p)}
                  >
                    {p.name.split(' ')[0]} ({p.staffId})
                  </button>
                ))}
              </div>
            </div>

            {/* Employee Details Inputs */}
            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t('Employee / Passenger Name', 'কর্মচারীর নাম', lang)} *
                </label>
                <input
                  className="form-input"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {t('Staff ID / SAP PERNR', 'কর্মচারী আইডি', lang)} *
                </label>
                <input
                  className="form-input"
                  value={staffId}
                  onChange={e => setStaffId(e.target.value)}
                  placeholder="EMP-1042"
                  required
                />
              </div>
            </div>

            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="form-label">{t('Department / Plant Unit', 'বিভাগ / প্ল্যান্ট শাখা', lang)}</label>
                <input
                  className="form-input"
                  value={dept}
                  onChange={e => setDept(e.target.value)}
                  placeholder="Sales & Distribution"
                />
              </div>

              <div>
                <label className="form-label">{t('Mobile Contact Number', 'মোবাইল নম্বর', lang)}</label>
                <input
                  className="form-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+880 1720-334455"
                />
              </div>
            </div>

            {/* Stoppage Point & Timings */}
            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="form-label">{t('Designated Pickup Stoppage', 'বোর্ডিং স্টপেজ পয়েন্ট', lang)}</label>
                <select
                  className="form-input"
                  value={pickupPoint}
                  onChange={e => {
                    setPickupPoint(e.target.value);
                    const matched = activeRoute.inboundStops.find(s => s.name === e.target.value);
                    if (matched) setPickupTime(matched.scheduledTime);
                  }}
                >
                  {activeRoute.inboundStops.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.scheduledTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">{t('Morning Pickup Time', 'পিকআপ সময়', lang)}</label>
                <input
                  className="form-input"
                  value={pickupTime}
                  onChange={e => setPickupTime(e.target.value)}
                  placeholder="07:18 AM"
                />
              </div>
            </div>

            {/* Category and Booking Type */}
            <div className="responsive-col-2-eq" style={{ gap: '14px', marginBottom: '16px' }}>
              <div>
                <label className="form-label">{t('Seat Allocation Priority Category', 'আসন অগ্রাধিকার শ্রেণী', lang)}</label>
                <select className="form-input" value={category} onChange={e => setCategory(e.target.value as any)}>
                  <option value="regular">Regular Staff Commuter</option>
                  <option value="executive">Executive / Lead Plant Engineer</option>
                  <option value="lady_priority">Lady Priority Dedicated Seat</option>
                  <option value="senior_staff">Senior Management / Specialist</option>
                </select>
              </div>

              <div>
                <label className="form-label">{t('Reservation Entitlement Mode', 'বরাদ্দের ধরন', lang)}</label>
                <select className="form-input" value={bookingType} onChange={e => setBookingType(e.target.value as any)}>
                  <option value="permanent">Permanent Designated Pass (Everyday)</option>
                  <option value="shift_pass">Monthly Shift Duty Pass</option>
                  <option value="guest">VIP Corporate Guest / Auditor Seat</option>
                </select>
              </div>
            </div>

            {/* Action Buttons for Supervisor */}
            <div style={{
              background: 'var(--brand-slate-50, #F8FAFC)',
              border: '1px solid var(--brand-border)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>
                  {t('Supervisor Administrative Overrides:', 'প্রশাসনিক বিকল্প:', lang)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                  {t('Release seat to standby queue or remove any booking completely.', 'সিটটি খালি করে ফিফো লাইনে উন্মুক্ত করুন অথবা বরাদ্দ বাতিল করুন।', lang)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {currentSelectedSeat?.status === 'occupied' && (
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ borderColor: '#D4AF37', color: '#B45309', fontSize: '11px' }}
                    onClick={() => {
                      onVacateSeat(selectedSeatNum, vacateReasonText);
                      onClose();
                    }}
                  >
                    <UserMinus size={13} /> {t('Vacate to Standby FIFO', 'ফিফোর জন্য উন্মুক্ত করুন', lang)}
                  </button>
                )}

                <button
                  type="button"
                  className="btn-outline-danger"
                  style={{ fontSize: '11px' }}
                  onClick={() => {
                    onClearSeat(selectedSeatNum);
                    onClose();
                  }}
                >
                  <X size={13} /> {t('Clear Seat (Make Empty)', 'সম্পূর্ণ ফাঁকা করুন', lang)}
                </button>
              </div>
            </div>
          </div>

          <div className="modal-ft">
            <button type="button" className="btn-sm-ghost" onClick={onClose}>
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button type="submit" className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} />
              {t(`Reserve / Assign Seat #${selectedSeatNum}`, `সিট #${selectedSeatNum} নিশ্চিত বরাদ্দ করুন`, lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
