import React, { useState, useMemo } from 'react';
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
  Fuel,
  Navigation,
  Gauge,
  Briefcase,
  Layers,
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
    icon: '🏭',
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
    icon: '⚓',
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
    icon: '🚢',
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
    icon: '✈️',
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
    icon: '🏦',
  },
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
  const [selectedPassengers, setSelectedPassengers] = useState<CompanyColleague[]>([
    COMPANY_COLLEAGUES[0], // Tanvir Ahmed
    COMPANY_COLLEAGUES[1], // Engr. Tariq Ahmed
  ]);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [passengerSearchQuery, setPassengerSearchQuery] = useState('');

  // Dynamic Telemetry & Capacity Calculations
  const telemetry = useMemo(() => {
    // Check if current destination matches any preset
    const matchedPreset = MISSION_PRESETS.find((p) => p.destination === toLoc || toLoc.includes(p.nameEn));
    const baseDistance = matchedPreset ? matchedPreset.distanceKm : 32.5;
    const baseDuration = matchedPreset ? matchedPreset.durationMins : 60;
    const baseFuel = matchedPreset ? matchedPreset.fuelLiters : 4.0;

    const stopDistanceMultiplier = 1 + intermediateStops.length * 0.15;
    const stopTimeAdded = intermediateStops.length * 20; // 20 mins per stop

    const distanceMultiplier = tripType === 'round_trip' ? 2 : 1;
    const totalDistance = Math.round(baseDistance * stopDistanceMultiplier * distanceMultiplier * 10) / 10;
    const totalDurationMins = Math.round((baseDuration * distanceMultiplier) + stopTimeAdded);
    const totalFuel = Math.round(baseFuel * stopDistanceMultiplier * distanceMultiplier * 10) / 10;

    // Vehicle Tier Determination based on passenger count
    const paxCount = selectedPassengers.length;
    const isMicrobus = paxCount > 4;
    const recommendedTier: 'sedan_4' | 'microbus_7' = isMicrobus ? 'microbus_7' : 'sedan_4';
    const maxCapacity = isMicrobus ? 7 : 4;
    const capacityPct = Math.min(100, Math.round((paxCount / maxCapacity) * 100));

    // Duration Formatter
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
      requesterName: currentUserName,
      requesterRole: 'Sales Officer (Grade 8)',
      dept: currentUserDept,
      phone: '+880 1711-009988',
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
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="fleet-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '96%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* ─── 1. EXECUTIVE MODAL HEADER ─── */}
        <div className="fleet-modal-hd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #A51C30 0%, #E11D48 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)',
                flexShrink: 0,
              }}
            >
              <Car size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    backgroundColor: '#D97706',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Grade 8 Pool Entitled
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
                  'Central Dispatch assigns verified driver, vehicle & generates Digital Gate Pass',
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

        {/* ─── 2. STAFF IDENTITY & GRADE 8 ENTITLEMENT STRIP ─── */}
        <div className="fleet-modal-profile-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px',
                border: '1px solid #D97706',
              }}
            >
              TA
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '12.5px' }}>
                {currentUserName} <span style={{ fontWeight: 600, opacity: 0.75 }}>• Sales Officer (Grade 8)</span>
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '1px' }}>
                {currentUserDept} • Cost Center: <code style={{ fontWeight: 700, color: 'var(--brand-crimson)' }}>{costCenter}</code>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}>
              <ShieldCheck size={14} color="#059669" />
              <span>
                <strong>{t('Policy Entitlement:', 'নীতিমালা বরাদ্দ:', lang)}</strong> Pool Sedan (1-4 Pax) / Microbus (5-7 Pax)
              </span>
            </div>
            <div
              style={{
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563EB',
                fontWeight: 700,
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}
            >
              Authority: Central Dispatch
            </div>
          </div>
        </div>

        {/* ─── 3. SCROLLABLE FORM BODY ─── */}
        <form
          id="new-requisition-form"
          onSubmit={handleSubmit}
          className="fleet-modal-body"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            padding: '22px 28px',
            boxSizing: 'border-box',
          }}
        >
          {/* 3A. MISSION QUICK PRESETS BAR */}
          <div className="fleet-preset-bar">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                <Sparkles size={14} color="#D97706" />
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('1-Click Operational Mission Presets', '১-ক্লিকে তাৎক্ষণিক মিশন প্রিসেট', lang)}
                </span>
              </div>
              <span style={{ fontSize: '10.5px', opacity: 0.75 }}>
                {t('Auto-populates destination, route & official purpose', 'গন্তব্য, রুট ও উদ্দেশ্য স্বয়ংক্রিয়ভাবে পূরণ হবে', lang)}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                      fontWeight: isActive ? 800 : 600,
                    }}
                  >
                    <span style={{ marginRight: '4px' }}>{preset.icon}</span>
                    <span>{lang === 'bn' ? preset.nameBn : preset.nameEn}</span>
                    <span style={{ opacity: 0.65, fontSize: '10px', marginLeft: '4px' }}>
                      ({preset.distanceKm} km)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3B. LIVE ROUTE TELEMETRY & DYNAMIC VEHICLE RECOMMENDATION HUD */}
          <div className="fleet-telemetry-hud">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                <Gauge size={14} color="#2563EB" />
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('Live Route Telemetry & Allocation Recommendation', 'রুট টেলিমেট্রি ও যানবাহন বরাদ্দ রিকমেন্ডেশন', lang)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ opacity: 0.75 }}>Mode:</span>
                <strong style={{ color: '#2563EB' }}>
                  {tripType === 'round_trip' ? 'Round Trip (2x)' : 'One-Way Transit'}
                </strong>
              </div>
            </div>

            {/* 4 HUD Stat Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '10px',
                marginBottom: '12px',
              }}
            >
              {/* Stat 1: Est. Distance */}
              <div className="fleet-route-stat-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', opacity: 0.75 }}>
                  <Navigation size={13} color="#2563EB" />
                  <span>{t('Est. Distance', 'দূরত্ব', lang)}</span>
                </div>
                <div style={{ fontSize: '17px', fontWeight: 900, marginTop: '3px' }}>
                  {telemetry.distanceKm}{' '}
                  <span style={{ fontSize: '11.5px', fontWeight: 600, opacity: 0.7 }}>km</span>
                </div>
                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px' }}>
                  {intermediateStops.length > 0 ? `+${intermediateStops.length} stops included` : 'Direct corridor'}
                </div>
              </div>

              {/* Stat 2: Est. Travel Duration */}
              <div className="fleet-route-stat-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', opacity: 0.75 }}>
                  <Clock size={13} color="#D97706" />
                  <span>{t('Est. Duration', 'সময়কাল', lang)}</span>
                </div>
                <div style={{ fontSize: '17px', fontWeight: 900, marginTop: '3px' }}>
                  {telemetry.durationText}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px' }}>
                  {tripType === 'round_trip' ? 'Both legs + on-site wait' : 'Single transit leg'}
                </div>
              </div>

              {/* Stat 3: Fuel Requirement */}
              <div className="fleet-route-stat-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', opacity: 0.75 }}>
                  <Fuel size={13} color="#059669" />
                  <span>{t('Fuel Reqn.', 'জ্বালানি চাহিদা', lang)}</span>
                </div>
                <div style={{ fontSize: '17px', fontWeight: 900, marginTop: '3px', color: '#059669' }}>
                  ~{telemetry.fuelLiters}{' '}
                  <span style={{ fontSize: '11.5px', fontWeight: 600, opacity: 0.8 }}>L</span>
                </div>
                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px' }}>
                  Octane / Diesel Slip Issued
                </div>
              </div>

              {/* Stat 4: Recommended Vehicle Class */}
              <div
                className="fleet-route-stat-box"
                style={{
                  borderColor: telemetry.isMicrobus ? '#D97706' : '#2563EB',
                  borderWidth: '1.5px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', opacity: 0.75 }}>
                  <Car size={13} color={telemetry.isMicrobus ? '#D97706' : '#2563EB'} />
                  <span>{t('Assigned Tier', 'বরাদ্দকৃত শ্রেণী', lang)}</span>
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 900,
                    marginTop: '3px',
                    color: telemetry.isMicrobus ? '#D97706' : '#2563EB',
                  }}
                >
                  {telemetry.isMicrobus ? 'Microbus (HiAce 7-Pax)' : 'Sedan (Allion 4-Pax)'}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                  {telemetry.isMicrobus ? 'Activated for 5+ passengers' : '1-4 Official passengers'}
                </div>
              </div>
            </div>

            {/* Passenger Capacity Meter Bar */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.04)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                <Users size={14} color={telemetry.isMicrobus ? '#D97706' : '#2563EB'} />
                <span>
                  <strong>{telemetry.paxCount}</strong> of <strong>{telemetry.maxCapacity}</strong> passenger seats utilized
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: telemetry.isMicrobus ? 'rgba(217, 119, 6, 0.15)' : 'rgba(37, 99, 235, 0.12)',
                    color: telemetry.isMicrobus ? '#D97706' : '#2563EB',
                    fontWeight: 700,
                  }}
                >
                  {telemetry.capacityPct}% Capacity
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div
                style={{
                  flex: '0 0 160px',
                  height: '7px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${telemetry.capacityPct}%`,
                    height: '100%',
                    borderRadius: '999px',
                    backgroundColor: telemetry.isMicrobus ? '#D97706' : '#2563EB',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3C. TRANSIT MODE SELECTION */}
          <div className="notice-field-group" style={{ marginBottom: '20px' }}>
            <div className="notice-field-label">
              <span>{t('Transit Mode Selection', 'যাতায়াতের ধরন নির্বাচন', lang)}</span>
              <span style={{ fontSize: '11px', opacity: 0.7, textTransform: 'none', fontWeight: 500 }}>
                Select operational duty format
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
                className={`fleet-mode-card ${tripType === 'round_trip' ? 'active' : ''}`}
              >
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: tripType === 'round_trip' ? '#2563EB' : 'inherit',
                    }}
                  >
                    🔄 {t('Round Trip (Return Transit)', 'রাউন্ড ট্রিপ (প্রত্যাবর্তন সহ)', lang)}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '3px', lineHeight: 1.4 }}>
                    {t('Driver stays on site & returns officials to origin office', 'চালক কাজ শেষে যাত্রীদের মূল অফিসে ফেরত আনবেন', lang)}
                  </div>
                </div>
                {tripType === 'round_trip' && <Check size={18} color="#2563EB" style={{ flexShrink: 0 }} />}
              </button>

              <button
                type="button"
                onClick={() => setTripType('one_way')}
                className={`fleet-mode-card ${tripType === 'one_way' ? 'active' : ''}`}
              >
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: tripType === 'one_way' ? '#2563EB' : 'inherit',
                    }}
                  >
                    ➡️ {t('One-Way Transit Only', 'একমুখী যাত্রা (ড্রপ-অফ)', lang)}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '3px', lineHeight: 1.4 }}>
                    {t('Drop-off at destination, vehicle returns to central yard', 'শুধুমাত্র গন্তব্যে নামিয়ে দেওয়া হবে, গাড়ি ইয়ার্ডে ফিরবে', lang)}
                  </div>
                </div>
                {tripType === 'one_way' && <Check size={18} color="#2563EB" style={{ flexShrink: 0 }} />}
              </button>
            </div>
          </div>

          {/* 3D. ORIGIN & DESTINATION ROW */}
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
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} color="#2563EB" />
                  {t('Departure Hub / Origin Office', 'যাত্রা শুরুর অফিস / স্থান', lang)}
                </span>
              </div>
              <select
                value={fromLoc}
                onChange={(e) => setFromLoc(e.target.value)}
                className="notice-select"
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
                  <MapPin size={14} color="#A51C30" />
                  {t('Destination / Inspection Venue', 'গন্তব্য অফিস / পরিদর্শন এলাকা', lang)}{' '}
                  <span style={{ color: '#A51C30' }}>*</span>
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
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.02)',
              border: '1px solid var(--brand-slate-200, #E2E8F0)',
              marginBottom: '18px',
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
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: 0,
                }}
              >
                <CornerDownRight size={14} color="#2563EB" />
                <span>{t('Via Stops / Intermediate Waypoints (Optional)', 'যাত্রাপথের বিরতি বা স্টপ (ঐচ্ছিক)', lang)}</span>
              </label>
              <span style={{ fontSize: '11px', opacity: 0.7, fontWeight: 600 }}>
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
                className="notice-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddStop}
                style={{
                  padding: '9px 16px',
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
                  transition: 'all 0.15s ease',
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
                    className="fleet-passenger-chip"
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
                    <span style={{ fontWeight: 600 }}>{stop}</span>
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

          {/* 3F. DEPARTURE DATE/TIME & RETURN TIME ROW */}
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
                />
              </div>
            )}
          </div>

          {/* 3G. ACCOMPANYING PASSENGERS MULTI-SELECT */}
          <div className="notice-field-group" style={{ marginBottom: '20px' }}>
            <div className="notice-field-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={14} color="#059669" />
                {t('Passenger Names & Official Designations', 'যাত্রীদের তালিকা ও পদবী', lang)}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: telemetry.isMicrobus ? '#D97706' : '#2563EB',
                  backgroundColor: telemetry.isMicrobus ? 'rgba(217, 119, 6, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  border: telemetry.isMicrobus ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(37, 99, 235, 0.3)',
                }}
              >
                {selectedPassengers.length} {t('Officials', 'জন কর্মকর্তা', lang)} ({telemetry.recommendedTier === 'microbus_7' ? 'Microbus' : 'Sedan'})
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
                border: '1.5px solid var(--brand-slate-200, #CBD5E1)',
                background: 'rgba(0, 0, 0, 0.02)',
                minHeight: '48px',
                boxSizing: 'border-box',
              }}
            >
              {selectedPassengers.map((p) => (
                <div
                  key={p.id}
                  className="fleet-passenger-chip"
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
                    <div style={{ fontWeight: 800, fontSize: '11.5px' }}>{p.name}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>{p.dept}</div>
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
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
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
              <div className="fleet-passenger-dropdown">
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    value={passengerSearchQuery}
                    onChange={(e) => setPassengerSearchQuery(e.target.value)}
                    placeholder={t('Search employee directory by name or department...', 'সহকর্মী খুঁজুন...', lang)}
                    className="notice-input"
                    style={{
                      padding: '8px 12px 8px 32px',
                      fontSize: '12px',
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
                        className="fleet-colleague-row"
                        style={{
                          backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.1)' : undefined,
                          color: isSelected ? '#2563EB' : 'inherit',
                          fontWeight: isSelected ? 700 : 500,
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
                            <div style={{ fontSize: '10.5px', opacity: 0.7, fontWeight: 400 }}>
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

          {/* 3H. OFFICIAL PURPOSE / TRANSIT JUSTIFICATION */}
          <div className="notice-field-group" style={{ marginBottom: '20px' }}>
            <div className="notice-field-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={14} color="#64748B" />
                {t('Official Purpose / Transit Justification', 'দাপ্তরিক কাজের উদ্দেশ্য ও যৌক্তিকতা', lang)}{' '}
                <span style={{ color: '#A51C30' }}>*</span>
              </span>
              <span style={{ fontSize: '11px', opacity: 0.7, textTransform: 'none', fontWeight: 500 }}>
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
                minHeight: '80px',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* 3I. COST CENTER & SPECIAL LUGGAGE NOTES */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
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
                  fontFamily: 'monospace',
                  fontWeight: 700,
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
              />
            </div>
          </div>
        </form>

        {/* ─── 4. EXECUTIVE MODAL FOOTER ─── */}
        <div className="fleet-modal-ft">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', opacity: 0.8 }}>
            <ShieldCheck size={16} color="#059669" />
            <span>Digital Trip Pass & Gate Pass generated upon Transport Admin approval</span>
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
                color: 'inherit',
                backgroundColor: 'transparent',
                border: '1.5px solid var(--brand-slate-200, #CBD5E1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
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
