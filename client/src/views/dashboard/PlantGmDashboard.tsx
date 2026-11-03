import { Check, Lock } from 'lucide-react';
import { t } from '../../types';
import { showToast } from '../../components/ToastManager';
import { Button, Modal, StatusPill } from '../../components/ui';
import RefineryOutputChart from '../../components/RefineryOutputChart';
import PlantSafety from './PlantSafety';
import type { DashboardSubViewProps } from './types';

interface PlantGmDashboardProps extends DashboardSubViewProps {
  showBatchReleaseModal?: boolean;
  setShowBatchReleaseModal?: (show: boolean) => void;
}

const BATCH = { no: 'BOGCL-BIT-2026-B88', product: 'Bitumen 60/70', volume: '2,400' };

const LAB_TESTS: ReadonlyArray<{ label: readonly [string, string]; value: string }> = [
  { label: ['Penetration at 25°C', '২৫°C-এ পেনিট্রেশন'], value: '64 dmm' },
  { label: ['Softening point', 'সফটেনিং পয়েন্ট'], value: '51.2°C' },
  { label: ['Ductility', 'ডাকটিলিটি'], value: '> 100 cm' },
];

export default function PlantGmDashboard({
  lang,
  activeTab,
  showBatchReleaseModal,
  setShowBatchReleaseModal,
}: PlantGmDashboardProps) {
  const close = () => setShowBatchReleaseModal?.(false);

  return (
    <>
      {activeTab === 'refinery' && (
        <div className="tab-pane-fade">
          <RefineryOutputChart lang={lang} />
        </div>
      )}

      {activeTab === 'safety_loto' && <PlantSafety lang={lang} />}

      <Modal
        open={!!showBatchReleaseModal}
        onClose={close}
        title={t('Release this bitumen batch?', 'এই বিটুমিন ব্যাচ রিলিজ করবেন?', lang)}
        footer={(
          <>
            <Button variant="ghost" onClick={close}>{t('Cancel', 'বাতিল', lang)}</Button>
            <Button
              variant="gold"
              icon={<Check size={14} />}
              onClick={() => {
                showToast(t(`Batch ${BATCH.no} released. Loading gates are open.`, `ব্যাচ ${BATCH.no} রিলিজ হয়েছে। লোডিং গেট খোলা হয়েছে।`, lang), 'gold');
                close();
              }}
            >
              {t('Release and sign', 'রিলিজ ও স্বাক্ষর', lang)}
            </Button>
          </>
        )}
      >
        <div className="psf-modal">
          <dl className="psf-facts">
            <div><dt>{t('Batch', 'ব্যাচ', lang)}</dt><dd>{BATCH.no}</dd></div>
            <div><dt>{t('Product', 'পণ্য', lang)}</dt><dd>{BATCH.product}</dd></div>
            <div><dt>{t('Volume', 'পরিমাণ', lang)}</dt><dd>{BATCH.volume} {t('metric tons', 'মেট্রিক টন', lang)}</dd></div>
          </dl>

          <h4>{t('Lab tests (standard BDS 1238:2020)', 'ল্যাব পরীক্ষা (মান BDS 1238:2020)', lang)}</h4>
          <ul className="psf-checks">
            {LAB_TESTS.map((x) => (
              <li key={x.label[0]} className="ok">
                <Check size={16} />
                <span>
                  <strong>{t(x.label[0], x.label[1], lang)}: {x.value}</strong>
                  <small><StatusPill tone="success">{t('Passed', 'উত্তীর্ণ', lang)}</StatusPill></small>
                </span>
              </li>
            ))}
          </ul>

          <p className="psf-rule">
            <Lock size={13} />{' '}
            {t(
              'Signing opens tank farm dispensers 1 to 4 and sends delivery challans to the tanker contractors.',
              'স্বাক্ষর করলে ট্যাংক ফার্মের ডিসপেনসার ১ থেকে ৪ খুলবে এবং ট্যাংকার ঠিকাদারদের কাছে ডেলিভারি চালান যাবে।',
              lang,
            )}
          </p>
        </div>
      </Modal>
    </>
  );
}
