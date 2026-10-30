import React from 'react';
import { SYSTEM_TODAY } from '../types';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  licenseType: 'Heavy Commercial (HAZMAT)' | 'Light Commercial' | 'PSV Microbus';
  licenseExpiry: string;
  status: 'available' | 'on_trip' | 'off_duty' | 'rest_required' | 'sick_leave' | 'on_leave';
  leaveReason?: string;
  leaveUntil?: string;
  breathalyzerToday: '0.00% BAC (PASSED)' | 'PENDING' | 'FAILED';
  dutyHoursToday: number;
  assignedVehiclePlate?: string;
  bloodGroup: string;
  rating: number;
  totalTrips: number;
  initials: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: 'executive' | 'microbus' | 'tanker' | 'pickup';
  capacitySeats: number;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  location: string;
  speed: number;
  engineTemp: number;
  bitumenCargoTemp?: number;
  fuelPct: number;
  fuelSlipNo: string;
  status: 'available' | 'in_transit' | 'loading' | 'maintenance' | 'grounded';
  maintenanceDetails?: string;
  nextServiceKm: number;
  hazmatCertified: boolean;
  routeProgress?: number;
  routeOrigin?: string;
  routeDestination?: string;
}

export interface TripChatMessage {
  id: string;
  requisitionId: string;
  senderRole: 'employee' | 'driver' | 'admin' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  messageType?: 'text' | 'toll_claim' | 'location_share' | 'system_event' | 'voice_note' | 'attachment';
  tollData?: {
    tollName: string;
    amount: number;
    receiptNo: string;
    approved?: boolean;
    approvedBy?: string;
    approvedAt?: string;
  };
  locationData?: {
    title: string;
    address: string;
    coordinates?: string;
  };
  voiceData?: {
    duration: string;
    audioUrl?: string;
  };
  attachmentData?: {
    fileName: string;
    fileSize: string;
    fileType: 'image' | 'pdf' | 'document';
  };
  actionType?: 'gate_out_authorized' | 'toll_approved' | 'route_deviation';
  actionLabel?: string;
}

export interface FleetNotification {
  id: string;
  type: 'assignment' | 'requisition_created' | 'gate_out' | 'gate_in' | 'chat_message' | 'driver_status' | 'maintenance' | 'toll_claimed';
  title: string;
  message: string;
  time: string;
  targetRole: 'employee' | 'admin' | 'all';
  requisitionId?: string;
  unread: boolean;
}

export interface DriverTollSlip {
  id: string;
  reqId: string;
  plaza: string;
  amount: number;
  time: string;
  status: 'Pending Review' | 'Approved' | 'Paid';
}

