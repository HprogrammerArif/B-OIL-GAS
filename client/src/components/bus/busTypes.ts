export interface BusVehicle {
  id: string;
  coachNo: string;
  model: string;
  capacity: number;
  assignedRouteId: string;
  driverName: string;
  driverPhone: string;
  conductorName: string;
  conductorPhone: string;
  status: 'active' | 'standby' | 'maintenance';
  fuelLevel: string;
  fitnessExpiry: string;
  acType: 'Luxury AC' | 'Executive AC' | 'Standard AC';
  gpsTrackerId: string;
  plateNo?: string;
  assignedRoadName?: string;
}

export interface RouteStop {
  id: string;
  name: string;
  nameBn: string;
  scheduledTime: string;
  passengers: number;
  status: 'passed' | 'active' | 'upcoming';
  distanceKm: string;
  landmark?: string;
}

export interface RouteInfo {
  id: string;
  name: string;
  nameBn: string;
  coachNo: string;
  busId: string;
  model: string;
  corridorRoad: string;
  driverName: string;
  driverPhone: string;
  conductorName: string;
  conductorPhone: string;
  speed: string;
  nextStop: string;
  nextEta: string;
  progressPercent: number;
  capacity: number;
  inboundStops: RouteStop[];
  outboundStops: RouteStop[];
  inboundStartTime: string;
  outboundStartTime: string;
}

export interface Seat {
  num: number;
  row: number;
  col: 'left_win' | 'left_aisle' | 'right_aisle' | 'right_win';
  assignedTo: string | null;
  staffId?: string;
  dept: string | null;
  phone?: string;
  pickupPoint?: string;
  pickupTime?: string;
  status: 'occupied' | 'vacated' | 'empty';
  vacatedReason?: string;
  isStandbyPromoted?: boolean;
  bloodGroup?: string;
  boarded?: boolean;
  category?: 'executive' | 'lady_priority' | 'senior_staff' | 'regular';
  bookingType?: 'permanent' | 'shift_pass' | 'guest';
}

export interface WaitlistEntry {
  rank: number;
  staffId: string;
  name: string;
  dept: string;
  pickupPoint: string;
  phone: string;
  joinedAt: string;
  priority: 'Shift' | 'Emergency' | 'Overtime';
  shift: string;
  isCurrentUser?: boolean;
}
