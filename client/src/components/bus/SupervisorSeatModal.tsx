import React, { useEffect, useState } from 'react';
import { Seat, RouteInfo } from './busTypes';
import { t } from '../../types';
import { useEmployeeStore } from '../../store/employeeStore';
import { UserCheck } from 'lucide-react';

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

function columnFor(num: number): Seat['col'] {
  const colMod = num % 4;
  if (colMod === 1) return 'left_win';
  if (colMod === 2) return 'left_aisle';
  if (colMod === 3) return 'right_aisle';
  return 'right_win';
}

function columnLabel(num: number, lang: 'en' | 'bn'): string {
  const col = columnFor(num);
  if (col === 'left_win') return t('Left window', 'বাঁ জানালা', lang);
  if (col === 'left_aisle') return t('Left aisle', 'বাঁ আইল', lang);
  if (col === 'right_aisle') return t('Right aisle', 'ডান আইল', lang);
  return t('Right window', 'ডান জানালা', lang);
}

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
  const { activeEmployees } = useEmployeeStore();
  const [selectedSeatNum, setSelectedSeatNum] = useState(seat?.num || 1);
  const [staffName, setStaffName] = useState(seat?.assignedTo || '');
  const [staffId, setStaffId] = useState(seat?.staffId || '');
  const [dept, setDept] = useState(seat?.dept || '');
  const [phone, setPhone] = useState(seat?.phone || '');
  const [pickupPoint, setPickupPoint] = useState(seat?.pickupPoint || activeRoute.inboundStops[0]?.name || '');
  const [pickupTime, setPickupTime] = useState(seat?.pickupTime || activeRoute.inboundStops[0]?.scheduledTime || '');
  const [category, setCategory] = useState<NonNullable<Seat['category']>>(seat?.category || 'regular');
  const [bookingType, setBookingType] = useState<NonNullable<Seat['bookingType']>>(seat?.bookingType || 'permanent');
  const [bloodGroup, setBloodGroup] = useState(seat?.bloodGroup || '');
  const [vacateReasonText, setVacateReasonText] = useState('');

  const seatNum = seat?.num;

  useEffect(() => {
    if (!seat || seat.num !== seatNum) return;
    setSelectedSeatNum(seat.num);
    setStaffName(seat.assignedTo || '');
    setStaffId(seat.staffId || '');
    setDept(seat.dept || '');
    setPhone(seat.phone || '');
    setPickupPoint(seat.pickupPoint || activeRoute.inboundStops[0]?.name || '');
    setPickupTime(seat.pickupTime || activeRoute.inboundStops[0]?.scheduledTime || '');
    setCategory(seat.category || 'regular');
    setBookingType(seat.bookingType || 'permanent');
    setBloodGroup(seat.bloodGroup || '');
    // Reset only when the opened seat number changes. A later render must not wipe a picked employee.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatNum]);

  const fillFromSeat = (target: Seat) => {
    setSelectedSeatNum(target.num);
    setStaffName(target.assignedTo || '');
    setStaffId(target.staffId || '');
    setDept(target.dept || '');
    setPhone(target.phone || '');
    setPickupPoint(target.pickupPoint || activeRoute.inboundStops[0]?.name || '');
    setPickupTime(target.pickupTime || activeRoute.inboundStops[0]?.scheduledTime || '');
    setCategory(target.category || 'regular');
    setBookingType(target.bookingType || 'permanent');
    setBloodGroup(target.bloodGroup || '');
  };

  if (!isOpen) return null;

  const currentSelectedSeat = allSeats.find((item) => item.num === selectedSeatNum) || seat;
  const rowNumber = Math.ceil(selectedSeatNum / 4);

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;
    const updated: Seat = {
      num: selectedSeatNum,
      row: Math.ceil(selectedSeatNum / 4),
      col: columnFor(selectedSeatNum),
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

  const statusLine = currentSelectedSeat?.status === 'occupied'
    ? t(`Occupied by ${currentSelectedSeat.assignedTo}`, `দখলে আছেন ${currentSelectedSeat.assignedTo}`, lang)
    : currentSelectedSeat?.status === 'vacated'
      ? t('Free for the standby queue', 'স্ট্যান্ডবাই সারির জন্য খালি', lang)
      : t('Empty', 'খালি', lang);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal shuttle-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <h3>
              <UserCheck size={18} />
              {t('Assign a seat', 'একটি আসন বরাদ্দ করুন', lang)}
            </h3>
            <p className="shuttle-sub">
              {t('The person you pick is written onto this seat.', 'আপনি যাঁকে বাছবেন তাঁর নাম এই আসনে লেখা হবে।', lang)}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন', lang)}>×</button>
        </div>

        <form id="shuttle-assign-seat" className="modal-body" onSubmit={handleAssignSubmit}>
          <div className="shuttle-stack">
            <div className="shuttle-grid">
              <p className="shuttle-note" style={{ margin: 0 }}>
                <strong>{t('Seat', 'আসন', lang)} {selectedSeatNum}</strong>
                {' · '}
                {t('Row', 'সারি', lang)} {rowNumber}
                {' · '}
                {columnLabel(selectedSeatNum, lang)}
                <br />
                {statusLine}
              </p>
              <div>
                <label>{t('Switch seat', 'আসন বদলান', lang)}</label>
                <select
                  className="form-input"
                  value={selectedSeatNum}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    const target = allSeats.find((item) => item.num === num);
                    if (target) fillFromSeat(target);
                    else setSelectedSeatNum(num);
                  }}
                >
                  {allSeats.map((item) => (
                    <option key={item.num} value={item.num}>
                      {t('Seat', 'আসন', lang)} {item.num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label>{t('Pick an employee', 'একজন কর্মী বাছুন', lang)}</label>
              <div className="shuttle-chips">
                {activeEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    className="shuttle-chip"
                    aria-pressed={staffId === employee.id}
                    onClick={() => {
                      setStaffName(employee.name);
                      setStaffId(employee.id);
                      setDept(employee.dept);
                      setPhone(employee.phone);
                      setBloodGroup(employee.bloodGroup || '');
                    }}
                  >
                    {employee.name} · {employee.dept}
                  </button>
                ))}
              </div>
            </div>

            <p className="shuttle-sub" style={{ margin: 0 }}>
              {t(
                `The fields below are who you will put in seat ${selectedSeatNum}.`,
                `নিচের ঘরগুলোতে যাঁকে বসাবেন, তিনি আসন ${selectedSeatNum}-এ যাবেন।`,
                lang,
              )}
            </p>

            <div className="shuttle-grid">
              <div>
                <label>{t('Name', 'নাম', lang)}</label>
                <input className="form-input" value={staffName} onChange={(e) => setStaffName(e.target.value)} required autoComplete="off" />
              </div>
              <div>
                <label>{t('Staff ID', 'কর্মী আইডি', lang)}</label>
                <input className="form-input" value={staffId} onChange={(e) => setStaffId(e.target.value)} required autoComplete="off" />
              </div>
              <div>
                <label>{t('Department', 'বিভাগ', lang)}</label>
                <input className="form-input" value={dept} onChange={(e) => setDept(e.target.value)} autoComplete="off" />
              </div>
              <div>
                <label>{t('Mobile', 'মোবাইল', lang)}</label>
                <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" />
              </div>
              <div>
                <label>{t('Boarding stop', 'উঠবেন যে স্টপে', lang)}</label>
                <select
                  className="form-input"
                  value={pickupPoint}
                  onChange={(e) => {
                    setPickupPoint(e.target.value);
                    const matched = activeRoute.inboundStops.find((stop) => stop.name === e.target.value);
                    if (matched) setPickupTime(matched.scheduledTime);
                  }}
                >
                  {activeRoute.inboundStops.map((stop) => (
                    <option key={stop.id} value={stop.name}>{stop.name} ({stop.scheduledTime})</option>
                  ))}
                </select>
              </div>
              <div>
                <label>{t('Boarding time', 'ওঠার সময়', lang)}</label>
                <input className="form-input" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
              </div>
              <div>
                <label>{t('Seat type', 'আসনের ধরন', lang)}</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value as NonNullable<Seat['category']>)}>
                  <option value="regular">{t('Regular', 'সাধারণ', lang)}</option>
                  <option value="executive">{t('Executive', 'এক্সিকিউটিভ', lang)}</option>
                  <option value="lady_priority">{t('Lady priority', 'নারী অগ্রাধিকার', lang)}</option>
                  <option value="senior_staff">{t('Senior staff', 'সিনিয়র স্টাফ', lang)}</option>
                </select>
              </div>
              <div>
                <label>{t('Pass', 'পাস', lang)}</label>
                <select className="form-input" value={bookingType} onChange={(e) => setBookingType(e.target.value as NonNullable<Seat['bookingType']>)}>
                  <option value="permanent">{t('Every day', 'প্রতিদিন', lang)}</option>
                  <option value="shift_pass">{t('Shift pass', 'শিফট পাস', lang)}</option>
                  <option value="guest">{t('Guest', 'অতিথি', lang)}</option>
                </select>
              </div>
            </div>

            {currentSelectedSeat?.status === 'occupied' && (
              <div>
                <label>{t('Why this seat is free', 'আসন খালি হওয়ার কারণ', lang)}</label>
                <input className="form-input" value={vacateReasonText} onChange={(e) => setVacateReasonText(e.target.value)} autoComplete="off" />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {currentSelectedSeat?.status === 'occupied' && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    onVacateSeat(selectedSeatNum, vacateReasonText.trim() || t('Released by transport', 'পরিবহন খালি করেছে', lang));
                    onClose();
                  }}
                >
                  {t('Free this seat', 'এই আসন খালি করুন', lang)}
                </button>
              )}
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  onClearSeat(selectedSeatNum);
                  onClose();
                }}
              >
                {t('Clear this seat', 'এই আসন মুছে দিন', lang)}
              </button>
            </div>
          </div>
        </form>

        <div className="modal-ft">
          <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
          <button type="submit" form="shuttle-assign-seat" className="btn-primary">
            {t(`Assign seat ${selectedSeatNum}`, `আসন ${selectedSeatNum} বরাদ্দ করুন`, lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
