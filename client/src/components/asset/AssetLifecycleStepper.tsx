import React from 'react';
import { Lang, t } from '../../types';
import { AssetRecord, calculateAssetFinancials, LifecycleStage } from '../../store/assetStore';
import { Check, Activity, ShieldCheck, AlertTriangle, Archive } from 'lucide-react';

interface AssetLifecycleStepperProps {
  asset: AssetRecord;
  lang: Lang;
}

const PIPELINE_STEPS: {
  id: string;
  labelEn: string;
  labelBn: string;
  matchStages: LifecycleStage[];
  stepOrder: number;
}[] = [
  { id: 's1', labelEn: '1. CAPEX Req', labelBn: '১. রিকুইজিশন', matchStages: [], stepOrder: 1 },
  { id: 's2', labelEn: '2. PO & FAT/SAT', labelBn: '২. ক্রয় ও পরীক্ষা', matchStages: [], stepOrder: 2 },
  { id: 's3', labelEn: '3. Tagged / Store', labelBn: '৩. ট্যাগ ও স্টোর', matchStages: ['in_stock'], stepOrder: 3 },
  { id: 's4', labelEn: '4. Active Duty', labelBn: '৪. সক্রিয় চালু', matchStages: ['operational'], stepOrder: 4 },
  { id: 's5', labelEn: '5. Custody / Transit', labelBn: '৫. স্থানান্তর', matchStages: ['in_transfer'], stepOrder: 5 },
  { id: 's6', labelEn: '6. PM & Calibration', labelBn: '৬. ক্যালিব্রেশন', matchStages: ['maintenance', 'calibration_due'], stepOrder: 6 },
  { id: 's7', labelEn: '7. Condemned', labelBn: '৭. অকেজো ঘোষণা', matchStages: ['decommissioned'], stepOrder: 7 },
  { id: 's8', labelEn: '8. Disposed Archive', labelBn: '৮. নিলাম ও আর্কাইভ', matchStages: ['disposed'], stepOrder: 8 },
];

function getActiveStepOrder(stage: LifecycleStage): number {
  switch (stage) {
    case 'in_stock':
      return 3;
    case 'operational':
      return 4;
    case 'in_transfer':
      return 5;
    case 'maintenance':
    case 'calibration_due':
      return 6;
    case 'decommissioned':
      return 7;
    case 'disposed':
      return 8;
  }
}