export interface VehicleRequisition {
  id: string;
  requesterName: string;
  requesterRole: string;
  dept: string;
  phone: string;
  from: string;
  to: string;
  intermediateStops?: { id: string; location: string; waitDurationMins: number }[];
  tollExpenses?: { id: string; tollName: string; amount: number; receiptNo: string }[];
  estimatedCost?: number;
  tripType: 'round_trip' | 'one_way';
  departureTime: string;
  returnTime?: string;
  requiredCapacity: 'sedan_4' | 'microbus_7' | 'pickup_4x4' | 'tanker_heavy';
  passengersCount: number;
  passengerNames: string;
  purpose: string;
  costCenter: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'completed' | 'rejected';
  assignedVehicleId?: string;
  assignedVehiclePlate?: string;
  assignedVehicleModel?: string;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  tripPassNo?: string;
  createdAt: string;
  hodApproval?: 'approved' | 'pending' | 'rejected';
  odometerStart?: number;
  odometerEnd?: number;
  gateOutTime?: string;
  gateInTime?: string;
  rating?: number;
  feedback?: string;
  rejectionReason?: string;
  pooledWith?: string;
}

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'DRV-01',
    name: 'Md. Rafiqul Islam',
    phone: '+880 1715-882100',
    licenseNo: 'DK-BRTA-2018-9941',
    licenseType: 'Light Commercial',
    licenseExpiry: '14 Nov 2028',
    status: 'available',
    breathalyzerToday: '0.00% BAC (PASSED)',
    dutyHoursToday: 3.5,
    assignedVehiclePlate: 'DHAKA METRO GHA-13-8821',
    bloodGroup: 'B+',
    rating: 4.9,
    totalTrips: 1240,
    initials: 'RI',
  },
  {
    id: 'DRV-02',
    name: 'Abdul Mannan',
    phone: '+880 1819-338811',
    licenseNo: 'DK-BRTA-2016-8812',
    licenseType: 'PSV Microbus',
    licenseExpiry: '22 Aug 2027',
    status: 'on_trip',
    breathalyzerToday: '0.00% BAC (PASSED)',
    dutyHoursToday: 5.2,
    assignedVehiclePlate: 'DHAKA METRO CHA-53-4102',
    bloodGroup: 'O+',
    rating: 4.8,
    totalTrips: 980,
    initials: 'AM',
  },
  {
    id: 'DRV-03',
    name: 'Babul Hossain',
    phone: '+880 1912-774433',
    licenseNo: 'DK-BRTA-2014-7721',
    licenseType: 'Heavy Commercial (HAZMAT)',
    licenseExpiry: '05 Jan 2029',
    status: 'on_trip',
    breathalyzerToday: '0.00% BAC (PASSED)',
    dutyHoursToday: 6.0,
    assignedVehiclePlate: 'DHAKA METRO KHA-11-9042',
    bloodGroup: 'A+',
    rating: 5.0,
    totalTrips: 1850,
    initials: 'BH',
  },
  {
    id: 'DRV-04',
    name: 'Sujon Mia',
    phone: '+880 1720-551122',
    licenseNo: 'DK-BRTA-2020-4491',
    licenseType: 'Light Commercial',
    licenseExpiry: '19 Oct 2029',
    status: 'available',
    breathalyzerToday: '0.00% BAC (PASSED)',
    dutyHoursToday: 2.0,
    assignedVehiclePlate: 'DHAKA METRO DA-14-3312',
    bloodGroup: 'AB+',
    rating: 4.7,
    totalTrips: 620,
    initials: 'SM',
  },
  {
    id: 'DRV-05',
    name: 'Mofizur Rahman',
    phone: '+880 1715-442200',
    licenseNo: 'DK-BRTA-2012-3301',
    licenseType: 'Heavy Commercial (HAZMAT)',
    licenseExpiry: '30 Dec 2027',
    status: 'on_trip',
    breathalyzerToday: '0.00% BAC (PASSED)',
    dutyHoursToday: 4.0,
    assignedVehiclePlate: 'DHAKA METRO TA-19-4401',
    bloodGroup: 'O+',
    rating: 4.9,
    totalTrips: 2100,
    initials: 'MR',
  },
  {
    id: 'DRV-06',
    name: 'Nurul Huda',
    phone: '+880 1714-998877',
    licenseNo: 'DK-BRTA-2015-1109',
    licenseType: 'Heavy Commercial (HAZMAT)',
    licenseExpiry: '11 Jun 2028',
    status: 'rest_required',
    breathalyzerToday: '0.00% BAC (PASSED)',
    dutyHoursToday: 8.5,
    assignedVehiclePlate: 'DHAKA METRO CHA-19-0082',
    bloodGroup: 'B-',
    rating: 4.8,
    totalTrips: 1490,
    initials: 'NH',
  },
  {
    id: 'DRV-07',
    name: 'Md. Delwar Hossain',
    phone: '+880 1817-223344',
    licenseNo: 'DK-BRTA-2019-3321',
    licenseType: 'Light Commercial',
    licenseExpiry: '15 Aug 2029',
    status: 'sick_leave',
    leaveReason: 'Fever & Medical Rest (Doctor note submitted to HR)',
    leaveUntil: 'Tomorrow, 08:00 AM',
    breathalyzerToday: '0.00% BAC (PASSED)',
    dutyHoursToday: 0,
    bloodGroup: 'O+',
    rating: 4.8,
    totalTrips: 870,
    initials: 'DH',
  },
  {
    id: 'DRV-08',
    name: 'Rabiul Awal',
    phone: '+880 1718-445566',
    licenseNo: 'DK-BRTA-2017-5512',
    licenseType: 'PSV Microbus',
    licenseExpiry: '20 Sep 2028',
    status: 'available',
    breathalyzerToday: '0.00% BAC (PASSED)',
    dutyHoursToday: 1.5,
    assignedVehiclePlate: 'DHAKA METRO CHA-54-7710',
    bloodGroup: 'A+',
    rating: 4.9,
    totalTrips: 1320,
    initials: 'RA',
  },
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'V-01',
    plate: 'DHAKA METRO GHA-13-8821',
    model: 'Toyota Prado TXL (Executive Car)',
    type: 'executive',
    capacitySeats: 4,
    driverId: 'DRV-01',
    driverName: 'Md. Rafiqul Islam',
    driverPhone: '+880 1715-882100',
    location: 'Head Office, Baridhara (Porch Bay #1)',
    speed: 0,
    engineTemp: 45,
    fuelPct: 82,
    fuelSlipNo: 'FUEL-2026-904',
    status: 'available',
    nextServiceKm: 4200,
    hazmatCertified: true,
  },
  {
    id: 'V-02',
    plate: 'DHAKA METRO CHA-53-4102',
    model: 'Toyota HiAce GL (7-Seat Staff Van)',
    type: 'microbus',
    capacitySeats: 7,
    driverId: 'DRV-02',
    driverName: 'Abdul Mannan',
    driverPhone: '+880 1819-338811',
    location: 'Crossing Babubazar Bridge toward Keraniganj',
    speed: 42,
    engineTemp: 86,
    fuelPct: 65,
    fuelSlipNo: 'FUEL-2026-898',
    status: 'in_transit',
    nextServiceKm: 1850,
    hazmatCertified: false,
    routeProgress: 65,
    routeOrigin: 'Head Office, Baridhara',
    routeDestination: 'Keraniganj Plant',
  },
  {
    id: 'V-03',
    plate: 'DHAKA METRO KHA-11-9042',
    model: 'Tata Prima Bitumen Tanker (18,000 Liters)',
    type: 'tanker',
    capacitySeats: 2,
    driverId: 'DRV-03',
    driverName: 'Babul Hossain',
    driverPhone: '+880 1912-774433',
    location: 'Keraniganj Truck Loading Bay #3',
    speed: 0,
    engineTemp: 78,
    bitumenCargoTemp: 162,
    fuelPct: 54,
    fuelSlipNo: 'FUEL-2026-912',
    status: 'loading',
    nextServiceKm: 780,
    hazmatCertified: true,
  },
  {
    id: 'V-04',
    plate: 'DHAKA METRO DA-14-3312',
    model: 'Mitsubishi L200 4x4 (Plant Utility Pickup)',
    type: 'pickup',
    capacitySeats: 4,
    driverId: 'DRV-04',
    driverName: 'Sujon Mia',
    driverPhone: '+880 1720-551122',
    location: 'Head Office Garage, Baridhara',
    speed: 0,
    engineTemp: 40,
    fuelPct: 90,
    fuelSlipNo: 'FUEL-2026-915',
    status: 'available',
    nextServiceKm: 6100,
    hazmatCertified: true,
  },
  {
    id: 'V-05',
    plate: 'DHAKA METRO TA-19-4401',
    model: 'Scania Heavy Bitumen Tanker (24,000 Liters)',
    type: 'tanker',
    capacitySeats: 2,
    driverId: 'DRV-05',
    driverName: 'Mofizur Rahman',
    driverPhone: '+880 1715-442200',
    location: 'Dhaka–Mawa Expressway (Padma Bridge Toll)',
    speed: 58,
    engineTemp: 89,
    bitumenCargoTemp: 168,
    fuelPct: 78,
    fuelSlipNo: 'FUEL-2026-920',
    status: 'in_transit',
    nextServiceKm: 3400,
    hazmatCertified: true,
    routeProgress: 40,
    routeOrigin: 'Keraniganj Plant',
    routeDestination: 'Mongla Port Depot',
  },
  {
    id: 'V-06',
    plate: 'DHAKA METRO CHA-19-0082',
    model: 'Tata Heavy Bitumen Tanker (24,000 Liters)',
    type: 'tanker',
    capacitySeats: 2,
    driverId: 'DRV-06',
    driverName: 'Nurul Huda',
    driverPhone: '+880 1714-998877',
    location: 'Keraniganj Workshop (Brake Pad Replacement)',
    speed: 0,
    engineTemp: 28,
    fuelPct: 30,
    fuelSlipNo: 'FUEL-2026-870',
    status: 'maintenance',
    maintenanceDetails: 'Scheduled Brake Pad & Oil Service (Job #WO-88)',
    nextServiceKm: 0,
    hazmatCertified: true,
  },
  {
    id: 'V-07',
    plate: 'DHAKA METRO GHA-11-2299',
    model: 'Toyota Corolla Altis (Office Sedan)',
    type: 'executive',
    capacitySeats: 4,
    location: 'Central Garage, Baridhara',
    speed: 0,
    engineTemp: 26,
    fuelPct: 58,
    fuelSlipNo: 'FUEL-2026-892',
    status: 'maintenance',
    maintenanceDetails: 'AC Gas Refill & Cabin Air Filter Change',
    nextServiceKm: 0,
    hazmatCertified: false,
  },
  {
    id: 'V-08',
    plate: 'DHAKA METRO CHA-54-7710',
    model: 'Toyota HiAce Commuter (7-Seat Pool Microbus)',
    type: 'microbus',
    capacitySeats: 7,
    driverId: 'DRV-08',
    driverName: 'Rabiul Awal',
    driverPhone: '+880 1718-445566',
    location: 'Head Office Parking Bay #3, Baridhara',
    speed: 0,
    engineTemp: 38,
    fuelPct: 88,
    fuelSlipNo: 'FUEL-2026-924',
    status: 'available',
    nextServiceKm: 5200,
    hazmatCertified: false,
  },
];

