import React from 'react';

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
  dutyHoursToday: number; // e.g. 4.5 hours
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
  speed: number; // km/h
  engineTemp: number; // Celsius
  bitumenCargoTemp?: number; // Celsius
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
    name: 'Md. Shahidul Islam',
    phone: '+880 1711-229944',
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
    initials: 'SI',
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
    licenseExpiry: '30 Dec 2026',
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
    leaveReason: 'Viral Fever & Medical Rest (Doctor Rx submitted to HR/Admin)',
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
    licenseType: 'Heavy Commercial (HAZMAT)',
    licenseExpiry: '20 Sep 2028',
    status: 'on_leave',
    leaveReason: 'Annual Earned Leave approved by HR Corporate Services',
    leaveUntil: '26 Oct 2026',
    breathalyzerToday: '0.00% BAC (PASSED)',
    dutyHoursToday: 0,
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
    model: 'Toyota Prado TXL (Executive Pool)',
    type: 'executive',
    capacitySeats: 4,
    driverId: 'DRV-01',
    driverName: 'Md. Shahidul Islam',
    driverPhone: '+880 1711-229944',
    location: 'Bashundhara Corporate HQ, Baridhara',
    speed: 0,
    engineTemp: 45,
    fuelPct: 82,
    fuelSlipNo: 'BOGCL-FUEL-2026-904',
    status: 'available',
    nextServiceKm: 4200,
    hazmatCertified: true,
  },
  {
    id: 'V-02',
    plate: 'DHAKA METRO CHA-53-4102',
    model: 'Toyota HiAce Super GL (Staff Transit)',
    type: 'microbus',
    capacitySeats: 7,
    driverId: 'DRV-02',
    driverName: 'Abdul Mannan',
    driverPhone: '+880 1819-338811',
    location: 'En route to Keraniganj via Babubazar Bridge',
    speed: 42,
    engineTemp: 86,
    fuelPct: 65,
    fuelSlipNo: 'BOGCL-FUEL-2026-898',
    status: 'in_transit',
    nextServiceKm: 1850,
    hazmatCertified: false,
    routeProgress: 65,
    routeOrigin: 'Dhaka HQ, Baridhara',
    routeDestination: 'Keraniganj Bitumen Plant',
  },
  {
    id: 'V-03',
    plate: 'DHAKA METRO KHA-11-9042',
    model: 'Tata Prima Bitumen Tanker (18,000 Ltrs)',
    type: 'tanker',
    capacitySeats: 2,
    driverId: 'DRV-03',
    driverName: 'Babul Hossain',
    driverPhone: '+880 1912-774433',
    location: 'Keraniganj Loading Bay #3 (Bitumen 60/70)',
    speed: 0,
    engineTemp: 78,
    bitumenCargoTemp: 162,
    fuelPct: 45,
    fuelSlipNo: 'BOGCL-FUEL-2026-912',
    status: 'loading',
    nextServiceKm: 780,
    hazmatCertified: true,
  },
  {
    id: 'V-04',
    plate: 'DHAKA METRO DA-14-3312',
    model: 'Mitsubishi L200 4x4 (Refinery Emergency Patrol)',
    type: 'pickup',
    capacitySeats: 4,
    driverId: 'DRV-04',
    driverName: 'Sujon Mia',
    driverPhone: '+880 1720-551122',
    location: 'Keraniganj Plant Gate #1 Security Post',
    speed: 15,
    engineTemp: 79,
    fuelPct: 90,
    fuelSlipNo: 'BOGCL-FUEL-2026-915',
    status: 'available',
    nextServiceKm: 6100,
    hazmatCertified: true,
  },
  {
    id: 'V-05',
    plate: 'DHAKA METRO TA-19-4401',
    model: 'Scania Heavy Bitumen Bulk Carrier (24,000 Ltrs)',
    type: 'tanker',
    capacitySeats: 2,
    driverId: 'DRV-05',
    driverName: 'Mofizur Rahman',
    driverPhone: '+880 1715-442200',
    location: 'Dhaka-Mawa Expressway (Passing Padma Bridge Toll)',
    speed: 58,
    engineTemp: 89,
    bitumenCargoTemp: 168,
    fuelPct: 78,
    fuelSlipNo: 'BOGCL-FUEL-2026-920',
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
    model: 'Tata Heavy Bitumen Tanker (24,000 Ltrs)',
    type: 'tanker',
    capacitySeats: 2,
    driverId: 'DRV-06',
    driverName: 'Nurul Huda',
    driverPhone: '+880 1714-998877',
    location: 'Central Workshop, Keraniganj (Brake Pad Overhaul)',
    speed: 0,
    engineTemp: 28,
    fuelPct: 20,
    fuelSlipNo: 'BOGCL-FUEL-2026-870',
    status: 'maintenance',
    maintenanceDetails: 'Brake Pad Overhaul & Air Bleed (Scheduled Workshop Work Order #WO-88)',
    nextServiceKm: 0,
    hazmatCertified: true,
  },
  {
    id: 'V-07',
    plate: 'DHAKA METRO GHA-11-2299',
    model: 'Toyota Corolla Altis (Executive Pool)',
    type: 'executive',
    capacitySeats: 4,
    location: 'Bashundhara Central Garage, Baridhara',
    speed: 0,
    engineTemp: 26,
    fuelPct: 58,
    fuelSlipNo: 'BOGCL-FUEL-2026-892',
    status: 'maintenance',
    maintenanceDetails: 'AC Compressor Gas Refill & Cabin Filter Replacement',
    nextServiceKm: 0,
    hazmatCertified: true,
  },
];

