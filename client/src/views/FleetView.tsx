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
          gap: '16px',
          marginBottom: isChatTabActive ? '8px' : '18px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ flex: '1 1 500px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
              <Car size={22} color="var(--brand-crimson)" aria-hidden />
              {isDriver
                ? t('Duty Driver Terminal & Mission Cockpit', 'ডিউটি ড্রাইভার টার্মিনাল ও ট্রিপ কন্ট্রোল', lang)
                : isEmployee
                ? t('My Official Vehicle Requisitions & Duty Travel Desk', 'আমার দাপ্তরিক যানবাহন আবেদন ও ট্রাভেল ডেস্ক', lang)
                : t('Fleet Command, Driver Pool & Requisition Dispatch Desk', 'যানবাহন বহর কমান্ড, চালক পুল ও ডেসপ্যাচ কন্ট্রোল রুম', lang)}
            </h2>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              {isDriver ? 'Driver Terminal' : isEmployee ? 'Staff Portal' : 'BOGCL Central Logistics'}
            </span>
            {!isEmployee && !isDriver && (
              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                {availableVehiclesCount} {t('Vehicles Ready', 'গাড়ি প্রস্তুত', lang)}
              </span>
            )}
          </div>
          {!isChatTabActive && (
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: 'var(--brand-slate-500)', lineHeight: 1.5 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
          {/* Fleet Notification Bell Button */}
          <button
            type="button"
            onClick={() => setShowNotificationsDrawer(prev => !prev)}
            title={t('Fleet Logistics Notifications', 'ফ্লিট নোটিফিকেশন', lang)}
            style={{
              height: '36px',
              padding: '0 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '9px',
              border: unreadNotifCount > 0 ? '1.5px solid #A51C30' : '1px solid #CBD5E1',
              backgroundColor: unreadNotifCount > 0 ? 'rgba(165, 28, 48, 0.06)' : '#FFFFFF',
              color: unreadNotifCount > 0 ? '#A51C30' : '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <Bell size={14} aria-hidden />
            <span>{t('Alerts', 'নোটিফিকেশন', lang)}</span>
            {unreadNotifCount > 0 && (
              <span style={{ backgroundColor: '#A51C30', color: '#fff', borderRadius: '999px', padding: '1px 6px', fontSize: '10.5px', fontWeight: 800 }}>
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
                  border: '1.5px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <Truck size={15} color="#D97706" aria-hidden />
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
                  border: '1.5px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <UserCheck size={15} color="#10B981" aria-hidden />
                <span>{t('Enroll Driver', 'চালক যুক্ত করুন', lang)}</span>
              </button>
            </>
          )}

          {/* New Requisition Button Available to Employees and Admins only */}
          {!isDriver && (
            <button
              type="button"
              onClick={() => setShowNewRequisitionModal(true)}
              style={{
                height: '36px',
                padding: '0 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '9px',
                border: 'none',
                background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(165, 28, 48, 0.35)',
              }}
            >
              <Plus size={15} aria-hidden />
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
        <div className="fleet-chat-desk-container">
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
                                <MessageSquare size={12} color="#2563EB" />
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
        <div className="fleet-chat-desk-container">
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
        <div className="modal-bg" onClick={() => setShowSmartPoolModal(false)} style={{ zIndex: 99999, padding: '20px', boxSizing: 'border-box' }}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '680px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#FFFFFF', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(15, 23, 42, 0.1)' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '18px 28px', background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color="#FDE047" />
                </div>
                <div>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '16px', fontWeight: 800 }}>
                    {t('AI Smart Pooling Route Consolidation', 'এআই কারপুলিং মার্জ কনফার্মেশন', lang)}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#BFDBFE', marginTop: '2px' }}>
                    Dhaka Corporate HQ ➔ Keraniganj Bitumen Plant Transit Corridor
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSmartPoolModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ flex: '1 1 auto', overflowY: 'auto', padding: '26px 30px', backgroundColor: '#FFFFFF', boxSizing: 'border-box' }}>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '14px 18px', borderRadius: '12px', marginBottom: '18px', fontSize: '12.5px', color: '#1E40AF', lineHeight: 1.5 }}>
                💡 <strong>Optimization Rationale:</strong> Two requisitions depart within 15 minutes of each other on the identical corridor. Consolidating into a 7-seater executive microbus eliminates 1 duplicate vehicle deployment.
              </div>

              {/* Matched Requisitions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '14px 16px', background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>REQ-2026-441 (Tanvir Ahmed)</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>Sales & Distribution • 2 Pax</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', marginTop: '6px' }}>Departure: 02:30 PM</div>
                </div>

                <div style={{ border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '14px 16px', background: '#F8FAFC' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>REQ-2026-443 (Engr. Mizanur)</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>Quality Assurance • 1 Pax</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1D4ED8', marginTop: '6px' }}>Departure: 02:45 PM</div>
                </div>
              </div>

              {/* Allocated Pooled Vehicle */}
              <div style={{ border: '1.5px solid #10B981', background: '#ECFDF5', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#047857', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recommended Shared Fleet Vehicle:
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#065F46', marginTop: '4px' }}>
                  DHAKA METRO CHA-53-4102 — Toyota HiAce Super GL (7-Seater)
                </div>
                <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>
                  Driver: <strong>Abdul Mannan</strong> (📞 +880 1819-338811) • Sobriety: <strong>0.00% BAC Passed</strong>
                </div>
              </div>

              {/* Financial & Environmental ROI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', fontSize: '12px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Fuel Saved</div>
                  <strong style={{ color: '#059669', fontSize: '15px', display: 'block', marginTop: '3px' }}>৳1,850</strong>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Transit Saved</div>
                  <strong style={{ color: '#2563EB', fontSize: '15px', display: 'block', marginTop: '3px' }}>38 km</strong>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>Vehicle Preserved</div>
                  <strong style={{ color: '#D97706', fontSize: '15px', display: 'block', marginTop: '3px' }}>1 Sedan</strong>
                </div>
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowSmartPoolModal(false)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={handleExecuteSmartPool}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)' }}
              >
                <Check size={15} />
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
        <div className="modal-bg" onClick={() => setCompletingReq(null)} style={{ zIndex: 99999, padding: '20px', boxSizing: 'border-box' }}>
          <div className="fleet-modal-dialog" style={{ maxWidth: '580px', width: '95%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#FFFFFF', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '18px 28px', background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800 }}>
                  <CheckCircle size={18} />
                  {t('Complete Duty Trip & Reconcile Mileage', 'ট্রিপ সমাপ্তি ও ওডোমিটার হিসাব', lang)}
                </h3>
                <div style={{ fontSize: '12px', color: '#D1FAE5', marginTop: '2px' }}>
                  Requisition: {completingReq.id} • Vehicle: {completingReq.assignedVehiclePlate}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletingReq(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px 16px', borderRadius: '10px', fontSize: '12.5px' }}>
                <div style={{ color: '#166534' }}>Start Odometer: <strong>{completingReq.odometerStart || 42350} km</strong></div>
                <div style={{ color: '#166534', marginTop: '3px' }}>Driver: <strong>{completingReq.assignedDriverName}</strong></div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {t('Ending Odometer Reading (km)', 'সমাপ্তির ওডোমিটার রিডিং (কিমি)', lang)}
                </label>
                <input
                  type="number"
                  className="notice-input"
                  value={endOdometer}
                  onChange={(e) => setEndOdometer(Number(e.target.value))}
                  style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px', fontWeight: 700 }}
                />
                <div style={{ fontSize: '12px', color: '#059669', marginTop: '6px', fontWeight: 600 }}>
                  Calculated Transit: <strong>{endOdometer - (completingReq.odometerStart || 42350)} km traveled</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase' }}>
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
                        border: tripRating >= star ? '1.5px solid #D97706' : '1px solid #CBD5E1',
                        background: tripRating >= star ? '#FEF3C7' : '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 800,
                        color: tripRating >= star ? '#B45309' : '#94A3B8',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {t('Passenger Feedback / Notes', 'মন্তব্য', lang)}
                </label>
                <input
                  type="text"
                  className="notice-input"
                  style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                  value={tripFeedback}
                  onChange={(e) => setTripFeedback(e.target.value)}
                />
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCompletingReq(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={handleConfirmCompleteTrip}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', background: '#059669', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)' }}
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
          <div className="fleet-modal-dialog" style={{ maxWidth: '500px', width: '95%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#FFFFFF', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '18px 28px', background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '16px', fontWeight: 800 }}>{t('Reject Vehicle Requisition', 'রিকুইজিশন বাতিল', lang)}</h3>
                <div style={{ fontSize: '12px', color: '#FECACA', marginTop: '2px' }}>Requisition: {rejectingReq.id}</div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                {t('Reason for Rejection / Unavailability:', 'বাতিল করার কারণ:', lang)}
              </label>
              <select
                className="notice-select"
                style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              >
                <option value="All pool sedans occupied for emergency refinery dispatch">All pool sedans occupied for emergency refinery dispatch</option>
                <option value="Non-official duty or insufficient advance notice">Non-official duty or insufficient advance notice</option>
                <option value="Recommending public commute / ride-share reimbursement">Recommending public commute / ride-share reimbursement</option>
                <option value="Driver rest quota hours exceeded for safety">Driver rest quota hours exceeded for safety</option>
              </select>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', background: '#DC2626', border: 'none', cursor: 'pointer' }}
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
          <div className="fleet-modal-dialog" style={{ maxWidth: '640px', width: '95%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#FFFFFF', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '18px 28px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800 }}>
                  <Navigation size={18} color="#38BDF8" />
                  {t('Live Vehicle Telematics & Route Beacon', 'লাইভ ভেহিক্যাল ট্র্যাকিং', lang)}
                </h3>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{trackingReq.id} • {trackingReq.assignedVehiclePlate}</div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingReq(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px' }}>
              <div style={{
                background: '#0B132B',
                color: '#fff',
                borderRadius: '14px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '18px',
                border: '1px solid #1E293B'
              }}>
                <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  GPS Satellite Beacon Synced
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px', letterSpacing: '-0.5px' }}>
                  48 km/h
                </div>
                <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px' }}>
                  Location: Dhaka-Mawa Expressway near Babubazar Overpass
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                  <span>ETA to Destination: <strong style={{ color: '#34D399' }}>18 mins</strong></span>
                  <span>Driver: <strong>{trackingReq.assignedDriverName}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  style={{ flex: 1, padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#0F172A', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => showToast(`Calling Driver ${trackingReq.assignedDriverName} (${trackingReq.assignedDriverPhone})...`, 'info')}
                >
                  <Phone size={15} color="#2563EB" /> Call Driver
                </button>
                <button
                  type="button"
                  style={{ flex: 1, padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #EF4444', backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => showToast('SOS Dispatcher notified. Emergency vehicle en route.', 'info')}
                >
                  <AlertOctagon size={15} /> Emergency SOS
                </button>
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setTrackingReq(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', cursor: 'pointer' }}
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
          <div className="fleet-modal-dialog" style={{ maxWidth: '780px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#FFFFFF', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '14px 28px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, color: '#0F172A', backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', padding: '3px 10px', borderRadius: '6px' }}>
                  Challan No: {selectedTripPassReq.tripPassNo}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 800, backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                  Security Gate Pass Verified
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTripPassReq(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '26px 32px', backgroundColor: '#F1F5F9', boxSizing: 'border-box' }}>
              <div className="fleet-letterhead-paper" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1.5px solid #CBD5E1', padding: '34px 38px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative' }}>
                {/* Watermark */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: '42px', fontWeight: 900, color: 'rgba(165, 28, 48, 0.035)', whiteSpace: 'nowrap', pointerEvents: 'none', letterSpacing: '4px', textTransform: 'uppercase', userSelect: 'none' }}>
                  BASHUNDHARA FLEET DISPATCH
                </div>

                {/* Company Header */}
                <div style={{ textAlign: 'center', paddingBottom: '18px', marginBottom: '22px', borderBottom: '2px solid #A51C30' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#A51C30', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>
                      B
                    </div>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 900, letterSpacing: '0.8px', color: '#0F172A', textTransform: 'uppercase' }}>
                      Bashundhara Oil & Gas Company Ltd.
                    </h2>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Corporate Logistics & Security Gate Administration
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#A51C30', marginTop: '4px', letterSpacing: '0.5px' }}>
                    OFFICIAL DUTY TRAVEL CHALLAN & SECURITY GATE PASS
                  </div>
                </div>

                {/* 2-Column Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '16px 20px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '12px', marginBottom: '18px' }}>
                  <div><strong style={{ color: '#64748B' }}>Pass Reference:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A' }}>{selectedTripPassReq.tripPassNo}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Date of Issue:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>22 Oct 2026</span></div>
                  <div><strong style={{ color: '#64748B' }}>Authorized Requester:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTripPassReq.requesterName}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Department:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTripPassReq.dept}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Assigned Vehicle:</strong> <span style={{ color: '#059669', fontWeight: 800 }}>{selectedTripPassReq.assignedVehiclePlate}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Vehicle Model:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTripPassReq.assignedVehicleModel}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Assigned Driver:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTripPassReq.assignedDriverName}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Driver Contact:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTripPassReq.assignedDriverPhone}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Authorized Route:</strong> <span style={{ fontWeight: 700, color: '#2563EB' }}>{selectedTripPassReq.from.split(',')[0]} ➔ {selectedTripPassReq.to.split(',')[0]}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Trip Mode:</strong> <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedTripPassReq.tripType === 'round_trip' ? 'Round Trip (Return Authorized)' : 'One-Way Drop-off'}</span></div>
                </div>

                {/* Purpose Block */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 16px', fontSize: '12.5px', color: '#334155', marginBottom: '18px' }}>
                  <strong style={{ color: '#64748B', display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}>Official Duty Purpose:</strong>
                  {selectedTripPassReq.purpose}
                </div>

                {/* Gate Clearance Barcode & QR Block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #E2E8F0', paddingTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Security Gate Clearance Barcode:</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', fontSize: '13px', marginTop: '2px' }}>*BOGCL-TRIP-{selectedTripPassReq.tripPassNo}*</div>
                    <div style={{ color: '#059669', fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>✓ Gate Outward Verified by Transport Admin</div>
                  </div>
                  <div style={{ padding: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                    <QrCode size={64} color="#0F172A" />
                  </div>
                </div>
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                style={{ padding: '9px 16px', borderRadius: '10px', border: '1.5px solid #3B82F6', color: '#1D4ED8', backgroundColor: '#EFF6FF', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  const targetReq = selectedTripPassReq;
                  setSelectedTripPassReq(null);
                  setActiveChatReq(targetReq);
                }}
              >
                <MessageSquare size={14} />
                {t('Open Trip Chat', 'ট্রিপ চ্যাট খুলুন', lang)}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTripPassReq(null)}
                  style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', cursor: 'pointer' }}
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', background: 'linear-gradient(135deg, #A51C30 0%, #871424 100%)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(165, 28, 48, 0.35)' }}
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
          <div className="fleet-modal-dialog" style={{ maxWidth: '580px', width: '95%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#FFFFFF', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div className="fleet-modal-hd" style={{ padding: '18px 28px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Fuel size={20} color="#F59E0B" />
                <h3 style={{ color: '#fff', margin: 0, fontSize: '16px', fontWeight: 800 }}>
                  {t('Issue Digital Fuel Requisition Slip', 'ডিজিটাল ফুয়েল স্লিপ ইস্যু', lang)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFuelModal(null)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="fleet-modal-body" style={{ padding: '24px 28px' }}>
              <div style={{ marginBottom: '18px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Target Vehicle</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                  {showFuelModal.plate}
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                  {showFuelModal.model} • Driver: <strong>{showFuelModal.driverName}</strong> ({showFuelModal.driverPhone})
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {t('Authorized Fuel Station / Pump', 'অনুমোদিত ফিলিং স্টেশন', lang)}
                </label>
                <select
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className="notice-select"
                  style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                >
                  <option value="Bashundhara Filling Station, 300 Feet Road">Bashundhara Filling Station, 300 Feet Road</option>
                  <option value="Keraniganj Plant Dedicated Diesel Dispenser">Keraniganj Plant Dedicated Diesel Dispenser (In-House)</option>
                  <option value="Padma Oil Depot, Fatullah, Narayanganj">Padma Oil Depot, Fatullah, Narayanganj</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    {t('Fuel Volume (Liters)', 'জ্বালানির পরিমাণ (লিটার)', lang)}
                  </label>
                  <input
                    type="text"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className="notice-input"
                    style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    {t('Fuel Category', 'জ্বালানির ধরন', lang)}
                  </label>
                  <select
                    defaultValue="Octane"
                    className="notice-select"
                    style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px' }}
                  >
                    <option value="Octane">Octane (Euro-4 Standard)</option>
                    <option value="Diesel">Diesel (Low Sulfur - Industrial)</option>
                    <option value="CNG">CNG Compressed Gas</option>
                  </select>
                </div>
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', color: '#92400E', lineHeight: 1.5 }}>
                🔒 <strong>OTP Security:</strong> A 4-digit verification PIN and single-use QR Code will be sent to the driver. The pump operator will scan to validate before fuel dispensing.
              </div>
            </div>

            <div className="fleet-modal-ft" style={{ padding: '16px 28px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowFuelModal(null)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#475569', backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', cursor: 'pointer' }}
              >
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                type="button"
                onClick={confirmFuelSlip}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', background: '#D97706', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)' }}
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
