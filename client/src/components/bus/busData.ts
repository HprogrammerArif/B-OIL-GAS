import { BusVehicle, RouteInfo, Seat } from './busTypes';

export const INITIAL_BUSES: BusVehicle[] = [
  {
    id: 'bus-1',
    coachNo: 'DHAKA METRO-BA 15-4421',
    model: 'Hino RM2 Luxury AC (52-Seater)',
    capacity: 52,
    assignedRouteId: 'route-1',
    driverName: 'Master Rafiqul Islam',
    driverPhone: '+880 1712-334499',
    conductorName: 'Jalal Uddin Mia',
    conductorPhone: '+880 1819-223344',
    status: 'active',
    fuelLevel: '88%',
    fitnessExpiry: '14 Dec 2027',
    acType: 'Luxury AC',
    gpsTrackerId: 'GPS-BOGCL-01'
  },
  {
    id: 'bus-2',
    coachNo: 'DHAKA METRO-BA 14-8832',
    model: 'Scania Touring HD (52-Seater)',
    capacity: 52,
    assignedRouteId: 'route-2',
    driverName: 'Kabir Hossain',
    driverPhone: '+880 1715-998811',
    conductorName: 'Shumon Ali',
    conductorPhone: '+880 1822-445566',
    status: 'active',
    fuelLevel: '75%',
    fitnessExpiry: '02 Mar 2028',
    acType: 'Luxury AC',
    gpsTrackerId: 'GPS-BOGCL-02'
  },
  {
    id: 'bus-3',
    coachNo: 'DHAKA METRO-BA 16-1109',
    model: 'Hyundai Universe Express (52-Seater)',
    capacity: 52,
    assignedRouteId: 'route-3',
    driverName: 'Alamgir Hossain',
    driverPhone: '+880 1718-223388',
    conductorName: 'Mintu Sarker',
    conductorPhone: '+880 1914-778899',
    status: 'active',
    fuelLevel: '92%',
    fitnessExpiry: '19 Aug 2027',
    acType: 'Luxury AC',
    gpsTrackerId: 'GPS-BOGCL-03'
  },
  {
    id: 'bus-4',
    coachNo: 'DHAKA METRO-BA 13-9021',
    model: 'Ashok Leyland Falcon Intercity (52-Seater)',
    capacity: 52,
    assignedRouteId: 'route-4',
    driverName: 'Selim Reza',
    driverPhone: '+880 1711-447700',
    conductorName: 'Nasir Uddin',
    conductorPhone: '+880 1813-665544',
    status: 'active',
    fuelLevel: '68%',
    fitnessExpiry: '11 Nov 2027',
    acType: 'Executive AC',
    gpsTrackerId: 'GPS-BOGCL-04'
  },
  {
    id: 'bus-5',
    coachNo: 'DHAKA METRO-BA 11-5060',
    model: 'Volvo B11R Intercity Cruiser (52-Seater)',
    capacity: 52,
    assignedRouteId: 'route-5',
    driverName: 'Jahangir Hossain',
    driverPhone: '+880 1713-556677',
    conductorName: 'Rashedul Karim',
    conductorPhone: '+880 1815-990011',
    status: 'active',
    fuelLevel: '82%',
    fitnessExpiry: '25 Jan 2028',
    acType: 'Luxury AC',
    gpsTrackerId: 'GPS-BOGCL-05'
  },
  {
    id: 'bus-6',
    coachNo: 'DHAKA METRO-BA 12-7014',
    model: 'Isuzu LT434 Heavy Duty Bus (52-Seater)',
    capacity: 52,
    assignedRouteId: 'route-6',
    driverName: 'Enamul Haque',
    driverPhone: '+880 1716-112244',
    conductorName: 'Faridul Islam',
    conductorPhone: '+880 1817-334466',
    status: 'active',
    fuelLevel: '78%',
    fitnessExpiry: '14 May 2027',
    acType: 'Executive AC',
    gpsTrackerId: 'GPS-BOGCL-06'
  },
  {
    id: 'bus-7',
    coachNo: 'DHAKA METRO-BA 15-9920',
    model: 'Hino RM2 Fleet Liner (52-Seater)',
    capacity: 52,
    assignedRouteId: 'route-7',
    driverName: 'Nurul Islam',
    driverPhone: '+880 1719-889900',
    conductorName: 'Harun Or Rashid',
    conductorPhone: '+880 1818-445577',
    status: 'active',
    fuelLevel: '95%',
    fitnessExpiry: '30 Sep 2028',
    acType: 'Luxury AC',
    gpsTrackerId: 'GPS-BOGCL-07'
  },
  {
    id: 'bus-8',
    coachNo: 'DHAKA METRO-BA 18-3011',
    model: 'Ashok Leyland 12M Air-Suspension (52-Seater)',
    capacity: 52,
    assignedRouteId: 'route-8',
    driverName: 'Mofizur Rahman',
    driverPhone: '+880 1722-334455',
    conductorName: 'Shakil Ahmed',
    conductorPhone: '+880 1824-556688',
    status: 'active',
    fuelLevel: '70%',
    fitnessExpiry: '18 Jul 2027',
    acType: 'Standard AC',
    gpsTrackerId: 'GPS-BOGCL-08'
  },
  {
    id: 'bus-9',
    coachNo: 'DHAKA METRO-BA 19-4450',
    model: 'Mitsubishi Fuso Feeder Coach (40-Seater)',
    capacity: 40,
    assignedRouteId: 'route-9',
    driverName: 'Delwar Hossain',
    driverPhone: '+880 1725-667788',
    conductorName: 'Tariqul Islam',
    conductorPhone: '+880 1826-778800',
    status: 'active',
    fuelLevel: '80%',
    fitnessExpiry: '09 Oct 2027',
    acType: 'Standard AC',
    gpsTrackerId: 'GPS-BOGCL-09'
  },
  {
    id: 'bus-10',
    coachNo: 'DHAKA METRO-BA 20-6677',
    model: 'Mercedes-Benz Tourismo C-Suite VIP Shuttle (32-Seater)',
    capacity: 32,
    assignedRouteId: 'route-10',
    driverName: 'Shahidul Alam',
    driverPhone: '+880 1711-224466',
    conductorName: 'Golam Kibria',
    conductorPhone: '+880 1811-998800',
    status: 'active',
    fuelLevel: '98%',
    fitnessExpiry: '12 Jan 2029',
    acType: 'Executive AC',
    gpsTrackerId: 'GPS-BOGCL-10'
  }
];

