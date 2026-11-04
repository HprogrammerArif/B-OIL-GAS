import React, { useState, useMemo } from 'react';
import { VehicleRequisition } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../ToastManager';
import {
  Car,
  MapPin,
  Clock,
  Users,
  FileText,
  X,
  Check,
  Plus,
  Sparkles,
  ChevronDown,
  Search,
  ArrowRight,
  CornerDownRight,
  ShieldCheck,
  Fuel,
  Navigation,
  Gauge,
  Factory,
  Anchor,
  Ship,
  Plane,
  Landmark,
  RotateCcw,
} from 'lucide-react';

interface NewRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requisitionData: Omit<VehicleRequisition, 'id' | 'status' | 'createdAt'>) => void;
  lang: 'en' | 'bn';
  requester: { name: string; empId: string; label: string; dept: string; phone: string; initials: string };
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
  { id: 'EMP-1042', name: 'Tanvir Ahmed', designation: 'Sr. Sales & Distribution Specialist', dept: 'Sales & Distribution', phone: '+880 1712-334455', email: 'tanvir.ahmed@bashundhara.com', avatarColor: 'var(--status-warning-solid)' },
  { id: 'EMP-2019', name: 'Engr. Tariq Ahmed', designation: 'Refinery Process Lead Engineer', dept: 'Keraniganj Refinery', phone: '+880 1819-445566', email: 'tariq.ahmed@bashundhara.com', avatarColor: 'var(--status-info-solid)' },
  { id: 'EMP-3104', name: 'Kabir Hossain', designation: 'QA/QC Inspection Engineer', dept: 'Quality Assurance', phone: '+880 1715-998811', email: 'kabir.hossain@bashundhara.com', avatarColor: 'var(--status-success-solid)' },
  { id: 'EMP-1182', name: 'Farhana Yeasmin', designation: 'Commercial Contract Analyst', dept: 'Commercial & Sales', phone: '+880 1912-778899', email: 'farhana.yeasmin@bashundhara.com', avatarColor: 'var(--status-purple-solid)' },
  { id: 'EMP-4008', name: 'Syed Golam Faruq', designation: 'Procurement & Logistics Manager', dept: 'Supply Chain', phone: '+880 1719-887722', email: 'golam.faruq@bashundhara.com', avatarColor: 'var(--status-danger-solid)' },
  { id: 'EMP-2201', name: 'Engr. Mizanur Rahman', designation: 'Plant Reliability Lead', dept: 'Plant Maintenance', phone: '+880 1815-443322', email: 'mizanur.rahman@bashundhara.com', avatarColor: 'var(--status-info-solid)' },
  { id: 'EMP-5011', name: 'Dr. Nasreen Akter', designation: 'Occupational Health & HSE Officer', dept: 'Health & Safety', phone: '+880 1711-889900', email: 'nasreen.akter@bashundhara.com', avatarColor: 'var(--status-teal)' },
  { id: 'EMP-3309', name: 'Rashedul Islam', designation: 'Internal Audit & Accounts Lead', dept: 'Finance & Accounts', phone: '+880 1714-332211', email: 'rashedul.islam@bashundhara.com', avatarColor: 'var(--status-warning-solid-dark)' },
];

// Operational Mission Quick Presets
export interface MissionPreset {
  id: string;
  nameEn: string;
  nameBn: string;
  destination: string;
  distanceKm: number;
  durationMins: number;
  fuelLiters: number;
  defaultPurpose: string;
  icon: string;
}

