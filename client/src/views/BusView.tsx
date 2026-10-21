import React, { useState } from 'react';
import { ViewProps, t } from '../types';
import { showToast } from '../App';
import {
  Bus, Users, MapPin, CheckCircle, Clock, AlertTriangle,
  QrCode, UserMinus, UserPlus, Phone, Compass, BellRing,
  Navigation, CheckCheck, X, Shield, Smartphone, RefreshCw
} from 'lucide-react';

interface Seat {
  num: number;
  row: number;
  col: 'left_win' | 'left_aisle' | 'right_aisle' | 'right_win';
  assignedTo: string | null;
  dept: string | null;
  phone?: string;
  pickupPoint?: string;
  status: 'occupied' | 'vacated' | 'empty';
  vacatedReason?: string;
}

interface WaitlistEntry {
  rank: number;
  name: string;
  dept: string;
  pickupPoint: string;
  phone: string;
}

const INITIAL_SEATS: Seat[] = [
  // Row 1
  { num: 1, row: 1, col: 'left_win', assignedTo: 'Engr. Harunur Rashid', dept: 'Plant GM', phone: '+880 1711-002101', pickupPoint: 'Dhanmondi-27', status: 'occupied' },
  { num: 2, row: 1, col: 'left_aisle', assignedTo: 'Mizanur Rahman', dept: 'Quality Assurance', phone: '+880 1712-441122', pickupPoint: 'Farmgate', status: 'occupied' },
  { num: 3, row: 1, col: 'right_aisle', assignedTo: 'Farhana Kabir', dept: 'EHS Safety Lead', phone: '+880 1819-556677', pickupPoint: 'Shahbagh', status: 'occupied' },
  { num: 4, row: 1, col: 'right_win', assignedTo: 'Engr. Tariq Ahmed', dept: 'Maintenance', phone: '+880 1711-002105', pickupPoint: 'Shahbagh', status: 'vacated', vacatedReason: 'On Approved Leave Today' },

  // Row 2
  { num: 5, row: 2, col: 'left_win', assignedTo: 'Tanvir Ahmed', dept: 'Sales & Distribution', phone: '+880 1720-334455', pickupPoint: 'Farmgate Overbridge', status: 'occupied' },
  { num: 6, row: 2, col: 'left_aisle', assignedTo: 'Shariful Islam', dept: 'Refinery Tech', phone: '+880 1713-998877', pickupPoint: 'Karwan Bazar', status: 'occupied' },
  { num: 7, row: 2, col: 'right_aisle', assignedTo: 'Rezaul Karim', dept: 'Instrument Specialist', phone: '+880 1814-223344', pickupPoint: 'Matsya Bhaban', status: 'vacated', vacatedReason: 'Working from Corporate HQ' },
  { num: 8, row: 2, col: 'right_win', assignedTo: 'Babul Akhter', dept: 'Logistics', phone: '+880 1911-887766', pickupPoint: 'Babubazar Bridge', status: 'occupied' },

  // Row 3
  { num: 9, row: 3, col: 'left_win', assignedTo: 'Nurul Amin', dept: 'Accounts', phone: '+880 1715-667788', pickupPoint: 'Farmgate', status: 'occupied' },
  { num: 10, row: 3, col: 'left_aisle', assignedTo: 'Kamrul Hasan', dept: 'HR & Admin', phone: '+880 1816-554433', pickupPoint: 'Shahbagh', status: 'occupied' },
  { num: 11, row: 3, col: 'right_aisle', assignedTo: 'Saiful Islam', dept: 'Lab Chemist', phone: '+880 1917-443322', pickupPoint: 'Babubazar', status: 'occupied' },
  { num: 12, row: 3, col: 'right_win', assignedTo: null, dept: null, status: 'empty' },

  // Row 4
  { num: 13, row: 4, col: 'left_win', assignedTo: 'Arif Hossain', dept: 'Security Officer', phone: '+880 1718-223311', pickupPoint: 'Farmgate', status: 'occupied' },
  { num: 14, row: 4, col: 'left_aisle', assignedTo: 'Al-Amin', dept: 'Boiler Operator', phone: '+880 1819-112233', pickupPoint: 'Babubazar', status: 'occupied' },
  { num: 15, row: 4, col: 'right_aisle', assignedTo: 'Mahbub Alam', dept: 'Electrical Engr', phone: '+880 1920-334455', pickupPoint: 'Shahbagh', status: 'occupied' },
  { num: 16, row: 4, col: 'right_win', assignedTo: null, dept: null, status: 'empty' },

  // Row 5
  { num: 17, row: 5, col: 'left_win', assignedTo: 'Delwar Hossain', dept: 'Plant Instrumentation', phone: '+880 1721-667788', pickupPoint: 'Farmgate', status: 'occupied' },
  { num: 18, row: 5, col: 'left_aisle', assignedTo: 'Jahangir Alam', dept: 'Shift Marshall', phone: '+880 1822-778899', pickupPoint: 'Shahbagh', status: 'occupied' },
  { num: 19, row: 5, col: 'right_aisle', assignedTo: 'Moniruzzaman', dept: 'Piping Specialist', phone: '+880 1923-889900', pickupPoint: 'Babubazar', status: 'occupied' },
  { num: 20, row: 5, col: 'right_win', assignedTo: null, dept: null, status: 'empty' },
];