export const INITIAL_REQUISITIONS: VehicleRequisition[] = [
  {
    id: 'REQ-2026-441',
    requesterName: 'Tanvir Ahmed',
    requesterRole: 'Sr. Sales & Distribution Specialist',
    dept: 'Sales & Distribution',
    phone: '+880 1712-334455',
    from: 'Bashundhara Corporate HQ, Baridhara',
    to: 'Keraniganj Bitumen Refinery Complex',
    tripType: 'round_trip',
    departureTime: 'Today, 02:30 PM',
    returnTime: 'Today, 06:00 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 2,
    passengerNames: 'Tanvir Ahmed, Engr. Kabir',
    purpose: 'Deliver export quality test certificates to Plant GM & inspect batch loading',
    costCenter: 'CC-SALES-DHAKA-102',
    status: 'pending',
    createdAt: '17 Oct 2026, 11:20 AM',
  },
  {
    id: 'REQ-2026-435',
    requesterName: 'Tanvir Ahmed',
    requesterRole: 'Sr. Sales & Distribution Specialist',
    dept: 'Sales & Distribution',
    phone: '+880 1712-334455',
    from: 'Bashundhara Corporate HQ, Baridhara',
    to: 'Meghna Ghat Asphalt Depot & Terminal',
    tripType: 'round_trip',
    departureTime: 'Today, 03:00 PM',
    returnTime: 'Today, 07:30 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 2,
    passengerNames: 'Tanvir Ahmed, Tariqul Islam',
    purpose: 'Deliver certified bitumen sales contracts and verify delivery invoices',
    costCenter: 'CC-SALES-DHAKA-102',
    status: 'assigned',
    assignedVehiclePlate: 'DHAKA METRO GHA-13-8821',
    assignedVehicleModel: 'Toyota Prado TXL (Executive Pool)',
    assignedDriverId: 'DRV-01',
    assignedDriverName: 'Md. Shahidul Islam',
    assignedDriverPhone: '+880 1711-229944',
    tripPassNo: 'TC-2026-9042',
    createdAt: '17 Oct 2026, 09:15 AM',
    hodApproval: 'approved',
  },
  {
    id: 'REQ-2026-443',
    requesterName: 'Engr. Mizanur Rahman',
    requesterRole: 'QA/QC Lead Engineer',
    dept: 'Quality Assurance',
    phone: '+880 1815-998811',
    from: 'Bashundhara City, Panthapath',
    to: 'Keraniganj Bitumen Plant',
    tripType: 'one_way',
    departureTime: 'Today, 02:45 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 1,
    passengerNames: 'Engr. Mizanur Rahman',
    purpose: 'Witness BSTI third-party batch sampling for asphalt',
    costCenter: 'CC-QC-KER-401',
    status: 'pending',
    createdAt: '17 Oct 2026, 11:35 AM',
  },
  {
    id: 'REQ-2026-445',
    requesterName: 'Farida Begum',
    requesterRole: 'CFO & Finance Director',
    dept: 'Finance & Accounts',
    phone: '+880 1711-002102',
    from: 'Corporate HQ, Baridhara',
    to: 'Bangladesh Bank & Sonali Bank Head Office, Motijheel',
    tripType: 'round_trip',
    departureTime: 'Tomorrow, 10:00 AM',
    returnTime: 'Tomorrow, 01:30 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 3,
    passengerNames: 'Farida Begum, Head of Treasury, Accounts Manager',
    purpose: 'Executive Meeting regarding Import Letter of Credit for Bitumen Crude Feed',
    costCenter: 'CC-FIN-EXEC-001',
    status: 'assigned',
    assignedVehiclePlate: 'DHAKA METRO GHA-13-8821',
    assignedVehicleModel: 'Toyota Prado TXL (Executive Pool)',
    assignedDriverId: 'DRV-01',
    assignedDriverName: 'Md. Shahidul Islam',
    assignedDriverPhone: '+880 1711-229944',
    tripPassNo: 'TC-2026-8841',
    createdAt: '16 Oct 2026, 04:15 PM',
    hodApproval: 'approved',
  },
  {
    id: 'REQ-2026-438',
    requesterName: 'Syed Golam Faruq',
    requesterRole: 'Procurement Specialist',
    dept: 'Supply Chain & Procurement',
    phone: '+880 1719-887722',
    from: 'Bashundhara Corporate HQ, Baridhara',
    to: 'Fatullah Fuel & Bitumen Barge Terminal, Narayanganj',
    tripType: 'round_trip',
    departureTime: 'Yesterday, 09:30 AM',
    returnTime: 'Yesterday, 03:00 PM',
    requiredCapacity: 'sedan_4',
    passengersCount: 2,
    passengerNames: 'Syed Golam Faruq, Tareq Ahmed',
    purpose: 'Witness customs clearance & barge ullage inspection for 5,000 MT Bitumen',
    costCenter: 'CC-PROC-LOG-204',
    status: 'completed',
    assignedVehiclePlate: 'DHAKA METRO DA-14-3312',
    assignedVehicleModel: 'Mitsubishi L200 4x4 (Refinery Emergency Patrol)',
    assignedDriverId: 'DRV-04',
    assignedDriverName: 'Sujon Mia',
    assignedDriverPhone: '+880 1720-551122',
    tripPassNo: 'TC-2026-8819',
    createdAt: '15 Oct 2026, 02:10 PM',
    hodApproval: 'approved',
    odometerStart: 42350,
    odometerEnd: 42426,
    gateOutTime: '09:42 AM',
    gateInTime: '02:55 PM',
    rating: 5,
    feedback: 'Excellent punctuality and safe highway transit across Dhaka-Mawa corridor.',
  },
];

