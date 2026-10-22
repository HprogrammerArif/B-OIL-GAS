import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Bus, Users, MapPin, CheckCircle, Clock, AlertTriangle,
  QrCode, UserMinus, UserPlus, Phone, Compass, BellRing,
  Navigation, CheckCheck, X, Shield, Smartphone, RefreshCw,
  Search, Filter, Calendar, Award, ChevronRight, FileText,
  Printer, ArrowUpRight, Zap, CheckCircle2, UserCheck, Info,
  Fuel, Activity, Gauge, AlertCircle, Share2, Lock, Sparkles
} from 'lucide-react';

interface Seat {
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
}

interface WaitlistEntry {
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

interface RouteStop {
  id: string;
  name: string;
  nameBn: string;
  scheduledTime: string;
  passengers: number;
  status: 'passed' | 'active' | 'upcoming';
  distanceKm: string;
}

interface RouteInfo {
  id: string;
  name: string;
  nameBn: string;
  coachNo: string;
  model: string;
  driverName: string;
  driverPhone: string;
  conductorName: string;
  conductorPhone: string;
  speed: string;
  nextStop: string;
  nextEta: string;
  progressPercent: number;
  capacity: number;
  stops: RouteStop[];
}

const ROUTES_DATA: Record<string, RouteInfo> = {
  'route-1': {
    id: 'route-1',
    name: 'Route-1: Mirpur-10 ➔ Farmgate ➔ Shahbagh ➔ Babubazar ➔ Plant',
    nameBn: 'রুট-১: মিরপুর-১০ ➔ ফার্মগেট ➔ শাহবাগ ➔ বাবুবাজার ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 15-4421',
    model: 'Hino RM2 Luxury AC (52-Seater)',
    driverName: 'Master Rafiqul Islam',
    driverPhone: '+880 1712-334499',
    conductorName: 'Jalal Uddin Mia',
    conductorPhone: '+880 1819-223344',
    speed: '42 km/h',
    nextStop: 'Babubazar Bridge Overpass',
    nextEta: '8 mins (07:38 AM)',
    progressPercent: 70,
    capacity: 52,
    stops: [
      { id: 's1', name: 'Mirpur-10 Circle', nameBn: 'মিরপুর-১০ গোলচত্বর', scheduledTime: '06:45 AM', passengers: 12, status: 'passed', distanceKm: '0.0 km' },
      { id: 's2', name: 'Agargaon Metro Gate', nameBn: 'আগারগাঁও মেট্রো গেট', scheduledTime: '07:00 AM', passengers: 8, status: 'passed', distanceKm: '4.2 km' },
      { id: 's3', name: 'Farmgate Overbridge', nameBn: 'ফার্মগেট ওভারব্রিজ', scheduledTime: '07:18 AM', passengers: 14, status: 'passed', distanceKm: '8.5 km' },
      { id: 's4', name: 'Shahbagh Square', nameBn: 'শাহবাগ চত্বর', scheduledTime: '07:30 AM', passengers: 9, status: 'active', distanceKm: '12.0 km' },
      { id: 's5', name: 'Babubazar Bridge', nameBn: 'বাবুবাজার ব্রিজ', scheduledTime: '07:42 AM', passengers: 6, status: 'upcoming', distanceKm: '16.5 km' },
      { id: 's6', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:00 AM', passengers: 0, status: 'upcoming', distanceKm: '22.8 km' },
    ]
  },
  'route-2': {
    id: 'route-2',
    name: 'Route-2: Uttara-Azampur ➔ Airport ➔ Mohakhali ➔ Maghbazar ➔ Plant',
    nameBn: 'রুট-২: উত্তরা-আজমপুর ➔ বিমানবন্দর ➔ মহাখালী ➔ মগবাজার ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 14-8832',
    model: 'Scania Touring HD 52-Seater',
    driverName: 'Kabir Hossain',
    driverPhone: '+880 1715-998811',
    conductorName: 'Shumon Ali',
    conductorPhone: '+880 1822-445566',
    speed: '38 km/h',
    nextStop: 'Mohakhali Flyover North',
    nextEta: '12 mins (07:40 AM)',
    progressPercent: 48,
    capacity: 52,
    stops: [
      { id: 's21', name: 'Uttara House Building', nameBn: 'উত্তরা হাউস বিল্ডিং', scheduledTime: '06:30 AM', passengers: 15, status: 'passed', distanceKm: '0.0 km' },
      { id: 's22', name: 'Airport Station', nameBn: 'বিমানবন্দর রেলওয়ে স্টেশন', scheduledTime: '06:45 AM', passengers: 10, status: 'passed', distanceKm: '5.1 km' },
      { id: 's23', name: 'Mohakhali Flyover', nameBn: 'মহাখালী ফ্লাইওভার', scheduledTime: '07:15 AM', passengers: 14, status: 'active', distanceKm: '14.2 km' },
      { id: 's24', name: 'Maghbazar Crossing', nameBn: 'মগবাজার ক্রসিং', scheduledTime: '07:32 AM', passengers: 8, status: 'upcoming', distanceKm: '18.7 km' },
      { id: 's25', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:05 AM', passengers: 0, status: 'upcoming', distanceKm: '28.4 km' },
    ]
  },
  'route-3': {
    id: 'route-3',
    name: 'Route-3: Narayanganj-Chashara ➔ Signboard ➔ Jatrabari ➔ Plant',
    nameBn: 'রুট-৩: নারায়ণগঞ্জ-চাষাড়া ➔ সাইনবোর্ড ➔ যাত্রাবাড়ী ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 16-1109',
    model: 'Hyundai Universe Express (52-Seater)',
    driverName: 'Alamgir Hossain',
    driverPhone: '+880 1718-223388',
    conductorName: 'Mintu Sarker',
    conductorPhone: '+880 1914-778899',
    speed: '45 km/h',
    nextStop: 'Postogola Toll Plaza',
    nextEta: '6 mins (07:35 AM)',
    progressPercent: 78,
    capacity: 52,
    stops: [
      { id: 's31', name: 'Chashara Terminal', nameBn: 'চাষাড়া টার্মিনাল', scheduledTime: '06:50 AM', passengers: 18, status: 'passed', distanceKm: '0.0 km' },
      { id: 's32', name: 'Signboard Link Road', nameBn: 'সাইনবোর্ড লিংক রোড', scheduledTime: '07:08 AM', passengers: 12, status: 'passed', distanceKm: '7.8 km' },
      { id: 's33', name: 'Jatrabari Flyover Ramp', nameBn: 'যাত্রাবাড়ী ফ্লাইওভার র‍্যাম্প', scheduledTime: '07:22 AM', passengers: 11, status: 'passed', distanceKm: '13.5 km' },
      { id: 's34', name: 'Postogola Bridge', nameBn: 'পোস্তগোলা ব্রিজ', scheduledTime: '07:34 AM', passengers: 7, status: 'active', distanceKm: '17.2 km' },
      { id: 's35', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '07:55 AM', passengers: 0, status: 'upcoming', distanceKm: '24.0 km' },
    ]
  },
  'route-4': {
    id: 'route-4',
    name: 'Route-4: Dhanmondi-27 ➔ Science Lab ➔ New Market ➔ Azimpur ➔ Plant',
    nameBn: 'রুট-৪: ধানমন্ডি-২৭ ➔ সায়েন্স ল্যাব ➔ নিউ মার্কেট ➔ আজিমপুর ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 13-9021',
    model: 'Ashok Leyland Falcon Intercity',
    driverName: 'Selim Reza',
    driverPhone: '+880 1711-447700',
    conductorName: 'Nasir Uddin',
    conductorPhone: '+880 1813-665544',
    speed: '32 km/h',
    nextStop: 'New Market Overbridge',
    nextEta: '9 mins (07:37 AM)',
    progressPercent: 62,
    capacity: 52,
    stops: [
      { id: 's41', name: 'Dhanmondi-27 (Shatmasjid Rd)', nameBn: 'ধানমন্ডি-২৭ (সাতমসজিদ রোড)', scheduledTime: '06:55 AM', passengers: 14, status: 'passed', distanceKm: '0.0 km' },
      { id: 's42', name: 'Science Laboratory', nameBn: 'সায়েন্স ল্যাবরেটরি', scheduledTime: '07:12 AM', passengers: 11, status: 'passed', distanceKm: '3.6 km' },
      { id: 's43', name: 'New Market Footbridge', nameBn: 'নিউ মার্কেট ফুটওভারব্রিজ', scheduledTime: '07:25 AM', passengers: 13, status: 'active', distanceKm: '5.9 km' },
      { id: 's44', name: 'Azimpur Maternity Gate', nameBn: 'আজিমপুর মাতৃসদন গেট', scheduledTime: '07:36 AM', passengers: 8, status: 'upcoming', distanceKm: '7.8 km' },
      { id: 's45', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:00 AM', passengers: 0, status: 'upcoming', distanceKm: '16.5 km' },
    ]
  }
};

const INITIAL_SEATS: Seat[] = [
  // Row 1
  { num: 1, row: 1, col: 'left_win', assignedTo: 'Engr. Harunur Rashid', staffId: 'EMP-0104', dept: 'Plant GM & Operations', phone: '+880 1711-002101', pickupPoint: 'Dhanmondi-27', pickupTime: '06:55 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 2, row: 1, col: 'left_aisle', assignedTo: 'Mizanur Rahman', staffId: 'EMP-0219', dept: 'Quality Assurance', phone: '+880 1712-441122', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 3, row: 1, col: 'right_aisle', assignedTo: 'Farhana Kabir', staffId: 'EMP-0312', dept: 'EHS Safety Lead', phone: '+880 1819-556677', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 4, row: 1, col: 'right_win', assignedTo: 'Engr. Tariq Ahmed', staffId: 'EMP-0145', dept: 'Maintenance Div.', phone: '+880 1711-002105', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'vacated', vacatedReason: 'Approved Annual Leave', bloodGroup: 'AB+' },

  // Row 2 (Tanvir Ahmed holds Seat #5)
  { num: 5, row: 2, col: 'left_win', assignedTo: 'Tanvir Ahmed', staffId: 'EMP-1042', dept: 'Sales & Distribution', phone: '+880 1720-334455', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 6, row: 2, col: 'left_aisle', assignedTo: 'Shariful Islam', staffId: 'EMP-0452', dept: 'Refinery Tech', phone: '+880 1713-998877', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 7, row: 2, col: 'right_aisle', assignedTo: 'Rezaul Karim', staffId: 'EMP-0678', dept: 'Instrument Specialist', phone: '+880 1814-223344', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'vacated', vacatedReason: 'Working from Corporate HQ Dhaka', bloodGroup: 'A+' },
  { num: 8, row: 2, col: 'right_win', assignedTo: 'Babul Akhter', staffId: 'EMP-0551', dept: 'Logistics Custodian', phone: '+880 1911-887766', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'O-' },

  // Row 3
  { num: 9, row: 3, col: 'left_win', assignedTo: 'Nurul Amin', staffId: 'EMP-0782', dept: 'Plant Accounts', phone: '+880 1715-667788', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 10, row: 3, col: 'left_aisle', assignedTo: 'Kamrul Hasan', staffId: 'EMP-0891', dept: 'HR & Administration', phone: '+880 1816-554433', pickupPoint: 'Agargaon Metro', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 11, row: 3, col: 'right_aisle', assignedTo: 'Saiful Islam', staffId: 'EMP-0924', dept: 'Lab Chemist', phone: '+880 1917-443322', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'AB+' },
  { num: 12, row: 3, col: 'right_win', assignedTo: null, staffId: undefined, dept: null, status: 'empty' },

  // Row 4
  { num: 13, row: 4, col: 'left_win', assignedTo: 'Arif Hossain', staffId: 'EMP-1102', dept: 'Security Officer', phone: '+880 1718-223311', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 14, row: 4, col: 'left_aisle', assignedTo: 'Al-Amin Mia', staffId: 'EMP-1205', dept: 'Boiler Operator', phone: '+880 1819-112233', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 15, row: 4, col: 'right_aisle', assignedTo: 'Mahbub Alam', staffId: 'EMP-1311', dept: 'Electrical Engr.', phone: '+880 1920-334455', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 16, row: 4, col: 'right_win', assignedTo: 'Tofazzal Hossain', staffId: 'EMP-1402', dept: 'Maintenance', phone: '+880 1725-889900', pickupPoint: 'Agargaon Metro', pickupTime: '07:00 AM', status: 'vacated', vacatedReason: 'Self-commute by motorcycle today', bloodGroup: 'B+' },

  // Row 5
  { num: 17, row: 5, col: 'left_win', assignedTo: 'Delwar Hossain', staffId: 'EMP-1520', dept: 'Plant Instrumentation', phone: '+880 1721-667788', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 18, row: 5, col: 'left_aisle', assignedTo: 'Jahangir Alam', staffId: 'EMP-1632', dept: 'Shift Marshall', phone: '+880 1822-778899', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 19, row: 5, col: 'right_aisle', assignedTo: 'Moniruzzaman', staffId: 'EMP-1744', dept: 'Piping Specialist', phone: '+880 1923-889900', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 20, row: 5, col: 'right_win', assignedTo: null, dept: null, status: 'empty' },

  // Row 6
  { num: 21, row: 6, col: 'left_win', assignedTo: 'Zahirul Haque', staffId: 'EMP-1850', dept: 'Terminal Dispatch', phone: '+880 1726-112233', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 22, row: 6, col: 'left_aisle', assignedTo: 'Shahidul Islam', staffId: 'EMP-1901', dept: 'Warehouse Lead', phone: '+880 1827-223344', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 23, row: 6, col: 'right_aisle', assignedTo: 'Imran Nazir', staffId: 'EMP-2015', dept: 'Refinery Process', phone: '+880 1928-334455', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 24, row: 6, col: 'right_win', assignedTo: 'Anwar Sadat', staffId: 'EMP-2108', dept: 'Safety Inspector', phone: '+880 1729-445566', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'AB+' },

  // Row 7
  { num: 25, row: 7, col: 'left_win', assignedTo: 'Golam Mostafa', staffId: 'EMP-2210', dept: 'Turbine Mechanic', phone: '+880 1730-556677', pickupPoint: 'Agargaon Metro', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 26, row: 7, col: 'left_aisle', assignedTo: 'Nazrul Islam', staffId: 'EMP-2322', dept: 'Compressor Tech', phone: '+880 1831-667788', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 27, row: 7, col: 'right_aisle', assignedTo: 'Asaduzzaman', staffId: 'EMP-2433', dept: 'LPG Bottling', phone: '+880 1932-778899', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 28, row: 7, col: 'right_win', assignedTo: 'Mustafizur Rahman', staffId: 'EMP-2544', dept: 'Instrumentation', phone: '+880 1733-889900', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'O-' },

  // Row 8
  { num: 29, row: 8, col: 'left_win', assignedTo: 'Habibur Rahman', staffId: 'EMP-2655', dept: 'Control Room Tech', phone: '+880 1734-990011', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 30, row: 8, col: 'left_aisle', assignedTo: 'Rabiul Awal', staffId: 'EMP-2766', dept: 'HVAC Specialist', phone: '+880 1835-001122', pickupPoint: 'Agargaon Metro', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 31, row: 8, col: 'right_aisle', assignedTo: 'Kawsar Ahmed', staffId: 'EMP-2877', dept: 'Water Treatment', phone: '+880 1936-112233', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 32, row: 8, col: 'right_win', assignedTo: null, dept: null, status: 'empty' },

  // Row 9
  { num: 33, row: 9, col: 'left_win', assignedTo: 'Shamsul Alam', staffId: 'EMP-2988', dept: 'Fire & Safety Officer', phone: '+880 1737-223344', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 34, row: 9, col: 'left_aisle', assignedTo: 'Liton Das', staffId: 'EMP-3099', dept: 'Plant Chemist', phone: '+880 1838-334455', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 35, row: 9, col: 'right_aisle', assignedTo: 'Akram Hossain', staffId: 'EMP-3101', dept: 'Tank Farm Operator', phone: '+880 1939-445566', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 36, row: 9, col: 'right_win', assignedTo: 'Bazlur Rashid', staffId: 'EMP-3212', dept: 'Pipeline Welder', phone: '+880 1740-556677', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'AB+' },

  // Row 10
  { num: 37, row: 10, col: 'left_win', assignedTo: 'Selim Mia', staffId: 'EMP-3323', dept: 'Generators Lead', phone: '+880 1741-667788', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 38, row: 10, col: 'left_aisle', assignedTo: 'Ashraful Islam', staffId: 'EMP-3434', dept: 'Maintenance Fitter', phone: '+880 1842-778899', pickupPoint: 'Agargaon Metro', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 39, row: 10, col: 'right_aisle', assignedTo: 'Farid Uddin', staffId: 'EMP-3545', dept: 'Civil Works Tech', phone: '+880 1943-889900', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 40, row: 10, col: 'right_win', assignedTo: null, dept: null, status: 'empty' },

  // Row 11
  { num: 41, row: 11, col: 'left_win', assignedTo: 'Mainul Islam', staffId: 'EMP-3656', dept: 'Flare System Tech', phone: '+880 1744-990011', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 42, row: 11, col: 'left_aisle', assignedTo: 'Badrul Huda', staffId: 'EMP-3767', dept: 'Security Escort', phone: '+880 1845-001122', pickupPoint: 'Agargaon Metro', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 43, row: 11, col: 'right_aisle', assignedTo: 'Nazim Uddin', staffId: 'EMP-3878', dept: 'Stores Supervisor', phone: '+880 1946-112233', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 44, row: 11, col: 'right_win', assignedTo: 'Saidur Rahman', staffId: 'EMP-3989', dept: 'Canteen Supervisor', phone: '+880 1747-223344', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'O+' },

  // Row 12
  { num: 45, row: 12, col: 'left_win', assignedTo: 'Touhidul Islam', staffId: 'EMP-4090', dept: 'Electrical Substation', phone: '+880 1748-334455', pickupPoint: 'Mirpur-10 Circle', pickupTime: '06:45 AM', status: 'occupied', bloodGroup: 'AB+' },
  { num: 46, row: 12, col: 'left_aisle', assignedTo: 'Belal Hossain', staffId: 'EMP-4101', dept: 'Laboratory Asst.', phone: '+880 1849-445566', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 47, row: 12, col: 'right_aisle', assignedTo: 'Sultan Mahmud', staffId: 'EMP-4212', dept: 'Diesel Generator Tech', phone: '+880 1950-556677', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 48, row: 12, col: 'right_win', assignedTo: null, dept: null, status: 'empty' },

  // Row 13
  { num: 49, row: 13, col: 'left_win', assignedTo: 'Enamul Haque', staffId: 'EMP-4323', dept: 'Refinery Utilities', phone: '+880 1751-667788', pickupPoint: 'Farmgate Overbridge', pickupTime: '07:18 AM', status: 'occupied', bloodGroup: 'O+' },
  { num: 50, row: 13, col: 'left_aisle', assignedTo: 'Firoz Ahmed', staffId: 'EMP-4434', dept: 'Logistics Handler', phone: '+880 1852-778899', pickupPoint: 'Agargaon Metro', pickupTime: '07:00 AM', status: 'occupied', bloodGroup: 'B+' },
  { num: 51, row: 13, col: 'right_aisle', assignedTo: 'Sajid Hasan', staffId: 'EMP-4545', dept: 'EHS Assistant', phone: '+880 1953-889900', pickupPoint: 'Shahbagh Square', pickupTime: '07:30 AM', status: 'occupied', bloodGroup: 'A+' },
  { num: 52, row: 13, col: 'right_win', assignedTo: 'Rokonuzzaman', staffId: 'EMP-4656', dept: 'Security Gate Staff', phone: '+880 1754-990011', pickupPoint: 'Babubazar Bridge', pickupTime: '07:42 AM', status: 'occupied', bloodGroup: 'O+' },
];

const INITIAL_WAITLIST: WaitlistEntry[] = [
  { rank: 1, staffId: 'EMP-5501', name: 'Shahadat Hossain', dept: 'Mechanical Tech', pickupPoint: 'Farmgate Overbridge', phone: '+880 1718-445566', joinedAt: '06:12 AM', priority: 'Emergency', shift: 'Morning Shift (07:00 AM)' },
  { rank: 2, staffId: 'EMP-5502', name: 'Nasir Uddin', dept: 'Refinery Operator', pickupPoint: 'Shahbagh Square', phone: '+880 1823-998811', joinedAt: '06:25 AM', priority: 'Shift', shift: 'Morning Shift (07:00 AM)' },
  { rank: 3, staffId: 'EMP-5503', name: 'Ziaur Rahman', dept: 'Procurement Asst.', pickupPoint: 'Babubazar Bridge', phone: '+880 1912-334455', joinedAt: '06:33 AM', priority: 'Shift', shift: 'Morning Shift (07:00 AM)' },
  { rank: 4, staffId: 'EMP-5504', name: 'Sabbir Ahmed', dept: 'Chemical Blending Tech', pickupPoint: 'Farmgate Overbridge', phone: '+880 1729-110022', joinedAt: '06:40 AM', priority: 'Overtime', shift: 'Morning Shift (07:00 AM)' },
  { rank: 5, staffId: 'EMP-5505', name: 'Tarek Mansoor', dept: 'EHS Compliance Officer', pickupPoint: 'Mirpur-10 Circle', phone: '+880 1830-449922', joinedAt: '06:48 AM', priority: 'Emergency', shift: 'Morning Shift (07:00 AM)' },
];

export default function BusView({ role, lang }: ViewProps) {
  // Operational perspective: staff vs supervisor (default to staff if role is employee)
  const [activePerspective, setActivePerspective] = useState<'staff' | 'supervisor'>(
    role === 'transport_admin' ? 'supervisor' : 'staff'
  );

  // Routes & Seats State
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('route-1');
  const [seats, setSeats] = useState<Seat[]>(INITIAL_SEATS);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(INITIAL_SEATS[4]); // Seat #5 Tanvir Ahmed

  // Filters & Tabs
  const [seatFilter, setSeatFilter] = useState<'all' | 'occupied' | 'vacated' | 'empty' | 'mine'>('all');
  const [activeTab, setActiveTab] = useState<'dossier' | 'fifo' | 'route' | 'driver'>('dossier');

  // Modals
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [showVacateDialog, setShowVacateDialog] = useState<boolean>(false);
  const [showTimetableModal, setShowTimetableModal] = useState<boolean>(false);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [vacateReason, setVacateReason] = useState<string>('Working from Corporate HQ Dhaka');

  const isAnyModalOpen = showVacateDialog || showJoinModal || showQrModal || showTimetableModal || showScannerModal;

  useEffect(() => {
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnyModalOpen]);

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

  const activeRoute = ROUTES_DATA[selectedRouteKey] || ROUTES_DATA['route-1'];

  // Current logged-in user profile (Tanvir Ahmed, Seat #5)
  const mySeat = seats.find(s => s.num === 5);
  const isMySeatVacated = mySeat?.status === 'vacated';
  const myWaitlistEntry = waitlist.find(w => w.staffId === 'EMP-1042' || w.name === 'Tanvir Ahmed');

  // Counts
  const occupiedCount = seats.filter(s => s.status === 'occupied').length;
  const vacatedCount = seats.filter(s => s.status === 'vacated').length;
  const emptyCount = seats.filter(s => s.status === 'empty').length;
  const totalSeats = seats.length;
  const fillRate = ((occupiedCount / totalSeats) * 100).toFixed(0);

  // Employee Voluntary Seat Release Action
  const handleReleaseMySeat = () => {
    setSeats(prev => prev.map(s => {
      if (s.num === 5) {
        return {
          ...s,
          status: 'vacated',
          vacatedReason: vacateReason,
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

    // Pair top candidates with vacated seats in strict FIFO order
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
          pickupTime: '07:22 AM (Standby)',
          status: 'occupied',
          vacatedReason: undefined,
          isStandbyPromoted: true,
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
          pickupTime: '07:25 AM (Standby)',
          status: 'occupied',
          vacatedReason: undefined,
          isStandbyPromoted: true,
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

  return (
    <div className="view-container view-transition-wrapper">
      {/* ─── Top Header with Perspective Switcher ────────────────────── */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              🚍 {t('Shift Commute & Bus FIFO Waitlist', 'শিফট যাতায়াত ও বাস সিট ফিফো অপেক্ষাতালিকা', lang)}
            </h2>
            <span className="badge info" style={{ fontSize: '10px' }}>
              {activeRoute.coachNo}
            </span>
          </div>
          <p className="section-subtitle" style={{ marginTop: '4px' }}>
            {t(
              'Interactive 52-seater coach fuselage, automated FIFO standby pool, personal boarding pass & GPS route telemetry.',
              '৫২-সিটার কোচ লেআউট, ফিফো অপেক্ষাতালিকা অটোমেশন, ডিজিটাল বোর্ডিং পাস ও জিপিএস বাস ট্র্যাকিং।',
              lang
            )}
          </p>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                padding: '5px 11px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: activePerspective === 'staff' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <span>👤 {t('Staff View (Tanvir)', 'স্টাফ ভিউ', lang)}</span>
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
                padding: '5px 11px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: activePerspective === 'supervisor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Shield size={12} />
              <span>{t('Supervisor Deck', 'সুপারভাইজার ভিউ', lang)}</span>
            </button>
          </div>

          <button className="btn-outline" onClick={() => setShowTimetableModal(true)}>
            <Calendar size={14} /> {t('Timetable', 'সময়সূচী', lang)}
          </button>

          {activePerspective === 'supervisor' && (
            <button className="btn-outline" onClick={() => setShowScannerModal(true)}>
              <Smartphone size={14} /> {t('Conductor Scanner', 'কন্ডাক্টর স্ক্যানার', lang)}
            </button>
          )}

          <button className="btn-primary" onClick={() => setShowQrModal(true)}>
            <QrCode size={14} /> {t('My Boarding Pass', 'আমার বোর্ডিং পাস', lang)}
          </button>
        </div>
      </div>

      {/* ─── Role Operational Boundary Callout Strip ────────────────── */}
      {activePerspective === 'staff' ? (
        <div style={{
          background: 'rgba(59, 130, 246, 0.07)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '10px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--brand-slate-700)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={16} color="#2563EB" />
            <div>
              <strong>{t('Employee Self-Service Mode:', 'কর্মচারী সেলফ-সার্ভিস মোড:', lang)}</strong>{' '}
              {t(
                'You can view real-time bus seats, track GPS, and release or reclaim your own Seat #05. Seat allocation and FIFO waitlist promotions are strictly governed by the Plant Transport Supervisor.',
                'আপনি আপনার ৫ নম্বর আসন পরিচালনা ও লাইভ বাস ট্র্যাকিং করতে পারেন। আসন বরাদ্দ ও অপেক্ষাতালিকা শুধুমাত্র পরিবহন পরিদর্শক কর্তৃক পরিচালিত হয়।',
                lang
              )}
            </div>
          </div>
          <span className="badge info" style={{ whiteSpace: 'nowrap' }}>
            {t('Read-Only for Allocations', 'বরাদ্দ পরিবর্তন সীমিত', lang)}
          </span>
        </div>
      ) : (
        <div style={{
          background: 'rgba(212, 175, 55, 0.1)',
          border: '1.5px solid #D4AF37',
          padding: '10px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--brand-slate-900)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} color="#B45309" />
            <div>
              <strong>{t('Transport Supervisor Administration Mode (Md. Kamruzzaman):', 'পরিবহন পরিদর্শক প্রশাসনিক মোড:', lang)}</strong>{' '}
              {t(
                'You have administrative authorization to run automated FIFO allocation batch routines, override seat assignments, and manage conductor door gates.',
                'আপনার কাছে স্বয়ংক্রিয় ফিফো সিট বরাদ্দ ও আসন পুনর্বিন্যাসের প্রশাসনিক ক্ষমতা রয়েছে।',
                lang
              )}
            </div>
          </div>
          <button
            className="btn-gold"
            style={{ fontSize: '11px', padding: '5px 12px', whiteSpace: 'nowrap' }}
            onClick={handleSupervisorAutoFIFO}
          >
            <Sparkles size={13} /> {t('⚡ Run Auto-FIFO Engine', 'স্বয়ংক্রিয় ফিফো রান করুন', lang)}
          </button>
        </div>
      )}

      {/* ─── Unified Sleek Commuter & Fleet Command Bar ─────────────── */}
      <div className="card mb-4" style={{
        background: 'linear-gradient(135deg, #091024 0%, #111D3B 100%)',
        color: '#FFFFFF',
        border: '1px solid #1E293B',
        boxShadow: 'var(--shadow-sm)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1fr', gap: '18px', alignItems: 'center' }}>
          {/* Sub-card 1: My Personal Commute Dossier */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: isMySeatVacated ? 'rgba(212, 175, 55, 0.2)' : 'rgba(225, 29, 72, 0.2)',
                border: isMySeatVacated ? '1.5px solid #D4AF37' : '1.5px solid var(--brand-crimson)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isMySeatVacated ? '#FDE68A' : '#FDA4AF',
                fontWeight: 900,
                fontSize: '15px'
              }}>
                #05
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800 }}>Tanvir Ahmed</span>
                  <span className={`badge ${isMySeatVacated ? 'gold' : 'success'}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                    {isMySeatVacated ? t('Vacated Today', 'আজ ফাঁকা', lang) : t('Confirmed', 'নিশ্চিত', lang)}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  Route-1 · 📍 Farmgate Overbridge (07:18 AM)
                </div>
              </div>
            </div>

            {/* Quick Action for Employee */}
            {isMySeatVacated ? (
              <button
                className="btn-gold"
                style={{ fontSize: '11px', padding: '5px 10px' }}
                onClick={handleReclaimMySeat}
                title="Reclaim Seat #05"
              >
                <UserPlus size={12} /> {t('Reclaim', 'পুনরুদ্ধার', lang)}
              </button>
            ) : (
              <button
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid #D4AF37',
                  color: '#FDE68A',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '5px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => setShowVacateDialog(true)}
                title="Release Seat for Today"
              >
                <UserMinus size={12} /> {t('Release', 'ছেড়ে দিন', lang)}
              </button>
            )}
          </div>

          {/* Sub-card 2: Route Selector & Live Beacon */}
          <div>
            {/* Route Selector Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {Object.values(ROUTES_DATA).map(route => {
                const isSelected = route.id === selectedRouteKey;
                return (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRouteKey(route.id)}
                    style={{
                      background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      border: isSelected ? '1.5px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isSelected ? '#FDE68A' : '#CBD5E1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{route.name.split(':')[0]}</span>
                    {isSelected && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34D399' }} />}
                  </button>
                );
              })}
            </div>

            {/* Live Progress Bar with Next Station */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Navigation size={13} color="#34D399" />
                <span style={{ color: '#94A3B8' }}>{t('Next Station:', 'পরবর্তী স্টপ:', lang)}</span>
                <strong style={{ color: '#FDE047' }}>{activeRoute.nextStop}</strong>
              </div>
              <div style={{ color: '#34D399', fontWeight: 800 }}>
                {activeRoute.speed} · {activeRoute.nextEta.split(' ')[0]} {activeRoute.nextEta.split(' ')[1]}
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
            padding: '10px 14px'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' }}>
                {t('Occupancy Rate', 'আসন দখল', lang)}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#38BDF8' }}>
                {occupiedCount}/{totalSeats} <span style={{ fontSize: '11px', color: '#94A3B8' }}>({fillRate}%)</span>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '12px' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' }}>
                {t('Freed Standby', 'ফাঁকা আসন', lang)}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#D4AF37' }}>
                {vacatedCount} <span style={{ fontSize: '10px', color: '#FDE68A' }}>{t('Seats', 'সিট', lang)}</span>
              </div>
            </div>

            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '12px' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' }}>
                {t('FIFO Waitlist', 'অপেক্ষাতালিকা', lang)}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#A78BFA' }}>
                {waitlist.length} <span style={{ fontSize: '10px', color: '#CBD5E1' }}>{t('Queued', 'জন', lang)}</span>
              </div>
            </div>
          </div>
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
            <div style={{ display: 'flex', gap: '5px' }}>
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

                    // Match active filter
                    const matchesFilter =
                      seatFilter === 'all' ||
                      (seatFilter === 'occupied' && isOccupied) ||
                      (seatFilter === 'vacated' && isVacated) ||
                      (seatFilter === 'mine' && isMine) ||
                      (seatFilter === 'empty' && isEmpty);

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
                          opacity: matchesFilter ? 1 : 0.22,
                          transform: matchesFilter ? undefined : 'scale(0.92)'
                        }}
                        onClick={() => setSelectedSeat(s)}
                        title={`Seat #${s.num} — ${s.assignedTo || 'Empty'} (${s.status})`}
                      >
                        {isVacated && <span className="seat-tag-vacated">FREE</span>}
                        {isMine && <span className="seat-tag-mine">YOU</span>}

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

                        {/* Bottom: Pill or Standby Tag */}
                        {s.isStandbyPromoted ? (
                          <div style={{ fontSize: '6.5px', fontWeight: 800, color: '#059669', background: '#D1FAE5', padding: '0 2px', borderRadius: '2px' }}>
                            STANDBY
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
            <div style={{ marginTop: '14px', display: 'flex', gap: '14px', justifyContent: 'center', fontSize: '11px', flexWrap: 'wrap' }}>
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
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Commuter & FIFO Queue Cockpit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Cockpit Tab Navigation */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '2px solid var(--brand-slate-200)', paddingBottom: '2px' }}>
            <button
              onClick={() => setActiveTab('dossier')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'dossier' ? '3px solid var(--brand-crimson)' : '3px solid transparent',
                padding: '8px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: activeTab === 'dossier' ? 'var(--brand-crimson)' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Award size={14} />
              <span>{t('Seat Dossier', 'আসন বিবরণ', lang)} {selectedSeat ? `#${selectedSeat.num}` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('fifo')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'fifo' ? '3px solid #D4AF37' : '3px solid transparent',
                padding: '8px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: activeTab === 'fifo' ? '#B45309' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Users size={14} />
              <span>{t('FIFO Waitlist', 'ফিফো তালিকা', lang)}</span>
              <span className="badge gold" style={{ fontSize: '9px', padding: '1px 5px' }}>{waitlist.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('route')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'route' ? '3px solid #3B82F6' : '3px solid transparent',
                padding: '8px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: activeTab === 'route' ? '#3B82F6' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Navigation size={14} />
              <span>{t('Route Stops', 'রুট স্টপ', lang)}</span>
            </button>

            <button
              onClick={() => setActiveTab('driver')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'driver' ? '3px solid #10B981' : '3px solid transparent',
                padding: '8px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: activeTab === 'driver' ? '#10B981' : 'var(--brand-slate-600)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Fuel size={14} />
              <span>{t('Vehicle & Crew', 'বাস ও ক্রু', lang)}</span>
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
                      {selectedSeat.assignedTo || t('Unassigned Empty Seat', 'খালি আসন', lang)}
                    </div>
                  </div>
                </div>

                <span className={`badge ${selectedSeat.status === 'vacated' ? 'gold' : selectedSeat.status === 'occupied' ? 'success' : ''}`}>
                  {selectedSeat.status === 'vacated'
                    ? t('Vacated Today', 'আজ ফাঁকা', lang)
                    : selectedSeat.status === 'occupied'
                    ? t('Occupied', 'বরাদ্দকৃত', lang)
                    : t('Empty', 'খালি', lang)}
                </span>
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
                      {selectedSeat.staffId ? `${selectedSeat.staffId} · ` : ''}{selectedSeat.dept || t('Available for permanent or standby shift allocation', 'বরাদ্দযোগ্য', lang)}
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
                    <span style={{ fontWeight: 600 }}>📍 {selectedSeat.pickupPoint || 'General Route Stop'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Scheduled Boarding Time', 'বোর্ডিং সময়', lang)}:</span>
                    <span style={{ fontWeight: 600 }}>⏰ {selectedSeat.pickupTime || '07:18 AM'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Mobile Contact', 'মোবাইল নম্বর', lang)}:</span>
                    <code>{selectedSeat.phone || 'N/A'}</code>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--brand-slate-100)' }}>
                    <span style={{ color: 'var(--brand-slate-500)' }}>{t('Blood Group', 'রক্তের গ্রুপ', lang)}:</span>
                    <span className="badge danger" style={{ fontSize: '10px' }}>{selectedSeat.bloodGroup || 'B+'}</span>
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

                {/* Clear Role Boundary Controls */}
                <div style={{ marginTop: '16px' }}>
                  {/* Case A: Current User's Seat (#5) */}
                  {selectedSeat.num === 5 ? (
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
                      <button className="btn-primary" onClick={() => setShowQrModal(true)}>
                        <QrCode size={14} /> {t('QR Pass', 'কিউআর পাস', lang)}
                      </button>
                    </div>
                  ) : activePerspective === 'staff' ? (
                    /* Case B: Other person's seat in Staff View (Strictly Informational) */
                    <div style={{
                      background: 'var(--brand-slate-50, #F8FAFC)',
                      border: '1px solid var(--brand-slate-200)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '11.5px',
                      color: 'var(--brand-slate-600)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Lock size={15} color="#64748B" />
                      <div>
                        {selectedSeat.status === 'vacated'
                          ? t('This seat is in the standby pool. It will be awarded to #1 on the FIFO queue by the Transport Cell.', 'এই আসনটি ফিফো লাইনের ১ম প্রার্থীকে পরিবহন সেল বরাদ্দ দিবে।', lang)
                          : t('Assigned shift seat. Reallocation can only be performed by the Plant Transport Supervisor.', 'স্থায়ী আসন। এটি পরিবর্তন করার এখতিয়ার শুধুমাত্র পরিবহন পরিদর্শকের।', lang)}
                      </div>
                    </div>
                  ) : (
                    /* Case C: Supervisor View (Full Administrative Control) */
                    <div>
                      {selectedSeat.status === 'vacated' && waitlist.length > 0 ? (
                        <button
                          className="btn-gold"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() => handleSupervisorManualAllocate(waitlist[0], selectedSeat.num)}
                        >
                          ⚡ {t(`Supervisor Action: Assign to #1 ${waitlist[0].name}`, `বরাদ্দ দিন #${waitlist[0].name}-কে`, lang)}
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-outline"
                            style={{ flex: 1, fontSize: '11px', justifyContent: 'center' }}
                            onClick={() => showToast(t(`Calling passenger ${selectedSeat.assignedTo}...`, 'কল করা হচ্ছে...', lang), 'info')}
                          >
                            <Phone size={13} /> {t('Call Passenger', 'কল করুন', lang)}
                          </button>
                          <button
                            className="btn-outline"
                            style={{ flex: 1, fontSize: '11px', justifyContent: 'center' }}
                            onClick={() => showToast(t(`SMS boarding pass sent to ${selectedSeat.phone}`, 'এসএমএস পাঠানো হয়েছে', lang), 'info')}
                          >
                            <Share2 size={13} /> {t('Send SMS', 'এসএমএস', lang)}
                          </button>
                        </div>
                      )}
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
                      {t('Route Corridor Stations & Live Geofence', 'রুট স্টেশন ও জিওফেন্স ট্র্যাকিং', lang)}
                    </div>
                    <div className="card-subtitle">
                      {activeRoute.stops.length} {t('Designated commuter stops', 'নির্ধারিত বোর্ডিং স্টেশন', lang)}
                    </div>
                  </div>
                </div>

                <span className="badge info">{activeRoute.speed} Active</span>
              </div>

              <div className="card-body">
                <div className="route-stop-timeline">
                  {activeRoute.stops.map(stop => {
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
                      {t('Vehicle Mechanical Health & Crew', 'গাড়ির ফিটনেস ও ক্রু প্রোফাইল', lang)}
                    </div>
                    <div className="card-subtitle">
                      {activeRoute.coachNo} · {activeRoute.model}
                    </div>
                  </div>
                </div>
                <span className="badge success">{t('BRTA Fitness Passed', 'ফিটনেস ক্লিয়ার', lang)}</span>
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
        </div>
      </div>

      {/* ─── MODAL 1: Voluntary Seat Release Dialog ─────────────────── */}
      {showVacateDialog && (
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
        </div>
      )}

      {/* ─── MODAL 2: Request Standby Seat (Join FIFO Waitlist) ──────── */}
      {showJoinModal && (
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
                    {activeRoute.stops.map(s => (
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
                    <strong style={{ color: vacatedCount > 0 ? '#10B981' : '#EF4444' }}>{vacatedCount} {t('seats', 'আসন', lang)}</strong>
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
        </div>
      )}

      {/* ─── MODAL 3: Digital QR Boarding Pass ──────────────────────── */}
      {showQrModal && (
        <div className="app-modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon">
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('Digital Boarding Pass', 'ডিজিটাল বোর্ডিং পাস', lang)}</h3>
                  <div className="app-modal-subtitle">{activeRoute.coachNo} · Route-1</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowQrModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
              <div style={{
                background: '#FFFFFF',
                border: '2px solid var(--brand-slate-200)',
                borderRadius: '16px',
                padding: '16px',
                display: 'inline-block',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                marginBottom: '16px'
              }}>
                <QrCode size={160} color="#0F172A" />
                <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', marginTop: '6px', color: 'var(--brand-slate-600)' }}>
                  BOGCL-COMMUTE-1042-S5
                </div>
              </div>

              <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--brand-slate-900)' }}>
                Tanvir Ahmed
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--brand-crimson)', fontWeight: 800 }}>
                SEAT #05 · PERMANENT SHIFT PASS
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                Sales & Distribution Division · ID: EMP-1042
              </div>

              <div style={{
                background: 'var(--brand-slate-50, #F8FAFC)',
                border: '1px solid var(--brand-slate-200)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginTop: '16px',
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
                  <span style={{ color: '#0284C7', fontWeight: 700 }}>Farmgate Overbridge (07:18 AM)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Security Seal:</span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>✓ GPS Clearance Validated</span>
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
        </div>
      )}

      {/* ─── MODAL 4: Shift Timetable Manifest ──────────────────────── */}
      {showTimetableModal && (
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
        </div>
      )}

      {/* ─── MODAL 5: Conductor Entrance Gate Scanner (Supervisor Only) ─ */}
      {showScannerModal && (
        <div className="app-modal-overlay" onClick={() => setShowScannerModal(false)}>
          <div className="app-modal-dialog" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
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
                padding: '20px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '76px',
                  height: '76px',
                  margin: '0 auto 10px',
                  border: '2px dashed #38BDF8',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <QrCode size={38} color="#38BDF8" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>
                  {t('Conductor Optical Reader Ready', 'অপটিক্যাল রিডার স্ক্যান করতে প্রস্তুত', lang)}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  {activeRoute.conductorName} · {activeRoute.coachNo}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
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
                    showToast(t('Tanvir Ahmed (Seat #05) verified and boarded!', 'তানভীর আহমেদ (সিট #০৫) বোর্ডিং যাচাই সম্পন্ন!', lang), 'gold');
                  }}
                >
                  <UserCheck size={14} /> {t('Verify', 'যাচাই', lang)}
                </button>
              </div>
            </div>

            <div className="app-modal-footer">
              <button className="btn-outline" onClick={() => setShowScannerModal(false)}>
                {t('Close Scanner', 'স্ক্যানার বন্ধ করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
