import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Bus, Users, MapPin, CheckCircle, Clock, AlertTriangle,
  QrCode, UserMinus, UserPlus, Phone, Compass, BellRing,
  Navigation, CheckCheck, X, Shield, Smartphone, RefreshCw,
  Search, Filter, Calendar, Award, ChevronRight, FileText,
  Printer, ArrowUpRight, Zap, CheckCircle2, UserCheck, Info,
  Fuel, Activity, Gauge, AlertCircle, Share2, Lock, Sparkles,
  ArrowUpDown, Send, Check, RotateCcw, Download, Tag, Radio,
  HelpCircle, AlertOctagon
} from 'lucide-react';

import type { Seat, WaitlistEntry, RouteStop, RouteInfo, BusVehicle } from '../components/bus/busTypes';
export type { Seat, WaitlistEntry, RouteStop, RouteInfo, BusVehicle };

import {
  INITIAL_BUSES,
  INITIAL_ROUTES,
  generateSeatsForRoute,
} from '../components/bus/busData';
import RegisterBusModal from '../components/bus/RegisterBusModal';
import RouteBuilderModal from '../components/bus/RouteBuilderModal';
import SupervisorSeatModal from '../components/bus/SupervisorSeatModal';
import ReassignBusRouteModal from '../components/bus/ReassignBusRouteModal';
import BusFleetOverviewGrid from '../components/bus/BusFleetOverviewGrid';