export const INITIAL_REQUISITIONS: VehicleRequisition[] = [
  {
    id: 'REQ-2026-441',
    requesterName: 'Tanvir Ahmed',
    requesterRole: 'Senior Sales Officer',
    dept: 'Sales & Distribution',
    phone: '+880 1712-334455',
    from: 'Head Office, Baridhara',
    to: 'Keraniganj Plant',
    tripType: 'round_trip',
    departureTime: 'Today, 02:30 PM',
    returnTime: 'Today, 06:00 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 2,
    passengerNames: 'Tanvir Ahmed, Sales Assistant',
    purpose: 'Hand over signed highway supply papers to Plant GM & check dispatch loading',
    costCenter: 'ACC-SALES-102',
    status: 'pending',
    hodApproval: 'pending',
    createdAt: `${SYSTEM_TODAY}, 11:20 AM`,
  },
  {
    id: 'REQ-2026-435',
    requesterName: 'Tanvir Ahmed',
    requesterRole: 'Senior Sales Officer',
    dept: 'Sales & Distribution',
    phone: '+880 1712-334455',
    from: 'Head Office, Baridhara',
    to: 'Meghna Ghat Bitumen Depot',
    tripType: 'round_trip',
    departureTime: 'Today, 03:00 PM',
    returnTime: 'Today, 07:30 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 2,
    passengerNames: 'Tanvir Ahmed, Billing Officer',
    purpose: 'Deliver signed customer supply contracts and verify depot delivery receipts',
    costCenter: 'ACC-SALES-102',
    status: 'assigned',
    assignedVehiclePlate: 'DHAKA METRO GHA-13-8821',
    assignedVehicleModel: 'Toyota Prado TXL (Executive Car)',
    assignedDriverId: 'DRV-01',
    assignedDriverName: 'Md. Rafiqul Islam',
    assignedDriverPhone: '+880 1715-882100',
    tripPassNo: 'PASS-2026-9042',
    createdAt: `${SYSTEM_TODAY}, 09:15 AM`,
    hodApproval: 'approved',
  },
  {
    id: 'REQ-2026-443',
    requesterName: 'Mizanur Rahman',
    requesterRole: 'Main Gate & Security Officer',
    dept: 'Security Administration',
    phone: '+880 1715-661122',
    from: 'Head Office, Baridhara',
    to: 'Keraniganj Plant',
    tripType: 'one_way',
    departureTime: 'Today, 02:45 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 1,
    passengerNames: 'Mizanur Rahman',
    purpose: 'Collect visitor gate pass printer & security logbooks for Keraniganj Gate #1',
    costCenter: 'ACC-SEC-401',
    status: 'pending',
    hodApproval: 'pending',
    createdAt: `${SYSTEM_TODAY}, 11:35 AM`,
  },
  {
    id: 'REQ-2026-445',
    requesterName: 'Farida Begum',
    requesterRole: 'Head of Finance & Approver',
    dept: 'Finance & Accounts',
    phone: '+880 1819-223344',
    from: 'Head Office, Baridhara',
    to: 'Bangladesh Bank Head Office, Motijheel',
    tripType: 'round_trip',
    departureTime: 'Tomorrow, 10:00 AM',
    returnTime: 'Tomorrow, 01:30 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 3,
    passengerNames: 'Farida Begum, Treasury Officer, Accounts Manager',
    purpose: 'Bank meeting regarding raw material import Letter of Credit (L/C)',
    costCenter: 'ACC-FIN-001',
    status: 'assigned',
    assignedVehiclePlate: 'DHAKA METRO DA-14-3312',
    assignedVehicleModel: 'Mitsubishi L200 4x4 (Plant Utility Pickup)',
    assignedDriverId: 'DRV-04',
    assignedDriverName: 'Sujon Mia',
    assignedDriverPhone: '+880 1720-551122',
    tripPassNo: 'PASS-2026-8841',
    createdAt: '28 Oct 2026, 04:15 PM',
    hodApproval: 'approved',
  },
  {
    id: 'REQ-2026-438',
    requesterName: 'Md. Kamruzzaman',
    requesterRole: 'Transport & Admin Supervisor',
    dept: 'Transport & Logistics',
    phone: '+880 1712-990011',
    from: 'Head Office, Baridhara',
    to: 'Fatullah River Terminal, Narayanganj',
    tripType: 'round_trip',
    departureTime: 'Yesterday, 09:30 AM',
    returnTime: 'Yesterday, 03:00 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 2,
    passengerNames: 'Md. Kamruzzaman, Depot Clerk',
    purpose: 'Check river barge unloading schedule and port gate clearance',
    costCenter: 'ACC-LOG-204',
    status: 'completed',
    assignedVehiclePlate: 'DHAKA METRO GHA-13-8821',
    assignedVehicleModel: 'Toyota Prado TXL (Executive Car)',
    assignedDriverId: 'DRV-01',
    assignedDriverName: 'Md. Rafiqul Islam',
    assignedDriverPhone: '+880 1715-882100',
    tripPassNo: 'PASS-2026-8819',
    createdAt: '28 Oct 2026, 08:40 AM',
    hodApproval: 'approved',
    odometerStart: 42274,
    odometerEnd: 42350,
    gateOutTime: '09:42 AM',
    gateInTime: '02:55 PM',
    rating: 5,
    feedback: 'On-time departure and very safe highway driving.',
  },
];