export const INITIAL_CHAT_MESSAGES: TripChatMessage[] = [
  // ─── REQ-2026-435: Active Duty Trip (Tanvir Ahmed & Driver Shahidul) ───
  {
    id: 'msg-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Admin)',
    text: 'Vehicle Prado GHA-13-8821 assigned for Meghna Ghat transit. Driver Shahidul has cleared 0.00% BAC breathalyzer audit.',
    timestamp: '09:20 AM',
    messageType: 'system_event',
    actionType: 'gate_out_authorized',
    actionLabel: 'Gate Out Authorized',
  },
  {
    id: 'msg-2',
    requisitionId: 'REQ-2026-435',
    senderRole: 'driver',
    senderName: 'Md. Shahidul Islam (Driver)',
    text: 'Assalamu Alaikum Tanvir Sir. Car is fueled with 82% Octane and stationed at Baridhara Gate-1 porch. AC is running at 22°C.',
    timestamp: '09:25 AM',
    messageType: 'text',
  },
  {
    id: 'msg-3',
    requisitionId: 'REQ-2026-435',
    senderRole: 'employee',
    senderName: 'Tanvir Ahmed',
    text: 'Thank you Shahidul Bhai. I am bringing the asphalt test batch certificates down in 5 mins.',
    timestamp: '09:28 AM',
    messageType: 'text',
  },
  {
    id: 'msg-loc-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'employee',
    senderName: 'Tanvir Ahmed',
    text: '📍 Shared Passenger Pickup Pin: Baridhara Corporate HQ, Main Reception Porch',
    timestamp: '09:30 AM',
    messageType: 'location_share',
    locationData: {
      title: 'Bashundhara Corporate HQ Reception',
      address: 'Plot-3, Block-G, Umme Kulsum Road, Bashundhara R/A, Dhaka',
      coordinates: '23.8166° N, 90.4328° E'
    }
  },
  {
    id: 'msg-toll-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'driver',
    senderName: 'Md. Shahidul Islam (Driver)',
    text: 'Claimed official highway toll: Mayor Hanif Flyover (৳260). Receipt: TOL-2026-8819',
    timestamp: '09:45 AM',
    messageType: 'toll_claim',
    tollData: {
      tollName: 'Mayor Hanif Flyover',
      amount: 260,
      receiptNo: 'TOL-2026-8819',
      approved: false
    }
  },
  {
    id: 'msg-voice-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'driver',
    senderName: 'Md. Shahidul Islam (Driver)',
    text: 'Audio voice dispatch: Arrived at reception porch. AC is pre-cooled.',
    timestamp: '09:48 AM',
    messageType: 'voice_note',
    voiceData: {
      duration: '0:24',
    }
  },
  {
    id: 'msg-doc-1',
    requisitionId: 'REQ-2026-435',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Admin)',
    text: 'Official Security Gate Outward Manifest Pass #TC-2026-9042',
    timestamp: '09:50 AM',
    messageType: 'attachment',
    attachmentData: {
      fileName: 'Gate_Clearance_Pass_TC-9042.pdf',
      fileSize: '1.2 MB',
      fileType: 'pdf'
    }
  },

  // ─── REQ-2026-441: Requisition in Progress ───
  {
    id: 'msg-4',
    requisitionId: 'REQ-2026-441',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Admin)',
    text: 'Requisition REQ-2026-441 is prioritized in the dispatch queue. Awaiting sedan return from Keraniganj.',
    timestamp: '11:40 AM',
    messageType: 'text',
  },

  // ─── Direct Help Desk Support (Employee <-> Transport Admin) ───
  {
    id: 'msg-desk-1',
    requisitionId: 'desk_direct',
    senderRole: 'employee',
    senderName: 'Tanvir Ahmed',
    text: 'Kamruzzaman Bhai, can we request a 7-seater microbus for the Keraniganj delegation tomorrow? We have 4 engineering inspectors.',
    timestamp: '11:45 AM',
    messageType: 'text',
  },
  {
    id: 'msg-desk-2',
    requisitionId: 'desk_direct',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Supervisor)',
    text: 'Assalamu Alaikum Tanvir. Yes, please select HiAce (7-Seater) in the requisition modal and mention 4 passengers. I will allocate Toyota HiAce CHA-53-4102 for your team.',
    timestamp: '11:48 AM',
    messageType: 'text',
  },

  // ─── Driver Direct Hotline (Admin <-> Driver Shahidul) ───
  {
    id: 'msg-drv1-1',
    requisitionId: 'drv_direct_DRV-01',
    senderRole: 'admin',
    senderName: 'Md. Kamruzzaman (Transport Supervisor)',
    text: 'Shahidul, please ensure vehicle inspection checklist is cleared before departure. Verify coolant and wiper fluid.',
    timestamp: '08:45 AM',
    messageType: 'text',
  },
  {
    id: 'msg-drv1-2',
    requisitionId: 'drv_direct_DRV-01',
    senderRole: 'driver',
    senderName: 'Md. Shahidul Islam (Driver)',
    text: 'Ji Sir, all fluids and tire pressure (32 PSI) verified. Vehicle sanitized and AC tested.',
    timestamp: '08:50 AM',
    messageType: 'text',
  },

  // ─── Company Fleet Broadcast Channel ───
  {
    id: 'msg-b1',
    requisitionId: 'broadcast',
    senderRole: 'admin',
    senderName: 'Central Logistics Dispatch',
    text: '📢 Notice to all fleet drivers: Mayor Hanif Flyover eastbound ramp undergoing repair work today from 02:00 PM to 06:00 PM. Please use Postogola or Demra bypass.',
    timestamp: '08:00 AM',
    messageType: 'text',
  },
  {
    id: 'msg-b2',
    requisitionId: 'broadcast',
    senderRole: 'admin',
    senderName: 'Central Logistics Dispatch',
    text: '⛽ Fuel Station Advisory: Bashundhara Filling Station (300 Feet Road) has full stock of Euro-4 Octane and low-sulfur diesel with valid electronic vouchers.',
    timestamp: '09:00 AM',
    messageType: 'text',
  },

  // ─── Emergency Roadside SOS Channel ───
  {
    id: 'msg-s1',
    requisitionId: 'emergency_sos',
    senderRole: 'admin',
    senderName: 'Highway Patrol Controller',
    text: '🚨 24/7 Roadside Emergency & Recovery Unit on standby. In case of tire blowout or highway breakdown, alert immediately via this channel.',
    timestamp: '07:30 AM',
    messageType: 'text',
  },
  {
    id: 'msg-s2',
    requisitionId: 'emergency_sos',
    senderRole: 'driver',
    senderName: 'Mofizur Rahman (Driver)',
    text: '⚠️ Roadside Notice: Minor tire pressure sensor alert on Tanker TA-19-4401 near Nimtoli Toll Plaza. Safe in emergency layby, valve checked.',
    timestamp: '08:15 AM',
    messageType: 'text',
  },
  {
    id: 'msg-s3',
    requisitionId: 'emergency_sos',
    senderRole: 'admin',
    senderName: 'Central Logistics Dispatch',
    text: 'Understood Mofizur. Nimtoli backup support on standby. Only proceed once tire gauge shows safe 110 PSI.',
    timestamp: '08:18 AM',
    messageType: 'text',
  },
];

