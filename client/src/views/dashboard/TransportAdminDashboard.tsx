import React, { useState } from 'react';
import { Car, Navigation } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../App';
import Pagination from '../../components/Pagination';
import { useFleetStore } from '../../store/fleetStore';
import { DashboardSubViewProps } from './types';

export default function TransportAdminDashboard({
  lang,
  activeTab
}: DashboardSubViewProps) {
  const [requisitionsPage, setRequisitionsPage] = useState(1);
  const {
    requisitions: sharedRequisitions,
    assignRequisition: sharedAssignRequisition,
    vehicles: sharedVehicles,
    drivers: sharedDrivers
  } = useFleetStore();

  return (
    <>
      {/* ═══════════════════════════════════════════
          TRANSPORT ADMIN: TAB "requisitions" (Paginated)
          ═══════════════════════════════════════════ */}
      {activeTab === 'requisitions' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Car size={16} /></div>
              <div>
                <div className="card-title">{t('Incoming Duty Travel Requisitions', 'আগত অফিসিয়াল যানবাহন আবেদনসমূহ', lang)}</div>
                <div className="card-subtitle">{t('Assign certified drivers & roadworthy vehicles', 'অনুমোদিত চালক ও গাড়ি বরাদ্দ নিশ্চিত করুন', lang)}</div>
              </div>
            </div>
            <span className="badge warn">{sharedRequisitions.filter(r => r.status === 'pending').length} pending</span>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="fleet-table">
                <thead>
                  <tr>
                    <th>{t('ID', 'আইডি', lang)}</th>
                    <th>{t('Requester & Dept', 'অনুরোধকারী ও বিভাগ', lang)}</th>
                    <th>{t('Route & Trip Mode', 'রুট ও ধরন', lang)}</th>
                    <th>{t('Departure Time', 'যাত্রার সময়', lang)}</th>
                    <th>{t('Required Capacity', 'প্রয়োজনীয় ধরন', lang)}</th>
                    <th>{t('Actions', 'পদক্ষেপ', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedRequisitions.slice((requisitionsPage - 1) * 3, requisitionsPage * 3).map((req, i) => (
                    <tr key={i} className={req.status === 'assigned' ? 'row-muted' : ''}>
                      <td><code style={{ fontWeight: 800 }}>{req.id}</code></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-slate-900)' }}>{req.requesterName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brand-slate-400)' }}>{req.dept} • {req.requesterRole}</div>
                      </td>
                      <td>
                        <div>{req.from.split(',')[0]} → {req.to.split(',')[0]}</div>
                        <div style={{ fontSize: '10.5px', color: '#1D4ED8', fontWeight: 600 }}>
                          {req.tripType === 'round_trip' ? '🔄 Round Trip' : '➡️ One-Way Drop'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{req.departureTime}</div>
                        <span className="badge info">{req.passengersCount} Passengers</span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#F1F5F9', color: '#0F172A', fontWeight: 700 }}>
                          {req.requiredCapacity === 'sedan_4' ? '4-Seat Sedan' : req.requiredCapacity === 'microbus_7' ? '7-Seat HiAce' : '4x4 Pickup'}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' ? (
                          <div className="flex-gap">
                            <button
                              className="btn-primary"
                              style={{ fontSize: '11px', padding: '5px 12px' }}
                              onClick={() => {
                                const availableCar = sharedVehicles.find(v => v.status === 'available') || sharedVehicles[0];
                                const availableDriver = sharedDrivers.find(d => d.status === 'available') || sharedDrivers[0];
                                sharedAssignRequisition(req.id, availableCar.plate, availableDriver.id);
                                showToast(`🚗 Allocated ${availableCar.plate} & Driver ${availableDriver.name} to ${req.requesterName}!`, 'success');
                              }}
                            >
                              Assign Driver & Vehicle
                            </button>
                          </div>
                        ) : (
                          <div>
                            <span className="badge success">✓ {req.assignedVehiclePlate}</span>
                            <div style={{ fontSize: '10.5px', color: 'var(--brand-slate-600)', marginTop: '2px' }}>
                              Driver: <strong>{req.assignedDriverName}</strong>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={requisitionsPage}
              totalItems={sharedRequisitions.length}
              pageSize={3}
              onPageChange={setRequisitionsPage}
              lang={lang}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TRANSPORT ADMIN: TAB "corridor"
          ═══════════════════════════════════════════ */}
      {activeTab === 'corridor' && (
        <div className="card mb-5 tab-pane-fade" style={{ background: '#0F172A', color: '#fff', border: '1px solid #334155' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={16} color="#FBBF24" />
              <strong style={{ fontSize: '13px' }}>
                {t('Live Tanker Corridor Transit & Toll Alert HUD', 'ট্যাংকার করিডোর ট্রানজিট ও টোল প্লাজা সতর্কতা', lang)}
              </strong>
            </div>
            <span className="badge success">Live Telematics</span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Babubazar Bridge Corridor</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#34D399', marginTop: '2px' }}>Normal Flow (18m)</div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>4 Tankers in Transit • Zero Delay</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Postogola Bridge Toll Plaza</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FBBF24', marginTop: '2px' }}>Moderate Congestion (38m)</div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Reroute Bitumen Bulk to Mawa Expressway</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Padma Bridge Expressway Corridor</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#60A5FA', marginTop: '2px' }}>High Speed Clear (80 km/h)</div>
              <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Mongla Depot Carrier #V-05 Passing Toll</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
