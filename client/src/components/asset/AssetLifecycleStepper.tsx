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
  { id: 's1', labelEn: 'CAPEX Req', labelBn: 'রিকুইজিশন', tipEn: 'Stage 1: Capital Requisition & ROI Sanction', matchStages: [], stepOrder: 1 },
  { id: 's2', labelEn: 'PO & FAT', labelBn: 'ক্রয় ও পরীক্ষা', tipEn: 'Stage 2: Procurement, FAT/SAT & GRN Inspection', matchStages: [], stepOrder: 2 },
  { id: 's3', labelEn: 'Tagged / Store', labelBn: 'ট্যাগ ও স্টোর', tipEn: 'Stage 3: SAP FI-AA Capitalized & QR Tagged in Store', matchStages: ['in_stock'], stepOrder: 3 },
  { id: 's4', labelEn: 'Active Duty', labelBn: 'সক্রিয় চালু', tipEn: 'Stage 4: Commissioned & Operational Service', matchStages: ['operational'], stepOrder: 4 },
  { id: 's5', labelEn: 'Transit / Pass', labelBn: 'স্থানান্তর', tipEn: 'Stage 5: Inter-Site or Custodian Gate-Pass Transit', matchStages: ['in_transfer'], stepOrder: 5 },
  { id: 's6', labelEn: 'PM & Audit', labelBn: 'ক্যালিব্রেশন', tipEn: 'Stage 6: Preventive Overhaul & Statutory Calibration', matchStages: ['maintenance', 'calibration_due'], stepOrder: 6 },
  { id: 's7', labelEn: 'Condemned', labelBn: 'অকেজো জরিপ', tipEn: 'Stage 7: Condemned & Pre-Disposal Safety Checklist', matchStages: ['decommissioned'], stepOrder: 7 },
  { id: 's8', labelEn: '10y Archive', labelBn: 'নিলাম আর্কাইভ', tipEn: 'Stage 8: Disposed, Written-Off & Locked in 10-Yr Archive', matchStages: ['disposed'], stepOrder: 8 },
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
          <span>{t('ISO 55001 Cradle-to-Grave Lifecycle Pipeline', 'সম্পদের পূর্ণ জীবনচক্র ধাপ (ISO 55001)', lang)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {asset.isUnderWarranty ? (
            <span className="badge success" style={{ fontSize: '10px' }}>
              <ShieldCheck size={11} /> {t('Warranty till', 'ওয়ারেন্টি:', lang)} {asset.warrantyExpiry}
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
              <Activity size={11} /> {t('RUL', 'অবশিষ্ট আয়ু', lang)}: {fin.remainingUsefulLifeYears} {t('yrs', 'বছর', lang)} ({fin.remainingUsefulLifePct}%)
            </span>
          ) : (
            <span className="badge danger" style={{ fontSize: '10px' }}>
              <Archive size={11} /> {t('10-Yr Statutory Archive', '১০-বছর সংরক্ষিত আর্কাইভ', lang)}
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
          {t('Economic Life Consumed', 'ব্যবহৃত আয়ুষ্কাল', lang)}:{' '}
          <strong>
            {asset.ageYears} / {asset.usefulLifeYears} {t('yrs', 'বছর', lang)}
          </strong>{' '}
          ({lifeConsumedPct}% · {asset.runtimeHours.toLocaleString()} hrs)
        </span>
        <span>
          MTBF: <strong>{asset.mtbfHours.toLocaleString()}h</strong> · MTTR: <strong>{asset.mttrHours}h</strong>
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
              `Economic End-of-Life Watch: Cumulative repair OPEX is ${fin.repairToCapexRatioPct}% of CAPEX (or RUL critical). Evaluate replacement or Stage-7 condemnation.`,
              `অর্থনৈতিক আয়ুষ্কাল সতর্কতা: মেরামত ব্যয় মূলধনের ${fin.repairToCapexRatioPct}%। প্রতিস্থাপন বা অকেজো ঘোষণার মূল্যায়ন করুন।`,
              lang
            )}
          </span>
        </div>
      )}
    </div>
  );
}
