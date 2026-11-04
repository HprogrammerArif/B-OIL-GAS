import React from 'react';
import { Lang, t } from '../../types';
import { AssetRecord, calculateAssetFinancials, LifecycleStage } from '../../store/assetStore';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface AssetLifecycleStepperProps {
  asset: AssetRecord;
  lang: Lang;
}

const STAGE_META: Record<LifecycleStage, { order: number; label: [string, string] }> = {
  in_stock: { order: 3, label: ['In warehouse', 'স্টোরে রাখা'] },
  operational: { order: 4, label: ['In service', 'সক্রিয় চালু'] },
  in_transfer: { order: 5, label: ['In transit', 'স্থানান্তরধীন'] },
  calibration_due: { order: 6, label: ['Service due', 'সার্ভিস বাকি'] },
  maintenance: { order: 6, label: ['In repair', 'মেরামতাধীন'] },
  decommissioned: { order: 7, label: ['Ready to retire', 'অবসরের অপেক্ষায়'] },
  disposed: { order: 8, label: ['Retired and archived', 'অবসরপ্রাপ্ত ও সংরক্ষিত'] },
};

export default function AssetLifecycleStepper({ asset, lang }: AssetLifecycleStepperProps) {
  const fin = calculateAssetFinancials(asset);
  const meta = STAGE_META[asset.lifecycleStage] || STAGE_META.operational;
  const bn = (n: number) => (lang === 'bn' ? n.toLocaleString('bn-BD') : String(n));
  const lifeConsumedPct = Math.min(100, Math.max(5, Math.round((asset.ageYears / Math.max(1, asset.usefulLifeYears)) * 100)));

  return (
    <div className="ast-life-card">
      <div className="ast-life-top">
        <div className="inc-steps" style={{ marginTop: 0, flex: '1 1 240px' }}>
          <div className="inc-step-bars" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <span key={n} className={n <= meta.order ? 'on' : ''} />
            ))}
          </div>
          <small>
            {t(`Stage ${meta.order} of 8 · ${meta.label[0]}`, `ধাপ ${bn(meta.order)}/৮ · ${meta.label[1]}`, lang)}
            {' · '}
            {t(
              `Used ${asset.ageYears} of ${asset.usefulLifeYears} years (${lifeConsumedPct}% · ${asset.runtimeHours.toLocaleString('en-IN')} hrs run)`,
              `${bn(asset.usefulLifeYears)} বছরের মধ্যে ${bn(asset.ageYears)} বছর ব্যবহৃত (${bn(lifeConsumedPct)}%)`,
              lang,
            )}
          </small>
        </div>

        <div className="ast-life-badges">
          {asset.isUnderWarranty ? (
            <span className="badge success" style={{ fontSize: '11px' }}>
              <ShieldCheck size={11} /> {t(`Under warranty till ${asset.warrantyExpiry}`, `ওয়ারেন্টি ${asset.warrantyExpiry} পর্যন্ত`, lang)}
            </span>
          ) : (
            <span className="badge" style={{ fontSize: '11px', background: 'var(--surface-2)', color: 'var(--text-3)' }}>
              {t('Warranty ended', 'ওয়ারেন্টি শেষ', lang)}
            </span>
          )}
        </div>
      </div>

      {fin.isEconomicEoLCandidate && asset.lifecycleStage !== 'decommissioned' && asset.lifecycleStage !== 'disposed' && (
        <div className="ast-eol-warn">
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>
            {t(
              `Repairs so far equal ${fin.repairToCapexRatioPct}% of the purchase price. Consider retiring or replacing this machine.`,
              `এ পর্যন্ত মেরামত খরচ ক্রয়মূল্যের ${bn(fin.repairToCapexRatioPct)}%-এ পৌঁছেছে। অবসর বা প্রতিস্থাপন বিবেচনা করুন।`,
              lang,
            )}
          </span>
        </div>
      )}
    </div>
  );
}
