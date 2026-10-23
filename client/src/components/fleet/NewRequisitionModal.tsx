import React, { useState } from 'react';
import { VehicleRequisition } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  Car, MapPin, Calendar, Clock, Users, FileText,
  X, Check, Plus, AlertCircle, Sparkles, Building2,
  ChevronDown, Search, ArrowRight, CornerDownRight
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crimson-500/10 dark:bg-red-500/10 text-crimson-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Car className="w-5 h-5 text-crimson-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                {t('Official Duty Travel Requisition Form', 'দাপ্তরিক যাতায়াত যানবাহন রিকুইজিশন ফর্ম', lang)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Trip Mode Switch */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              {t('Transit Mode', 'যাতায়াতের ধরন', lang)}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTripType('round_trip')}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  tripType === 'round_trip'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
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
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  tripType === 'one_way'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className={`font-bold text-xs ${tripType === 'one_way' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    ➡️ {t('One-Way Dropoff Only', 'ওয়ান-ওয়ে ড্রপ-অফ', lang)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t('Drop officials at destination only', 'শুধুমাত্র নির্ধারিত গন্তব্যে নামিয়ে দেওয়া হবে', lang)}
                  </div>
                </div>
                {tripType === 'one_way' && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Route: From & To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('Departure Hub / Origin Office', 'যাত্রার প্রারম্ভিক অফিস', lang)}</span>
              </label>
              <select
                value={fromLoc}
                onChange={(e) => setFromLoc(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              >
                <option value="Bashundhara Corporate HQ, Baridhara">Bashundhara Corporate HQ, Baridhara</option>
                <option value="Keraniganj Bitumen Refinery Complex">Keraniganj Bitumen Refinery Complex</option>
                <option value="Bashundhara City Complex, Panthapath">Bashundhara City Complex, Panthapath</option>
                <option value="Meghna Ghat Asphalt Terminal & Depot">Meghna Ghat Asphalt Terminal & Depot</option>
                <option value="Chittagong Regional Marine Terminal">Chittagong Regional Marine Terminal</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span>{t('Destination / Inspection Venue', 'গন্তব্য স্থান', lang)}</span>
              </label>
              <input
                type="text"
                required
                value={toLoc}
                onChange={(e) => setToLoc(e.target.value)}
                placeholder="e.g. Keraniganj Bitumen Plant Gate #1 / Bangladesh Bank Motijheel"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Intermediate Stops (Multi-Stop Waypoints) */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CornerDownRight className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('Via Stops / Intermediate Waypoints (Optional)', 'ভায়া স্টপ / মধ্যবর্তী বিরতিসমূহ', lang)}</span>
              </label>
              <span className="text-[10.5px] font-semibold text-slate-500">
                {intermediateStops.length} {t('stops added', 'স্টপ যোগ করা হয়েছে', lang)}
              </span>
            </div>

            {intermediateStops.length > 0 && (
              <div className="space-y-1.5">
                {intermediateStops.map((stop, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{stop}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(idx)}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={stopInput}
                onChange={(e) => setStopInput(e.target.value)}
                placeholder="e.g. Sonali Bank Motijheel Head Office / Ministry Secretariat"
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStop();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddStop}
                className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add Stop', 'স্টপ যোগ করুন', lang)}</span>
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('Departure Date & Time', 'যাত্রার সময়', lang)}</span>
              </label>
              <input
                type="text"
                required
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="Today, 02:30 PM"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            {tripType === 'round_trip' && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('Expected Return Time', 'প্রত্যাবর্তনের সময়', lang)}</span>
                </label>
                <input
                  type="text"
                  required
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  placeholder="Today, 06:30 PM"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            )}
          </div>

          {/* Passenger Selection Dropdown (Solving Issue 1) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('Passenger Names & Designations', 'যাত্রীদের তালিকা ও পদবি', lang)}</span>
              </label>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                {selectedPassengers.length} {selectedPassengers.length === 1 ? 'Official' : 'Officials'}
              </span>
            </div>

            {/* Selected Passengers Badges */}
            <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 min-h-[46px]">
              {selectedPassengers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm text-xs font-medium"
                >
                  <span
                    className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ background: p.avatarColor }}
                  >
                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                    <span className="text-[10px] text-slate-500 block leading-none">{p.designation}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePassenger(p)}
                    className="text-slate-400 hover:text-red-500 p-0.5 ml-1"
                    title="Remove Passenger"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add Colleagues Trigger */}
              <button
                type="button"
                onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Select Colleagues', 'সহকর্মী যোগ করুন', lang)}</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Colleagues Dropdown Popover */}
            {showPassengerDropdown && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-xl space-y-2 z-50">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={passengerSearchQuery}
                    onChange={(e) => setPassengerSearchQuery(e.target.value)}
                    placeholder="Search by name, designation, or department..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredColleagues.map((colleague) => {
                    const isSelected = selectedPassengers.some(p => p.id === colleague.id);
                    return (
                      <div
                        key={colleague.id}
                        onClick={() => togglePassenger(colleague)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                            style={{ background: colleague.avatarColor }}
                          >
                            {colleague.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{colleague.name}</div>
                            <div className="text-[10px] text-slate-500">{colleague.designation} • {colleague.dept}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Purpose & Cost Center */}
          <div className="space-y-4">
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {t('Cost Center / Department Code', 'বিভাগীয় কস্ট সেন্টার কোড', lang)}
                </label>
                <input
                  type="text"
                  required
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t('Cancel', 'বাতিল', lang)}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white font-bold text-xs shadow-lg shadow-crimson-600/20 transition flex items-center gap-2"
              style={{ background: 'var(--brand-crimson)' }}
            >
              <Car className="w-4 h-4" />
              <span>{t('Submit Requisition to Transport Admin', 'পরিবহন প্রশাসনে আবেদন দাখিল করুন', lang)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
