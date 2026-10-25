import React, { useState } from 'react';
import { VehicleRequisition } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  Car, MapPin, Calendar, Clock, Users, FileText,
  X, Check, Plus, AlertCircle, Sparkles, Building2,
  ChevronDown, Search, ArrowRight, CornerDownRight,
  ShieldCheck
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
    if (selectedPassengers.some(p => p.id === colleague.id)) {
      if (selectedPassengers.length === 1) {
        showToast(t('At least 1 passenger required', 'কমপক্ষে একজন যাত্রী আবশ্যক', lang), 'info');
        return;
      }
      setSelectedPassengers(selectedPassengers.filter(p => p.id !== colleague.id));
    } else {
      setSelectedPassengers([...selectedPassengers, colleague]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      showToast(t('Please specify the official business purpose.', 'অনুগ্রহ করে দাপ্তরিক কাজের উদ্দেশ্য লিখুন।', lang), 'info');
      return;
    }

    const passengerNamesString = selectedPassengers
      .map(p => `${p.name} (${p.designation})`)
      .join(', ');

    onSubmit({
      requesterName: currentUserName,
      requesterRole: 'Sr. Sales & Distribution Specialist',
      dept: currentUserDept,
      phone: '+880 1712-334455',
      from: fromLoc,
      to: toLoc,
      tripType,
      departureTime,
      returnTime: tripType === 'round_trip' ? returnTime : undefined,
      requiredCapacity: selectedPassengers.length > 4 ? 'microbus_7' : 'sedan_4',
      passengersCount: selectedPassengers.length,
      passengerNames: passengerNamesString,
      purpose,
      costCenter,
      intermediateStops: intermediateStops.map((stop, idx) => ({
        id: `STP-${Date.now()}-${idx + 1}`,
        location: stop,
        waitDurationMins: 15
      })),
      estimatedCost: 1400 + (intermediateStops.length * 350),
    });

    onClose();
  };

  const filteredColleagues = COMPANY_COLLEAGUES.filter(c =>
    c.name.toLowerCase().includes(passengerSearchQuery.toLowerCase()) ||
    c.dept.toLowerCase().includes(passengerSearchQuery.toLowerCase()) ||
    c.designation.toLowerCase().includes(passengerSearchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. FIXED MODAL HEADER ─── */}
        <div className="shrink-0 px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 flex items-center justify-center font-bold">
              <Car className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                {t('Official Duty Travel Requisition Form', 'দাপ্তরিক যাতায়াত যানবাহন রিকুইজিশন ফর্ম', lang)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('Vehicle & Driver will be allocated by the Central Transport Supervisor', 'যানবাহন ও চালক কেন্দ্রীয় পরিবহন সুপারভাইজার কর্তৃক বরাদ্দ হবে', lang)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 2. SCROLLABLE FORM BODY ─── */}
        <form id="new-requisition-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Transit Mode Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              {t('Transit Mode', 'যাতায়াতের ধরন', lang)}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTripType('round_trip')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                  tripType === 'round_trip'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className={`font-bold text-xs ${tripType === 'round_trip' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    🔄 {t('Round Trip (Return Transit)', 'রাউন্ড ট্রিপ (প্রত্যাবর্তন সহ)', lang)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t('Driver returns officials back to origin office', 'চালক কাজ শেষে যাত্রীদের মূল অফিসে ফেরত আনবেন', lang)}
                  </div>
                </div>
                {tripType === 'round_trip' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setTripType('one_way')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                  tripType === 'one_way'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className={`font-bold text-xs ${tripType === 'one_way' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    ➡️ {t('One-Way Transit Only', 'একমুখী যাত্রা (ড্রপ-অফ)', lang)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t('Drop-off at destination, vehicle returns to yard', 'শুধুমাত্র গন্তব্যে নামিয়ে দেওয়া হবে', lang)}
                  </div>
                </div>
                {tripType === 'one_way' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Origin and Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('Departure Hub / Origin Office', 'যাত্রা শুরুর অফিস / স্থান', lang)}</span>
              </label>
              <select
                value={fromLoc}
                onChange={(e) => setFromLoc(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
                <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                <option value="Bashundhara Industrial Complex, South Keraniganj">Bashundhara Industrial Complex, South Keraniganj</option>
                <option value="Meghna Ghat Asphalt Depot & Terminal">Meghna Ghat Asphalt Depot & Terminal</option>
                <option value="Chittagong Port Petroleum Blending Terminal">Chittagong Port Petroleum Blending Terminal</option>
                <option value="Hazrat Shahjalal International Airport (VIP Canopy)">Hazrat Shahjalal International Airport (VIP Canopy)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>{t('Destination / Inspection Venue', 'গন্তব্য অফিস / পরিদর্শন এলাকা', lang)}</span>
              </label>
              <input
                type="text"
                required
                value={toLoc}
                onChange={(e) => setToLoc(e.target.value)}
                placeholder="e.g. Keraniganj Bitumen Refinery Complex"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              >
              </input>
            </div>
          </div>

          {/* Via Stops / Waypoints */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('Via Stops / Intermediate Waypoints (Optional)', 'যাত্রাপথের বিরতি বা স্টপ (ঐচ্ছিক)', lang)}</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {intermediateStops.length} {t('stops added', 'টি বিরতি', lang)}
              </span>
            </div>

            <div className="flex gap-2">
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
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddStop}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add Stop', 'যুক্ত করুন', lang)}</span>
              </button>
            </div>

            {intermediateStops.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {intermediateStops.map((stop, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{stop}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Departure & Expected Return Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('Departure Date & Time', 'যাত্রার সময় ও তারিখ', lang)}</span>
              </label>
              <input
                type="text"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="e.g. Today, 02:30 PM"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            {tripType === 'round_trip' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('Expected Return Time', 'প্রত্যাবর্তনের সম্ভাব্য সময়', lang)}</span>
                </label>
                <input
                  type="text"
                  required
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  placeholder="e.g. Today, 06:30 PM"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Passengers Selection & Directory Multi-select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>{t('Passenger Names & Designations', 'যাত্রীদের তালিকা ও পদবী', lang)}</span>
              </label>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                {selectedPassengers.length} {t('Official Passengers', 'জন কর্মকর্তা', lang)}
              </span>
            </div>

            {/* Selected Passenger Tag Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 min-h-[46px]">
              {selectedPassengers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs"
                >
                  <div
                    className="w-6 h-6 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0"
                    style={{ background: p.avatarColor }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-[11px]">{p.name}</div>
                    <div className="text-[9.5px] text-slate-500">{p.designation.split(' ')[0]}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePassenger(p)}
                    className="text-slate-400 hover:text-rose-600 ml-1 p-0.5"
                    title="Remove Passenger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Passenger Button */}
              <button
                type="button"
                onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                className="px-3 py-1.5 rounded-xl border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Select Colleagues', 'সহকর্মী যোগ করুন', lang)}</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Dropdown Directory List */}
            {showPassengerDropdown && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg space-y-2 mt-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={passengerSearchQuery}
                    onChange={(e) => setPassengerSearchQuery(e.target.value)}
                    placeholder={t('Search employee directory...', 'সহকর্মী খুঁজুন...', lang)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredColleagues.map((c) => {
                    const isSelected = selectedPassengers.some(p => p.id === c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => togglePassenger(c)}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md text-white font-bold text-[10px] flex items-center justify-center shrink-0"
                            style={{ background: c.avatarColor }}
                          >
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{c.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{c.designation} • {c.dept}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Official Purpose */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('Official Purpose / Transit Justification', 'দাপ্তরিক কাজের উদ্দেশ্য ও যৌক্তিকতা', lang)}</span>
            </label>
            <textarea
              required
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Official refinery site inspection, delivery of asphalt laboratory batch dossiers, and meeting Plant GM"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white resize-none leading-relaxed"
            />
          </div>

          {/* Cost Center and Special Luggage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                {t('Cost Center / Department Code', 'বিভাগীয় কস্ট সেন্টার কোড', lang)}
              </label>
              <input
                type="text"
                required
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                {t('Special Luggage / Cargo Notes (Optional)', 'বিশেষ লাগেজ / মালামাল বিবরণ (ঐচ্ছিক)', lang)}
              </label>
              <input
                type="text"
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="e.g. 2 asphalt batch test cylinders in trunk"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </form>

        {/* ─── 3. FIXED MODAL FOOTER (ALWAYS VISIBLE WITH GENEROUS PADDING) ─── */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {t('Cancel', 'বাতিল', lang)}
          </button>
          <button
            type="submit"
            form="new-requisition-form"
            className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:opacity-95 transition flex items-center gap-2"
            style={{ background: 'var(--brand-crimson, #A51C30)' }}
          >
            <Car className="w-4 h-4" />
            <span>{t('Submit Requisition to Transport Admin', 'পরিবহন প্রশাসনে আবেদন দাখিল করুন', lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
