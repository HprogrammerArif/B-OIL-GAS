import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ViewProps, ROLE_META, SYSTEM_TODAY, t } from '../types';
import { showToast } from '../components/ToastManager';
import { useCurrentUser } from '../auth/session';
import { nextRef } from '../lib/refs';
import { nowTime } from '../lib/clock';
import {
  Bus, Users, MapPin, CheckCircle, Clock, AlertTriangle,
  QrCode, UserMinus, UserPlus, Phone, Compass, BellRing,
  Navigation, CheckCheck, X, Shield, Smartphone, RefreshCw,
  Search, Filter, Calendar, ChevronRight, FileText,
  Printer, ArrowUpRight, CheckCircle2, UserCheck, Info,
  Fuel, Activity, Gauge, AlertCircle, Share2, Lock,
  ArrowUpDown, Send, Check, RotateCcw, Download, Tag, Radio,
  HelpCircle, AlertOctagon, Sun, Sunset, User, Ticket, DoorOpen, Flame
} from 'lucide-react';

import type { Seat, WaitlistEntry, RouteStop, RouteInfo, BusVehicle } from '../components/bus/busTypes';
export type { Seat, WaitlistEntry, RouteStop, RouteInfo, BusVehicle };

import { INITIAL_ROUTES, generateSeatsForRoute } from '../components/bus/busData';

function routeChipLabel(name: string): string {
  const [code, rest = ''] = name.split(':');
  const firstStop = rest.split('➔')[0]?.trim() ?? '';
  const pretty = code.replace('-', ' ').trim();
  return firstStop ? `${pretty} · ${firstStop}` : pretty;
}
import { useBusStore } from '../store/busStore';
import RegisterBusModal from '../components/bus/RegisterBusModal';
import RouteBuilderModal from '../components/bus/RouteBuilderModal';
import SupervisorSeatModal from '../components/bus/SupervisorSeatModal';
import ReassignBusRouteModal from '../components/bus/ReassignBusRouteModal';
import BusFleetOverviewGrid from '../components/bus/BusFleetOverviewGrid';

