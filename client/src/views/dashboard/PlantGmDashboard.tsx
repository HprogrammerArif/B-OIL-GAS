import { useEffect, useState } from 'react';
import { Check, Lock, Plus, X } from 'lucide-react';
import { t, type Lang } from '../../types';
import { showToast } from '../../components/ToastManager';
import { Button, Modal } from '../../components/ui';
import RefineryOutputChart from '../../components/RefineryOutputChart';
import PlantSafety from './PlantSafety';
import type { DashboardSubViewProps } from './types';

interface PlantGmDashboardProps extends DashboardSubViewProps {
  showBatchReleaseModal?: boolean;
  setShowBatchReleaseModal?: (show: boolean) => void;
}

interface LabTest {
  id: string;
  name: string;
  result: string;
}

const BATCH_NO = 'BOGCL-BIT-2026-B88';
const SEED_PRODUCT = 'Bitumen 60/70';
const SEED_VOLUME = '2,400';

function seedTests(lang: Lang): LabTest[] {
  return [
    { id: 'pen', name: t('Penetration at 25°C', '২৫°C-এ পেনিট্রেশন', lang), result: '64 dmm' },
    { id: 'soft', name: t('Softening point', 'সফটেনিং পয়েন্ট', lang), result: '51.2°C' },
    { id: 'duc', name: t('Ductility', 'ডাকটিলিটি', lang), result: '> 100 cm' },
  ];
}

function sheetError(product: string, volume: string, tests: LabTest[], lang: Lang): string | null {
  if (!product.trim()) return t('Write the product.', 'পণ্যের নাম লিখুন।', lang);
  if (!volume.trim()) return t('Write the volume.', 'পরিমাণ লিখুন।', lang);
  if (tests.length === 0) return t('Add at least one lab test.', 'কমপক্ষে একটি ল্যাব পরীক্ষা যোগ করুন।', lang);
  const blank = tests.findIndex((row) => !row.name.trim() || !row.result.trim());
  if (blank === -1) return null;
  const row = tests[blank];
  const n = blank + 1;
  if (!row.name.trim()) return t(`Test ${n} needs a name.`, `পরীক্ষা ${n}-এর নাম লিখুন।`, lang);
  return t(`${row.name.trim()} needs a result.`, `${row.name.trim()}-এর ফল লিখুন।`, lang);
}

export default function PlantGmDashboard({
  lang,
  activeTab,
  showBatchReleaseModal,
  setShowBatchReleaseModal,
}: PlantGmDashboardProps) {
  const [product, setProduct] = useState(SEED_PRODUCT);
  const [volume, setVolume] = useState(SEED_VOLUME);
  const [tests, setTests] = useState<LabTest[]>(() => seedTests(lang));
  const [error, setError] = useState<string | null>(null);

  const restore = () => {
    setProduct(SEED_PRODUCT);
    setVolume(SEED_VOLUME);
    setTests(seedTests(lang));
    setError(null);
  };

  useEffect(() => {
    if (showBatchReleaseModal) restore();
    // Re-seed only when the dialog opens, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBatchReleaseModal]);

  const close = () => {
    restore();
    setShowBatchReleaseModal?.(false);
  };

  const release = () => {
    const problem = sheetError(product, volume, tests, lang);
    if (problem) {
      setError(problem);
      return;
    }
    showToast(
      t(
        `Batch ${BATCH_NO} released (${product.trim()}, ${volume.trim()} metric tons). Loading gates are open.`,
        `ব্যাচ ${BATCH_NO} রিলিজ হয়েছে (${product.trim()}, ${volume.trim()} মেট্রিক টন)। লোডিং গেট খোলা হয়েছে।`,
        lang,
      ),
      'gold',
    );
    close();
  };

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
            <Button variant="gold" icon={<Check size={14} />} onClick={release}>
              {t('Release and sign', 'রিলিজ ও স্বাক্ষর', lang)}
            </Button>
          </>
        )}
      >
        <div className="psf-modal">
          <dl className="psf-facts">
            <div><dt>{t('Batch', 'ব্যাচ', lang)}</dt><dd>{BATCH_NO}</dd></div>
            <div>
              <dt><label htmlFor="batch-product">{t('Product', 'পণ্য', lang)}</label></dt>
              <dd>
                <input
                  id="batch-product"
                  className="form-input"
                  value={product}
                  onChange={(e) => { setProduct(e.target.value); setError(null); }}
                />
              </dd>
            </div>
            <div>
              <dt><label htmlFor="batch-volume">{t('Volume (metric tons)', 'পরিমাণ (মেট্রিক টন)', lang)}</label></dt>
              <dd>
                <input
                  id="batch-volume"
                  className="form-input"
                  value={volume}
                  onChange={(e) => { setVolume(e.target.value); setError(null); }}
                />
              </dd>
            </div>
          </dl>

          <h4>{t('Lab tests (standard BDS 1238:2020)', 'ল্যাব পরীক্ষা (মান BDS 1238:2020)', lang)}</h4>
          {error && <p className="psf-danger" role="alert">{error}</p>}
          <ul className="psf-checks">
            {tests.map((row, index) => {
              const complete = row.name.trim() !== '' && row.result.trim() !== '';
              return (
                <li key={row.id} className={`psf-test ${complete ? 'ok' : 'missing'}`}>
                  <div className="psf-test-fields">
                    <input
                      className="form-input"
                      value={row.name}
                      aria-label={t(`Test ${index + 1} name`, `পরীক্ষা ${index + 1}-এর নাম`, lang)}
                      placeholder={t('Test name', 'পরীক্ষার নাম', lang)}
                      onChange={(e) => {
                        const name = e.target.value;
                        setTests((prev) => prev.map((item) => (item.id === row.id ? { ...item, name } : item)));
                        setError(null);
                      }}
                    />
                    <input
                      className="form-input"
                      value={row.result}
                      aria-label={t(`Test ${index + 1} result`, `পরীক্ষা ${index + 1}-এর ফল`, lang)}
                      placeholder={t('Result', 'ফল', lang)}
                      onChange={(e) => {
                        const result = e.target.value;
                        setTests((prev) => prev.map((item) => (item.id === row.id ? { ...item, result } : item)));
                        setError(null);
                      }}
                    />
                    <button
                      type="button"
                      className="psf-test-remove"
                      aria-label={t('Remove test', 'পরীক্ষা সরান', lang)}
                      onClick={() => setTests((prev) => prev.filter((item) => item.id !== row.id))}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => {
              setTests((prev) => [...prev, { id: `test-${Date.now()}`, name: '', result: '' }]);
              setError(null);
            }}
          >
            {t('Add a test', 'একটি পরীক্ষা যোগ করুন', lang)}
          </Button>

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