export const INITIAL_FLEET_NOTIFICATIONS: FleetNotification[] = [
  {
    id: 'fnotif-1',
    type: 'assignment',
    title: 'Vehicle & Driver Allocated',
    message: 'Toyota Prado TXL (DHAKA METRO GHA-13-8821) & Driver Md. Shahidul Islam allocated to REQ-2026-435. Digital Trip Pass is active.',
    time: '12m ago',
    targetRole: 'employee',
    requisitionId: 'REQ-2026-435',
    unread: true,
  },
  {
    id: 'fnotif-2',
    type: 'driver_status',
    title: 'Driver Medical Leave Logged',
    message: 'Driver Md. Delwar Hossain reported sick (Viral Fever - Doctor Rx submitted). Marked on Sick Leave.',
    time: '45m ago',
    targetRole: 'admin',
    unread: true,
  },
  {
    id: 'fnotif-3',
    type: 'maintenance',
    title: 'Vehicle Sent to Maintenance',
    message: 'Corolla Altis (GHA-11-2299) checked into Central Workshop for scheduled AC compressor overhaul.',
    time: '1h ago',
    targetRole: 'admin',
    unread: false,
  },
  {
    id: 'fnotif-4',
    type: 'requisition_created',
    title: 'New Vehicle Requisition Submitted',
    message: 'Tanvir Ahmed submitted duty trip request REQ-2026-441 to Keraniganj Bitumen Refinery Complex.',
    time: '2h ago',
    targetRole: 'admin',
    requisitionId: 'REQ-2026-441',
    unread: false,
  },
];