export const MISSION_PRESETS: MissionPreset[] = [
  {
    id: 'keraniganj-refinery',
    nameEn: 'Keraniganj Refinery',
    nameBn: 'কেরানীগঞ্জ রিফাইনারি',
    destination: 'Bashundhara Bitumen Refinery, South Keraniganj',
    distanceKm: 38.4,
    durationMins: 75,
    fuelLiters: 4.8,
    defaultPurpose: 'Official refinery site inspection, asphalt batch test samples verification, and GM coordination',
    icon: 'factory',
  },
  {
    id: 'meghnaghat-depot',
    nameEn: 'Meghna Ghat Depot',
    nameBn: 'মেঘনাঘাট টার্মিনাল',
    destination: 'Meghna Ghat Asphalt Depot & Marine Terminal',
    distanceKm: 44.2,
    durationMins: 85,
    fuelLiters: 5.5,
    defaultPurpose: 'Depot tank farm inventory reconciliation and marine discharge pipeline inspection',
    icon: 'anchor',
  },
  {
    id: 'chittagong-port',
    nameEn: 'Chittagong Port Terminal',
    nameBn: 'চট্টগ্রাম পোর্ট টার্মিনাল',
    destination: 'Chittagong Port Petroleum Blending Terminal',
    distanceKm: 248.0,
    durationMins: 330,
    fuelLiters: 31.0,
    defaultPurpose: 'Imported vacuum residue / bitumen consignment customs release and tank farm audit',
    icon: 'ship',
  },
  {
    id: 'hsia-airport',
    nameEn: 'Airport VIP Canopy',
    nameBn: 'শাহজালাল বিমানবন্দর ভিআইপি',
    destination: 'Hazrat Shahjalal International Airport (VIP Canopy)',
    distanceKm: 14.5,
    durationMins: 35,
    fuelLiters: 1.8,
    defaultPurpose: 'Escorting international technical JV delegation from Singapore refinery partners',
    icon: 'plane',
  },
  {
    id: 'sonali-bank',
    nameEn: 'Sonali Bank HQ (Motijheel)',
    nameBn: 'সোনালী ব্যাংক মতিঝিল',
    destination: 'Sonali Bank PLC Head Office, Motijheel Commercial Area',
    distanceKm: 16.8,
    durationMins: 45,
    fuelLiters: 2.1,
    defaultPurpose: 'Submission of bitumen import Letters of Credit (L/C) and treasury endorsement documents',
    icon: 'landmark',
  },
];

function renderPresetIcon(icon: string) {
  switch (icon) {
    case 'factory':
      return <Factory size={12} />;
    case 'anchor':
      return <Anchor size={12} />;
    case 'ship':
      return <Ship size={12} />;
    case 'plane':
      return <Plane size={12} />;
    case 'landmark':
      return <Landmark size={12} />;
    default:
      return <MapPin size={12} />;
  }
}

