import { useState, type FormEvent } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { t, type Lang } from '../../types';
import { Button, EmptyState, FormField, Modal, StatusPill, type StatusTone } from '../../components/ui';

export type TollStatus = 'pending' | 'approved' | 'reimbursed';

export interface TollSlip {
  id: string;
  plaza: string;
  amount: number;
  time: string;
  status: TollStatus;
}

/** Standard plaza rates; picking a plaza fills the amount. */
export const TOLL_PLAZAS: ReadonlyArray<{ name: string; rate: number }> = [
  { name: 'Babubazar Buriganga Second Bridge', rate: 150 },
  { name: 'Mayor Hanif Flyover (Dhaka Exit)', rate: 260 },
  { name: 'Postogola Buriganga Bridge', rate: 120 },
  { name: 'Padma Bridge Expressway Tolling Point', rate: 450 },
  { name: 'Meghna Ghat Bridge Plaza', rate: 200 },
];

const STATUS: Record<TollStatus, { label: readonly [string, string]; tone: StatusTone }> = {
  pending: { label: ['Waiting for the desk', 'ডেস্কের অপেক্ষায়'], tone: 'warn' },
  approved: { label: ['Approved', 'অনুমোদিত'], tone: 'success' },
  reimbursed: { label: ['Paid back', 'ফেরত দেওয়া হয়েছে'], tone: 'success' },
};

/** The driver's toll receipts and where each one stands. */
export function TollSlipList({ lang, slips, onAdd }: { lang: Lang; slips: TollSlip[]; onAdd: () => void }) {
  const waiting = slips.filter((s) => s.status === 'pending');
  const waitingTotal = waiting.reduce((sum, s) => sum + s.amount, 0);

  return (
    <section className="tab-pane-fade dash-section" aria-labelledby="toll-title">
      <header className="dash-sec-head">
        <div>
          <h3 id="toll-title">{t('Toll slips', 'টোল স্লিপ', lang)}</h3>
          <p>{t('Receipts for tolls you paid on trips. The transport desk checks them and pays you back.', 'ট্রিপে দেওয়া টোলের রসিদ। পরিবহন ডেস্ক যাচাই করে টাকা ফেরত দেবে।', lang)}</p>
        </div>
        <div className="cn-head-actions">
          {waiting.length > 0 && (
            <StatusPill tone="warn">{t(`৳${waitingTotal} waiting`, `৳${waitingTotal.toLocaleString('bn-BD')} অপেক্ষমান`, lang)}</StatusPill>
          )}
          <Button size="sm" icon={<Plus size={13} />} onClick={onAdd}>{t('Add slip', 'স্লিপ যোগ', lang)}</Button>
        </div>
      </header>

      {slips.length === 0 ? (
        <EmptyState
          compact
          icon={<Receipt size={20} />}
          title={t('No toll slips yet', 'এখনো কোনো টোল স্লিপ নেই', lang)}
          description={t('Add a slip after you pay a toll on a trip.', 'ট্রিপে টোল দিলে এখানে স্লিপ যোগ করুন।', lang)}
        />
      ) : (
        <ul className="ts-list">
          {slips.map((s) => (
            <li key={s.id} className="ts-item">
              <div className="ts-main">
                <strong>{s.plaza}</strong>
                <small>{s.time} · <code>{s.id}</code></small>
              </div>
              <span className="ts-amount">৳{s.amount.toLocaleString('en-IN')}</span>
              <StatusPill tone={STATUS[s.status].tone}>{t(STATUS[s.status].label[0], STATUS[s.status].label[1], lang)}</StatusPill>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Submit a toll slip for the current trip. */
export function TollModal({ lang, onClose, onSubmit }: { lang: Lang; onClose: () => void; onSubmit: (plaza: string, amount: number) => void }) {
  const [plaza, setPlaza] = useState(TOLL_PLAZAS[0].name);
  const [amount, setAmount] = useState(String(TOLL_PLAZAS[0].rate));
  const [tried, setTried] = useState(false);
  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0;

  const pick = (name: string) => {
    setPlaza(name);
    const rate = TOLL_PLAZAS.find((p) => p.name === name)?.rate;
    if (rate) setAmount(String(rate));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (valid) onSubmit(plaza, value);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      icon={<Receipt size={15} />}
      title={t('Add toll slip', 'টোল স্লিপ যোগ', lang)}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</Button>
          <Button type="submit" form="toll-form">{t('Submit', 'জমা দিন', lang)}</Button>
        </>
      )}
    >
      <form id="toll-form" className="psf-form" onSubmit={submit} noValidate>
        <FormField label={t('Where did you pay?', 'কোথায় টোল দিয়েছেন?', lang)}>
          {(id) => (
            <select id={id} className="form-input" value={plaza} onChange={(e) => pick(e.target.value)}>
              {TOLL_PLAZAS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          )}
        </FormField>
        <FormField
          label={t('Amount (৳)', 'পরিমাণ (৳)', lang)}
          required
          error={tried && !valid ? t('Enter the amount on the receipt.', 'রসিদের পরিমাণ লিখুন।', lang) : undefined}
          hint={t('Filled with the usual rate. Change it if your receipt shows a different amount.', 'সাধারণ হার বসানো হয়েছে। রসিদে ভিন্ন হলে বদলান।', lang)}
        >
          {(id) => <input id={id} type="number" inputMode="numeric" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} />}
        </FormField>
      </form>
    </Modal>
  );
}