export const INITIAL_CHAT_MESSAGES: TripChatMessage[] = [
  {
    id: 'msg-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Supervisor)',
    text: 'Vehicle Prado GHA-13-8821 assigned for Meghna Ghat trip. Driver Md. Rafiqul Islam passed morning fitness & safety check.',
    timestamp: '09:20 AM',
    messageType: 'system_event',
    actionType: 'gate_out_authorized',
    actionLabel: 'Gate Pass Approved',
  },
  {
    id: 'msg-2',
    requisitionId: 'REQ-2026-435',
    senderRole: 'driver',
    senderName: 'Md. Rafiqul Islam (Driver)',
    text: 'Assalamu Alaikum Tanvir Sir. Car has 82% fuel and is waiting at Head Office Gate-1 porch with AC on.',
    timestamp: '09:25 AM',
    messageType: 'text',
  },
  {
    id: 'msg-3',
    requisitionId: 'REQ-2026-435',
    senderRole: 'employee',
    senderName: 'Tanvir Ahmed',
    text: 'Thank you Rafiqul Bhai. I am coming down with the customer contract files in 5 minutes.',
    timestamp: '09:28 AM',
    messageType: 'text',
  },
  {
    id: 'msg-loc-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'employee',
    senderName: 'Tanvir Ahmed',
    text: '📍 Shared Pickup Point: Head Office Main Reception Porch, Baridhara',
    timestamp: '09:30 AM',
    messageType: 'location_share',
    locationData: {
      title: 'Head Office Main Reception',
      address: 'Plot-3, Block-G, Bashundhara R/A, Dhaka',
      coordinates: '23.8166° N, 90.4328° E',
    },
  },
  {
    id: 'msg-toll-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'driver',
    senderName: 'Md. Rafiqul Islam (Driver)',
    text: 'Submitted bridge/flyover toll receipt: Mayor Hanif Flyover (৳260). Slip: TOL-2026-8819',
    timestamp: '09:45 AM',
    messageType: 'toll_claim',
    tollData: {
      tollName: 'Mayor Hanif Flyover',
      amount: 260,
      receiptNo: 'TOL-2026-8819',
      approved: false,
    },
  },
  {
    id: 'msg-voice-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'driver',
    senderName: 'Md. Rafiqul Islam (Driver)',
    text: 'Voice Note: Waiting at main porch Bay #1.',
    timestamp: '09:48 AM',
    messageType: 'voice_note',
    voiceData: {
      duration: '0:24',
    },
  },
  {
    id: 'msg-doc-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Supervisor)',
    text: 'Official Security Gate Pass #PASS-2026-9042',
    timestamp: '09:50 AM',
    messageType: 'attachment',
    attachmentData: {
      fileName: 'Gate_Pass_9042.pdf',
      fileSize: '1.2 MB',
      fileType: 'pdf',
    },
  },
  {
    id: 'msg-4',
    requisitionId: 'REQ-2026-441',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Supervisor)',
    text: 'Booking REQ-2026-441 received. We can assign a car shortly or combine with REQ-2026-443 going to Keraniganj at 2:45 PM.',
    timestamp: '11:40 AM',
    messageType: 'text',
  },
  {
    id: 'msg-desk-1',
    requisitionId: 'desk_direct',
    senderRole: 'employee',
    senderName: 'Tanvir Ahmed',
    text: 'Kamruzzaman Bhai, can we book a 7-seat microbus for 4 visiting road engineers tomorrow morning?',
    timestamp: '11:45 AM',
    messageType: 'text',
  },
  {
    id: 'msg-desk-2',
    requisitionId: 'desk_direct',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Supervisor)',
    text: 'Assalamu Alaikum Tanvir. Yes, select 7-Seat Microbus in the New Booking form and I will assign HiAce CHA-54-7710.',
    timestamp: '11:48 AM',
    messageType: 'text',
  },
  {
    id: 'msg-drv1-1',
    requisitionId: 'drv_direct_DRV-01',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Supervisor)',
    text: 'Rafiqul Bhai, please check tire air pressure and engine water before the afternoon Meghna Ghat trip.',
    timestamp: '08:45 AM',
    messageType: 'text',
  },
  {
    id: 'msg-drv1-2',
    requisitionId: 'drv_direct_DRV-01',
    senderRole: 'driver',
    senderName: 'Md. Rafiqul Islam (Driver)',
    text: 'Ji Sir, tires (32 PSI), oil, and water checked. Car cleaned and ready at Gate-1.',
    timestamp: '08:50 AM',
    messageType: 'text',
  },
  {
    id: 'msg-b1',
    requisitionId: 'broadcast',
    senderRole: 'admin',
    senderName: 'Transport Dispatch Desk',
    text: '📢 Traffic Notice: Road repair work on Mayor Hanif Flyover east ramp today 2:00 PM – 6:00 PM. Drivers may use Postogola or Demra road.',
    timestamp: '08:00 AM',
    messageType: 'text',
  },
  {
    id: 'msg-s1',
    requisitionId: 'emergency_sos',
    senderRole: 'admin',
    senderName: '24/7 Roadside Support Desk',
    text: '🚨 Emergency Breakdown & Tire Support Team is on standby. Post here immediately if any vehicle needs highway help.',
    timestamp: '07:30 AM',
    messageType: 'text',
  },
];

