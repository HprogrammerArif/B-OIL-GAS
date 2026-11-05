import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ViewProps, t } from '../types';
import { showToast } from '../components/ToastManager';
import { useFleetStore, Driver, Vehicle, VehicleRequisition, TripChatMessage, FleetNotification } from '../store/fleetStore';
import { useCurrentUser } from '../auth/session';
import { nowTime } from '../lib/clock';
import { fleetModeFor, fleetPartyFor, requisitionsVisibleTo, notificationsVisibleTo, findPoolingSuggestion, fleetStatusLabel, ENABLE_FLEET_CHAT_DESK } from './fleet/config';
import {
  Truck, Car, Fuel, MapPin, CheckCircle, Clock, AlertCircle,
  Plus, Users, Navigation, QrCode, FileText,
  Gauge, Radio, ShieldCheck, AlertTriangle, ArrowRight, Eye,
  Maximize2, Activity, Check, Compass, PhoneCall,
  UserCheck, Shield, Key, Calendar, Printer, Search, RotateCcw,
  UserPlus, ThumbsUp, X, ChevronRight, Share2, Phone,
  AlertOctagon, RefreshCw, Filter, Layers, Download, CheckCircle2,
  MessageSquare, Bell, Send, MessageCircle, CheckCheck, Wrench
} from 'lucide-react';
import RegisterVehicleModal from '../components/fleet/RegisterVehicleModal';
import EnrollDriverModal from '../components/fleet/EnrollDriverModal';
import TripChatModal from '../components/fleet/TripChatModal';
import FleetNotificationsDrawer from '../components/fleet/FleetNotificationsDrawer';
import FleetChatCenter from '../components/fleet/FleetChatCenter';
import FleetTabs from '../components/fleet/FleetTabs';
import NewRequisitionModal from '../components/fleet/NewRequisitionModal';
import AssignVehicleModal from '../components/fleet/AssignVehicleModal';
import DriverConsole from '../components/fleet/DriverConsole';
import { approvalStore } from '../store/approvalStore';
import { Modal, Button, Card } from '../components/ui';