export const INITIAL_ROUTES: Record<string, RouteInfo> = {
  'route-1': {
    id: 'route-1',
    name: 'Route-1: Mirpur-10 ➔ Farmgate ➔ Shahbagh ➔ Babubazar ➔ Plant',
    nameBn: 'রুট-১: মিরপুর-১০ ➔ ফার্মগেট ➔ শাহবাগ ➔ বাবুবাজার ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 15-4421',
    busId: 'bus-1',
    model: 'Hino RM2 Luxury AC (52-Seater)',
    corridorRoad: 'Mirpur Road ➔ Kazi Nazrul Islam Ave ➔ Babubazar 2nd Bridge ➔ Keraniganj Link',
    driverName: 'Master Rafiqul Islam',
    driverPhone: '+880 1712-334499',
    conductorName: 'Jalal Uddin Mia',
    conductorPhone: '+880 1819-223344',
    speed: '42 km/h',
    nextStop: 'Babubazar Bridge Overpass',
    nextEta: '8 mins (07:38 AM)',
    progressPercent: 70,
    capacity: 52,
    inboundStartTime: '06:45 AM',
    outboundStartTime: '05:15 PM',
    inboundStops: [
      { id: 's1', name: 'Mirpur-10 Circle', nameBn: 'মিরপুর-১০ গোলচত্বর', scheduledTime: '06:45 AM', passengers: 12, status: 'passed', distanceKm: '0.0 km', landmark: 'Near Metro Station Pillar #184' },
      { id: 's2', name: 'Agargaon Metro Gate', nameBn: 'আগারগাঁও মেট্রো গেট', scheduledTime: '07:00 AM', passengers: 8, status: 'passed', distanceKm: '4.2 km', landmark: 'Passport Office Gate' },
      { id: 's3', name: 'Farmgate Overbridge', nameBn: 'ফার্মগেট ওভারব্রিজ', scheduledTime: '07:18 AM', passengers: 14, status: 'passed', distanceKm: '8.5 km', landmark: 'Ananda Cinema Hall Opposite' },
      { id: 's4', name: 'Shahbagh Square', nameBn: 'শাহবাগ চত্বর', scheduledTime: '07:30 AM', passengers: 9, status: 'active', distanceKm: '12.0 km', landmark: 'National Museum Bus Bay' },
      { id: 's5', name: 'Babubazar Bridge', nameBn: 'বাবুবাজার ব্রিজ', scheduledTime: '07:42 AM', passengers: 6, status: 'upcoming', distanceKm: '16.5 km', landmark: 'Toll Plaza South' },
      { id: 's6', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:00 AM', passengers: 0, status: 'upcoming', distanceKm: '22.8 km', landmark: 'BOGCL Security Main Gate' },
    ],
    outboundStops: [
      { id: 's101', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '05:15 PM', passengers: 49, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's102', name: 'Babubazar Bridge Ramp', nameBn: 'বাবুবাজার ব্রিজ র‍্যাম্প', scheduledTime: '05:35 PM', passengers: 6, status: 'upcoming', distanceKm: '6.3 km' },
      { id: 's103', name: 'Shahbagh Square', nameBn: 'শাহবাগ চত্বর', scheduledTime: '05:50 PM', passengers: 9, status: 'upcoming', distanceKm: '10.8 km' },
      { id: 's104', name: 'Farmgate Overbridge', nameBn: 'ফার্মগেট ওভারব্রিজ', scheduledTime: '06:05 PM', passengers: 14, status: 'upcoming', distanceKm: '14.3 km' },
      { id: 's105', name: 'Agargaon Metro Gate', nameBn: 'আগারগাঁও মেট্রো গেট', scheduledTime: '06:18 PM', passengers: 8, status: 'upcoming', distanceKm: '18.6 km' },
      { id: 's106', name: 'Mirpur-10 Circle', nameBn: 'মিরপুর-১০ গোলচত্বর', scheduledTime: '06:35 PM', passengers: 12, status: 'upcoming', distanceKm: '22.8 km' },
    ]
  },
  'route-2': {
    id: 'route-2',
    name: 'Route-2: Uttara-Azampur ➔ Airport ➔ Mohakhali ➔ Maghbazar ➔ Plant',
    nameBn: 'রুট-২: উত্তরা-আজমপুর ➔ বিমানবন্দর ➔ মহাখালী ➔ মগবাজার ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 14-8832',
    busId: 'bus-2',
    model: 'Scania Touring HD (52-Seater)',
    corridorRoad: 'Dhaka-Mymensingh Hwy ➔ Mohakhali Flyover ➔ Maghbazar ➔ Buriganga Bridge ➔ Plant',
    driverName: 'Kabir Hossain',
    driverPhone: '+880 1715-998811',
    conductorName: 'Shumon Ali',
    conductorPhone: '+880 1822-445566',
    speed: '38 km/h',
    nextStop: 'Mohakhali Flyover North',
    nextEta: '12 mins (07:40 AM)',
    progressPercent: 48,
    capacity: 52,
    inboundStartTime: '06:30 AM',
    outboundStartTime: '05:15 PM',
    inboundStops: [
      { id: 's21', name: 'Uttara House Building', nameBn: 'উত্তরা হাউস বিল্ডিং', scheduledTime: '06:30 AM', passengers: 15, status: 'passed', distanceKm: '0.0 km', landmark: 'Mascot Plaza Front' },
      { id: 's22', name: 'Airport Station', nameBn: 'বিমানবন্দর রেলওয়ে স্টেশন', scheduledTime: '06:45 AM', passengers: 10, status: 'passed', distanceKm: '5.1 km', landmark: 'Pedestrian Underpass' },
      { id: 's23', name: 'Mohakhali Flyover', nameBn: 'মহাখালী ফ্লাইওভার', scheduledTime: '07:15 AM', passengers: 14, status: 'active', distanceKm: '14.2 km', landmark: 'Amtoli Bus Stand' },
      { id: 's24', name: 'Maghbazar Crossing', nameBn: 'মগবাজার ক্রসিং', scheduledTime: '07:32 AM', passengers: 8, status: 'upcoming', distanceKm: '18.7 km', landmark: 'Wireless Gate' },
      { id: 's25', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:05 AM', passengers: 0, status: 'upcoming', distanceKm: '28.4 km', landmark: 'Refinery Main Entrance' },
    ],
    outboundStops: [
      { id: 's201', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '05:15 PM', passengers: 47, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's202', name: 'Maghbazar Crossing', nameBn: 'মগবাজার ক্রসিং', scheduledTime: '05:45 PM', passengers: 8, status: 'upcoming', distanceKm: '9.7 km' },
      { id: 's203', name: 'Mohakhali Flyover', nameBn: 'মহাখালী ফ্লাইওভার', scheduledTime: '06:05 PM', passengers: 14, status: 'upcoming', distanceKm: '14.2 km' },
      { id: 's204', name: 'Airport Station', nameBn: 'বিমানবন্দর রেলওয়ে স্টেশন', scheduledTime: '06:25 PM', passengers: 10, status: 'upcoming', distanceKm: '23.3 km' },
      { id: 's205', name: 'Uttara House Building', nameBn: 'উত্তরা হাউস বিল্ডিং', scheduledTime: '06:45 PM', passengers: 15, status: 'upcoming', distanceKm: '28.4 km' },
    ]
  },
  'route-3': {
    id: 'route-3',
    name: 'Route-3: Narayanganj-Chashara ➔ Signboard ➔ Jatrabari ➔ Postogola ➔ Plant',
    nameBn: 'রুট-৩: নারায়ণগঞ্জ-চাষাড়া ➔ সাইনবোর্ড ➔ যাত্রাবাড়ী ➔ পোস্টগোলা ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 16-1109',
    busId: 'bus-3',
    model: 'Hyundai Universe Express (52-Seater)',
    corridorRoad: 'Dhaka-Narayanganj Link Rd ➔ Mayor Hanif Flyover ➔ Postogola Toll ➔ Keraniganj Complex',
    driverName: 'Alamgir Hossain',
    driverPhone: '+880 1718-223388',
    conductorName: 'Mintu Sarker',
    conductorPhone: '+880 1914-778899',
    speed: '45 km/h',
    nextStop: 'Postogola Toll Plaza',
    nextEta: '6 mins (07:35 AM)',
    progressPercent: 78,
    capacity: 52,
    inboundStartTime: '06:50 AM',
    outboundStartTime: '05:15 PM',
    inboundStops: [
      { id: 's31', name: 'Chashara Terminal', nameBn: 'চাষাড়া টার্মিনাল', scheduledTime: '06:50 AM', passengers: 18, status: 'passed', distanceKm: '0.0 km', landmark: 'Railway Station Roundabout' },
      { id: 's32', name: 'Signboard Link Road', nameBn: 'সাইনবোর্ড লিংক রোড', scheduledTime: '07:08 AM', passengers: 12, status: 'passed', distanceKm: '7.8 km', landmark: 'Proshika Crossing' },
      { id: 's33', name: 'Jatrabari Flyover Ramp', nameBn: 'যাত্রাবাড়ী ফ্লাইওভার র‍্যাম্প', scheduledTime: '07:22 AM', passengers: 11, status: 'passed', distanceKm: '13.5 km', landmark: 'Kutubkhali Toll Booth' },
      { id: 's34', name: 'Postogola Bridge', nameBn: 'পোস্তগোলা ব্রিজ', scheduledTime: '07:34 AM', passengers: 7, status: 'active', distanceKm: '17.2 km', landmark: 'Buriganga 1st Bridge Toll' },
      { id: 's35', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '07:55 AM', passengers: 0, status: 'upcoming', distanceKm: '24.0 km', landmark: 'Terminal Gate-1' },
    ],
    outboundStops: [
      { id: 's301', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '05:15 PM', passengers: 48, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's302', name: 'Postogola Bridge', nameBn: 'পোস্তগোলা ব্রিজ', scheduledTime: '05:32 PM', passengers: 7, status: 'upcoming', distanceKm: '6.8 km' },
      { id: 's303', name: 'Jatrabari Flyover Ramp', nameBn: 'যাত্রাবাড়ী ফ্লাইওভার র‍্যাম্প', scheduledTime: '05:48 PM', passengers: 11, status: 'upcoming', distanceKm: '10.5 km' },
      { id: 's304', name: 'Signboard Link Road', nameBn: 'সাইনবোর্ড লিংক রোড', scheduledTime: '06:05 PM', passengers: 12, status: 'upcoming', distanceKm: '16.2 km' },
      { id: 's305', name: 'Chashara Terminal', nameBn: 'চাষাড়া টার্মিনাল', scheduledTime: '06:25 PM', passengers: 18, status: 'upcoming', distanceKm: '24.0 km' },
    ]
  },
  'route-4': {
    id: 'route-4',
    name: 'Route-4: Dhanmondi-27 ➔ Science Lab ➔ New Market ➔ Azimpur ➔ Plant',
    nameBn: 'রুট-৪: ধানমন্ডি-২৭ ➔ সায়েন্স ল্যাব ➔ নিউ মার্কেট ➔ আজিমপুর ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 13-9021',
    busId: 'bus-4',
    model: 'Ashok Leyland Falcon Intercity (52-Seater)',
    corridorRoad: 'Shatmasjid Road ➔ Mirpur Road ➔ Azimpur ➔ Lalbagh ➔ Babubazar ➔ Plant',
    driverName: 'Selim Reza',
    driverPhone: '+880 1711-447700',
    conductorName: 'Nasir Uddin',
    conductorPhone: '+880 1813-665544',
    speed: '32 km/h',
    nextStop: 'New Market Overbridge',
    nextEta: '9 mins (07:37 AM)',
    progressPercent: 62,
    capacity: 52,
    inboundStartTime: '06:55 AM',
    outboundStartTime: '05:15 PM',
    inboundStops: [
      { id: 's41', name: 'Dhanmondi-27 (Shatmasjid Rd)', nameBn: 'ধানমন্ডি-২৭ (সাতমসজিদ রোড)', scheduledTime: '06:55 AM', passengers: 14, status: 'passed', distanceKm: '0.0 km', landmark: 'Rapa Plaza Corner' },
      { id: 's42', name: 'Science Laboratory', nameBn: 'সায়েন্স ল্যাবরেটরি', scheduledTime: '07:12 AM', passengers: 11, status: 'passed', distanceKm: '3.6 km', landmark: 'BCSIR Gate' },
      { id: 's43', name: 'New Market Footbridge', nameBn: 'নিউ মার্কেট ফুটওভারব্রিজ', scheduledTime: '07:25 AM', passengers: 13, status: 'active', distanceKm: '5.9 km', landmark: 'Gate-4 Main Road' },
      { id: 's44', name: 'Azimpur Maternity Gate', nameBn: 'আজিমপুর মাতৃসদন গেট', scheduledTime: '07:36 AM', passengers: 8, status: 'upcoming', distanceKm: '7.8 km', landmark: 'Old Bus Stand' },
      { id: 's45', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:00 AM', passengers: 0, status: 'upcoming', distanceKm: '16.5 km', landmark: 'Main Admin Building' },
    ],
    outboundStops: [
      { id: 's401', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '05:15 PM', passengers: 46, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's402', name: 'Azimpur Maternity Gate', nameBn: 'আজিমপুর মাতৃসদন গেট', scheduledTime: '05:38 PM', passengers: 8, status: 'upcoming', distanceKm: '8.7 km' },
      { id: 's403', name: 'New Market Footbridge', nameBn: 'নিউ মার্কেট ফুটওভারব্রিজ', scheduledTime: '05:50 PM', passengers: 13, status: 'upcoming', distanceKm: '10.6 km' },
      { id: 's404', name: 'Science Laboratory', nameBn: 'সায়েন্স ল্যাবরেটরি', scheduledTime: '06:05 PM', passengers: 11, status: 'upcoming', distanceKm: '12.9 km' },
      { id: 's405', name: 'Dhanmondi-27 (Shatmasjid Rd)', nameBn: 'ধানমন্ডি-২৭ (সাতমসজিদ রোড)', scheduledTime: '06:25 PM', passengers: 14, status: 'upcoming', distanceKm: '16.5 km' },
    ]
  },
  'route-5': {
    id: 'route-5',
    name: 'Route-5: Gazipur Chowrasta ➔ Board Bazar ➔ Tongi ➔ Airport ➔ Plant',
    nameBn: 'রুট-৫: গাজীপুর চৌরাস্তা ➔ বোর্ড বাজার ➔ টঙ্গী ➔ বিমানবন্দর ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 11-5060',
    busId: 'bus-5',
    model: 'Volvo B11R Intercity Cruiser (52-Seater)',
    corridorRoad: 'Dhaka-Mymensingh BRT Expressway ➔ Tongi Bridge ➔ Mohakhali ➔ Babubazar ➔ Plant',
    driverName: 'Jahangir Hossain',
    driverPhone: '+880 1713-556677',
    conductorName: 'Rashedul Karim',
    conductorPhone: '+880 1815-990011',
    speed: '48 km/h',
    nextStop: 'Tongi Bridge South Ramp',
    nextEta: '10 mins (07:35 AM)',
    progressPercent: 55,
    capacity: 52,
    inboundStartTime: '06:15 AM',
    outboundStartTime: '05:15 PM',
    inboundStops: [
      { id: 's51', name: 'Gazipur Chowrasta', nameBn: 'গাজীপুর চৌরাস্তা', scheduledTime: '06:15 AM', passengers: 16, status: 'passed', distanceKm: '0.0 km', landmark: 'BRT Terminal Station' },
      { id: 's52', name: 'Board Bazar Open Bus Bay', nameBn: 'বোর্ড বাজার বাস বে', scheduledTime: '06:35 AM', passengers: 12, status: 'passed', distanceKm: '8.4 km', landmark: 'Open University Gate' },
      { id: 's53', name: 'Tongi Station Road', nameBn: 'টঙ্গী স্টেশন রোড', scheduledTime: '07:05 AM', passengers: 14, status: 'active', distanceKm: '17.2 km', landmark: 'Mill Gate Overpass' },
      { id: 's54', name: 'Airport Terminal 3 Node', nameBn: 'বিমানবন্দর ৩য় টার্মিনাল', scheduledTime: '07:28 AM', passengers: 8, status: 'upcoming', distanceKm: '23.8 km', landmark: 'Civil Aviation Entry' },
      { id: 's55', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:15 AM', passengers: 0, status: 'upcoming', distanceKm: '41.5 km', landmark: 'Refinery South Gate' },
    ],
    outboundStops: [
      { id: 's501', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '05:15 PM', passengers: 50, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's502', name: 'Airport Terminal 3 Node', nameBn: 'বিমানবন্দর ৩য় টার্মিনাল', scheduledTime: '06:05 PM', passengers: 8, status: 'upcoming', distanceKm: '17.7 km' },
      { id: 's503', name: 'Tongi Station Road', nameBn: 'টঙ্গী স্টেশন রোড', scheduledTime: '06:28 PM', passengers: 14, status: 'upcoming', distanceKm: '24.3 km' },
      { id: 's504', name: 'Board Bazar Open Bus Bay', nameBn: 'বোর্ড বাজার বাস বে', scheduledTime: '06:55 PM', passengers: 12, status: 'upcoming', distanceKm: '33.1 km' },
      { id: 's505', name: 'Gazipur Chowrasta', nameBn: 'গাজীপুর চৌরাস্তা', scheduledTime: '07:20 PM', passengers: 16, status: 'upcoming', distanceKm: '41.5 km' },
    ]
  },
  'route-6': {
    id: 'route-6',
    name: 'Route-6: Savar Bus Stand ➔ Hemayetpur ➔ Gabtoli ➔ Mohammadpur ➔ Plant',
    nameBn: 'রুট-৬: সাভার বাস স্ট্যান্ড ➔ হেমায়েতপুর ➔ গাবতলী ➔ মোহাম্মদপুর ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 12-7014',
    busId: 'bus-6',
    model: 'Isuzu LT434 Heavy Duty Bus (52-Seater)',
    corridorRoad: 'Dhaka-Aricha Hwy ➔ Gabtoli Interdistrict ➔ Ring Road ➔ Beribadh Expressway ➔ Plant',
    driverName: 'Enamul Haque',
    driverPhone: '+880 1716-112244',
    conductorName: 'Faridul Islam',
    conductorPhone: '+880 1817-334466',
    speed: '44 km/h',
    nextStop: 'Gabtoli Interdistrict Bridge',
    nextEta: '7 mins (07:32 AM)',
    progressPercent: 65,
    capacity: 52,
    inboundStartTime: '06:30 AM',
    outboundStartTime: '05:15 PM',
    inboundStops: [
      { id: 's61', name: 'Savar Bazar Bus Stand', nameBn: 'সাভার বাজার বাস স্ট্যান্ড', scheduledTime: '06:30 AM', passengers: 17, status: 'passed', distanceKm: '0.0 km', landmark: 'Thana Bus Stand' },
      { id: 's62', name: 'Hemayetpur Link Crossing', nameBn: 'হেমায়েতপুর লিংক ক্রসিং', scheduledTime: '06:50 AM', passengers: 11, status: 'passed', distanceKm: '6.5 km', landmark: 'Tannery Industrial Turn' },
      { id: 's63', name: 'Gabtoli Interdistrict Terminal', nameBn: 'গাবতলী টার্মিনাল', scheduledTime: '07:15 AM', passengers: 13, status: 'active', distanceKm: '15.8 km', landmark: 'Amin Bazar Bridge Foot' },
      { id: 's64', name: 'Mohammadpur Town Hall', nameBn: 'মোহাম্মদপুর টাউন হল', scheduledTime: '07:35 AM', passengers: 9, status: 'upcoming', distanceKm: '20.2 km', landmark: 'Kazi Nazrul Islam Road' },
      { id: 's65', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:00 AM', passengers: 0, status: 'upcoming', distanceKm: '29.0 km', landmark: 'Heavy Transport Yard' },
    ],
    outboundStops: [
      { id: 's601', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '05:15 PM', passengers: 50, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's602', name: 'Mohammadpur Town Hall', nameBn: 'মোহাম্মদপুর টাউন হল', scheduledTime: '05:42 PM', passengers: 9, status: 'upcoming', distanceKm: '8.8 km' },
      { id: 's603', name: 'Gabtoli Interdistrict Terminal', nameBn: 'গাবতলী টার্মিনাল', scheduledTime: '06:05 PM', passengers: 13, status: 'upcoming', distanceKm: '13.2 km' },
      { id: 's604', name: 'Hemayetpur Link Crossing', nameBn: 'হেমায়েতপুর লিংক ক্রসিং', scheduledTime: '06:30 PM', passengers: 11, status: 'upcoming', distanceKm: '22.5 km' },
      { id: 's605', name: 'Savar Bazar Bus Stand', nameBn: 'সাভার বাজার বাস স্ট্যান্ড', scheduledTime: '06:55 PM', passengers: 17, status: 'upcoming', distanceKm: '29.0 km' },
    ]
  },
  'route-7': {
    id: 'route-7',
    name: 'Route-7: Bashundhara R/A Corporate HQ ➔ Kuril ➔ Badda ➔ Rampura ➔ Plant',
    nameBn: 'রুট-৭: বসুন্ধরা আ/এ করপোরেট হেডকোয়ার্টার ➔ কুড়িল ➔ বাড্ডা ➔ রামপুরা ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 15-9920',
    busId: 'bus-7',
    model: 'Hino RM2 Fleet Liner (52-Seater)',
    corridorRoad: 'Madani Ave ➔ Pragati Sarani ➔ DIT Road ➔ Babubazar Bridge ➔ Keraniganj Plant',
    driverName: 'Nurul Islam',
    driverPhone: '+880 1719-889900',
    conductorName: 'Harun Or Rashid',
    conductorPhone: '+880 1818-445577',
    speed: '40 km/h',
    nextStop: 'Rampura Bridge Overpass',
    nextEta: '8 mins (07:36 AM)',
    progressPercent: 60,
    capacity: 52,
    inboundStartTime: '06:45 AM',
    outboundStartTime: '05:15 PM',
    inboundStops: [
      { id: 's71', name: 'Bashundhara Corporate HQ Gate-1', nameBn: 'বসুন্ধরা করপোরেট হেডকোয়ার্টার গেট-১', scheduledTime: '06:45 AM', passengers: 19, status: 'passed', distanceKm: '0.0 km', landmark: 'Plot-3 Block-G HQ Front' },
      { id: 's72', name: 'Kuril Flyover North Loop', nameBn: 'কুড়িল ফ্লাইওভার নর্থ লুপ', scheduledTime: '07:00 AM', passengers: 11, status: 'passed', distanceKm: '3.8 km', landmark: 'World University Bay' },
      { id: 's73', name: 'Badda Link Road Crossing', nameBn: 'বাড্ডা লিংক রোড', scheduledTime: '07:18 AM', passengers: 10, status: 'active', distanceKm: '7.9 km', landmark: 'Merul Badda Turn' },
      { id: 's74', name: 'Rampura TV Centre', nameBn: 'রামপুরা টিভি সেন্টার', scheduledTime: '07:35 AM', passengers: 8, status: 'upcoming', distanceKm: '11.5 km', landmark: 'BTV Gate Footover' },
      { id: 's75', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:05 AM', passengers: 0, status: 'upcoming', distanceKm: '25.2 km', landmark: 'Refinery South Bay' },
    ],
    outboundStops: [
      { id: 's701', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '05:15 PM', passengers: 48, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's702', name: 'Rampura TV Centre', nameBn: 'রামপুরা টিভি সেন্টার', scheduledTime: '05:45 PM', passengers: 8, status: 'upcoming', distanceKm: '13.7 km' },
      { id: 's703', name: 'Badda Link Road Crossing', nameBn: 'বাড্ডা লিংক রোড', scheduledTime: '06:02 PM', passengers: 10, status: 'upcoming', distanceKm: '17.3 km' },
      { id: 's704', name: 'Kuril Flyover North Loop', nameBn: 'কুড়িল ফ্লাইওভার নর্থ লুপ', scheduledTime: '06:22 PM', passengers: 11, status: 'upcoming', distanceKm: '21.4 km' },
      { id: 's705', name: 'Bashundhara Corporate HQ Gate-1', nameBn: 'বসুন্ধরা করপোরেট হেডকোয়ার্টার গেট-১', scheduledTime: '06:40 PM', passengers: 19, status: 'upcoming', distanceKm: '25.2 km' },
    ]
  },
  'route-8': {
    id: 'route-8',
    name: 'Route-8: Kanchpur Bridge ➔ Demra Staff Quarter ➔ Sayedabad ➔ Dayaganj ➔ Plant',
    nameBn: 'রুট-৮: কাঁচপুর ব্রিজ ➔ ডেমরা স্টাফ কোয়ার্টার ➔ সায়েদাবাদ ➔ দয়াগঞ্জ ➔ প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 18-3011',
    busId: 'bus-8',
    model: 'Ashok Leyland 12M Air-Suspension (52-Seater)',
    corridorRoad: 'Dhaka-Chattogram Hwy ➔ Demra Express ➔ Sayedabad ➔ Postogola Toll ➔ Plant',
    driverName: 'Mofizur Rahman',
    driverPhone: '+880 1722-334455',
    conductorName: 'Shakil Ahmed',
    conductorPhone: '+880 1824-556688',
    speed: '43 km/h',
    nextStop: 'Sayedabad Terminal Hub',
    nextEta: '11 mins (07:38 AM)',
    progressPercent: 58,
    capacity: 52,
    inboundStartTime: '06:40 AM',
    outboundStartTime: '05:15 PM',
    inboundStops: [
      { id: 's81', name: 'Kanchpur Bridge Toll Foot', nameBn: 'কাঁচপুর ব্রিজ টোল ফুট', scheduledTime: '06:40 AM', passengers: 15, status: 'passed', distanceKm: '0.0 km', landmark: 'Highway Patrol Post' },
      { id: 's82', name: 'Demra Staff Quarter Turn', nameBn: 'ডেমরা স্টাফ কোয়ার্টার', scheduledTime: '07:00 AM', passengers: 12, status: 'passed', distanceKm: '6.8 km', landmark: 'Demra Ghat Road' },
      { id: 's83', name: 'Sayedabad Terminal Overpass', nameBn: 'সায়েদাবাদ টার্মিনাল', scheduledTime: '07:25 AM', passengers: 14, status: 'active', distanceKm: '14.2 km', landmark: 'Janapath Crossing' },
      { id: 's84', name: 'Dayaganj Circle', nameBn: 'দয়াগঞ্জ মোড়', scheduledTime: '07:38 AM', passengers: 7, status: 'upcoming', distanceKm: '17.0 km', landmark: 'Gandaria Station Turning' },
      { id: 's85', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '08:00 AM', passengers: 0, status: 'upcoming', distanceKm: '23.4 km', landmark: 'Plant North Hub' },
    ],
    outboundStops: [
      { id: 's801', name: 'Keraniganj Plant Gate-1', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-১', scheduledTime: '05:15 PM', passengers: 48, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's802', name: 'Dayaganj Circle', nameBn: 'দয়াগঞ্জ মোড়', scheduledTime: '05:35 PM', passengers: 7, status: 'upcoming', distanceKm: '6.4 km' },
      { id: 's803', name: 'Sayedabad Terminal Overpass', nameBn: 'সায়েদাবাদ টার্মিনাল', scheduledTime: '05:52 PM', passengers: 14, status: 'upcoming', distanceKm: '9.2 km' },
      { id: 's804', name: 'Demra Staff Quarter Turn', nameBn: 'ডেমরা স্টাফ কোয়ার্টার', scheduledTime: '06:15 PM', passengers: 12, status: 'upcoming', distanceKm: '16.6 km' },
      { id: 's805', name: 'Kanchpur Bridge Toll Foot', nameBn: 'কাঁচপুর ব্রিজ টোল ফুট', scheduledTime: '06:40 PM', passengers: 15, status: 'upcoming', distanceKm: '23.4 km' },
    ]
  },
  'route-9': {
    id: 'route-9',
    name: 'Route-9: Rohitpur Bazar ➔ Chunkutia ➔ Kadamtoli ➔ Zinzira ➔ Keraniganj Plant (Local Feeder)',
    nameBn: 'রুট-৯: রোহিতপুর বাজার ➔ চুনকুটিয়া ➔ কদমতলী ➔ জিনজিরা ➔ কেরানীগঞ্জ প্ল্যান্ট (লোকাল ফিডার)',
    coachNo: 'DHAKA METRO-BA 19-4450',
    busId: 'bus-9',
    model: 'Mitsubishi Fuso Feeder Coach (40-Seater)',
    corridorRoad: 'Rohitpur Main Road ➔ Chunkutia Highway ➔ Kadamtoli ➔ Zinzira ➔ Refinery Gate-2',
    driverName: 'Delwar Hossain',
    driverPhone: '+880 1725-667788',
    conductorName: 'Tariqul Islam',
    conductorPhone: '+880 1826-778800',
    speed: '36 km/h',
    nextStop: 'Zinzira Launch Ghat Bay',
    nextEta: '5 mins (07:40 AM)',
    progressPercent: 82,
    capacity: 40,
    inboundStartTime: '07:00 AM',
    outboundStartTime: '05:15 PM',
    inboundStops: [
      { id: 's91', name: 'Rohitpur Bus Stand', nameBn: 'রোহিতপুর বাস স্ট্যান্ড', scheduledTime: '07:00 AM', passengers: 12, status: 'passed', distanceKm: '0.0 km', landmark: 'Rohitpur High School Front' },
      { id: 's92', name: 'Chunkutia Chowrasta', nameBn: 'চুনকুটিয়া চৌরাস্তা', scheduledTime: '07:15 AM', passengers: 10, status: 'passed', distanceKm: '4.8 km', landmark: 'Shubhadya Union Parishad' },
      { id: 's93', name: 'Kadamtoli Bridge Foot', nameBn: 'কদমতলী ব্রিজ ফুট', scheduledTime: '07:28 AM', passengers: 9, status: 'passed', distanceKm: '8.2 km', landmark: 'Buriganga Riverfront Road' },
      { id: 's94', name: 'Zinzira Launch Ghat Bay', nameBn: 'জিনজিরা লঞ্চঘাট বে', scheduledTime: '07:42 AM', passengers: 7, status: 'active', distanceKm: '11.5 km', landmark: 'Zinzira Ferry Ghat' },
      { id: 's95', name: 'Keraniganj Plant Gate-2 (Refinery)', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-২', scheduledTime: '07:55 AM', passengers: 0, status: 'upcoming', distanceKm: '15.0 km', landmark: 'Chemical & Bitumen Terminal' },
    ],
    outboundStops: [
      { id: 's901', name: 'Keraniganj Plant Gate-2 (Refinery)', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট গেট-২', scheduledTime: '05:15 PM', passengers: 38, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's902', name: 'Zinzira Launch Ghat Bay', nameBn: 'জিনজিরা লঞ্চঘাট বে', scheduledTime: '05:30 PM', passengers: 7, status: 'upcoming', distanceKm: '3.5 km' },
      { id: 's903', name: 'Kadamtoli Bridge Foot', nameBn: 'কদমতলী ব্রিজ ফুট', scheduledTime: '05:45 PM', passengers: 9, status: 'upcoming', distanceKm: '6.8 km' },
      { id: 's904', name: 'Chunkutia Chowrasta', nameBn: 'চুনকুটিয়া চৌরাস্তা', scheduledTime: '06:00 PM', passengers: 10, status: 'upcoming', distanceKm: '10.2 km' },
      { id: 's905', name: 'Rohitpur Bus Stand', nameBn: 'রোহিতপুর বাস স্ট্যান্ড', scheduledTime: '06:18 PM', passengers: 12, status: 'upcoming', distanceKm: '15.0 km' },
    ]
  },
  'route-10': {
    id: 'route-10',
    name: 'Route-10: Executive Shuttle — Gulshan-2 ➔ Banani ➔ Tejgaon ➔ HQ / Keraniganj',
    nameBn: 'রুট-১০: এক্সিকিউটিভ শাটল — গুলশান-২ ➔ বনানী ➔ তেজগাঁও ➔ হেডকোয়ার্টার / প্ল্যান্ট',
    coachNo: 'DHAKA METRO-BA 20-6677',
    busId: 'bus-10',
    model: 'Mercedes-Benz Tourismo C-Suite VIP Shuttle (32-Seater)',
    corridorRoad: 'Gulshan North Ave ➔ Kemal Ataturk Ave ➔ Tejgaon Expressway ➔ Elevated Corridor ➔ Plant',
    driverName: 'Shahidul Alam',
    driverPhone: '+880 1711-224466',
    conductorName: 'Golam Kibria',
    conductorPhone: '+880 1811-998800',
    speed: '46 km/h',
    nextStop: 'Tejgaon Industrial Corridor Node',
    nextEta: '6 mins (07:44 AM)',
    progressPercent: 74,
    capacity: 32,
    inboundStartTime: '07:10 AM',
    outboundStartTime: '05:30 PM',
    inboundStops: [
      { id: 's101', name: 'Gulshan-2 Circle', nameBn: 'গুলশান-২ চত্বর', scheduledTime: '07:10 AM', passengers: 8, status: 'passed', distanceKm: '0.0 km', landmark: 'Westin / BOGCL Executive Lounge' },
      { id: 's102', name: 'Banani Club Roundabout', nameBn: 'বনানী ক্লাব গোলচত্বর', scheduledTime: '07:22 AM', passengers: 9, status: 'passed', distanceKm: '3.2 km', landmark: 'Road-11 Corner' },
      { id: 's103', name: 'Tejgaon Link Road Node', nameBn: 'তেজগাঁও লিংক রোড', scheduledTime: '07:40 AM', passengers: 7, status: 'active', distanceKm: '8.4 km', landmark: 'Ahsanullah University Gate' },
      { id: 's104', name: 'Keraniganj Plant Executive Pavilion', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট ভিআইপি প্যাভিলিয়ন', scheduledTime: '08:05 AM', passengers: 0, status: 'upcoming', distanceKm: '22.0 km', landmark: 'Refinery Boardroom Gate' },
    ],
    outboundStops: [
      { id: 's1001', name: 'Keraniganj Plant Executive Pavilion', nameBn: 'কেরানীগঞ্জ প্ল্যান্ট ভিআইপি প্যাভিলিয়ন', scheduledTime: '05:30 PM', passengers: 24, status: 'upcoming', distanceKm: '0.0 km' },
      { id: 's1002', name: 'Tejgaon Link Road Node', nameBn: 'তেজগাঁও লিংক রোড', scheduledTime: '06:00 PM', passengers: 7, status: 'upcoming', distanceKm: '13.6 km' },
      { id: 's1003', name: 'Banani Club Roundabout', nameBn: 'বনানী ক্লাব গোলচত্বর', scheduledTime: '06:18 PM', passengers: 9, status: 'upcoming', distanceKm: '18.8 km' },
      { id: 's1004', name: 'Gulshan-2 Circle', nameBn: 'গুলশান-২ চত্বর', scheduledTime: '06:35 PM', passengers: 8, status: 'upcoming', distanceKm: '22.0 km' },
    ]
  }
};

/**
 * Helper to generate 52 (or custom capacity) realistic commuter seats for any route
 */
export function generateSeatsForRoute(routeKey: string, capacity: number = 52): Seat[] {
  const seats: Seat[] = [];
  const route = INITIAL_ROUTES[routeKey] || INITIAL_ROUTES['route-1'];
  const stops = route.inboundStops;
  const numRows = Math.ceil(capacity / 4);

  // Some realistic employee rosters
  const employeePool = [
    { name: 'Engr. Harunur Rashid', dept: 'Plant GM & Operations', phone: '+880 1711-002101', cat: 'executive' as const, blood: 'O+' },
    { name: 'Mizanur Rahman', dept: 'Quality Assurance', phone: '+880 1712-441122', cat: 'executive' as const, blood: 'A+' },
    { name: 'Farhana Kabir', dept: 'EHS Safety Lead', phone: '+880 1819-556677', cat: 'lady_priority' as const, blood: 'B+' },
    { name: 'Engr. Tariq Ahmed', dept: 'Maintenance Div.', phone: '+880 1711-002105', cat: 'executive' as const, blood: 'AB+' },
    { name: 'Tanvir Ahmed', dept: 'Sales & Distribution', phone: '+880 1720-334455', cat: 'regular' as const, blood: 'B+' },
    { name: 'Shariful Islam', dept: 'Refinery Tech', phone: '+880 1713-998877', cat: 'regular' as const, blood: 'O+' },
    { name: 'Rezaul Karim', dept: 'Instrument Specialist', phone: '+880 1814-223344', cat: 'regular' as const, blood: 'A+' },
    { name: 'Babul Akhter', dept: 'Logistics Custodian', phone: '+880 1911-887766', cat: 'regular' as const, blood: 'O-' },
    { name: 'Nurul Amin', dept: 'Plant Accounts', phone: '+880 1715-667788', cat: 'regular' as const, blood: 'B+' },
    { name: 'Kamrul Hasan', dept: 'HR & Administration', phone: '+880 1816-554433', cat: 'regular' as const, blood: 'A+' },
    { name: 'Saiful Islam', dept: 'Lab Chemist', phone: '+880 1917-443322', cat: 'regular' as const, blood: 'AB+' },
    { name: 'Arif Hossain', dept: 'Security Officer', phone: '+880 1718-223311', cat: 'regular' as const, blood: 'O+' },
    { name: 'Al-Amin Mia', dept: 'Boiler Operator', phone: '+880 1819-112233', cat: 'regular' as const, blood: 'B+' },
    { name: 'Mahbub Alam', dept: 'Electrical Engr.', phone: '+880 1920-334455', cat: 'regular' as const, blood: 'A+' },
    { name: 'Tofazzal Hossain', dept: 'Maintenance', phone: '+880 1725-889900', cat: 'regular' as const, blood: 'B+' },
    { name: 'Delwar Hossain', dept: 'Plant Instrumentation', phone: '+880 1721-667788', cat: 'regular' as const, blood: 'O+' },
    { name: 'Jahangir Alam', dept: 'Shift Marshall', phone: '+880 1822-778899', cat: 'regular' as const, blood: 'A+' },
    { name: 'Moniruzzaman', dept: 'Piping Specialist', phone: '+880 1923-889900', cat: 'regular' as const, blood: 'B+' },
    { name: 'Zahirul Haque', dept: 'Terminal Dispatch', phone: '+880 1726-112233', cat: 'regular' as const, blood: 'O+' },
    { name: 'Shahidul Islam', dept: 'Warehouse Lead', phone: '+880 1827-223344', cat: 'regular' as const, blood: 'A+' },
    { name: 'Imran Nazir', dept: 'Refinery Process', phone: '+880 1928-334455', cat: 'regular' as const, blood: 'B+' },
    { name: 'Anwar Sadat', dept: 'Safety Inspector', phone: '+880 1729-445566', cat: 'regular' as const, blood: 'AB+' },
    { name: 'Golam Mostafa', dept: 'Turbine Mechanic', phone: '+880 1730-556677', cat: 'regular' as const, blood: 'O+' },
    { name: 'Nazrul Islam', dept: 'Compressor Tech', phone: '+880 1831-667788', cat: 'regular' as const, blood: 'A+' },
    { name: 'Asaduzzaman', dept: 'LPG Bottling', phone: '+880 1932-778899', cat: 'regular' as const, blood: 'B+' },
    { name: 'Mustafizur Rahman', dept: 'Instrumentation', phone: '+880 1733-889900', cat: 'regular' as const, blood: 'O-' },
    { name: 'Habibur Rahman', dept: 'Control Room Tech', phone: '+880 1734-990011', cat: 'regular' as const, blood: 'A+' },
    { name: 'Rabiul Awal', dept: 'HVAC Specialist', phone: '+880 1835-001122', cat: 'regular' as const, blood: 'B+' },
    { name: 'Kawsar Ahmed', dept: 'Water Treatment', phone: '+880 1936-112233', cat: 'regular' as const, blood: 'O+' },
    { name: 'Shamsul Alam', dept: 'Fire & Safety Officer', phone: '+880 1737-223344', cat: 'regular' as const, blood: 'O+' },
    { name: 'Liton Das', dept: 'Plant Chemist', phone: '+880 1838-334455', cat: 'regular' as const, blood: 'A+' },
    { name: 'Akram Hossain', dept: 'Tank Farm Operator', phone: '+880 1939-445566', cat: 'regular' as const, blood: 'B+' },
    { name: 'Bazlur Rashid', dept: 'Pipeline Welder', phone: '+880 1740-556677', cat: 'regular' as const, blood: 'AB+' },
    { name: 'Selim Mia', dept: 'Generators Lead', phone: '+880 1741-667788', cat: 'regular' as const, blood: 'O+' },
    { name: 'Ashraful Islam', dept: 'Maintenance Fitter', phone: '+880 1842-778899', cat: 'regular' as const, blood: 'A+' },
    { name: 'Farid Uddin', dept: 'Civil Works Tech', phone: '+880 1943-889900', cat: 'regular' as const, blood: 'B+' },
    { name: 'Mainul Islam', dept: 'Flare System Tech', phone: '+880 1744-990011', cat: 'regular' as const, blood: 'O+' },
    { name: 'Badrul Huda', dept: 'Security Escort', phone: '+880 1845-001122', cat: 'regular' as const, blood: 'A+' },
    { name: 'Nazim Uddin', dept: 'Stores Supervisor', phone: '+880 1946-112233', cat: 'regular' as const, blood: 'B+' },
    { name: 'Saidur Rahman', dept: 'Canteen Supervisor', phone: '+880 1747-223344', cat: 'regular' as const, blood: 'O+' },
    { name: 'Touhidul Islam', dept: 'Electrical Substation', phone: '+880 1748-334455', cat: 'regular' as const, blood: 'AB+' },
    { name: 'Belal Hossain', dept: 'Laboratory Asst.', phone: '+880 1849-445566', cat: 'regular' as const, blood: 'A+' },
    { name: 'Sultan Mahmud', dept: 'Diesel Generator Tech', phone: '+880 1950-556677', cat: 'regular' as const, blood: 'B+' },
    { name: 'Enamul Haque', dept: 'Refinery Utilities', phone: '+880 1751-667788', cat: 'regular' as const, blood: 'O+' },
    { name: 'Firoz Ahmed', dept: 'Logistics Handler', phone: '+880 1852-778899', cat: 'regular' as const, blood: 'B+' },
    { name: 'Sajid Hasan', dept: 'EHS Assistant', phone: '+880 1953-889900', cat: 'regular' as const, blood: 'A+' },
    { name: 'Rokonuzzaman', dept: 'Security Gate Staff', phone: '+880 1754-990011', cat: 'regular' as const, blood: 'O+' }
  ];

  let seatNumber = 1;
  for (let r = 1; r <= numRows; r++) {
    const cols: Array<'left_win' | 'left_aisle' | 'right_aisle' | 'right_win'> = [
      'left_win',
      'left_aisle',
      'right_aisle',
      'right_win'
    ];
    for (const c of cols) {
      if (seatNumber > capacity) break;

      const empIndex = (seatNumber - 1) % employeePool.length;
      const emp = employeePool[empIndex];
      const stop = stops[(seatNumber - 1) % Math.max(1, stops.length - 1)];

      // Make a couple of seats empty or vacated for realism
      let status: 'occupied' | 'vacated' | 'empty' = 'occupied';
      let vacatedReason: string | undefined = undefined;
      let assignedTo: string | null = emp.name;
      let staffId: string | undefined = `EMP-${String(1000 + seatNumber * 14).slice(0, 4)}`;
      let boarded = seatNumber % 2 === 0;

      if (seatNumber === 4) {
        status = 'vacated';
        vacatedReason = 'Approved Annual Leave';
        boarded = false;
      } else if (seatNumber === 12 || seatNumber === 20 || seatNumber === 32 || seatNumber === 48) {
        status = 'empty';
        assignedTo = null;
        staffId = undefined;
        boarded = false;
      } else if (seatNumber === 7 || seatNumber === 16) {
        status = 'vacated';
        vacatedReason = 'Working from Corporate HQ Dhaka';
        boarded = false;
      }

      seats.push({
        num: seatNumber,
        row: r,
        col: c,
        assignedTo,
        staffId,
        dept: assignedTo ? emp.dept : null,
        phone: assignedTo ? emp.phone : undefined,
        pickupPoint: assignedTo ? stop?.name || 'Main Stoppage' : undefined,
        pickupTime: assignedTo ? stop?.scheduledTime || '07:15 AM' : undefined,
        status,
        vacatedReason,
        bloodGroup: assignedTo ? emp.blood : undefined,
        boarded,
        category: emp.cat,
        bookingType: 'permanent'
      });

      seatNumber++;
    }
  }

  return seats;
}