export const INITIAL_FLEET_NOTIFICATIONS: FleetNotification[] = [
  {
    id: 'fnotif-1',
    type: 'assignment',
    title: 'Car & Driver Assigned',
    message: 'Toyota Prado (GHA-13-8821) & Driver Md. Rafiqul Islam assigned to trip REQ-2026-435.',
    time: '12m ago',
    targetRole: 'employee',
    requisitionId: 'REQ-2026-435',
    unread: true,
  },
  {
    id: 'fnotif-2',
    type: 'driver_status',
    title: 'Driver Sick Leave Recorded',
    message: 'Driver Md. Delwar Hossain is on medical rest today (Fever).',
    time: '45m ago',
    targetRole: 'admin',
    unread: true,
  },
  {
    id: 'fnotif-3',
    type: 'maintenance',
    title: 'Car in Workshop Servicing',
    message: 'Corolla Altis (GHA-11-2299) is in Baridhara Garage for AC filter & gas refill.',
    time: '1h ago',
    targetRole: 'admin',
    unread: false,
  },
  {
    id: 'fnotif-4',
    type: 'requisition_created',
    title: 'New Vehicle Booking Request',
    message: 'Tanvir Ahmed requested a car (REQ-2026-441) to Keraniganj Plant at 2:30 PM.',
    time: '2h ago',
    targetRole: 'admin',
    requisitionId: 'REQ-2026-441',
    unread: false,
  },
];

const INITIAL_DRIVER_TOLL_SLIPS: DriverTollSlip[] = [
  { id: 'TOL-2026-8819', reqId: 'REQ-2026-435', plaza: 'Mayor Hanif Flyover', amount: 260, time: 'Today, 09:45 AM', status: 'Pending Review' },
  { id: 'TOL-2026-8790', reqId: 'REQ-2026-438', plaza: 'Postogola Buriganga Bridge', amount: 150, time: 'Yesterday, 02:10 PM', status: 'Paid' },
];

class FleetStore {
  private drivers: Driver[] = [...INITIAL_DRIVERS];
  private vehicles: Vehicle[] = [...INITIAL_VEHICLES];
  private requisitions: VehicleRequisition[] = [...INITIAL_REQUISITIONS];
  private chatMessages: TripChatMessage[] = [...INITIAL_CHAT_MESSAGES];
  private notifications: FleetNotification[] = [...INITIAL_FLEET_NOTIFICATIONS];
  private driverTollSlips: DriverTollSlip[] = [...INITIAL_DRIVER_TOLL_SLIPS];
  private listeners: (() => void)[] = [];

  getDrivers(): Driver[] { return this.drivers; }
  getVehicles(): Vehicle[] { return this.vehicles; }
  getRequisitions(): VehicleRequisition[] { return this.requisitions; }
  getDriverTollSlips(): DriverTollSlip[] { return this.driverTollSlips; }

  getChatMessages(reqId?: string): TripChatMessage[] {
    if (!reqId) return this.chatMessages;
    return this.chatMessages.filter((m) => m.requisitionId === reqId);
  }

  getNotifications(role?: 'employee' | 'admin'): FleetNotification[] {
    if (!role) return this.notifications;
    return this.notifications.filter((n) => n.targetRole === 'all' || n.targetRole === role);
  }

  addRequisition(req: Omit<VehicleRequisition, 'id' | 'createdAt' | 'status'>): VehicleRequisition {
    const newReq: VehicleRequisition = {
      ...req,
      id: `REQ-2026-${445 + this.requisitions.length}`,
      status: 'pending',
      hodApproval: req.hodApproval || 'pending',
      createdAt: `${SYSTEM_TODAY}, Just Now`,
    };
    this.requisitions = [newReq, ...this.requisitions];

    this.addNotification({
      type: 'requisition_created',
      title: 'New Vehicle Booking Request',
      message: `${newReq.requesterName} (${newReq.dept}) requested transport to ${newReq.to}.`,
      time: 'Just now',
      targetRole: 'admin',
      requisitionId: newReq.id,
      unread: true,
    });

    this.notify();
    return newReq;
  }

