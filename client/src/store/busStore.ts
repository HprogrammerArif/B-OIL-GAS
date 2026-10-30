import { useState, useEffect } from 'react';
import type { BusVehicle, RouteInfo, Seat, WaitlistEntry } from '../components/bus/busTypes';
import { INITIAL_BUSES, INITIAL_ROUTES, generateSeatsForRoute } from '../components/bus/busData';

const ROUTE_1_SEATS: Seat[] = (() => {
  const generated = generateSeatsForRoute('route-1', 52);
  // Enforce canonical employee identities on Route-1
  const overrides: Record<number, Partial<Seat>> = {
    1: {
      assignedTo: 'Engr. Md. Harunur Rashid',
      staffId: 'EMP-0012',
      dept: 'Plant Operations',
      phone: '+880 1713-441199',
      pickupPoint: 'Mirpur-10 Circle',
      pickupTime: '06:45 AM',
      status: 'occupied',
      bloodGroup: 'O+',
      boarded: true,
      category: 'executive',
      bookingType: 'permanent',
    },
    2: {
      assignedTo: 'Mizanur Rahman',
      staffId: 'EMP-0914',
      dept: 'Security Administration',
      phone: '+880 1715-661122',
      pickupPoint: 'Farmgate Overbridge',
      pickupTime: '07:18 AM',
      status: 'occupied',
      bloodGroup: 'O+',
      boarded: true,
      category: 'regular',
      bookingType: 'permanent',
    },
    3: {
      assignedTo: 'Nazmul Huda',
      staffId: 'EMP-1104',
      dept: 'HSE & Compliance',
      phone: '+880 1914-778899',
      pickupPoint: 'Shahbagh Square',
      pickupTime: '07:30 AM',
      status: 'occupied',
      bloodGroup: 'B+',
      boarded: true,
      category: 'regular',
      bookingType: 'permanent',
    },
    4: {
      assignedTo: 'Engr. Tariqul Islam',
      staffId: 'EMP-1088',
      dept: 'Plant Operations',
      phone: '+880 1819-445566',
      pickupPoint: 'Shahbagh Square',
      pickupTime: '07:30 AM',
      status: 'vacated',
      vacatedReason: 'On Approved Leave',
      bloodGroup: 'A+',
      boarded: false,
      category: 'executive',
      bookingType: 'permanent',
    },
    5: {
      assignedTo: 'Tanvir Ahmed',
      staffId: 'EMP-1042',
      dept: 'Sales & Distribution',
      phone: '+880 1712-334455',
      pickupPoint: 'Farmgate Overbridge',
      pickupTime: '07:18 AM',
      status: 'occupied',
      bloodGroup: 'O+',
      boarded: true,
      category: 'regular',
      bookingType: 'permanent',
    },
  };

  return generated.map((s) => (overrides[s.num] ? { ...s, ...overrides[s.num] } : s));
})();

const INITIAL_WAITLIST: WaitlistEntry[] = [
  { rank: 1, staffId: 'EMP-5501', name: 'Shahadat Hossain', dept: 'Plant Maintenance', pickupPoint: 'Farmgate Overbridge', phone: '+880 1718-445566', joinedAt: '06:12 AM', priority: 'Emergency', shift: 'Morning Shift (07:00 AM)' },
  { rank: 2, staffId: 'EMP-5502', name: 'Nasir Uddin', dept: 'Plant Operations', pickupPoint: 'Shahbagh Square', phone: '+880 1823-998811', joinedAt: '06:25 AM', priority: 'Shift', shift: 'Morning Shift (07:00 AM)' },
  { rank: 3, staffId: 'EMP-5503', name: 'Ziaur Rahman', dept: 'Accounts & Billing', pickupPoint: 'Babubazar Bridge', phone: '+880 1912-334455', joinedAt: '06:33 AM', priority: 'Shift', shift: 'Morning Shift (07:00 AM)' },
  { rank: 4, staffId: 'EMP-5504', name: 'Sabbir Ahmed', dept: 'Quality Lab', pickupPoint: 'Farmgate Overbridge', phone: '+880 1729-110022', joinedAt: '06:40 AM', priority: 'Overtime', shift: 'Morning Shift (07:00 AM)' },
];

function buildInitialBuses(): BusVehicle[] {
  return INITIAL_BUSES.map((b) =>
    b.id === 'bus-1' ? { ...b, driverName: 'Kalam Hossain' } : b
  );
}

function buildInitialRoutes(): Record<string, RouteInfo> {
  const copy: Record<string, RouteInfo> = {};
  Object.keys(INITIAL_ROUTES).forEach((k) => {
    copy[k] =
      k === 'route-1'
        ? { ...INITIAL_ROUTES[k], driverName: 'Kalam Hossain' }
        : { ...INITIAL_ROUTES[k] };
  });
  return copy;
}

