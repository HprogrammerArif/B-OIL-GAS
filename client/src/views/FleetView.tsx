import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import { useFleetStore, Driver, Vehicle, VehicleRequisition, TripChatMessage, FleetNotification } from '../store/fleetStore';
import {
  Truck, Car, Fuel, MapPin, CheckCircle, Clock, AlertCircle,
  Plus, Users, Navigation, QrCode, FileText, Sparkles, Award,
  Gauge, Radio, ShieldCheck, AlertTriangle, ArrowRight, Eye,
  Maximize2, Activity, Cpu, Check, Compass, PhoneCall, Zap,
  UserCheck, Shield, Key, Calendar, Printer, Search, RotateCcw,
  UserPlus, Star, ThumbsUp, X, ChevronRight, Share2, Phone,
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
    recordBreathalyzer,
    updateDriverStatus,
    updateVehicleStatus,
    sendChatMessage,
    markNotificationRead,
    markAllNotificationsRead
  } = useFleetStore();

  // Strict Role-Based Access Control (RBAC)
  const isEmployee = role === 'employee';
  const isDriver = role === 'driver';
  const isTransportAdmin = role === 'transport_admin' || role === 'plant_gm' || role === 'chairman';

  const [activeAdminTab, setActiveAdminTab] = useState<'requisitions' | 'drivers' | 'telematics' | 'fuel' | 'gate_manifest' | 'chat_center'>('requisitions');
  const [employeeTab, setEmployeeTab] = useState<'requisitions' | 'chat_center'>('requisitions');
  const [driverTab, setDriverTab] = useState<'console' | 'chat_center'>('console');

  // Check if dedicated chat center tab is active across roles to lock viewport and maximize chat area
  const isChatTabActive = (isEmployee && employeeTab === 'chat_center') || (!isEmployee && !isDriver && activeAdminTab === 'chat_center') || (isDriver && driverTab === 'chat_center');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'all' | 'available' | 'on_trip' | 'sick_leave' | 'on_leave' | 'rest_required'>('all');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<'all' | 'available' | 'in_transit' | 'maintenance'>('all');

  // Tri-Party Chat State
  const [selectedChatChannelId, setSelectedChatChannelId] = useState<string | undefined>(undefined);
  const [activeChatReq, setActiveChatReq] = useState<VehicleRequisition | null>(null);
  const [chatInputText, setChatInputText] = useState('');
  const [chatSimulatedRole, setChatSimulatedRole] = useState<'employee' | 'driver' | 'admin'>(isEmployee ? 'employee' : 'admin');

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
  const [passengerNames, setPassengerNames] = useState(isEmployee ? 'Tanvir Ahmed, Engr. Tariq Ahmed' : 'Executive Team');
  const [purpose, setPurpose] = useState('Official refinery site inspection and delivery of asphalt laboratory batch dossiers');
  const [costCenter, setCostCenter] = useState('CC-SALES-DHAKA-102');

  // Assignment Modal State
  const [assignCarPlate, setAssignCarPlate] = useState(vehicles.find(v => v.status === 'available')?.plate || vehicles[0].plate);
  const [assignDriverId, setAssignDriverId] = useState(drivers.find(d => d.status === 'available')?.id || drivers[0].id);

  // Filtered requisitions list
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(r => {
      // Role scope: in staff perspective, strictly show employee's own requisitions
      if (isEmployee) {
        const isMine = r.requesterName.toLowerCase().includes('tanvir') || r.dept === 'Sales & Distribution' || r.id === 'REQ-2026-441' || r.id.startsWith('REQ-');
        if (!isMine) return false;
      }

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
  }, [requisitions, statusFilter, searchQuery, isEmployee]);

  // Submit Requisition Handler
  const handleCreateRequisition = () => {
    if (!purpose.trim()) {
      showToast(t('Please specify the official business purpose.', 'অনুগ্রহ করে দাপ্তরিক কাজের উদ্দেশ্য লিখুন।', lang), 'info');
      return;
    }
    const cleanStops = intermediateStops.filter(s => s.trim().length > 0);
    const created = addRequisition({
      requesterName: isEmployee ? 'Tanvir Ahmed' : 'Engr. Harunur Rashid',
      requesterRole: isEmployee ? 'Sr. Sales & Distribution Specialist' : 'Plant GM & Operations Lead',
      dept: isEmployee ? 'Sales & Distribution' : 'Plant Operations',
      phone: '+880 1712-334455',
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
    showToast(t(
      `✓ Duty Travel Requisition ${created.id} submitted! Transferred to Transport Admin (Md. Kamruzzaman) for driver allocation.`,
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
    startTrip(req.id, 42350, '02:35 PM');
    showToast(t(
      `Trip ${req.id} started! Vehicle ${req.assignedVehiclePlate} cleared for highway transit (Odometer: 42,350 km).`,
      `ট্রিপ ${req.id} যাত্রা শুরু করেছে! ওডোমিটার: ৪২,৩৫০ কিমি।`,
      lang
    ), 'info');
  };

  // Complete Trip Action (Admin only)
  const handleConfirmCompleteTrip = () => {
    if (!completingReq) return;
    completeTrip(completingReq.id, endOdometer, '06:15 PM', tripRating, tripFeedback);
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
    poolRequisitions('REQ-2026-441', 'REQ-2026-443', 'DHAKA METRO CHA-53-4102', 'DRV-02');
    setShowSmartPoolModal(false);
    showToast(t(
      '✓ Smart Pool Merger Executed! REQ-2026-441 & REQ-2026-443 consolidated into Toyota HiAce (CHA-53-4102). ৳1,850 fuel saved!',
      '✓ স্মার্ট পুলিং কার্যকর! উভয় আবেদন টয়োটা হাইএইস-এ সফলভাবে মার্জ করা হয়েছে। ১,৮৫০ টাকা জ্বালানি সাশ্রয়!',
      lang
    ), 'gold');
  };

  const handleIssueFuelSlip = (v: Vehicle) => {
    setShowFuelModal(v);
  };

  const confirmFuelSlip = () => {
    if (!showFuelModal) return;
    showToast(t(
      `Digital Fuel Slip generated for ${showFuelModal.plate} (${fuelLiters} Liters Octane). QR barcode dispatched to Driver.`,
      `${showFuelModal.plate} এর জন্য ডিজিটাল ফুয়েল স্লিপ ইস্যু করা হয়েছে (${fuelLiters} লিটার)। কিউআর কোড চালকের ফোনে পাঠানো হয়েছে।`,
      lang
    ), 'gold');
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

  // Role-filtered notifications
  const roleNotifications = notifications.filter(n => n.targetRole === 'all' || (isEmployee ? n.targetRole === 'employee' : n.targetRole === 'admin'));
  const unreadNotifCount = roleNotifications.filter(n => n.unread).length;

  return (
    <div
      className={`view-container view-transition-wrapper ${
        isChatTabActive ? 'fleet-chat-active flex h-full max-h-full min-h-0 flex-col overflow-hidden pb-0' : ''
      }`}
    >
      {/* ─── View Header ────────────────────────────────────────────── */}
      <div className={`flex shrink-0 flex-wrap items-start justify-between gap-3 ${isChatTabActive ? 'mb-1' : 'mb-3.5'}`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="m-0 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Car size={20} className="text-[#A51C30]" aria-hidden />
              {isDriver
                ? t('Duty Driver Terminal & Mission Cockpit', 'ডিউটি ড্রাইভার টার্মিনাল ও ট্রিপ কন্ট্রোল', lang)
                : isEmployee
                ? t('My Official Vehicle Requisitions & Duty Travel Desk', 'আমার দাপ্তরিক যানবাহন আবেদন ও ট্রাভেল ডেস্ক', lang)
                : t('Fleet Command, Driver Pool & Requisition Dispatch Desk', 'যানবাহন বহর কমান্ড, চালক পুল ও ডেসপ্যাচ কন্ট্রোল রুম', lang)}
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {isDriver ? 'Driver Terminal' : isEmployee ? 'Staff Portal' : 'BOGCL Central Logistics'}
            </span>
            {!isEmployee && !isDriver && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {availableVehiclesCount} {t('Vehicles Ready', 'গাড়ি প্রস্তুত', lang)}
              </span>
            )}
          </div>
          {!isChatTabActive && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isDriver
                ? t(
                    'Active Mission Execution • Gate-Out & Gate-In Odometer Logging • Direct Passenger & Dispatch VoIP • Toll Voucher Claims',
                    'সক্রিয় মিশন পরিচালনা • গেট আউট ও গেট ইন ওডোমিটার লগ • যাত্রী ও ডেসপ্যাচ সরাসরি কল • হাইওয়ে টোল ভাউচার',
                    lang
                  )
                : isEmployee
                ? t(
                    'Submit duty travel requests, track your assigned vehicle & driver, download digital trip challans, and rate trip completion.',
                    'দাপ্তরিক যাতায়াত রিকুইজিশন জমা দিন, ড্রাইভার ও গাড়ির অবস্থান ট্র্যাক করুন এবং ডিজিটাল ট্রিপ চালান ডাউনলোড করুন।',
                    lang
                  )
                : t(
                    'End-to-End Duty Travel Lifecycle • Driver Roster & Sobriety Audit • Live Tanker GPS Telematics • Digital Trip Gate Passes',
                    'দাপ্তরিক যাতায়াত রিকুইজিশন • চালক তথ্য ও ফিটনেস অডিট • রিয়েল-টাইম জিপিএস ট্র্যাকিং • ডিজিটাল ট্রিপ পাস',
                    lang
                  )}
            </p>
          )}
        </div>

        {/* Action Controls - Strictly Guarded by RBAC */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Fleet Notification Bell Button */}
          <button
            type="button"
            onClick={() => setShowNotificationsDrawer(prev => !prev)}
            title={t('Fleet Logistics Notifications', 'ফ্লিট নোটিফিকেশন', lang)}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              unreadNotifCount > 0
                ? 'border-[#A51C30] bg-[#A51C30]/5 text-[#A51C30]'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Bell size={14} aria-hidden />
            <span>{t('Alerts', 'নোটিফিকেশন', lang)}</span>
            {unreadNotifCount > 0 && (
              <span className="rounded-full bg-[#A51C30] px-1.5 py-px text-[11px] font-bold text-white">{unreadNotifCount}</span>
            )}
          </button>

          {/* Admin-Only Registration Buttons (Hidden in Chat mode to maximize workspace) */}
          {!isChatTabActive && isTransportAdmin && (
            <>
              <button
                type="button"
                onClick={() => setShowRegisterVehicleModal(true)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Truck size={14} aria-hidden /> {t('Register Vehicle', 'গাড়ি যুক্ত করুন', lang)}
              </button>

              <button
                type="button"
                onClick={() => setShowEnrollDriverModal(true)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <UserCheck size={14} aria-hidden /> {t('Enroll Driver', 'চালক যুক্ত করুন', lang)}
              </button>
            </>
          )}

          {/* New Requisition Button Available to Employees and Admins only */}
          {!isDriver && (
            <button
              type="button"
              onClick={() => setShowNewRequisitionModal(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-[#A51C30] px-3 text-[12px] font-extrabold text-white shadow-sm transition hover:bg-[#8F1A2B] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Plus size={14} aria-hidden />
              {t('New Requisition', 'নতুন আবেদন', lang)}
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
              <Activity size={14} color="#10B981" />
              {t('Live Fleet & Crew Availability Pulse:', 'ফ্লিট ও চালক উপস্থিতি লাইভ স্ট্যাটাস:', lang)}
            </span>
            <span className="badge success" style={{ fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
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
              <span className="badge" style={{ fontSize: '10.5px', background: '#FCE7F3', color: '#BE185D', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={12} />
                {sickLeaveDriversCount} {t('Driver on Sick Leave', 'চালক অসুস্থতাজনিত ছুটিতে', lang)}
              </span>
            )}
            {onLeaveDriversCount > 0 && (
              <span className="badge" style={{ fontSize: '10.5px', background: '#F3E8FF', color: '#7E22CE', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
          border: '1.5px solid #10B981',
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
            <UserCheck size={16} color="#059669" />
            <div>
              <strong>{t('Driver Mission Cockpit (Md. Rafiqul Islam - DRV-01):', 'ডিউটি ড্রাইভার ককপিট:', lang)}</strong>{' '}
              {t(
                'Execute assigned duty travel missions, log departure/arrival odometers, communicate via direct VoIP & tri-party chat, and submit highway toll claims.',
                'বরাদ্দকৃত ট্রিপ সম্পন্ন করুন, ওডোমিটার রিডিং প্রদান করুন, ভিওআইপি ও ট্রাই-পার্টি চ্যাটে সংযুক্ত থাকুন এবং হাইওয়ে টোল ভাউচার জমা দিন।',
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
            <Car size={16} color="#2563EB" />
            <div>
              <strong>{t('Employee Self-Service Desk (Tanvir Ahmed - EMP-1042):', 'কর্মকর্তা যাতায়াত ডেস্ক:', lang)}</strong>{' '}
              {t(
                'Submit official vehicle requisitions for plant inspections, customer visits, or refinery operations. Your requests are processed by the Central Transport Cell.',
                'প্ল্যান্ট ভিজিট ও মিটিংয়ের জন্য গাড়ি রিকুইজিশন জমা দিন। আপনার আবেদনটি কেন্দ্রীয় পরিবহন সেল কর্তৃক অনুমোদিত ও বরাদ্দ করা হবে।',
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
          border: '1.5px solid #D4AF37',
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
            <Shield size={16} color="#B45309" />
            <div>
              <strong>{t('Transport Dispatch Controller Mode (Md. Kamruzzaman):', 'পরিবহন পরিদর্শক ও ডেসপ্যাচ মোড:', lang)}</strong>{' '}
              {t(
                'Full administrative authority to assign roadworthy vehicles, allocate certified drivers with zero-BAC breathalyzer clearance, log gate outward/inward passes, and execute smart pool mergers.',
                'গাড়ি ও চালক বরাদ্দ, অ্যালকোহল টেস্ট অডিট, গেট ইন-আউট ক্লিয়ারেন্স এবং কারপুলিং অনুমোদনের পূর্ণ ক্ষমতা।',
                lang
              )}
            </div>
          </div>
          <span className="badge gold" style={{ whiteSpace: 'nowrap' }}>
            {t('Transport Command Room', 'কমান্ড রুম', lang)}
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
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
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
                  {filteredRequisitions.filter(r => r.status === 'pending').length} Pending
                </span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                    <CheckCircle size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Active Duty Passes', 'সক্রিয় ডিজিটাল পাস', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', lineHeight: '1.2' }}>
                      {filteredRequisitions.filter(r => r.status === 'assigned' || r.status === 'in_transit').length}
                    </div>
                  </div>
                </div>
                <span className="badge success" style={{ fontSize: '10px' }}>Cleared</span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                    <MapPin size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Departure Hub', 'প্রারম্ভিক অফিস', lang)}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#2563EB', lineHeight: '1.2' }}>
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
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
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
                <span className="badge warn" style={{ fontSize: '10px' }}>{pendingCount} Pending</span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                    <Truck size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Fleet Vehicles', 'মোট যানবাহন', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB', lineHeight: '1.2' }}>
                      {vehicles.length}
                    </div>
                  </div>
                </div>
                <span className="badge success" style={{ fontSize: '10px' }}>{availableVehiclesCount} Ready</span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                    <UserCheck size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Driver Roster', 'চালক রোস্টার', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', lineHeight: '1.2' }}>
                      {drivers.length}
                    </div>
                  </div>
                </div>
                <span className="badge success" style={{ fontSize: '10px' }}>0.00% BAC Clear</span>
              </div>

              <div className="card" style={{ padding: '8px 12px', background: 'var(--brand-card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                    <Navigation size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {t('Highway Transit', 'চলমান ট্রিপ', lang)}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#8B5CF6', lineHeight: '1.2' }}>
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

      {/* ─── AI Smart Pooling Opportunity Box (Admin Only) ─────────── */}
      {!isChatTabActive && isTransportAdmin && (
        <div className="pool-suggestion mb-3" style={{
          background: 'linear-gradient(135deg, rgba(29, 78, 216, 0.08) 0%, rgba(212, 175, 55, 0.08) 100%)',
          border: '1.5px solid #3B82F6',
          borderRadius: '12px',
          padding: '12px 16px'
        }}>
          <div className="pool-icon">
            <Sparkles size={24} color="#1D4ED8" />
          </div>
          <div style={{ flex: 1 }}>
            <div className="pool-text">
              <h4 style={{ margin: '0 0 2px 0', fontSize: '13.5px', fontWeight: 800, color: '#1E3A8A' }}>
                {t('AI Route Optimization & Smart Ride-Pooling Opportunity Detected', 'এআই রুট অপ্টিমাইজেশন ও কারপুলিং সুযোগ শনাক্ত হয়েছে', lang)}
              </h4>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--brand-slate-700)', lineHeight: '1.4' }}>
                {t(
                  'Two requisitions share matching routes today between Dhaka HQ and Keraniganj Bitumen Plant (2:30 PM & 2:45 PM). Merging them saves 1 vehicle and eliminates 38 km redundant transit (৳1,850 fuel saved).',
                  'আজ ঢাকা সদর দপ্তর থেকে কেরানীগঞ্জ প্ল্যান্টের একই রুটে দুটি পৃথক রিকুইজিশন এসেছে। গাড়ি মার্জ করলে ১টি অতিরিক্ত গাড়ি ফ্রি থাকবে এবং ৩৮ কিমি জ্বালানি সাশ্রয় হবে।',
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
            {t('Review & Merge Pool', 'কারপুলিং মার্জ করুন', lang)}
          </button>
        </div>
      )}

      {/* ─── Administrative Tabs Navigation (HIDDEN FOR EMPLOYEES) ──── */}
      {isTransportAdmin && (
        <FleetTabs
          compact={isChatTabActive}
          ariaLabel={t('Fleet sections', 'ফ্লিট বিভাগ', lang)}
          active={activeAdminTab}
          onChange={(id) => setActiveAdminTab(id as typeof activeAdminTab)}
          tabs={[
            { id: 'requisitions', label: t('Requisitions Dispatch Queue', 'রিকুইজিশন ডেসপ্যাচ সারি', lang), icon: Car, tone: 'crimson', badge: requisitions.length, badgeTone: 'danger' },
            { id: 'drivers', label: t('Driver Pool & Sobriety Audit', 'চালক তালিকা ও ফিটনেস অডিট', lang), icon: Users, tone: 'gold', badge: drivers.length, badgeTone: 'gold' },
            { id: 'telematics', label: t('Tankers & GPS Telematics HUD', 'ট্যাংকার ও জিপিএস ট্র্যাকিং', lang), icon: Navigation, tone: 'blue' },
            { id: 'fuel', label: t('Fuel Station & QR Vouchers', 'ফুয়েল ও ডিজিটাল ভাউচার', lang), icon: Fuel, tone: 'emerald' },
            { id: 'gate_manifest', label: t('Security Gate Roster & Odometers', 'গেট ক্লিয়ারেন্স ও ওডোমিটার', lang), icon: FileText, tone: 'violet' },
            { id: 'chat_center', label: t('Dispatch Communications Desk', 'ডেসপ্যাচ কমিউনিকেশন ডেস্ক', lang), icon: MessageSquare, tone: 'indigo', badge: 'Live', badgeTone: 'info' },
          ]}
        />
      )}

      {/* ─── Employee Navigation Tabs ─── */}
      {isEmployee && (
        <FleetTabs
          compact={isChatTabActive}
          ariaLabel={t('Travel desk sections', 'ট্রাভেল ডেস্ক বিভাগ', lang)}
          active={employeeTab}
          onChange={(id) => setEmployeeTab(id as typeof employeeTab)}
          tabs={[
            { id: 'requisitions', label: t('My Official Duty Travel Requisitions', 'আমার রিকুইজিশনসমূহ', lang), icon: Car, tone: 'crimson', badge: filteredRequisitions.length, badgeTone: 'danger' },
            { id: 'chat_center', label: t('Dispatch Communications Desk', 'ডেসপ্যাচ কমিউনিকেশন ডেস্ক', lang), icon: MessageSquare, tone: 'indigo', badge: 'Live Channels', badgeTone: 'info' },
          ]}
        />
      )}

      {/* ─── Driver Navigation Tabs ─── */}
      {isDriver && (
        <FleetTabs
          compact={isChatTabActive}
          ariaLabel={t('Driver terminal sections', 'ড্রাইভার টার্মিনাল বিভাগ', lang)}
          active={driverTab}
          onChange={(id) => setDriverTab(id as typeof driverTab)}
          tabs={[
            { id: 'console', label: t('My Assigned Missions & Duty Terminal', 'আমার ডিউটি ও ট্রিপ ককপিট', lang), icon: Gauge, tone: 'crimson' },
            { id: 'chat_center', label: t('Dispatch Communications Desk', 'ডেসপ্যাচ কমিউনিকেশন ডেস্ক', lang), icon: MessageSquare, tone: 'indigo', badge: 'Live Channels', badgeTone: 'info' },
          ]}
        />
      )}

      {/* ─── Driver Terminal Mode Views ─── */}
      {isDriver && driverTab === 'console' && (
        <DriverConsole
          lang={lang}
          onOpenChat={(req) => {
            setSelectedChatChannelId(req.id);
            setDriverTab('chat_center');
          }}
        />
      )}

      {isDriver && driverTab === 'chat_center' && (
        <div className="flex h-[calc(100vh-140px)] min-h-[640px] w-full flex-col overflow-hidden rounded-2xl shadow-xl">
          <FleetChatCenter
            userRole="driver"
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
                    color: statusFilter === f ? '#fff' : 'var(--brand-slate-600)'
                  }}
                >
                  {f === 'all' ? t('All', 'সব', lang) : f.replace('_', ' ').toUpperCase()}
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
                        <CheckCircle2 size={28} color="#10B981" style={{ margin: '0 auto 6px' }} />
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
                                <div style={{ fontSize: '9px', color: '#1D4ED8', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
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
                            <div style={{ fontSize: '10.5px', color: r.tripType === 'round_trip' ? '#1D4ED8' : '#64748B', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                              <div style={{ fontSize: '10.5px', color: '#1D4ED8' }}>Return: {r.returnTime}</div>
                            )}
                            <span className="badge info" style={{ marginTop: '2px', fontSize: '9px' }}>
                              {r.passengersCount} {r.passengersCount === 1 ? 'Passenger' : 'Passengers'}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{ background: '#F1F5F9', color: '#0F172A', fontWeight: 700, fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {r.requiredCapacity === 'sedan_4' && <><Car size={12} /> Sedan (4-Seater)</>}
                              {r.requiredCapacity === 'microbus_7' && <><Truck size={12} /> Microbus (7-Seater)</>}
                              {r.requiredCapacity === 'pickup_4x4' && <><Shield size={12} /> 4x4 Emergency Patrol</>}
                              {r.requiredCapacity === 'tanker_heavy' && <><Truck size={12} /> Heavy Bulk Tanker</>}
                            </span>
                          </td>
                          <td>
                            {isPending ? (
                              <span style={{ color: '#D97706', fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> Awaiting Allocation
                              </span>
                            ) : isRejected ? (
                              <span style={{ color: '#EF4444', fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={12} /> Rejected ({r.rejectionReason || 'No Vehicle'})
                              </span>
                            ) : (
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} /> {r.assignedVehiclePlate}
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-600)' }}>
                                  Driver: <strong>{r.assignedDriverName}</strong>
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#1D4ED8', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
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
                                      style={{ fontSize: '10.5px', padding: '4px 7px', color: '#EF4444', borderColor: '#EF4444' }}
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
                                    style={{ fontSize: '10.5px', padding: '4px 8px', color: '#059669', borderColor: '#A7F3D0', background: '#ECFDF5' }}
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
                                      <Zap size={11} /> {t('Gate Out', 'যাত্রা শুরু', lang)}
                                    </button>
                                  )}
                                </>
                              )}

                              {/* ─── Case 3: Requisition In Transit ─── */}
                              {isInTransit && (
                                <>
                                  <button
                                    className="btn-outline"
                                    style={{ fontSize: '10.5px', padding: '4px 8px', borderColor: '#2563EB', color: '#2563EB' }}
                                    onClick={() => setTrackingReq(r)}
                                  >
                                    <Navigation size={12} /> {t('Track Live', 'ট্র্যাক', lang)}
                                  </button>

                                  {isTransportAdmin && (
                                    <button
                                      className="btn-primary"
                                      style={{ fontSize: '10.5px', padding: '4px 8px', background: '#059669', borderColor: '#059669' }}
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
                              <button
                                className="btn-outline"
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 9px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  color: '#1D4ED8',
                                  borderColor: '#93C5FD',
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
                                <MessageSquare size={12} className="text-blue-600" />
                                <span>{t('Tri-Party Chat', 'ত্রি-পক্ষীয় চ্যাট', lang)}</span>
                              </button>
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
                <span className="badge" style={{ background: '#FCE7F3', color: '#BE185D' }}>
                  💊 {sickLeaveDriversCount} Sick Leave
                </span>
              )}
              {onLeaveDriversCount > 0 && (
                <span className="badge" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                  ✈️ {onLeaveDriversCount} On Leave
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
                      color: driverStatusFilter === f ? '#fff' : 'var(--brand-slate-600)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{f.replace('_', ' ').toUpperCase()}</span>
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
                      border: isSick ? '1.5px solid #F43F5E' : isOnLeave ? '1.5px solid #A855F7' : '1px solid var(--brand-slate-200)',
                      borderRadius: '8px',
                      padding: '14px',
                      background: isSick ? '#FFF5F5' : isOnLeave ? '#FAF5FF' : 'var(--brand-card-bg)',
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
                          <span className="badge" style={{ background: '#FCE7F3', color: '#BE185D', fontWeight: 800 }}>
                            💊 SICK LEAVE
                          </span>
                        )}
                        {isOnLeave && (
                          <span className="badge" style={{ background: '#F3E8FF', color: '#7E22CE', fontWeight: 800 }}>
                            ✈️ ON LEAVE
                          </span>
                        )}
                        {isRest && <span className="badge warn">REST REQUIRED</span>}
                      </div>

                      {/* Leave Notice Banner */}
                      {(isSick || isOnLeave) && d.leaveReason && (
                        <div style={{
                          background: isSick ? '#FFE4E6' : '#EDE9FE',
                          border: `1px solid ${isSick ? '#FECDD3' : '#DDD6FE'}`,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: isSick ? '#9F1239' : '#5B21B6',
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
                        <div style={{ marginTop: '4px', color: isSick ? '#9F1239' : 'var(--status-success)', fontWeight: 700 }}>
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
                          <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>Status:</span>
                          <select
                            style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#fff' }}
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
            <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', border: '1px solid #334155' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Navigation size={18} color="#FBBF24" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>
                      {selectedVehicleTelemetry.plate} — {selectedVehicleTelemetry.model}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                      Assigned Driver: <strong>{selectedVehicleTelemetry.driverName}</strong> • 📞 {selectedVehicleTelemetry.driverPhone}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge" style={{ background: '#059669', color: '#fff' }}>GPS ONLINE</span>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Speed: <strong style={{ color: '#F8FAFC' }}>{selectedVehicleTelemetry.speed} km/h</strong></span>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'uppercase' }}>Current Geofence Location</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: '#FDE68A' }}>
                    {selectedVehicleTelemetry.location}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'uppercase' }}>Engine & Cargo Temperature</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                    Engine: <strong style={{ color: '#34D399' }}>{selectedVehicleTelemetry.engineTemp}°C</strong>
                    {selectedVehicleTelemetry.bitumenCargoTemp && (
                      <span> • Cargo: <strong style={{ color: '#F87171' }}>{selectedVehicleTelemetry.bitumenCargoTemp}°C</strong></span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'uppercase' }}>Fuel Tank Capacity</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: '#38BDF8' }}>
                    {selectedVehicleTelemetry.fuelPct}% Full Tank
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'uppercase' }}>Next Maintenance Service</div>
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
                  <div className="card-title">All Fleet Vehicles Telemetry & Maintenance Index</div>
                  <div className="card-subtitle">Real-time status, workshop job orders, and speed telematics</div>
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
                        color: vehicleStatusFilter === f ? '#fff' : 'var(--brand-slate-600)',
                      }}
                    >
                      {f.replace('_', ' ').toUpperCase()} ({count})
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
                              <div style={{ fontSize: '10.5px', color: '#D97706', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                              <span className="badge warn" style={{ background: '#FEF3C7', color: '#B45309', fontWeight: 800 }}>
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
                                  style={{ fontSize: '10.5px', color: '#059669', borderColor: '#A7F3D0', background: '#ECFDF5' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateVehicleStatus(v.plate, 'available');
                                    showToast(`${v.plate} workshop inspection completed. Marked AVAILABLE.`, 'success');
                                  }}
                                  title="Mark maintenance complete and return to service"
                                >
                                  ✓ Mark Ready
                                </button>
                              ) : v.status === 'available' ? (
                                <button
                                  className="btn-sm-ghost"
                                  style={{ fontSize: '10.5px', color: '#D97706', borderColor: '#FDE68A' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateVehicleStatus(v.plate, 'maintenance', 'Scheduled workshop maintenance & fluid inspection');
                                    showToast(`${v.plate} checked into Workshop Maintenance.`, 'info');
                                  }}
                                  title="Send vehicle to workshop maintenance"
                                >
                                  🔧 Workshop
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
                        <td>{r.gateOutTime || (r.status === 'completed' ? '09:42 AM' : 'Pending')}</td>
                        <td>{r.gateInTime || (r.status === 'completed' ? '02:55 PM' : 'En Route')}</td>
                        <td>{r.odometerStart ? `${r.odometerStart.toLocaleString()} km` : '—'}</td>
                        <td>{r.odometerEnd ? `${r.odometerEnd.toLocaleString()} km` : '—'}</td>
                        <td><strong>{totalKm ? `${totalKm} km` : '—'}</strong></td>
                        <td>
                          <span className={`badge ${r.status === 'completed' ? 'success' : r.status === 'in_transit' ? 'info' : 'warn'}`}>
                            {r.status.toUpperCase()}
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
      {((isEmployee && employeeTab === 'chat_center') || (!isEmployee && activeAdminTab === 'chat_center')) && (
        <div className="flex h-[calc(100vh-140px)] min-h-[640px] w-full flex-col overflow-hidden rounded-2xl shadow-xl">
          <FleetChatCenter
            userRole={isEmployee ? 'employee' : 'admin'}
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
          setShowNewRequisitionModal(false);
          showToast(
            t(
              `✓ Duty Travel Requisition ${created.id} submitted! Transferred to Central Transport Admin for vehicle allocation.`,
              `✓ যানবাহন রিকুইজিশন ${created.id} দাখিল সম্পন্ন! পরিবহন প্রশাসকের নিকট প্রেরিত হয়েছে।`,
              lang
            ),
            'success'
          );
        }}
        lang={lang}
        currentUserName={isEmployee ? 'Tanvir Ahmed' : 'Engr. Harunur Rashid'}
        currentUserDept={isEmployee ? 'Sales & Distribution' : 'Plant Operations'}
      />

      {/* ─── MODAL 2: SMART POOLING CONSOLIDATION DIALOG (Admin only) ── */}
      {isTransportAdmin && showSmartPoolModal && (
        <div className="modal-bg" onClick={() => setShowSmartPoolModal(false)}>
          <div className="modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#FDE047" />
                  {t('AI Smart Pooling Route Consolidation', 'এআই কারপুলিং মার্জ কনফার্মেশন', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#BFDBFE' }}>
                  Dhaka Corporate HQ ➔ Keraniganj Bitumen Plant Transit Corridor
                </div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setShowSmartPoolModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', color: '#1E40AF' }}>
                💡 <strong>Optimization Rationale:</strong> Two requisitions depart within 15 minutes of each other on the identical corridor. Consolidating into a 7-seater executive microbus eliminates 1 duplicate vehicle deployment.
              </div>

              {/* Matched Requisitions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '10px', background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--brand-slate-900)' }}>REQ-2026-441 (Tanvir Ahmed)</div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>Sales & Distribution • 2 Pax</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', marginTop: '4px' }}>Departure: 02:30 PM</div>
                </div>

                <div style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '10px', background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px', color: 'var(--brand-slate-900)' }}>REQ-2026-443 (Engr. Mizanur)</div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>Quality Assurance • 1 Pax</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#1D4ED8', marginTop: '4px' }}>Departure: 02:45 PM</div>
                </div>
              </div>

              {/* Allocated Pooled Vehicle */}
              <div style={{ border: '1.5px solid #10B981', background: '#ECFDF5', padding: '12px 14px', borderRadius: '8px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#047857', fontWeight: 800, textTransform: 'uppercase' }}>
                  Recommended Shared Fleet Vehicle:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#065F46', marginTop: '2px' }}>
                  DHAKA METRO CHA-53-4102 — Toyota HiAce Super GL (7-Seater)
                </div>
                <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '2px' }}>
                  Driver: <strong>Abdul Mannan</strong> (📞 +880 1819-338811) • Sobriety: 0.00% BAC Passed
                </div>
              </div>

              {/* Financial & Environmental ROI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', fontSize: '11.5px' }}>
                <div style={{ background: '#F1F5F9', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748B' }}>Fuel Saved</div>
                  <strong style={{ color: '#059669', fontSize: '13px' }}>৳1,850</strong>
                </div>
                <div style={{ background: '#F1F5F9', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748B' }}>Transit Saved</div>
                  <strong style={{ color: '#2563EB', fontSize: '13px' }}>38 km</strong>
                </div>
                <div style={{ background: '#F1F5F9', padding: '8px', borderRadius: '6px' }}>
                  <div style={{ color: '#64748B' }}>Vehicle Preserved</div>
                  <strong style={{ color: '#D97706', fontSize: '13px' }}>1 Sedan</strong>
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowSmartPoolModal(false)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-gold" onClick={handleExecuteSmartPool}>
                <Check size={14} />
                {t('Confirm & Execute Pool Merger', 'মার্জ নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
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
        <div className="modal-bg" onClick={() => setCompletingReq(null)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#059669', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} />
                  {t('Complete Duty Trip & Reconcile Mileage', 'ট্রিপ সমাপ্তি ও ওডোমিটার হিসাব', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#D1FAE5' }}>Requisition: {completingReq.id} • Vehicle: {completingReq.assignedVehiclePlate}</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setCompletingReq(null)}>×</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 12px', borderRadius: '8px', fontSize: '12px' }}>
                <div>Start Odometer: <strong>{completingReq.odometerStart || 42350} km</strong></div>
                <div>Driver: <strong>{completingReq.assignedDriverName}</strong></div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  {t('Ending Odometer Reading (km)', 'সমাপ্তির ওডোমিটার রিডিং (কিমি)', lang)}
                </label>
                <input
                  type="number"
                  className="input-text"
                  style={{ width: '100%' }}
                  value={endOdometer}
                  onChange={(e) => setEndOdometer(Number(e.target.value))}
                />
                <div style={{ fontSize: '11px', color: '#059669', marginTop: '3px' }}>
                  Calculated Transit: <strong>{endOdometer - (completingReq.odometerStart || 42350)} km traveled</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  {t('Driver & Trip Service Rating (1 - 5 Stars)', 'ড্রাইভার রেটিং', lang)}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTripRating(star)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: tripRating >= star ? '1.5px solid #D4AF37' : '1px solid #CBD5E1',
                        background: tripRating >= star ? '#FEF3C7' : '#FFF',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: tripRating >= star ? '#B45309' : '#94A3B8'
                      }}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  {t('Passenger Feedback / Notes', 'মন্তব্য', lang)}
                </label>
                <input
                  type="text"
                  className="input-text"
                  style={{ width: '100%' }}
                  value={tripFeedback}
                  onChange={(e) => setTripFeedback(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setCompletingReq(null)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" style={{ background: '#059669' }} onClick={handleConfirmCompleteTrip}>
                <Check size={14} /> {t('Confirm Inward Clearance & Complete', 'ট্রিপ সমাপ্ত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: REJECT REQUISITION MODAL (Admin only) ─────────── */}
      {isTransportAdmin && rejectingReq && (
        <div className="modal-bg" onClick={() => setRejectingReq(null)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#B91C1C', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>{t('Reject Vehicle Requisition', 'রিকুইজিশন বাতিল', lang)}</h3>
                <div style={{ fontSize: '11px', color: '#FECACA' }}>Requisition: {rejectingReq.id}</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setRejectingReq(null)}>×</button>
            </div>

            <div className="modal-body">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                {t('Reason for Rejection / Unavailability:', 'বাতিল করার কারণ:', lang)}
              </label>
              <select
                className="input-select"
                style={{ width: '100%' }}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              >
                <option value="All pool sedans occupied for emergency refinery dispatch">All pool sedans occupied for emergency refinery dispatch</option>
                <option value="Non-official duty or insufficient advance notice">Non-official duty or insufficient advance notice</option>
                <option value="Recommending public commute / ride-share reimbursement">Recommending public commute / ride-share reimbursement</option>
                <option value="Driver rest quota hours exceeded for safety">Driver rest quota hours exceeded for safety</option>
              </select>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setRejectingReq(null)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" style={{ background: '#B91C1C' }} onClick={handleConfirmReject}>
                {t('Confirm Rejection', 'বাতিল নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: LIVE VEHICLE TRACKING HUD (Available to All) ──── */}
      {trackingReq && (
        <div className="modal-bg" onClick={() => setTrackingReq(null)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation size={18} color="#38BDF8" />
                  {t('Live Vehicle Telematics & Route Beacon', 'লাইভ ভেহিক্যাল ট্র্যাকিং', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{trackingReq.id} • {trackingReq.assignedVehiclePlate}</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setTrackingReq(null)}>×</button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{
                background: '#0B132B',
                color: '#fff',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase' }}>
                  GPS Satellite Beacon Synced
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px' }}>
                  48 km/h
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                  Location: Dhaka-Mawa Expressway near Babubazar Overpass
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '14px', fontSize: '11.5px' }}>
                  <span>ETA to Destination: <strong style={{ color: '#34D399' }}>18 mins</strong></span>
                  <span>Driver: <strong>{trackingReq.assignedDriverName}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => showToast(`Calling Driver ${trackingReq.assignedDriverName} (${trackingReq.assignedDriverPhone})...`, 'info')}
                >
                  <Phone size={14} /> Call Driver
                </button>
                <button
                  className="btn-outline"
                  style={{ flex: 1, justifyContent: 'center', borderColor: '#EF4444', color: '#EF4444' }}
                  onClick={() => showToast('SOS Dispatcher notified. Emergency vehicle en route.', 'info')}
                >
                  <AlertOctagon size={14} /> Emergency SOS
                </button>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setTrackingReq(null)}>{t('Close', 'বন্ধ করুন', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: OFFICIAL DIGITAL TRIP CHALLAN PASS ─────────────── */}
      {selectedTripPassReq && (
        <div className="modal-bg" onClick={() => setSelectedTripPassReq(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd" style={{ background: '#0F172A', color: '#fff' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0 }}>
                  {t('Official Vehicle Trip Challan & Security Gate Pass', 'অফিসিয়াল ট্রিপ চালান ও নিরাপত্তা গেট পাস', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#FDE68A' }}>Challan No: {selectedTripPassReq.tripPassNo}</div>
              </div>
              <button className="modal-close" style={{ color: '#fff' }} onClick={() => setSelectedTripPassReq(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ border: '2px solid var(--brand-slate-200)', padding: '18px', borderRadius: '6px', background: 'var(--brand-card-bg)' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid var(--brand-crimson)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--brand-crimson)', letterSpacing: '0.5px' }}>
                    BASHUNDHARA OIL AND GAS COMPANY LIMITED
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)' }}>Corporate Logistics & Security Gate Administration</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '4px', color: 'var(--brand-slate-900)' }}>
                    OFFICIAL DUTY TRAVEL CHALLAN PASS
                  </div>
                </div>

                <div className="responsive-col-2-eq" style={{ gap: '10px', fontSize: '11.5px', marginBottom: '14px' }}>
                  <div><strong>Pass Ref:</strong> {selectedTripPassReq.tripPassNo}</div>
                  <div><strong>Date of Issue:</strong> 22 Oct 2026</div>
                  <div><strong>Authorized Requester:</strong> {selectedTripPassReq.requesterName}</div>
                  <div><strong>Department:</strong> {selectedTripPassReq.dept}</div>
                  <div><strong>Assigned Vehicle:</strong> <span style={{ color: '#059669', fontWeight: 800 }}>{selectedTripPassReq.assignedVehiclePlate}</span></div>
                  <div><strong>Vehicle Model:</strong> {selectedTripPassReq.assignedVehicleModel}</div>
                  <div><strong>Assigned Driver:</strong> {selectedTripPassReq.assignedDriverName}</div>
                  <div><strong>Driver Contact:</strong> {selectedTripPassReq.assignedDriverPhone}</div>
                  <div><strong>Authorized Route:</strong> {selectedTripPassReq.from.split(',')[0]} ➔ {selectedTripPassReq.to.split(',')[0]}</div>
                  <div><strong>Trip Mode:</strong> {selectedTripPassReq.tripType === 'round_trip' ? 'Round Trip (Return Authorized)' : 'One-Way Drop-off'}</div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', fontSize: '11.5px', marginBottom: '14px' }}>
                  <strong>Official Duty Purpose:</strong> {selectedTripPassReq.purpose}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    Security Gate Clearance Barcode:<br />
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>*BOGCL-TRIP-{selectedTripPassReq.tripPassNo}*</span>
                    <div style={{ color: '#059669', fontWeight: 700, marginTop: '4px' }}>✓ Gate Outward Verified by Transport Admin</div>
                  </div>
                  <QrCode size={70} color="#0F172A" />
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button
                className="btn-outline"
                style={{ borderColor: '#3B82F6', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={() => {
                  const targetReq = selectedTripPassReq;
                  setSelectedTripPassReq(null);
                  setActiveChatReq(targetReq);
                }}
              >
                <MessageSquare size={14} />
                {t('Open Trip Chat', 'ট্রিপ চ্যাট খুলুন', lang)}
              </button>
              <button className="btn-sm-ghost" onClick={() => setSelectedTripPassReq(null)}>{t('Close', 'বন্ধ করুন', lang)}</button>
              <button
                className="btn-primary"
                onClick={() => {
                  window.print();
                  showToast(t(`Challan Pass ${selectedTripPassReq.tripPassNo} sent to printer.`, `চালান পাস প্রিন্টারে পাঠানো হয়েছে।`, lang), 'success');
                  setSelectedTripPassReq(null);
                }}
              >
                <Printer size={14} />
                {t('Print Official Trip Pass', 'ট্রিপ পাস প্রিন্ট করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 8: FUEL SLIP VOUCHER (Admin only) ─────────────────── */}
      {isTransportAdmin && showFuelModal && (
        <div className="modal-bg" onClick={() => setShowFuelModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hd">
              <h3>
                <Fuel size={18} />
                {t('Issue Digital Fuel Requisition Slip', 'ডিজিটাল ফুয়েল স্লিপ ইস্যু', lang)}
              </h3>
              <button className="modal-close" onClick={() => setShowFuelModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px', background: '#F8FAFC', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Vehicle</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-slate-900)', marginTop: '2px' }}>
                  {showFuelModal.plate}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--brand-slate-600)' }}>
                  {showFuelModal.model} • Driver: {showFuelModal.driverName} ({showFuelModal.driverPhone})
                </div>
              </div>

              <div className="form-group">
                <label>{t('Authorized Fuel Station / Pump', 'অনুমোদিত ফিলিং স্টেশন', lang)}</label>
                <select value={fuelStation} onChange={(e) => setFuelStation(e.target.value)}>
                  <option value="Bashundhara Filling Station, 300 Feet Road">Bashundhara Filling Station, 300 Feet Road</option>
                  <option value="Keraniganj Plant Dedicated Diesel Dispenser">Keraniganj Plant Dedicated Diesel Dispenser (In-House)</option>
                  <option value="Padma Oil Depot, Fatullah, Narayanganj">Padma Oil Depot, Fatullah, Narayanganj</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('Fuel Volume (Liters)', 'জ্বালানির পরিমাণ (লিটার)', lang)}</label>
                  <input
                    type="text"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>{t('Fuel Category', 'জ্বালানির ধরন', lang)}</label>
                  <select defaultValue="Octane">
                    <option value="Octane">Octane (Euro-4 Standard)</option>
                    <option value="Diesel">Diesel (Low Sulfur - Industrial)</option>
                    <option value="CNG">CNG Compressed Gas</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '11.5px', color: 'var(--status-warning)' }}>
                🔒 <strong>OTP Security:</strong> A 4-digit verification PIN and single-use QR Code will be sent to the driver. The pump operator will scan to validate before fuel dispensing.
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn-sm-ghost" onClick={() => setShowFuelModal(null)}>{t('Cancel', 'বাতিল', lang)}</button>
              <button className="btn-primary" onClick={confirmFuelSlip}>
                <QrCode size={14} />
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
      <TripChatModal
        isOpen={Boolean(activeChatReq)}
        onClose={() => setActiveChatReq(null)}
        requisition={activeChatReq}
        userRole={isEmployee ? 'employee' : isDriver ? 'driver' : 'admin'}
        lang={lang}
        onOpenFullDesk={(req) => {
          setActiveChatReq(null);
          setSelectedChatChannelId(req.id);
          if (isEmployee) setEmployeeTab('chat_center');
          else if (isDriver) setDriverTab('chat_center');
          else setActiveAdminTab('chat_center');
        }}
      />

      {/* ─── Fleet Logistics Notifications Drawer ──────────────────── */}
      <FleetNotificationsDrawer
        isOpen={showNotificationsDrawer}
        onClose={() => setShowNotificationsDrawer(false)}
        userRole={isEmployee ? 'employee' : 'admin'}
        lang={lang}
        onSelectRequisition={(reqId) => {
          const req = requisitions.find(r => r.id === reqId);
          if (req) setSelectedTripPassReq(req);
        }}
        onOpenChat={(reqId) => {
          setShowNotificationsDrawer(false);
          if (isEmployee) {
            setEmployeeTab('chat_center');
          } else {
            setActiveAdminTab('chat_center');
          }
        }}
      />
    </div>
  );
}