  assignRequisition(reqId: string, vehiclePlate: string, driverId: string): void {
    const vehicle = this.vehicles.find((v) => v.plate === vehiclePlate);
    const driver = this.drivers.find((d) => d.id === driverId);

    this.requisitions = this.requisitions.map((r) => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'assigned',
          hodApproval: 'approved',
          assignedVehiclePlate: vehiclePlate,
          assignedVehicleModel: vehicle?.model,
          assignedDriverId: driverId,
          assignedDriverName: driver?.name,
          assignedDriverPhone: driver?.phone,
          tripPassNo: `PASS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        };
      }
      return r;
    });

    this.drivers = this.drivers.map((d) =>
      d.id === driverId ? { ...d, status: 'on_trip', assignedVehiclePlate: vehiclePlate } : d
    );

    this.vehicles = this.vehicles.map((v) =>
      v.plate === vehiclePlate
        ? { ...v, status: 'in_transit', driverId, driverName: driver?.name, driverPhone: driver?.phone }
        : v
    );

    this.addNotification({
      type: 'assignment',
      title: 'Vehicle & Driver Assigned',
      message: `${vehiclePlate} & Driver ${driver?.name || 'Duty Driver'} assigned to ${reqId}.`,
      time: 'Just now',
      targetRole: 'employee',
      requisitionId: reqId,
      unread: true,
    });

    this.notify();
  }

  startTrip(reqId: string, startKm: number, gateOutTime: string): void {
    const targetReq = this.requisitions.find((r) => r.id === reqId);
    this.requisitions = this.requisitions.map((r) =>
      r.id === reqId ? { ...r, status: 'in_transit', odometerStart: startKm, gateOutTime } : r
    );

    if (targetReq?.assignedDriverId) {
      this.drivers = this.drivers.map((d) =>
        d.id === targetReq.assignedDriverId ? { ...d, status: 'on_trip' } : d
      );
    }
    if (targetReq?.assignedVehiclePlate) {
      this.vehicles = this.vehicles.map((v) =>
        v.plate === targetReq.assignedVehiclePlate ? { ...v, status: 'in_transit', speed: 38 } : v
      );
    }

    this.addNotification({
      type: 'gate_out',
      title: 'Trip Started',
      message: `Booking ${reqId} departed gate at ${gateOutTime} (Meter: ${startKm} km).`,
      time: 'Just now',
      targetRole: 'all',
      requisitionId: reqId,
      unread: true,
    });

    this.notify();
  }

  completeTrip(reqId: string, endKm: number, gateInTime: string, rating?: number, feedback?: string): void {
    const req = this.requisitions.find((r) => r.id === reqId);
    if (!req) return;

    this.requisitions = this.requisitions.map((r) =>
      r.id === reqId
        ? {
            ...r,
            status: 'completed',
            odometerEnd: endKm,
            gateInTime,
            rating: rating || 5,
            feedback: feedback || 'Trip completed safely.',
          }
        : r
    );

    if (req.assignedVehiclePlate) {
      this.vehicles = this.vehicles.map((v) =>
        v.plate === req.assignedVehiclePlate ? { ...v, status: 'available', speed: 0 } : v
      );
    }

    if (req.assignedDriverId) {
      this.drivers = this.drivers.map((d) =>
        d.id === req.assignedDriverId
          ? {
              ...d,
              status: 'available',
              totalTrips: d.totalTrips + 1,
              dutyHoursToday: Number((d.dutyHoursToday + 2.0).toFixed(1)),
            }
          : d
      );
    }

    this.addNotification({
      type: 'gate_in',
      title: 'Trip Completed',
      message: `Booking ${reqId} returned safely at ${gateInTime} (Closing Meter: ${endKm} km).`,
      time: 'Just now',
      targetRole: 'all',
      requisitionId: reqId,
      unread: true,
    });

    this.notify();
  }

  rejectRequisition(reqId: string, reason: string): void {
    this.requisitions = this.requisitions.map((r) =>
      r.id === reqId ? { ...r, status: 'rejected', hodApproval: 'rejected', rejectionReason: reason } : r
    );
    this.notify();
  }

  endorseHOD(reqId: string, status: 'approved' | 'rejected', reason?: string): void {
    this.requisitions = this.requisitions.map((r) => {
      if (r.id !== reqId) return r;
      if (status === 'rejected') {
        return {
          ...r,
          hodApproval: 'rejected',
          status: 'rejected',
          rejectionReason: reason || 'Returned by Department Head / Approver.',
        };
      }
      return { ...r, hodApproval: 'approved' };
    });
    this.notify();
  }

  poolRequisitions(primaryReqId: string, secondaryReqId: string, vehiclePlate: string, driverId: string): void {
    const vehicle = this.vehicles.find((v) => v.plate === vehiclePlate);
    const driver = this.drivers.find((d) => d.id === driverId);
    const sharedPass = `SHARED-PASS-${Math.floor(1000 + Math.random() * 9000)}`;

    this.requisitions = this.requisitions.map((r) => {
      if (r.id === primaryReqId || r.id === secondaryReqId) {
        return {
          ...r,
          status: 'assigned',
          hodApproval: 'approved',
          assignedVehiclePlate: vehiclePlate,
          assignedVehicleModel: vehicle?.model,
          assignedDriverId: driverId,
          assignedDriverName: driver?.name,
          assignedDriverPhone: driver?.phone,
          tripPassNo: sharedPass,
          pooledWith: r.id === primaryReqId ? secondaryReqId : primaryReqId,
        };
      }
      return r;
    });

    if (driverId) {
      this.drivers = this.drivers.map((d) =>
        d.id === driverId ? { ...d, status: 'on_trip', assignedVehiclePlate: vehiclePlate } : d
      );
    }
    if (vehiclePlate) {
      this.vehicles = this.vehicles.map((v) =>
        v.plate === vehiclePlate ? { ...v, status: 'in_transit' } : v
      );
    }

    this.notify();
  }

  issueFuelVoucher(plate: string, liters: number, station: string): string {
    const slipNo = `FUEL-2026-${Math.floor(930 + Math.random() * 600)}`;
    this.vehicles = this.vehicles.map((v) => {
      if (v.plate !== plate) return v;
      const addedPct = Math.round((liters / (v.type === 'tanker' ? 250 : 75)) * 100);
      return {
        ...v,
        fuelSlipNo: slipNo,
        fuelPct: Math.min(100, v.fuelPct + addedPct),
      };
    });

    this.addNotification({
      type: 'maintenance',
      title: `Fuel Slip Issued (${slipNo})`,
      message: `${liters}L fuel voucher issued for ${plate} at ${station}.`,
      time: 'Just now',
      targetRole: 'admin',
      unread: true,
    });

    this.notify();
    return slipNo;
  }

  submitDriverTollClaim(reqId: string, driverName: string, plaza: string, amount: number): DriverTollSlip {
    const receiptNo = `TOL-2026-${Math.floor(1000 + Math.random() * 8999)}`;
    const slip: DriverTollSlip = {
      id: receiptNo,
      reqId,
      plaza,
      amount,
      time: 'Today, Just Now',
      status: 'Pending Review',
    };
    this.driverTollSlips = [slip, ...this.driverTollSlips];

    this.sendChatMessage(
      reqId,
      'driver',
      `${driverName} (Driver)`,
      `Submitted highway/bridge toll receipt: ${plaza} (৳${amount}). Slip: ${receiptNo}`,
      {
        messageType: 'toll_claim',
        tollData: {
          tollName: plaza,
          amount,
          receiptNo,
          approved: false,
        },
      }
    );

    this.notify();
    return slip;
  }

  addVehicle(vehicle: Omit<Vehicle, 'id' | 'status' | 'speed' | 'engineTemp' | 'fuelPct' | 'fuelSlipNo' | 'nextServiceKm'>): Vehicle {
    const nextSeq = this.vehicles.length + 1;
    const newId = `V-${String(nextSeq).padStart(2, '0')}`;
    const newVehicle: Vehicle = {
      ...vehicle,
      id: newId,
      status: 'available',
      speed: 0,
      engineTemp: 40,
      fuelPct: 100,
      fuelSlipNo: `FUEL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      nextServiceKm: 5000,
    };
    this.vehicles = [newVehicle, ...this.vehicles];
    this.notify();
    return newVehicle;
  }