export default function NewRequisitionModal({
  isOpen,
  onClose,
  onSubmit,
  lang,
  requester,
}: NewRequisitionModalProps) {
  // Form State
  const [tripType, setTripType] = useState<'round_trip' | 'one_way'>('round_trip');
  const [fromLoc, setFromLoc] = useState('Bashundhara Corporate HQ, Baridhara');
  const [toLoc, setToLoc] = useState('Bashundhara Bitumen Refinery, South Keraniganj');
  const [departureTime, setDepartureTime] = useState('Today, 02:30 PM');
  const [returnTime, setReturnTime] = useState('Today, 06:30 PM');
  const [purpose, setPurpose] = useState('Official refinery site inspection and delivery of asphalt laboratory batch dossiers');
  const [costCenter, setCostCenter] = useState('CC-SALES-DHAKA-102');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('keraniganj-refinery');

  // Intermediate Stops State
  const [intermediateStops, setIntermediateStops] = useState<string[]>([]);
  const [stopInput, setStopInput] = useState('');

  // Accompanying Passengers Dropdown State
  const [selectedPassengers, setSelectedPassengers] = useState<CompanyColleague[]>(() => [
    COMPANY_COLLEAGUES.find((c) => c.id === requester.empId) ?? {
      id: requester.empId,
      name: requester.name,
      designation: requester.label,
      dept: requester.dept,
      phone: requester.phone,
      email: '',
      avatarColor: 'var(--status-info-solid)',
    },
  ]);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [passengerSearchQuery, setPassengerSearchQuery] = useState('');

  // Dynamic Route & Capacity Calculations
  const telemetry = useMemo(() => {
    const matchedPreset = MISSION_PRESETS.find((p) => p.destination === toLoc || toLoc.includes(p.nameEn));
    const baseDistance = matchedPreset ? matchedPreset.distanceKm : 32.5;
    const baseDuration = matchedPreset ? matchedPreset.durationMins : 60;
    const baseFuel = matchedPreset ? matchedPreset.fuelLiters : 4.0;

    const stopDistanceMultiplier = 1 + intermediateStops.length * 0.15;
    const stopTimeAdded = intermediateStops.length * 20;

    const distanceMultiplier = tripType === 'round_trip' ? 2 : 1;
    const totalDistance = Math.round(baseDistance * stopDistanceMultiplier * distanceMultiplier * 10) / 10;
    const totalDurationMins = Math.round(baseDuration * distanceMultiplier + stopTimeAdded);
    const totalFuel = Math.round(baseFuel * stopDistanceMultiplier * distanceMultiplier * 10) / 10;

    const paxCount = selectedPassengers.length;
    const isMicrobus = paxCount > 4;
    const recommendedTier: 'sedan_4' | 'microbus_7' = isMicrobus ? 'microbus_7' : 'sedan_4';
    const maxCapacity = isMicrobus ? 7 : 4;
    const capacityPct = Math.min(100, Math.round((paxCount / maxCapacity) * 100));

    const hours = Math.floor(totalDurationMins / 60);
    const mins = totalDurationMins % 60;
    const formattedDuration = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins} mins`;

    return {
      distanceKm: totalDistance,
      durationText: formattedDuration,
      fuelLiters: totalFuel,
      recommendedTier,
      maxCapacity,
      capacityPct,
      paxCount,
      isMicrobus,
    };
  }, [toLoc, intermediateStops, tripType, selectedPassengers]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: MissionPreset) => {
    setSelectedPresetId(preset.id);
    setToLoc(preset.destination);
    setPurpose(preset.defaultPurpose);
    showToast(
      lang === 'bn'
        ? `প্রিসেট প্রয়োগ করা হয়েছে: ${preset.nameBn}`
        : `Mission preset applied: ${preset.nameEn}`,
      'info'
    );
  };

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
      if (selectedPassengers.length >= 7) {
        showToast(
          t('Maximum microbus capacity is 7 passengers', 'মাইক্রোবাসের সর্বোচ্চ ধারণক্ষমতা ৭ জন যাত্রী', lang),
          'warn'
        );
        return;
      }
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
      requesterName: requester.name,
      requesterEmpId: requester.empId,
      requesterRole: requester.label,
      dept: requester.dept,
      phone: requester.phone,
      tripType,
      from: fromLoc,
      to: toLoc,
      departureTime,
      returnTime: tripType === 'round_trip' ? returnTime : undefined,
      requiredCapacity: telemetry.recommendedTier,
      passengersCount: selectedPassengers.length,
      passengerNames: passengerNamesString,
      purpose,
      costCenter,
      intermediateStops: intermediateStops.map((stop, idx) => ({
        id: `STP-${Date.now()}-${idx + 1}`,
        location: stop,
        waitDurationMins: 15,
      })),
      estimatedCost: 1400 + intermediateStops.length * 350 + (tripType === 'round_trip' ? 950 : 0),
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
        padding: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="fleet-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '760px',
          width: '96%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* ─── 1. MODAL HEADER ─── */}
        <div className="fleet-modal-hd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, var(--brand-crimson) 0%, var(--brand-crimson-light) 100%)',
                color: 'var(--text-on-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
                flexShrink: 0,
              }}
            >
              <Car size={18} color="var(--text-on-brand)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '14.5px',
                    fontWeight: 800,
                    color: 'var(--text-on-brand)',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {t('Official Duty Travel Requisition Form', 'দাপ্তরিক যাতায়াত যানবাহন রিকুইজিশন ফর্ম', lang)}
                </h3>
                <span
                  style={{
                    backgroundColor: 'var(--status-warning-solid)',
                    color: 'var(--text-on-brand)',
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 7px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  Grade 8 Pool Entitled
                </span>
              </div>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '11px',
                  color: 'var(--text-inverse-2)',
                  lineHeight: 1.35,
                }}
              >
                {t(
                  'Central Dispatch assigns a verified driver and vehicle and issues a digital gate pass',
                  'কেন্দ্রীয় ডিসপ্যাচ কর্তৃক যানবাহন ও চালক বরাদ্দ হবে এবং ডিজিটাল গেটপাস তৈরি হবে',
                  lang
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-inverse-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ─── 2. STAFF IDENTITY & ENTITLEMENT STRIP ─── */}
        <div className="fleet-modal-profile-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, var(--surface-inverse) 0%, var(--surface-inverse-3) 100%)',
                color: 'var(--status-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '10.5px',
                border: '1px solid var(--status-warning)',
                flexShrink: 0,
              }}
            >
              {requester.initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '11.5px', lineHeight: 1.2 }}>
                {requester.name} <span style={{ fontWeight: 500, opacity: 0.75 }}>• {requester.label}</span>
              </div>
              <div style={{ fontSize: '10.5px', opacity: 0.7 }}>
                {requester.dept} • Cost Center: <code style={{ fontWeight: 700, color: 'var(--brand-crimson)' }}>{costCenter}</code>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
              <ShieldCheck size={13} color="var(--status-success)" />
              <span>
                <strong>{t('Entitlement:', 'বরাদ্দ:', lang)}</strong> Sedan (1–4 Pax) / Microbus (5–7 Pax)
              </span>
            </div>
          </div>
        </div>

        {/* ─── 3. SCROLLABLE FORM BODY + FOOTER ─── */}
        <form
          id="new-requisition-form"
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            className="fleet-modal-body"
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              overflowY: 'auto',
              padding: '14px 20px',
              boxSizing: 'border-box',
            }}
          >
            {/* 3A. QUICK DESTINATION PRESETS */}
            <div className="fleet-preset-bar">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 800 }}>
                  <Sparkles size={12} color="var(--status-warning)" />
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {t('Quick Destination Presets', 'দ্রুত গন্তব্য প্রিসেট', lang)}
                  </span>
                </div>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>
                  {t('Auto-fills destination & purpose', 'গন্তব্য ও উদ্দেশ্য স্বয়ংক্রিয়ভাবে পূরণ হবে', lang)}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {MISSION_PRESETS.map((preset) => {
                  const isActive = selectedPresetId === preset.id && toLoc === preset.destination;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="fleet-preset-chip"
                      style={{
                        borderColor: isActive ? 'var(--brand-crimson)' : undefined,
                        backgroundColor: isActive ? 'rgba(165, 28, 48, 0.08)' : undefined,
                        color: isActive ? 'var(--brand-crimson)' : undefined,
                        fontWeight: isActive ? 700 : 600,
                      }}
                    >
                      {renderPresetIcon(preset.icon)}
                      <span>{lang === 'bn' ? preset.nameBn : preset.nameEn}</span>
                      <span style={{ opacity: 0.65, fontSize: '9.5px' }}>({preset.distanceKm} km)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3B. COMPACT ROUTE ESTIMATE & VEHICLE RECOMMENDATION */}
            <div className="fleet-telemetry-hud">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 800 }}>
                  <Gauge size={12} color="var(--status-info)" />
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {t('Route Estimate & Recommended Vehicle', 'রুট অনুমান ও প্রস্তাবিত যানবাহন', lang)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px' }}>
                  <span>
                    <strong>{telemetry.paxCount}/{telemetry.maxCapacity}</strong> {t('seats', 'সিট', lang)}
                  </span>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <strong style={{ color: 'var(--status-info)' }}>
                    {tripType === 'round_trip' ? t('Round Trip (2x)', 'রাউন্ড ট্রিপ', lang) : t('One-Way', 'একমুখী', lang)}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '8px',
                }}
              >
                <div className="fleet-route-stat-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', opacity: 0.75 }}>
                    <Navigation size={11} color="var(--status-info)" />
                    <span>{t('Est. Distance', 'দূরত্ব', lang)}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>
                    {telemetry.distanceKm} <span style={{ fontSize: '10.5px', fontWeight: 600, opacity: 0.7 }}>km</span>
                  </div>
                </div>

                <div className="fleet-route-stat-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', opacity: 0.75 }}>
                    <Clock size={11} color="var(--status-warning)" />
                    <span>{t('Est. Duration', 'সময়কাল', lang)}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>{telemetry.durationText}</div>
                </div>

                <div className="fleet-route-stat-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', opacity: 0.75 }}>
                    <Fuel size={11} color="var(--status-success)" />
                    <span>{t('Est. Fuel', 'জ্বালানি', lang)}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px', color: 'var(--status-success)' }}>
                    ~{telemetry.fuelLiters} <span style={{ fontSize: '10.5px', fontWeight: 600 }}>L</span>
                  </div>
                </div>

                <div
                  className="fleet-route-stat-box"
                  style={{
                    borderColor: telemetry.isMicrobus ? 'var(--status-warning)' : 'var(--status-info)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', opacity: 0.75 }}>
                    <Car size={11} color={telemetry.isMicrobus ? 'var(--status-warning)' : 'var(--status-info)'} />
                    <span>{t('Vehicle Class', 'যানবাহন শ্রেণী', lang)}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      marginTop: '2px',
                      color: telemetry.isMicrobus ? 'var(--status-warning)' : 'var(--status-info)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {telemetry.isMicrobus ? 'Microbus (7-Pax)' : 'Sedan (4-Pax)'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3C. TRANSIT MODE SELECTION */}
            <div className="notice-field-group">
              <div className="notice-field-label">
                <span>{t('Transit Mode', 'যাতায়াতের ধরন', lang)}</span>
                <span style={{ fontSize: '10px', opacity: 0.7, textTransform: 'none', fontWeight: 500 }}>
                  {t('Select trip type', 'যাত্রার ধরন নির্বাচন করুন', lang)}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  boxSizing: 'border-box',
                }}
              >
                <button
                  type="button"
                  onClick={() => setTripType('round_trip')}
                  className={`fleet-mode-card ${tripType === 'round_trip' ? 'active' : ''}`}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: tripType === 'round_trip' ? 'var(--status-info)' : 'inherit',
                      }}
                    >
                      <RotateCcw size={13} />
                      <span>{t('Round Trip (Return Included)', 'রাউন্ড ট্রিপ (প্রত্যাবর্তন সহ)', lang)}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', opacity: 0.7, marginTop: '2px', lineHeight: 1.3 }}>
                      {t('Driver waits on site and returns passengers to origin', 'চালক অপেক্ষা করবেন এবং মূল অফিসে ফিরিয়ে আনবেন', lang)}
                    </div>
                  </div>
                  {tripType === 'round_trip' && <Check size={15} color="var(--status-info)" style={{ flexShrink: 0 }} />}
                </button>

                <button
                  type="button"
                  onClick={() => setTripType('one_way')}
                  className={`fleet-mode-card ${tripType === 'one_way' ? 'active' : ''}`}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: tripType === 'one_way' ? 'var(--status-info)' : 'inherit',
                      }}
                    >
                      <ArrowRight size={13} />
                      <span>{t('One-Way Drop-Off', 'একমুখী যাত্রা (ড্রপ-অফ)', lang)}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', opacity: 0.7, marginTop: '2px', lineHeight: 1.3 }}>
                      {t('Drop-off at destination; vehicle returns to pool', 'গন্তব্যে নামিয়ে গাড়ি ডিসপ্যাচ পুলে ফিরে আসবে', lang)}
                    </div>
                  </div>
                  {tripType === 'one_way' && <Check size={15} color="var(--status-info)" style={{ flexShrink: 0 }} />}
                </button>
              </div>
            </div>

            {/* 3D. ORIGIN & DESTINATION ROW */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="var(--status-info)" />
                    {t('Origin Office / Hub', 'যাত্রা শুরুর স্থান', lang)}
                  </span>
                </div>
                <select value={fromLoc} onChange={(e) => setFromLoc(e.target.value)} className="notice-select">
                  <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                  <option value="Bashundhara Industrial Complex, South Keraniganj">Bashundhara Industrial Complex, South Keraniganj</option>
                  <option value="Meghna Ghat Asphalt Depot & Terminal">Meghna Ghat Asphalt Depot & Terminal</option>
                  <option value="Chittagong Port Petroleum Blending Terminal">Chittagong Port Petroleum Blending Terminal</option>
                  <option value="Hazrat Shahjalal International Airport (VIP Canopy)">Hazrat Shahjalal International Airport (VIP Canopy)</option>
                </select>
              </div>

              <div>
                <div className="notice-field-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="var(--brand-crimson)" />
                    {t('Destination / Venue', 'গন্তব্য স্থান', lang)} <span style={{ color: 'var(--brand-crimson)' }}>*</span>
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={toLoc}
                  onChange={(e) => setToLoc(e.target.value)}
                  placeholder="e.g. Keraniganj Bitumen Refinery Complex"
                  className="notice-input"
                />
              </div>
            </div>

            {/* 3E. INTERMEDIATE STOPS (WAYPOINTS) */}
            <div
              style={{
                padding: '9px 12px',
                borderRadius: '9px',
                background: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid var(--brand-slate-200)',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <label
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    margin: 0,
                  }}
                >
                  <CornerDownRight size={12} color="var(--status-info)" />
                  <span>{t('Via Stops / Waypoints (Optional)', 'যাত্রাপথের বিরতি (ঐচ্ছিক)', lang)}</span>
                </label>
                <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 600 }}>
                  {intermediateStops.length} {t('stops added', 'টি বিরতি যুক্ত', lang)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
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
                  placeholder="e.g. Sonali Bank Motijheel / Ministry Secretariat"
                  className="notice-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddStop}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text-1)',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={13} />
                  <span>{t('Add Stop', 'যুক্ত করুন', lang)}</span>
                </button>
              </div>

              {intermediateStops.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {intermediateStops.map((stop, idx) => (
                    <div key={idx} className="fleet-passenger-chip">
                      <span
                        style={{
                          width: '17px',
                          height: '17px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--status-info-bg)',
                          color: 'var(--status-info-text)',
                          fontWeight: 800,
                          fontSize: '9.5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 600 }}>{stop}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '1px',
                          display: 'flex',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3F. DEPARTURE DATE/TIME & RETURN TIME ROW */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: tripType === 'round_trip' ? '1fr 1fr' : '1fr',
                gap: '12px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} color="var(--status-info)" />
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
                />
              </div>

              {tripType === 'round_trip' && (
                <div>
                  <div className="notice-field-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="var(--status-info)" />
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
                  />
                </div>
              )}
            </div>

            {/* 3G. ACCOMPANYING PASSENGERS MULTI-SELECT */}
            <div className="notice-field-group">
              <div className="notice-field-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} color="var(--status-success)" />
                  {t('Passengers & Designations', 'যাত্রীদের তালিকা ও পদবী', lang)}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: telemetry.isMicrobus ? 'var(--status-warning)' : 'var(--status-info)',
                    backgroundColor: telemetry.isMicrobus ? 'rgba(217, 119, 6, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                    padding: '1px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {selectedPassengers.length} {t('Passengers', 'জন যাত্রী', lang)} ({telemetry.recommendedTier === 'microbus_7' ? 'Microbus' : 'Sedan'})
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '9px',
                  border: '1px solid var(--brand-slate-200)',
                  background: 'rgba(0, 0, 0, 0.02)',
                  minHeight: '38px',
                  boxSizing: 'border-box',
                }}
              >
                {selectedPassengers.map((p) => (
                  <div key={p.id} className="fleet-passenger-chip">
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '5px',
                        backgroundColor: p.avatarColor,
                        color: 'var(--text-on-brand)',
                        fontWeight: 800,
                        fontSize: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '11px', lineHeight: 1.15 }}>{p.name}</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.7 }}>{p.dept}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePassenger(p)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '1px',
                        display: 'flex',
                      }}
                      title="Remove Passenger"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '7px',
                    border: '1px dashed var(--status-info)',
                    color: 'var(--status-info)',
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={12} />
                  <span>{t('Add Colleague', 'সহকর্মী যোগ করুন', lang)}</span>
                  <ChevronDown size={11} />
                </button>
              </div>

              {showPassengerDropdown && (
                <div className="fleet-passenger-dropdown">
                  <div style={{ position: 'relative', marginBottom: '6px' }}>
                    <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '9px', top: '8px' }} />
                    <input
                      type="text"
                      value={passengerSearchQuery}
                      onChange={(e) => setPassengerSearchQuery(e.target.value)}
                      placeholder={t('Search colleague by name or department...', 'সহকর্মী খুঁজুন...', lang)}
                      className="notice-input"
                      style={{
                        padding: '6px 10px 6px 28px',
                        fontSize: '11.5px',
                      }}
                    />
                  </div>

                  <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
                    {filteredColleagues.map((c) => {
                      const isSelected = selectedPassengers.some((p) => p.id === c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => togglePassenger(c)}
                          className="fleet-colleague-row"
                          style={{
                            backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.1)' : undefined,
                            color: isSelected ? 'var(--status-info)' : 'inherit',
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '5px',
                                backgroundColor: c.avatarColor,
                                color: 'var(--text-on-brand)',
                                fontWeight: 800,
                                fontSize: '9px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ fontSize: '11.5px' }}>
                              <div>{c.name}</div>
                              <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 400 }}>
                                {c.designation} • {c.dept}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check size={13} color="var(--status-info)" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3H. OFFICIAL PURPOSE / TRANSIT JUSTIFICATION */}
            <div className="notice-field-group">
              <div className="notice-field-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={12} color="var(--text-3)" />
                  {t('Official Purpose / Justification', 'দাপ্তরিক কাজের উদ্দেশ্য', lang)}{' '}
                  <span style={{ color: 'var(--brand-crimson)' }}>*</span>
                </span>
                <span style={{ fontSize: '10px', opacity: 0.7, textTransform: 'none', fontWeight: 500 }}>
                  {purpose.length} chars
                </span>
              </div>
              <textarea
                required
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Official refinery site inspection, delivery of asphalt laboratory batch dossiers, and meeting Plant GM"
                className="notice-textarea"
                style={{
                  minHeight: '54px',
                  resize: 'vertical',
                  lineHeight: 1.45,
                }}
              />
            </div>

            {/* 3I. COST CENTER & SPECIAL LUGGAGE NOTES */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <div className="notice-field-label">
                  <span>{t('Cost Center Code', 'কস্ট সেন্টার কোড', lang)}</span>
                </div>
                <input
                  type="text"
                  required
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className="notice-input"
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <div className="notice-field-label">
                  <span>{t('Luggage / Equipment Notes (Optional)', 'বিশেষ লাগেজ / মালামাল (ঐচ্ছিক)', lang)}</span>
                </div>
                <input
                  type="text"
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="e.g. 2 asphalt batch test cylinders in trunk"
                  className="notice-input"
                />
              </div>
            </div>
          </div>

          {/* ─── 4. MODAL FOOTER ─── */}
          <div className="fleet-modal-ft">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', opacity: 0.8 }}>
              <ShieldCheck size={14} color="var(--status-success)" />
              <span>{t('Digital Trip Pass & Gate Pass issued on approval', 'অনুমোদনের পর ডিজিটাল ট্রিপ পাস ও গেট পাস ইস্যু হবে', lang)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'inherit',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--brand-slate-200)',
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
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-on-brand)',
                  background: 'linear-gradient(135deg, var(--brand-crimson) 0%, var(--brand-crimson-dark) 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(165, 28, 48, 0.3)',
                }}
              >
                <Car size={14} />
                <span>{t('Submit Requisition', 'রিকুইজিশন জমা দিন', lang)}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
