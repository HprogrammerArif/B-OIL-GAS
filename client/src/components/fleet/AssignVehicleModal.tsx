import React, { useState } from 'react';
import { VehicleRequisition, Vehicle, Driver } from '../../store/fleetStore';
import { t } from '../../types';
import {
  Car,
  User,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  Fuel,
  Users,
  Check,
  Shield,
  Gauge,
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
  const availableVehicles = vehicles.filter((v) => v.status === 'available');
  const availableDrivers = drivers.filter((d) => d.status === 'available');

  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState<string>(
    availableVehicles[0]?.plate || ''
  );
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    availableDrivers[0]?.id || ''
  );
  const [dispatchNotes, setDispatchNotes] = useState(
    'Standard refinery corridor clearance. Adhere to 60 km/h expressway speed limit. Ensure vehicle return by designated roster.'
  );
  const [error, setError] = useState('');

  if (!isOpen || !requisition) return null;

  const selectedVehicle = vehicles.find((v) => v.plate === selectedVehiclePlate);
  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  const handleAssign = () => {
    if (!selectedVehiclePlate || !selectedDriverId) {
      setError(
        t('Please select both a vehicle and an available driver.', 'দয়া করে গাড়ি ও চালক উভয়ই নির্বাচন করুন।', lang)
      );
      return;
    }

    onConfirm(requisition.id, selectedVehiclePlate, selectedDriverId, dispatchNotes);
    onClose();
  };

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
          maxWidth: '760px',
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
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} color="#FFFFFF" />
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
                  {t('Dispatch Desk: Assign Vehicle & Driver', 'ডেসপ্যাচ ডেস্ক: গাড়ি ও চালক বরাদ্দ', lang)}
                </h3>
                <span
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#0F172A',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 9px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                  }}
                >
                  #{requisition.id}
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
                {t('Requester:', 'আবেদনকারী:')} <strong>{requisition.requesterName}</strong> • {requisition.dept}
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
        <div
          className="fleet-modal-body"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            padding: '26px 32px',
            backgroundColor: '#FFFFFF',
            boxSizing: 'border-box',
          }}
        >
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Trip Dossier Summary Box */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              marginBottom: '22px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  color: '#0F172A',
                }}
              >
                <MapPin size={16} color="#2563EB" />
                <span>
                  {requisition.from.split(',')[0]} ➔ {requisition.to.split(',')[0]}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: '#EFF6FF',
                  color: '#1E40AF',
                  border: '1px solid #BFDBFE',
                }}
              >
                {requisition.tripType === 'round_trip' ? '🔄 Round Trip' : '➡️ One Way'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '12px',
                color: '#475569',
                paddingTop: '6px',
              }}
            >
              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Departure Time
                </span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{requisition.departureTime}</span>
              </div>
              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Authorized Passengers
                </span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                  {requisition.passengersCount} Officials ({requisition.passengerNames.split(',')[0]}...)
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid #E2E8F0',
                fontSize: '11.5px',
                color: '#64748B',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{requisition.purpose}&rdquo;
            </div>
          </div>

          {/* 1. Select Available Roadworthy Vehicle */}
          <div className="notice-field-group" style={{ marginBottom: '22px' }}>
            <div className="notice-field-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Car size={15} color="#2563EB" />
                <span>{t('1. Select Available Roadworthy Vehicle from Fleet', '১. বহর থেকে প্রস্তুত যানবাহন নির্বাচন করুন', lang)}</span>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#065F46',
                  backgroundColor: '#ECFDF5',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0',
                }}
              >
                {availableVehicles.length} {t('Vehicles Ready', 'গাড়ি প্রস্তুত', lang)}
              </span>
            </div>

            {availableVehicles.length === 0 ? (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  fontSize: '12px',
                  color: '#92400E',
                }}
              >
                ⚠️ {t('All pool vehicles are currently in transit or undergoing maintenance.', 'সকল গাড়ি বর্তমানে সড়কে অথবা ওয়ার্কশপে রক্ষণাবেক্ষণাধীন।', lang)}
              </div>
            ) : (
              <div>
                <select
                  value={selectedVehiclePlate}
                  onChange={(e) => setSelectedVehiclePlate(e.target.value)}
                  className="notice-select"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                  }}
                >
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.plate}>
                      {v.plate} — {v.model} ({v.capacitySeats} Seats | Fuel: {v.fuelPct}% Octane)
                    </option>
                  ))}
                </select>

                {/* Selected Vehicle Quick Details Card */}
                {selectedVehicle && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E40AF' }}>
                        {selectedVehicle.model} ({selectedVehicle.plate})
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        {selectedVehicle.location} • Odometer: {((selectedVehicle as any).odometerKm || selectedVehicle.nextServiceKm || 42350).toLocaleString()} km • Fuel: {selectedVehicle.fuelPct}%
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: '#ECFDF5',
                        color: '#065F46',
                        border: '1px solid #A7F3D0',
                      }}
                    >
                      ROADWORTHY
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Select Certified Driver On Duty */}
          <div className="notice-field-group" style={{ marginBottom: '22px' }}>
            <div className="notice-field-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="#059669" />
                <span>{t('2. Select Certified On-Duty Driver', '২. উপস্থিত সার্টিফাইড চালক বরাদ্দ করুন', lang)}</span>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#065F46',
                  backgroundColor: '#ECFDF5',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid #A7F3D0',
                }}
              >
                {availableDrivers.length} {t('Drivers Ready', 'চালক প্রস্তুত', lang)}
              </span>
            </div>

            {availableDrivers.length === 0 ? (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  fontSize: '12px',
                  color: '#92400E',
                }}
              >
                ⚠️ {t('No drivers are currently available (on trip, sick leave, or rest required).', 'কোনো চালক উপস্থিত নেই (সবাই ট্রিপে অথবা ছুটিতে আছেন)।', lang)}
              </div>
            ) : (
              <div>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="notice-select"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                  }}
                >
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone}) — {d.licenseType} | Rating: ★{d.rating} | BAC: 0.00%
                    </option>
                  ))}
                </select>

                {/* Selected Driver Quick Details Card */}
                {selectedDriver && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#065F46' }}>
                        {selectedDriver.name} ({selectedDriver.phone})
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        License: {selectedDriver.licenseNo} • Breathalyzer: <strong>{selectedDriver.breathalyzerToday || '0.00% BAC'}</strong>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: '#D1FAE5',
                        color: '#065F46',
                        border: '1px solid #34D399',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={11} />
                      100% BAC PASSED
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Dispatch Instructions */}
          <div className="notice-field-group" style={{ marginBottom: '10px' }}>
            <div className="notice-field-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="#64748B" />
                <span>{t('Dispatch Instructions / Route Waypoints', 'ডেসপ্যাচ নির্দেশনা ও রুট নোট', lang)}</span>
              </span>
            </div>
            <textarea
              rows={3}
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="notice-textarea"
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '13px',
                lineHeight: 1.6,
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '70px',
              }}
            />
          </div>
        </div>

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
            <span>Digital Trip Challan Pass will be generated instantly upon confirmation</span>
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
              type="button"
              disabled={availableVehicles.length === 0 || availableDrivers.length === 0}
              onClick={handleAssign}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                background:
                  availableVehicles.length === 0 || availableDrivers.length === 0
                    ? '#CBD5E1'
                    : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                border: 'none',
                cursor:
                  availableVehicles.length === 0 || availableDrivers.length === 0
                    ? 'not-allowed'
                    : 'pointer',
                boxShadow:
                  availableVehicles.length === 0 || availableDrivers.length === 0
                    ? 'none'
                    : '0 4px 14px rgba(217, 119, 6, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (availableVehicles.length > 0 && availableDrivers.length > 0) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(217, 119, 6, 0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (availableVehicles.length > 0 && availableDrivers.length > 0) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(217, 119, 6, 0.35)';
                }
              }}
            >
              <CheckCircle2 size={15} />
              <span>{t('Confirm Assignment & Dispatch Challan', 'বরাদ্দ নিশ্চিত করুন ও ডিজিটাল চালান তৈরি করুন', lang)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