  addDriver(driver: Omit<Driver, 'id' | 'status' | 'breathalyzerToday' | 'dutyHoursToday' | 'totalTrips' | 'rating' | 'initials'>): Driver {
    const nextSeq = this.drivers.length + 1;
    const newId = `DRV-${String(nextSeq).padStart(2, '0')}`;
    const initials =
      driver.name
        .split(' ')
        .filter((n) => !['Md.', 'Abdul', 'Sheikh'].includes(n))
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase() || 'DR';
    const newDriver: Driver = {
      ...driver,
      id: newId,
      status: 'available',
      breathalyzerToday: '0.00% BAC (PASSED)',
      dutyHoursToday: 0,
      totalTrips: 0,
      rating: 5.0,
      initials,
    };
    this.drivers = [newDriver, ...this.drivers];
    this.notify();
    return newDriver;
  }

  retireVehicle(vehiclePlate: string): void {
    this.vehicles = this.vehicles.map((v) => (v.plate === vehiclePlate ? { ...v, status: 'maintenance' } : v));
    this.notify();
  }

  updateVehicleStatus(plate: string, status: Vehicle['status'], maintenanceDetails?: string): void {
    this.vehicles = this.vehicles.map((v) =>
      v.plate === plate ? { ...v, status, maintenanceDetails: maintenanceDetails || v.maintenanceDetails } : v
    );
    if (status === 'maintenance') {
      this.addNotification({
        type: 'maintenance',
        title: `Vehicle Sent to Workshop: ${plate}`,
        message: maintenanceDetails || 'Moved to workshop for servicing.',
        time: 'Just now',
        targetRole: 'admin',
        unread: true,
      });
    }
    this.notify();
  }

  updateDriverStatus(driverId: string, status: Driver['status'], leaveReason?: string, leaveUntil?: string): void {
    const driver = this.drivers.find((d) => d.id === driverId);
    this.drivers = this.drivers.map((d) =>
      d.id === driverId ? { ...d, status, leaveReason, leaveUntil } : d
    );
    if (status === 'sick_leave' || status === 'on_leave') {
      this.addNotification({
        type: 'driver_status',
        title: `Driver Leave: ${driver?.name || driverId}`,
        message: `Marked on ${status === 'sick_leave' ? 'Sick Leave' : 'Leave'}. ${leaveReason || ''}`,
        time: 'Just now',
        targetRole: 'admin',
        unread: true,
      });
    }
    this.notify();
  }

  sendChatMessage(
    requisitionId: string,
    senderRole: 'employee' | 'driver' | 'admin' | 'system',
    senderName: string,
    text: string,
    metadata?: {
      messageType?: 'text' | 'toll_claim' | 'location_share' | 'system_event' | 'voice_note' | 'attachment';
      tollData?: {
        tollName: string;
        amount: number;
        receiptNo: string;
        approved?: boolean;
        approvedBy?: string;
        approvedAt?: string;
      };
      locationData?: {
        title: string;
        address: string;
        coordinates?: string;
      };
      voiceData?: {
        duration: string;
        audioUrl?: string;
      };
      attachmentData?: {
        fileName: string;
        fileSize: string;
        fileType: 'image' | 'pdf' | 'document';
      };
      actionType?: 'gate_out_authorized' | 'toll_approved' | 'route_deviation';
      actionLabel?: string;
    }
  ): TripChatMessage {
    const newMsg: TripChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requisitionId,
      senderRole,
      senderName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...metadata,
    };
    this.chatMessages = [...this.chatMessages, newMsg];

    if (senderRole !== 'system') {
      const targetRole: 'employee' | 'admin' | 'all' = senderRole === 'employee' ? 'admin' : 'employee';
      this.addNotification({
        type: 'chat_message',
        title: `Trip Message: ${senderName}`,
        message: text.length > 55 ? text.slice(0, 52) + '...' : text,
        time: 'Just now',
        targetRole,
        requisitionId,
        unread: true,
      });
    }

