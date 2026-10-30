import React, { useState } from 'react';
import { t, Lang } from '../types';
import { showToast } from '../App';
import { Megaphone, X } from 'lucide-react';
import { useNoticeStore } from '../store/noticeStore';

interface BroadcastModalProps {
  onClose: () => void;
  lang?: Lang;
}

export default function BroadcastModal({ onClose, lang = 'en' }: BroadcastModalProps) {
  const { addBroadcast } = useNoticeStore();
  const [title, setTitle] = useState('180 Days Accident-Free Milestone at Keraniganj Plant');
  const [body, setBody] = useState(
    'Alhamdulillah, Bashundhara Oil & Gas has completed 180 straight days with zero workplace injuries at Keraniganj Plant. Thank you to every engineer, operator, driver, and office team member for keeping safety first every day.'
  );
  const [ack, setAck] = useState(true);
  const [sms, setSms] = useState(true);

  const handleBroadcast = () => {
    if (!title.trim() || !body.trim()) {
      showToast(t('Please enter both a title and a message.', 'অনুগ্রহ করে শিরোনাম ও বার্তা লিখুন।', lang), 'warn');
      return;
    }
    addBroadcast({
      title: title.trim(),
      body: body.trim(),
      requireAck: ack,
      sendSms: sms,
      author: 'Ahmed Akbar Sobhan',
      authorRole: 'Chairman & Managing Director',
    });
    onClose();
    setTimeout(() => {
      showToast(
        t(
          'Announcement sent to all 788 employees & pinned to the Company Notice Board.',
          'সকল ৭৮৮ জন কর্মীর কাছে ঘোষণা পাঠানো হয়েছে এবং নোটিশ বোর্ডে পিন করা হয়েছে।',
          lang
        ),
        'gold'
      );
    }, 150);
  };

  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hd">
          <h3>
            <span>📢</span> {t("Chairman's Company-Wide Announcement", 'চেয়ারম্যানের বিশেষ প্রাতিষ্ঠানিক ঘোষণা', lang)}
          </h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '12px', color: 'var(--brand-slate-500)', marginBottom: '16px', lineHeight: 1.5 }}>
            {t(
              'This message will appear immediately as a top banner across every employee screen and will also be saved at the top of the Company Notice Board.',
              'এই ঘোষণাটি তাৎক্ষণিকভাবে সকল কর্মীর স্ক্রিনের উপরে প্রদর্শিত হবে এবং কোম্পানির নোটিশ বোর্ডে সংরক্ষিত থাকবে।',
              lang
            )}
          </p>

          <div className="form-group">
            <label>{t('Announcement Title', 'ঘোষণার শিরোনাম', lang)}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label>{t('Announcement Message (English / বাংলা)', 'বার্তার বিস্তারিত (English / বাংলা)', lang)}</label>
            <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px 20px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12.5px' }}>
              <input type="checkbox" checked={ack} onChange={() => setAck((v) => !v)} />
              {t('Ask staff to click Acknowledge', 'পঠিত নিশ্চিতকরণ বাটন যুক্ত করুন', lang)}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12.5px' }}>
              <input type="checkbox" checked={sms} onChange={() => setSms((v) => !v)} />
              {t('Also send mobile SMS alert', 'মোবাইলে এসএমএস সতর্কবার্তা পাঠান', lang)}
            </label>
          </div>

          <div style={{ background: 'var(--brand-gold-muted)', border: '1px solid var(--brand-gold)', borderRadius: 'var(--radius-sm)', padding: '10px 13px', marginTop: '10px', fontSize: '12px', color: 'var(--brand-gold-dark)' }}>
            📌 <strong>{t('Instant Delivery:', 'তাৎক্ষণিক প্রচার:', lang)}</strong>{' '}
            {t(
              'Reaches all 788 employees across Baridhara Head Office, Keraniganj Plant, and Chattogram Depot.',
              'বারিধারা প্রধান কার্যালয়, কেরানীগঞ্জ প্ল্যান্ট ও চট্টগ্রাম ডিপোর সকল কর্মীর কাছে পৌঁছাবে।',
              lang
            )}
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn-sm-ghost" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
          <button className="btn-primary" onClick={handleBroadcast}>
            <Megaphone size={14} />
            {t('Send Announcement to All Staff', 'সকল কর্মীর কাছে পাঠান', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
