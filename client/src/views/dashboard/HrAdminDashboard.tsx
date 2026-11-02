import { UserCheck, Building2, Users } from 'lucide-react';
import { t, type AppView } from '../../types';
import { useEmployeeStore, type Employee } from '../../store/employeeStore';
import { EmptyState } from '../../components/ui';
import { DashboardSubViewProps } from './types';

interface HrAdminDashboardProps extends DashboardSubViewProps {
  onNavigate?: (view: AppView) => void;
}

const SITES: { id: Employee['assignedSite']; name: [string, string]; address: [string, string]; tone: string }[] = [
  { id: 'HQ_BARIDHARA', name: ['Bashundhara Dhaka HQ', 'বসুন্ধরা ঢাকা সদর দপ্তর'], address: ['Plot-3, Block-G, Umme Kulsum Road, Baridhara', 'প্লট-৩, ব্লক-জি, উম্মে কুলসুম রোড, বারিধারা'], tone: 'var(--status-success)' },
  { id: 'PLANT_KERANIGANJ', name: ['Keraniganj Bitumen Refinery', 'কেরানীগঞ্জ বিটুমিন রিফাইনারি'], address: ['Industrial Area, Dhaleshwari River Corridor', 'শিল্প এলাকা, ধলেশ্বরী নদী করিডোর'], tone: 'var(--status-info)' },
  { id: 'TERMINAL_CTG', name: ['Chattogram Marine Bulk Terminal', 'চট্টগ্রাম মেরিন বাল্ক টার্মিনাল'], address: ['Guptakhal, Patenga River Jetty', 'গুপ্তখাল, পতেঙ্গা নদী জেটি'], tone: 'var(--status-warning)' },
];

type ClearanceFlag = 'itAccessRevoked' | 'rfidGateBadgeSurrendered' | 'vehicleFuelCardReturned' | 'financeAccountsSettled';

const CLEARANCE_STEPS: { key: ClearanceFlag; label: [string, string] }[] = [
  { key: 'itAccessRevoked', label: ['IT accounts revoked', 'আইটি অ্যাকাউন্ট বাতিল'] },
  { key: 'rfidGateBadgeSurrendered', label: ['Gate badge surrendered', 'গেট ব্যাজ জমা'] },
  { key: 'vehicleFuelCardReturned', label: ['Vehicle & fuel card returned', 'গাড়ি ও জ্বালানি কার্ড ফেরত'] },
  { key: 'financeAccountsSettled', label: ['Finance settled', 'অর্থ নিষ্পত্তি'] },
];