    this.notify();
    return newMsg;
  }

  approveTollExpense(messageId: string, reqId: string, approvedBy: string = 'Md. Kamruzzaman (Transport Supervisor)'): void {
    const targetMsg = this.chatMessages.find((m) => m.id === messageId);
    if (!targetMsg || !targetMsg.tollData) return;

    const { tollName, amount, receiptNo } = targetMsg.tollData;

    this.chatMessages = this.chatMessages.map((m) => {
      if (m.id === messageId && m.tollData) {
        return {
          ...m,
          tollData: {
            ...m.tollData,
            approved: true,
            approvedBy,
            approvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        };
      }
      return m;
    });

    this.driverTollSlips = this.driverTollSlips.map((s) =>
      s.id === receiptNo ? { ...s, status: 'Approved' } : s
    );

    this.addTollExpense(reqId, tollName, amount, receiptNo);
    this.sendChatMessage(
      reqId,
      'system',
      'Transport Desk',
      `✓ Toll slip for ${tollName} (৳${amount}) approved by ${approvedBy}. Reimbursement added.`,
      {
        messageType: 'system_event',
        actionType: 'toll_approved',
        actionLabel: 'Toll Approved ৳' + amount,
      }
    );
    this.notify();
  }

  addNotification(notif: Omit<FleetNotification, 'id'>): FleetNotification {
    const newNotif: FleetNotification = {
      ...notif,
      id: `fnotif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.notifications = [newNotif, ...this.notifications];
    this.notify();
    return newNotif;
  }

  markNotificationRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n));
    this.notify();
  }

  markAllNotificationsRead(role?: 'employee' | 'admin'): void {
    this.notifications = this.notifications.map((n) => {
      if (!role || n.targetRole === 'all' || n.targetRole === role) {
        return { ...n, unread: false };
      }
      return n;
    });
    this.notify();
  }

  addTollExpense(reqId: string, tollName: string, amount: number, receiptNo: string): void {
    this.requisitions = this.requisitions.map((r) => {
      if (r.id === reqId) {
        const existing = r.tollExpenses || [];
        const newExpense = { id: `toll-${Date.now()}`, tollName, amount, receiptNo };
        const updatedTolls = [...existing, newExpense];
        const updatedCost = (r.estimatedCost || 1200) + amount;
        return {
          ...r,
          tollExpenses: updatedTolls,
          estimatedCost: updatedCost,
        };
      }
      return r;
    });

    this.addNotification({
      type: 'toll_claimed',
      title: 'Toll Slip Submitted',
      message: `${tollName} (৳${amount}) recorded for ${reqId} (Receipt: ${receiptNo}).`,
      time: 'Just now',
      targetRole: 'admin',
      requisitionId: reqId,
      unread: true,
    });

    this.notify();
  }

  recordBreathalyzer(driverId: string, result: '0.00% BAC (PASSED)' | 'FAILED'): void {
    this.drivers = this.drivers.map((d) => (d.id === driverId ? { ...d, breathalyzerToday: result } : d));
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const fleetStore = new FleetStore();

export function useFleetStore() {
  const [drivers, setDrivers] = React.useState<Driver[]>(fleetStore.getDrivers());
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(fleetStore.getVehicles());
  const [requisitions, setRequisitions] = React.useState<VehicleRequisition[]>(fleetStore.getRequisitions());
  const [chatMessages, setChatMessages] = React.useState<TripChatMessage[]>(fleetStore.getChatMessages());
  const [notifications, setNotifications] = React.useState<FleetNotification[]>(fleetStore.getNotifications());
  const [driverTollSlips, setDriverTollSlips] = React.useState<DriverTollSlip[]>(fleetStore.getDriverTollSlips());

  React.useEffect(() => {
    const unsubscribe = fleetStore.subscribe(() => {
      setDrivers([...fleetStore.getDrivers()]);
      setVehicles([...fleetStore.getVehicles()]);
      setRequisitions([...fleetStore.getRequisitions()]);
      setChatMessages([...fleetStore.getChatMessages()]);
      setNotifications([...fleetStore.getNotifications()]);
      setDriverTollSlips([...fleetStore.getDriverTollSlips()]);
    });
    return unsubscribe;
  }, []);

  return {
    drivers,
    vehicles,
    requisitions,
    chatMessages,
    notifications,
    driverTollSlips,
    addRequisition: fleetStore.addRequisition.bind(fleetStore),
    assignRequisition: fleetStore.assignRequisition.bind(fleetStore),
    startTrip: fleetStore.startTrip.bind(fleetStore),
    completeTrip: fleetStore.completeTrip.bind(fleetStore),
    rejectRequisition: fleetStore.rejectRequisition.bind(fleetStore),
    endorseHOD: fleetStore.endorseHOD.bind(fleetStore),
    poolRequisitions: fleetStore.poolRequisitions.bind(fleetStore),
    issueFuelVoucher: fleetStore.issueFuelVoucher.bind(fleetStore),
    submitDriverTollClaim: fleetStore.submitDriverTollClaim.bind(fleetStore),
    recordBreathalyzer: fleetStore.recordBreathalyzer.bind(fleetStore),
    addVehicle: fleetStore.addVehicle.bind(fleetStore),
    addDriver: fleetStore.addDriver.bind(fleetStore),
    retireVehicle: fleetStore.retireVehicle.bind(fleetStore),
    updateVehicleStatus: fleetStore.updateVehicleStatus.bind(fleetStore),
    updateDriverStatus: fleetStore.updateDriverStatus.bind(fleetStore),
    sendChatMessage: fleetStore.sendChatMessage.bind(fleetStore),
    getChatMessages: fleetStore.getChatMessages.bind(fleetStore),
    getNotifications: fleetStore.getNotifications.bind(fleetStore),
    markNotificationRead: fleetStore.markNotificationRead.bind(fleetStore),
    markAllNotificationsRead: fleetStore.markAllNotificationsRead.bind(fleetStore),
    addTollExpense: fleetStore.addTollExpense.bind(fleetStore),
    approveTollExpense: fleetStore.approveTollExpense.bind(fleetStore),
  };
}
