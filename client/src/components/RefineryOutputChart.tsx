import React, { useState } from 'react';
import { Lang, t } from '../types';
import { Activity, BarChart3, Database, RefreshCw, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { showToast } from '../App';

interface RefineryOutputChartProps {
  lang: Lang;
}

const PRODUCTION_DATA = [
  { day: 'Mon', dayBn: 'সোম', bitumen: 4820, target: 5000, lpg: 1240, efficiency: 96.4 },
  { day: 'Tue', dayBn: 'মঙ্গল', bitumen: 5120, target: 5000, lpg: 1310, efficiency: 102.4 },
  { day: 'Wed', dayBn: 'বুধ', bitumen: 4950, target: 5000, lpg: 1280, efficiency: 99.0 },
  { day: 'Thu', dayBn: 'বৃহঃ', bitumen: 5210, target: 5000, lpg: 1350, efficiency: 104.2 },
  { day: 'Fri', dayBn: 'শুক্র', bitumen: 5050, target: 5000, lpg: 1290, efficiency: 101.0 },
  { day: 'Sat', dayBn: 'শনি', bitumen: 5180, target: 5000, lpg: 1340, efficiency: 103.6 },
  { day: 'Sun', dayBn: 'রবি', bitumen: 5320, target: 5000, lpg: 1390, efficiency: 106.4 },
];

const TANKS = [
  { id: 'TK-01', name: 'Bitumen VG-30', temp: '162°C', capacity: '12,000 MT', fillPercent: 84, status: 'Optimal', color: '#A51C30' },
  { id: 'TK-02', name: 'Bitumen VG-10', temp: '158°C', capacity: '10,000 MT', fillPercent: 68, status: 'Filling', color: '#0369A1' },
  { id: 'TK-03', name: 'Industrial Fuel HFO', temp: '48°C', capacity: '15,000 MT', fillPercent: 91, status: 'Near Full', color: '#D97706' },
  { id: 'TK-04', name: 'LPG Cryo-Sphere', temp: '-42°C', capacity: '5,000 MT', fillPercent: 74, status: 'Pressurized', color: '#059669' },
];

export default function RefineryOutputChart({ lang }: RefineryOutputChartProps) {
  const [activeTab, setActiveTab] = useState<'7d' | '30d' | 'quarter'>('7d');
  const [hoveredDay, setHoveredDay] = useState<number | null>(6);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const maxVal = 6000;
  const chartHeight = 160;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast(t('Keraniganj DCS telemetry stream synchronized with SAP S/4HANA.', 'কেরানীগঞ্জ ডিসিএস টেলিমেট্রি সিঙ্ক সম্পন্ন।', lang), 'gold');
    }, 700);
  };

  const currentHover = hoveredDay !== null ? PRODUCTION_DATA[hoveredDay] : PRODUCTION_DATA[6];

  return (
    <div className="card refinery-chart-card mb-5">
      <div className="card-hd">
        <div className="card-hd-left">
          <div className="card-hd-icon" style={{ background: 'var(--brand-crimson-muted)', color: 'var(--brand-crimson)' }}>
            <BarChart3 size={16} />
          </div>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{t('Keraniganj Bitumen & Petroleum Output Telemetry', 'কেরানীগঞ্জ বিটুমিন ও পেট্রোলিয়াম উৎপাদন টেলিমেট্রি', lang)}</span>
              <span className="badge success" style={{ fontSize: '9px', padding: '1px 6px' }}>SCADA LIVE</span>
            </div>
            <div className="card-subtitle">
              {t('Continuous DCS Stream • Baseline Target: 5,000 MT/Day • Grade 60/70 & 80/100', 'নিয়মিত ডিসিএস স্ট্রিম • দৈনিক লক্ষ্যমাত্রা: ৫,০০০ মে.টন', lang)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="chart-tabs">
            <button
              className={`chart-tab ${activeTab === '7d' ? 'active' : ''}`}
              onClick={() => setActiveTab('7d')}
            >
              {t('Last 7 Days', 'গত ৭ দিন', lang)}
            </button>
            <button
              className={`chart-tab ${activeTab === '30d' ? 'active' : ''}`}
              onClick={() => setActiveTab('30d')}
            >
              {t('MTD Target', 'চলতি মাস', lang)}
            </button>
          </div>

          <button
            className="btn-icon-subtle"
            title="Poll Keraniganj DCS Stream"
            onClick={handleRefresh}
            style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-slate-200)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="refinery-chart-layout">
          {/* Main 7-day Bar/Line Chart */}
          <div className="refinery-main-chart">
            <div className="chart-legend-row">
              <div className="legend-item">
                <span className="legend-color-dot" style={{ background: 'var(--brand-crimson)' }}></span>
                <span>{t('Bitumen Output (MT)', 'বিটুমিন উৎপাদন (মে.টন)', lang)}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-dot" style={{ background: '#38BDF8' }}></span>
                <span>{t('LPG Liquefaction (MT)', 'এলপিজি লিকুইফেকশন (মে.টন)', lang)}</span>
              </div>
              <div className="legend-item">
                <span className="legend-target-line"></span>
                <span>{t('Daily Target (5,000 MT)', 'দৈনিক লক্ষ্যমাত্রা (৫,০০০ মে.টন)', lang)}</span>
              </div>
            </div>

            {/* Interactive SVG / CSS Chart */}
            <div className="custom-bar-chart" style={{ height: `${chartHeight}px`, position: 'relative' }}>
              {/* Target threshold guideline at 5000 MT */}
              <div
                className="target-threshold-line"
                style={{
                  top: `${chartHeight - (5000 / maxVal) * chartHeight}px`,
                }}
              >
                <span className="threshold-tag">Target: 5,000 MT</span>
              </div>

              {/* Bars container */}
              <div className="bars-flex-container">
                {PRODUCTION_DATA.map((item, idx) => {
                  const bitumenHeight = (item.bitumen / maxVal) * chartHeight;
                  const lpgHeight = (item.lpg / maxVal) * chartHeight;
                  const isHovered = hoveredDay === idx;

                  return (
                    <div
                      key={item.day}
                      className={`bar-group-col ${isHovered ? 'active' : ''}`}
                      onMouseEnter={() => setHoveredDay(idx)}
                    >
                      <div className="bar-track" style={{ height: `${chartHeight}px` }}>
                        <div
                          className="bar-fill bitumen-bar"
                          style={{
                            height: `${bitumenHeight}px`,
                            background: isHovered
                              ? 'linear-gradient(180deg, #C8102E 0%, #7F1424 100%)'
                              : 'linear-gradient(180deg, #A51C30 0%, #060D1F 100%)',
                          }}
                        >
                          <span className="bar-tooltip-val">{item.bitumen.toLocaleString()}</span>
                        </div>
                        <div
                          className="bar-fill lpg-bar"
                          style={{
                            height: `${lpgHeight}px`,
                            background: isHovered
                              ? 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)'
                              : 'linear-gradient(180deg, #0284C7 0%, #0c4a6e 100%)',
                          }}
                        />
                      </div>
                      <div className="bar-x-label">{lang === 'en' ? item.day : item.dayBn}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail pill for hovered day */}
            <div className="chart-day-detail-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="day-name">{lang === 'en' ? currentHover.day : currentHover.dayBn} Metric:</span>
                <span className="metric-pill">
                  Bitumen: <strong>{currentHover.bitumen.toLocaleString()} MT</strong>
                </span>
                <span className="metric-pill">
                  LPG: <strong>{currentHover.lpg.toLocaleString()} MT</strong>
                </span>
              </div>
              <div className="efficiency-badge">
                <TrendingUp size={12} color="#059669" />
                <span>Operating Efficiency: <strong>{currentHover.efficiency}%</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Tank Farm Capacities Live Gauge */}
          <div className="tank-farm-sidebar">
            <div className="tank-sidebar-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: 'var(--brand-slate-900)' }}>
                <Database size={13} color="var(--brand-crimson)" />
                <span>{t('Storage Tank Farm Status', 'স্টোরেজ ট্যাঙ্ক ফার্ম স্ট্যাটাস', lang)}</span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--status-success)', fontWeight: 600 }}>● 4/4 Normal</span>
            </div>

            <div className="tanks-list">
              {TANKS.map((tank) => (
                <div key={tank.id} className="tank-item-card">
                  <div className="tank-meta-row">
                    <div>
                      <div className="tank-id-tag">{tank.id} · {tank.name}</div>
                      <div className="tank-temp-sub">Temp: {tank.temp} · Cap: {tank.capacity}</div>
                    </div>
                    <div className="tank-pct-number" style={{ color: tank.color }}>
                      {tank.fillPercent}%
                    </div>
                  </div>

                  {/* Progress track */}
                  <div className="tank-progress-track">
                    <div
                      className="tank-progress-fill"
                      style={{
                        width: `${tank.fillPercent}%`,
                        backgroundColor: tank.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
