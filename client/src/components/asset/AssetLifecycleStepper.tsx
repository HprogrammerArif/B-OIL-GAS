import React from 'react';
import { Lang, t } from '../../types';
import { AssetRecord, calculateAssetFinancials, LifecycleStage } from '../../store/assetStore';
import { Check, Activity, ShieldCheck, AlertTriangle, Archive, GitCommit } from 'lucide-react';

interface AssetLifecycleStepperProps {
  asset: AssetRecord;
  lang: Lang;
}

const PIPELINE_STEPS: {
  id: string;
  labelEn: string;
  labelBn: string;
  tipEn: string;
  matchStages: LifecycleStage[];
  stepOrder: number;
}[] = [
  { id: 's1', labelEn: '1. Requisition', labelBn: '১. রিকুইজিশন', tipEn: 'Step 1: Purchase request and budget approval', matchStages: [], stepOrder: 1 },
  { id: 's2', labelEn: '2. Purchased', labelBn: '২. ক্রয় ও পরিদর্শন', tipEn: 'Step 2: Bought and quality inspection verified', matchStages: [], stepOrder: 2 },
  { id: 's3', labelEn: '3. In Warehouse', labelBn: '৩. স্টোর পুল', tipEn: 'Step 3: Barcode tagged and stored in warehouse', matchStages: ['in_stock'], stepOrder: 3 },
  { id: 's4', labelEn: '4. Active Service', labelBn: '৪. সক্রিয় চালু', tipEn: 'Step 4: Installed and running in production', matchStages: ['operational'], stepOrder: 4 },
  { id: 's5', labelEn: '5. In Transit', labelBn: '৫. স্থানান্তরধীন', tipEn: 'Step 5: Moving between plant facilities', matchStages: ['in_transfer'], stepOrder: 5 },
  { id: 's6', labelEn: '6. Servicing', labelBn: '৬. সার্ভিস ও পরীক্ষা', tipEn: 'Step 6: Under routine servicing or safety calibration', matchStages: ['maintenance', 'calibration_due'], stepOrder: 6 },
  { id: 's7', labelEn: '7. Retired', labelBn: '৭. অবসরপ্রাপ্ত', tipEn: 'Step 7: Declared worn out and ready for scrap', matchStages: ['decommissioned'], stepOrder: 7 },
  { id: 's8', labelEn: '8. Scrapped', labelBn: '৮. নিলাম/স্ক্র্যাপ', tipEn: 'Step 8: Sold or recycled with permanent audit record', matchStages: ['disposed'], stepOrder: 8 },
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
  const lifeConsumedPct = Math.min(100, Math.max(5, Math.round((asset.ageYears / Math.max(1, asset.usefulLifeYears)) * 100)));

  const healthColor =
    asset.lifecycleStage === 'disposed'
      ? '#64748B'
      : asset.healthScore >= 85
      ? '#059669'
      : asset.healthScore >= 60
      ? '#D97706'
      : '#DC2626';

  return (
    <div className="eam-stepper-card">
      {/* Header Row */}
      <div className="eam-stepper-hd">
        <div className="eam-stepper-title">
          <GitCommit size={14} style={{ color: 'var(--brand-crimson)' }} />
          <span>{t('Equipment Lifetime Progress (8 Stages)', 'সম্পদের পূর্ণ জীবনচক্র ধাপ (৮টি পর্যায়)', lang)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {asset.isUnderWarranty ? (
            <span className="badge success" style={{ fontSize: '10px' }}>
              <ShieldCheck size={11} /> {t('Warranty active till', 'ওয়ারেন্টি সক্রিয়:', lang)} {asset.warrantyExpiry}
            </span>
          ) : (
            <span className="badge" style={{ fontSize: '10px', background: 'var(--brand-slate-200)', color: 'var(--brand-slate-600)' }}>
              {t('Warranty Expired', 'ওয়ারেন্টি শেষ', lang)}
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
              <Activity size={11} /> {t('Est. Remaining Life', 'অবশিষ্ট আয়ু', lang)}: {fin.remainingUsefulLifeYears} {t('yrs', 'বছর', lang)} ({fin.remainingUsefulLifePct}%)
            </span>
          ) : (
            <span className="badge danger" style={{ fontSize: '10px' }}>
              <Archive size={11} /> {t('Permanent Archive Record', 'সংরক্ষিত স্থায়ী রেকর্ড', lang)}
            </span>
          )}
        </div>
      </div>

      {/* 8-Stage Connected Pipeline Nodes */}
      <div className="eam-stepper-track">
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

          const cls = [
            'eam-step-node',
            isCompleted ? 'completed' : '',
            isCurrent ? 'current' : '',
            isWarnCurrent ? 'warn' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={step.id} className={cls} title={step.tipEn}>
              <div className="eam-step-circle">
                {isCompleted ? <Check size={11} strokeWidth={3} /> : step.stepOrder}
              </div>
              <div className="eam-step-lbl">{t(step.labelEn, step.labelBn, lang)}</div>
            </div>
          );
        })}
      </div>

      {/* Useful Life & Reliability Progress Meter */}
      <div className="eam-life-meter-row">
        <span>
          {t('Expected Lifespan Used', 'ব্যবহৃত আয়ুষ্কাল', lang)}:{' '}
          <strong>
            {asset.ageYears} of {asset.usefulLifeYears} {t('years', 'বছর', lang)}
          </strong>{' '}
          ({lifeConsumedPct}% used · {asset.runtimeHours.toLocaleString()} running hrs)
        </span>
        <span>
          Avg. Run Between Repairs: <strong>{asset.mtbfHours.toLocaleString()}h</strong>
        </span>
      </div>

      <div className="eam-life-bar">
        <div
          style={{
            width: `${lifeConsumedPct}%`,
            height: '100%',
            borderRadius: '99px',
            background: fin.isEconomicEoLCandidate
              ? 'linear-gradient(90deg, #D97706, #DC2626)'
              : fin.remainingUsefulLifePct <= 25
              ? '#D97706'
              : 'linear-gradient(90deg, #059669, #10B981)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {fin.isEconomicEoLCandidate && asset.lifecycleStage !== 'decommissioned' && asset.lifecycleStage !== 'disposed' && (
        <div
          style={{
            marginTop: '9px',
            padding: '7px 11px',
            borderRadius: '8px',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            color: '#DC2626',
            fontSize: '11.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>
            {t(
              `High Repair Cost Warning: Total repair costs have reached ${fin.repairToCapexRatioPct}% of the original purchase price. Consider retiring or replacing this machine.`,
              `অতিরিক্ত মেরামত ব্যয় সতর্কতা: মোট মেরামত ব্যয় মূল মূলধনের ${fin.repairToCapexRatioPct}%-এ পৌঁছেছে। প্রতিস্থাপন বা অবসরের বিবেচনা করুন।`,
              lang
            )}
          </span>
        </div>
      )}
    </div>
  );
}
