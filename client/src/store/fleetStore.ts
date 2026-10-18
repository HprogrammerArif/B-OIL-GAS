import React from 'react';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  licenseType: 'Heavy Commercial (HAZMAT)' | 'Light Commercial' | 'PSV Microbus';
  licenseExpiry: string;
  status: 'available' | 'on_trip' | 'off_duty' | 'rest_required';
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
  status: 'available' | 'in_transit' | 'loading' | 'maintenance';
  nextServiceKm: number;
  hazmatCertified: boolean;
  routeProgress?: number;
  routeOrigin?: string;
  routeDestination?: string;
}

export interface VehicleRequisition {
  id: string;
  requesterName: string;
  requesterRole: string;
  dept: string;
  phone: string;
  from: string;
  to: string;
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
  },
];

// In-Memory Shared Store Singleton
class FleetStore {
  private drivers: Driver[] = [...INITIAL_DRIVERS];
  private vehicles: Vehicle[] = [...INITIAL_VEHICLES];
  private requisitions: VehicleRequisition[] = [...INITIAL_REQUISITIONS];
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

  addRequisition(req: Omit<VehicleRequisition, 'id' | 'createdAt' | 'status'>): VehicleRequisition {
    const newReq: VehicleRequisition = {
      ...req,
      id: `REQ-2026-4${40 + this.requisitions.length + 1}`,
      status: 'pending',
      createdAt: 'Just Now',
    };
    this.requisitions = [newReq, ...this.requisitions];
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

  updateDriverStatus(driverId: string, status: Driver['status']): void {
    this.drivers = this.drivers.map(d => d.id === driverId ? { ...d, status } : d);
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

  React.useEffect(() => {
    const unsubscribe = fleetStore.subscribe(() => {
      setDrivers([...fleetStore.getDrivers()]);
      setVehicles([...fleetStore.getVehicles()]);
      setRequisitions([...fleetStore.getRequisitions()]);
    });
    return unsubscribe;
  }, []);

  return {
    drivers,
    vehicles,
    requisitions,
    addRequisition: fleetStore.addRequisition.bind(fleetStore),
    assignRequisition: fleetStore.assignRequisition.bind(fleetStore),
    recordBreathalyzer: fleetStore.recordBreathalyzer.bind(fleetStore),
    addVehicle: fleetStore.addVehicle.bind(fleetStore),
    addDriver: fleetStore.addDriver.bind(fleetStore),
    retireVehicle: fleetStore.retireVehicle.bind(fleetStore),
    updateDriverStatus: fleetStore.updateDriverStatus.bind(fleetStore),
  };
}
