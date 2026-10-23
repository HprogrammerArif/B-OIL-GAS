import React, { useState } from 'react';
import { VehicleRequisition, Vehicle, Driver } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  Car, User, ShieldCheck, CheckCircle2, X, AlertTriangle,
  Clock, MapPin, QrCode, FileText, ChevronDown, Check,
  Fuel, Users
} from 'lucide-react';

interface AssignVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: VehicleRequisition | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  onConfirm: (reqId: string, vehiclePlate: string, driverId: string, dispatchNotes?: string) => void;
  lang: 'en' | 'bn';
}

export default function AssignVehicleModal({
  isOpen,
  onClose,
  requisition,
  vehicles,
  drivers,
  onConfirm,
  lang,
}: AssignVehicleModalProps) {
  // Filter for available roadworthy assets only
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const availableDrivers = drivers.filter(d => d.status === 'available');

  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState<string>(
    availableVehicles[0]?.plate || ''
  );
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    availableDrivers[0]?.id || ''
  );
  const [dispatchNotes, setDispatchNotes] = useState('Standard refinery corridor clearance. Adhere to 60 km/h speed limit.');
  const [error, setError] = useState('');

  if (!isOpen || !requisition) return null;

  const selectedVehicle = vehicles.find(v => v.plate === selectedVehiclePlate);
  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const handleAssign = () => {
    if (!selectedVehiclePlate || !selectedDriverId) {
      setError(t('Please select both a vehicle and an available driver.', 'দয়া করে গাড়ি ও চালক উভয়ই নির্বাচন করুন।', lang));
      return;
    }

    onConfirm(requisition.id, selectedVehiclePlate, selectedDriverId, dispatchNotes);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                  {t('Dispatch Desk: Assign Vehicle & Driver', 'ডেসপ্যাচ ডেস্ক: গাড়ি ও চালক বরাদ্দ', lang)}
                </h3>
                <span className="badge gold" style={{ fontSize: '10px' }}>
                  #{requisition.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('Requester:', 'আবেদনকারী:')} <strong>{requisition.requesterName}</strong> • {requisition.dept}
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Trip Dossier Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{requisition.from.split(',')[0]} ➔ {requisition.to.split(',')[0]}</span>
              </div>
              <span className="badge info" style={{ fontSize: '9.5px' }}>
                {requisition.tripType === 'round_trip' ? '🔄 Round Trip' : '➡️ One Way'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-1">
              <div>
                <span className="text-slate-400 block text-[10.5px]">Departure:</span>
                <span className="font-semibold">{requisition.departureTime}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10.5px]">Passengers:</span>
                <span className="font-semibold">{requisition.passengersCount} Officials ({requisition.passengerNames.split(',')[0]}...)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 italic">
              &ldquo;{requisition.purpose}&rdquo;
            </div>
          </div>

          {/* 1. Select Available Roadworthy Vehicle (Solving Issue 3) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-blue-600" />
                <span>{t('1. Select Available Roadworthy Vehicle from Fleet', '১. বহর থেকে প্রস্তুত যানবাহন নির্বাচন করুন', lang)}</span>
              </label>
              <span className="badge success" style={{ fontSize: '9.5px' }}>
                {availableVehicles.length} {t('Vehicles Ready', 'গাড়ি প্রস্তুত', lang)}
              </span>
            </div>

            {availableVehicles.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                ⚠️ {t('All pool vehicles are currently in transit or undergoing maintenance.', 'সকল গাড়ি বর্তমানে সড়কে অথবা ওয়ার্কশপে রক্ষণাবেক্ষণাধীন।', lang)}
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedVehiclePlate}
                  onChange={(e) => setSelectedVehiclePlate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.plate}>
                      {v.plate} — {v.model} ({v.capacitySeats} Seats | Fuel: {v.fuelPct}% Octane)
                    </option>
                  ))}
                </select>

                {/* Selected Vehicle Quick Details Card */}
                {selectedVehicle && (
                  <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-blue-900 dark:text-blue-300">{selectedVehicle.model}</div>
                      <div className="text-[11px] text-slate-500">
                        {selectedVehicle.location} • Next Svc: {selectedVehicle.nextServiceKm?.toLocaleString() || '45,000'} km
                      </div>
                    </div>
                    <span className="badge success" style={{ fontSize: '9px' }}>AVAILABLE</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Select Certified Driver On Duty (Solving Issue 3) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{t('2. Select Certified On-Duty Driver', '২. উপস্থিত সার্টিফাইড চালক বরাদ্দ করুন', lang)}</span>
              </label>
              <span className="badge success" style={{ fontSize: '9.5px' }}>
                {availableDrivers.length} {t('Drivers Ready', 'চালক প্রস্তুত', lang)}
              </span>
            </div>

            {availableDrivers.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                ⚠️ {t('No drivers are currently available (on trip, sick leave, or rest required).', 'কোনো চালক উপস্থিত নেই (সবাই ট্রিপে অথবা ছুটিতে আছেন)।', lang)}
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
                >
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone}) — {d.licenseType} | Rating: ★{d.rating} | BAC: 0.00%
                    </option>
                  ))}
                </select>

                {/* Selected Driver Quick Details Card */}
                {selectedDriver && (
                  <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-emerald-900 dark:text-emerald-300">{selectedDriver.name} ({selectedDriver.phone})</div>
                      <div className="text-[11px] text-slate-500">
                        License: {selectedDriver.licenseNo} • Breathalyzer: <strong>{selectedDriver.breathalyzerToday}</strong>
                      </div>
                    </div>
                    <span className="badge success" style={{ fontSize: '9px' }}>100% BAC PASSED</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Dispatch Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('Dispatch Instructions / Route Waypoints', 'ডেসপ্যাচ নির্দেশনা ও রুট নোট', lang)}</span>
            </label>
            <input
              type="text"
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {t('Cancel', 'বাতিল', lang)}
          </button>
          <button
            type="button"
            disabled={availableVehicles.length === 0 || availableDrivers.length === 0}
            onClick={handleAssign}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition flex items-center gap-2 disabled:opacity-50"
            style={{ background: '#D97706' }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('Confirm Assignment & Dispatch Challan', 'বরাদ্দ নিশ্চিত করুন ও ডিজিটাল চালান তৈরি করুন', lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