// In-Memory Shared Store Singleton
class FleetStore {
  private drivers: Driver[] = [...INITIAL_DRIVERS];
  private vehicles: Vehicle[] = [...INITIAL_VEHICLES];
  private requisitions: VehicleRequisition[] = [...INITIAL_REQUISITIONS];
  private chatMessages: TripChatMessage[] = [...INITIAL_CHAT_MESSAGES];
  private notifications: FleetNotification[] = [...INITIAL_FLEET_NOTIFICATIONS];
  private listeners: (() => void)[] = [];

  getDrivers(): Driver[] {
    return this.drivers;
  }

  getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  getRequisitions(): VehicleRequisition[] {
    return this.requisitions;
  }

  getChatMessages(reqId?: string): TripChatMessage[] {
    if (!reqId) return this.chatMessages;
    return this.chatMessages.filter(m => m.requisitionId === reqId);
  }

  getNotifications(role?: 'employee' | 'admin'): FleetNotification[] {
    if (!role) return this.notifications;
    return this.notifications.filter(n => n.targetRole === 'all' || n.targetRole === role);
  }

  addRequisition(req: Omit<VehicleRequisition, 'id' | 'createdAt' | 'status'>): VehicleRequisition {
    const newReq: VehicleRequisition = {
      ...req,
      id: `REQ-2026-4${40 + this.requisitions.length + 1}`,
      status: 'pending',
      hodApproval: 'approved',
      createdAt: 'Just Now',
    };
    this.requisitions = [newReq, ...this.requisitions];

    // Trigger Admin Notification
    this.addNotification({
      type: 'requisition_created',
      title: 'New Vehicle Requisition',
      message: `${newReq.requesterName} (${newReq.dept}) submitted requisition for ${newReq.to}.`,
      time: 'Just now',
      targetRole: 'admin',
      requisitionId: newReq.id,
      unread: true,
    });

    this.notify();
    return newReq;
  }

