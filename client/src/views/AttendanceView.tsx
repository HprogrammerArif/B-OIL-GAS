import React, { useState, useEffect, useMemo } from 'react';
import { ViewProps, ROLE_META, t } from '../types';
import { showToast } from '../App';
import {
  MapPin, CheckCircle, Clock, ShieldCheck, AlertCircle,
  Camera, UserCheck, Calendar, Users, Award, Compass,
  Navigation, Shield, Check, X, Smartphone, RefreshCw, Zap
} from 'lucide-react';

interface ShiftWorker {
  id: string;
  name: string;
  role: string;
  dept: string;
  shift: string;
  inTime: string;
  outTime: string;
  locationStatus: 'inside_geofence' | 'remote_approved' | 'late' | 'absent';
  overtimeHours: number;
  distanceMeters: number;
}

const ROSTER_DATA: ShiftWorker[] = [
  {
    id: 'BOGCL-1049',
    name: 'Tanvir Ahmed',
    role: 'Senior Sales Executive',
    dept: 'Sales & Distribution',
    shift: 'General (09:00 - 18:00)',
    inTime: '08:52 AM',
    outTime: 'Pending',
    locationStatus: 'inside_geofence',
    overtimeHours: 0,
    distanceMeters: 42,
  },
  {
    id: 'BOGCL-2012',
    name: 'Md. Shahidul Islam',
    role: 'Executive Pool Chauffeur',
    dept: 'Fleet Management',
    shift: 'Morning Shift A (06:00 - 14:00)',
    inTime: '05:48 AM',
    outTime: 'Pending',
    locationStatus: 'inside_geofence',
    overtimeHours: 2.5,
    distanceMeters: 110,
  },
  {
    id: 'BOGCL-3088',
    name: 'Engr. Tariq Ahmed',
    role: 'Senior Plant Maintenance Lead',
    dept: 'Keraniganj Refinery Complex',
    shift: 'General (08:30 - 17:30)',
    inTime: 'On Leave',
    outTime: '-',
    locationStatus: 'absent',
    overtimeHours: 0,
    distanceMeters: 0,
  },
  {
    id: 'BOGCL-4105',
    name: 'Kamrul Hasan',
    role: 'Boiler & Steam Operator',
    dept: 'Refinery Utilities',
    shift: 'Shift A (07:00 - 15:00)',
    inTime: '06:54 AM',
    outTime: 'Pending',
    locationStatus: 'inside_geofence',
    overtimeHours: 1.0,
    distanceMeters: 85,
  },
  {
    id: 'BOGCL-5501',
    name: 'Farhana Kabir',
    role: 'Lead EHS Compliance Officer',
    dept: 'Health, Safety & Environment',
    shift: 'General (09:00 - 18:00)',
    inTime: '09:12 AM',
    outTime: 'Pending',
    locationStatus: 'late',
    overtimeHours: 0,
    distanceMeters: 310,
  },
];