export default function HrAdminDashboard({ lang, activeTab, onNavigate }: HrAdminDashboardProps) {
  const { employees } = useEmployeeStore();

  const withClearance = employees.filter((e) => e.clearance);
  const clearedCount = (e: Employee) => CLEARANCE_STEPS.filter((s) => e.clearance?.[s.key]).length;
  const inProgress = withClearance.filter((e) => clearedCount(e) < CLEARANCE_STEPS.length);
  const completed = withClearance.filter((e) => clearedCount(e) === CLEARANCE_STEPS.length).slice(0, 3);
  const active = employees.filter((e) => e.status !== 'offboarded');

  const renderEmployee = (e: Employee) => {
    const done = clearedCount(e);
    return (
      <div key={e.id} style={{ background: 'var(--surface-0)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <strong style={{ fontSize: '13.5px', color: 'var(--text-1)' }}>{t(e.name, e.nameBn ?? e.name, lang)}</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: '8px' }}>{e.id} · {t(e.designation, e.designationBn ?? e.designation, lang)}</span>
          </div>
          <span className={`badge ${done === CLEARANCE_STEPS.length ? 'success' : 'warn'}`}>
            {t(`${done}/${CLEARANCE_STEPS.length} cleared`, `${done.toLocaleString('bn-BD')}/${CLEARANCE_STEPS.length.toLocaleString('bn-BD')} সম্পন্ন`, lang)}
          </span>
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-2)', marginBottom: '10px' }}>
          {e.exitDate ? t(`Exit date: ${e.exitDate}`, `বিদায়ের তারিখ: ${e.exitDate}`, lang) : t('Exit date pending', 'বিদায়ের তারিখ নির্ধারিত নয়', lang)}
          {e.exitReason ? ` · ${e.exitReason}` : ''}
          {e.clearance?.clearedAt ? ` · ${t('Cleared', 'ছাড়পত্র', lang)} ${e.clearance.clearedAt}` : ''}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', fontSize: '10.5px' }}>
          {CLEARANCE_STEPS.map((s) => {
            const ok = !!e.clearance?.[s.key];
            return (
              <div
                key={s.key}
                style={{
                  background: ok ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${ok ? 'var(--status-success-border)' : 'var(--status-warning-border)'}`,
                  color: ok ? 'var(--status-success-text)' : 'var(--status-warning-text)',
                }}
              >
                {ok ? '✓' : '⏳'} {t(s.label[0], s.label[1], lang)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {activeTab === 'clearance' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><UserCheck size={16} color="var(--brand-crimson)" /></div>
              <div>
                <div className="card-title">{t('Exit clearances', 'বহির্গমন ছাড়পত্র', lang)}</div>
                <div className="card-subtitle">{t('Four-way sign-off: IT · Security · Fleet · Finance', '৪-ধাপ স্বাক্ষর: আইটি · নিরাপত্তা · পরিবহন · অর্থ', lang)}</div>
              </div>
            </div>
            <span className={`badge ${inProgress.length > 0 ? 'warn' : 'success'}`}>
              {t(`${inProgress.length} in progress`, `${inProgress.length.toLocaleString('bn-BD')}টি চলমান`, lang)}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inProgress.length === 0 && completed.length === 0 ? (
              <EmptyState
                compact
                icon={<UserCheck size={24} />}
                title={t('No clearances open', 'কোনো ছাড়পত্র চলমান নেই', lang)}
                description={t('Start an exit clearance from an employee record in Workforce.', 'ওয়ার্কফোর্সে কর্মীর রেকর্ড থেকে ছাড়পত্র শুরু করুন।', lang)}
              />
            ) : (
              <>
                {inProgress.map(renderEmployee)}
                {completed.length > 0 && (
                  <>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '4px' }}>
                      {t('Recently completed', 'সম্প্রতি সম্পন্ন', lang)}
                    </div>
                    {completed.map(renderEmployee)}
                  </>
                )}
              </>
            )}
            <div style={{ textAlign: 'right' }}>
              <button className="btn-outline" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => onNavigate?.('workforce')}>
                {t('Open workforce directory →', 'কর্মী ডিরেক্টরি খুলুন →', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sites' && (
        <div className="card mb-5 tab-pane-fade">
          <div className="card-hd">
            <div className="card-hd-left">
              <div className="card-hd-icon"><Building2 size={16} /></div>
              <div>
                <div className="card-title">{t('Headcount by site', 'কর্মস্থল অনুযায়ী জনবল', lang)}</div>
                <div className="card-subtitle">{t('Active personnel on record across three sites', 'তিনটি কর্মস্থলে সক্রিয় কর্মী', lang)}</div>
              </div>
            </div>
            <span className="badge info">{active.length} {t('active', 'সক্রিয়', lang)}</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SITES.map((site) => {
                const staff = active.filter((e) => e.assignedSite === site.id);
                const depts = Array.from(new Set(staff.map((e) => e.dept))).slice(0, 3).join(', ');
                return (
                  <div key={site.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--surface-0)', border: '1px solid var(--border-1)', borderRadius: '6px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--text-1)' }}>{t(site.name[0], site.name[1], lang)}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t(site.address[0], site.address[1], lang)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: site.tone, display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <Users size={14} /> {staff.length} {t('staff', 'জন', lang)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{depts || t('No staff assigned', 'কোনো কর্মী নেই', lang)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