export default function AssetLifecycleStepper({ asset, lang }: AssetLifecycleStepperProps) {
  const fin = calculateAssetFinancials(asset);
  const activeOrder = getActiveStepOrder(asset.lifecycleStage);

  const healthColor =
    asset.lifecycleStage === 'disposed'
      ? 'var(--brand-slate-400)'
      : asset.healthScore >= 85
      ? '#059669'
      : asset.healthScore >= 60
      ? '#D97706'
      : '#DC2626';

  return (
    <div
      style={{
        background: 'var(--brand-slate-50, #F8FAFC)',
        border: '1px solid var(--brand-slate-200)',
        borderRadius: '10px',
        padding: '12px 14px',
        marginBottom: '14px',
      }}
    >
      {/* Top Row: Lifecycle Title + Warranty & Health Telemetry */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--brand-slate-600)' }}>
          🔄 {t('ISO 55001 Cradle-to-Grave Lifecycle Stage', 'সম্পদের পূর্ণ জীবনচক্র ধাপ (ISO 55001)', lang)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {asset.isUnderWarranty ? (
            <span className="badge success" style={{ fontSize: '10px' }}>
              <ShieldCheck size={11} /> {t('OEM Warranty till', 'ওয়ারেন্টি:', lang)} {asset.warrantyExpiry}
            </span>
          ) : (
            <span className="badge" style={{ fontSize: '10px', background: 'var(--brand-slate-200)', color: 'var(--brand-slate-600)' }}>
              {t('Post-Warranty / AMC', 'ওয়ারেন্টি উত্তীর্ণ', lang)}
            </span>
          )}

          {asset.lifecycleStage !== 'disposed' ? (
            <span
              className="badge"
              style={{
                fontSize: '10px',
                background: `${healthColor}18`,
                color: healthColor,
                fontWeight: 800,
              }}
            >
              <Activity size={11} /> {t('Health', 'স্বাস্থ্য', lang)}: {asset.healthScore}% · RUL: {fin.remainingUsefulLifeYears}y
            </span>
          ) : (
            <span className="badge danger" style={{ fontSize: '10px' }}>
              <Archive size={11} /> {t('10-Yr Statutory Archive', '১০-বছর সংরক্ষিত আর্কাইভ', lang)}
            </span>
          )}
        </div>
      </div>

      {/* 8-Stage Visual Pipeline Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          marginBottom: '10px',
        }}
      >
        {PIPELINE_STEPS.map((step) => {
          const isCurrent = step.stepOrder === activeOrder;
          const isCompleted =
            step.stepOrder < activeOrder &&
            !(step.stepOrder === 5 && activeOrder === 6) &&
            !(step.stepOrder === 6 && activeOrder === 7 && asset.cumulativeMaintenanceOpex === 0);

          const isWarnCurrent =
            isCurrent &&
            (asset.lifecycleStage === 'calibration_due' ||
              asset.lifecycleStage === 'maintenance' ||
              asset.lifecycleStage === 'decommissioned');

          return (
            <div
              key={step.id}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: isCurrent ? 800 : 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                border: isCurrent
                  ? `1.5px solid ${isWarnCurrent ? '#DC2626' : 'var(--brand-crimson)'}`
                  : '1px solid var(--brand-slate-200)',
                background: isCurrent
                  ? isWarnCurrent
                    ? 'rgba(220, 38, 38, 0.1)'
                    : 'rgba(165, 28, 48, 0.1)'
                  : isCompleted
                  ? 'rgba(5, 150, 105, 0.08)'
                  : 'var(--brand-card-bg)',
                color: isCurrent
                  ? isWarnCurrent
                    ? '#DC2626'
                    : 'var(--brand-crimson)'
                  : isCompleted
                  ? '#059669'
                  : 'var(--brand-slate-400)',
              }}
            >
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  flexShrink: 0,
                  background: isCurrent
                    ? isWarnCurrent
                      ? '#DC2626'
                      : 'var(--brand-crimson)'
                    : isCompleted
                    ? '#059669'
                    : 'var(--brand-slate-200)',
                  color: isCurrent || isCompleted ? '#fff' : 'var(--brand-slate-500)',
                }}
              >
                {isCompleted ? <Check size={9} /> : step.stepOrder}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t(step.labelEn, step.labelBn, lang)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Reliability & Useful Life Progress Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--brand-slate-500)', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
        <span>
          {t('Age vs Useful Life', 'বয়স বনাম আয়ুষ্কাল', lang)}: <strong>{asset.ageYears} / {asset.usefulLifeYears} {t('yrs', 'বছর', lang)}</strong> ({asset.runtimeHours.toLocaleString()} hrs)
        </span>
        <span>
          MTBF: <strong>{asset.mtbfHours.toLocaleString()}h</strong> · MTTR: <strong>{asset.mttrHours}h</strong>
        </span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'var(--brand-slate-200)', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(6, (asset.ageYears / Math.max(1, asset.usefulLifeYears)) * 100))}%`,
            height: '100%',
            background: fin.isEconomicEoLCandidate
              ? '#DC2626'
              : fin.remainingUsefulLifePct <= 25
              ? '#D97706'
              : '#059669',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {fin.isEconomicEoLCandidate && asset.lifecycleStage !== 'decommissioned' && asset.lifecycleStage !== 'disposed' && (
        <div
          style={{
            marginTop: '8px',
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            color: '#B91C1C',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={13} />
          <span>
            {t(
              `Economic EoL Alert: Repair-to-CAPEX ratio is ${fin.repairToCapexRatioPct}% (or RUL critical). Evaluate condemnation/replacement.`,
              `অর্থনৈতিক আয়ুষ্কাল সতর্কতা: মেরামত ব্যয় মূলধনের ${fin.repairToCapexRatioPct}%। প্রতিস্থাপন বা অকেজো ঘোষণার মূল্যায়ন করুন।`,
              lang
            )}
          </span>
        </div>
      )}
    </div>
  );
}

