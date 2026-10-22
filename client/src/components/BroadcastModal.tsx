import React, { useState } from 'react';
import { t, Lang } from '../types';
import { showToast } from '../App';
import { Megaphone, X } from 'lucide-react';

export default function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('BOGCL Q4 Refinery Milestone & Safety Commendation');
  const [body, setBody] = useState('Alhamdulillah, Bashundhara Oil & Gas has reached 180 consecutive days of zero Lost-Time Injury (LTI) at Keraniganj Plant. Every employee\'s commitment to safety reflects the core legacy of Bashundhara Group. May Allah bless our continued journey of excellence.');
  const [ack, setAck] = useState(true);
  const [sms, setSms] = useState(true);

  const handleBroadcast = () => {
    onClose();
    setTimeout(() => showToast('✅ Chairman Broadcast published to all 847 BOGCL employees across 6 locations.', 'gold'), 200);
  };

  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hd">
          <h3><span>👑</span> Chairman's Direct Executive Broadcast</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '12px', color: 'var(--brand-slate-500)', marginBottom: '16px', lineHeight: 1.5 }}>
            This broadcast will appear as a <strong>priority full-screen modal</strong> on every employee's app and desktop portal across all BOGCL plants, depots, and corporate offices. 
            Sent to <strong style={{ color: 'var(--brand-crimson)' }}>847 employees</strong> across 6 locations.
          </p>

          <div className="form-group">
            <label>Message Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Executive Message (English / বাংলায় লিখুন)</label>
            <textarea rows={4} value={body} onChange={e => setBody(e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px 20px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12.5px' }}>
              <input type="checkbox" checked={ack} onChange={() => setAck(v => !v)} />
              Require Read Acknowledgement
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12.5px' }}>
              <input type="checkbox" checked={sms} onChange={() => setSms(v => !v)} />
              Send Priority SMS Alert
            </label>
          </div>

          <div style={{ background: 'var(--brand-gold-muted)', border: '1px solid var(--brand-gold)', borderRadius: 'var(--radius-sm)', padding: '10px 13px', marginTop: '10px', fontSize: '12px', color: 'var(--brand-gold-dark)' }}>
            🛡️ This broadcast will be sealed with a cryptographic timestamp and stored permanently in the Chairman's Message Archive.
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn-sm-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleBroadcast}>
            <Megaphone size={14} />
            Broadcast to Entire Group
          </button>
        </div>
      </div>
    </div>
  );
}
