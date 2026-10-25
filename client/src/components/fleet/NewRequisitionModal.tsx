import React, { useState } from 'react';
import { VehicleRequisition } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  FileText,
  X,
  Check,
  Plus,
  AlertCircle,
  Sparkles,
  Building2,
  ChevronDown,
  Search,
  ArrowRight,
  CornerDownRight,
  ShieldCheck,
} from 'lucide-react';

interface NewRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requisitionData: Omit<VehicleRequisition, 'id' | 'status' | 'createdAt'>) => void;
  lang: 'en' | 'bn';
  currentUserName?: string;
  currentUserDept?: string;
}

// Company Employee Directory for Passenger Selection Dropdown
export interface CompanyColleague {
  id: string;
  name: string;
  designation: string;
  dept: string;
  phone: string;
  email: string;
  avatarColor: string;
}

export const COMPANY_COLLEAGUES: CompanyColleague[] = [
  { id: 'EMP-1042', name: 'Tanvir Ahmed', designation: 'Sr. Sales & Distribution Specialist', dept: 'Sales & Distribution', phone: '+880 1712-334455', email: 'tanvir.ahmed@bashundhara.com', avatarColor: '#D97706' },
  { id: 'EMP-2019', name: 'Engr. Tariq Ahmed', designation: 'Refinery Process Lead Engineer', dept: 'Keraniganj Refinery', phone: '+880 1819-445566', email: 'tariq.ahmed@bashundhara.com', avatarColor: '#0284C7' },
  { id: 'EMP-3104', name: 'Kabir Hossain', designation: 'QA/QC Inspection Engineer', dept: 'Quality Assurance', phone: '+880 1715-998811', email: 'kabir.hossain@bashundhara.com', avatarColor: '#059669' },
  { id: 'EMP-1182', name: 'Farhana Yeasmin', designation: 'Commercial Contract Analyst', dept: 'Commercial & Sales', phone: '+880 1912-778899', email: 'farhana.yeasmin@bashundhara.com', avatarColor: '#7C3AED' },
  { id: 'EMP-4008', name: 'Syed Golam Faruq', designation: 'Procurement & Logistics Manager', dept: 'Supply Chain', phone: '+880 1719-887722', email: 'golam.faruq@bashundhara.com', avatarColor: '#DC2626' },
  { id: 'EMP-2201', name: 'Engr. Mizanur Rahman', designation: 'Plant Reliability Lead', dept: 'Plant Maintenance', phone: '+880 1815-443322', email: 'mizanur.rahman@bashundhara.com', avatarColor: '#2563EB' },
  { id: 'EMP-5011', name: 'Dr. Nasreen Akter', designation: 'Occupational Health & HSE Officer', dept: 'Health & Safety', phone: '+880 1711-889900', email: 'nasreen.akter@bashundhara.com', avatarColor: '#0D9488' },
  { id: 'EMP-3309', name: 'Rashedul Islam', designation: 'Internal Audit & Accounts Lead', dept: 'Finance & Accounts', phone: '+880 1714-332211', email: 'rashedul.islam@bashundhara.com', avatarColor: '#B45309' },
];