export default function FleetView({ role, lang }: ViewProps) {
  const {
    drivers,
    vehicles,
    requisitions,
    chatMessages,
    notifications,
    addRequisition,
    assignRequisition,
    startTrip,
    completeTrip,
    rejectRequisition,
    poolRequisitions,
    issueFuelVoucher,
    recordBreathalyzer,
    updateDriverStatus,
    updateVehicleStatus,
    sendChatMessage,
    markNotificationRead,
    markAllNotificationsRead
  } = useFleetStore();

  const user = useCurrentUser();
  const mode = user ? fleetModeFor(user) : 'requester';
  const isEmployee = mode === 'requester';
  const isDriver = mode === 'driver';
  const isTransportAdmin = mode === 'dispatch';
  const isOversight = mode === 'oversight';
  const party = fleetPartyFor(mode);

  const [activeAdminTab, setActiveAdminTab] = useState<'requisitions' | 'drivers' | 'telematics' | 'fuel' | 'gate_manifest' | 'chat_center'>('requisitions');
  const [employeeTab, setEmployeeTab] = useState<'requisitions' | 'chat_center'>('requisitions');
  const [driverTab, setDriverTab] = useState<'console' | 'chat_center'>('console');

  // Check if dedicated chat center tab is active across roles to lock viewport and maximize chat area
  const isChatTabActive = ENABLE_FLEET_CHAT_DESK && ((isEmployee && employeeTab === 'chat_center') || (!isEmployee && !isDriver && activeAdminTab === 'chat_center') || (isDriver && driverTab === 'chat_center'));

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'all' | 'available' | 'on_trip' | 'sick_leave' | 'on_leave' | 'rest_required'>('all');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<'all' | 'available' | 'in_transit' | 'maintenance'>('all');

  // Tri-Party Chat State
  const [selectedChatChannelId, setSelectedChatChannelId] = useState<string | undefined>(undefined);
  const [activeChatReq, setActiveChatReq] = useState<VehicleRequisition | null>(null);
  const [chatInputText, setChatInputText] = useState('');

  // Multi-Stop Route Itinerary State
  const [intermediateStops, setIntermediateStops] = useState<string[]>([]);
  const [newStopInput, setNewStopInput] = useState('');

  // Notifications Drawer State
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<'all' | 'assignment' | 'driver_status' | 'maintenance' | 'chat'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'in_transit' | 'completed'>('all');

  // Selected telemetry vehicle (Admin only)
  const [selectedVehicleTelemetry, setSelectedVehicleTelemetry] = useState<Vehicle | null>(vehicles[4]);

  // Modals
  const [showNewRequisitionModal, setShowNewRequisitionModal] = useState(false);
  const [showRegisterVehicleModal, setShowRegisterVehicleModal] = useState(false);
  const [showEnrollDriverModal, setShowEnrollDriverModal] = useState(false);
  const [assigningReq, setAssigningReq] = useState<VehicleRequisition | null>(null);
  const [selectedTripPassReq, setSelectedTripPassReq] = useState<VehicleRequisition | null>(null);
  const [trackingReq, setTrackingReq] = useState<VehicleRequisition | null>(null);
  const [showFuelModal, setShowFuelModal] = useState<Vehicle | null>(null);
  const [showSmartPoolModal, setShowSmartPoolModal] = useState(false);
  const [completingReq, setCompletingReq] = useState<VehicleRequisition | null>(null);
  const [rejectingReq, setRejectingReq] = useState<VehicleRequisition | null>(null);
  const [rejectReason, setRejectReason] = useState('All pool sedans occupied for emergency refinery dispatch');

  // Trip Completion Form State
  const [endOdometer, setEndOdometer] = useState<number>(42430);
  const [tripRating, setTripRating] = useState<number>(5);
  const [tripFeedback, setTripFeedback] = useState<string>('Punctual, courteous driver and smooth highway transit.');

  // Fuel Modal State
  const [fuelLiters, setFuelLiters] = useState('65');
  const [fuelStation, setFuelStation] = useState('Bashundhara Filling Station, 300 Feet Road');

  // New Requisition Form State
  const [fromLoc, setFromLoc] = useState('Bashundhara Corporate HQ, Baridhara');
  const [toLoc, setToLoc] = useState('Keraniganj Bitumen Refinery Complex');
  const [tripType, setTripType] = useState<'round_trip' | 'one_way'>('round_trip');
  const [departureTime, setDepartureTime] = useState('Today, 02:30 PM');
  const [returnTime, setReturnTime] = useState('Today, 06:30 PM');
  const [requiredCapacity, setRequiredCapacity] = useState<'sedan_4' | 'microbus_7' | 'pickup_4x4' | 'tanker_heavy'>('sedan_4');
  const [passengersCount, setPassengersCount] = useState(2);
  const [passengerNames, setPassengerNames] = useState(user?.name ?? '');
  const [purpose, setPurpose] = useState('Official refinery site inspection and delivery of asphalt laboratory batch dossiers');
  const [costCenter, setCostCenter] = useState('CC-SALES-DHAKA-102');

  // Assignment Modal State
  const [assignCarPlate, setAssignCarPlate] = useState(vehicles.find(v => v.status === 'available')?.plate || vehicles[0].plate);
  const [assignDriverId, setAssignDriverId] = useState(drivers.find(d => d.status === 'available')?.id || drivers[0].id);

  // Filtered requisitions list
  const visibleRequisitions = useMemo(
    () => (user ? requisitionsVisibleTo(user, mode, requisitions) : []),
    [user, mode, requisitions],
  );

  const filteredRequisitions = useMemo(() => {
    return visibleRequisitions.filter(r => {
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          r.id.toLowerCase().includes(q) ||
          r.requesterName.toLowerCase().includes(q) ||
          r.dept.toLowerCase().includes(q) ||
          r.from.toLowerCase().includes(q) ||
          r.to.toLowerCase().includes(q) ||
          (r.assignedVehiclePlate && r.assignedVehiclePlate.toLowerCase().includes(q)) ||
          (r.assignedDriverName && r.assignedDriverName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [visibleRequisitions, statusFilter, searchQuery]);

  const poolSuggestion = useMemo(
    () => (isTransportAdmin ? findPoolingSuggestion(requisitions, vehicles, drivers) : null),
    [isTransportAdmin, requisitions, vehicles, drivers],
  );

  // Submit Requisition Handler
  const handleCreateRequisition = () => {
    if (!purpose.trim()) {
      showToast(t('Please specify the official business purpose.', 'অনুগ্রহ করে দাপ্তরিক কাজের উদ্দেশ্য লিখুন।', lang), 'info');
      return;
    }
    const cleanStops = intermediateStops.filter(s => s.trim().length > 0);
    if (!user) return;
    const created = addRequisition({
      requesterName: user.name,
      requesterEmpId: user.empId,
      requesterRole: user.label,
      dept: user.dept,
      phone: user.phone,
      from: fromLoc,
      to: toLoc,
      tripType,
      departureTime,
      returnTime: tripType === 'round_trip' ? returnTime : undefined,
      requiredCapacity,
      passengersCount,
      passengerNames,
      purpose,
      costCenter,
      intermediateStops: cleanStops.length > 0
        ? cleanStops.map((loc, idx) => ({
            id: `STP-${Date.now()}-${idx + 1}`,
            location: loc,
            waitDurationMins: 15
          }))
        : undefined,
      estimatedCost: 1500 + cleanStops.length * 350,
    });
    setIntermediateStops([]);
    setNewStopInput('');
    setShowNewRequisitionModal(false);
    approvalStore.addRequisitionApproval(created.id, created.requesterName, created.dept, created.from, created.to, created.purpose);
    showToast(t(
      `Requisition ${created.id} submitted. The transport cell will allocate a vehicle and driver.`,
      `✓ যানবাহন রিকুইজিশন ${created.id} দাখিল সম্পন্ন! পরিবহন প্রশাসকের নিকট প্রেরিত হয়েছে।`,
      lang
    ), 'success');
  };

  // Confirm Assignment (Admin only)
  const handleConfirmAssignment = () => {
    if (!assigningReq) return;
    assignRequisition(assigningReq.id, assignCarPlate, assignDriverId);
    showToast(t(
      `✓ Vehicle ${assignCarPlate} & Driver allocated to Requisition ${assigningReq.id}! Digital Trip Challan Pass generated.`,
      `✓ গাড়ি ও চালক সফলভাবে বরাদ্দ করা হয়েছে! ডিজিটাল ট্রিপ পাস তৈরি সম্পন্ন।`,
      lang
    ), 'gold');
    setAssigningReq(null);
  };

  // Start Trip (Admin only)
  const handleStartTripAction = (req: VehicleRequisition) => {
    const startKm = req.odometerStart ?? 42350;
    const gateOut = nowTime();
    startTrip(req.id, startKm, gateOut);
    showToast(t(
      `Trip ${req.id} started at ${gateOut}. ${req.assignedVehiclePlate} gated out (odometer ${startKm.toLocaleString()} km).`,
      `ট্রিপ ${req.id} ${gateOut}-এ শুরু হয়েছে। ওডোমিটার: ${startKm.toLocaleString()} কিমি।`,
      lang
    ), 'info');
  };

  // Complete Trip Action (Admin only)
  const handleConfirmCompleteTrip = () => {
    if (!completingReq) return;
    completeTrip(completingReq.id, endOdometer, nowTime(), tripRating, tripFeedback);
    showToast(t(
      `✓ Trip ${completingReq.id} marked as COMPLETED! Inward security clearance logged & driver rating recorded.`,
      `✓ ট্রিপ ${completingReq.id} সমাপ্ত ও ইনওয়ার্ড গেট পাস নিবন্ধিত হয়েছে!`,
      lang
    ), 'success');
    setCompletingReq(null);
  };

  // Reject Requisition Action (Admin only)
  const handleConfirmReject = () => {
    if (!rejectingReq) return;
    rejectRequisition(rejectingReq.id, rejectReason);
    showToast(t(
      `Requisition ${rejectingReq.id} rejected. Audit reason logged.`,
      `রিকুইজিশন ${rejectingReq.id} বাতিল করা হয়েছে।`,
      lang
    ), 'warn');
    setRejectingReq(null);
  };

  // Confirm Smart Pool Merger (Admin only)
  const handleExecuteSmartPool = () => {
    if (!poolSuggestion) return;
    const { primary, secondary, vehicle, driver } = poolSuggestion;
    poolRequisitions(primary.id, secondary.id, vehicle.plate, driver.id);
    setShowSmartPoolModal(false);
    showToast(t(
      `${primary.id} and ${secondary.id} combined on ${vehicle.plate} with ${driver.name}. One shared trip pass issued.`,
      `${primary.id} ও ${secondary.id} একত্রে ${vehicle.plate} গাড়িতে (${driver.name}) বরাদ্দ করা হয়েছে।`,
      lang
    ), 'success');
  };

  const handleIssueFuelSlip = (v: Vehicle) => {
    setShowFuelModal(v);
  };

  const confirmFuelSlip = () => {
    if (!showFuelModal) return;
    const liters = Number(fuelLiters);
    if (!Number.isFinite(liters) || liters <= 0) {
      showToast(t('Enter the litres to issue.', 'লিটারের পরিমাণ লিখুন।', lang), 'info');
      return;
    }
    const slipNo = issueFuelVoucher(showFuelModal.plate, liters, fuelStation);
    showToast(t(
      `Fuel voucher ${slipNo} issued for ${showFuelModal.plate} (${liters} L at ${fuelStation}).`,
      `${showFuelModal.plate}-এর জন্য ফুয়েল ভাউচার ${slipNo} ইস্যু হয়েছে (${liters} লিটার)।`,
      lang
    ), 'success');
    setShowFuelModal(null);
  };

  // Counts
  const pendingCount = requisitions.filter(r => r.status === 'pending').length;
  const inTransitCount = requisitions.filter(r => r.status === 'in_transit').length;
  const completedCount = requisitions.filter(r => r.status === 'completed').length;
  const availableVehiclesCount = vehicles.filter(v => v.status === 'available').length;
  const maintenanceVehiclesCount = vehicles.filter(v => v.status === 'maintenance').length;
  const availableDriversCount = drivers.filter(d => d.status === 'available').length;
  const onTripDriversCount = drivers.filter(d => d.status === 'on_trip').length;
  const sickLeaveDriversCount = drivers.filter(d => d.status === 'sick_leave').length;
  const onLeaveDriversCount = drivers.filter(d => d.status === 'on_leave').length;

  const roleNotifications = notificationsVisibleTo(mode, notifications, visibleRequisitions);
  const unreadNotifCount = roleNotifications.filter(n => n.unread).length;

  return (
    <div
      className={`view-container view-transition-wrapper ${
        isChatTabActive ? 'fleet-chat-active' : ''
      }`}
    >
      {/* ─── View Header ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: isChatTabActive ? '8px' : '16px',
          marginBottom: isChatTabActive ? '4px' : '18px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: isChatTabActive ? '6px' : '10px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: isChatTabActive ? '6px' : '8px', fontSize: isChatTabActive ? '14px' : '18px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
              <Car size={isChatTabActive ? 16 : 22} color="var(--brand-crimson)" aria-hidden />
              {isDriver
                ? t('My Trips', 'আমার ট্রিপ', lang)
                : isEmployee
                ? t('My Vehicle Requests', 'আমার গাড়ির আবেদন', lang)
                : t('Fleet & Dispatch', 'ফ্লিট ও ডেসপ্যাচ', lang)}
            </h2>
            {!isEmployee && !isDriver && (
              <span style={{ padding: isChatTabActive ? '1px 8px' : '3px 10px', borderRadius: '20px', fontSize: isChatTabActive ? '10px' : '11px', fontWeight: 700, background: 'var(--status-success-bg)', color: 'var(--status-success)', border: '1px solid var(--status-success-border)' }}>
                {availableVehiclesCount} {t('Vehicles Ready', 'গাড়ি প্রস্তুত', lang)}
              </span>
            )}
          </div>
          {!isChatTabActive && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: 'var(--brand-slate-500)', lineHeight: 1.5 }}>
              {isDriver
                ? t(
                    'Today\'s trips, odometer readings and toll slips.',
                    'আজকের ট্রিপ, ওডোমিটার রিডিং ও টোল স্লিপ।',
                    lang
                  )
                : isEmployee
                ? t(
                    'Submit duty travel requests, track your assigned vehicle & driver, download digital trip challans, and rate trip completion.',
                    'দাপ্তরিক যাতায়াত রিকুইজিশন জমা দিন, ড্রাইভার ও গাড়ির অবস্থান ট্র্যাক করুন এবং ডিজিটাল ট্রিপ চালান ডাউনলোড করুন।',
                    lang
                  )
                : t(
                    'Vehicle requisitions, driver roster, gate passes and fuel vouchers.',
                    'যানবাহন আবেদন, চালক তালিকা, গেট পাস ও ফুয়েল ভাউচার।',
                    lang
                  )}
            </p>
          )}
        </div>

        {/* Action Controls - Strictly Guarded by RBAC */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isChatTabActive ? '6px' : '10px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
          {/* Fleet Notification Bell Button */}
          <button
            type="button"
            onClick={() => setShowNotificationsDrawer(prev => !prev)}
            title={t('Fleet Logistics Notifications', 'ফ্লিট নোটিফিকেশন', lang)}
            style={{
              height: isChatTabActive ? '28px' : '36px',
              padding: isChatTabActive ? '0 10px' : '0 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: isChatTabActive ? '7px' : '9px',
              border: unreadNotifCount > 0 ? '1.5px solid var(--brand-crimson)' : '1px solid var(--border-2)',
              backgroundColor: unreadNotifCount > 0 ? 'rgba(165, 28, 48, 0.06)' : 'var(--surface-1)',
              color: unreadNotifCount > 0 ? 'var(--brand-crimson)' : 'var(--text-2)',
              fontSize: isChatTabActive ? '11px' : '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Bell size={isChatTabActive ? 12 : 14} aria-hidden />
            <span>{t('Alerts', 'নোটিফিকেশন', lang)}</span>
            {unreadNotifCount > 0 && (
              <span style={{ backgroundColor: 'var(--brand-crimson)', color: 'var(--text-on-brand)', borderRadius: '999px', padding: '1px 5px', fontSize: '9.5px', fontWeight: 800 }}>
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Admin-Only Registration Buttons (Hidden in Chat mode to maximize workspace) */}
          {!isChatTabActive && isTransportAdmin && (
            <>
              <button
                type="button"
                onClick={() => setShowRegisterVehicleModal(true)}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9px',
                  border: '1.5px solid var(--border-2)',
                  backgroundColor: 'var(--surface-1)',
                  color: 'var(--text-1)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <Truck size={15} color="var(--status-warning)" aria-hidden />
                <span>{t('Register Vehicle', 'গাড়ি যুক্ত করুন', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEnrollDriverModal(true)}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9px',
                  border: '1.5px solid var(--border-2)',
                  backgroundColor: 'var(--surface-1)',
                  color: 'var(--text-1)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <UserCheck size={15} color="var(--status-success)" aria-hidden />
                <span>{t('Enroll Driver', 'চালক যুক্ত করুন', lang)}</span>
              </button>
            </>
          )}

          {user?.permissions.has('fleet:request') && (
            <button
              type="button"
              onClick={() => setShowNewRequisitionModal(true)}
              style={{
                height: isChatTabActive ? '28px' : '36px',
                padding: isChatTabActive ? '0 12px' : '0 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: isChatTabActive ? '5px' : '8px',
                borderRadius: isChatTabActive ? '7px' : '9px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--brand-crimson) 0%, var(--brand-crimson-dark) 100%)',
                color: 'var(--text-on-brand)',
                fontSize: isChatTabActive ? '11px' : '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(165, 28, 48, 0.25)',
              }}
            >
              <Plus size={isChatTabActive ? 13 : 15} aria-hidden />
              <span>{t('New Requisition', 'নতুন আবেদন', lang)}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Live Fleet & Crew Availability Pulse (For Staff Transparency) ── */}
      {!isChatTabActive && isEmployee && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '8px 14px',
          marginBottom: '14px',
          fontSize: '11.5px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: 'var(--brand-slate-900)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Activity size={14} color="var(--status-success)" />
              {t('Live Fleet & Crew Availability Pulse:', 'ফ্লিট ও চালক উপস্থিতি লাইভ স্ট্যাটাস:', lang)}
            </span>
            <span className="badge success" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-success-solid)' }} />
              {availableVehiclesCount} {t('Vehicles Ready', 'গাড়ি প্রস্তুত', lang)}
            </span>
            <span className="badge info" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Car size={12} />
              {availableDriversCount} {t('Drivers on Duty', 'চালক উপস্থিত', lang)}
            </span>
            {maintenanceVehiclesCount > 0 && (
              <span className="badge warn" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wrench size={12} />
                {maintenanceVehiclesCount} {t('in Workshop', 'গাড়ি ওয়ার্কশপে', lang)}
              </span>
            )}
            {sickLeaveDriversCount > 0 && (
              <span className="badge" style={{ fontSize: '10.5px', background: 'var(--status-pink-bg)', color: 'var(--status-pink)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={12} />
                {sickLeaveDriversCount} {t('Driver on Sick Leave', 'চালক অসুস্থতাজনিত ছুটিতে', lang)}
              </span>
            )}
            {onLeaveDriversCount > 0 && (
              <span className="badge" style={{ fontSize: '10.5px', background: 'var(--status-purple-bg)', color: 'var(--status-purple-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} />
                {onLeaveDriversCount} {t('on Annual Leave', 'বার্ষিক ছুটিতে', lang)}
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontWeight: 600 }}>
            {t('Transport Cell:', 'পরিবহন সেল:', lang)} <strong style={{ color: 'var(--brand-crimson)' }}>+880 1711-229944</strong>
          </div>
        </div>
      )}

      {/* ─── Informational Callout Strip ────────────────────────────── */}
      {!isChatTabActive && (isDriver ? (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1.5px solid var(--status-success)',
          padding: '9px 14px',
          borderRadius: '10px',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11.5px',
          color: 'var(--brand-slate-900)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={16} color="var(--status-success)" />
            <div>
              <strong>{user ? `${user.name} · ${user.empId}` : ''}</strong>{' — '}
              {t(
                'Your assigned trips, gate-out / gate-in odometer readings and toll slips.',
                'আপনার বরাদ্দকৃত ট্রিপ, গেট আউট / গেট ইন ওডোমিটার রিডিং ও টোল স্লিপ।',
                lang
              )}
            </div>
          </div>
          <span className="badge success" style={{ whiteSpace: 'nowrap' }}>
            {t('Duty Driver Terminal', 'ড্রাইভার টার্মিনাল', lang)}
          </span>
        </div>
      ) : isEmployee ? (
        <div style={{
          background: 'rgba(59, 130, 246, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          padding: '9px 14px',
          borderRadius: '10px',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11.5px',
          color: 'var(--brand-slate-700)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car size={16} color="var(--status-info)" />
            <div>
              <strong>{user ? `${user.name} · ${user.dept}` : ''}</strong>{' — '}
              {t(
                'Request an official vehicle; the transport cell allocates the car and driver and you can follow the trip here.',
                'দাপ্তরিক গাড়ির জন্য আবেদন করুন; পরিবহন সেল গাড়ি ও চালক বরাদ্দ করবে এবং আপনি এখানে ট্রিপ দেখতে পারবেন।',
                lang
              )}
            </div>
          </div>
          <span className="badge info" style={{ whiteSpace: 'nowrap' }}>
            {t('Staff Portal', 'স্টাফ সেলফ-সার্ভিস', lang)}
          </span>
        </div>
      ) : (
        <div style={{
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1.5px solid var(--brand-gold)',
          padding: '9px 14px',
          borderRadius: '10px',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11.5px',
          color: 'var(--brand-slate-900)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--status-warning-text)" />
            <div>
              <strong>{user ? `${user.name} · ${user.label}` : ''}</strong>{' — '}
              {isTransportAdmin
                ? t(
                    'Allocate vehicles and drivers, record gate passes and odometers, issue fuel vouchers.',
                    'গাড়ি ও চালক বরাদ্দ, গেট পাস ও ওডোমিটার নিবন্ধন এবং ফুয়েল ভাউচার ইস্যু।',
                    lang
                  )
                : t(
                    'Read-only view of all vehicle requisitions. Allocation is handled by the transport cell.',
                    'সকল যানবাহন আবেদনের শুধু-দেখার তালিকা। বরাদ্দ পরিবহন সেল করে।',
                    lang
                  )}
            </div>
          </div>
          <span className="badge gold" style={{ whiteSpace: 'nowrap' }}>
            {isTransportAdmin ? t('Dispatch', 'ডেসপ্যাচ', lang) : t('View only', 'শুধু দেখা', lang)}
          </span>
        </div>
      ))}

      {/* ─── Compact KPI Stat Bar (Staff & Admin) ───────────────────────── */}
      {!isChatTabActive && !isDriver && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {isEmployee ? (
            <>
              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-info)' }}>
                    <FileText size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('My Requisitions', 'আমার আবেদন', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-slate-900)', lineHeight: '1.2' }}>
                      {filteredRequisitions.length}
                    </div>
                  </div>
                </div>
                <span className="badge warn" style={{ fontSize: '10px' }}>
                  {filteredRequisitions.filter(r => r.status === 'pending').length} {t('Pending', 'অপেক্ষমাণ', lang)}
                </span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success)' }}>
                    <CheckCircle size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Active Duty Passes', 'সক্রিয় ডিজিটাল পাস', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--status-success)', lineHeight: '1.2' }}>
                      {filteredRequisitions.filter(r => r.status === 'assigned' || r.status === 'in_transit').length}
                    </div>
                  </div>
                </div>
                <span className="badge success" style={{ fontSize: '10px' }}>Cleared</span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-purple)' }}>
                    <MapPin size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Departure Hub', 'প্রারম্ভিক অফিস', lang)}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--status-info)', lineHeight: '1.2' }}>
                      Baridhara HQ
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-crimson)' }}>
                    <Phone size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Transport Hotline', 'পরিবহন হেল্পলাইন', lang)}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-crimson)', fontFamily: 'monospace', lineHeight: '1.2' }}>
                      +880 1711-229944
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-warning)' }}>
                    <FileText size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Requisitions', 'আবেদনসমূহ', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-slate-900)', lineHeight: '1.2' }}>
                      {requisitions.length}
                    </div>
                  </div>
                </div>
                <span className="badge warn" style={{ fontSize: '10px' }}>{pendingCount} {t('Pending', 'অপেক্ষমাণ', lang)}</span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-info)' }}>
                    <Truck size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Fleet Vehicles', 'মোট যানবাহন', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--status-info)', lineHeight: '1.2' }}>
                      {vehicles.length}
                    </div>
                  </div>
                </div>
                <span className="badge success" style={{ fontSize: '10px' }}>{availableVehiclesCount} {t('Ready', 'প্রস্তুত', lang)}</span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success)' }}>
                    <UserCheck size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Driver Roster', 'চালক রোস্টার', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--status-success)', lineHeight: '1.2' }}>
                      {drivers.length}
                    </div>
                  </div>
                </div>
                <span className="badge success" style={{ fontSize: '10px' }}>{t('Breath test passed', 'শ্বাস পরীক্ষা উত্তীর্ণ', lang)}</span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-purple)' }}>
                    <Navigation size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Highway Transit', 'চলমান ট্রিপ', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--status-purple)', lineHeight: '1.2' }}>
                      {inTransitCount}
                    </div>
                  </div>
                </div>
                <span className="badge info" style={{ fontSize: '10px' }}>{completedCount} Done</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Pooling suggestion (dispatch only) ─────────── */}
      {!isChatTabActive && isTransportAdmin && poolSuggestion && (
        <div className="pool-suggestion mb-3" style={{
          background: 'linear-gradient(135deg, rgba(29, 78, 216, 0.08) 0%, rgba(212, 175, 55, 0.08) 100%)',
          border: '1.5px solid var(--status-info)',
          borderRadius: '12px',
          padding: '12px 16px'
        }}>
          <div className="pool-icon">
            <Users size={24} color="var(--status-info-text)" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="pool-text">
              <h4 style={{ margin: '0 0 2px 0', fontSize: '13.5px', fontWeight: 800, color: 'var(--status-info-text)' }}>
                {t('Pooling suggestion', 'একসাথে যাত্রার পরামর্শ', lang)}
              </h4>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--brand-slate-700)', lineHeight: '1.4' }}>
                {t(
                  `${poolSuggestion.primary.id} (${poolSuggestion.primary.departureTime}) and ${poolSuggestion.secondary.id} (${poolSuggestion.secondary.departureTime}) both go ${poolSuggestion.primary.from} → ${poolSuggestion.primary.to}. ${poolSuggestion.passengers} passengers fit in ${poolSuggestion.vehicle.plate}; combining them frees one vehicle.`,
                  `${poolSuggestion.primary.id} ও ${poolSuggestion.secondary.id} একই রুটে (${poolSuggestion.primary.to}) যাচ্ছে। ${poolSuggestion.passengers} জন যাত্রী ${poolSuggestion.vehicle.plate}-এ যেতে পারেন; একত্রে পাঠালে একটি গাড়ি খালি থাকবে।`,
                  lang
                )}
              </p>
            </div>
          </div>

          <button
            className="btn-gold"
            onClick={() => setShowSmartPoolModal(true)}
            style={{ fontSize: '11.5px', padding: '6px 14px', whiteSpace: 'nowrap' }}
          >
            <Users size={14} />
            {t('Review', 'পর্যালোচনা', lang)}
          </button>
        </div>
      )}

      {/* ─── Administrative Tabs Navigation (HIDDEN FOR EMPLOYEES) ──── */}
      {(isTransportAdmin || isOversight) && (
        <FleetTabs
          compact={isChatTabActive}
          ariaLabel={t('Fleet sections', 'ফ্লিট বিভাগ', lang)}
          active={activeAdminTab}
          onChange={(id) => setActiveAdminTab(id as typeof activeAdminTab)}
          tabs={[
            { id: 'requisitions', label: t('Requisitions', 'আবেদনসমূহ', lang), icon: Car, tone: 'crimson', badge: pendingCount, badgeTone: 'danger' },
            ...(isTransportAdmin
              ? [
                  { id: 'drivers', label: t('Drivers', 'চালক', lang), icon: Users, tone: 'gold' as const, badge: drivers.length, badgeTone: 'gold' as const },
                  { id: 'telematics', label: t('Vehicle locations', 'গাড়ির অবস্থান', lang), icon: Navigation, tone: 'blue' as const },
                  { id: 'fuel', label: t('Fuel vouchers', 'ফুয়েল ভাউচার', lang), icon: Fuel, tone: 'emerald' as const },
                  { id: 'gate_manifest', label: t('Gate log', 'গেট লগ', lang), icon: FileText, tone: 'violet' as const },
                  ...(ENABLE_FLEET_CHAT_DESK
                    ? [{ id: 'chat_center' as const, label: t('Messages', 'বার্তা', lang), icon: MessageSquare, tone: 'indigo' as const }]
                    : []),
                ]
              : []),
          ]}
        />
      )}

      {/* ─── Employee Navigation Tabs ─── */}
      {isEmployee && ENABLE_FLEET_CHAT_DESK && (
        <FleetTabs
          compact={isChatTabActive}
          ariaLabel={t('Travel desk sections', 'ট্রাভেল ডেস্ক বিভাগ', lang)}
          active={employeeTab}
          onChange={(id) => setEmployeeTab(id as typeof employeeTab)}
          tabs={[
            { id: 'requisitions', label: t('My requests', 'আমার আবেদন', lang), icon: Car, tone: 'crimson', badge: filteredRequisitions.length, badgeTone: 'danger' },
            { id: 'chat_center', label: t('Messages', 'বার্তা', lang), icon: MessageSquare, tone: 'indigo' },
          ]}
        />
      )}

      {/* ─── Driver Navigation Tabs ─── */}
      {isDriver && ENABLE_FLEET_CHAT_DESK && (
        <FleetTabs
          compact={isChatTabActive}
          ariaLabel={t('Driver terminal sections', 'ড্রাইভার টার্মিনাল বিভাগ', lang)}
          active={driverTab}
          onChange={(id) => setDriverTab(id as typeof driverTab)}
          tabs={[
            { id: 'console', label: t('My trips', 'আমার ট্রিপ', lang), icon: Gauge, tone: 'crimson' },
            { id: 'chat_center', label: t('Messages', 'বার্তা', lang), icon: MessageSquare, tone: 'indigo' },
          ]}
        />
      )}

      {/* ─── Driver Terminal Mode Views ─── */}
      {isDriver && driverTab === 'console' && (
        <DriverConsole
          lang={lang}
          onOpenChat={(req) => {
            if (!ENABLE_FLEET_CHAT_DESK) return;
            setSelectedChatChannelId(req.id);
            setDriverTab('chat_center');
          }}
        />
      )}

      {ENABLE_FLEET_CHAT_DESK && isDriver && driverTab === 'chat_center' && (
        <div className="fleet-chat-desk-container">
          <FleetChatCenter
            party={party}
            senderName={user?.name ?? ''}
            visibleRequisitions={visibleRequisitions}
            lang={lang}
            initialChannelId={selectedChatChannelId}
            onNavigateToTripPass={(req) => setSelectedTripPassReq(req)}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: REQUISITIONS DISPATCH QUEUE & TRAVEL DESK
          ══════════════════════════════════════════════════════════════ */}
      {!isDriver && ((isEmployee && employeeTab === 'requisitions') || (!isEmployee && activeAdminTab === 'requisitions')) && (
        <div className="card mb-4">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Car size={18} /></div>
              <div>
                <div className="card-title">
                  {isEmployee
                    ? t('My Official Duty Travel Requisitions', 'আমার দাপ্তরিক যাতায়াত আবেদনসমূহ', lang)
                    : t('Incoming Duty Requisitions Awaiting Vehicle & Driver Allocation', 'অপেক্ষমান যানবাহন আবেদনসমূহ', lang)}
                </div>
                <div className="card-subtitle">
                  {filteredRequisitions.length} {t('Requisitions Tracked', 'টি আবেদন নথিভুক্ত', lang)}
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '5px' }}>
              {(['all', 'pending', 'assigned', 'in_transit', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: statusFilter === f ? '1px solid var(--brand-crimson)' : '1px solid var(--brand-slate-200)',
                    background: statusFilter === f ? 'var(--brand-crimson)' : 'transparent',
                    color: statusFilter === f ? 'var(--text-on-brand)' : 'var(--brand-slate-600)'
                  }}
                >
                  {f === 'all' ? t('All', 'সব', lang) : fleetStatusLabel(f, lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar inside Requisitions Card */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--brand-slate-100)', display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--brand-slate-400)' }} />
              <input
                type="text"
                className="input-text"
                style={{ width: '100%', paddingLeft: '30px', height: '30px', fontSize: '11.5px' }}
                placeholder={isEmployee
                  ? t('Search my requisitions by ID, route, destination...', 'আইডি, রুট বা গন্তব্য দিয়ে খুঁজুন...', lang)
                  : t('Search by Req ID, requester, department, route, vehicle...', 'আইডি, আবেদনকারী, বিভাগ, রুট দিয়ে খুঁজুন...', lang)}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-slate-400)' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="card-body" style={{ padding: '0' }}>
            <div className="table-responsive">
              <table className="fleet-table" style={{ margin: 0, fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>{t('REQ ID', 'আইডি', lang)}</th>
                    <th>{t('Requester & Department', 'আবেদনকারী ও বিভাগ', lang)}</th>
                    <th>{t('Route & Trip Mode', 'রুট ও যাতায়াতের ধরন', lang)}</th>
                    <th>{t('Departure / Return', 'সময়সূচী', lang)}</th>
                    <th>{t('Required Vehicle', 'প্রয়োজনীয় যান', lang)}</th>
                    <th>{t('Assigned Vehicle & Driver', 'বরাদ্দকৃত গাড়ি ও চালক', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('Status & Actions', 'অবস্থা ও কার্যক্রম', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--brand-slate-500)' }}>
                        <CheckCircle2 size={28} color="var(--status-success)" style={{ margin: '0 auto 6px' }} />
                        <div>{t('No vehicle requisitions matching current filter.', 'কোনো আবেদন পাওয়া যায়নি।', lang)}</div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequisitions.map((r) => {
                      const isPending = r.status === 'pending';
                      const isAssigned = r.status === 'assigned';
                      const isInTransit = r.status === 'in_transit';
                      const isCompleted = r.status === 'completed';
                      const isRejected = r.status === 'rejected';

                      return (
                        <tr key={r.id}>
                          <td>
                            <div>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                                {r.id}
                              </span>
                              {r.pooledWith && (
                                <div style={{ fontSize: '9px', color: 'var(--status-info-text)', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Layers size={10} /> POOLED ({r.pooledWith})
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>{r.requesterName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>
                              {r.dept} • {r.phone}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600 }}>
                              <span>{r.from.split(',')[0]}</span>
                              <ArrowRight size={12} color="var(--brand-crimson)" />
                              <span>{r.to.split(',')[0]}</span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: r.tripType === 'round_trip' ? 'var(--status-info-text)' : 'var(--text-3)', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {r.tripType === 'round_trip' ? (
                                <>
                                  <RotateCcw size={11} /> Round Trip (Return)
                                </>
                              ) : (
                                <>
                                  <ArrowRight size={11} /> One-Way Transit
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '11.5px', fontWeight: 600 }}>{r.departureTime}</div>
                            {r.returnTime && (
                              <div style={{ fontSize: '10.5px', color: 'var(--status-info-text)' }}>Return: {r.returnTime}</div>
                            )}
                            <span className="badge info" style={{ marginTop: '2px', fontSize: '9px' }}>
                              {r.passengersCount} {r.passengersCount === 1 ? 'Passenger' : 'Passengers'}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-1)', fontWeight: 700, fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {r.requiredCapacity === 'sedan_4' && <><Car size={12} /> Sedan (4-Seater)</>}
                              {r.requiredCapacity === 'microbus_7' && <><Truck size={12} /> Microbus (7-Seater)</>}
                              {r.requiredCapacity === 'pickup_4x4' && <><Shield size={12} /> 4x4 Emergency Patrol</>}
                              {r.requiredCapacity === 'tanker_heavy' && <><Truck size={12} /> Heavy Bulk Tanker</>}
                            </span>
                          </td>
                          <td>
                            {isPending ? (
                              <span style={{ color: 'var(--status-warning)', fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> Awaiting Allocation
                              </span>
                            ) : isRejected ? (
                              <span style={{ color: 'var(--status-danger)', fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={12} /> Rejected ({r.rejectionReason || 'No Vehicle'})
                              </span>
                            ) : (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '11.5px', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} /> {r.assignedVehiclePlate}
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-600)' }}>
                                  Driver: <strong>{r.assignedDriverName}</strong>
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--status-info-text)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                                  <Phone size={11} /> {r.assignedDriverPhone}
                                </div>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {/* ─── Case 1: Requisition Pending ─── */}
                              {isPending && (
                                isTransportAdmin ? (
                                  <>
                                    <button
                                      className="btn-primary"
                                      style={{ fontSize: '10.5px', padding: '4px 9px' }}
                                      onClick={() => {
                                        setAssigningReq(r);
                                        setAssignCarPlate(vehicles.find(v => v.status === 'available')?.plate || vehicles[0].plate);
                                        setAssignDriverId(drivers.find(d => d.status === 'available')?.id || drivers[0].id);
                                      }}
                                    >
                                      Assign Car & Driver
                                    </button>
                                    <button
                                      className="btn-outline"
                                      style={{ fontSize: '10.5px', padding: '4px 7px', color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
                                      onClick={() => setRejectingReq(r)}
                                      title="Reject Requisition"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <span className="badge warn" style={{ fontSize: '10px' }}>Pending Assignment</span>
                                )
                              )}

                              {/* ─── Case 2: Requisition Assigned ─── */}
                              {isAssigned && (
                                <>
                                  <button
                                    className="btn-sm-ghost"
                                    style={{ fontSize: '10.5px', padding: '4px 8px', color: 'var(--status-success)', borderColor: 'var(--status-success-border)', background: 'var(--status-success-bg)' }}
                                    onClick={() => setSelectedTripPassReq(r)}
                                  >
                                    <QrCode size={12} /> {t('Trip Pass', 'ট্রিপ পাস', lang)}
                                  </button>

                                  {isTransportAdmin && (
                                    <button
                                      className="btn-gold"
                                      style={{ fontSize: '10.5px', padding: '4px 8px' }}
                                      onClick={() => handleStartTripAction(r)}
                                    >
                                      <ArrowRight size={11} /> {t('Gate Out', 'যাত্রা শুরু', lang)}
                                    </button>
                                  )}
                                </>
                              )}

                              {/* ─── Case 3: Requisition In Transit ─── */}
                              {isInTransit && (
                                <>
                                  <button
                                    className="btn-outline"
                                    style={{ fontSize: '10.5px', padding: '4px 8px', borderColor: 'var(--status-info)', color: 'var(--status-info)' }}
                                    onClick={() => setTrackingReq(r)}
                                  >
                                    <Navigation size={12} /> {t('Track Live', 'ট্র্যাক', lang)}
                                  </button>

                                  {isTransportAdmin && (
                                    <button
                                      className="btn-primary"
                                      style={{ fontSize: '10.5px', padding: '4px 8px', background: 'var(--status-success-solid)', borderColor: 'var(--status-success)' }}
                                      onClick={() => {
                                        setCompletingReq(r);
                                        setEndOdometer(42430);
                                      }}
                                    >
                                      <CheckCircle size={12} /> {t('Complete Trip', 'সমাপ্ত', lang)}
                                    </button>
                                  )}
                                </>
                              )}

                              {/* ─── Case 4: Requisition Completed ─── */}
                              {isCompleted && (
                                <button
                                  className="btn-outline"
                                  style={{ fontSize: '10px', padding: '3px 8px' }}
                                  onClick={() => setSelectedTripPassReq(r)}
                                >
                                  ★ {r.rating || 5}.0 · {t('View Pass', 'পাস দেখুন', lang)}
                                </button>
                              )}

                              {/* ─── Dedicated Tri-Party Mission Coordination Chat (Driver ↔ Employee ↔ Admin) ─── */}
                              {ENABLE_FLEET_CHAT_DESK && (
                                <button
                                  className="btn-outline"
                                  style={{
                                    fontSize: '11px',
                                    padding: '4px 9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    color: 'var(--status-info-text)',
                                    borderColor: 'var(--status-info-bright)',
                                    background: 'rgba(29, 78, 216, 0.06)',
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                  }}
                                  onClick={() => {
                                    setActiveChatReq(r);
                                    setSelectedChatChannelId(r.id);
                                  }}
                                  title={t('Open Tri-Party Mission Chat (Driver ↔ Staff ↔ Admin)', 'চালক, কর্মকর্তা ও ডেসপ্যাচ ত্রি-পক্ষীয় চ্যাট খুলুন', lang)}
                                >
                                  <MessageSquare size={12} color="var(--status-info)" />
                                  <span>{t('Tri-Party Chat', 'ত্রি-পক্ষীয় চ্যাট', lang)}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: DRIVER POOL & SOBRIETY AUDIT (Admin only)
          ══════════════════════════════════════════════════════════════ */}
      {isTransportAdmin && activeAdminTab === 'drivers' && (
        <div className="card mb-4">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Users size={18} /></div>
              <div>
                <div className="card-title">{t('BOGCL Certified Driver Directory & Sobriety Audit', 'বসুন্ধরা সার্টিফাইড চালক তালিকা ও ফিটনেস অডিট', lang)}</div>
                <div className="card-subtitle">{t('BRTA Commercial Licensing, Breathalyzer Logs & Shift Hours', 'বিআরটিএ লাইসেন্স যাচাই, ব্রেথলাইজার টেস্ট ও দৈনিক ড্রাইভিং আওয়ার', lang)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span className="badge success">{availableDriversCount} Available</span>
              {sickLeaveDriversCount > 0 && (
                <span className="badge" style={{ background: 'var(--status-pink-bg)', color: 'var(--status-pink)' }}>
                  💊 {sickLeaveDriversCount} Sick Leave
                </span>
              )}
              {onLeaveDriversCount > 0 && (
                <span className="badge" style={{ background: 'var(--status-purple-bg)', color: 'var(--status-purple-text)' }}>
                  {onLeaveDriversCount} on leave
                </span>
              )}
            </div>
          </div>

          <div className="card-body">
            {/* Driver Status Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {(['all', 'available', 'on_trip', 'sick_leave', 'on_leave', 'rest_required'] as const).map(f => {
                const count = f === 'all' ? drivers.length : drivers.filter(d => d.status === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setDriverStatusFilter(f)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: driverStatusFilter === f ? '1.5px solid var(--brand-crimson)' : '1px solid var(--brand-slate-200)',
                      background: driverStatusFilter === f ? 'var(--brand-crimson)' : 'var(--brand-card-bg)',
                      color: driverStatusFilter === f ? 'var(--text-on-brand)' : 'var(--brand-slate-600)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{f === 'all' ? t('All', 'সব', lang) : fleetStatusLabel(f, lang)}</span>
                    <span style={{
                      fontSize: '9.5px',
                      background: driverStatusFilter === f ? 'rgba(255,255,255,0.25)' : 'var(--brand-slate-100)',
                      padding: '1px 5px',
                      borderRadius: '10px'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="responsive-col-3" style={{ gap: '12px' }}>
              {drivers
                .filter(d => driverStatusFilter === 'all' || d.status === driverStatusFilter)
                .map(d => {
                  const isAvailable = d.status === 'available';
                  const isOnTrip = d.status === 'on_trip';
                  const isSick = d.status === 'sick_leave';
                  const isOnLeave = d.status === 'on_leave';
                  const isRest = d.status === 'rest_required';

                  return (
                    <div key={d.id} style={{
                      border: isSick ? '1.5px solid var(--brand-crimson-light)' : isOnLeave ? '1.5px solid var(--status-purple)' : '1px solid var(--brand-slate-200)',
                      borderRadius: '8px',
                      padding: '14px',
                      background: isSick ? 'var(--brand-crimson-soft)' : isOnLeave ? 'var(--status-purple-bg)' : 'var(--brand-card-bg)',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-slate-900)', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                            {d.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--brand-slate-900)' }}>{d.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', fontFamily: 'monospace' }}>📞 {d.phone}</div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isAvailable && <span className="badge success">AVAILABLE</span>}
                        {isOnTrip && <span className="badge info">ON TRIP</span>}
                        {isSick && (
                          <span className="badge" style={{ background: 'var(--status-pink-bg)', color: 'var(--status-pink)', fontWeight: 800 }}>
                            💊 SICK LEAVE
                          </span>
                        )}
                        {isOnLeave && (
                          <span className="badge" style={{ background: 'var(--status-purple-bg)', color: 'var(--status-purple-text)', fontWeight: 800 }}>
                            On leave
                          </span>
                        )}
                        {isRest && <span className="badge warn">REST REQUIRED</span>}
                      </div>

                      {/* Leave Notice Banner */}
                      {(isSick || isOnLeave) && d.leaveReason && (
                        <div style={{
                          background: isSick ? 'var(--status-danger-bg)' : 'var(--status-purple-bg)',
                          border: `1px solid ${isSick ? 'var(--status-danger-border)' : 'var(--status-purple-border)'}`,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: isSick ? 'var(--status-danger-text)' : 'var(--status-purple-text)',
                          marginBottom: '8px'
                        }}>
                          <strong>{isSick ? 'Medical Certificate Rx:' : 'HR Approved Leave:'}</strong> {d.leaveReason}
                          {d.leaveUntil && (
                            <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.85 }}>
                              Expected Return: <strong>{d.leaveUntil}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ background: 'var(--brand-slate-100)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', marginBottom: '10px' }}>
                        <div><strong>License:</strong> {d.licenseNo} ({d.licenseType})</div>
                        <div><strong>Valid Until:</strong> {d.licenseExpiry}</div>
                        <div style={{ marginTop: '4px', color: isSick ? 'var(--status-danger-text)' : 'var(--status-success)', fontWeight: 700 }}>
                          {isSick ? '⚠ Sobriety Audit Suspended (Medical Rest)' : `✓ Breathalyzer: ${d.breathalyzerToday}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--brand-slate-500)' }}>
                        <span>Duty Today: <strong>{d.dutyHoursToday} hrs</strong></span>
                        <span>Blood: <strong>{d.bloodGroup}</strong></span>
                        <span>Rating: <strong>★ {d.rating}</strong></span>
                      </div>

                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--brand-slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Admin Status Changer */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontWeight: 600 }}>Status:</span>
                          <select
                            style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-2)', background: 'var(--surface-1)' }}
                            value={d.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as Driver['status'];
                              updateDriverStatus(
                                d.id,
                                newStatus,
                                newStatus === 'sick_leave' ? 'Doctor prescribed medical rest (Viral fever)' : newStatus === 'on_leave' ? 'HR Approved Annual Earned Leave' : undefined,
                                newStatus === 'sick_leave' ? 'Tomorrow, 08:00 AM' : undefined
                              );
                              showToast(`Driver ${d.name} status updated to ${newStatus.toUpperCase()}`, 'info');
                            }}
                          >
                            <option value="available">Available (Active)</option>
                            <option value="on_trip">On Trip</option>
                            <option value="sick_leave">Sick Leave (Medical)</option>
                            <option value="on_leave">On Annual Leave</option>
                            <option value="rest_required">Rest Required</option>
                          </select>
                        </div>

                        {!isSick && (
                          <button
                            className="btn-sm-ghost"
                            style={{ fontSize: '10.5px' }}
                            onClick={() => {
                              recordBreathalyzer(d.id, '0.00% BAC (PASSED)');
                              showToast(`Breathalyzer test verified for ${d.name}: 0.00% Zero-Alcohol.`, 'success');
                            }}
                          >
                            ✓ Breathalyzer
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: HEAVY TANKERS & TELEMATICS HUD (Admin only)
          ══════════════════════════════════════════════════════════════ */}
      {isTransportAdmin && activeAdminTab === 'telematics' && (
        <>
          {selectedVehicleTelemetry && (
            <div className="card mb-4" style={{ background: 'linear-gradient(135deg, var(--surface-inverse) 0%, var(--surface-inverse-2) 100%)', color: 'var(--text-on-brand)', border: '1px solid var(--border-inverse-2)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Navigation size={18} color="var(--status-warning-bright)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-inverse)' }}>
                      {selectedVehicleTelemetry.plate} — {selectedVehicleTelemetry.model}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Assigned Driver: <strong>{selectedVehicleTelemetry.driverName}</strong> • 📞 {selectedVehicleTelemetry.driverPhone}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('Last reported speed', 'সর্বশেষ গতি', lang)}: <strong style={{ color: 'var(--text-inverse)' }}>{selectedVehicleTelemetry.speed} km/h</strong></span>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('Last known location', 'সর্বশেষ অবস্থান', lang)}</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: 'var(--status-warning-bright)' }}>
                    {selectedVehicleTelemetry.location}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Engine & Cargo Temperature</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                    Engine: <strong style={{ color: 'var(--status-success-bright)' }}>{selectedVehicleTelemetry.engineTemp}°C</strong>
                    {selectedVehicleTelemetry.bitumenCargoTemp && (
                      <span> • Cargo: <strong style={{ color: 'var(--status-danger-bright)' }}>{selectedVehicleTelemetry.bitumenCargoTemp}°C</strong></span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fuel Tank Capacity</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: 'var(--status-info-bright)' }}>
                    {selectedVehicleTelemetry.fuelPct}% Full Tank
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Next Maintenance Service</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                    In {selectedVehicleTelemetry.nextServiceKm} km
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Vehicles List */}
          <div className="card mb-4">
            <div className="card-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-hd-left">
                <div className="card-hd-icon"><Truck size={18} /></div>
                <div>
                  <div className="card-title">{t('Vehicles', 'গাড়িসমূহ', lang)}</div>
                  <div className="card-subtitle">{t('Status, location and service due', 'অবস্থা, অবস্থান ও সার্ভিসের সময়', lang)}</div>
                </div>
              </div>

              {/* Vehicle Status Filter Pills */}
              <div style={{ display: 'flex', gap: '5px' }}>
                {(['all', 'available', 'in_transit', 'maintenance'] as const).map(f => {
                  const count = f === 'all' ? vehicles.length : vehicles.filter(v => v.status === f).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setVehicleStatusFilter(f)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: vehicleStatusFilter === f ? '1px solid var(--brand-crimson)' : '1px solid var(--brand-slate-200)',
                        background: vehicleStatusFilter === f ? 'var(--brand-crimson)' : 'transparent',
                        color: vehicleStatusFilter === f ? 'var(--text-on-brand)' : 'var(--brand-slate-600)',
                      }}
                    >
                      {f === 'all' ? t('All', 'সব', lang) : fleetStatusLabel(f, lang)} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="fleet-table" style={{ margin: 0, fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Plate</th>
                      <th>Model & Type</th>
                      <th>Location / Workshop Status</th>
                      <th>Driver</th>
                      <th>Speed</th>
                      <th>Fuel</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles
                      .filter(v => vehicleStatusFilter === 'all' || v.status === vehicleStatusFilter)
                      .map(v => (
                        <tr key={v.id} onClick={() => setSelectedVehicleTelemetry(v)} style={{ cursor: 'pointer' }}>
                          <td>
                            <strong>{v.plate}</strong>
                            <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)', textTransform: 'uppercase' }}>
                              {v.type}
                            </div>
                          </td>
                          <td>{v.model}</td>
                          <td>
                            <div>{v.location}</div>
                            {v.maintenanceDetails && (
                              <div style={{ fontSize: '10.5px', color: 'var(--status-warning)', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Wrench size={11} /> {v.maintenanceDetails}
                              </div>
                            )}
                          </td>
                          <td>{v.driverName || 'Unassigned'}</td>
                          <td>{v.speed} km/h</td>
                          <td>{v.fuelPct}%</td>
                          <td>
                            {v.status === 'available' && <span className="badge success">AVAILABLE</span>}
                            {v.status === 'in_transit' && <span className="badge info">IN TRANSIT</span>}
                            {v.status === 'maintenance' && (
                              <span className="badge warn" style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)', fontWeight: 800 }}>
                                🔧 WORKSHOP
                              </span>
                            )}
                            {v.status === 'loading' && <span className="badge">LOADING</span>}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                              <button
                                className="btn-sm-ghost"
                                style={{ fontSize: '10.5px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVehicleTelemetry(v);
                                }}
                              >
                                HUD View
                              </button>

                              {v.status === 'maintenance' ? (
                                <button
                                  className="btn-sm-ghost"
                                  style={{ fontSize: '10.5px', color: 'var(--status-success)', borderColor: 'var(--status-success-border)', background: 'var(--status-success-bg)' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateVehicleStatus(v.plate, 'available');
                                    showToast(t(`${v.plate} is back in service.`, `${v.plate} আবার সেবায় ফিরেছে।`, lang), 'success');
                                  }}
                                  title={t('Mark maintenance complete and return to service', 'রক্ষণাবেক্ষণ সম্পন্ন — সেবায় ফেরান', lang)}
                                >
                                  ✓ {t('Mark ready', 'প্রস্তুত করুন', lang)}
                                </button>
                              ) : v.status === 'available' ? (
                                <button
                                  className="btn-sm-ghost"
                                  style={{ fontSize: '10.5px', color: 'var(--status-warning)', borderColor: 'var(--status-warning-bright)' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateVehicleStatus(v.plate, 'maintenance', 'Scheduled workshop maintenance & fluid inspection');
                                    showToast(t(`${v.plate} sent to the workshop.`, `${v.plate} ওয়ার্কশপে পাঠানো হয়েছে।`, lang), 'info');
                                  }}
                                  title={t('Send vehicle to workshop maintenance', 'গাড়ি ওয়ার্কশপে পাঠান', lang)}
                                >
                                  🔧 {t('Workshop', 'ওয়ার্কশপ', lang)}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: FUEL STATION & QR VOUCHERS (Admin only)
          ══════════════════════════════════════════════════════════════ */}
      {isTransportAdmin && activeAdminTab === 'fuel' && (
        <div className="card mb-4">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Fuel size={18} /></div>
              <div>
                <div className="card-title">Fleet Fuel Dispensing & Anti-Pilferage Monitoring</div>
                <div className="card-subtitle">Digital QR Fuel Slips & Dispenser OTP Verification</div>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="responsive-col-3" style={{ gap: '12px' }}>
              {vehicles.map(v => (
                <div key={v.id} style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '14px', background: 'var(--brand-card-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong>{v.plate}</strong>
                    <span className="badge info">{v.fuelPct}% Full</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-600)', marginBottom: '8px' }}>
                    {v.model} • Driver: {v.driverName || 'Depot'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginBottom: '10px' }}>
                    Active Fuel Slip: <code>{v.fuelSlipNo}</code>
                  </div>
                  <button
                    className="btn-gold"
                    style={{ width: '100%', fontSize: '11px', justifyContent: 'center' }}
                    onClick={() => handleIssueFuelSlip(v)}
                  >
                    <QrCode size={13} /> Issue QR Fuel Voucher
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 5: SECURITY GATE CLEARANCE ROSTER & ODOMETERS (Admin only)
          ══════════════════════════════════════════════════════════════ */}
      {isTransportAdmin && activeAdminTab === 'gate_manifest' && (
        <div className="card mb-4">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><FileText size={18} /></div>
              <div>
                <div className="card-title">{t('Plant Security Gate-1 Inward/Outward Log', 'প্ল্যান্ট গেট-১ যাতায়াত রেজিস্টার', lang)}</div>
                <div className="card-subtitle">{t('Odometer audit, security gate clearance passes & mileage reconciliation', 'ওডোমিটার অডিট ও ট্রিপ লগ', lang)}</div>
              </div>
            </div>
            <button
              className="btn-outline"
              style={{ fontSize: '11px', padding: '4px 9px' }}
              onClick={() => {
                window.print();
                showToast(t('Gate security roster dispatched to printer.', 'প্রিন্ট পাঠানো হয়েছে।', lang), 'info');
              }}
            >
              <Printer size={13} /> {t('Print Gate Register', 'প্রিন্ট', lang)}
            </button>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="fleet-table" style={{ margin: 0, fontSize: '11.5px' }}>
                <thead>
                  <tr>
                    <th>Req ID</th>
                    <th>Vehicle Plate</th>
                    <th>Driver</th>
                    <th>Passenger Lead</th>
                    <th>Gate Out</th>
                    <th>Gate In</th>
                    <th>Start Odometer</th>
                    <th>End Odometer</th>
                    <th>Total Km</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.map(r => {
                    const totalKm = r.odometerEnd && r.odometerStart ? r.odometerEnd - r.odometerStart : null;
                    return (
                      <tr key={r.id}>
                        <td><strong>{r.id}</strong></td>
                        <td>{r.assignedVehiclePlate || 'Unassigned'}</td>
                        <td>{r.assignedDriverName || '—'}</td>
                        <td>{r.requesterName}</td>
                        <td>{r.gateOutTime || (r.status === 'completed' ? '—' : t('Pending', 'অপেক্ষমাণ', lang))}</td>
                        <td>{r.gateInTime || (r.status === 'completed' ? '—' : t('En route', 'পথে', lang))}</td>
                        <td>{r.odometerStart ? `${r.odometerStart.toLocaleString()} km` : '—'}</td>
                        <td>{r.odometerEnd ? `${r.odometerEnd.toLocaleString()} km` : '—'}</td>
                        <td><strong>{totalKm ? `${totalKm} km` : '—'}</strong></td>
                        <td>
                          <span className={`badge ${r.status === 'completed' ? 'success' : r.status === 'in_transit' ? 'info' : 'warn'}`}>
                            {fleetStatusLabel(r.status, lang)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 6: DEDICATED DISPATCH COMMUNICATIONS DESK (Staff & Admin)
          ══════════════════════════════════════════════════════════════ */}
      {ENABLE_FLEET_CHAT_DESK && ((isEmployee && employeeTab === 'chat_center') || (isTransportAdmin && activeAdminTab === 'chat_center')) && (
        <div className="fleet-chat-desk-container">
          <FleetChatCenter
            party={party}
            senderName={user?.name ?? ''}
            visibleRequisitions={visibleRequisitions}
            lang={lang}
            initialChannelId={selectedChatChannelId}
            onNavigateToTripPass={(req) => setSelectedTripPassReq(req)}
          />
        </div>
      )}

      {/* ─── MODAL 1: NEW VEHICLE REQUISITION (Enterprise Dropdown, No Vehicle Selector for Staff) ─── */}
      <NewRequisitionModal
        isOpen={showNewRequisitionModal}
        onClose={() => setShowNewRequisitionModal(false)}
        onSubmit={(reqData) => {
          const created = addRequisition(reqData);
          approvalStore.addRequisitionApproval(created.id, created.requesterName, created.dept, created.from, created.to, created.purpose);
          setShowNewRequisitionModal(false);
          showToast(
            t(
              `Requisition ${created.id} submitted. The transport cell will allocate a vehicle and driver.`,
              `✓ যানবাহন রিকুইজিশন ${created.id} দাখিল সম্পন্ন! পরিবহন প্রশাসকের নিকট প্রেরিত হয়েছে।`,
              lang
            ),
            'success'
          );
        }}
        lang={lang}
        requester={{
          name: user?.name ?? '',
          empId: user?.empId ?? '',
          label: user?.label ?? '',
          dept: user?.dept ?? '',
          phone: user?.phone ?? '',
          initials: user?.initials ?? '',
        }}
      />

      {/* ─── Pooling review (dispatch only) ── */}
      {isTransportAdmin && poolSuggestion && (
        <Modal
          open={showSmartPoolModal}
          onClose={() => setShowSmartPoolModal(false)}
          title={t('Combine two requests', 'দুটি আবেদন একত্র করুন', lang)}
          icon={<Users size={18} />}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowSmartPoolModal(false)}>{t('Cancel', 'বাতিল', lang)}</Button>
              <Button icon={<Check size={15} />} onClick={handleExecuteSmartPool}>{t('Assign both', 'দুটিই বরাদ্দ করুন', lang)}</Button>
            </>
          }
        >
          <p className="text-muted" style={{ marginTop: 0, fontSize: '12.5px' }}>
            {t(
              `Both requests travel ${poolSuggestion.primary.from} → ${poolSuggestion.primary.to}. They will share one vehicle, one driver and one trip pass.`,
              `দুটি আবেদনই ${poolSuggestion.primary.from} → ${poolSuggestion.primary.to} রুটে। একটি গাড়ি, একজন চালক ও একটি ট্রিপ পাস ব্যবহার হবে।`,
              lang
            )}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            {[poolSuggestion.primary, poolSuggestion.secondary].map((r) => (
              <Card key={r.id}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-1)' }}>{r.id}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px' }}>{r.requesterName} · {r.dept}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' }}>
                  {t('Departs', 'যাত্রা', lang)}: <strong>{r.departureTime}</strong> · {r.passengersCount} {t('pax', 'জন', lang)}
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase' }}>{t('Vehicle & driver', 'গাড়ি ও চালক', lang)}</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-1)', marginTop: '4px' }}>
              {poolSuggestion.vehicle.plate} — {poolSuggestion.vehicle.model} ({poolSuggestion.vehicle.capacitySeats} {t('seats', 'আসন', lang)})
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>
              {poolSuggestion.driver.name} · {poolSuggestion.driver.phone} · {t('Breath test passed today', 'আজকের শ্বাস পরীক্ষায় উত্তীর্ণ', lang)}
            </div>
          </Card>
        </Modal>
      )}

      {/* ─── MODAL 3: TRANSPORT ADMIN VEHICLE + DRIVER ASSIGNMENT (Clean Dropdowns, Only Available Assets) ─── */}
      <AssignVehicleModal
        isOpen={!!assigningReq}
        onClose={() => setAssigningReq(null)}
        requisition={assigningReq}
        vehicles={vehicles}
        drivers={drivers}
        onConfirm={(reqId, vehiclePlate, driverId) => {
          assignRequisition(reqId, vehiclePlate, driverId);
          showToast(
            t(
              `✓ Vehicle ${vehiclePlate} & Driver allocated to Requisition ${reqId}! Digital Trip Challan Pass generated.`,
              `✓ গাড়ি ও চালক সফলভাবে বরাদ্দ করা হয়েছে! ডিজিটাল ট্রিপ পাস তৈরি সম্পন্ন।`,
              lang
            ),
            'gold'
          );
          setAssigningReq(null);
        }}
        lang={lang}
      />

      {/* ─── MODAL 4: TRIP COMPLETION & ODOMETER LOGGING (Admin only) ── */}
      {isTransportAdmin && completingReq && (
        <div className="modal-bg" onClick={() => setCompletingReq(null)} style={{ zIndex: 99999, padding: '20px', boxSizing: 'border-box' }}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '580px', width: '95%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: 'var(--surface-1)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '18px 28px', background: 'linear-gradient(135deg, var(--status-success-solid-dark) 0%, var(--status-success-solid-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800 }}>
                  <CheckCircle size={18} />
                  {t('Complete Duty Trip & Reconcile Mileage', 'ট্রিপ সমাপ্তি ও ওডোমিটার হিসাব', lang)}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--status-success-bright)', marginTop: '2px' }}>
                  Requisition: {completingReq.id} • Vehicle: {completingReq.assignedVehiclePlate}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletingReq(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-inverse-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', padding: '12px 16px', borderRadius: '10px', fontSize: '12.5px' }}>
                <div style={{ color: 'var(--status-success-text)' }}>Start Odometer: <strong>{completingReq.odometerStart || 42350} km</strong></div>
                <div style={{ color: 'var(--status-success-text)', marginTop: '3px' }}>Driver: <strong>{completingReq.assignedDriverName}</strong></div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {t('Ending Odometer Reading (km)', 'সমাপ্তির ওডোমিটার রিডিং (কিমি)', lang)}
                </label>
                <input
                  type="number"
                  className="notice-input"
                  value={endOdometer}
                  onChange={(e) => setEndOdometer(Number(e.target.value))}
                  style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--border-2)', fontSize: '14px', fontWeight: 700 }}
                />
                <div style={{ fontSize: '12px', color: 'var(--status-success)', marginTop: '6px', fontWeight: 600 }}>
                  Calculated Transit: <strong>{endOdometer - (completingReq.odometerStart || 42350)} km traveled</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {t('Driver & Trip Service Rating (1 - 5 Stars)', 'ড্রাইভার রেটিং', lang)}
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTripRating(star)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: '10px',
                        border: tripRating >= star ? '1.5px solid var(--status-warning)' : '1px solid var(--border-2)',
                        background: tripRating >= star ? 'var(--status-warning-bg)' : 'var(--surface-1)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: tripRating >= star ? 'var(--status-warning-text)' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {t('Passenger Feedback / Notes', 'মন্তব্য', lang)}
                </label>
                <input
                  type="text"
                  className="notice-input"
                  style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--border-2)', fontSize: '13px' }}
                  value={tripFeedback}
                  onChange={(e) => setTripFeedback(e.target.value)}
                />
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: 'var(--surface-0)', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCompletingReq(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', backgroundColor: 'var(--surface-1)', border: '1.5px solid var(--border-2)', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={handleConfirmCompleteTrip}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-on-brand)', background: 'var(--status-success-solid)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)' }}
              >
                <Check size={15} /> {t('Confirm Inward Clearance & Complete', 'ট্রিপ সমাপ্ত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: REJECT REQUISITION MODAL (Admin only) ─────────── */}
      {isTransportAdmin && rejectingReq && (
        <div className="modal-bg" onClick={() => setRejectingReq(null)} style={{ zIndex: 99999, padding: '20px', boxSizing: 'border-box' }}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '500px', width: '95%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: 'var(--surface-1)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '18px 28px', background: 'linear-gradient(135deg, var(--status-danger-solid-dark) 0%, var(--status-danger-solid-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0, fontSize: '16px', fontWeight: 800 }}>{t('Reject Vehicle Requisition', 'রিকুইজিশন বাতিল', lang)}</h3>
                <div style={{ fontSize: '12px', color: 'var(--status-danger-bright)', marginTop: '2px' }}>Requisition: {rejectingReq.id}</div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-inverse-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '8px', textTransform: 'uppercase' }}>
                {t('Reason for Rejection / Unavailability:', 'বাতিল করার কারণ:', lang)}
              </label>
              <select
                className="notice-select"
                style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--border-2)', fontSize: '13px' }}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              >
                <option value="All pool sedans occupied for emergency refinery dispatch">All pool sedans occupied for emergency refinery dispatch</option>
                <option value="Non-official duty or insufficient advance notice">Non-official duty or insufficient advance notice</option>
                <option value="Recommending public commute / ride-share reimbursement">Recommending public commute / ride-share reimbursement</option>
                <option value="Driver rest quota hours exceeded for safety">Driver rest quota hours exceeded for safety</option>
              </select>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: 'var(--surface-0)', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', backgroundColor: 'var(--surface-1)', border: '1.5px solid var(--border-2)', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-on-brand)', background: 'var(--status-danger-solid)', border: 'none', cursor: 'pointer' }}
              >
                {t('Confirm Rejection', 'বাতিল নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: LIVE VEHICLE TRACKING HUD (Available to All) ──── */}
      {trackingReq && (
        <div className="modal-bg" onClick={() => setTrackingReq(null)} style={{ zIndex: 99999, padding: '20px', boxSizing: 'border-box' }}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '640px', width: '95%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: 'var(--surface-1)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '18px 28px', background: 'linear-gradient(135deg, var(--surface-inverse) 0%, var(--surface-inverse-2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800 }}>
                  <Navigation size={18} color="var(--status-info-bright)" />
                  {t('Live Vehicle Telematics & Route Beacon', 'লাইভ ভেহিক্যাল ট্র্যাকিং', lang)}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{trackingReq.id} • {trackingReq.assignedVehiclePlate}</div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingReq(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-inverse-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px' }}>
              <div style={{
                background: 'var(--surface-inverse)',
                color: 'var(--text-on-brand)',
                borderRadius: '14px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '18px',
                border: '1px solid var(--border-inverse)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--status-info-bright)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  GPS Satellite Beacon Synced
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px', letterSpacing: '-0.5px' }}>
                  48 km/h
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Location: Dhaka-Mawa Expressway near Babubazar Overpass
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                  <span>ETA to Destination: <strong style={{ color: 'var(--status-success-bright)' }}>18 mins</strong></span>
                  <span>Driver: <strong>{trackingReq.assignedDriverName}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  style={{ flex: 1, padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--border-2)', backgroundColor: 'var(--surface-1)', color: 'var(--text-1)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => showToast(`Calling Driver ${trackingReq.assignedDriverName} (${trackingReq.assignedDriverPhone})...`, 'info')}
                >
                  <Phone size={15} color="var(--status-info)" /> Call Driver
                </button>
                <button
                  type="button"
                  style={{ flex: 1, padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--status-danger)', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => showToast('SOS Dispatcher notified. Emergency vehicle en route.', 'info')}
                >
                  <AlertOctagon size={15} /> Emergency SOS
                </button>
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: 'var(--surface-0)', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setTrackingReq(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', backgroundColor: 'var(--surface-1)', border: '1.5px solid var(--border-2)', cursor: 'pointer' }}
              >
                {t('Close', 'বন্ধ করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: OFFICIAL DIGITAL TRIP CHALLAN PASS ─────────────── */}
      {selectedTripPassReq && (
        <div className="modal-bg" onClick={() => setSelectedTripPassReq(null)} style={{ zIndex: 99999, padding: '20px', boxSizing: 'border-box' }}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '780px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: 'var(--surface-1)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '14px 28px', backgroundColor: 'var(--surface-0)', borderBottom: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, color: 'var(--text-1)', backgroundColor: 'var(--status-warning-bg)', border: '1px solid var(--status-warning)', padding: '3px 10px', borderRadius: '6px' }}>
                  Challan No: {selectedTripPassReq.tripPassNo}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 800, backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info-text)', border: '1px solid var(--status-info-border)' }}>
                  Security Gate Pass Verified
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTripPassReq(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-2)', backgroundColor: 'var(--surface-1)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '26px 32px', backgroundColor: 'var(--surface-2)', boxSizing: 'border-box' }}>
              <div className="fleet-letterhead-paper" style={{ backgroundColor: 'var(--surface-1)', borderRadius: '14px', border: '1.5px solid var(--border-2)', padding: '34px 38px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative' }}>
                {/* Watermark */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: '42px', fontWeight: 900, color: 'rgba(165, 28, 48, 0.035)', whiteSpace: 'nowrap', pointerEvents: 'none', letterSpacing: '4px', textTransform: 'uppercase', userSelect: 'none' }}>
                  BASHUNDHARA FLEET DISPATCH
                </div>

                {/* Company Header */}
                <div style={{ textAlign: 'center', paddingBottom: '18px', marginBottom: '22px', borderBottom: '2px solid var(--brand-crimson)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--brand-crimson)', color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>
                      B
                    </div>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, letterSpacing: '0.8px', color: 'var(--text-1)', textTransform: 'uppercase' }}>
                      Bashundhara Oil & Gas Company Ltd.
                    </h2>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Corporate Logistics & Security Gate Administration
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-crimson)', marginTop: '4px', letterSpacing: '0.5px' }}>
                    OFFICIAL DUTY TRAVEL CHALLAN & SECURITY GATE PASS
                  </div>
                </div>

                {/* 2-Column Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '16px 20px', backgroundColor: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '12px', fontSize: '12px', marginBottom: '18px' }}>
                  <div><strong style={{ color: 'var(--text-3)' }}>Pass Reference:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-1)' }}>{selectedTripPassReq.tripPassNo}</span></div>
                  <div><strong style={{ color: 'var(--text-3)' }}>Date of Issue:</strong> <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>22 Oct 2026</span></div>
                  <div><strong style={{ color: 'var(--text-3)' }}>Authorized Requester:</strong> <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{selectedTripPassReq.requesterName}</span></div>
                  <div><strong style={{ color: 'var(--text-3)' }}>Department:</strong> <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{selectedTripPassReq.dept}</span></div>
                  <div><strong style={{ color: 'var(--text-3)' }}>Assigned Vehicle:</strong> <span style={{ color: 'var(--status-success)', fontWeight: 800 }}>{selectedTripPassReq.assignedVehiclePlate}</span></div>
                  <div><strong style={{ color: 'var(--text-3)' }}>Vehicle Model:</strong> <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{selectedTripPassReq.assignedVehicleModel}</span></div>
                  <div><strong style={{ color: 'var(--text-3)' }}>Assigned Driver:</strong> <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{selectedTripPassReq.assignedDriverName}</span></div>
                  <div><strong style={{ color: 'var(--text-3)' }}>Driver Contact:</strong> <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{selectedTripPassReq.assignedDriverPhone}</span></div>
                  <div><strong style={{ color: 'var(--text-3)' }}>Authorized Route:</strong> <span style={{ fontWeight: 700, color: 'var(--status-info)' }}>{selectedTripPassReq.from.split(',')[0]} ➔ {selectedTripPassReq.to.split(',')[0]}</span></div>
                  <div><strong style={{ color: 'var(--text-3)' }}>Trip Mode:</strong> <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{selectedTripPassReq.tripType === 'round_trip' ? 'Round Trip (Return Authorized)' : 'One-Way Drop-off'}</span></div>
                </div>

                {/* Purpose Block */}
                <div style={{ backgroundColor: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '10px', padding: '12px 16px', fontSize: '12.5px', color: 'var(--text-2)', marginBottom: '18px' }}>
                  <strong style={{ color: 'var(--text-3)', display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}>Official Duty Purpose:</strong>
                  {selectedTripPassReq.purpose}
                </div>

                {/* Gate Clearance Barcode & QR Block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid var(--border-1)', paddingTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Security Gate Clearance Barcode:</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--text-1)', fontSize: '13px', marginTop: '2px' }}>*BOGCL-TRIP-{selectedTripPassReq.tripPassNo}*</div>
                    <div style={{ color: 'var(--status-success)', fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>✓ Gate Outward Verified by Transport Admin</div>
                  </div>
                  <div style={{ padding: '6px', background: 'var(--surface-1)', border: '1px solid var(--border-2)', borderRadius: '8px' }}>
                    <QrCode size={64} color="var(--text-1)" />
                  </div>
                </div>
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: 'var(--surface-0)', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: ENABLE_FLEET_CHAT_DESK ? 'space-between' : 'flex-end', alignItems: 'center' }}>
              {ENABLE_FLEET_CHAT_DESK && (
                <button
                  type="button"
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1.5px solid var(--status-info)', color: 'var(--status-info-text)', backgroundColor: 'var(--status-info-bg)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    const targetReq = selectedTripPassReq;
                    setSelectedTripPassReq(null);
                    setActiveChatReq(targetReq);
                  }}
                >
                  <MessageSquare size={14} />
                  {t('Open Trip Chat', 'ট্রিপ চ্যাট খুলুন', lang)}
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTripPassReq(null)}
                  style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', backgroundColor: 'var(--surface-1)', border: '1.5px solid var(--border-2)', cursor: 'pointer' }}
                >
                  {t('Close', 'বন্ধ করুন', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    showToast(t(`Challan Pass ${selectedTripPassReq.tripPassNo} sent to printer.`, `চালান পাস প্রিন্টারে পাঠানো হয়েছে।`, lang), 'success');
                    setSelectedTripPassReq(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-on-brand)', background: 'linear-gradient(135deg, var(--brand-crimson) 0%, var(--brand-crimson-dark) 100%)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(165, 28, 48, 0.35)' }}
                >
                  <Printer size={15} />
                  {t('Print Official Trip Pass', 'ট্রিপ পাস প্রিন্ট করুন', lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 8: FUEL SLIP VOUCHER (Admin only) ─────────────────── */}
      {isTransportAdmin && showFuelModal && (
        <div className="modal-bg" onClick={() => setShowFuelModal(null)} style={{ zIndex: 99999, padding: '20px', boxSizing: 'border-box' }}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '580px', width: '95%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: 'var(--surface-1)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '18px 28px', background: 'linear-gradient(135deg, var(--surface-inverse) 0%, var(--surface-inverse-2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Fuel size={20} color="var(--status-warning)" />
                <h3 style={{ color: 'var(--text-on-brand)', margin: 0, fontSize: '16px', fontWeight: 800 }}>
                  {t('Issue Digital Fuel Requisition Slip', 'ডিজিটাল ফুয়েল স্লিপ ইস্যু', lang)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFuelModal(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-inverse-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px' }}>
              <div style={{ marginBottom: '18px', background: 'var(--surface-0)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-1)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Target Vehicle</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-1)', marginTop: '2px', fontFamily: 'monospace' }}>
                  {showFuelModal.plate}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-2)', marginTop: '2px' }}>
                  {showFuelModal.model} • Driver: <strong>{showFuelModal.driverName}</strong> ({showFuelModal.driverPhone})
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                  {t('Authorized Fuel Station / Pump', 'অনুমোদিত ফিলিং স্টেশন', lang)}
                </label>
                <select
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className="notice-select"
                  style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--border-2)', fontSize: '13px' }}
                >
                  <option value="Bashundhara Filling Station, 300 Feet Road">Bashundhara Filling Station, 300 Feet Road</option>
                  <option value="Keraniganj Plant Dedicated Diesel Dispenser">Keraniganj Plant Dedicated Diesel Dispenser (In-House)</option>
                  <option value="Padma Oil Depot, Fatullah, Narayanganj">Padma Oil Depot, Fatullah, Narayanganj</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                    {t('Fuel Volume (Liters)', 'জ্বালানির পরিমাণ (লিটার)', lang)}
                  </label>
                  <input
                    type="text"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className="notice-input"
                    style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--border-2)', fontSize: '13px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
                    {t('Fuel Category', 'জ্বালানির ধরন', lang)}
                  </label>
                  <select
                    defaultValue="Octane"
                    className="notice-select"
                    style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid var(--border-2)', fontSize: '13px' }}
                  >
                    <option value="Octane">Octane (Euro-4 Standard)</option>
                    <option value="Diesel">Diesel (Low Sulfur - Industrial)</option>
                    <option value="CNG">CNG Compressed Gas</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-bright)', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', color: 'var(--status-warning-text)', lineHeight: 1.5 }}>
                🔒 <strong>OTP Security:</strong> A 4-digit verification PIN and single-use QR Code will be sent to the driver. The pump operator will scan to validate before fuel dispensing.
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: 'var(--surface-0)', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowFuelModal(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', backgroundColor: 'var(--surface-1)', border: '1.5px solid var(--border-2)', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={confirmFuelSlip}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--text-on-brand)', background: 'var(--status-warning-solid)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)' }}
              >
                <QrCode size={15} />
                {t('Issue QR Fuel Voucher', 'কিউআর ভাউচার ইস্যু করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modals */}
      {isTransportAdmin && (
        <>
          <RegisterVehicleModal
            isOpen={showRegisterVehicleModal}
            onClose={() => setShowRegisterVehicleModal(false)}
            lang={lang}
          />

          <EnrollDriverModal
            isOpen={showEnrollDriverModal}
            onClose={() => setShowEnrollDriverModal(false)}
            lang={lang}
          />
        </>
      )}

      {/* ─── Tri-Party Trip Chat Modal ─────────────────────────────── */}
      {ENABLE_FLEET_CHAT_DESK && (
        <TripChatModal
          isOpen={Boolean(activeChatReq)}
          onClose={() => setActiveChatReq(null)}
          requisition={activeChatReq}
          party={party}
          senderName={user?.name ?? ''}
          readOnly={isOversight}
          lang={lang}
          onOpenFullDesk={isOversight ? undefined : (req) => {
            setActiveChatReq(null);
            setSelectedChatChannelId(req.id);
            if (isEmployee) setEmployeeTab('chat_center');
            else if (isDriver) setDriverTab('chat_center');
            else setActiveAdminTab('chat_center');
          }}
        />
      )}

      {/* ─── Fleet Logistics Notifications Drawer ──────────────────── */}
      <FleetNotificationsDrawer
        isOpen={showNotificationsDrawer}
        onClose={() => setShowNotificationsDrawer(false)}
        notifications={roleNotifications}
        lang={lang}
        onSelectRequisition={(reqId) => {
          const req = requisitions.find(r => r.id === reqId);
          if (req) setSelectedTripPassReq(req);
        }}
        onOpenChat={!ENABLE_FLEET_CHAT_DESK || isOversight ? undefined : (reqId) => {
          setShowNotificationsDrawer(false);
          setSelectedChatChannelId(reqId);
          if (isEmployee) setEmployeeTab('chat_center');
          else if (isDriver) setDriverTab('chat_center');
          else setActiveAdminTab('chat_center');
        }}
      />
    </div>
  );
}