const INITIAL_SEATS: Seat[] = [
  // Row 1 - Executive / Lead Engineers
  { num: 1, row: 1, col: 'left_win', assignedTo: 'Engr. Harunur Rashid', staffId: 'EMP-0104', dept: 'Plant GM & Operations', phone: '+880 1711-002101', pickupPoint: 'Dhanmondi-27', pickupTime: '06:55 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'executive', bookingType: 'permanent' },
  { num: 2, row: 1, col: 'left_aisle', assignedTo: 'Mizanur Rahman', staffId: 'EMP-0219', dept: 'Quality Assurance', phone: '+880 1712-441122', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+', boarded: true, category: 'executive', bookingType: 'permanent' },
  { num: 3, row: 1, col: 'right_aisle', assignedTo: 'Farhana Kabir', staffId: 'EMP-0312', dept: 'EHS Safety Lead', phone: '+880 1819-556677', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+', boarded: false, category: 'lady_priority', bookingType: 'permanent' },
  { num: 4, row: 1, col: 'right_win', assignedTo: 'Engr. Tariq Ahmed', staffId: 'EMP-0145', dept: 'Maintenance Div.', phone: '+880 1711-002105', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'vacated', vacatedReason: 'Approved Annual Leave', bloodGroup: 'AB+', boarded: false, category: 'executive', bookingType: 'permanent' },

  // Row 2 (Tanvir Ahmed holds Seat #5)
  { num: 5, row: 2, col: 'left_win', assignedTo: 'Tanvir Ahmed', staffId: 'EMP-1042', dept: 'Sales & Distribution', phone: '+880 1720-334455', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'B+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 6, row: 2, col: 'left_aisle', assignedTo: 'Shariful Islam', staffId: 'EMP-0452', dept: 'Refinery Tech', phone: '+880 1713-998877', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 7, row: 2, col: 'right_aisle', assignedTo: 'Rezaul Karim', staffId: 'EMP-0678', dept: 'Instrument Specialist', phone: '+880 1814-223344', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'vacated', vacatedReason: 'Working from Corporate HQ Dhaka', bloodGroup: 'A+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 8, row: 2, col: 'right_win', assignedTo: 'Babul Akhter', staffId: 'EMP-0551', dept: 'Logistics Custodian', phone: '+880 1911-887766', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'O-', boarded: false, category: 'regular', bookingType: 'permanent' },

  // Row 3
  { num: 9, row: 3, col: 'left_win', assignedTo: 'Nurul Amin', staffId: 'EMP-0782', dept: 'Plant Accounts', phone: '+880 1715-667788', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'B+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 10, row: 3, col: 'left_aisle', assignedTo: 'Kamrul Hasan', staffId: 'EMP-0891', dept: 'HR & Administration', phone: '+880 1816-554433', pickupPoint: 'Agargaon Metro Gate', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'A+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 11, row: 3, col: 'right_aisle', assignedTo: 'Saiful Islam', staffId: 'EMP-0924', dept: 'Lab Chemist', phone: '+880 1917-443322', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'AB+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 12, row: 3, col: 'right_win', assignedTo: null, staffId: undefined, dept: null, status: 'empty', boarded: false, category: 'regular' },

  // Row 4
  { num: 13, row: 4, col: 'left_win', assignedTo: 'Arif Hossain', staffId: 'EMP-1102', dept: 'Security Officer', phone: '+880 1718-223311', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 14, row: 4, col: 'left_aisle', assignedTo: 'Al-Amin Mia', staffId: 'EMP-1205', dept: 'Boiler Operator', phone: '+880 1819-112233', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'B+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 15, row: 4, col: 'right_aisle', assignedTo: 'Mahbub Alam', staffId: 'EMP-1311', dept: 'Electrical Engr.', phone: '+880 1920-334455', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'A+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 16, row: 4, col: 'right_win', assignedTo: 'Tofazzal Hossain', staffId: 'EMP-1402', dept: 'Maintenance', phone: '+880 1725-889900', pickupPoint: 'Agargaon Metro Gate', pickupTime: '07:00 AM', status: 'vacated', vacatedReason: 'Self-commute by motorcycle today', bloodGroup: 'B+', boarded: false, category: 'regular', bookingType: 'permanent' },

  // Row 5
  { num: 17, row: 5, col: 'left_win', assignedTo: 'Delwar Hossain', staffId: 'EMP-1520', dept: 'Plant Instrumentation', phone: '+880 1721-667788', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 18, row: 5, col: 'left_aisle', assignedTo: 'Jahangir Alam', staffId: 'EMP-1632', dept: 'Shift Marshall', phone: '+880 1822-778899', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'A+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 19, row: 5, col: 'right_aisle', assignedTo: 'Moniruzzaman', staffId: 'EMP-1744', dept: 'Piping Specialist', phone: '+880 1923-889900', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'B+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 20, row: 5, col: 'right_win', assignedTo: null, dept: null, status: 'empty', boarded: false, category: 'regular' },

  // Row 6
  { num: 21, row: 6, col: 'left_win', assignedTo: 'Zahirul Haque', staffId: 'EMP-1850', dept: 'Terminal Dispatch', phone: '+880 1726-112233', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 22, row: 6, col: 'left_aisle', assignedTo: 'Shahidul Islam', staffId: 'EMP-1901', dept: 'Warehouse Lead', phone: '+880 1827-223344', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 23, row: 6, col: 'right_aisle', assignedTo: 'Imran Nazir', staffId: 'EMP-2015', dept: 'Refinery Process', phone: '+880 1928-334455', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 24, row: 6, col: 'right_win', assignedTo: 'Anwar Sadat', staffId: 'EMP-2108', dept: 'Safety Inspector', phone: '+880 1729-445566', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'AB+', boarded: false, category: 'regular', bookingType: 'permanent' },

  // Row 7
  { num: 25, row: 7, col: 'left_win', assignedTo: 'Golam Mostafa', staffId: 'EMP-2210', dept: 'Turbine Mechanic', phone: '+880 1730-556677', pickupPoint: 'Agargaon Metro Gate', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 26, row: 7, col: 'left_aisle', assignedTo: 'Nazrul Islam', staffId: 'EMP-2322', dept: 'Compressor Tech', phone: '+880 1831-667788', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 27, row: 7, col: 'right_aisle', assignedTo: 'Asaduzzaman', staffId: 'EMP-2433', dept: 'LPG Bottling', phone: '+880 1932-778899', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 28, row: 7, col: 'right_win', assignedTo: 'Mustafizur Rahman', staffId: 'EMP-2544', dept: 'Instrumentation', phone: '+880 1733-889900', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'O-', boarded: false, category: 'regular', bookingType: 'permanent' },

  // Row 8
  { num: 29, row: 8, col: 'left_win', assignedTo: 'Habibur Rahman', staffId: 'EMP-2655', dept: 'Control Room Tech', phone: '+880 1734-990011', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'A+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 30, row: 8, col: 'left_aisle', assignedTo: 'Rabiul Awal', staffId: 'EMP-2766', dept: 'HVAC Specialist', phone: '+880 1835-001122', pickupPoint: 'Agargaon Metro Gate', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'B+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 31, row: 8, col: 'right_aisle', assignedTo: 'Kawsar Ahmed', staffId: 'EMP-2877', dept: 'Water Treatment', phone: '+880 1936-112233', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'O+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 32, row: 8, col: 'right_win', assignedTo: null, dept: null, status: 'empty', boarded: false, category: 'regular' },

  // Row 9
  { num: 33, row: 9, col: 'left_win', assignedTo: 'Shamsul Alam', staffId: 'EMP-2988', dept: 'Fire & Safety Officer', phone: '+880 1737-223344', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 34, row: 9, col: 'left_aisle', assignedTo: 'Liton Das', staffId: 'EMP-3099', dept: 'Plant Chemist', phone: '+880 1838-334455', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 35, row: 9, col: 'right_aisle', assignedTo: 'Akram Hossain', staffId: 'EMP-3101', dept: 'Tank Farm Operator', phone: '+880 1939-445566', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 36, row: 9, col: 'right_win', assignedTo: 'Bazlur Rashid', staffId: 'EMP-3212', dept: 'Pipeline Welder', phone: '+880 1740-556677', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'AB+', boarded: false, category: 'regular', bookingType: 'permanent' },

  // Row 10
  { num: 37, row: 10, col: 'left_win', assignedTo: 'Selim Mia', staffId: 'EMP-3323', dept: 'Generators Lead', phone: '+880 1741-667788', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 38, row: 10, col: 'left_aisle', assignedTo: 'Ashraful Islam', staffId: 'EMP-3434', dept: 'Maintenance Fitter', phone: '+880 1842-778899', pickupPoint: 'Agargaon Metro Gate', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'A+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 39, row: 10, col: 'right_aisle', assignedTo: 'Farid Uddin', staffId: 'EMP-3545', dept: 'Civil Works Tech', phone: '+880 1943-889900', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 40, row: 10, col: 'right_win', assignedTo: null, dept: null, status: 'empty', boarded: false, category: 'regular' },

  // Row 11
  { num: 41, row: 11, col: 'left_win', assignedTo: 'Mainul Islam', staffId: 'EMP-3656', dept: 'Flare System Tech', phone: '+880 1744-990011', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 42, row: 11, col: 'left_aisle', assignedTo: 'Badrul Huda', staffId: 'EMP-3767', dept: 'Security Escort', phone: '+880 1845-001122', pickupPoint: 'Agargaon Metro Gate', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'A+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 43, row: 11, col: 'right_aisle', assignedTo: 'Nazim Uddin', staffId: 'EMP-3878', dept: 'Stores Supervisor', phone: '+880 1946-112233', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 44, row: 11, col: 'right_win', assignedTo: 'Saidur Rahman', staffId: 'EMP-3989', dept: 'Canteen Supervisor', phone: '+880 1747-223344', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'O+', boarded: false, category: 'regular', bookingType: 'permanent' },

  // Row 12
  { num: 45, row: 12, col: 'left_win', assignedTo: 'Touhidul Islam', staffId: 'EMP-4090', dept: 'Electrical Substation', phone: '+880 1748-334455', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'AB+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 46, row: 12, col: 'left_aisle', assignedTo: 'Belal Hossain', staffId: 'EMP-4101', dept: 'Laboratory Asst.', phone: '+880 1849-445566', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 47, row: 12, col: 'right_aisle', assignedTo: 'Sultan Mahmud', staffId: 'EMP-4212', dept: 'Diesel Generator Tech', phone: '+880 1950-556677', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 48, row: 12, col: 'right_win', assignedTo: null, dept: null, status: 'empty', boarded: false, category: 'regular' },

  // Row 13 - Rear Row
  { num: 49, row: 13, col: 'left_win', assignedTo: 'Enamul Haque', staffId: 'EMP-4323', dept: 'Refinery Utilities', phone: '+880 1751-667788', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'O+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 50, row: 13, col: 'left_aisle', assignedTo: 'Firoz Ahmed', staffId: 'EMP-4434', dept: 'Logistics Handler', phone: '+880 1852-778899', pickupPoint: 'Agargaon Metro Gate', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'B+', boarded: true, category: 'regular', bookingType: 'permanent' },
  { num: 51, row: 13, col: 'right_aisle', assignedTo: 'Sajid Hasan', staffId: 'EMP-4545', dept: 'EHS Assistant', phone: '+880 1953-889900', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'A+', boarded: false, category: 'regular', bookingType: 'permanent' },
  { num: 52, row: 13, col: 'right_win', assignedTo: 'Rokonuzzaman', staffId: 'EMP-4656', dept: 'Security Gate Staff', phone: '+880 1754-990011', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'O+', boarded: false, category: 'regular', bookingType: 'permanent' },
];

const INITIAL_WAITLIST: WaitlistEntry[] = [
  { rank: 1, staffId: 'EMP-5501', name: 'Shahadat Hossain', dept: 'Mechanical Tech', pickupPoint: 'Farmgate Overbridge', phone: '+880 1718-445566', joinedAt: '06:12 AM', priority: 'Emergency', shift: 'Morning Shift (07:00 AM)' },
  { rank: 2, staffId: 'EMP-5502', name: 'Nasir Uddin', dept: 'Refinery Operator', pickupPoint: 'Shahbagh Square', phone: '+880 1823-998811', joinedAt: '06:25 AM', priority: 'Shift', shift: 'Morning Shift (07:00 AM)' },
  { rank: 3, staffId: 'EMP-5503', name: 'Ziaur Rahman', dept: 'Procurement Asst.', pickupPoint: 'Babubazar Bridge', phone: '+880 1912-334455', joinedAt: '06:33 AM', priority: 'Shift', shift: 'Morning Shift (07:00 AM)' },
  { rank: 4, staffId: 'EMP-5504', name: 'Sabbir Ahmed', dept: 'Chemical Blending Tech', pickupPoint: 'Farmgate Overbridge', phone: '+880 1729-110022', joinedAt: '06:40 AM', priority: 'Overtime', shift: 'Morning Shift (07:00 AM)' },
  { rank: 5, staffId: 'EMP-5505', name: 'Tarek Mansoor', dept: 'EHS Compliance Officer', pickupPoint: 'Mirpur-10 Circle', phone: '+880 1830-449922', joinedAt: '06:48 AM', priority: 'Emergency', shift: 'Morning Shift (07:00 AM)' },
];

export default function BusView({ role, lang }: ViewProps) {
  // Operational perspective: staff vs supervisor (default to supervisor if role is transport_admin)
  const [activePerspective, setActivePerspective] = useState<'staff' | 'supervisor'>(
    role === 'transport_admin' ? 'supervisor' : 'staff'
  );

  // Commute Direction & Date
  const [commuteDirection, setCommuteDirection] = useState<'inbound' | 'outbound'>('inbound');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-22');

  // Bus Fleet and Routes State (All 10 Commuter Buses)
  const [buses, setBuses] = useState<BusVehicle[]>(INITIAL_BUSES);
  const [routes, setRoutes] = useState<Record<string, RouteInfo>>(INITIAL_ROUTES);
  const [routeSeats, setRouteSeats] = useState<Record<string, Seat[]>>(() => {
    const initial: Record<string, Seat[]> = {
      'route-1': INITIAL_SEATS,
    };
    Object.keys(INITIAL_ROUTES).forEach(k => {
      if (k !== 'route-1') {
        initial[k] = generateSeatsForRoute(k, INITIAL_ROUTES[k]?.capacity || 52);
      }
    });
    return initial;
  });

  // Supervisor deck sub-tab: 'fleet' (10-bus grid) vs 'seats' (52-seater layout)
  const [supervisorSubTab, setSupervisorSubTab] = useState<'fleet' | 'seats'>('fleet');

  // Routes & Seats State
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('route-1');
  const [seats, setSeatsState] = useState<Seat[]>(INITIAL_SEATS);

  // Synchronized setter for seats that maintains routeSeats map
  const setSeats = (action: React.SetStateAction<Seat[]>) => {
    setSeatsState(prev => {
      const nextVal = typeof action === 'function' ? action(prev) : action;
      setRouteSeats(rPrev => ({
        ...rPrev,
        [selectedRouteKey]: nextVal,
      }));
      return nextVal;
    });
  };

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(INITIAL_SEATS[4]); // Seat #5 Tanvir Ahmed

  // Filters & Tabs
  const [seatFilter, setSeatFilter] = useState<'all' | 'occupied' | 'vacated' | 'empty' | 'mine'>('all');
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

  // Direct Booking Form State
  const [bookForm, setBookForm] = useState({
    name: 'Tanvir Ahmed',
    staffId: 'EMP-1042',
    dept: 'Sales & Distribution',
    phone: '+880 1720-334455',
    pickupPoint: 'Farmgate Overbridge',
    bookingType: 'shift_pass' as 'permanent' | 'shift_pass' | 'guest',
    commuterCategory: 'Employee Commute',
    bloodGroup: 'B+',
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
    active: true,
    type: 'info',
    message: 'All GPS satellite beacons synchronised. Normal morning commute transit in progress.',
    time: '07:22 AM'
  });

  // Form for joining waitlist
  const [joinForm, setJoinForm] = useState({
    name: 'Tanvir Ahmed',
    staffId: 'EMP-1042',
    dept: 'Sales & Distribution',
    phone: '+880 1720-334455',
    pickupPoint: 'Farmgate Overbridge',
    priority: 'Shift' as 'Shift' | 'Emergency' | 'Overtime',
    shift: 'Morning Shift (07:00 AM)',
  });

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

  // Current logged-in user profile (Tanvir Ahmed, Seat #5)
  const mySeat = seats.find(s => s.num === 5);
  const isMySeatVacated = mySeat?.status === 'vacated';
  const myWaitlistEntry = waitlist.find(w => w.staffId === 'EMP-1042' || w.name === 'Tanvir Ahmed');

  // Counts
  const occupiedCount = seats.filter(s => s.status === 'occupied').length;
  const vacatedCount = seats.filter(s => s.status === 'vacated').length;
  const emptyCount = seats.filter(s => s.status === 'empty').length;
  const boardedCount = seats.filter(s => s.status === 'occupied' && s.boarded).length;
  const totalSeats = seats.length;
  const fillRate = ((occupiedCount / totalSeats) * 100).toFixed(0);

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
    setSeats(prev => prev.map(s => {
      if (s.num === 5) {
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
        `Seat #05 voluntarily released for today. Candidate #${waitlist[0]?.rank || 1} will be promoted by Transport Cell.`,
        `আজকের জন্য ৫ নম্বর আসন ছেড়ে দেওয়া হয়েছে। অপেক্ষমান সহকর্মীকে সুযোগ দেওয়ার জন্য ধন্যবাদ।`,
        lang
      ),
      'gold'
    );
  };

  // Employee Reclaim My Seat Action
  const handleReclaimMySeat = () => {
    setSeats(prev => prev.map(s => {
      if (s.num === 5) {
        return {
          ...s,
          assignedTo: 'Tanvir Ahmed',
          staffId: 'EMP-1042',
          dept: 'Sales & Distribution',
          phone: '+880 1720-334455',
          pickupPoint: 'Farmgate Overbridge',
          pickupTime: '07:18 AM',
          status: 'occupied',
          vacatedReason: undefined,
          isStandbyPromoted: false,
        };
      }
      return s;
    }));
    showToast(
      t('Seat #05 reclaimed successfully. Your QR boarding pass is active.', '৫ নম্বর আসন পুনরুদ্ধার করা হয়েছে।', lang),
      'info'
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
          staffId: bookForm.staffId || `GST-${Math.floor(1000 + Math.random() * 9000)}`,
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
      joinedAt: 'Just Now (07:35 AM)',
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
      const remaining = prev.filter(w => w.staffId !== 'EMP-1042' && w.name !== 'Tanvir Ahmed');
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
        `⚡ Transport Cell: Promoted ${toPromote} FIFO candidates to available seats. SMS passes dispatched!`,
        `⚡ পরিবহন সেল: ফিফো ক্রমানুসারে ${toPromote} জন প্রার্থীকে আসন বরাদ্দ দেওয়া হয়েছে।`,
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
      time: 'Just Now'
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
    const targetSeats = routeSeats[routeKey] || generateSeatsForRoute(routeKey, routes[routeKey]?.capacity || 52);
    setSeatsState(targetSeats);
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
    setRoutes(prev => ({
      ...prev,
      [updatedRoute.id]: updatedRoute,
    }));
    setBuses(prev => prev.map(b => {
      if (b.assignedRouteId === updatedRoute.id) {
        return {
          ...b,
          assignedRoadName: updatedRoute.name.split(':')[1]?.trim() || updatedRoute.name,
          driverName: updatedRoute.driverName,
          driverPhone: updatedRoute.driverPhone,
          conductorName: updatedRoute.conductorName,
          conductorPhone: updatedRoute.conductorPhone,
        };
      }
      return b;
    }));
    showToast(
      t(
        `✓ Road Corridor "${updatedRoute.name}" path & stoppages saved successfully!`,
        `✓ রোড করিডোর ও স্টপেজ সময়সূচী সংরক্ষণ সম্পন্ন হয়েছে!`,
        lang
      ),
      'gold'
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

  // Supervisor: Reassign Bus to another Route
  const handleReassignBusRoute = (busId: string, newRouteId: string, reason: string) => {
    const targetRoute = routes[newRouteId];
    if (!targetRoute) return;

    setBuses(prev => prev.map(b => {
      if (b.id === busId) {
        return {
          ...b,
          assignedRouteId: newRouteId,
          assignedRoadName: targetRoute.name.split(':')[1]?.trim() || targetRoute.name,
        };
      }
      return b;
    }));

    showToast(
      t(
        `✓ Bus reallocated to ${targetRoute.name}. Real-time passenger SMS & Dispatch notice fired: "${reason}"`,
        `✓ বাস নতুন রুটে স্থানান্তরিত হয়েছে। যাত্রীদের সতর্কবার্তা প্রেরণ করা হয়েছে।`,
        lang
      ),
      'gold'
    );
  };

  return (
    <div className="view-container view-transition-wrapper">
      {/* ─── Top Header with Perspective Switcher & Enterprise Quick Tools ── */}
      <div className="section-header" style={{ marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              🚍 {t('Plant Transit & Bus Seat Reservation Management', 'প্ল্যান্ট যাতায়াত ও বাস সিট রিজার্ভেশন ম্যানেজমেন্ট', lang)}
            </h2>
            <span className="badge info" style={{ fontSize: '10px' }}>
              {activeRoute.coachNo}
            </span>
            <span className="badge gold" style={{ fontSize: '10px' }}>
              {selectedDate === '2026-10-22' ? t('Today (22 Oct)', 'আজ (২২ অক্টোবর)', lang) : selectedDate}
            </span>
          </div>
          <p className="section-subtitle" style={{ marginTop: '4px' }}>
            {t(
              'Interactive 52-seater coach fuselage, instant seat booking, automated FIFO waitlist, GPS route corridors & security manifest.',
              '৫২-সিটার কোচ লেআউট, তাৎক্ষণিক আসন বুকিং, স্বয়ংক্রিয় ফিফো অপেক্ষাতালিকা, জিপিএস ট্র্যাকিং ও নিরাপত্তা গেট পাস।',
              lang
            )}
          </p>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Commute Direction Switcher */}
          <div style={{
            background: 'var(--brand-slate-100, #F1F5F9)',
            padding: '3px',
            borderRadius: '8px',
            display: 'flex',
            border: '1px solid var(--brand-slate-300)'
          }}>
            <button
              onClick={() => {
                setCommuteDirection('inbound');
                showToast(t('Switched to Morning Inbound Shift (City ➔ Plant Gate-1)', 'সকালের শিফট (শহর ➔ প্ল্যান্ট)', lang), 'info');
              }}
              style={{
                background: commuteDirection === 'inbound' ? '#FFFFFF' : 'transparent',
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
              <span>🌅 {t('Morning Inbound', 'সকাল শিফট', lang)}</span>
            </button>
            <button
              onClick={() => {
                setCommuteDirection('outbound');
                showToast(t('Switched to Evening Outbound Return (Plant Gate-1 ➔ City)', 'সন্ধ্যার ফিরতি শিফট (প্ল্যান্ট ➔ শহর)', lang), 'info');
              }}
              style={{
                background: commuteDirection === 'outbound' ? '#FFFFFF' : 'transparent',
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
              <span>🌇 {t('Evening Return', 'সন্ধ্যা ফিরতি', lang)}</span>
            </button>
          </div>

          {/* Operational Perspective Switcher (Staff vs Transport Supervisor) */}
          <div style={{
            background: 'var(--brand-slate-100, #F1F5F9)',
            padding: '3px',
            borderRadius: '8px',
            display: 'flex',
            border: '1px solid var(--brand-slate-300)'
          }}>
            <button
              onClick={() => {
                setActivePerspective('staff');
                showToast(t('Switched to Staff Commuter Self-Service Mode (Tanvir Ahmed)', 'স্টাফ সেলফ-সার্ভিস মোড সক্রিয়', lang), 'info');
              }}
              style={{
                background: activePerspective === 'staff' ? '#FFFFFF' : 'transparent',
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
              <span>👤 {t('Staff View', 'স্টাফ ভিউ', lang)}</span>
            </button>

            <button
              onClick={() => {
                setActivePerspective('supervisor');
                showToast(t('Switched to Transport Supervisor Administrative Mode (Md. Kamruzzaman)', 'পরিবহন পরিদর্শক মোড সক্রিয়', lang), 'gold');
              }}
              style={{
                background: activePerspective === 'supervisor' ? '#D4AF37' : 'transparent',
                color: activePerspective === 'supervisor' ? '#000' : 'var(--brand-slate-500)',
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

          {/* Security Gate Manifest */}
          <button className="btn-outline" onClick={() => setShowManifestModal(true)} title="Security Gate Commuter Manifest">
            <FileText size={13} /> {t('Gate Manifest', 'গেট পাস তালিকা', lang)}
          </button>

          {/* Conductor Scanner */}
          <button className="btn-outline" onClick={() => setShowScannerModal(true)} title="Conductor Scanner">
            <Smartphone size={13} /> {t('Conductor Scanner', 'স্ক্যানার', lang)}
          </button>

          {/* Timetable */}
          <button className="btn-outline" onClick={() => setShowTimetableModal(true)}>
            <Calendar size={13} /> {t('Timetable', 'সময়সূচী', lang)}
          </button>

          {/* My Boarding Pass */}
          <button
            className="btn-primary"
            onClick={() => {
              setQrSeatTarget(mySeat || seats[4]);
              setShowQrModal(true);
            }}
          >
            <QrCode size={13} /> {t('My Boarding Pass', 'বোর্ডিং পাস', lang)}
          </button>
        </div>
      </div>

      {/* ─── Live Transit Notice / Incident Broadcast Bar ───────────── */}
      {routeAlert.active && (
        <div style={{
          background: routeAlert.type === 'warning' ? '#FFFBEB' : 'rgba(59, 130, 246, 0.08)',
          border: routeAlert.type === 'warning' ? '1px solid #FCD34D' : '1px solid rgba(59, 130, 246, 0.25)',
          padding: '8px 14px',
          borderRadius: '10px',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: routeAlert.type === 'warning' ? '#92400E' : 'var(--brand-slate-800)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {routeAlert.type === 'warning' ? <AlertTriangle size={15} color="#D97706" /> : <Info size={15} color="#2563EB" />}
            <div>
              <strong>{t('Live Transit Telemetry Notice:', 'লাইভ ট্রানজিট নোটিশ:', lang)}</strong>{' '}
              {routeAlert.message}{' '}
              <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', marginLeft: '6px' }}>({routeAlert.time})</span>
            </div>
          </div>
          {activePerspective === 'supervisor' && (
            <button
              className="btn-outline"
              style={{ fontSize: '10.5px', padding: '3px 8px', borderColor: '#D4AF37', color: '#B45309' }}
              onClick={() => setShowBroadcastModal(true)}
            >
              <Send size={11} /> {t('Broadcast Notice', 'বিজ্ঞপ্তি পাঠান', lang)}
            </button>
          )}
        </div>
      )}

      {/* ─── Role Operational Boundary Callout Strip ────────────────── */}
      {activePerspective === 'staff' ? (
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
            <Lock size={15} color="#2563EB" />
            <div>
              <strong>{t('Employee Commuter Self-Service Mode:', 'কর্মচারী সেলফ-সার্ভিস মোড:', lang)}</strong>{' '}
              {t(
                'View live coach seat occupancy, book unassigned empty seats, release or reclaim your Seat #05, request peer seat swaps, and track GPS route progress in real-time.',
                'লাইভ সিট দখল দেখুন, খালি সিট বুক করুন, ৫ নম্বর আসন পরিচালনা করুন, সিট সোয়াপ আবেদন এবং জিপিএস ট্র্যাকিং করুন।',
                lang
              )}
            </div>
          </div>
          <button
            className="btn-outline"
            style={{ fontSize: '10.5px', padding: '3px 8px' }}
            onClick={() => setShowPolicyModal(true)}
          >
            <HelpCircle size={12} /> {t('Transit Rules', 'যাতায়াত নিয়মাবলী', lang)}
          </button>
        </div>
      ) : (
        <>
          {/* Supervisor Status Banner */}
          <div style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1.5px solid #D4AF37',
            padding: '9px 14px',
            borderRadius: '10px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11.5px',
            color: 'var(--brand-slate-900)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="#B45309" />
              <div>
                <strong>{t('Plant Transport Supervisor Administrative Mode (Md. Kamruzzaman):', 'পরিবহন পরিদর্শক প্রশাসনিক মোড:', lang)}</strong>{' '}
                {t(
                  'Full operational control to register buses, define road paths & sequential stops, assign drivers, reserve specific seats for any employee, and execute automated FIFO promotions.',
                  'বাস নিবন্ধন, রোড ও স্টপেজ নির্ধারণ, চালক নিয়োগ, কর্মচারীদের আসন বরাদ্দ এবং স্বয়ংক্রিয় ফিফো বণ্টনের সম্পূর্ণ প্রশাসনিক ক্ষমতা।',
                  lang
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn-outline"
                style={{ fontSize: '10.5px', padding: '4px 9px', borderColor: '#D4AF37', color: '#B45309' }}
                onClick={() => setShowBroadcastModal(true)}
              >
                <Send size={11} /> {t('Broadcast Delay', 'বিলম্ব বিজ্ঞপ্তি', lang)}
              </button>
              <button
                className="btn-gold"
                style={{ fontSize: '10.5px', padding: '4px 10px', whiteSpace: 'nowrap' }}
                onClick={handleSupervisorAutoFIFO}
              >
                <Sparkles size={12} /> {t('⚡ Run Auto-FIFO Engine', 'স্বয়ংক্রিয় ফিফো রান', lang)}
              </button>
            </div>
          </div>

          {/* Supervisor Command Sub-Tabs & Direct Actions */}
          <div style={{
            background: 'linear-gradient(135deg, #091024 0%, #1e293b 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.6)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            {/* View Sub-Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('Supervisor View:', 'সুপারভাইজার ভিউ:', lang)}
              </span>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', padding: '3px', borderRadius: '8px', gap: '3px' }}>
                <button
                  onClick={() => setSupervisorSubTab('fleet')}
                  style={{
                    background: supervisorSubTab === 'fleet' ? '#D4AF37' : 'transparent',
                    color: supervisorSubTab === 'fleet' ? '#000000' : '#E2E8F0',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Bus size={13} />
                  <span>{t('10-Bus Fleet & Road Corridors', '১০টি বাস ও রোড করিডোর তালিকা', lang)}</span>
                  <span style={{
                    fontSize: '10px',
                    background: supervisorSubTab === 'fleet' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
                    padding: '1px 5px',
                    borderRadius: '10px'
                  }}>
                    {buses.length}
                  </span>
                </button>

                <button
                  onClick={() => setSupervisorSubTab('seats')}
                  style={{
                    background: supervisorSubTab === 'seats' ? '#D4AF37' : 'transparent',
                    color: supervisorSubTab === 'seats' ? '#000000' : '#E2E8F0',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Users size={13} />
                  <span>{t('Interactive 52-Seat Coach & FIFO Desk', '৫২-সিটার বাস লেআউট ও ফিফো', lang)}</span>
                </button>
              </div>
            </div>

            {/* Direct Supervisor Action Triggers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowRegisterBusModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                }}
              >
                <UserPlus size={13} />
                <span>+ {t('Enlist New Bus', 'নতুন বাস যুক্ত করুন', lang)}</span>
              </button>

              <button
                onClick={() => {
                  setRouteToEdit(activeRoute);
                  setShowRouteBuilderModal(true);
                }}
                style={{
                  background: 'rgba(212, 175, 55, 0.18)',
                  border: '1.5px solid #D4AF37',
                  color: '#FDE68A',
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <MapPin size={13} />
                <span>{t('Define Road & Stops', 'রোড ও স্টপেজ তৈরি', lang)}</span>
              </button>

              <button
                onClick={() => setShowSupervisorSeatModal(true)}
                style={{
                  background: 'rgba(59, 130, 246, 0.18)',
                  border: '1.5px solid #60A5FA',
                  color: '#93C5FD',
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Award size={13} />
                <span>{t('Reserve Seat for Staff', 'স্টাফের জন্য সিট রিজার্ভ', lang)}</span>
              </button>

              <button
                onClick={() => {
                  const b = buses.find(x => x.assignedRouteId === selectedRouteKey) || buses[0];
                  setReassignBusTarget(b);
                  setShowReassignBusModal(true);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#F1F5F9',
                  padding: '5px 11px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RefreshCw size={13} />
                <span>{t('Reassign Bus', 'বাস পরিবর্তন', lang)}</span>
              </button>
            </div>
          </div>
        </>
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
          lang={lang}
        />
      ) : (
        <>
          {/* ─── Unified Sleek Commuter & Fleet Command Bar ─────────────── */}
          <div className="card mb-3" style={{
        background: 'linear-gradient(135deg, #091024 0%, #111D3B 100%)',
        color: '#FFFFFF',
        border: '1px solid #1E293B',
        boxShadow: 'var(--shadow-sm)',
        padding: '14px 18px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.35fr 1.1fr', gap: '16px', alignItems: 'center' }}>
          {/* Sub-card 1: My Personal Commute Dossier */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: isMySeatVacated ? 'rgba(212, 175, 55, 0.2)' : 'rgba(225, 29, 72, 0.2)',
                border: isMySeatVacated ? '1.5px solid #D4AF37' : '1.5px solid var(--brand-crimson)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isMySeatVacated ? '#FDE68A' : '#FDA4AF',
                fontWeight: 900,
                fontSize: '14px'
              }}>
                #05
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800 }}>Tanvir Ahmed</span>
                  <span className={`badge ${isMySeatVacated ? 'gold' : 'success'}`} style={{ fontSize: '8.5px', padding: '1px 5px' }}>
                    {isMySeatVacated ? t('Vacated Today', 'আজ ফাঁকা', lang) : t('Confirmed', 'নিশ্চিত', lang)}
                  </span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                  Route-1 · 📍 Farmgate Overbridge ({commuteDirection === 'inbound' ? '07:18 AM' : '06:05 PM'})
                </div>
              </div>
            </div>

            {/* Quick Action for Employee */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {isMySeatVacated ? (
                <button
                  className="btn-gold"
                  style={{ fontSize: '10.5px', padding: '4px 8px' }}
                  onClick={handleReclaimMySeat}
                  title="Reclaim Seat #05"
                >
                  <UserPlus size={11} /> {t('Reclaim', 'পুনরুদ্ধার', lang)}
                </button>
              ) : (
                <button
                  style={{
                    background: 'rgba(212, 175, 55, 0.15)',
                    border: '1px solid #D4AF37',
                    color: '#FDE68A',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => setShowVacateDialog(true)}
                  title="Release Seat for Today"
                >
                  <UserMinus size={11} /> {t('Release', 'ছেড়ে দিন', lang)}
                </button>
              )}
            </div>
          </div>

          {/* Sub-card 2: Route Selector & Live Beacon */}
          <div>
            {/* Route Selector Tabs (All 10 Routes) */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '6px', overflowX: 'auto', paddingBottom: '3px' }}>
              {Object.values(routes).map((route: RouteInfo) => {
                const isSelected = route.id === selectedRouteKey;
                return (
                  <button
                    key={route.id}
                    onClick={() => handleSelectRoute(route.id)}
                    style={{
                      background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      border: isSelected ? '1.5px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isSelected ? '#FDE68A' : '#CBD5E1',
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    title={`${route.coachNo} - ${route.name}`}
                  >
                    <span>{route.coachNo}</span>
                    <span style={{ opacity: 0.65, fontSize: '9.5px' }}>({route.name.split(':')[0]})</span>
                    {isSelected && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34D399' }} />}
                  </button>
                );
              })}
            </div>

            {/* Live Progress Bar with Next Station */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Navigation size={12} color="#34D399" />
                <span style={{ color: '#94A3B8' }}>{t('Next Station:', 'পরবর্তী স্টপ:', lang)}</span>
                <strong style={{ color: '#FDE047' }}>
                  {commuteDirection === 'inbound' ? activeRoute.nextStop : activeRoute.outboundStops[1]?.name || 'Babubazar Bridge Ramp'}
                </strong>
              </div>
              <div style={{ color: '#34D399', fontWeight: 800 }}>
                {activeRoute.speed} · {commuteDirection === 'inbound' ? activeRoute.nextEta : '14 mins (05:32 PM)'}
              </div>
            </div>

            {/* Simulated Track Line */}
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${activeRoute.progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #D4AF37)', borderRadius: '2px' }} />
            </div>
          </div>

          {/* Sub-card 3: Key Shuttle Metrics */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '8px 12px'
          }}>
            <div>
              <div style={{ fontSize: '9.5px', color: '#94A3B8', textTransform: 'uppercase' }}>
                {t('Occupancy', 'আসন দখল', lang)}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8' }}>
                {occupiedCount}/{totalSeats} <span style={{ fontSize: '10px', color: '#94A3B8' }}>({fillRate}%)</span>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '10px' }}>
              <div style={{ fontSize: '9.5px', color: '#94A3B8', textTransform: 'uppercase' }}>
                {t('Boarded', 'বোর্ডিং সম্পন্ন', lang)}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>
                {boardedCount} <span style={{ fontSize: '9.5px', color: '#6EE7B7' }}>{t('pax', 'জন', lang)}</span>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '10px' }}>
              <div style={{ fontSize: '9.5px', color: '#94A3B8', textTransform: 'uppercase' }}>
                {t('Standby / Free', 'ফাঁকা / দাবিযোগ্য', lang)}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#D4AF37' }}>
                {vacatedCount + emptyCount} <span style={{ fontSize: '9.5px', color: '#FDE68A' }}>{t('Seats', 'সিট', lang)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search & Quick Action Toolbar ──────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Passenger Search Input */}
        <div style={{
          position: 'relative',
          flex: '1',
          minWidth: '260px',
          maxWidth: '460px'
        }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--brand-slate-400)' }} />
          <input
            type="text"
            className="input-text"
            style={{ width: '100%', paddingLeft: '32px', height: '32px', fontSize: '12px' }}
            placeholder={t('Search passenger by name, staff ID, dept, or blood group...', 'যাত্রী খুঁজুন (নাম, আইডি, বিভাগ, রক্তের গ্রুপ)...', lang)}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
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

        {/* Search match stats */}
        {searchQuery.trim() && (
          <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', background: 'var(--brand-slate-100)', padding: '4px 10px', borderRadius: '6px' }}>
            {t('Matched Passengers:', 'পাওয়া গেছে:', lang)}{' '}
            <strong style={{ color: 'var(--brand-crimson)' }}>{filteredSearchSeats.length}</strong> {t('seats highlighted', 'সিট হাইলাইট করা হয়েছে', lang)}
          </div>
        )}

        {/* Action Button: Book Any Free Seat */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
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
      </div>

      {/* ─── 2-Column Master-Cockpit Layout ──────────────────────────── */}
      <div className="bus-two-col-layout">
        {/* LEFT COLUMN: 52-Seater Coach Cabin Deck */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' }}>
                <Bus size={18} />
              </div>
              <div>
                <div className="card-title">
                  {t('52-Seater Executive Coach Cabin Deck', '৫২-সিটার এক্সিকিউটিভ কোচ ক্যাবিন বিন্যাস', lang)}
                </div>
                <div className="card-subtitle">
                  {activeRoute.model} · {activeRoute.coachNo}
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'occupied', 'vacated', 'mine', 'empty'] as const).map(filterKey => {
                const isActive = seatFilter === filterKey;
                const labels: Record<string, string> = {
                  all: t('All (52)', 'সব (৫২)', lang),
                  occupied: t(`Occupied (${occupiedCount})`, `পূর্ণ (${occupiedCount})`, lang),
                  vacated: t(`Free (${vacatedCount})`, `ফাঁকা (${vacatedCount})`, lang),
                  mine: t('My Seat', 'আমার সিট', lang),
                  empty: t(`Empty (${emptyCount})`, `খালি (${emptyCount})`, lang),
                };
                return (
                  <button
                    key={filterKey}
                    onClick={() => setSeatFilter(filterKey)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isActive ? '1px solid var(--brand-crimson)' : '1px solid var(--brand-slate-200)',
                      background: isActive ? 'var(--brand-crimson)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--brand-slate-600)'
                    }}
                  >
                    {labels[filterKey]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card-body" style={{ padding: '16px' }}>
            {/* Visual Bus Fuselage Container */}
            <div className="bus-fuselage-frame">
              {/* Front Cabin Windshield with Driver & Pneumatic Door */}
              <div className="bus-windshield-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={16} color="#D4AF37" />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                      CABIN FRONT · DRIVER COCKPIT
                    </div>
                    <div style={{ fontSize: '9px', color: '#94A3B8' }}>{activeRoute.driverName} (D-1) · GPS Satellite Beacon Active</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', color: '#34D399', fontWeight: 700 }}>
                  <CheckCheck size={12} />
                  <span>DOOR 1 🚪</span>
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
                    const isMine = s.num === 5;
                    const isBoarded = s.boarded;

                    // Match active filter
                    const matchesFilter =
                      seatFilter === 'all' ||
                      (seatFilter === 'occupied' && isOccupied) ||
                      (seatFilter === 'vacated' && isVacated) ||
                      (seatFilter === 'mine' && isMine) ||
                      (seatFilter === 'empty' && isEmpty);

                    // Match search query
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
                          opacity: matchesFilter && matchesSearch ? 1 : 0.22,
                          transform: matchesFilter && matchesSearch ? (matchesSearch && searchQuery ? 'scale(1.05)' : undefined) : 'scale(0.92)',
                          boxShadow: matchesSearch && searchQuery ? '0 0 10px #3B82F6' : undefined,
                          borderColor: matchesSearch && searchQuery ? '#2563EB' : undefined
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
                            background: '#10B981',
                            color: '#fff',
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
                          color: isVacated ? '#B45309' : isMine ? 'var(--brand-crimson)' : isOccupied ? 'var(--brand-slate-700)' : '#94A3B8',
                          lineHeight: '1'
                        }}>
                          #{s.num < 10 ? `0${s.num}` : s.num}
                        </div>

                        {/* Middle: Passenger Name with Ellipsis */}
                        <div style={{
                          fontSize: '8.5px',
                          fontWeight: 700,
                          color: isVacated ? '#92400E' : isOccupied ? 'var(--brand-slate-900)' : '#94A3B8',
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
                          <div style={{ fontSize: '6.5px', fontWeight: 800, color: '#059669', background: '#D1FAE5', padding: '0 2px', borderRadius: '2px' }}>
                            STANDBY
                          </div>
                        ) : s.category === 'executive' ? (
                          <div style={{ fontSize: '6px', fontWeight: 800, color: '#1E40AF', background: '#DBEAFE', padding: '0 2px', borderRadius: '2px' }}>
                            EXEC
                          </div>
                        ) : s.category === 'lady_priority' ? (
                          <div style={{ fontSize: '6px', fontWeight: 800, color: '#9D174D', background: '#FCE7F3', padding: '0 2px', borderRadius: '2px' }}>
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
                borderTop: '2px dashed #CBD5E1',
                fontSize: '9.5px',
                color: 'var(--brand-slate-500)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={11} color="#EF4444" />
                  <span>EMERGENCY DOOR 2</span>
                </span>
                <span style={{ fontWeight: 700, letterSpacing: '0.6px' }}>REAR CARGO & FIRST-AID STATION</span>
                <span>🧯 FIRE EXT</span>
              </div>
            </div>

            {/* Coach Legend */}
            <div style={{ marginTop: '14px', display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '11px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: '#fff', border: '1.5px solid #CBD5E1', borderRadius: '3px' }}></span>
                {t('Occupied Staff', 'যাত্রী বরাদ্দ', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: '#FFFBEB', border: '2px solid #D4AF37', borderRadius: '3px' }}></span>
                {t('Vacated (Standby Free)', 'ফাঁকা আসন (দাবিযোগ্য)', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: 'rgba(225, 29, 72, 0.1)', border: '2px solid var(--brand-crimson)', borderRadius: '3px' }}></span>
                {t('My Seat (#05)', 'আমার আসন', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: '#F1F5F9', border: '1.5px dashed #CBD5E1', borderRadius: '3px' }}></span>
                {t('Unassigned Empty', 'খালি আসন', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: '#10B981', borderRadius: '3px', color: '#fff', fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                {t('Boarded Today', 'বোর্ডিং সম্পন্ন', lang)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Commuter & FIFO Queue Cockpit */}
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
              <Award size={13} />
              <span>{t('Seat Dossier', 'আসন বিবরণ', lang)} {selectedSeat ? `#${selectedSeat.num}` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('fifo')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'fifo' ? '3px solid #D4AF37' : '3px solid transparent',
                padding: '7px 11px',
                fontSize: '12px',
                fontWeight: 700,
                color: activeTab === 'fifo' ? '#B45309' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
            >
              <Users size={13} />
              <span>{t('FIFO Waitlist', 'ফিফো তালিকা', lang)}</span>
              <span className="badge gold" style={{ fontSize: '8.5px', padding: '1px 5px' }}>{waitlist.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('route')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'route' ? '3px solid #3B82F6' : '3px solid transparent',
                padding: '7px 11px',
                fontSize: '12px',
                fontWeight: 700,
                color: activeTab === 'route' ? '#3B82F6' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
            >
              <Navigation size={13} />
              <span>{t('Route Corridors', 'রুট স্টপ', lang)}</span>
            </button>

            <button
              onClick={() => setActiveTab('driver')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'driver' ? '3px solid #10B981' : '3px solid transparent',
                padding: '7px 11px',
                fontSize: '12px',
                fontWeight: 700,
                color: activeTab === 'driver' ? '#10B981' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
            >
              <Fuel size={13} />
              <span>{t('Fleet & Crew', 'বাস ও ক্রু', lang)}</span>
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'roster' ? '3px solid #8B5CF6' : '3px solid transparent',
                padding: '7px 11px',
                fontSize: '12px',
                fontWeight: 700,
                color: activeTab === 'roster' ? '#8B5CF6' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}
            >
              <FileText size={13} />
              <span>{t('Shift Roster', 'রোস্টার তালিকা', lang)}</span>
            </button>
          </div>

          {/* TAB 1: Selected Seat Dossier */}
          {activeTab === 'dossier' && selectedSeat && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: 'rgba(225, 29, 72, 0.1)', color: 'var(--brand-crimson)' }}>
                    <Award size={18} />
                  </div>
                  <div>
                    <div className="card-title">
                      {t(`Seat Dossier #${selectedSeat.num} (${selectedSeat.col.replace('_', ' ').toUpperCase()})`, `সিট বিস্তারিত #${selectedSeat.num}`, lang)}
                    </div>
                    <div className="card-subtitle">
                      Row {selectedSeat.row} · {selectedSeat.assignedTo || t('Unassigned Empty Seat', 'খালি আসন', lang)}
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
                    background: selectedSeat.status === 'vacated' ? '#FEF3C7' : selectedSeat.assignedTo ? 'var(--brand-slate-100)' : '#F1F5F9',
                    border: '1.5px solid var(--brand-slate-300)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                    fontWeight: 800,
                    color: 'var(--brand-slate-700)'
                  }}>
                    {selectedSeat.assignedTo ? selectedSeat.assignedTo.split(' ').map(n => n[0]).slice(0, 2).join('') : '💺'}
                  </div>

                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-slate-900)' }}>
                      {selectedSeat.assignedTo || t('No Passenger Assigned', 'কোনো যাত্রী বরাদ্দ নেই', lang)}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                      {selectedSeat.staffId ? `${selectedSeat.staffId} · ` : ''}{selectedSeat.dept || t('Available for instant shift reservation', 'তাৎক্ষণিক বুকিংযোগ্য আসন', lang)}
                    </div>
                  </div>
                </div>

                {/* Key Passenger Metadata Table */}
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Assigned Route', 'বরাদ্দকৃত রুট', lang)}:</span>
                    <strong>{activeRoute.coachNo} (Route-1)</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Designated Pickup Stop', 'পিকআপ স্টপ', lang)}:</span>
                    <span style={{ fontWeight: 600 }}>📍 {selectedSeat.pickupPoint || 'Mirpur-10 / Farmgate'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Scheduled Boarding Time', 'বোর্ডিং সময়', lang)}:</span>
                    <span style={{ fontWeight: 600 }}>⏰ {selectedSeat.pickupTime || (commuteDirection === 'inbound' ? '07:18 AM' : '05:15 PM')}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Mobile Contact', 'মোবাইল নম্বর', lang)}:</span>
                    <code>{selectedSeat.phone || 'N/A'}</code>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Blood Group', 'রক্তের গ্রুপ', lang)}:</span>
                    <span className="badge danger" style={{ fontSize: '10px' }}>{selectedSeat.bloodGroup || 'B+'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Booking Category', 'বুকিং ক্যাটাগরি', lang)}:</span>
                    <span className="badge purple" style={{ fontSize: '10px' }}>
                      {selectedSeat.bookingType === 'shift_pass' ? t('Single Shift Pass', 'সিঙ্গেল শিফট পাস', lang) : t('Permanent Roster', 'স্থায়ী রোস্টার', lang)}
                    </span>
                  </div>

                  {selectedSeat.vacatedReason && (
                    <div style={{
                      marginTop: '6px',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      color: '#92400E'
                    }}>
                      <strong>{t('Vacated Reason Logged', 'সিট ফাঁকা করার কারণ', lang)}:</strong> {selectedSeat.vacatedReason}
                    </div>
                  )}
                </div>

                {/* Clear Role Boundary Controls & Booking Actions */}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Case 1: Empty Seat — Direct Booking Available to Everyone */}
                  {selectedSeat.status === 'empty' && (
                    <button
                      className="btn-gold"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                      onClick={() => handleOpenBookModal(selectedSeat)}
                    >
                      <Sparkles size={14} /> {t(`⚡ Book & Reserve Seat #${selectedSeat.num}`, `সিট #${selectedSeat.num} বুক করুন`, lang)}
                    </button>
                  )}

                  {/* Case 2: Current User's Seat (#5) */}
                  {selectedSeat.num === 5 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isMySeatVacated ? (
                        <button className="btn-gold" style={{ flex: 1, justifyContent: 'center' }} onClick={handleReclaimMySeat}>
                          <UserPlus size={14} /> {t('Reclaim My Seat #05', 'সিট পুনরুদ্ধার করুন', lang)}
                        </button>
                      ) : (
                        <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', borderColor: '#D4AF37', color: '#B45309' }} onClick={() => setShowVacateDialog(true)}>
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
                  {selectedSeat.num !== 5 && selectedSeat.status === 'occupied' && activePerspective === 'staff' && (
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
                        className="btn-outline"
                        onClick={() => showToast(t(`Contact inquiry sent to ${selectedSeat.assignedTo}`, 'বার্তা পাঠানো হয়েছে', lang), 'info')}
                      >
                        <Phone size={13} />
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
                            ⚡ {t(`Assign to #1 ${waitlist[0].name}`, `বরাদ্দ দিন #${waitlist[0].name}-কে`, lang)}
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
                        <CheckCircle2 size={13} color={selectedSeat.boarded ? '#10B981' : '#64748B'} />
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
              </div>
            </div>
          )}

          {/* TAB 2: FIFO Standby Queue Radar */}
          {activeTab === 'fifo' && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <div className="card-title">
                      {t('FIFO Standby Queue Radar', 'ফিফো স্ট্যান্ডবাই অপেক্ষাতালিকা', lang)}
                    </div>
                    <div className="card-subtitle">
                      {t('Strict First-In-First-Out shift fairness algorithm certified by Plant HR', 'প্ল্যান্ট এইচআর অনুমোদিত স্বচ্ছ অগ্রাধিকার তালিকা', lang)}
                    </div>
                  </div>
                </div>

                {/* Role-based queue action */}
                {activePerspective === 'staff' ? (
                  myWaitlistEntry ? (
                    <button
                      className="btn-outline"
                      style={{ fontSize: '11px', padding: '4px 10px', color: '#EF4444', borderColor: '#EF4444' }}
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
                ) : (
                  <button
                    className="btn-gold"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                    onClick={handleSupervisorAutoFIFO}
                  >
                    <Sparkles size={13} /> {t('⚡ Auto-Allocate FIFO', 'স্বয়ংক্রিয় ফিফো বরাদ্দ', lang)}
                  </button>
                )}
              </div>

              <div className="card-body">
                {/* FIFO Explainer Strip */}
                <div style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid #D4AF37',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  marginBottom: '12px',
                  fontSize: '11.5px',
                  color: 'var(--brand-slate-700)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Info size={16} color="#D4AF37" />
                  <div>
                    <strong>{t('Strict FIFO Policy:', 'স্বচ্ছ ফিফো নিয়ম:', lang)}</strong>{' '}
                    {t(
                      'Applications are prioritized purely by submission timestamp. When any seat is freed, it automatically awards to Rank #1.',
                      'নিবন্ধনের সময় অনুযায়ী ক্রম নির্ধারণ করা হয়। কোনো সিট ফাঁকা হলেই ১ম ব্যক্তি স্বয়ংক্রিয়ভাবে পাবেন।',
                      lang
                    )}
                  </div>
                </div>

                {/* Candidate Queue Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {waitlist.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--brand-slate-500)' }}>
                      <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 700 }}>{t('No Pending Waitlist Candidates', 'কোনো অপেক্ষমান প্রার্থী নেই', lang)}</div>
                    </div>
                  ) : (
                    waitlist.map((candidate) => {
                      const isRankOne = candidate.rank === 1;
                      const isMe = candidate.staffId === 'EMP-1042' || candidate.name === 'Tanvir Ahmed';

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
                              background: isRankOne ? '#D4AF37' : 'var(--brand-slate-200)',
                              color: isRankOne ? '#000' : 'var(--brand-slate-700)',
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
                              <div style={{ fontSize: '11px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                                {candidate.dept} · 📍 {candidate.pickupPoint}
                              </div>
                            </div>
                          </div>

                          {/* Action Button: Visible only to Supervisor */}
                          {activePerspective === 'supervisor' ? (
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
                              <span style={{ fontSize: '10px', color: 'var(--brand-slate-400)' }}>
                                ⏳ {t('Standby', 'অপেক্ষমান', lang)}
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
          )}

          {/* TAB 3: Route Stops & Live Telemetry */}
          {activeTab === 'route' && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
                    <Navigation size={18} />
                  </div>
                  <div>
                    <div className="card-title">
                      {t('Route Corridor Stations & Geofenced Telemetry', 'রুট স্টেশন ও জিওফেন্স ট্র্যাকিং', lang)}
                    </div>
                    <div className="card-subtitle">
                      {commuteDirection === 'inbound' ? t('Morning Inbound (City ➔ Plant)', 'সকালের শিফট (শহর ➔ প্ল্যান্ট)', lang) : t('Evening Outbound (Plant ➔ City)', 'সন্ধ্যার ফিরতি শিফট (প্ল্যান্ট ➔ শহর)', lang)} · {activeStops.length} {t('Stoppages', 'স্টপেজ', lang)}
                    </div>
                  </div>
                </div>

                <span className="badge info">{activeRoute.speed} Active</span>
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
          )}

          {/* TAB 4: Vehicle & Crew Profile */}
          {activeTab === 'driver' && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                    <Fuel size={18} />
                  </div>
                  <div>
                    <div className="card-title">
                      {t('Vehicle Mechanical Health & Crew Profile', 'গাড়ির ফিটনেস ও ক্রু প্রোফাইল', lang)}
                    </div>
                    <div className="card-subtitle">
                      {activeRoute.coachNo} · {activeRoute.model}
                    </div>
                  </div>
                </div>
                <span className="badge success">{t('BRTA Fitness Valid', 'ফিটনেস ক্লিয়ার', lang)}</span>
              </div>

              <div className="card-body" style={{ fontSize: '12.5px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ background: 'var(--brand-slate-50, #F8FAFC)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      👨‍✈️ {t('Certified Driver', 'প্রধান চালক', lang)}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: 'var(--brand-slate-900)' }}>
                      {activeRoute.driverName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                      Phone: <code>{activeRoute.driverPhone}</code>
                    </div>
                  </div>

                  <div style={{ background: 'var(--brand-slate-50, #F8FAFC)', border: '1px solid var(--brand-slate-200)', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                      🎟️ {t('Bus Conductor', 'কন্ডাক্টর', lang)}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: 'var(--brand-slate-900)' }}>
                      {activeRoute.conductorName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                      Phone: <code>{activeRoute.conductorPhone}</code>
                    </div>
                  </div>
                </div>

                {/* Scorecards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="driver-score-card">
                    <span style={{ color: 'var(--brand-slate-500)' }}>Fuel Level:</span>
                    <strong style={{ color: '#10B981' }}>82% (Full Tank)</strong>
                  </div>
                  <div className="driver-score-card">
                    <span style={{ color: 'var(--brand-slate-500)' }}>Engine Temp:</span>
                    <strong>88°C (Normal)</strong>
                  </div>
                  <div className="driver-score-card">
                    <span style={{ color: 'var(--brand-slate-500)' }}>Cabin AC:</span>
                    <strong style={{ color: '#0284C7' }}>21.5°C Chilled</strong>
                  </div>
                  <div className="driver-score-card">
                    <span style={{ color: 'var(--brand-slate-500)' }}>First-Aid Kit:</span>
                    <strong style={{ color: '#10B981' }}>Inspected Oct 2026</strong>
                  </div>
                </div>

                <div style={{ marginTop: '14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#B91C1C', fontSize: '12px' }}>
                      🚨 24/7 Plant Roadside Assistance Hotline
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-slate-600)' }}>
                      Transport Operations Dispatch: +880 1711-009988
                    </div>
                  </div>
                  <button className="btn-outline" style={{ borderColor: '#EF4444', color: '#EF4444', fontSize: '11px' }} onClick={() => showToast(t('Emergency dispatcher notified.', 'জরুরি হটলাইনে যোগাযোগ করা হয়েছে।', lang), 'info')}>
                    SOS Call
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Shift Roster & Manifest Quick View */}
          {activeTab === 'roster' && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="card-title">
                      {t('Full Shift Passenger Roster', 'সম্পূর্ণ শিফট যাত্রী রোস্টার', lang)}
                    </div>
                    <div className="card-subtitle">
                      {occupiedCount} {t('Booked Passengers', 'বুক করা যাত্রী', lang)} · {boardedCount} {t('Boarded', 'বোর্ডে উপস্থিত', lang)}
                    </div>
                  </div>
                </div>

                <button className="btn-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setShowManifestModal(true)}>
                  <Printer size={12} /> {t('Print Roster', 'প্রিন্ট', lang)}
                </button>
              </div>

              <div className="card-body" style={{ maxHeight: '380px', overflowY: 'auto' }}>
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
                      <tr key={s.num} onClick={() => setSelectedSeat(s)} style={{ cursor: 'pointer' }}>
                        <td><strong>#{s.num}</strong></td>
                        <td>
                          <div>
                            <span style={{ fontWeight: 700 }}>{s.assignedTo}</span>
                            <div style={{ fontSize: '10px', color: 'var(--brand-slate-500)' }}>{s.staffId} · {s.dept}</div>
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
                <div className="app-modal-icon" style={{ background: 'rgba(212, 175, 55, 0.12)', color: '#B45309' }}>
                  <UserMinus size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Release Seat #05 for Today', 'আজকের জন্য ৫ নম্বর আসন ছাড়ুন', lang)}</h3>
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

              <div style={{ background: '#FFFDF5', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#92400E' }}>
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
                <div className="app-modal-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
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
                  background: 'var(--brand-slate-50, #F8FAFC)',
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
                <div className="app-modal-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
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

                <div style={{ textAlign: 'center', color: '#2563EB' }}>
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

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '10px 12px', fontSize: '11.5px', color: '#1E40AF' }}>
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
                background: '#FFFFFF',
                border: '2px solid var(--brand-slate-200)',
                borderRadius: '16px',
                padding: '16px',
                display: 'inline-block',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                marginBottom: '14px'
              }}>
                <QrCode size={160} color="#0F172A" />
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
                {qrSeatTarget?.dept || 'Sales & Distribution'} · ID: {qrSeatTarget?.staffId || 'EMP-1042'}
              </div>

              <div style={{
                background: 'var(--brand-slate-50, #F8FAFC)',
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
                  <span style={{ color: 'var(--brand-slate-500)' }}>Coach:</span>
                  <strong>{activeRoute.coachNo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Designated Stop:</span>
                  <span style={{ color: '#0284C7', fontWeight: 700 }}>{qrSeatTarget?.pickupPoint || 'Farmgate Overbridge'} ({qrSeatTarget?.pickupTime || '07:18 AM'})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Blood Group:</span>
                  <span className="badge danger" style={{ fontSize: '10px' }}>{qrSeatTarget?.bloodGroup || 'B+'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Security Status:</span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Verified Optical Hash</span>
                </div>
              </div>
            </div>

            <div className="app-modal-footer">
              <button
                className="btn-outline"
                style={{ borderColor: '#D4AF37', color: '#B45309' }}
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
                <div className="app-modal-icon" style={{ background: 'rgba(15, 23, 42, 0.1)', color: '#0F172A' }}>
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
                  <strong style={{ color: '#10B981' }}>{boardedCount} / {occupiedCount} Passengers</strong>
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
                            {s.boarded ? '✓ PASS CLEARED' : '⏳ AWAITING GATE'}
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
                style={{ borderColor: '#D4AF37', color: '#B45309' }}
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
                      <td><strong style={{ color: '#0284C7' }}>Route-2 (Uttara)</strong></td>
                      <td>Scania Touring (52 Seats)</td>
                      <td>06:30 AM (Azampur)</td>
                      <td><strong>08:05 AM</strong></td>
                      <td>05:15 PM</td>
                    </tr>
                    <tr>
                      <td><strong style={{ color: '#059669' }}>Route-3 (Narayanganj)</strong></td>
                      <td>Hyundai Universe (52 Seats)</td>
                      <td>06:50 AM (Chashara)</td>
                      <td><strong>07:55 AM</strong></td>
                      <td>05:15 PM</td>
                    </tr>
                    <tr>
                      <td><strong style={{ color: '#D4AF37' }}>Route-4 (Dhanmondi)</strong></td>
                      <td>Ashok Leyland (52 Seats)</td>
                      <td>06:55 AM (Dhanmondi-27)</td>
                      <td><strong>08:00 AM</strong></td>
                      <td>05:15 PM</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11.5px', color: 'var(--brand-slate-600)', background: 'var(--brand-slate-50)', border: '1px solid var(--brand-slate-200)', padding: '10px 12px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--brand-slate-900)' }}>📌 {t('Plant Transit Rules:', 'প্ল্যান্ট যাতায়াত বিধিমালা:', lang)}</strong>
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
                <div className="app-modal-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7' }}>
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
                background: '#0B132B',
                color: '#fff',
                borderRadius: '14px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '14px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 8px',
                  border: '2px dashed #38BDF8',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <QrCode size={32} color="#38BDF8" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>
                  {t('Conductor Optical Reader Ready', 'অপটিক্যাল রিডার স্ক্যান করতে প্রস্তুত', lang)}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  {activeRoute.conductorName} · Headcount Boarded: <strong style={{ color: '#38BDF8' }}>{boardedCount} / {occupiedCount}</strong>
                </div>
              </div>

              {/* Fast verification row */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input
                  type="text"
                  className="input-text"
                  placeholder="Enter Staff ID or Seat # (e.g. EMP-1042 or 5)"
                  defaultValue="EMP-1042"
                  style={{ flex: 1 }}
                />
                <button
                  className="btn-primary"
                  onClick={() => {
                    handleToggleBoarding(5);
                    showToast(t('Tanvir Ahmed (Seat #05) verified and boarded!', 'তানভীর আহমেদ (সিট #০৫) বোর্ডিং যাচাই সম্পন্ন!', lang), 'gold');
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
                <div className="app-modal-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#B45309' }}>
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
                <div className="app-modal-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' }}>
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
                  background: 'var(--brand-slate-50, #F8FAFC)',
                  border: '1px solid var(--brand-slate-200)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-slate-600)' }}>
                    <span>{t('Your Queue Rank will be:', 'আপনার সম্ভাব্য অপেক্ষার ক্রম:', lang)}</span>
                    <strong style={{ color: '#D4AF37' }}>#{waitlist.length + 1}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-slate-600)', marginTop: '4px' }}>
                    <span>{t('Current Vacated Standby Seats:', 'বর্তমান ফাঁকা আসন:', lang)}</span>
                    <strong style={{ color: vacatedCount > 0 ? '#10B981' : '#EF4444' }}>{vacatedCount + emptyCount} {t('seats', 'আসন', lang)}</strong>
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
          onReassign={(busId: string, targetRouteId: string) => {
            handleReassignBusRoute(busId, targetRouteId, 'Dynamic Fleet Route Reallocation');
          }}
          lang={lang}
        />
      )}
    </div>
  );
}