export default function NewRequisitionModal({
  isOpen,
  onClose,
  onSubmit,
  lang,
  currentUserName = 'Tanvir Ahmed',
  currentUserDept = 'Sales & Distribution',
}: NewRequisitionModalProps) {
  // Form State
  const [tripType, setTripType] = useState<'round_trip' | 'one_way'>('round_trip');
  const [fromLoc, setFromLoc] = useState('Bashundhara Corporate HQ, Baridhara');
  const [toLoc, setToLoc] = useState('Keraniganj Bitumen Refinery Complex');
  const [departureTime, setDepartureTime] = useState('Today, 02:30 PM');
  const [returnTime, setReturnTime] = useState('Today, 06:30 PM');
  const [purpose, setPurpose] = useState('Official refinery site inspection and delivery of asphalt laboratory batch dossiers');
  const [costCenter, setCostCenter] = useState('CC-SALES-DHAKA-102');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Intermediate Stops State
  const [intermediateStops, setIntermediateStops] = useState<string[]>([]);
  const [stopInput, setStopInput] = useState('');

  // Accompanying Passengers Dropdown State
  const [selectedPassengers, setSelectedPassengers] = useState<CompanyColleague[]>([
    COMPANY_COLLEAGUES[0], // Tanvir Ahmed
    COMPANY_COLLEAGUES[1], // Engr. Tariq Ahmed
  ]);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [passengerSearchQuery, setPassengerSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleAddStop = () => {
    if (stopInput.trim()) {
      setIntermediateStops([...intermediateStops, stopInput.trim()]);
      setStopInput('');
    }
  };

  const handleRemoveStop = (idx: number) => {
    setIntermediateStops(intermediateStops.filter((_, i) => i !== idx));
  };

  const togglePassenger = (colleague: CompanyColleague) => {
    if (selectedPassengers.some((p) => p.id === colleague.id)) {
      if (selectedPassengers.length === 1) {
        showToast(t('At least 1 passenger required', 'কমপক্ষে একজন যাত্রী আবশ্যক', lang), 'info');
        return;
      }
      setSelectedPassengers(selectedPassengers.filter((p) => p.id !== colleague.id));
    } else {
      setSelectedPassengers([...selectedPassengers, colleague]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      showToast(t('Please state the official purpose of travel', 'দয়া করে যাতায়াতের উদ্দেশ্য লিখুন', lang), 'warn');
      return;
    }

    const passengerNamesString = selectedPassengers.map((p) => p.name).join(', ');

    onSubmit({
      requesterName: currentUserName,
      dept: currentUserDept,
      tripType,
      from: fromLoc,
      to: toLoc,
      departureTime,
      returnTime: tripType === 'round_trip' ? returnTime : undefined,
      passengersCount: selectedPassengers.length,
      passengerNames: passengerNamesString,
      purpose,
      costCenter,
      intermediateStops: intermediateStops.map((stop, idx) => ({
        id: `STP-${Date.now()}-${idx + 1}`,
        location: stop,
        waitDurationMins: 15,
      })),
      estimatedCost: 1400 + intermediateStops.length * 350,
    });

    onClose();
  };

  const filteredColleagues = COMPANY_COLLEAGUES.filter(
    (c) =>
      c.name.toLowerCase().includes(passengerSearchQuery.toLowerCase()) ||
      c.dept.toLowerCase().includes(passengerSearchQuery.toLowerCase()) ||
      c.designation.toLowerCase().includes(passengerSearchQuery.toLowerCase())
  );

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
          maxWidth: '800px',
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
        {/* ─── 1. MODAL HEADER ─── */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
                flexShrink: 0,
              }}
            >
              <Car size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {t('Official Duty Travel Requisition Form', 'দাপ্তরিক যাতায়াত যানবাহন রিকুইজিশন ফর্ম', lang)}
                </h3>
                <span
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Transport Directorate
                </span>
              </div>
              <p
                style={{
                  margin: '3px 0 0 0',
                  fontSize: '12px',
                  color: '#CBD5E1',
                  lineHeight: 1.4,
                }}
              >
                {t(
                  'Vehicle & Driver will be allocated by the Central Transport Supervisor',
                  'যানবাহন ও চালক কেন্দ্রীয় পরিবহন সুপারভাইজার কর্তৃক বরাদ্দ হবে • ডিজিটাল চালান তৈরি হবে',
                  lang
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#CBD5E1';
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── 2. SCROLLABLE FORM BODY ─── */}
        <form
          id="new-requisition-form"
          onSubmit={handleSubmit}
          className="fleet-modal-body"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            padding: '28px 32px',
            backgroundColor: '#FFFFFF',
            boxSizing: 'border-box',
          }}
        >
          {/* Transit Mode Selection */}
          <div className="notice-field-group" style={{ marginBottom: '22px' }}>
            <div className="notice-field-label">
              <span>{t('Transit Mode Selection', 'যাতায়াতের ধরন নির্বাচন', lang)}</span>
              <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'none', fontWeight: 500 }}>
                Select mission operational format
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                boxSizing: 'border-box',
              }}
            >
              <button
                type="button"
                onClick={() => setTripType('round_trip')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: tripType === 'round_trip' ? '2px solid #2563EB' : '1.5px solid #CBD5E1',
                  backgroundColor: tripType === 'round_trip' ? '#EFF6FF' : '#F8FAFC',
                  boxShadow: tripType === 'round_trip' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: tripType === 'round_trip' ? '#1E40AF' : '#0F172A',
                    }}
                  >
                    🔄 {t('Round Trip (Return Transit)', 'রাউন্ড ট্রিপ (প্রত্যাবর্তন সহ)', lang)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px', lineHeight: 1.4 }}>
                    {t('Driver stays on site & returns officials to origin office', 'চালক কাজ শেষে যাত্রীদের মূল অফিসে ফেরত আনবেন', lang)}
                  </div>
                </div>
                {tripType === 'round_trip' && <Check size={18} color="#2563EB" style={{ flexShrink: 0 }} />}
              </button>

              <button
                type="button"
                onClick={() => setTripType('one_way')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: tripType === 'one_way' ? '2px solid #2563EB' : '1.5px solid #CBD5E1',
                  backgroundColor: tripType === 'one_way' ? '#EFF6FF' : '#F8FAFC',
                  boxShadow: tripType === 'one_way' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: tripType === 'one_way' ? '#1E40AF' : '#0F172A',
                    }}
                  >
                    ➡️ {t('One-Way Transit Only', 'একমুখী যাত্রা (ড্রপ-অফ)', lang)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px', lineHeight: 1.4 }}>
                    {t('Drop-off at destination, vehicle returns to central yard', 'শুধুমাত্র গন্তব্যে নামিয়ে দেওয়া হবে, গাড়ি ইয়ার্ডে ফিরবে', lang)}
                  </div>
                </div>
                {tripType === 'one_way' && <Check size={18} color="#2563EB" style={{ flexShrink: 0 }} />}
              </button>
            </div>
          </div>

          {/* Origin & Destination Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '18px',
              marginBottom: '20px',
              boxSizing: 'border-box',
            }}
          >
            <div>
              <div className="notice-field-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} color="#2563EB" />
                  {t('Departure Hub / Origin Office', 'যাত্রা শুরুর অফিস / স্থান', lang)}
                </span>
              </div>
              <select
                value={fromLoc}
                onChange={(e) => setFromLoc(e.target.value)}
                className="notice-select"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                <option value="Bashundhara Industrial Complex, South Keraniganj">Bashundhara Industrial Complex, South Keraniganj</option>
                <option value="Meghna Ghat Asphalt Depot & Terminal">Meghna Ghat Asphalt Depot & Terminal</option>
                <option value="Chittagong Port Petroleum Blending Terminal">Chittagong Port Petroleum Blending Terminal</option>
                <option value="Hazrat Shahjalal International Airport (VIP Canopy)">Hazrat Shahjalal International Airport (VIP Canopy)</option>
              </select>
            </div>

            <div>
              <div className="notice-field-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} color="#E11D48" />
                  {t('Destination / Inspection Venue', 'গন্তব্য অফিস / পরিদর্শন এলাকা', lang)}{' '}
                  <span style={{ color: '#E11D48' }}>*</span>
                </span>
              </div>
              <input
                type="text"
                required
                value={toLoc}
                onChange={(e) => setToLoc(e.target.value)}
                placeholder="e.g. Keraniganj Bitumen Refinery Complex"
                className="notice-input"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Via Intermediate Stops (Waypoints) */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              marginBottom: '20px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CornerDownRight size={14} color="#2563EB" />
                <span>{t('Via Stops / Intermediate Waypoints (Optional)', 'যাত্রাপথের বিরতি বা স্টপ (ঐচ্ছিক)', lang)}</span>
              </label>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                {intermediateStops.length} {t('stops added', 'টি বিরতি যুক্ত', lang)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={stopInput}
                onChange={(e) => setStopInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStop();
                  }
                }}
                placeholder="e.g. Sonali Bank Motijheel Head Office / Ministry Secretariat"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleAddStop}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#E2E8F0',
                  color: '#0F172A',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#CBD5E1')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E2E8F0')}
              >
                <Plus size={14} />
                <span>{t('Add Stop', 'যুক্ত করুন', lang)}</span>
              </button>
            </div>

            {intermediateStops.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {intermediateStops.map((stop, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        color: '#1E40AF',
                        fontWeight: 800,
                        fontSize: '10.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{stop}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Departure Date/Time and Return Time Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '18px',
              marginBottom: '20px',
              boxSizing: 'border-box',
            }}
          >
            <div>
              <div className="notice-field-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} color="#2563EB" />
                  {t('Departure Date & Time', 'যাত্রার সময় ও তারিখ', lang)}
                </span>
              </div>
              <input
                type="text"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="e.g. Today, 02:30 PM"
                className="notice-input"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {tripType === 'round_trip' && (
              <div>
                <div className="notice-field-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} color="#2563EB" />
                    {t('Expected Return Time', 'প্রত্যাবর্তনের সম্ভাব্য সময়', lang)}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  placeholder="e.g. Today, 06:30 PM"
                  className="notice-input"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
          </div>

          {/* Accompanying Passengers Multi-Select */}
          <div className="notice-field-group" style={{ marginBottom: '22px' }}>
            <div className="notice-field-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={14} color="#059669" />
                {t('Passenger Names & Official Designations', 'যাত্রীদের তালিকা ও পদবী', lang)}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#1E40AF',
                  backgroundColor: '#EFF6FF',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  border: '1px solid #BFDBFE',
                }}
              >
                {selectedPassengers.length} {t('Official Passengers', 'জন কর্মকর্তা', lang)}
              </span>
            </div>

            {/* Selected Passenger Tags */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1.5px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                minHeight: '48px',
                boxSizing: 'border-box',
              }}
            >
              {selectedPassengers.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    fontSize: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: p.avatarColor,
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '11.5px' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>{p.dept}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePassenger(p)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                    }}
                    title="Remove Passenger"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Add Colleague Button */}
              <button
                type="button"
                onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1.5px dashed #3B82F6',
                  color: '#2563EB',
                  backgroundColor: '#EFF6FF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={13} />
                <span>{t('Select Colleagues', 'সহকর্মী যোগ করুন', lang)}</span>
                <ChevronDown size={12} />
              </button>
            </div>

            {/* Dropdown Directory List */}
            {showPassengerDropdown && (
              <div
                style={{
                  marginTop: '6px',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    value={passengerSearchQuery}
                    onChange={(e) => setPassengerSearchQuery(e.target.value)}
                    placeholder={t('Search employee directory by name or department...', 'সহকর্মী খুঁজুন...', lang)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      backgroundColor: '#F8FAFC',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {filteredColleagues.map((c) => {
                    const isSelected = selectedPassengers.some((p) => p.id === c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => togglePassenger(c)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                          color: isSelected ? '#1E40AF' : '#334155',
                          fontWeight: isSelected ? 700 : 500,
                          transition: 'background-color 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              backgroundColor: c.avatarColor,
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{c.name}</div>
                            <div style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 400 }}>
                              {c.designation} • {c.dept}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={14} color="#2563EB" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Official Purpose */}
          <div className="notice-field-group" style={{ marginBottom: '22px' }}>
            <div className="notice-field-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={14} color="#64748B" />
                {t('Official Purpose / Transit Justification', 'দাপ্তরিক কাজের উদ্দেশ্য ও যৌক্তিকতা', lang)}{' '}
                <span style={{ color: '#E11D48' }}>*</span>
              </span>
              <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'none', fontWeight: 500 }}>
                {purpose.length} characters
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Official refinery site inspection, delivery of asphalt laboratory batch dossiers, and meeting Plant GM"
              className="notice-textarea"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '80px',
              }}
            />
          </div>

          {/* Cost Center & Special Luggage Notes */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '18px',
              boxSizing: 'border-box',
            }}
          >
            <div>
              <div className="notice-field-label">
                <span>{t('Cost Center / Department Code', 'বিভাগীয় কস্ট সেন্টার কোড', lang)}</span>
              </div>
              <input
                type="text"
                required
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                className="notice-input"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#0F172A',
                  backgroundColor: '#F8FAFC',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <div className="notice-field-label">
                <span>{t('Special Luggage / Cargo Notes (Optional)', 'বিশেষ লাগেজ / মালামাল বিবরণ (ঐচ্ছিক)', lang)}</span>
              </div>
              <input
                type="text"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="e.g. 2 asphalt batch test cylinders in trunk"
                className="notice-input"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13px',
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </form>

        {/* ─── 3. MODAL FOOTER ─── */}
        <div
          className="fleet-modal-ft"
          style={{
            padding: '16px 28px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B' }}>
            <ShieldCheck size={16} color="#059669" />
            <span>Digital Trip Pass generated upon Transport Admin approval</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F1F5F9';
                e.currentTarget.style.borderColor = '#94A3B8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              form="new-requisition-form"
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
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(165, 28, 48, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(165, 28, 48, 0.35)';
              }}
            >
              <Car size={15} />
              <span>{t('Submit Requisition to Transport Admin', 'পরিবহন প্রশাসনে আবেদন দাখিল করুন', lang)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