  assignRequisition(reqId: string, vehiclePlate: string, driverId: string): void {
    const vehicle = this.vehicles.find(v => v.plate === vehiclePlate);
    const driver = this.drivers.find(d => d.id === driverId);

    this.requisitions = this.requisitions.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'assigned',
          assignedVehiclePlate: vehiclePlate,
          assignedVehicleModel: vehicle?.model,
          assignedDriverId: driverId,
          assignedDriverName: driver?.name,
          assignedDriverPhone: driver?.phone,
          tripPassNo: `TC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        };
      }
      return r;
    });

    // Update driver & vehicle statuses
    this.drivers = this.drivers.map(d => {
      if (d.id === driverId) return { ...d, status: 'on_trip', assignedVehiclePlate: vehiclePlate };
      return d;
    });

    this.vehicles = this.vehicles.map(v => {
      if (v.plate === vehiclePlate) return { ...v, status: 'in_transit', driverId, driverName: driver?.name, driverPhone: driver?.phone };
      return v;
    });

    // Trigger Notification for Employee & Driver
    this.addNotification({
      type: 'assignment',
      title: 'Vehicle & Driver Allocated!',
      message: `Vehicle ${vehiclePlate} & Driver ${driver?.name || 'Assigned Driver'} allocated to your requisition ${reqId}. Digital Trip Pass is active.`,
      time: 'Just now',
      targetRole: 'employee',
      requisitionId: reqId,
      unread: true,
    });

    this.notify();
  }

  startTrip(reqId: string, startKm: number, gateOutTime: string): void {
    this.requisitions = this.requisitions.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'in_transit',
          odometerStart: startKm,
          gateOutTime,
        };
      }
      return r;
    });

    this.addNotification({
      type: 'gate_out',
      title: 'Trip Started (Gate Outward Clearance)',
      message: `Requisition ${reqId} has cleared security gate outward at ${gateOutTime} (Odometer: ${startKm} km). Live telematics active.`,
      time: 'Just now',
      targetRole: 'all',
      requisitionId: reqId,
      unread: true,
    });

    this.notify();
  }

  completeTrip(reqId: string, endKm: number, gateInTime: string, rating?: number, feedback?: string): void {
    const req = this.requisitions.find(r => r.id === reqId);
    if (!req) return;

    this.requisitions = this.requisitions.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'completed',
          odometerEnd: endKm,
          gateInTime,
          rating: rating || 5,
          feedback: feedback || 'Trip completed safely with passenger clearance.',
        };
      }
      return r;
    });

    // Free up vehicle and driver
    if (req.assignedVehiclePlate) {
      this.vehicles = this.vehicles.map(v => {
        if (v.plate === req.assignedVehiclePlate) {
          return { ...v, status: 'available', speed: 0 };
        }
        return v;
      });
    }

    if (req.assignedDriverId) {
      this.drivers = this.drivers.map(d => {
        if (d.id === req.assignedDriverId) {
          return {
            ...d,
            status: 'available',
            totalTrips: d.totalTrips + 1,
            dutyHoursToday: Number((d.dutyHoursToday + 2.5).toFixed(1)),
          };
        }
        return d;
      });
    }

    this.addNotification({
      type: 'gate_in',
      title: 'Trip Completed (Gate Inward Clearance)',
      message: `Requisition ${reqId} returned safely at ${gateInTime} (End Odometer: ${endKm} km). Please rate your experience.`,
      time: 'Just now',
      targetRole: 'all',
      requisitionId: reqId,
      unread: true,
    });

    this.notify();
  }

  rejectRequisition(reqId: string, reason: string): void {
    this.requisitions = this.requisitions.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'rejected',
          rejectionReason: reason,
        };
      }
      return r;
    });
    this.notify();
  }

  endorseHOD(reqId: string, status: 'approved' | 'rejected'): void {
    this.requisitions = this.requisitions.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          hodApproval: status,
        };
      }
      return r;
    });
    this.notify();
  }

  poolRequisitions(primaryReqId: string, secondaryReqId: string, vehiclePlate: string, driverId: string): void {
    const vehicle = this.vehicles.find(v => v.plate === vehiclePlate);
    const driver = this.drivers.find(d => d.id === driverId);
    const sharedPass = `POOL-TC-${Math.floor(1000 + Math.random() * 9000)}`;

    this.requisitions = this.requisitions.map(r => {
      if (r.id === primaryReqId) {
        return {
          ...r,
          status: 'assigned',
          assignedVehiclePlate: vehiclePlate,
          assignedVehicleModel: vehicle?.model,
          assignedDriverId: driverId,
          assignedDriverName: driver?.name,
          assignedDriverPhone: driver?.phone,
          tripPassNo: sharedPass,
          pooledWith: secondaryReqId,
        };
      }
      if (r.id === secondaryReqId) {
        return {
          ...r,
          status: 'assigned',
          assignedVehiclePlate: vehiclePlate,
          assignedVehicleModel: vehicle?.model,
          assignedDriverId: driverId,
          assignedDriverName: driver?.name,
          assignedDriverPhone: driver?.phone,
          tripPassNo: sharedPass,
          pooledWith: primaryReqId,
        };
      }
      return r;
    });

    if (driverId) {
      this.drivers = this.drivers.map(d => d.id === driverId ? { ...d, status: 'on_trip', assignedVehiclePlate: vehiclePlate } : d);
    }
    if (vehiclePlate) {
      this.vehicles = this.vehicles.map(v => v.plate === vehiclePlate ? { ...v, status: 'in_transit' } : v);
    }

    this.notify();
  }

  addVehicle(vehicle: Omit<Vehicle, 'id' | 'status' | 'speed' | 'engineTemp' | 'fuelPct' | 'fuelSlipNo' | 'nextServiceKm'>): Vehicle {
    const nextSeq = this.vehicles.length + 1;
    const newId = `VEH-${String(nextSeq).padStart(2, '0')}`;
    const newVehicle: Vehicle = {
      ...vehicle,
      id: newId,
      status: 'available',
      speed: 0,
      engineTemp: 84,
      fuelPct: 100,
      fuelSlipNo: `FSL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      nextServiceKm: 5000,
    };
    this.vehicles = [newVehicle, ...this.vehicles];
    this.notify();
    return newVehicle;
  }

  addDriver(driver: Omit<Driver, 'id' | 'status' | 'breathalyzerToday' | 'dutyHoursToday' | 'totalTrips' | 'rating' | 'initials'>): Driver {
    const nextSeq = this.drivers.length + 1;
    const newId = `DRV-${String(nextSeq).padStart(2, '0')}`;
    const initials = driver.name.split(' ').filter(n => !['Md.', 'Abdul', 'Sheikh'].includes(n)).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'DR';
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
    this.vehicles = this.vehicles.map(v => v.plate === vehiclePlate ? { ...v, status: 'maintenance' } : v);
    this.notify();
  }

  updateVehicleStatus(plate: string, status: Vehicle['status'], maintenanceDetails?: string): void {
    this.vehicles = this.vehicles.map(v => v.plate === plate ? { ...v, status, maintenanceDetails: maintenanceDetails || v.maintenanceDetails } : v);
    if (status === 'maintenance') {
      this.addNotification({
        type: 'maintenance',
        title: `Vehicle Maintenance: ${plate}`,
        message: maintenanceDetails || 'Vehicle moved to workshop for maintenance inspection.',
        time: 'Just now',
        targetRole: 'admin',
        unread: true,
      });
    }
    this.notify();
  }

  updateDriverStatus(driverId: string, status: Driver['status'], leaveReason?: string, leaveUntil?: string): void {
    const driver = this.drivers.find(d => d.id === driverId);
    this.drivers = this.drivers.map(d => d.id === driverId ? { ...d, status, leaveReason, leaveUntil } : d);
    if (status === 'sick_leave' || status === 'on_leave') {
      this.addNotification({
        type: 'driver_status',
        title: `Driver Leave: ${driver?.name || driverId}`,
        message: `Marked as ${status === 'sick_leave' ? 'Sick Leave' : 'On Leave'}. Reason: ${leaveReason || 'Doctor rest prescribed'}.`,
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

    // Auto-create notification for counterpart
    if (senderRole !== 'system') {
      const targetRole: 'employee' | 'admin' | 'all' = senderRole === 'employee' ? 'admin' : 'employee';
      this.addNotification({
        type: 'chat_message',
        title: `Trip Chat: ${senderName}`,
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

  approveTollExpense(messageId: string, reqId: string, approvedBy: string = 'Md. Kamruzzaman (Transport Admin)'): void {
    const targetMsg = this.chatMessages.find(m => m.id === messageId);
    if (!targetMsg || !targetMsg.tollData) return;

    const { tollName, amount, receiptNo } = targetMsg.tollData;

    this.chatMessages = this.chatMessages.map(m => {
      if (m.id === messageId && m.tollData) {
        return {
          ...m,
          tollData: {
            ...m.tollData,
            approved: true,
            approvedBy,
            approvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        };
      }
      return m;
    });

    this.addTollExpense(reqId, tollName, amount, receiptNo);
    this.sendChatMessage(
      reqId,
      'system',
      'Central Transport Audit',
      `✓ Official Verification: Toll claim for ${tollName} (৳${amount}) approved by ${approvedBy}. Account credited.`,
      {
        messageType: 'system_event',
        actionType: 'toll_approved',
        actionLabel: 'Toll Approved ৳' + amount
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
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, unread: false } : n);
    this.notify();
  }

  markAllNotificationsRead(role?: 'employee' | 'admin'): void {
    this.notifications = this.notifications.map(n => {
      if (!role || n.targetRole === 'all' || n.targetRole === role) {
        return { ...n, unread: false };
      }
      return n;
    });
    this.notify();
  }

  addTollExpense(reqId: string, tollName: string, amount: number, receiptNo: string): void {
    this.requisitions = this.requisitions.map(r => {
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
      title: 'Toll Expense Claimed',
      message: `${tollName} (৳${amount}) recorded for Requisition ${reqId}. Receipt: ${receiptNo}.`,
      time: 'Just now',
      targetRole: 'admin',
      requisitionId: reqId,
      unread: true,
    });

    this.notify();
  }

  recordBreathalyzer(driverId: string, result: '0.00% BAC (PASSED)' | 'FAILED'): void {
    this.drivers = this.drivers.map(d => {
      if (d.id === driverId) return { ...d, breathalyzerToday: result };
      return d;
    });
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const fleetStore = new FleetStore();

export function useFleetStore() {
  const [drivers, setDrivers] = React.useState<Driver[]>(fleetStore.getDrivers());
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(fleetStore.getVehicles());
  const [requisitions, setRequisitions] = React.useState<VehicleRequisition[]>(fleetStore.getRequisitions());
  const [chatMessages, setChatMessages] = React.useState<TripChatMessage[]>(fleetStore.getChatMessages());
  const [notifications, setNotifications] = React.useState<FleetNotification[]>(fleetStore.getNotifications());

  React.useEffect(() => {
    const unsubscribe = fleetStore.subscribe(() => {
      setDrivers([...fleetStore.getDrivers()]);
      setVehicles([...fleetStore.getVehicles()]);
      setRequisitions([...fleetStore.getRequisitions()]);
      setChatMessages([...fleetStore.getChatMessages()]);
      setNotifications([...fleetStore.getNotifications()]);
    });
    return unsubscribe;
  }, []);

  return {
    drivers,
    vehicles,
    requisitions,
    chatMessages,
    notifications,
    addRequisition: fleetStore.addRequisition.bind(fleetStore),
    assignRequisition: fleetStore.assignRequisition.bind(fleetStore),
    startTrip: fleetStore.startTrip.bind(fleetStore),
    completeTrip: fleetStore.completeTrip.bind(fleetStore),
    rejectRequisition: fleetStore.rejectRequisition.bind(fleetStore),
    endorseHOD: fleetStore.endorseHOD.bind(fleetStore),
    poolRequisitions: fleetStore.poolRequisitions.bind(fleetStore),
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