function buildInitialRouteSeats(): Record<string, Seat[]> {
  const initial: Record<string, Seat[]> = {
    'route-1': ROUTE_1_SEATS,
  };
  Object.keys(INITIAL_ROUTES).forEach((k) => {
    if (k !== 'route-1') {
      const cap = INITIAL_ROUTES[k]?.capacity || 52;
      const seats = generateSeatsForRoute(k, cap);
      if (k === 'route-7' && seats[0]) {
        seats[0] = {
          ...seats[0],
          assignedTo: 'Md. Kamruzzaman',
          staffId: 'EMP-0045',
          dept: 'Transport & Logistics',
          phone: '+880 1712-990011',
          bloodGroup: 'B+',
          category: 'executive',
        };
      }
      if (k === 'route-10' && seats[0] && seats[1]) {
        seats[0] = {
          ...seats[0],
          assignedTo: 'Farida Begum',
          staffId: 'EMP-0062',
          dept: 'Finance & Accounts',
          phone: '+880 1819-223344',
          bloodGroup: 'AB+',
          category: 'executive',
        };
        seats[1] = {
          ...seats[1],
          assignedTo: 'Sayeda Afroza Sultana',
          staffId: 'EMP-0028',
          dept: 'Human Resources',
          phone: '+880 1714-882200',
          bloodGroup: 'A+',
          category: 'executive',
        };
      }
      initial[k] = seats;
    }
  });
  return initial;
}

class BusStore {
  private buses: BusVehicle[] = buildInitialBuses();
  private routes: Record<string, RouteInfo> = buildInitialRoutes();
  private routeSeats: Record<string, Seat[]> = buildInitialRouteSeats();
  private waitlist: WaitlistEntry[] = [...INITIAL_WAITLIST];
  private delayBroadcastMessage: string | null = null;
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getBuses() { return this.buses; }
  getRoutes() { return this.routes; }
  getRouteSeats() { return this.routeSeats; }
  getWaitlist() { return this.waitlist; }
  getDelayBroadcast() { return this.delayBroadcastMessage; }

  setBuses(updater: BusVehicle[] | ((prev: BusVehicle[]) => BusVehicle[])) {
    this.buses = typeof updater === 'function' ? updater(this.buses) : updater;
    this.notify();
  }

  setRoutes(updater: Record<string, RouteInfo> | ((prev: Record<string, RouteInfo>) => Record<string, RouteInfo>)) {
    this.routes = typeof updater === 'function' ? updater(this.routes) : updater;
    this.notify();
  }

  setRouteSeats(updater: Record<string, Seat[]> | ((prev: Record<string, Seat[]>) => Record<string, Seat[]>)) {
    this.routeSeats = typeof updater === 'function' ? updater(this.routeSeats) : updater;
    this.notify();
  }

  setSeatsForRoute(routeKey: string, updater: Seat[] | ((prev: Seat[]) => Seat[])) {
    const current = this.routeSeats[routeKey] || [];
    const next = typeof updater === 'function' ? updater(current) : updater;
    this.routeSeats = {
      ...this.routeSeats,
      [routeKey]: next,
    };
    this.notify();
  }

  setWaitlist(updater: WaitlistEntry[] | ((prev: WaitlistEntry[]) => WaitlistEntry[])) {
    this.waitlist = typeof updater === 'function' ? updater(this.waitlist) : updater;
    this.notify();
  }

  setDelayBroadcast(msg: string | null) {
    this.delayBroadcastMessage = msg;
    this.notify();
  }
}

export const busStore = new BusStore();

export function useBusStore() {
  const [state, setState] = useState(() => ({
    buses: busStore.getBuses(),
    routes: busStore.getRoutes(),
    routeSeats: busStore.getRouteSeats(),
    waitlist: busStore.getWaitlist(),
    delayBroadcast: busStore.getDelayBroadcast(),
  }));

  useEffect(() => {
    return busStore.subscribe(() => {
      setState({
        buses: [...busStore.getBuses()],
        routes: { ...busStore.getRoutes() },
        routeSeats: { ...busStore.getRouteSeats() },
        waitlist: [...busStore.getWaitlist()],
        delayBroadcast: busStore.getDelayBroadcast(),
      });
    });
  }, []);

  return {
    ...state,
    setBuses: busStore.setBuses.bind(busStore),
    setRoutes: busStore.setRoutes.bind(busStore),
    setRouteSeats: busStore.setRouteSeats.bind(busStore),
    setSeatsForRoute: busStore.setSeatsForRoute.bind(busStore),
    setWaitlist: busStore.setWaitlist.bind(busStore),
    setDelayBroadcast: busStore.setDelayBroadcast.bind(busStore),
  };
}