export default function AttendanceView({ role, lang }: ViewProps) {
  const currentPersona = ROLE_META[role] || ROLE_META.employee;
  const [hasPunchedIn, setHasPunchedIn] = useState(true);
  const [punchTime, setPunchTime] = useState('08:52 AM');
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<'keraniganj' | 'dhaka_hq'>('keraniganj');
  const [gpsAccuracy, setGpsAccuracy] = useState('±4.2m');
  const [userCoords, setUserCoords] = useState({ lat: '23.6850° N', lng: '90.3540° E' });

  const roster = useMemo(() => {
    const defaultRoster = [
      {
        id: currentPersona.empId,
        name: currentPersona.name,
        role: currentPersona.label,
        dept: currentPersona.dept || 'Operations Division',
        shift: 'General (09:00 - 18:00)',
        inTime: hasPunchedIn ? punchTime : 'Not Clocked In',
        outTime: hasPunchedIn ? 'On Duty' : '-',
        locationStatus: hasPunchedIn ? ('inside_geofence' as const) : ('absent' as const),
        overtimeHours: 0,
        distanceMeters: 42,
      },
      ...ROSTER_DATA.filter(r => r.name !== currentPersona.name && r.name !== 'Tanvir Ahmed'),
    ];
    return defaultRoster;
  }, [currentPersona, hasPunchedIn, punchTime]);

  const handlePunchToggle = () => {
    if (!hasPunchedIn) {
      setShowFaceModal(true);
      setFaceScanning(true);
      setFaceVerified(false);
      setTimeout(() => {
        setFaceScanning(false);
        setFaceVerified(true);
      }, 2000);
    } else {
      setHasPunchedIn(false);
      showToast(
        t(
          'Punched Out for today. Shift duration: 8 hrs 42 mins. Overtime: 0 hrs. Safe commute!',
          'আজকের শিফট সমাপ্ত (পাঞ্চ আউট)। মোট কর্মঘণ্টা: ৮ ঘণ্টা ৪২ মিনিট। শুভ অপরাহ্ন!',
          lang
        ),
        'info'
      );
    }
  };

  const handleConfirmFacePunch = () => {
    setShowFaceModal(false);
    setHasPunchedIn(true);
    setPunchTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    showToast(
      t('Biometric Face Attendance Verified & Geofenced to Keraniganj Plant.', 'বায়োমেট্রিক উপস্থিতি নিশ্চিত করা হয়েছে।', lang),
      'success'
    );
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            📍 {t('Geofenced Mobile Attendance & Biometric Access', 'জিওফেন্স মোবাইল হাজিরা ও বায়োমেট্রিক উপস্থিতি', lang)}
          </h2>
          <p className="section-subtitle">
            {t(
              'High-precision GPS location validation, biometric facial recognition & official shift roster.',
              'জিপিএস অবস্থান যাচাই, বায়োমেট্রিক উপস্থিতি ও অফিশিয়াল শিফট রোস্টার।',
              lang
            )}
          </p>
        </div>
        <div className="btn-group">
          <button
            className="btn-primary"
            onClick={() => {
              showToast(t('Recalibrating high-precision GPS satellite fix...', 'জিপিএস পুনরায় ক্যালিব্রেট হচ্ছে...', lang), 'info');
              setGpsAccuracy('±2.8m');
            }}
          >
            <RefreshCw size={15} /> {t('Recalibrate GPS Fix', 'জিপিএস রিক্যালিব্রেট', lang)}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid mb-5">
        <div className="kpi-card">
          <div className="kpi-label">{t('Workforce Headcount Today', 'আজকের মোট উপস্থিতি', lang)}</div>
          <div className="kpi-value text-emerald">743 / 788</div>
          <div className="kpi-sub">94.2% Attendance · 18 on approved leave</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Current Geofence Zone', 'বর্তমান জিওফেন্স জোন', lang)}</div>
          <div className="kpi-value text-blue">Keraniganj Plant</div>
          <div className="kpi-sub">500m radius · Inside perimeter (42m from center)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Anti-Spoof Security Status', 'অ্যান্টি-স্পুফ নিরাপত্তা স্ট্যাটাস', lang)}</div>
          <div className="kpi-value text-emerald">SECURE (Grade-A)</div>
          <div className="kpi-sub">Zero Mock Providers · Cell Tower Validated</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('Shift Overtime Accrued', 'মোট শিফট ওভারটাইম', lang)}</div>
          <div className="kpi-value text-amber">৳38,400</div>
          <div className="kpi-sub">Across 42 refinery night shift technicians</div>
        </div>
      </div>

      {/* Main Grid: Live Radar View + Punch Card */}
      <div className="responsive-col-2-eq" style={{ marginBottom: '24px' }}>
        {/* Geofence Radar Canvas Card */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Compass size={16} /></div>
              <div>
                <div className="card-title">{t('Live Satellite Geofence Radar', 'লাইভ স্যাটেলাইট জিওফেন্স রাডার', lang)}</div>
                <div className="card-subtitle">{selectedLocation === 'keraniganj' ? 'Keraniganj Bitumen Plant (500m Radius)' : 'Bashundhara Corporate HQ'}</div>
              </div>
            </div>
            <span className="badge success">GPS Locked ({gpsAccuracy})</span>
          </div>

          <div className="card-body">
            {/* Visual Radar Display */}
            <div style={{
              height: '240px',
              borderRadius: '12px',
              background: 'radial-gradient(circle at center, #0B132B 0%, #030712 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Radar Rings */}
              <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.4)' }} />
              <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.25)' }} />
              <div style={{ position: 'absolute', width: '210px', height: '210px', borderRadius: '50%', border: '1.5px dashed rgba(212, 175, 55, 0.4)' }} />

              {/* Crosshairs */}
              <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.08)' }} />

              {/* Center Plant Node */}
              <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 10px #D4AF37' }} />
                <span style={{ fontSize: '9px', color: '#D4AF37', fontWeight: 700, marginTop: '4px' }}>PLANT BEACON</span>
              </div>

              {/* Employee Current Position Dot */}
              <div style={{ position: 'absolute', top: '90px', left: '160px', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 12px #10B981', animation: 'dot-pulse 1.8s infinite' }} />
                <span style={{ fontSize: '9px', color: '#34D399', fontWeight: 800, marginTop: '2px', background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: '4px' }}>
                  YOU (42m)
                </span>
              </div>

              {/* Coordinates Badge */}
              <div style={{ position: 'absolute', bottom: '10px', left: '12px', fontSize: '10.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
                LAT: {userCoords.lat} · LNG: {userCoords.lng}
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--brand-slate-500)' }}>Mock GPS Detection:</span>{' '}
                <strong style={{ color: '#059669' }}>PASSED (None)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--brand-slate-500)' }}>{t('Geofence Radius:', 'জিওফেন্স ব্যাসার্ধ:', lang)}</span>{' '}
                <strong>500 Meters (Clear)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Shift Punch Console */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><UserCheck size={16} /></div>
              <div>
                <div className="card-title">{t('My Personal Shift Console', 'আমার ব্যক্তিগত শিফট কনসোল', lang)}</div>
                <div className="card-subtitle">{currentPersona.name} · {currentPersona.label} (ID: {currentPersona.empId})</div>
              </div>
            </div>
            <span className={`badge ${hasPunchedIn ? 'success' : 'warn'}`}>
              {hasPunchedIn ? 'On Duty' : 'Off Duty'}
            </span>
          </div>

          <div className="card-body">
            <div style={{ background: 'var(--brand-slate-50)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {t('Today\'s Shift Time', 'আজকের শিফট', lang)}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>
                    09:00 AM – 06:00 PM
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--brand-slate-500)', marginTop: '2px' }}>
                    {hasPunchedIn ? `Punched In at ${punchTime} via Geofence` : 'Shift has not started'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {t('Duty Duration', 'কর্মকাল', lang)}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-crimson)', marginTop: '2px' }}>
                    {hasPunchedIn ? '8h 42m' : '0h 00m'}
                  </div>
                </div>
              </div>
            </div>

            <button
              className={hasPunchedIn ? 'btn-outline-danger' : 'btn-primary'}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: 700 }}
              onClick={handlePunchToggle}
            >
              {hasPunchedIn ? (
                <>
                  <Clock size={16} /> {t('Punch Out & Conclude Duty', 'পাঞ্চ আউট (শিফট সমাপ্ত)', lang)}
                </>
              ) : (
                <>
                  <Camera size={16} /> {t('Punch In with Face Biometric', 'বায়োমেট্রিক ফেস পাঞ্চ ইন', lang)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Roster & Attendance Table */}
      <div className="card">
        <div className="card-hd">
          <div className="card-hd-left">
            <div className="card-hd-icon"><Users size={16} /></div>
            <div>
              <div className="card-title">{t('Shift Attendance Roster & Geofence Verification Log', 'উপস্থিতি রোস্টার ও অবস্থান লগ', lang)}</div>
              <div className="card-subtitle">{t('Real-time GPS boundary logging for plant and commercial personnel', 'প্ল্যান্ট ও বাণিজ্যিক কর্মীদের লাইভ জিপিএস লগ', lang)}</div>
            </div>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID / Employee</th>
                  <th>Role & Dept</th>
                  <th>Shift Schedule</th>
                  <th>Punch In</th>
                  <th>Geofence Status</th>
                  <th>Overtime</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--brand-slate-400)' }}>{r.id}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{r.role}</div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{r.dept}</div>
                    </td>
                    <td>{r.shift}</td>
                    <td><strong>{r.inTime}</strong></td>
                    <td>
                      {r.locationStatus === 'inside_geofence' ? (
                        <span className="badge success">Inside Geofence ({r.distanceMeters}m)</span>
                      ) : r.locationStatus === 'late' ? (
                        <span className="badge warn">Late In ({r.distanceMeters}m)</span>
                      ) : (
                        <span className="badge danger">Approved Leave</span>
                      )}
                    </td>
                    <td>
                      {r.overtimeHours > 0 ? (
                        <span className="badge gold">+{r.overtimeHours} hrs OT</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Biometric Face Verification Viewfinder Modal */}
      {showFaceModal && (
        <div className="app-modal-overlay" onClick={() => setShowFaceModal(false)}>
          <div className="app-modal-dialog" style={{ width: '480px', maxWidth: '92vw' }} onClick={e => e.stopPropagation()}>
            <div className="app-modal-header">
              <div className="app-modal-header-left">
                <div className="app-modal-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#0284C7' }}>
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="app-modal-title">{t('AI Facial Biometric Liveness Verification', 'এআই ফেসিয়াল বায়োমেট্রিক হাজিরা যাচাই', lang)}</h3>
                  <div className="app-modal-subtitle">{t('BOGCL Keraniganj Plant Geofence Security', 'কেরানীগঞ্জ রিফাইনারি জিওফেন্স নিরাপত্তা', lang)}</div>
                </div>
              </div>
              <button className="app-modal-close" onClick={() => setShowFaceModal(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="app-modal-body" style={{ padding: '24px 20px', textAlign: 'center' }}>
              {/* Viewfinder Circle */}
              <div style={{
                width: '170px',
                height: '170px',
                borderRadius: '50%',
                margin: '0 auto 18px',
                border: faceVerified ? '3px solid #10B981' : '3px dashed #0284C7',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(56, 189, 248, 0.05)',
                overflow: 'hidden',
              }}>
                <div style={{ fontSize: '56px' }}>👤</div>
                {faceScanning && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#0284C7',
                    boxShadow: '0 0 12px #0284C7',
                    animation: 'recWave 1.2s infinite alternate',
                  }} />
                )}
                {faceVerified && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={54} color="#10B981" />
                  </div>
                )}
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--brand-slate-900)' }}>
                {faceScanning ? t('Scanning Facial Geometry...', 'মুখমন্ডলের জ্যামিতি স্ক্যান করা হচ্ছে...', lang) : t('Biometric Match: 99.4% Verified', 'বায়োমেট্রিক ম্যাচ: ৯৯.৪% নিশ্চিত', lang)}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--brand-slate-500)', margin: 0 }}>
                {faceScanning ? t('Please look directly at camera inside Keraniganj Plant geofence.', 'অনুগ্রহ করে ক্যামেরার দিকে তাকান।', lang) : t(`${currentPersona.name} (ID: ${currentPersona.empId}) authenticated successfully.`, `${currentPersona.name} (আইডি: ${currentPersona.empId}) যাচাই সম্পন্ন হয়েছে।`, lang)}
              </p>
            </div>

            <div className="app-modal-footer">
              <button className="btn-sm-ghost" onClick={() => setShowFaceModal(false)}>
                {t('Cancel', 'বাতিল', lang)}
              </button>
              <button
                className="btn-primary"
                disabled={!faceVerified}
                onClick={handleConfirmFacePunch}
              >
                <Check size={14} /> {t('Confirm Shift Punch In', 'হাজিরা নিশ্চিত করুন', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