const INITIAL_WAITLIST: WaitlistEntry[] = [
  { rank: 1, name: 'Shahadat Hossain', dept: 'Mechanical Tech', pickupPoint: 'Farmgate Overbridge', phone: '+880 1718-445566' },
  { rank: 2, name: 'Nasir Uddin', dept: 'Refinery Operator', pickupPoint: 'Shahbagh Square', phone: '+880 1823-998811' },
  { rank: 3, name: 'Ziaur Rahman', dept: 'Procurement Asst.', pickupPoint: 'Babubazar Bridge', phone: '+880 1912-334455' },
  { rank: 4, name: 'Sabbir Ahmed', dept: 'Chemical Blending Tech', pickupPoint: 'Farmgate', phone: '+880 1729-110022' },
];

export default function BusView({ role, lang }: ViewProps) {
  const [selectedRoute, setSelectedRoute] = useState('route-1');
  const [seats, setSeats] = useState<Seat[]>(INITIAL_SEATS);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [mySeatVacated, setMySeatVacated] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(INITIAL_SEATS[0]);
  const [showQrModal, setShowQrModal] = useState(false);

  const toggleMySeat = () => {
    if (!mySeatVacated) {
      setSeats(prev => prev.map(s => s.num === 5 ? { ...s, status: 'vacated', vacatedReason: 'Voluntarily released by Tanvir Ahmed' } : s));
      setMySeatVacated(true);
      showToast(t('Seat #5 vacated for today. Alert dispatched to waitlist candidates!', 'আজকের জন্য ৫ নম্বর সিট ছেড়ে দেওয়া হয়েছে। অপেক্ষাতালিকায় বার্তা পাঠানো হয়েছে।', lang), 'gold');
    } else {
      setSeats(prev => prev.map(s => s.num === 5 ? { ...s, status: 'occupied', vacatedReason: undefined } : s));
      setMySeatVacated(false);
      showToast(t('Seat #5 reclaimed.', 'সিট পুনরায় পুনরুদ্ধার করা হয়েছে।', lang), 'info');
    }
  };

  const handleAutoReassign = (candidate: WaitlistEntry, targetSeatNum: number) => {
    setSeats(prev => prev.map(s => s.num === targetSeatNum ? { ...s, assignedTo: candidate.name, dept: candidate.dept, phone: candidate.phone, pickupPoint: candidate.pickupPoint, status: 'occupied', vacatedReason: undefined } : s));
    setWaitlist(prev => prev.filter(w => w.rank !== candidate.rank));
    showToast(t(
      `Seat #${targetSeatNum} allocated to ${candidate.name}! SMS Boarding Pass dispatched to ${candidate.phone}`,
      `সিট #${targetSeatNum} বরাদ্দ করা হয়েছে ${candidate.name}-কে! ফোনে এসএমএস বোর্ডিং পাস পাঠানো হয়েছে।`,
      lang
    ), 'gold');
  };

  const vacatedSeats = seats.filter(s => s.status === 'vacated');
  const occupiedCount = seats.filter(s => s.status === 'occupied').length;

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            🚍 {t('Shift Commute & Plant Bus Logistics Management', 'শিফট যাতায়াত ও প্ল্যান্ট স্টাফ বাস ট্র্যাকিং', lang)}
          </h2>
          <p className="section-subtitle">
            {t(
              'Interactive visual coach seat allocation, FIFO standby queue automation & GPS telemetry tracking.',
              'ভিজ্যুয়াল কোচ সিট বিন্যাস, ফিফো ওয়েটলিস্ট অটোমেশন ও জিপিএস বাস ট্র্যাকিং।',
              lang
            )}
          </p>
        </div>
        <div className="btn-group">
          <button
            className="btn-primary"
            onClick={() => setShowQrModal(true)}
          >
            <QrCode size={15} /> {t('My Digital Boarding Pass', 'আমার বোর্ডিং পাস', lang)}
          </button>
          <button
            className="btn-outline"
            onClick={() => showToast(t('Conductor Door Scanner Mode Active: Ready to scan QR boarding passes at bus entrance.', 'কন্ডাক্টর স্ক্যানার মোড সক্রিয়।', lang), 'info')}
          >
            <Smartphone size={15} /> {t('Conductor Scanner', 'কন্ডাক্টর স্ক্যানার', lang)}
          </button>
        </div>
      </div>

      {/* Live Route Telemetry Banner */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)', color: '#fff', border: 'none' }}>
        <div className="card-body" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(212,175,55,0.15)', border: '1.5px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bus size={24} color="#D4AF37" />
              </div>
              <div>
                <div style={{ fontSize: '10.5px', color: '#D4AF37', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {t('LIVE GPS SATELLITE TELEMETRY • ROUTE #01', 'লাইভ জিপিএস রুট ট্র্যাকার', lang)}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px' }}>
                  Route-1: Mirpur-10 ➔ Farmgate ➔ Shahbagh ➔ Babubazar ➔ Keraniganj Plant
                </div>
                <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                  Hino Super Liner 52-Seater (DHAKA METRO BA-15-4421) · Driver: Master Rafiq (+880 1712-334499)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Speed:</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#34D399' }}>42 km/h</div>
              </div>
              <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '18px' }}>
                <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Next Station ETA:</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FDE047' }}>Babubazar Bridge (8 min)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voluntary Release Notification Strip */}
      <div style={{
        background: mySeatVacated ? 'rgba(212, 175, 55, 0.12)' : 'rgba(2, 132, 199, 0.08)',
        border: mySeatVacated ? '1px solid #D4AF37' : '1px solid rgba(2, 132, 199, 0.25)',
        padding: '12px 18px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Clock size={20} color={mySeatVacated ? '#B45309' : '#0284C7'} />
          <div style={{ fontSize: '12.5px' }}>
            <strong>{t('Smart Commuter Action:', 'স্মার্ট যাত্রী অ্যাকশন:', lang)}</strong>{' '}
            {mySeatVacated
              ? t('Your Seat #5 has been released for today. You freed a seat for waitlist colleague Shahadat Hossain!', 'আপনার ৫ নম্বর সিট আজকের জন্য ছেড়ে দেওয়া হয়েছে। সহকর্মীকে সুযোগ দেওয়ার জন্য ধন্যবাদ!', lang)
              : t('Working from HQ or taking personal leave today? Release your seat to auto-promote standby refinery engineers.', 'আজ কি ছুটি বা সদর দপ্তরে আছেন? আপনার সিটটি ছেড়ে দিন অপেক্ষমান সহকর্মীদের জন্য।', lang)}
          </div>
        </div>
        <button
          className={mySeatVacated ? 'btn-gold' : 'btn-primary'}
          style={{ fontSize: '11.5px', padding: '6px 14px' }}
          onClick={toggleMySeat}
        >
          {mySeatVacated ? (
            <>
              <UserPlus size={14} /> {t('Reclaim My Seat #5', 'সিট পুনরুদ্ধার করুন', lang)}
            </>
          ) : (
            <>
              <UserMinus size={14} /> {t('Release My Seat Today', 'আজকের সিট ছেড়ে দিন', lang)}
            </>
          )}
        </button>
      </div>

      {/* Main Bus Seating Graphic + Queue Grid */}
      <div className="responsive-col-2">
        {/* Visual Coach Seat Map */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Bus size={16} /></div>
              <div>
                <div className="card-title">{t('Interactive Coach Seating Matrix (52-Seater Executive Shuttle)', 'কোচ সিট বিন্যাস (৫২-আসন বিশিষ্ট)', lang)}</div>
                <div className="card-subtitle">{t('Click any seat to inspect passenger, pickup stop & phone', 'যাত্রীর তথ্য ও পিকআপ স্টপ দেখতে সিটে ক্লিক করুন', lang)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge success">{occupiedCount} Occupied</span>
              <span className="badge gold">{vacatedSeats.length} Vacated</span>
            </div>
          </div>

          <div className="card-body">
            {/* Visual Bus Fuselage Container */}
            <div style={{
              maxWidth: '540px',
              margin: '0 auto',
              background: 'var(--brand-slate-100, #F1F5F9)',
              border: '2px solid var(--brand-border)',
              borderRadius: '24px 24px 12px 12px',
              padding: '16px 20px',
              position: 'relative',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Front Cabin Windshield */}
              <div style={{
                background: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
                color: '#fff',
                borderRadius: '16px 16px 4px 4px',
                padding: '8px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                fontSize: '11px',
                fontWeight: 700,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Navigation size={14} color="#D4AF37" />
                  <span>FRONT WINDSHIELD · DRIVER CAB</span>
                </div>
                <div style={{ color: '#34D399' }}>ENTRANCE DOOR 🚪</div>
              </div>

              {/* Rows of 4 seats (Left Window, Left Aisle, Aisle Gap, Right Aisle, Right Window) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map((rowNum) => {
                  const rowSeats = seats.filter(s => s.row === rowNum);
                  const leftWin = rowSeats.find(s => s.col === 'left_win');
                  const leftAisle = rowSeats.find(s => s.col === 'left_aisle');
                  const rightAisle = rowSeats.find(s => s.col === 'right_aisle');
                  const rightWin = rowSeats.find(s => s.col === 'right_win');

                  const renderSeatBox = (s?: Seat) => {
                    if (!s) return <div style={{ width: '48px', height: '48px' }} />;
                    const isSelected = selectedSeat?.num === s.num;
                    const isVacated = s.status === 'vacated';
                    const isOccupied = s.status === 'occupied';

                    return (
                      <div
                        key={s.num}
                        onClick={() => setSelectedSeat(s)}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--brand-crimson)' : '1px solid var(--brand-border)',
                          background: isVacated ? '#FEF3C7' : isOccupied ? '#fff' : '#E2E8F0',
                          boxShadow: isSelected ? '0 0 0 2px rgba(165,28,48,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontSize: '10px', fontWeight: 800, color: isVacated ? '#B45309' : isOccupied ? 'var(--brand-slate-700)' : '#94A3B8' }}>
                          #{s.num}
                        </div>
                        <div style={{ fontSize: '9px', fontWeight: 600, color: isVacated ? '#92400E' : isOccupied ? 'var(--brand-slate-900)' : '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '44px' }}>
                          {s.assignedTo ? s.assignedTo.split(' ')[0] : 'EMPTY'}
                        </div>
                        {isVacated && (
                          <div style={{ position: 'absolute', bottom: '2px', fontSize: '7px', fontWeight: 800, color: '#B45309', background: '#FDE68A', padding: '0 3px', borderRadius: '2px' }}>
                            FREE
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div key={rowNum} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {renderSeatBox(leftWin)}
                        {renderSeatBox(leftAisle)}
                      </div>

                      {/* Center Aisle */}
                      <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 700, letterSpacing: '1px' }}>
                        AISLE
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {renderSeatBox(rightAisle)}
                        {renderSeatBox(rightWin)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rear Section */}
              <div style={{ textAlign: 'center', marginTop: '14px', paddingTop: '8px', borderTop: '1px dashed var(--brand-border)', fontSize: '10px', color: '#94A3B8' }}>
                REAR EMERGENCY EXIT & LUGGAGE STORAGE
              </div>
            </div>

            {/* Legend */}
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '11.5px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: '#fff', border: '1px solid var(--brand-border)', borderRadius: '3px' }}></span>
                {t('Occupied Staff', 'যাত্রী বরাদ্দ', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '3px' }}></span>
                {t('Vacated for Standby (Ready to grab)', 'আজ ফাঁকা (বরাদ্দযোগ্য)', lang)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: '#E2E8F0', border: '1px solid #CBD5E1', borderRadius: '3px' }}></span>
                {t('Empty / Unassigned', 'খালি আসন', lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Seat Dossier & FIFO Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Selected Seat Inspector */}
          {selectedSeat && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-left">
                  <div className="card-hd-icon">💺</div>
                  <div>
                    <div className="card-title">Seat #{selectedSeat.num} Details</div>
                    <div className="card-subtitle">
                      {selectedSeat.assignedTo || 'Unassigned Seat'}
                    </div>
                  </div>
                </div>
                <span className={`badge ${selectedSeat.status === 'vacated' ? 'gold' : selectedSeat.status === 'occupied' ? 'success' : ''}`}>
                  {selectedSeat.status === 'vacated' ? 'Vacated Today' : selectedSeat.status === 'occupied' ? 'Occupied' : 'Empty'}
                </span>
              </div>
              <div className="card-body" style={{ fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--brand-border)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Passenger:</span>
                  <strong>{selectedSeat.assignedTo || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--brand-border)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Department:</span>
                  <span>{selectedSeat.dept || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--brand-border)' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Pickup Stop:</span>
                  <span>📍 {selectedSeat.pickupPoint || 'General Point'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: 'var(--brand-slate-500)' }}>Emergency Contact:</span>
                  <code>{selectedSeat.phone || '+880 1700-000000'}</code>
                </div>

                {selectedSeat.status === 'vacated' && waitlist.length > 0 && (
                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--brand-border)' }}>
                    <button
                      className="btn-gold"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => handleAutoReassign(waitlist[0], selectedSeat.num)}
                    >
                      ⚡ Auto-Assign to #1 {waitlist[0].name}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Standby & FIFO Queue */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-left">
                <div className="card-hd-icon"><Users size={16} /></div>
                <div>
                  <div className="card-title">{t('FIFO Waitlist & Standby Queue', 'ফিফো অপেক্ষাতালিকা ও স্ট্যান্ডবাই', lang)}</div>
                  <div className="card-subtitle">{waitlist.length} {t('Colleagues in queue', 'জন অপেক্ষমান', lang)}</div>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Colleague</th>
                      <th>Stop</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((w) => (
                      <tr key={w.rank}>
                        <td>
                          <span className={`badge ${w.rank === 1 ? 'gold' : 'info'}`}>#{w.rank}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{w.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{w.dept}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px' }}>📍 {w.pickupPoint}</span>
                        </td>
                        <td>
                          {vacatedSeats.length > 0 ? (
                            <button
                              className="btn-primary"
                              style={{ fontSize: '10.5px', padding: '3px 8px' }}
                              onClick={() => handleAutoReassign(w, vacatedSeats[0].num)}
                            >
                              Assign #{vacatedSeats[0].num}
                            </button>
                          ) : (
                            <span style={{ fontSize: '10.5px', color: 'var(--brand-slate-400)' }}>Standby</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Boarding Pass Modal */}
      {showQrModal && (
        <div className="ic-call-overlay">
          <div className="ic-call-modal" style={{ width: '480px', background: '#0B132B', color: '#fff' }}>
            <div className="ic-call-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D4AF37', fontSize: '11px', fontWeight: 800 }}>
                <QrCode size={14} />
                <span>BOGCL COMMUTER DIGITAL PASS</span>
              </div>
              <button className="ic-call-close" onClick={() => setShowQrModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div className="qr-box" style={{ background: '#fff', color: '#0F172A', borderRadius: '12px', padding: '16px', display: 'inline-block', marginBottom: '14px' }}>
                <QrCode size={140} color="#000" />
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 4px 0' }}>Tanvir Ahmed</h3>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>Seat #5 · Route-1 (Mirpur-Keraniganj)</div>
              <div style={{ fontSize: '11px', color: '#34D399', marginTop: '6px', fontWeight: 600 }}>
                ✓ GPS Gate Clearance Validated for Oct 17
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => setShowQrModal(false)}>
                {t('Close Boarding Pass', 'পাস বন্ধ করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