export default function BusView({ role, lang }: ViewProps) {
  const user = useCurrentUser();
  const canManageBus = !!user?.permissions.has('bus:manage');
  const canReadFleet = !!user?.permissions.has('bus:view_all');
  const fleetReadOnly = canReadFleet && !canManageBus;
  const [perspective, setActivePerspective] = useState<'staff' | 'supervisor'>(canManageBus || canReadFleet ? 'supervisor' : 'staff');
  const activePerspective = canManageBus ? perspective : (canReadFleet ? 'supervisor' : 'staff');
  useEffect(() => {
    if (canManageBus) setActivePerspective('supervisor');
  }, [canManageBus]);
  const [scanQuery, setScanQuery] = useState('');

  // Commute Direction & Date
  const [commuteDirection, setCommuteDirection] = useState<'inbound' | 'outbound'>('inbound');
  const [selectedDate, setSelectedDate] = useState<string>(SYSTEM_TODAY);

  // Bus fleet, routes, seat maps and waitlist are owned by busStore (shared + persisted)
  const {
    buses, routes, routeSeats, waitlist,
    setBuses, setRoutes, setRouteSeats, setSeatsForRoute, setWaitlist,
  } = useBusStore();

  // Supervisor deck sub-tab: 'fleet' (10-bus grid) vs 'seats' (52-seater layout)
  const [supervisorSubTab, setSupervisorSubTab] = useState<'fleet' | 'seats'>('fleet');

  // Routes & Seats State
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('route-1');
  const seats: Seat[] = routeSeats[selectedRouteKey] ?? [];

  // Seat setter scoped to the active route (writes through to the store)
  const setSeats = (action: React.SetStateAction<Seat[]>) => {
    setSeatsForRoute(selectedRouteKey, action);
  };

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(() => seats.find(s => s.num === 5) ?? seats[0] ?? null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'dossier' | 'fifo' | 'route' | 'driver' | 'roster'>('dossier');

  // Search & Highlighting State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrSeatTarget, setQrSeatTarget] = useState<Seat | null>(null);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [showVacateDialog, setShowVacateDialog] = useState<boolean>(false);
  const [showTimetableModal, setShowTimetableModal] = useState<boolean>(false);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [showManifestModal, setShowManifestModal] = useState<boolean>(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [seatNoteSent, setSeatNoteSent] = useState<Record<string, boolean>>({});
  const [dispatchSent, setDispatchSent] = useState(false);

  // Supervisor Dedicated Modals
  const [showRegisterBusModal, setShowRegisterBusModal] = useState<boolean>(false);
  const [showRouteBuilderModal, setShowRouteBuilderModal] = useState<boolean>(false);
  const [routeToEdit, setRouteToEdit] = useState<RouteInfo | null>(null);
  const [showSupervisorSeatModal, setShowSupervisorSeatModal] = useState<boolean>(false);
  const [showReassignBusModal, setShowReassignBusModal] = useState<boolean>(false);
  const [reassignBusTarget, setReassignBusTarget] = useState<BusVehicle | null>(null);

  // Form States
  const [vacateReason, setVacateReason] = useState<string>('Working from Corporate HQ Dhaka');
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    'Traffic Congestion Notice: 10-12 min delay near Babubazar Bridge due to flyover maintenance. Conductor notified.'
  );

  const currentStaffMeta = ROLE_META[role] || ROLE_META['employee'];

  // Direct Booking Form State
  const [bookForm, setBookForm] = useState({
    name: currentStaffMeta.name,
    staffId: currentStaffMeta.empId,
    dept: currentStaffMeta.label,
    phone: currentStaffMeta.phone,
    pickupPoint: 'Farmgate Overbridge',
    bookingType: 'shift_pass' as 'permanent' | 'shift_pass' | 'guest',
    commuterCategory: 'Employee Commute',
    bloodGroup: currentStaffMeta.bloodGroup || 'B+',
    targetSeatNum: 12,
  });

  // Seat Swap Target
  const [swapTargetNum, setSwapTargetNum] = useState<number>(6);

  // Route Alert Banner
  const [routeAlert, setRouteAlert] = useState<{
    active: boolean;
    type: 'info' | 'warning' | 'success';
    message: string;
    time: string;
  }>({
    active: false,
    type: 'info',
    message: '',
    time: ''
  });

  // Form for joining waitlist
  const [joinForm, setJoinForm] = useState({
    name: currentStaffMeta.name,
    staffId: currentStaffMeta.empId,
    dept: currentStaffMeta.label,
    phone: currentStaffMeta.phone,
    pickupPoint: 'Farmgate Overbridge',
    priority: 'Shift' as 'Shift' | 'Emergency' | 'Overtime',
    shift: 'Morning Shift (07:00 AM)',
  });

  useEffect(() => {
    setBookForm(prev => ({
      ...prev,
      name: currentStaffMeta.name,
      staffId: currentStaffMeta.empId,
      dept: currentStaffMeta.label,
      phone: currentStaffMeta.phone,
      bloodGroup: currentStaffMeta.bloodGroup || prev.bloodGroup,
    }));
    setJoinForm(prev => ({
      ...prev,
      name: currentStaffMeta.name,
      staffId: currentStaffMeta.empId,
      dept: currentStaffMeta.label,
      phone: currentStaffMeta.phone,
    }));
  }, [role, currentStaffMeta]);

  const isAnyModalOpen =
    showVacateDialog ||
    showJoinModal ||
    showQrModal ||
    showTimetableModal ||
    showScannerModal ||
    showBookModal ||
    showSwapModal ||
    showManifestModal ||
    showBroadcastModal ||
    showPolicyModal ||
    showRegisterBusModal ||
    showRouteBuilderModal ||
    showSupervisorSeatModal ||
    showReassignBusModal;

  useEffect(() => {
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnyModalOpen]);

  const activeRoute: RouteInfo = routes[selectedRouteKey] || routes['route-1'] || INITIAL_ROUTES['route-1'];
  const activeStops: RouteStop[] = commuteDirection === 'inbound' ? activeRoute.inboundStops : activeRoute.outboundStops;

  // Current logged-in user profile dynamically mapped to active role
  const mySeat = useMemo(
    () => seats.find(s => s.staffId === currentStaffMeta.empId) ?? null,
    [seats, currentStaffMeta.empId],
  );

  const isMySeatVacated = mySeat?.status === 'vacated';
  const myWaitlistEntry = waitlist.find(w => w.staffId === currentStaffMeta.empId);

  // Counts (active route)
  const occupiedCount = seats.filter(s => s.status === 'occupied').length;
  const vacatedCount = seats.filter(s => s.status === 'vacated').length;
  const emptyCount = seats.filter(s => s.status === 'empty').length;
  const boardedCount = seats.filter(s => s.status === 'occupied' && s.boarded).length;

  // Fleet-wide aggregate counts across all buses
  const fleetTotals = useMemo(() => {
    const totalBuses = buses.length;
    const totalCapacity = buses.reduce((sum, b) => sum + b.capacity, 0);
    let totalOccupied = 0;
    let totalVacated = 0;
    Object.values(routeSeats).forEach(rSeats => {
      totalOccupied += rSeats.filter(s => s.status === 'occupied').length;
      totalVacated += rSeats.filter(s => s.status === 'vacated').length;
    });
    const totalFree = Math.max(0, totalCapacity - totalOccupied);
    const pct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    return { totalBuses, totalCapacity, totalOccupied, totalVacated, totalFree, pct };
  }, [buses, routeSeats]);

  // Search filtering logic
  const filteredSearchSeats = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return seats.filter(s =>
      (s.assignedTo && s.assignedTo.toLowerCase().includes(q)) ||
      (s.staffId && s.staffId.toLowerCase().includes(q)) ||
      (s.dept && s.dept.toLowerCase().includes(q)) ||
      (s.pickupPoint && s.pickupPoint.toLowerCase().includes(q)) ||
      (s.bloodGroup && s.bloodGroup.toLowerCase().includes(q)) ||
      `#${s.num}` === q ||
      `${s.num}` === q
    );
  }, [seats, searchQuery]);

  // Employee Voluntary Seat Release Action
  const handleReleaseMySeat = () => {
    if (!mySeat) return;
    setSeats(prev => prev.map(s => {
      if (s.num === mySeat.num) {
        return {
          ...s,
          status: 'vacated',
          vacatedReason: vacateReason,
          boarded: false,
        };
      }
      return s;
    }));
    setShowVacateDialog(false);
    showToast(
      t(
        `Seat #${String(mySeat.num).padStart(2, '0')} voluntarily released for today. Candidate #${waitlist[0]?.rank || 1} will be promoted by Transport Cell.`,
        `আজকের জন্য ${mySeat.num} নম্বর আসন ছেড়ে দেওয়া হয়েছে। অপেক্ষমান সহকর্মীকে সুযোগ দেওয়ার জন্য ধন্যবাদ।`,
        lang
      ),
      'gold'
    );
  };

  // Employee Reclaim My Seat Action
  const handleReclaimMySeat = () => {
    if (!mySeat) return;
    setSeats(prev => prev.map(s => {
      if (s.num === mySeat.num) {
        return {
          ...s,
          assignedTo: currentStaffMeta.name,
          staffId: currentStaffMeta.empId,
          dept: currentStaffMeta.label,
          phone: currentStaffMeta.phone,
          pickupPoint: s.pickupPoint || 'Farmgate Overbridge',
          pickupTime: s.pickupTime || '07:18 AM',
          status: 'occupied',
          vacatedReason: undefined,
          isStandbyPromoted: false,
          boarded: true,
        };
      }
      return s;
    }));
    showToast(
      t(
        `Seat #${String(mySeat.num).padStart(2, '0')} successfully reclaimed! Your daily QR commute pass is restored.`,
        `${mySeat.num} নম্বর আসন পুনরায় আপনার নামে বহাল করা হয়েছে! কিউআর পাস সক্রিয়।`,
        lang
      ),
      'success'
    );
  };

  // Open Direct Booking Modal for a specific seat
  const handleOpenBookModal = (seat: Seat) => {
    setBookForm(prev => ({
      ...prev,
      targetSeatNum: seat.num,
      pickupPoint: activeStops[0]?.name || 'Farmgate Overbridge'
    }));
    setShowBookModal(true);
  };

  // Submit Direct Seat Reservation
  const handleBookSeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.name.trim() || !bookForm.phone.trim()) {
      showToast(t('Please provide passenger name and mobile number.', 'নাম ও মোবাইল নম্বর দিন।', lang), 'danger');
      return;
    }

    setSeats(prev => prev.map(s => {
      if (s.num === bookForm.targetSeatNum) {
        return {
          ...s,
          assignedTo: bookForm.name,
          staffId: bookForm.staffId || nextRef('GST'),
          dept: bookForm.dept,
          phone: bookForm.phone,
          pickupPoint: bookForm.pickupPoint,
          pickupTime: commuteDirection === 'inbound' ? '07:15 AM' : '05:15 PM',
          status: 'occupied',
          vacatedReason: undefined,
          bloodGroup: bookForm.bloodGroup,
          bookingType: bookForm.bookingType,
          boarded: false,
          isStandbyPromoted: false,
        };
      }
      return s;
    }));

    const newlyBookedSeat = seats.find(s => s.num === bookForm.targetSeatNum);
    if (newlyBookedSeat) {
      setSelectedSeat({
        ...newlyBookedSeat,
        assignedTo: bookForm.name,
        staffId: bookForm.staffId,
        dept: bookForm.dept,
        phone: bookForm.phone,
        status: 'occupied',
        pickupPoint: bookForm.pickupPoint,
      });
    }

    setShowBookModal(false);
    showToast(
      t(
        `✓ Seat #${bookForm.targetSeatNum} successfully reserved for ${bookForm.name}! Boarding pass issued.`,
        `✓ আসন #${bookForm.targetSeatNum} সফলভাবে সংরক্ষিত হয়েছে (${bookForm.name})!`,
        lang
      ),
      'gold'
    );
  };

  // Execute Seat Swap
  const handleExecuteSeatSwap = () => {
    const seatA = seats.find(s => s.num === (selectedSeat?.num || 5));
    const seatB = seats.find(s => s.num === swapTargetNum);

    if (!seatA || !seatB) {
      showToast(t('Invalid seat selection for swap.', 'সিট নির্বাচনে ত্রুটি হয়েছে।', lang), 'danger');
      return;
    }

    setSeats(prev => prev.map(s => {
      if (s.num === seatA.num) {
        return {
          ...s,
          assignedTo: seatB.assignedTo,
          staffId: seatB.staffId,
          dept: seatB.dept,
          phone: seatB.phone,
          pickupPoint: seatB.pickupPoint,
          bloodGroup: seatB.bloodGroup,
          status: seatB.status,
          boarded: seatB.boarded,
          bookingType: seatB.bookingType,
        };
      }
      if (s.num === seatB.num) {
        return {
          ...s,
          assignedTo: seatA.assignedTo,
          staffId: seatA.staffId,
          dept: seatA.dept,
          phone: seatA.phone,
          pickupPoint: seatA.pickupPoint,
          bloodGroup: seatA.bloodGroup,
          status: seatA.status,
          boarded: seatA.boarded,
          bookingType: seatA.bookingType,
        };
      }
      return s;
    }));

    setShowSwapModal(false);
    showToast(
      t(
        `Seat exchange confirmed: Seat #${seatA.num} (${seatA.assignedTo || 'Empty'}) ⇆ Seat #${seatB.num} (${seatB.assignedTo || 'Empty'}).`,
        `সিট বিনিময় সম্পন্ন হয়েছে: আসন #${seatA.num} ⇆ আসন #${seatB.num}।`,
        lang
      ),
      'info'
    );
  };

  // Staff Submitting Waitlist Application
  const handleJoinWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinForm.name.trim() || !joinForm.phone.trim()) {
      showToast(t('Please provide your name and phone number.', 'নাম ও ফোন নম্বর দিন।', lang), 'danger');
      return;
    }

    const newRank = waitlist.length + 1;
    const newEntry: WaitlistEntry = {
      rank: newRank,
      staffId: joinForm.staffId,
      name: joinForm.name,
      dept: joinForm.dept,
      pickupPoint: joinForm.pickupPoint,
      phone: joinForm.phone,
      joinedAt: nowTime(),
      priority: joinForm.priority,
      shift: joinForm.shift,
      isCurrentUser: true,
    };

    setWaitlist(prev => [...prev, newEntry]);
    setShowJoinModal(false);
    showToast(
      t(
        `Waitlist request logged! You are now #${newRank} in the FIFO queue for ${activeRoute.coachNo}.`,
        `অপেক্ষাতালিকায় আবেদন সফল! আপনি ফিফো লাইনে #${newRank} নম্বরে আছেন।`,
        lang
      ),
      'gold'
    );
  };

  // Staff Cancelling their own waitlist request
  const handleCancelMyWaitlist = () => {
    setWaitlist(prev => {
      const remaining = prev.filter(w => w.staffId !== currentStaffMeta.empId);
      return remaining.map((w, idx) => ({ ...w, rank: idx + 1 }));
    });
    showToast(t('Waitlist request cancelled.', 'অপেক্ষাতালিকা থেকে আবেদন প্রত্যাহার করা হয়েছে।', lang), 'info');
  };

  // SUPERVISOR ONLY: Auto-FIFO Batch Promotion Engine
  const handleSupervisorAutoFIFO = () => {
    const availableVacated = seats.filter(s => s.status === 'vacated');
    if (availableVacated.length === 0) {
      showToast(t('No vacated seats available for auto-promotion.', 'বরাদ্দযোগ্য কোনো ফাঁকা আসন নেই।', lang), 'warn');
      return;
    }
    if (waitlist.length === 0) {
      showToast(t('No candidates in waitlist.', 'অপেক্ষাতালিকায় কোনো প্রার্থী নেই।', lang), 'info');
      return;
    }

    const toPromote = Math.min(availableVacated.length, waitlist.length);
    const updatedSeats = [...seats];
    const promotedCandidates = waitlist.slice(0, toPromote);

    promotedCandidates.forEach((cand, idx) => {
      const targetSeat = availableVacated[idx];
      const seatIndex = updatedSeats.findIndex(s => s.num === targetSeat.num);
      if (seatIndex !== -1) {
        updatedSeats[seatIndex] = {
          ...updatedSeats[seatIndex],
          assignedTo: cand.name,
          staffId: cand.staffId,
          dept: cand.dept,
          phone: cand.phone,
          pickupPoint: cand.pickupPoint,
          pickupTime: commuteDirection === 'inbound' ? '07:22 AM (Standby)' : '05:15 PM (Standby)',
          status: 'occupied',
          vacatedReason: undefined,
          isStandbyPromoted: true,
          boarded: false,
        };
      }
    });

    setSeats(updatedSeats);
    setWaitlist(prev => {
      const remaining = prev.slice(toPromote);
      return remaining.map((w, idx) => ({ ...w, rank: idx + 1 }));
    });

    showToast(
      t(
        `Promoted ${toPromote} standby passengers to available seats. SMS passes sent.`,
        `ফিফো ক্রমানুসারে ${toPromote} জন প্রার্থীকে আসন বরাদ্দ দেওয়া হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  // SUPERVISOR ONLY: Manual allocate candidate to a specific seat
  const handleSupervisorManualAllocate = (candidate: WaitlistEntry, seatNum: number) => {
    setSeats(prev => prev.map(s => {
      if (s.num === seatNum) {
        return {
          ...s,
          assignedTo: candidate.name,
          staffId: candidate.staffId,
          dept: candidate.dept,
          phone: candidate.phone,
          pickupPoint: candidate.pickupPoint,
          pickupTime: commuteDirection === 'inbound' ? '07:25 AM (Standby)' : '05:15 PM (Standby)',
          status: 'occupied',
          vacatedReason: undefined,
          isStandbyPromoted: true,
          boarded: false,
        };
      }
      return s;
    }));

    setWaitlist(prev => {
      const remaining = prev.filter(w => w.staffId !== candidate.staffId);
      return remaining.map((w, idx) => ({ ...w, rank: idx + 1 }));
    });

    showToast(
      t(
        `Supervisor allocation: Seat #${seatNum} assigned to ${candidate.name}.`,
        `সুপারভাইজার অ্যাকশন: সিট #${seatNum} বরাদ্দ করা হয়েছে ${candidate.name}-কে।`,
        lang
      ),
      'gold'
    );
  };

  // Toggle passenger live boarding check-in status (Conductor / Supervisor)
  const handleToggleBoarding = (seatNum: number) => {
    setSeats(prev => prev.map(s => {
      if (s.num === seatNum) {
        const nextState = !s.boarded;
        return { ...s, boarded: nextState };
      }
      return s;
    }));
  };

  // Dispatch broadcast notice
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setRouteAlert({
      active: true,
      type: 'warning',
      message: broadcastMessage,
      time: nowTime()
    });
    setShowBroadcastModal(false);
    showToast(
      t(
        `Broadcast dispatched to all 52 passengers on ${activeRoute.coachNo} via SMS & App notification!`,
        `সকল ৫২ জন যাত্রীর মোবাইলে এসএমএস ও বিজ্ঞপ্তি পাঠানো হয়েছে!`,
        lang
      ),
      'gold'
    );
  };

  // Switch active route and load that route's seat map
  const handleSelectRoute = (routeKey: string) => {
    setSelectedRouteKey(routeKey);
    let targetSeats = routeSeats[routeKey];
    if (!targetSeats) {
      targetSeats = generateSeatsForRoute(routeKey, routes[routeKey]?.capacity || 52);
      setSeatsForRoute(routeKey, targetSeats);
    }
    setSelectedSeat(targetSeats[0] || null);
  };

  // Supervisor: List/Register New Bus
  const handleSaveNewBus = (newBus: BusVehicle) => {
    setBuses(prev => [newBus, ...prev]);
    if (!routeSeats[newBus.assignedRouteId]) {
      setRouteSeats(prev => ({
        ...prev,
        [newBus.assignedRouteId]: generateSeatsForRoute(newBus.assignedRouteId, newBus.capacity)
      }));
    }
    showToast(
      t(
        `✓ New Bus ${newBus.coachNo} (${newBus.plateNo}) registered & assigned to ${newBus.assignedRoadName}!`,
        `✓ নতুন বাস ${newBus.coachNo} সফলভাবে যুক্ত ও রুটে বরাদ্দ করা হয়েছে!`,
        lang
      ),
      'gold'
    );
  };

  // Supervisor: Save / Update Road Corridor & Timetable
  const handleSaveRoute = (updatedRoute: RouteInfo) => {
    const roadName = updatedRoute.name.split(':')[1]?.trim() || updatedRoute.name;
    setRoutes(prev => ({
      ...prev,
      [updatedRoute.id]: updatedRoute,
    }));
    setBuses(prev => prev.map(b => {
      if (b.id !== updatedRoute.busId) return b;
      return {
        ...b,
        assignedRouteId: updatedRoute.id,
        assignedRoadName: roadName,
        driverName: updatedRoute.driverName,
        driverPhone: updatedRoute.driverPhone,
        conductorName: updatedRoute.conductorName,
        conductorPhone: updatedRoute.conductorPhone,
      };
    }));
    showToast(
      t(
        'Route saved. This bus now runs it.',
        'রুট সেভ হয়েছে। এই বাস এখন সেটি চালাবে।',
        lang,
      ),
      'gold',
    );
  };

  // Supervisor: Save Custom Seat Reservation for Specific Employee
  const handleSupervisorSaveSeat = (updatedSeat: Seat) => {
    setSeats(prev => prev.map(s => (s.num === updatedSeat.num ? updatedSeat : s)));
    if (selectedSeat?.num === updatedSeat.num) {
      setSelectedSeat(updatedSeat);
    }
    showToast(
      t(
        `✓ Supervisor: Seat #${updatedSeat.num} reserved for ${updatedSeat.assignedTo || 'Unassigned'} (${updatedSeat.category})!`,
        `✓ সুপারভাইজার: সিট #${updatedSeat.num} সংরক্ষিত করা হয়েছে (${updatedSeat.assignedTo})!`,
        lang
      ),
      'gold'
    );
  };

  // Supervisor: Vacate a seat for standby promotion
  const handleSupervisorVacateSeat = (seatNum: number, reason: string) => {
    setSeats(prev => prev.map(s => s.num === seatNum ? {
      ...s,
      status: 'vacated',
      vacatedReason: reason,
      boarded: false,
    } : s));
    showToast(t(`Seat #${seatNum} placed into FIFO standby pool.`, `সিট #${seatNum} স্ট্যান্ডবাই পুলে পাঠানো হয়েছে।`, lang), 'gold');
  };

  // Supervisor: Clear a seat back to empty
  const handleSupervisorClearSeat = (seatNum: number) => {
    setSeats(prev => prev.map(s => s.num === seatNum ? {
      ...s,
      assignedTo: null,
      staffId: undefined,
      dept: null,
      phone: undefined,
      pickupPoint: undefined,
      status: 'empty',
      vacatedReason: undefined,
      boarded: false,
      isStandbyPromoted: false,
    } : s));
    showToast(t(`Seat #${seatNum} reset to empty state.`, `সিট #${seatNum} খালি করা হয়েছে।`, lang), 'info');
  };

  const roadNameOf = (route: RouteInfo) => route.name.split(':')[1]?.trim() || route.name;

  const handleReassignBusRoute = (busId: string, newRouteId: string): boolean => {
    const bus = buses.find(b => b.id === busId);
    const targetRoute = routes[newRouteId];
    if (!bus || !targetRoute || bus.assignedRouteId === newRouteId) return false;

    const booked = (list: Seat[] | undefined) => (list ?? []).filter(s => s.status === 'occupied').length;
    const targetBooked = booked(routeSeats[newRouteId]);
    if (targetBooked > bus.capacity) {
      showToast(
        t(
          `That route has ${targetBooked} people booked. This bus has ${bus.capacity} seats.`,
          `ওই রুটে ${targetBooked} জন বুক করা। এই বাসে ${bus.capacity}টি আসন।`,
          lang,
        ),
        'warn',
      );
      return false;
    }

    const sourceRouteId = bus.assignedRouteId;
    const sourceRoute = routes[sourceRouteId];
    const displaced = buses.find(b => b.id !== bus.id && b.assignedRouteId === newRouteId);
    const sourceBooked = booked(routeSeats[sourceRouteId]);
    if (displaced && sourceBooked > displaced.capacity) {
      showToast(
        t(
          `The coach already on that route has ${displaced.capacity} seats, and this route has ${sourceBooked} people booked.`,
          `ওই রুটের বর্তমান বাসে ${displaced.capacity}টি আসন, আর এই রুটে ${sourceBooked} জন বুক করা।`,
          lang,
        ),
        'warn',
      );
      return false;
    }

    setBuses(prev => prev.map(b => {
      if (b.id === bus.id) {
        return { ...b, assignedRouteId: newRouteId, assignedRoadName: roadNameOf(targetRoute) };
      }
      if (displaced && b.id === displaced.id && sourceRoute) {
        return { ...b, assignedRouteId: sourceRouteId, assignedRoadName: roadNameOf(sourceRoute) };
      }
      return b;
    }));
    setRoutes(prev => {
      const next = { ...prev };
      next[newRouteId] = {
        ...targetRoute,
        busId: bus.id,
        coachNo: bus.coachNo,
        model: bus.model,
        capacity: bus.capacity,
        driverName: bus.driverName,
        driverPhone: bus.driverPhone,
        conductorName: bus.conductorName,
        conductorPhone: bus.conductorPhone,
      };
      if (displaced && sourceRoute) {
        next[sourceRouteId] = {
          ...sourceRoute,
          busId: displaced.id,
          coachNo: displaced.coachNo,
          model: displaced.model,
          capacity: displaced.capacity,
          driverName: displaced.driverName,
          driverPhone: displaced.driverPhone,
          conductorName: displaced.conductorName,
          conductorPhone: displaced.conductorPhone,
        };
      }
      return next;
    });
    showToast(
      t(
        `${bus.coachNo} now runs ${targetRoute.name}.`,
        `${bus.coachNo} এখন ${targetRoute.nameBn || targetRoute.name} চালাবে।`,
        lang,
      ),
      'gold',
    );
    return true;
  };

  return (
    <div className="view-container view-transition-wrapper">
      {/* ─── Top Header with Perspective Switcher & Enterprise Quick Tools ── */}
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bus size={21} color="var(--brand-crimson)" />
              {t('Staff Shuttle Buses & Seats', 'স্টাফ শাটল বাস ও সিট রিজার্ভেশন', lang)}
            </h2>
            <span className="badge gold" style={{ fontSize: '10px' }}>
              {selectedDate === SYSTEM_TODAY ? t('Today (29 Oct)', 'আজ (২৯ অক্টোবর)', lang) : selectedDate}
            </span>
          </div>
          <p className="section-subtitle" style={{ marginTop: '4px' }}>
            {fleetReadOnly
              ? t(
                  'Who holds a seat on each staff coach. Transport changes the buses, routes, and seats.',
                  'কোন স্টাফ কোন কোচে আসন ধরে আছে। বাস, রুট ও আসন পরিবর্তন করেন পরিবহন।',
                  lang,
                )
              : t(
                  'Seat map for each staff coach, seat booking, standby waitlist, route timetable and gate manifest.',
                  '৫২-সিটার বাস সিট ম্যাপ, তাৎক্ষণিক আসন বুকিং, স্বয়ংক্রিয় অপেক্ষমাণ তালিকা ও নিরাপত্তা গেট পাস।',
                  lang,
                )}
          </p>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Commute Direction Switcher */}
          <div style={{
            background: 'var(--brand-slate-100)',
            padding: '3px',
            borderRadius: '8px',
            display: 'inline-flex',
            width: 'max-content',
            maxWidth: '100%',
            border: '1px solid var(--brand-slate-300)'
          }}>
            <button
              type="button"
              onClick={() => {
                setCommuteDirection('inbound');
                showToast(t('Switched to Morning Inbound Shift (City → Plant Gate-1)', 'সকালের শিফট (শহর → প্ল্যান্ট)', lang), 'info');
              }}
              style={{
                background: commuteDirection === 'inbound' ? 'var(--surface-1)' : 'transparent',
                color: commuteDirection === 'inbound' ? 'var(--brand-slate-900)' : 'var(--brand-slate-500)',
                border: 'none',
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: commuteDirection === 'inbound' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
              title="City to Plant Morning Shift"
            >
              <Sun size={12} color="var(--status-warning)" />
              <span>{t('Morning Inbound', 'সকাল শিফট', lang)}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCommuteDirection('outbound');
                showToast(t('Switched to Evening Outbound Return (Plant Gate-1 → City)', 'সন্ধ্যার ফিরতি শিফট (প্ল্যান্ট → শহর)', lang), 'info');
              }}
              style={{
                background: commuteDirection === 'outbound' ? 'var(--surface-1)' : 'transparent',
                color: commuteDirection === 'outbound' ? 'var(--brand-slate-900)' : 'var(--brand-slate-500)',
                border: 'none',
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: commuteDirection === 'outbound' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
              title="Plant to City Evening Return"
            >
              <Sunset size={12} color="var(--status-info)" />
              <span>{t('Evening Return', 'সন্ধ্যা ফিরতি', lang)}</span>
            </button>
          </div>

          {activePerspective === 'supervisor' && (
            <div style={{
              background: 'var(--brand-slate-100)',
              padding: '3px',
              borderRadius: '8px',
              display: 'inline-flex',
              width: 'max-content',
              maxWidth: '100%',
              border: '1px solid var(--brand-slate-300)'
            }}>
              <button
                type="button"
                onClick={() => setSupervisorSubTab('fleet')}
                style={{
                  background: supervisorSubTab === 'fleet' ? 'var(--surface-1)' : 'transparent',
                  color: supervisorSubTab === 'fleet' ? 'var(--brand-slate-900)' : 'var(--brand-slate-500)',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: supervisorSubTab === 'fleet' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Bus size={12} />
                <span>{t('Routes', 'রুট', lang)}</span>
              </button>
              <button
                type="button"
                onClick={() => setSupervisorSubTab('seats')}
                style={{
                  background: supervisorSubTab === 'seats' ? 'var(--surface-1)' : 'transparent',
                  color: supervisorSubTab === 'seats' ? 'var(--brand-slate-900)' : 'var(--brand-slate-500)',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: supervisorSubTab === 'seats' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Users size={12} />
                <span>{t('This coach', 'এই কোচ', lang)}</span>
              </button>
            </div>
          )}

          {canManageBus && (
            <div style={{
              background: 'var(--brand-slate-100)',
              padding: '3px',
              borderRadius: '8px',
              display: 'inline-flex',
              width: 'max-content',
              maxWidth: '100%',
              border: '1px solid var(--brand-slate-300)'
            }}>
              <button
                type="button"
                onClick={() => setActivePerspective('staff')}
                style={{
                  background: activePerspective === 'staff' ? 'var(--surface-1)' : 'transparent',
                  color: activePerspective === 'staff' ? 'var(--brand-slate-900)' : 'var(--brand-slate-500)',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: activePerspective === 'staff' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <User size={12} />
                <span>{t('Staff View', 'স্টাফ ভিউ', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePerspective('supervisor')}
                style={{
                  background: activePerspective === 'supervisor' ? 'var(--brand-gold)' : 'transparent',
                  color: activePerspective === 'supervisor' ? 'var(--text-1)' : 'var(--brand-slate-500)',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: activePerspective === 'supervisor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Shield size={12} />
                <span>{t('Supervisor Deck', 'সুপারভাইজার', lang)}</span>
              </button>
            </div>
          )}

          {/* Security Gate Manifest — hidden from the HR read of the fleet */}
          {!fleetReadOnly && (
          <button type="button" className="btn-outline" onClick={() => setShowManifestModal(true)} title="Security Gate Commuter Manifest">
            <FileText size={13} /> {t('Gate Manifest', 'গেট পাস তালিকা', lang)}
          </button>
          )}

          {/* Conductor Scanner */}
          {canManageBus && (
            <button type="button" className="btn-outline" onClick={() => setShowScannerModal(true)}>
              <Smartphone size={13} /> {t('Conductor Scanner', 'স্ক্যানার', lang)}
            </button>
          )}

          {/* Timetable */}
          <button type="button" className="btn-outline" onClick={() => setShowTimetableModal(true)}>
            <Calendar size={13} /> {t('Timetable', 'সময়সূচী', lang)}
          </button>

          {canManageBus && (
            <>
              <button type="button" className="btn-outline" onClick={() => setShowRegisterBusModal(true)}>
                <UserPlus size={13} /> {t('Add Bus', 'নতুন বাস', lang)}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  setRouteToEdit(activeRoute);
                  setShowRouteBuilderModal(true);
                }}
              >
                <MapPin size={13} /> {t('Edit Route & Stops', 'রুট ও স্টপ', lang)}
              </button>
              <button type="button" className="btn-outline" onClick={() => setShowSupervisorSeatModal(true)}>
                <UserCheck size={13} /> {t('Assign Seat', 'সিট বরাদ্দ', lang)}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  const b = buses.find(x => x.assignedRouteId === selectedRouteKey) || buses[0];
                  setReassignBusTarget(b);
                  setShowReassignBusModal(true);
                }}
              >
                <RefreshCw size={13} /> {t('Reassign Bus', 'বাস পরিবর্তন', lang)}
              </button>
              <button type="button" className="btn-outline" onClick={() => setShowBroadcastModal(true)}>
                <Send size={13} /> {t('Broadcast Notice', 'বিজ্ঞপ্তি', lang)}
              </button>
              <button type="button" className="btn-outline" onClick={handleSupervisorAutoFIFO}>
                <UserPlus size={13} /> {t('Promote Standby', 'স্ট্যান্ডবাই পদোন্নতি', lang)}
              </button>
            </>
          )}

          {/* My Boarding Pass */}
          {mySeat && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setQrSeatTarget(mySeat);
                setShowQrModal(true);
              }}
            >
              <QrCode size={13} /> {t('My Boarding Pass', 'বোর্ডিং পাস', lang)}
            </button>
          )}
        </div>
      </div>

      {/* ── One-sentence status line (replaces 4 KPI cards & stacked admin banners) ── */}
      <div className="lv-status" style={{ marginBottom: '12px' }}>
        <span className={`lv-status-dot ${waitlist.length > 0 && vacatedCount > 0 ? 'warn' : 'ok'}`} />
        <span className="lv-status-text">
          {t(
            `${fleetTotals.totalBuses} staff coaches running across ${fleetTotals.totalBuses} routes today — ${fleetTotals.totalOccupied} of ${fleetTotals.totalCapacity} seats booked (${fleetTotals.pct}%), ${fleetTotals.totalFree} seats free`,
            `আজ ${fleetTotals.totalBuses}টি রুটে ${fleetTotals.totalBuses}টি স্টাফ বাস চলছে — ${fleetTotals.totalCapacity}টি আসনের মধ্যে ${fleetTotals.totalOccupied}টি বুককৃত (${fleetTotals.pct}%), ${fleetTotals.totalFree}টি আসন খালি`,
            lang,
          )}
          {waitlist.length > 0 && (
            <>
              {' · '}
              <strong style={{ color: 'var(--status-warning-text)' }}>
                {t(
                  `${waitlist.length} staff waiting in standby queue`,
                  `${waitlist.length} জন স্ট্যান্ডবাই তালিকায় অপেক্ষমাণ`,
                  lang,
                )}
              </strong>
            </>
          )}
          {'.'}
        </span>
      </div>

      {/* ─── Live Transit Notice / Incident Broadcast Bar ───────────── */}
      {routeAlert.active && (
        <div style={{
          background: routeAlert.type === 'warning' ? 'var(--status-warning-bg)' : 'rgba(59, 130, 246, 0.08)',
          border: routeAlert.type === 'warning' ? '1px solid var(--status-warning-bright)' : '1px solid rgba(59, 130, 246, 0.25)',
          padding: '8px 14px',
          borderRadius: '10px',
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: routeAlert.type === 'warning' ? 'var(--status-warning-text)' : 'var(--brand-slate-800)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {routeAlert.type === 'warning' ? <AlertTriangle size={15} color="var(--status-warning)" /> : <Info size={15} color="var(--status-info)" />}
            <div>
              <strong>{t('Route notice:', 'রুট বিজ্ঞপ্তি:', lang)}</strong>{' '}
              {routeAlert.message}{' '}
              <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginLeft: '6px' }}>({routeAlert.time})</span>
            </div>
          </div>
          {activePerspective === 'supervisor' && canManageBus && (
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: '10.5px', padding: '3px 8px', borderColor: 'var(--brand-gold)', color: 'var(--status-warning-text)' }}
              onClick={() => setShowBroadcastModal(true)}
            >
              <Send size={11} /> {t('Broadcast Notice', 'বিজ্ঞপ্তি পাঠান', lang)}
            </button>
          )}
        </div>
      )}

      {/* ─── Staff reminder. Company readers use the light Routes / This coach switch in the header. ── */}
      {activePerspective === 'staff' && (
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
            <Lock size={15} color="var(--status-info)" />
            <div>
              {t(
                'See seat availability, book a free seat, release or reclaim your seat for a day, and request a seat swap.',
                'আসনের প্রাপ্যতা দেখুন, খালি আসন বুক করুন, একদিনের জন্য আসন ছাড়ুন বা ফেরত নিন এবং আসন বদলের আবেদন করুন।',
                lang
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-outline"
            style={{ fontSize: '10.5px', padding: '3px 8px' }}
            onClick={() => setShowPolicyModal(true)}
          >
            <HelpCircle size={12} /> {t('Transit Rules', 'যাতায়াত নিয়মাবলী', lang)}
          </button>
        </div>
      )}

      {/* ─── Conditionally Render: Fleet Overview Grid vs. Coach Fuselage View ─── */}
      {activePerspective === 'supervisor' && supervisorSubTab === 'fleet' ? (
        <BusFleetOverviewGrid
          buses={buses}
          routes={routes}
          routeSeats={routeSeats}
          selectedRouteKey={selectedRouteKey}
          onSelectRoute={(routeId: string) => {
            handleSelectRoute(routeId);
            setSupervisorSubTab('seats');
          }}
          onOpenAddBus={() => setShowRegisterBusModal(true)}
          onOpenRouteBuilder={(route?: RouteInfo) => {
            setRouteToEdit(route || activeRoute);
            setShowRouteBuilderModal(true);
          }}
          onOpenReassign={() => {
            const b = buses.find(x => x.assignedRouteId === selectedRouteKey) || buses[0];
            setReassignBusTarget(b);
            setShowReassignBusModal(true);
          }}
          onOpenSupervisorSeat={(routeKey: string) => {
            handleSelectRoute(routeKey);
            setShowSupervisorSeatModal(true);
          }}
          readOnly={fleetReadOnly}
          lang={lang}
        />
      ) : (
        <>
          {activePerspective === 'staff' && mySeat && (
            <div className="card mb-3" style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '13px', color: 'var(--brand-slate-800)' }}>
                  <strong>
                    {t(`Your seat is #${String(mySeat.num).padStart(2, '0')}`, `আপনার আসন #${String(mySeat.num).padStart(2, '0')}`, lang)}
                  </strong>
                  {' · '}
                  {mySeat.pickupPoint}
                  {' · '}
                  {commuteDirection === 'inbound'
                    ? mySeat.pickupTime
                    : (activeRoute.outboundStops.find(s => s.name === mySeat.pickupPoint)?.scheduledTime ?? '—')}
                  {isMySeatVacated ? ` · ${t('Released today', 'আজ ছাড়া', lang)}` : ''}
                </div>
                {isMySeatVacated ? (
                  <button type="button" className="btn-outline" onClick={handleReclaimMySeat}>
                    <UserPlus size={13} /> {t('Reclaim', 'পুনরুদ্ধার', lang)}
                  </button>
                ) : (
                  <button type="button" className="btn-outline" onClick={() => setShowVacateDialog(true)}>
                    <UserMinus size={13} /> {t('Release', 'ছেড়ে দিন', lang)}
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="shuttle-coach">
              {t('Coach', 'কোচ', lang)}
            </label>
            <select
              id="shuttle-coach"
              value={selectedRouteKey}
              onChange={e => handleSelectRoute(e.target.value)}
            >
              {Object.values(routes).map((route: RouteInfo) => (
                <option key={route.id} value={route.id}>
                  {routeChipLabel(route.name)}
                </option>
              ))}
            </select>
            {(() => {
              const stops = commuteDirection === 'inbound' ? activeRoute.inboundStops : activeRoute.outboundStops;
              const first = stops[0];
              const last = stops[stops.length - 1];
              return (
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--brand-slate-600)' }}>
                  {first
                    ? t(
                        `Leaves ${first.scheduledTime} from ${first.name}. Arrives ${last?.scheduledTime ?? '—'}.`,
                        `${first.scheduledTime}-এ ${first.name} থেকে ছাড়ে। ${last?.scheduledTime ?? '—'}-এ পৌঁছায়।`,
                        lang,
                      )
                    : '—'}
                </div>
              );
            })()}
          </div>

      {/* ─── 2-Column Master-Cockpit Layout ──────────────────────────── */}
      <div className="bus-two-col-layout">
        {/* LEFT COLUMN: 52-Seater Coach Cabin Deck */}
        <div className="card">
          <div className="card-hd" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
            <div className="card-hd-left">
              <div className="card-hd-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--brand-gold)' }}>
                <Bus size={18} />
              </div>
              <div>
                <div className="card-title">
                  {t('Seat map', 'সিট ম্যাপ', lang)}
                </div>
                <div className="card-subtitle">
                  {activeRoute.coachNo}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 0 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--brand-slate-400)' }} />
                <input
                  type="text"
                  className="input-text"
                  style={{ width: '100%', paddingLeft: '32px', height: '32px', fontSize: '12px' }}
                  placeholder={t('Search by name', 'নাম দিয়ে খুঁজুন', lang)}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('Clear search', 'খোঁজ মুছুন', lang)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '7px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--brand-slate-400)'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {searchQuery.trim() && (
                <span style={{ fontSize: '11px', color: 'var(--brand-slate-600)', whiteSpace: 'nowrap' }}>
                  {filteredSearchSeats.length} {t('seats highlighted', 'সিট হাইলাইট করা হয়েছে', lang)}
                </span>
              )}
            </div>
            {(canManageBus || activePerspective === 'staff') && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ fontSize: '11px', padding: '5px 12px' }}
                  onClick={() => {
                    const firstEmpty = seats.find(s => s.status === 'empty') || seats.find(s => s.status === 'vacated') || seats[11];
                    handleOpenBookModal(firstEmpty);
                  }}
                >
                  <UserPlus size={13} /> {t('Book / Reserve Empty Seat', 'খালি সিট বুক করুন', lang)}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                  onClick={() => {
                    setSelectedSeat(seats.find(s => s.num === 5) || seats[4]);
                    setShowSwapModal(true);
                  }}
                >
                  <ArrowUpDown size={13} /> {t('Request Seat Swap', 'সিট সোয়াপ আবেদন', lang)}
                </button>
              </div>
            )}
          </div>

          <div className="card-body" style={{ padding: '16px' }}>
            {/* Visual Bus Fuselage Container */}
            <div className="bus-fuselage-frame">
              {/* Front Cabin Windshield with Driver & Pneumatic Door */}
              <div className="bus-windshield-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={16} color="var(--brand-gold)" />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {t('FRONT OF COACH', 'বাসের সামনের অংশ', lang)}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{t('Driver', 'চালক', lang)}: {activeRoute.driverName}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--status-success)', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', color: 'var(--status-success-bright)', fontWeight: 700 }}>
                  <DoorOpen size={12} />
                  <span>{t('DOOR 1', 'গেট ১', lang)}</span>
                </div>
              </div>

              {/* Rows 1 to 13 Seat Matrix (2 Left + Walkway Aisle + 2 Right) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Array.from({ length: 13 }, (_, i) => i + 1).map(rowNum => {
                  const rowSeats = seats.filter(s => s.row === rowNum);
                  const leftWin = rowSeats.find(s => s.col === 'left_win');
                  const leftAisle = rowSeats.find(s => s.col === 'left_aisle');
                  const rightAisle = rowSeats.find(s => s.col === 'right_aisle');
                  const rightWin = rowSeats.find(s => s.col === 'right_win');

                  const renderSeatBox = (s?: Seat) => {
                    if (!s) return <div style={{ width: '54px', height: '52px' }} />;

                    const isSelected = selectedSeat?.num === s.num;
                    const isVacated = s.status === 'vacated';
                    const isOccupied = s.status === 'occupied';
                    const isEmpty = s.status === 'empty';
                    const isMine = mySeat?.num === s.num;
                    const isBoarded = s.boarded;

                    // Match active filter
                    const matchesSearch =
                      !searchQuery.trim() ||
                      filteredSearchSeats.some(fs => fs.num === s.num);

                    const cellClasses = [
                      'bus-seat-cell',
                      isVacated ? 'vacated' : '',
                      isOccupied ? 'occupied' : '',
                      isEmpty ? 'empty' : '',
                      isMine ? 'mine' : '',
                      isSelected ? 'selected' : '',
                    ].filter(Boolean).join(' ');

                    // Formatted short name (e.g. "Tanvir A.", "Harunur R.")
                    const shortName = s.assignedTo
                      ? s.assignedTo.split(' ').length > 1
                        ? `${s.assignedTo.split(' ')[0]} ${s.assignedTo.split(' ')[1]?.[0] || ''}.`
                        : s.assignedTo
                      : isEmpty
                      ? 'EMPTY'
                      : 'FREE';

                    return (
                      <div
                        key={s.num}
                        className={cellClasses}
                        style={{
                          opacity: matchesSearch ? 1 : 0.22,
                          transform: matchesSearch && searchQuery ? 'scale(1.05)' : undefined,
                          boxShadow: matchesSearch && searchQuery ? '0 0 10px var(--status-info)' : undefined,
                          borderColor: matchesSearch && searchQuery ? 'var(--status-info)' : undefined
                        }}
                        onClick={() => setSelectedSeat(s)}
                        title={`Seat #${s.num} — ${s.assignedTo || 'Empty'} (${s.status})`}
                      >
                        {isVacated && <span className="seat-tag-vacated">FREE</span>}
                        {isMine && <span className="seat-tag-mine">YOU</span>}
                        {isBoarded && isOccupied && (
                          <span style={{
                            position: 'absolute',
                            top: '-4px',
                            right: isVacated ? '28px' : '-2px',
                            background: 'var(--status-success-solid)',
                            color: 'var(--text-on-brand)',
                            fontSize: '6.5px',
                            fontWeight: 900,
                            padding: '1px 3px',
                            borderRadius: '3px'
                          }}>
                            ✓ IN
                          </span>
                        )}

                        {/* Top: Seat Number */}
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: isVacated ? 'var(--status-warning-text)' : isMine ? 'var(--brand-crimson)' : isOccupied ? 'var(--brand-slate-700)' : 'var(--text-muted)',
                          lineHeight: '1'
                        }}>
                          #{s.num < 10 ? `0${s.num}` : s.num}
                        </div>

                        {/* Middle: Passenger Name with Ellipsis */}
                        <div style={{
                          fontSize: '8.5px',
                          fontWeight: 700,
                          color: isVacated ? 'var(--status-warning-text)' : isOccupied ? 'var(--brand-slate-900)' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '46px',
                          textAlign: 'center'
                        }}>
                          {shortName}
                        </div>

                        {/* Bottom: Category or Standby Tag */}
                        {s.isStandbyPromoted ? (
                          <div style={{ fontSize: '6.5px', fontWeight: 800, color: 'var(--status-success)', background: 'var(--status-success-bg)', padding: '0 2px', borderRadius: '2px' }}>
                            STANDBY
                          </div>
                        ) : s.category === 'executive' ? (
                          <div style={{ fontSize: '6px', fontWeight: 800, color: 'var(--status-info-text)', background: 'var(--status-info-bg)', padding: '0 2px', borderRadius: '2px' }}>
                            EXEC
                          </div>
                        ) : s.category === 'lady_priority' ? (
                          <div style={{ fontSize: '6px', fontWeight: 800, color: 'var(--status-pink-text)', background: 'var(--status-pink-bg)', padding: '0 2px', borderRadius: '2px' }}>
                            LADY
                          </div>
                        ) : (
                          <div style={{ height: '3px' }} />
                        )}
                      </div>
                    );
                  };

                  return (
                    <div key={rowNum} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                      {/* Left Pair */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {renderSeatBox(leftWin)}
                        {renderSeatBox(leftAisle)}
                      </div>

                      {/* Aisle Walkway with Row Label */}
                      <div style={{
                        fontSize: '9px',
                        color: 'var(--brand-slate-400)',
                        fontWeight: 800,
                        letterSpacing: '0.8px',
                        width: '28px',
                        textAlign: 'center'
                      }}>
                        R{rowNum}
                      </div>

                      {/* Right Pair */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {renderSeatBox(rightAisle)}
                        {renderSeatBox(rightWin)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rear Section: Emergency Exit 2 & Luggage Storage */}
              <div style={{
                textAlign: 'center',
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '2px dashed var(--border-2)',
                fontSize: '9.5px',
                color: 'var(--brand-slate-500)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={11} color="var(--status-danger)" />
                  <span>{t('EMERGENCY DOOR 2', 'জরুরি গেট ২', lang)}</span>
                </span>
                <span style={{ fontWeight: 700, letterSpacing: '0.6px' }}>{t('REAR CARGO & FIRST-AID STATION', 'পিছনের লাগেজ ও প্রাথমিক চিকিৎসা', lang)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Flame size={11} color="var(--status-danger)" />
                  <span>{t('FIRE EXT', 'অগ্নিনির্বাপক', lang)}</span>
                </span>
              </div>
            </div>

            {/* Coach Legend */}
            <div style={{ marginTop: '14px', display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '11px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--surface-1)', border: '1.5px solid var(--border-2)', borderRadius: '3px' }}></span>
                {t('Occupied Staff', 'যাত্রী বরাদ্দ', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--status-warning-bg)', border: '2px solid var(--brand-gold)', borderRadius: '3px' }}></span>
                {t('Vacated (Standby Free)', 'ফাঁকা আসন (দাবিযোগ্য)', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: 'rgba(225, 29, 72, 0.1)', border: '2px solid var(--brand-crimson)', borderRadius: '3px' }}></span>
                {t('My seat', 'আমার আসন', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--surface-2)', border: '1.5px dashed var(--border-2)', borderRadius: '3px' }}></span>
                {t('Unassigned Empty', 'খালি আসন', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--status-success-solid)', borderRadius: '3px', color: 'var(--text-on-brand)', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                {t('Boarded Today', 'বোর্ডিং সম্পন্ন', lang)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Commuter & FIFO Queue Cockpit (3 Clean Tabs) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Cockpit Tab Navigation */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid var(--brand-slate-200)', paddingBottom: '2px', overflowX: 'auto' }}>
            <button
              onClick={() => setActiveTab('dossier')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'dossier' ? '3px solid var(--brand-crimson)' : '3px solid transparent',
                padding: '7px 11px',
                fontSize: '12px',
                fontWeight: 700,
                color: activeTab === 'dossier' ? 'var(--brand-crimson)' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
            >
              <User size={13} />
              <span>{t('Seat & Passenger', 'আসন ও যাত্রী', lang)} {selectedSeat ? `(#${String(selectedSeat.num).padStart(2, '0')})` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('fifo')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: (activeTab === 'fifo' || activeTab === 'roster') ? '3px solid var(--brand-gold)' : '3px solid transparent',
                padding: '7px 11px',
                fontSize: '12px',
                fontWeight: 700,
                color: (activeTab === 'fifo' || activeTab === 'roster') ? 'var(--status-warning-text)' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
            >
              <Users size={13} />
              <span>{t('Standby Queue & Roster', 'স্ট্যান্ডবাই ও রোস্টার', lang)}</span>
              <span className="badge gold" style={{ fontSize: '8.5px', padding: '1px 5px' }}>{waitlist.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('route')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: (activeTab === 'route' || activeTab === 'driver') ? '3px solid var(--status-info)' : '3px solid transparent',
                padding: '7px 11px',
                fontSize: '12px',
                fontWeight: 700,
                color: (activeTab === 'route' || activeTab === 'driver') ? 'var(--status-info)' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
            >
              <Navigation size={13} />
              <span>{t('Route Stops & Crew', 'রুট স্টপ ও ক্রু', lang)}</span>
            </button>
          </div>

          {/* TAB 1: Selected Seat & Passenger Dossier */}
          {activeTab === 'dossier' && selectedSeat && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: 'rgba(225, 29, 72, 0.1)', color: 'var(--brand-crimson)' }}>
                    <User size={18} />
                  </div>
                  <div>
                    <div className="card-title">
                      {t(`Seat ${selectedSeat.num}`, `সিট ${selectedSeat.num}`, lang)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '5px' }}>
                  {selectedSeat.boarded && (
                    <span className="badge success" style={{ fontSize: '10px' }}>
                      ✓ {t('Boarded', 'বোর্ডিং সম্পন্ন', lang)}
                    </span>
                  )}
                  <span className={`badge ${selectedSeat.status === 'vacated' ? 'gold' : selectedSeat.status === 'occupied' ? 'info' : ''}`}>
                    {selectedSeat.status === 'vacated'
                      ? t('Vacated Today', 'আজ ফাঁকা', lang)
                      : selectedSeat.status === 'occupied'
                      ? t('Occupied', 'বরাদ্দকৃত', lang)
                      : t('Empty', 'খালি', lang)}
                  </span>
                </div>
              </div>

              <div className="card-body" style={{ fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--brand-slate-200)' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: selectedSeat.status === 'vacated' ? 'var(--status-warning-bg)' : selectedSeat.assignedTo ? 'var(--brand-slate-100)' : 'var(--surface-2)',
                    border: '1.5px solid var(--brand-slate-300)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: 'var(--brand-slate-700)'
                  }}>
                    {selectedSeat.assignedTo ? selectedSeat.assignedTo.split(' ').map(n => n[0]).slice(0, 2).join('') : <User size={20} />}
                  </div>

                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                      {selectedSeat.assignedTo || t('No Passenger Assigned', 'কোনো যাত্রী বরাদ্দ নেই', lang)}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                      {selectedSeat.dept || t('Available for instant shift reservation', 'তাৎক্ষণিক বুকিংযোগ্য আসন', lang)}
                    </div>
                  </div>
                </div>

                {/* Key Passenger Metadata Table */}
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--brand-slate-500)' }}>{t('Pickup stop', 'পিকআপ স্টপ', lang)}</div>
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>
                      {selectedSeat.pickupPoint || t('Not set', 'নির্ধারিত নয়', lang)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--brand-slate-500)' }}>{t('Boarding time', 'বোর্ডিং সময়', lang)}</div>
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>
                      {selectedSeat.pickupTime || (commuteDirection === 'inbound' ? '07:18 AM' : '05:15 PM')}
                    </div>
                  </div>

                  {selectedSeat.assignedTo && (
                    <details className="apv-ref-details" style={{ marginTop: '4px' }}>
                      <summary>{t('Staff ID & contact reference', 'কর্মী আইডি ও যোগাযোগ রেফারেন্স', lang)}</summary>
                      <div className="apv-ref-body" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '4px' }}>
                        <span>{t('Staff ID', 'কর্মী আইডি', lang)}: <code>{selectedSeat.staffId || 'N/A'}</code></span>
                        <span>{t('Phone', 'মোবাইল', lang)}: <code>{selectedSeat.phone || 'N/A'}</code></span>
                        <span>{t('Coach Plate', 'বাস নম্বর', lang)}: <code>{activeRoute.coachNo}</code></span>
                      </div>
                    </details>
                  )}

                  {selectedSeat.vacatedReason && (
                    <div style={{
                      marginTop: '6px',
                      background: 'var(--status-warning-bg)',
                      border: '1px solid var(--status-warning-bright)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      color: 'var(--status-warning-text)'
                    }}>
                      <strong>{t('Vacated Reason Logged', 'সিট ফাঁকা করার কারণ', lang)}:</strong> {selectedSeat.vacatedReason}
                    </div>
                  )}
                </div>

                {/* Clear Role Boundary Controls & Booking Actions */}
                {(canManageBus || activePerspective === 'staff') && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Case 1: Empty Seat — Direct Booking Available to Everyone */}
                  {selectedSeat.status === 'empty' && (
                    <button
                      className="btn-gold"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                      onClick={() => handleOpenBookModal(selectedSeat)}
                    >
                      <Ticket size={14} /> {t(`Book & Reserve Seat #${selectedSeat.num}`, `সিট #${selectedSeat.num} বুক করুন`, lang)}
                    </button>
                  )}

                  {selectedSeat.num === mySeat?.num && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isMySeatVacated ? (
                        <button className="btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={handleReclaimMySeat}>
                          <UserPlus size={14} /> {t('Reclaim My Seat', 'সিট পুনরুদ্ধার করুন', lang)}
                        </button>
                      ) : (
                        <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--brand-gold)', color: 'var(--status-warning-text)' }} onClick={() => setShowVacateDialog(true)}>
                          <UserMinus size={14} /> {t('Release My Seat Today', 'আজকের জন্য সিট ছাড়ুন', lang)}
                        </button>
                      )}
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setQrSeatTarget(selectedSeat);
                          setShowQrModal(true);
                        }}
                      >
                        <QrCode size={14} /> {t('QR Pass', 'কিউআর পাস', lang)}
                      </button>
                    </div>
                  )}

                  {/* Case 3: Other Occupied Seat in Staff View */}
                  {mySeat && selectedSeat.num !== mySeat.num && selectedSeat.status === 'occupied' && activePerspective === 'staff' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-outline"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => {
                          setSwapTargetNum(selectedSeat.num);
                          setShowSwapModal(true);
                        }}
                      >
                        <ArrowUpDown size={13} /> {t(`Request Swap with Seat #${selectedSeat.num}`, `সিট সোয়াপ আবেদন`, lang)}
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        disabled={!!seatNoteSent[String(selectedSeat.num)]}
                        onClick={() => {
                          setSeatNoteSent((prev) => ({ ...prev, [String(selectedSeat.num)]: true }));
                          showToast(t(`Message sent to ${selectedSeat.assignedTo ?? ''}.`, `${selectedSeat.assignedTo ?? ''}-কে বার্তা পাঠানো হয়েছে।`, lang), 'info');
                        }}
                      >
                        {seatNoteSent[String(selectedSeat.num)]
                          ? t('Sent', 'পাঠানো হয়েছে', lang)
                          : <Phone size={13} />}
                      </button>
                    </div>
                  )}

                  {/* Case 4: Vacated Standby Seat */}
                  {selectedSeat.status === 'vacated' && (
                    activePerspective === 'supervisor' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {waitlist.length > 0 ? (
                          <button
                            className="btn-gold"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => handleSupervisorManualAllocate(waitlist[0], selectedSeat.num)}
                          >
                            <UserPlus size={13} /> {t(`Assign to #1 ${waitlist[0].name}`, `বরাদ্দ দিন #${waitlist[0].name}-কে`, lang)}
                          </button>
                        ) : (
                          <button
                            className="btn-gold"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => handleOpenBookModal(selectedSeat)}
                          >
                            <UserPlus size={14} /> {t('Allocate Standby to Commuter', 'আসন বরাদ্দ দিন', lang)}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        className="btn-gold"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleOpenBookModal(selectedSeat)}
                      >
                        <UserPlus size={14} /> {t('Request This Standby Seat', 'এই খালি সিটের জন্য আবেদন করুন', lang)}
                      </button>
                    )
                  )}

                  {/* Case 5: Supervisor Full Administrative Control on any seat */}
                  {activePerspective === 'supervisor' && selectedSeat.status === 'occupied' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-outline"
                        style={{ flex: 1, fontSize: '11px', justifyContent: 'center' }}
                        onClick={() => handleToggleBoarding(selectedSeat.num)}
                      >
                        <CheckCircle2 size={13} color={selectedSeat.boarded ? 'var(--status-success)' : 'var(--text-3)'} />
                        {selectedSeat.boarded ? t('Mark Unboarded', 'বোর্ডিং বাতিল', lang) : t('Mark Boarded', 'বোর্ডিং নিশ্চিত', lang)}
                      </button>

                      <button
                        className="btn-outline"
                        style={{ flex: 1, fontSize: '11px', justifyContent: 'center' }}
                        onClick={() => {
                          setSwapTargetNum(selectedSeat.num);
                          setShowSwapModal(true);
                        }}
                      >
                        <ArrowUpDown size={13} /> {t('Reassign / Swap', 'পুনর্বিন্যাস', lang)}
                      </button>

                      <button
                        className="btn-primary"
                        style={{ fontSize: '11px', padding: '5px 10px' }}
                        onClick={() => {
                          setQrSeatTarget(selectedSeat);
                          setShowQrModal(true);
                        }}
                      >
                        <QrCode size={13} />
                      </button>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Standby Queue & Shift Passenger Roster (Combined) */}
          {(activeTab === 'fifo' || activeTab === 'roster') && (
            <>
              <div className="card">
                <div className="card-hd">
                  <div className="card-hd-left">
                    <div className="card-hd-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--brand-gold)' }}>
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="card-title">
                        {t('Standby Queue (FIFO)', 'স্ট্যান্ডবাই অপেক্ষাতালিকা (FIFO)', lang)}
                      </div>
                      <div className="card-subtitle">
                        {t('First-In-First-Out promotion when a seat is released', 'কোনো আসন ফাঁকা হলে ক্রমানুসারে স্বয়ংক্রিয় বরাদ্দ', lang)}
                      </div>
                    </div>
                  </div>

                  {/* Role-based queue action */}
                  {activePerspective === 'staff' ? (
                    myWaitlistEntry ? (
                      <button
                        className="btn-outline"
                        style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
                        onClick={handleCancelMyWaitlist}
                      >
                        {t('Leave Queue', 'আবেদন বাতিল', lang)}
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => setShowJoinModal(true)}
                      >
                        <UserPlus size={13} /> {t('Request Standby Seat', 'সিটের আবেদন', lang)}
                      </button>
                    )
                  ) : canManageBus ? (
                    <button
                      className="btn-gold"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={handleSupervisorAutoFIFO}
                    >
                      <UserPlus size={13} /> {t('Promote Standby', 'স্ট্যান্ডবাই পদোন্নতি', lang)}
                    </button>
                  ) : null}
                </div>

                <div className="card-body">
                  {/* Candidate Queue Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {waitlist.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--brand-slate-500)' }}>
                        <CheckCircle2 size={28} color="var(--status-success)" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>{t('No Pending Standby Requests', 'কোনো অপেক্ষমান প্রার্থী নেই', lang)}</div>
                      </div>
                    ) : (
                      waitlist.map((candidate) => {
                        const isRankOne = candidate.rank === 1;
                        const isMe = candidate.staffId === currentStaffMeta.empId || candidate.name.toLowerCase().includes(currentStaffMeta.shortName.toLowerCase());

                        return (
                          <div
                            key={candidate.staffId}
                            className={`fifo-card-item ${isRankOne ? 'rank-1' : ''}`}
                            style={{
                              border: isMe ? '2px solid var(--brand-crimson)' : undefined,
                              background: isMe ? 'rgba(225, 29, 72, 0.04)' : undefined
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '7px',
                                background: isRankOne ? 'var(--brand-gold)' : 'var(--brand-slate-200)',
                                color: isRankOne ? 'var(--text-1)' : 'var(--brand-slate-700)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 800
                              }}>
                                #{candidate.rank}
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ fontSize: '12.5px', color: 'var(--brand-slate-900)' }}>{candidate.name}</strong>
                                  {isMe && <span className="badge danger" style={{ fontSize: '8px', padding: '1px 4px' }}>YOU</span>}
                                  <span className={`badge ${candidate.priority === 'Emergency' ? 'danger' : candidate.priority === 'Overtime' ? 'purple' : 'info'}`} style={{ fontSize: '8.5px', padding: '1px 4px' }}>
                                    {candidate.priority}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{candidate.dept}</span>
                                  <span>·</span>
                                  <MapPin size={10} />
                                  <span>{candidate.pickupPoint}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Button: Visible only to the transport supervisor */}
                            {activePerspective === 'supervisor' && canManageBus ? (
                              vacatedCount > 0 ? (
                                <button
                                  className="btn-gold"
                                  style={{ fontSize: '10px', padding: '4px 8px' }}
                                  onClick={() => {
                                    const firstVacated = seats.find(s => s.status === 'vacated');
                                    if (firstVacated) {
                                      handleSupervisorManualAllocate(candidate, firstVacated.num);
                                    }
                                  }}
                                >
                                  {t('Assign', 'বরাদ্দ', lang)} #{seats.find(s => s.status === 'vacated')?.num}
                                </button>
                              ) : (
                                <span style={{ fontSize: '10px', color: 'var(--brand-slate-400)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Clock size={10} /> {t('Standby', 'অপেক্ষমান', lang)}
                                </span>
                              )
                            ) : (
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>{candidate.joinedAt}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Integrated Shift Passenger Roster below the Standby Queue */}
              <div className="card">
                <div className="card-hd">
                  <div className="card-hd-left">
                    <div className="card-hd-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--status-purple)' }}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="card-title">
                        {t('Confirmed Shift Roster', 'নিশ্চিত যাত্রী রোস্টার', lang)}
                      </div>
                      <div className="card-subtitle">
                        {occupiedCount} {t('Booked Passengers', 'বুক করা যাত্রী', lang)} · {boardedCount} {t('Boarded', 'বোর্ডে উপস্থিত', lang)}
                      </div>
                    </div>
                  </div>

                  {!fleetReadOnly && (
                  <button className="btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setShowManifestModal(true)}>
                    <Printer size={12} /> {t('Print Roster', 'প্রিন্ট', lang)}
                  </button>
                  )}
                </div>

                <div className="card-body" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '11.5px', margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>{t('Seat', 'সিট', lang)}</th>
                        <th>{t('Passenger Name', 'যাত্রীর নাম', lang)}</th>
                        <th>{t('Pickup Station', 'পিকআপ স্টপ', lang)}</th>
                        <th>{t('Blood', 'রক্ত', lang)}</th>
                        <th style={{ textAlign: 'right' }}>{t('Status', 'অবস্থা', lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seats.filter(s => s.status === 'occupied').map(s => (
                        <tr key={s.num} onClick={() => { setSelectedSeat(s); setActiveTab('dossier'); }} style={{ cursor: 'pointer' }}>
                          <td><strong>#{s.num}</strong></td>
                          <td>
                            <div>
                              <span style={{ fontWeight: 700 }}>{s.assignedTo}</span>
                              <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)' }}>{s.dept}</div>
                            </div>
                          </td>
                          <td>{s.pickupPoint}</td>
                          <td><span className="badge danger" style={{ fontSize: '9px' }}>{s.bloodGroup || 'O+'}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`badge ${s.boarded ? 'success' : 'info'}`} style={{ fontSize: '9px' }}>
                              {s.boarded ? t('Boarded', 'উপস্থিত', lang) : t('Waiting', 'অপেক্ষমান', lang)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: Route Stops & Crew (Combined, without fake telemetry) */}
          {(activeTab === 'route' || activeTab === 'driver') && (
            <>
              <div className="card">
                <div className="card-hd">
                  <div className="card-hd-left">
                    <div className="card-hd-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--status-info)' }}>
                      <Navigation size={18} />
                    </div>
                    <div>
                      <div className="card-title">
                        {t('Route Stops & Boarding Schedule', 'রুট স্টপেজ ও সময়সূচী', lang)}
                      </div>
                      <div className="card-subtitle">
                        {commuteDirection === 'inbound' ? t('Morning Inbound (City → Plant)', 'সকালের শিফট (শহর → প্ল্যান্ট)', lang) : t('Evening Return (Plant → City)', 'সন্ধ্যার ফিরতি শিফট (প্ল্যান্ট → শহর)', lang)} · {activeStops.length} {t('Stops', 'স্টপেজ', lang)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <div className="route-stop-timeline">
                    {activeStops.map((stop: RouteStop) => {
                      const isPassed = stop.status === 'passed';
                      const isActive = stop.status === 'active';

                      return (
                        <div
                          key={stop.id}
                          className={`route-stop-node ${isPassed ? 'passed' : isActive ? 'active' : ''}`}
                        >
                          <div className="route-stop-dot" />

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                                {lang === 'bn' ? stop.nameBn : stop.name}
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                                {t('Scheduled', 'সময়', lang)}: <strong>{stop.scheduledTime}</strong> · {stop.distanceKm}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span className={`badge ${isPassed ? 'success' : isActive ? 'gold' : ''}`} style={{ fontSize: '9.5px' }}>
                                {isPassed ? t('Passed', 'অতিক্রম', lang) : isActive ? t('At Station', 'বর্তমান স্টপ', lang) : t('Upcoming', 'আসন্ন', lang)}
                              </span>
                              <div style={{ fontSize: '10px', color: 'var(--brand-slate-400)', marginTop: '2px' }}>
                                +{stop.passengers} {t('passengers', 'যাত্রী', lang)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Driver, Conductor & 24/7 Dispatch Card */}
              <div className="card">
                <div className="card-hd">
                  <div className="card-hd-left">
                    <div className="card-hd-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--status-success)' }}>
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <div className="card-title">
                        {t('Assigned Crew & Dispatch Contact', 'নির্ধারিত চালক, কন্ডাক্টর ও হটলাইন', lang)}
                      </div>
                      <div className="card-subtitle">
                        {activeRoute.coachNo} · {activeRoute.model}
                      </div>
                    </div>
                  </div>
                  <span className="badge success">{t('Fitness Valid', 'ফিটনেস ক্লিয়ার', lang)}</span>
                </div>

                <div className="card-body" style={{ fontSize: '12.5px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ background: 'var(--brand-slate-50)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={11} /> {t('Certified Driver', 'প্রধান চালক', lang)}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: 'var(--brand-slate-900)' }}>
                        {activeRoute.driverName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                        <code>{activeRoute.driverPhone}</code>
                      </div>
                    </div>

                    <div style={{ background: 'var(--brand-slate-50)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Ticket size={11} /> {t('Bus Conductor', 'কন্ডাক্টর', lang)}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: 'var(--brand-slate-900)' }}>
                        {activeRoute.conductorName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                        <code>{activeRoute.conductorPhone}</code>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--status-danger-text)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <AlertTriangle size={13} />
                        <span>{t('24/7 Transport Dispatch Hotline', '২৪/৭ পরিবহন ডিসপ্যাচ হটলাইন', lang)}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                        +880 1711-009988
                      </div>
                    </div>
                    {!fleetReadOnly && (
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ borderColor: 'var(--status-danger)', color: 'var(--status-danger)', fontSize: '11px' }}
                      disabled={dispatchSent}
                      onClick={() => {
                        setDispatchSent(true);
                        showToast(t('Emergency dispatcher notified.', 'জরুরি হটলাইনে যোগাযোগ করা হয়েছে।', lang), 'info');
                      }}
                    >
                      <Phone size={12} /> {dispatchSent ? t('Sent', 'পাঠানো হয়েছে', lang) : t('Call Dispatch', 'কল করুন', lang)}
                    </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )}

      {/* ─── MODAL 1: Voluntary Seat Release Dialog ─────────────────── */}
      {showVacateDialog && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowVacateDialog(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(212, 175, 55, 0.12)', color: 'var(--status-warning-text)' }}>
                  <UserMinus size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t(`Release seat #${String(mySeat?.num ?? '').padStart(2, '0')} for today`, `আজকের জন্য ${mySeat?.num ?? ''} নম্বর আসন ছাড়ুন`, lang)}</h3>
                  <div className="app-modal-subtitle">{t('Voluntary standby release for shift colleagues', 'সহকর্মীদের সুযোগ দিতে সিট ছেড়ে দিন', lang)}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowVacateDialog(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: '0 0 14px 0', color: 'var(--brand-slate-600)' }}>
                {t(
                  'By releasing your seat today, it will be placed in the standby pool and awarded to candidate #1 on the FIFO queue by the Transport Cell. You can reclaim your seat anytime before departure if plans change.',
                  'সিট ছেড়ে দিলে অপেক্ষাতালিকার ১ নম্বর প্রার্থী বরাদ্দ পাবেন। তবে রওনা দেওয়ার পূর্বে চাইলে আপনি পুনরায় আসনটি ফেরত নিতে পারেন।',
                  lang
                )}
              </p>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-700)' }}>
                {t('Reason for Releasing Seat Today:', 'সিট ছেড়ে দেওয়ার কারণ:', lang)}
              </label>
              <select
                className="input-select"
                style={{ width: '100%', marginBottom: '14px' }}
                value={vacateReason}
                onChange={e => setVacateReason(e.target.value)}
              >
                <option value="Working from Corporate HQ Dhaka">Working from Corporate HQ Dhaka</option>
                <option value="Approved Annual / Casual Leave">Approved Annual / Casual Leave</option>
                <option value="Self-Commute by Personal Motorcycle / Car">Self-Commute by Personal Vehicle</option>
                <option value="Official Outside Field Duty">Official Field Duty outside Plant</option>
                <option value="Medical Sick Leave">Medical Sick Leave</option>
              </select>

              <div style={{ background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-bright)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: 'var(--status-warning-text)' }}>
                <strong>{t('Auto-Standby Recipient:', 'স্বয়ংক্রিয় প্রাপক:', lang)}</strong> {t('Eligible candidate', 'অগ্রাধিকার প্রার্থী', lang)}: <strong>{waitlist[0]?.name || 'Next Waitlist Colleague'}</strong>.
              </div>
            </div>

            <div className="app-modal-footer">
              <button className="btn-outline" onClick={() => setShowVacateDialog(false)}>
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button className="btn-gold" onClick={handleReleaseMySeat}>
                <CheckCircle size={14} /> {t('Confirm Release', 'নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 2: Direct Seat Reservation Modal ─────────────────── */}
      {showBookModal && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--status-success)' }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">
                    {t(`Reserve Shuttle Seat #${bookForm.targetSeatNum}`, `আসন #${bookForm.targetSeatNum} রিজার্ভেশন`, lang)}
                  </h3>
                  <div className="app-modal-subtitle">{activeRoute.coachNo} · {activeRoute.name.split(':')[0]}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowBookModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBookSeatSubmit}>
              <div className="app-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Seat Selector Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Target Coach Seat Number', 'নির্ধারিত আসন নম্বর', lang)}
                    </label>
                    <select
                      className="input-select"
                      style={{ width: '100%' }}
                      value={bookForm.targetSeatNum}
                      onChange={e => setBookForm({ ...bookForm, targetSeatNum: Number(e.target.value) })}
                    >
                      {seats.map(s => (
                        <option key={s.num} value={s.num}>
                          Seat #{s.num} (Row {s.row}, {s.col.replace('_', ' ')}) — {s.status === 'occupied' ? `Occupied: ${s.assignedTo}` : s.status === 'vacated' ? 'Free (Standby)' : 'Empty (Available)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Booking Type', 'বুকিং এর ধরন', lang)}
                    </label>
                    <select
                      className="input-select"
                      style={{ width: '100%' }}
                      value={bookForm.bookingType}
                      onChange={e => setBookForm({ ...bookForm, bookingType: e.target.value as any })}
                    >
                      <option value="shift_pass">1-Day Single Shift Pass</option>
                      <option value="permanent">Permanent Commuter Roster</option>
                      <option value="guest">Vendor / Guest Day Pass</option>
                    </select>
                  </div>
                </div>

                {/* Passenger Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Passenger Full Name', 'যাত্রীর পূর্ণ নাম', lang)}
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      style={{ width: '100%' }}
                      value={bookForm.name}
                      onChange={e => setBookForm({ ...bookForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Staff ID / Guest Pass #', 'কর্মকর্তা আইডি / গেস্ট নম্বর', lang)}
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      style={{ width: '100%' }}
                      value={bookForm.staffId}
                      onChange={e => setBookForm({ ...bookForm, staffId: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Department / Unit', 'বিভাগ', lang)}
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      style={{ width: '100%' }}
                      value={bookForm.dept}
                      onChange={e => setBookForm({ ...bookForm, dept: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Mobile Number (SMS Pass)', 'মোবাইল নম্বর', lang)}
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      style={{ width: '100%' }}
                      value={bookForm.phone}
                      onChange={e => setBookForm({ ...bookForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Pickup & Blood Group */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Designated Pickup / Boarding Station', 'বোর্ডিং স্টপ', lang)}
                    </label>
                    <select
                      className="input-select"
                      style={{ width: '100%' }}
                      value={bookForm.pickupPoint}
                      onChange={e => setBookForm({ ...bookForm, pickupPoint: e.target.value })}
                    >
                      {activeStops.map((s: RouteStop) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.scheduledTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Blood Group', 'রক্তের গ্রুপ', lang)}
                    </label>
                    <select
                      className="input-select"
                      style={{ width: '100%' }}
                      value={bookForm.bloodGroup}
                      onChange={e => setBookForm({ ...bookForm, bloodGroup: e.target.value })}
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{
                  background: 'var(--brand-slate-50)',
                  border: '1px solid var(--brand-slate-200)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '11.5px',
                  color: 'var(--brand-slate-600)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('Selected Shift Direction:', 'শিফট দিক:', lang)}</span>
                    <strong style={{ color: 'var(--brand-slate-900)' }}>
                      {commuteDirection === 'inbound' ? 'Morning Shift (City ➔ Plant)' : 'Evening Shift (Plant ➔ City)'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>{t('Commute Date:', 'তারিখ:', lang)}</span>
                    <strong>{selectedDate} (Confirmed)</strong>
                  </div>
                </div>
              </div>

              <div className="app-modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowBookModal(false)}>
                  {t('Cancel', 'বাতিল', lang)}
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={14} /> {t('Confirm Reservation & Issue Pass', 'রিজার্ভেশন নিশ্চিত করুন', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 3: Seat Swap / Exchange Modal ─────────────────────── */}
      {showSwapModal && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowSwapModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--status-info)' }}>
                  <ArrowUpDown size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Shuttle Seat Exchange / Swap Request', 'সিট সোয়াপ ও পুনর্বিন্যাস', lang)}</h3>
                  <div className="app-modal-subtitle">{activeRoute.coachNo}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowSwapModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              <p style={{ fontSize: '12.5px', color: 'var(--brand-slate-600)', marginBottom: '14px', lineHeight: '1.5' }}>
                {t(
                  'Exchange seats between commuters for convenient pickup alignment or departmental seating preferences.',
                  'সহকর্মীদের মাঝে সুবিধাজনক পিকআপ বা জানালার পাশের সিট পেতে আসন বিনিময় করুন।',
                  lang
                )}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.2fr 1fr', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--brand-slate-50)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase' }}>Current Seat</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-crimson)' }}>
                    Seat #{selectedSeat?.num || 5}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600 }}>{selectedSeat?.assignedTo || 'Tanvir Ahmed'}</div>
                  <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)' }}>{selectedSeat?.dept || 'Sales'}</div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--status-info)' }}>
                  <ArrowUpDown size={18} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Target Swap Seat
                  </label>
                  <select
                    className="input-select"
                    style={{ width: '100%', fontSize: '12px' }}
                    value={swapTargetNum}
                    onChange={e => setSwapTargetNum(Number(e.target.value))}
                  >
                    {seats.filter(s => s.num !== (selectedSeat?.num || 5)).map(s => (
                      <option key={s.num} value={s.num}>
                        Seat #{s.num} — {s.assignedTo || 'Empty'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)', borderRadius: '8px', padding: '10px 12px', fontSize: '11.5px', color: 'var(--status-info-text)' }}>
                <strong>Mutual Agreement Protocol:</strong> Digital confirmation notification will update both boarding passes immediately upon supervisor approval.
              </div>
            </div>

            <div className="app-modal-footer">
              <button className="btn-outline" onClick={() => setShowSwapModal(false)}>
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button className="btn-primary" onClick={handleExecuteSeatSwap}>
                <Check size={14} /> {t('Confirm Seat Exchange', 'বিনিময় নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 4: Digital QR Boarding Pass ──────────────────────── */}
      {showQrModal && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon">
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Digital Boarding Pass', 'ডিজিটাল বোর্ডিং পাস', lang)}</h3>
                  <div className="app-modal-subtitle">{activeRoute.coachNo} · {activeRoute.name.split(':')[0]}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowQrModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{
                background: 'var(--surface-1)',
                border: '2px solid var(--brand-slate-200)',
                borderRadius: '16px',
                padding: '16px',
                display: 'inline-block',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                marginBottom: '14px'
              }}>
                <QrCode size={160} color="var(--text-1)" />
                <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginTop: '6px', color: 'var(--brand-slate-600)' }}>
                  BOGCL-PASS-{qrSeatTarget?.staffId || '1042'}-S{qrSeatTarget?.num || 5}
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 3px 0', color: 'var(--brand-slate-900)' }}>
                {qrSeatTarget?.assignedTo || 'Tanvir Ahmed'}
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--brand-crimson)', fontWeight: 800 }}>
                SEAT #{qrSeatTarget?.num ? (qrSeatTarget.num < 10 ? `0${qrSeatTarget.num}` : qrSeatTarget.num) : '05'} · {commuteDirection === 'inbound' ? 'MORNING SHIFT' : 'EVENING RETURN'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                {qrSeatTarget?.dept || 'Sales & Distribution'}
              </div>

              <div style={{
                background: 'var(--brand-slate-50)',
                border: '1px solid var(--brand-slate-200)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginTop: '14px',
                textAlign: 'left',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>{t('Route & Coach', 'রুট ও কোচ', lang)}:</span>
                  <strong>{activeRoute.name} ({activeRoute.coachNo})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>{t('Pickup Stop', 'পিকআপ স্টপ', lang)}:</span>
                  <span style={{ color: 'var(--status-info)', fontWeight: 700 }}>{qrSeatTarget?.pickupPoint || 'Farmgate Overbridge'} ({qrSeatTarget?.pickupTime || '07:18 AM'})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>{t('Blood Group', 'রক্তের গ্রুপ', lang)}:</span>
                  <span className="badge danger" style={{ fontSize: '10px' }}>{qrSeatTarget?.bloodGroup || 'B+'}</span>
                </div>
                <details className="apv-ref-details" style={{ marginTop: '4px' }}>
                  <summary>{t('Pass & staff reference', 'পাস ও কর্মী রেফারেন্স', lang)}</summary>
                  <div className="apv-ref-body" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
                    <span>{t('Pass ID', 'পাস আইডি', lang)}: <code>BOGCL-PASS-{qrSeatTarget?.staffId || '1042'}-S{qrSeatTarget?.num || 5}</code></span>
                    <span>{t('Staff ID', 'কর্মী আইডি', lang)}: <code>{qrSeatTarget?.staffId || 'EMP-1042'}</code></span>
                  </div>
                </details>
              </div>
            </div>

            <div className="app-modal-footer">
              <button
                className="btn-outline"
                style={{ borderColor: 'var(--brand-gold)', color: 'var(--status-warning-text)' }}
                onClick={() => {
                  window.print();
                  showToast(t('Boarding pass sent to print spooler.', 'প্রিন্ট পাঠানো হয়েছে।', lang), 'info');
                }}
              >
                <Printer size={14} /> {t('Print Pass', 'প্রিন্ট করুন', lang)}
              </button>
              <button className="btn-primary" onClick={() => setShowQrModal(false)}>
                {t('Close', 'বন্ধ করুন', lang)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 5: Security Gate Check-Post Manifest (Printable) ─── */}
      {showManifestModal && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowManifestModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(15, 23, 42, 0.1)', color: 'var(--text-1)' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Official Plant Security Gate Commuter Manifest', 'প্ল্যান্ট নিরাপত্তা গেট যাত্রী তালিকা', lang)}</h3>
                  <div className="app-modal-subtitle">Bashundhara Oil & Gas Company Limited · Keraniganj Plant Gate-1</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowManifestModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              {/* Manifest Metadata Summary Strip */}
              <div style={{
                background: 'var(--brand-slate-50)',
                border: '1px solid var(--brand-slate-200)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                fontSize: '11.5px'
              }}>
                <div>
                  <div style={{ color: 'var(--brand-slate-500)', fontSize: '10px', textTransform: 'uppercase' }}>Coach No</div>
                  <strong>{activeRoute.coachNo}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--brand-slate-500)', fontSize: '10px', textTransform: 'uppercase' }}>Driver / Conductor</div>
                  <strong>{activeRoute.driverName}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--brand-slate-500)', fontSize: '10px', textTransform: 'uppercase' }}>Shift / Date</div>
                  <strong>{commuteDirection === 'inbound' ? 'Morning Shift' : 'Evening Return'} · {selectedDate}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--brand-slate-500)', fontSize: '10px', textTransform: 'uppercase' }}>Headcount Boarded</div>
                  <strong style={{ color: 'var(--status-success)' }}>{boardedCount} / {occupiedCount} Passengers</strong>
                </div>
              </div>

              {/* Manifest Table */}
              <div className="table-responsive" style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--brand-slate-200)', borderRadius: '8px' }}>
                <table className="data-table" style={{ fontSize: '11px', margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '45px' }}>{t('Seat #', 'আসন #', lang)}</th>
                      <th>{t('Staff ID', 'আইডি', lang)}</th>
                      <th>{t('Passenger Name', 'নাম', lang)}</th>
                      <th>{t('Department', 'বিভাগ', lang)}</th>
                      <th>{t('Pickup Station', 'পিকআপ স্টপ', lang)}</th>
                      <th>{t('Blood', 'রক্ত', lang)}</th>
                      <th style={{ textAlign: 'center' }}>{t('Gate Clearance', 'গেট ক্লিয়ারেন্স', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seats.filter(s => s.status === 'occupied').map(s => (
                      <tr key={s.num}>
                        <td><strong>#{s.num}</strong></td>
                        <td><code>{s.staffId}</code></td>
                        <td><strong>{s.assignedTo}</strong></td>
                        <td>{s.dept}</td>
                        <td>{s.pickupPoint}</td>
                        <td><span className="badge danger" style={{ fontSize: '9px' }}>{s.bloodGroup || 'O+'}</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${s.boarded ? 'success' : 'warn'}`} style={{ fontSize: '9px' }}>
                            {s.boarded ? t('PASS CLEARED', 'গেট ক্লিয়ার', lang) : t('AWAITING GATE', 'অপেক্ষমান', lang)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="app-modal-footer">
              <button
                className="btn-outline"
                style={{ borderColor: 'var(--brand-gold)', color: 'var(--status-warning-text)' }}
                onClick={() => {
                  window.print();
                  showToast(t('Gate pass manifest sent to security printer.', 'গেট পাস প্রিন্ট করা হচ্ছে।', lang), 'info');
                }}
              >
                <Printer size={14} /> {t('Print Gate Pass Manifest', 'প্রিন্ট গেট পাস', lang)}
              </button>
              <button className="btn-primary" onClick={() => setShowManifestModal(false)}>
                {t('Close', 'বন্ধ করুন', lang)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 6: Shift Timetable Manifest ──────────────────────── */}
      {showTimetableModal && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowTimetableModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('All-Fleet Route Timetables & Stoppages Manifest', 'সকল বাসের সময়সূচী ও স্টপেজ তালিকা', lang)}</h3>
                  <div className="app-modal-subtitle">{t('BOGCL Official Shift Logistics Schedule', 'বিওজিসিএল অফিসিয়াল শিফট সময়সূচী', lang)}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowTimetableModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              <div className="table-responsive" style={{ border: '1px solid var(--brand-slate-200)', borderRadius: '10px', overflow: 'hidden' }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>{t('Route Code', 'রুট কোড', lang)}</th>
                      <th>{t('Coach & Capacity', 'কোচ ও আসন', lang)}</th>
                      <th>{t('First Pickup', 'প্রথম স্টপ', lang)}</th>
                      <th>{t('Plant Arrival', 'প্ল্যান্ট পৌঁছানোর সময়', lang)}</th>
                      <th>{t('Return Departure', 'ফিরতি যাত্রা', lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong style={{ color: 'var(--brand-crimson)' }}>Route-1 (Mirpur)</strong></td>
                      <td>Hino RM2 (52 Seats)</td>
                      <td>06:45 AM (Mirpur-10)</td>
                      <td><strong>08:00 AM</strong></td>
                      <td>05:15 PM</td>
                    </tr>
                    <tr>
                      <td><strong style={{ color: 'var(--status-info)' }}>Route-2 (Uttara)</strong></td>
                      <td>Scania Touring (52 Seats)</td>
                      <td>06:30 AM (Azampur)</td>
                      <td><strong>08:05 AM</strong></td>
                      <td>05:15 PM</td>
                    </tr>
                    <tr>
                      <td><strong style={{ color: 'var(--status-success)' }}>Route-3 (Narayanganj)</strong></td>
                      <td>Hyundai Universe (52 Seats)</td>
                      <td>06:50 AM (Chashara)</td>
                      <td><strong>07:55 AM</strong></td>
                      <td>05:15 PM</td>
                    </tr>
                    <tr>
                      <td><strong style={{ color: 'var(--brand-gold)' }}>Route-4 (Dhanmondi)</strong></td>
                      <td>Ashok Leyland (52 Seats)</td>
                      <td>06:55 AM (Dhanmondi-27)</td>
                      <td><strong>08:00 AM</strong></td>
                      <td>05:15 PM</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11.5px', color: 'var(--brand-slate-600)', background: 'var(--brand-slate-50)', border: '1px solid var(--brand-slate-200)', padding: '10px 12px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--brand-slate-900)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Info size={13} color="var(--brand-crimson)" />
                  <span>{t('Plant Transit Rules:', 'প্ল্যান্ট যাতায়াত বিধিমালা:', lang)}</span>
                </strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, lineHeight: '1.5' }}>
                  <li>{t('Standby seats are strictly prioritized according to registration timestamp (FIFO queue).', 'ফিফো পদ্ধতিতে নিবন্ধনের ক্রম অনুযায়ী স্ট্যান্ডবাই আসন বরাদ্দ বাধ্যতামূলক।', lang)}</li>
                  <li>{t('Voluntary seat release must be logged at least 30 minutes before first station departure.', 'সিট ছাড়তে হলে প্রথম স্টপ ছাড়ার কমপক্ষে ৩০ মিনিট পূর্বে কনফার্ম করতে হবে।', lang)}</li>
                  <li>{t('Digital QR boarding pass or staff identity smart-card is required for entry.', 'ডিজিটাল বোর্ডিং পাস অথবা কর্মকর্তা স্মার্টকার্ড প্রদর্শন বাধ্যতামূলক।', lang)}</li>
                </ul>
              </div>
            </div>

            <div className="app-modal-footer">
              <button className="btn-primary" onClick={() => setShowTimetableModal(false)}>
                {t('Got It', 'বুঝেছি', lang)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 7: Conductor Gate Scanner & Boarding Manifest ─────── */}
      {showScannerModal && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowScannerModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', color: 'var(--status-info)' }}>
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Conductor Entrance QR Gate Scanner', 'কন্ডাক্টর গেট স্ক্যানার সিমুলেটর', lang)}</h3>
                  <div className="app-modal-subtitle">{activeRoute.coachNo} · {activeRoute.conductorName}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowScannerModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body">
              <div style={{
                background: 'var(--surface-inverse)',
                color: 'var(--text-on-brand)',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '14px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 8px',
                  border: '2px dashed var(--status-info-bright)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <QrCode size={32} color="var(--status-info-bright)" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>
                  {t('Conductor Optical Reader Ready', 'অপটিক্যাল রিডার স্ক্যান করতে প্রস্তুত', lang)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeRoute.conductorName} · Headcount Boarded: <strong style={{ color: 'var(--status-info-bright)' }}>{boardedCount} / {occupiedCount}</strong>
                </div>
              </div>

              {/* Fast verification row */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder={t('Staff ID or seat number', 'স্টাফ আইডি বা সিট নম্বর', lang)}
                  value={scanQuery}
                  onChange={(e) => setScanQuery(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn-primary"
                  onClick={() => {
                    const q = scanQuery.trim().toUpperCase();
                    const seat = seats.find(s => s.status === 'occupied' && (s.staffId?.toUpperCase() === q || String(s.num) === q.replace(/^#?0*/, '')));
                    if (!q || !seat) {
                      showToast(t('No confirmed passenger matches that ID or seat.', 'এই আইডি বা সিটে কোনো নিশ্চিত যাত্রী নেই।', lang), 'warn');
                      return;
                    }
                    if (!seat.boarded) handleToggleBoarding(seat.num);
                    setScanQuery('');
                    showToast(
                      t(
                        `${seat.assignedTo} (Seat #${String(seat.num).padStart(2, '0')}) verified and boarded.`,
                        `${seat.assignedTo} (সিট #${String(seat.num).padStart(2, '0')}) বোর্ডিং যাচাই সম্পন্ন।`,
                        lang
                      ),
                      'success'
                    );
                  }}
                >
                  <UserCheck size={14} /> {t('Verify', 'যাচাই', lang)}
                </button>
              </div>

              {/* Quick-tap attendance roster */}
              <div style={{ fontSize: '11.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-700)' }}>
                {t('Quick Attendance Tap-Checklist for Current Station:', 'স্টেশন অনুযায়ী দ্রুত বোর্ডিং চেকলিস্ট:', lang)}
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--brand-slate-200)', borderRadius: '8px' }}>
                {seats.filter(s => s.status === 'occupied').slice(0, 10).map(s => (
                  <div
                    key={s.num}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--brand-slate-100)',
                      fontSize: '11.5px'
                    }}
                  >
                    <div>
                      <strong>#{s.num}</strong> {s.assignedTo}{' '}
                      <span style={{ fontSize: '10px', color: 'var(--brand-slate-500)' }}>({s.pickupPoint})</span>
                    </div>
                    <button
                      className={s.boarded ? 'btn-outline' : 'btn-gold'}
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                      onClick={() => handleToggleBoarding(s.num)}
                    >
                      {s.boarded ? '✓ Boarded' : '+ Tap Board'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="app-modal-footer">
              <button className="btn-outline" onClick={() => setShowScannerModal(false)}>
                {t('Close Scanner', 'স্ক্যানার বন্ধ করুন', lang)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 8: Supervisor Delay Broadcast Modal ──────────────── */}
      {showBroadcastModal && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--status-warning-text)' }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Broadcast Route Notice / Delay Alert', 'রুট নোটিশ ও বিলম্ব বার্তা সম্প্রচার', lang)}</h3>
                  <div className="app-modal-subtitle">{activeRoute.coachNo}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowBroadcastModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast}>
              <div className="app-modal-body">
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--brand-slate-700)' }}>
                  {t('Notice Message (Will send via SMS & Push Notification):', 'বার্তার বিবরণ:', lang)}
                </label>
                <textarea
                  className="input-text"
                  style={{ width: '100%', height: '90px', resize: 'vertical', fontSize: '12.5px' }}
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  required
                />

                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                    onClick={() => setBroadcastMessage('Traffic Alert: 10-15 min delay expected due to road maintenance near Babubazar Bridge.')}
                  >
                    Preset: Traffic
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                    onClick={() => setBroadcastMessage('Weather Advisory: Heavy rainfall in Dhaka South corridor. Shuttle operating with safety speed cap.')}
                  >
                    Preset: Rain/Weather
                  </button>
                </div>
              </div>

              <div className="app-modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowBroadcastModal(false)}>
                  {t('Cancel', 'বাতিল', lang)}
                </button>
                <button type="submit" className="btn-gold">
                  <Send size={14} /> {t('Send SMS Broadcast', 'এসএমএস পাঠান', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 9: Corporate Transit Policy & FAQs ───────────────── */}
      {showPolicyModal && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowPolicyModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('BOGCL Corporate Shuttle Rules & Guidelines', 'বিওজিসিএল পরিবহন নীতি ও নির্দেশিকা', lang)}</h3>
                  <div className="app-modal-subtitle">Keraniganj Plant Operations Cell</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowPolicyModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body" style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'var(--brand-slate-700)' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--brand-slate-900)' }}>1. Seat Release Courtesy:</strong>
                <p style={{ margin: '2px 0 0' }}>If you are working from Dhaka Corporate Office, traveling, or taking personal leave, please release your seat at least 30 minutes before departure so colleagues on the standby queue can be awarded a seat.</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--brand-slate-900)' }}>2. Transparent FIFO Waitlist:</strong>
                <p style={{ margin: '2px 0 0' }}>Standby requests are processed strictly First-In, First-Out by registration timestamp. Emergency plant repair duty takes highest priority.</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--brand-slate-900)' }}>3. Priority Seating:</strong>
                <p style={{ margin: '2px 0 0' }}>Rows 1 and 2 are designated for Lady engineers, senior executives, and colleagues requiring accessibility support.</p>
              </div>

              <div>
                <strong style={{ color: 'var(--brand-slate-900)' }}>4. Security Pass Requirement:</strong>
                <p style={{ margin: '2px 0 0' }}>All passengers must show either their Digital QR Boarding Pass or Bashundhara Group Smart ID Card to the bus conductor before boarding.</p>
              </div>
            </div>

            <div className="app-modal-footer">
              <button className="btn-primary" onClick={() => setShowPolicyModal(false)}>
                {t('Understood', 'বুঝেছি', lang)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 10: Request Standby Seat (Join FIFO Waitlist) ─────── */}
      {showJoinModal && createPortal(
        <div className="app-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--brand-gold)' }}>
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Request Standby Seat (Join FIFO)', 'স্ট্যান্ডবাই সিটের জন্য আবেদন করুন', lang)}</h3>
                  <div className="app-modal-subtitle">{t('Automated priority assignment on seat release', 'সিট ফাঁকা হলে স্বয়ংক্রিয় বরাদ্দ', lang)}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowJoinModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleJoinWaitlistSubmit}>
              <div className="app-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Applicant Name', 'আবেদনকারীর নাম', lang)}
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      style={{ width: '100%' }}
                      value={joinForm.name}
                      onChange={e => setJoinForm({ ...joinForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Staff ID', 'কর্মকর্তা আইডি', lang)}
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      style={{ width: '100%' }}
                      value={joinForm.staffId}
                      onChange={e => setJoinForm({ ...joinForm, staffId: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Department', 'বিভাগ', lang)}
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      style={{ width: '100%' }}
                      value={joinForm.dept}
                      onChange={e => setJoinForm({ ...joinForm, dept: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Mobile Number', 'মোবাইল নম্বর', lang)}
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      style={{ width: '100%' }}
                      value={joinForm.phone}
                      onChange={e => setJoinForm({ ...joinForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                    {t('Designated Pickup Stop', 'পিকআপ স্টপ', lang)}
                  </label>
                  <select
                    className="input-select"
                    style={{ width: '100%' }}
                    value={joinForm.pickupPoint}
                    onChange={e => setJoinForm({ ...joinForm, pickupPoint: e.target.value })}
                  >
                    {activeStops.map((s: RouteStop) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.scheduledTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Shift Schedule', 'শিফট সময়', lang)}
                    </label>
                    <select
                      className="input-select"
                      style={{ width: '100%' }}
                      value={joinForm.shift}
                      onChange={e => setJoinForm({ ...joinForm, shift: e.target.value })}
                    >
                      <option value="Morning Shift (07:00 AM)">Morning Shift (07:00 AM)</option>
                      <option value="Evening Shift (03:00 PM)">Evening Shift (03:00 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px', color: 'var(--brand-slate-700)' }}>
                      {t('Duty Urgency', 'অগ্রাধিকার', lang)}
                    </label>
                    <select
                      className="input-select"
                      style={{ width: '100%' }}
                      value={joinForm.priority}
                      onChange={e => setJoinForm({ ...joinForm, priority: e.target.value as any })}
                    >
                      <option value="Shift">Regular Shift Commute</option>
                      <option value="Emergency">Emergency Maintenance Duty</option>
                      <option value="Overtime">Approved Overtime Shift</option>
                    </select>
                  </div>
                </div>

                <div style={{
                  background: 'var(--brand-slate-50)',
                  border: '1px solid var(--brand-slate-200)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-slate-600)' }}>
                    <span>{t('Your Queue Rank will be:', 'আপনার সম্ভাব্য অপেক্ষার ক্রম:', lang)}</span>
                    <strong style={{ color: 'var(--brand-gold)' }}>#{waitlist.length + 1}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-slate-600)', marginTop: '4px' }}>
                    <span>{t('Current Vacated Standby Seats:', 'বর্তমান ফাঁকা আসন:', lang)}</span>
                    <strong style={{ color: vacatedCount > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>{vacatedCount + emptyCount} {t('seats', 'আসন', lang)}</strong>
                  </div>
                </div>
              </div>

              <div className="app-modal-footer">
                <button type="button" className="btn-outline" onClick={() => setShowJoinModal(false)}>
                  {t('Cancel', 'বাতিল', lang)}
                </button>
                <button type="submit" className="btn-primary">
                  <UserPlus size={14} /> {t('Submit Standby Request', 'আবেদন জমা দিন', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── SUPERVISOR MODAL 1: Register New Bus into Fleet ─────────── */}
      {showRegisterBusModal && (
        <RegisterBusModal
          isOpen={showRegisterBusModal}
          onClose={() => setShowRegisterBusModal(false)}
          onRegister={handleSaveNewBus}
          routes={routes}
          lang={lang}
        />
      )}

      {/* ─── SUPERVISOR MODAL 2: Route Builder (Corridor, Stops, Timetable) ─── */}
      {showRouteBuilderModal && (
        <RouteBuilderModal
          isOpen={showRouteBuilderModal}
          onClose={() => {
            setShowRouteBuilderModal(false);
            setRouteToEdit(null);
          }}
          onSaveRoute={handleSaveRoute}
          existingRoute={routeToEdit || activeRoute}
          buses={buses}
          lang={lang}
        />
      )}

      {/* ─── SUPERVISOR MODAL 3: Supervisor Reserve Seat for Staff ───── */}
      {showSupervisorSeatModal && (
        <SupervisorSeatModal
          isOpen={showSupervisorSeatModal}
          onClose={() => setShowSupervisorSeatModal(false)}
          seat={selectedSeat}
          allSeats={seats}
          activeRoute={activeRoute}
          onAssignSeat={handleSupervisorSaveSeat}
          onVacateSeat={handleSupervisorVacateSeat}
          onClearSeat={handleSupervisorClearSeat}
          lang={lang}
        />
      )}

      {/* ─── SUPERVISOR MODAL 4: Dynamic Bus-to-Route Reassignment ──── */}
      {showReassignBusModal && (
        <ReassignBusRouteModal
          isOpen={showReassignBusModal}
          onClose={() => {
            setShowReassignBusModal(false);
            setReassignBusTarget(null);
          }}
          buses={buses}
          routes={routes}
          initialBusId={reassignBusTarget?.id}
          bookedByRoute={Object.fromEntries(
            Object.entries(routeSeats).map(([id, list]) => [id, list.filter(s => s.status === 'occupied').length]),
          )}
          onReassign={handleReassignBusRoute}
          lang={lang}
        />
      )}
    </div>
  );
}
