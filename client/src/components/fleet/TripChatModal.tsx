import React, { useState, useEffect, useRef } from 'react';
import { VehicleRequisition, useFleetStore } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  MessageSquare, Send, X, Users, Phone, Car, MapPin,
  Clock, Shield, User, CheckCircle2, Sparkles, PhoneCall,
  Loader2, Receipt, Check, CheckCheck
} from 'lucide-react';
import DriverCallModal from './DriverCallModal';

interface TripChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: VehicleRequisition | null;
  userRole: 'employee' | 'admin';
  lang: 'en' | 'bn';
}

export default function TripChatModal({
  isOpen,
  onClose,
  requisition,
  userRole,
  lang,
}: TripChatModalProps) {
  const { chatMessages, sendChatMessage, approveTollExpense } = useFleetStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);

  const isEmployee = userRole === 'employee';
  const currentUserName = isEmployee
    ? requisition?.requesterName || 'Tanvir Ahmed'
    : 'Md. Kamruzzaman (Transport Admin)';
  const currentUserRole = isEmployee ? 'employee' : 'admin';

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for current requisition
  const reqMessages = requisition
    ? chatMessages.filter(m => m.requisitionId === requisition.id)
    : [];

  // Scroll to bottom on new message or typing
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [reqMessages.length, isOpen, isTyping]);

  if (!isOpen || !requisition) return null;

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    sendChatMessage(
      requisition.id,
      currentUserRole,
      currentUserName,
      text,
      { messageType: 'text' }
    );
    setInputText('');

    // Simulate realistic driver response
    if (isEmployee) {
      const driverName = requisition.assignedDriverName || 'Md. Shahidul Islam';
      const vehiclePlate = requisition.assignedVehiclePlate || 'DHAKA METRO GHA-13-8821';

      setTimeout(() => {
        setIsTyping(`${driverName} (Driver)`);
      }, 900);

      setTimeout(() => {
        setIsTyping(null);
        const lower = text.toLowerCase();
        let reply = '';
        if (lower.includes('where') || lower.includes('location') || lower.includes('gate') || lower.includes('porch')) {
          reply = `Ji Tanvir Sir, I am at Baridhara Gate-1 porch with ${vehiclePlate}. AC is running at 22°C. Standing by at the main reception entrance.`;
        } else if (lower.includes('5 min') || lower.includes('down') || lower.includes('delay') || lower.includes('wait')) {
          reply = `Take your time Sir, no rush. Vehicle is parked safely in the bay.`;
        } else if (lower.includes('ac') || lower.includes('cool')) {
          reply = `AC is set to comfortable 21°C Sir. Ready for your transit.`;
        } else {
          reply = `Assalamu Alaikum Tanvir Sir, received. Vehicle ${vehiclePlate} is ready for official duty.`;
        }

        sendChatMessage(
          requisition.id,
          'driver',
          `${driverName} (Driver)`,
          reply,
          { messageType: 'text' }
        );
      }, 2400);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickReplies = isEmployee
    ? [
        t('📍 Waiting at Gate-1 porch with documents', '📍 গেট-১ এ নথিপত্র নিয়ে প্রস্তুত আছি', lang),
        t('⏳ Coming down in 5 mins from 4th floor', '⏳ ৫ মিনিটের মধ্যে নিচে নামছি', lang),
        t('❄️ Please keep AC cooling at nominal temp', '❄️ এসির তাপমাত্রা স্বাভাবিক রাখবেন', lang),
        t('🛑 Need to pick up 1 colleague at Mohakhali', '🛑 মহাখালীতে ১ জন সহকর্মীকে তুলতে হবে', lang),
      ]
    : [
        t('🟢 Gate clearance BOG-7729 authorized', '🟢 গেট পাস BOG-7729 অনুমোদিত', lang),
        t('⚠️ Heavy congestion on flyover, take outer bypass', '⚠️ ফ্লাইওভারে জ্যাম, আউটার বাইপাস ব্যবহার করুন', lang),
        t('⛽ Fuel voucher approved for 60L Octane', '⛽ ৬০ লিটার ফুয়েল স্লিপ অনুমোদিত', lang),
      ];

  return (
    <div className="modal-bg" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal"
        style={{
          maxWidth: '680px',
          width: '94%',
          height: '85vh',
          maxHeight: '750px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Car size={20} color="#FDE047" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                  {t('Trip Coordination Hub', 'ট্রিপ সমন্বয় ডায়ালগ', lang)} #{requisition.id}
                </h3>
                <span className="badge" style={{ background: '#FDE047', color: '#78350F', fontSize: '9.5px', fontWeight: 800 }}>
                  {requisition.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#BFDBFE', marginTop: '2px' }}>
                {requisition.from.split(',')[0]} ➔ {requisition.to.split(',')[0]}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {requisition.assignedDriverPhone && (
              <button
                onClick={() => setShowCallModal(true)}
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #34D399',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Direct Phone Call with Driver"
              >
                <PhoneCall size={12} />
                <span>Call Driver</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Authenticated Participant Strip */}
        <div style={{
          background: '#F8FAFC',
          padding: '8px 18px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#475569' }}>
              Logged in as: <strong>{currentUserName}</strong> ({isEmployee ? 'Staff Requisitioner' : 'Transport Admin'})
            </span>
            {requisition.assignedDriverName && (
              <span style={{ color: '#047857', fontWeight: 600 }}>
                • Driver: <strong>{requisition.assignedDriverName}</strong>
              </span>
            )}
          </div>
          {requisition.assignedVehiclePlate && (
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', background: '#E2E8F0', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px' }}>
              🚗 {requisition.assignedVehiclePlate}
            </span>
          )}
        </div>

        {/* Messages Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#FAFBFD',
        }}>
          {reqMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94A3B8' }}>
              <MessageSquare size={36} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{t('No messages yet', 'এখনও কোনো বার্তা নেই', lang)}</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                {t('Coordinate pickup point, AC preferences, or baggage requirements.', 'পিকআপ স্থান ও যাত্রা সংক্রান্ত বার্তা পাঠান।', lang)}
              </div>
            </div>
          ) : (
            reqMessages.map((m) => {
              const isMine = (isEmployee && m.senderRole === 'employee') || (!isEmployee && m.senderRole === 'admin');
              const isStaff = m.senderRole === 'employee';
              const isDriver = m.senderRole === 'driver';
              const isAdmin = m.senderRole === 'admin';
              const isSystem = m.senderRole === 'system';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    width: '100%',
                  }}
                >
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    marginBottom: '2px',
                    color: isMine ? 'var(--brand-crimson)' : isStaff ? '#1D4ED8' : isDriver ? '#047857' : isAdmin ? '#B45309' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <span>{m.senderName}</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500 }}>{m.timestamp}</span>
                  </div>

                  {m.messageType === 'toll_claim' && m.tollData ? (
                    <div style={{
                      maxWidth: '85%',
                      background: '#FFF',
                      border: '1.5px solid #F59E0B',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Receipt size={13} />
                          TOLL EXPENSE VOUCHER
                        </span>
                        <span className={`badge ${m.tollData.approved ? 'success' : 'warn'}`} style={{ fontSize: '8.5px' }}>
                          {m.tollData.approved ? '✓ Approved' : '⏳ Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
                        {m.tollData.tollName} • ৳{m.tollData.amount}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
                        Slip: {m.tollData.receiptNo}
                      </div>
                      {!isEmployee && !m.tollData.approved && (
                        <div style={{ marginTop: '6px', borderTop: '1px dashed #CBD5E1', paddingTop: '6px' }}>
                          <button
                            className="btn-primary"
                            style={{ fontSize: '10px', padding: '3px 8px', background: '#059669', borderColor: '#059669' }}
                            onClick={() => approveTollExpense(m.id, m.requisitionId, currentUserName)}
                          >
                            <Check size={11} /> Approve ৳{m.tollData.amount}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      maxWidth: '82%',
                      padding: '8px 13px',
                      borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '12px',
                      lineHeight: '1.45',
                      background: isMine
                        ? 'linear-gradient(135deg, #A51C30 0%, #871424 100%)'
                        : isStaff
                        ? '#EFF6FF'
                        : isDriver
                        ? '#ECFDF5'
                        : isSystem
                        ? '#F1F5F9'
                        : '#FEF3C7',
                      color: isMine ? '#fff' : isStaff ? '#1E3A8A' : isDriver ? '#065F46' : isSystem ? '#0F172A' : '#78350F',
                      border: isMine
                        ? 'none'
                        : isStaff
                        ? '1px solid #BFDBFE'
                        : isDriver
                        ? '1px solid #A7F3D0'
                        : isSystem
                        ? '1px solid #CBD5E1'
                        : '1px solid #FDE68A',
                      wordBreak: 'break-word',
                    }}>
                      {m.text}
                      {isMine && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px', opacity: 0.8 }}>
                          <CheckCheck size={11} color="#fff" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', fontStyle: 'italic' }}>
              <Loader2 size={12} className="animate-spin" color="var(--brand-crimson)" />
              <span>{isTyping} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        <div style={{
          padding: '6px 14px',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}>
          {quickReplies.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              style={{
                padding: '4px 9px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                background: '#fff',
                fontSize: '10px',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div style={{
          padding: '10px 16px',
          background: '#fff',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <input
            type="text"
            className="input-text"
            style={{
              flex: 1,
              height: '36px',
              fontSize: '12px',
              paddingLeft: '10px',
              borderRadius: '8px',
            }}
            placeholder={
              isEmployee
                ? t('Message driver & transport admin...', 'ড্রাইভার ও পরিবহন কর্মকর্তাকে বার্তা পাঠান...', lang)
                : t('Send official dispatch instruction...', 'দাপ্তরিক ডেসপ্যাচ নির্দেশনা দিন...', lang)
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className="btn-primary"
            style={{
              height: '36px',
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '8px',
            }}
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
          >
            <Send size={13} />
            <span>{t('Send', 'পাঠান', lang)}</span>
          </button>
        </div>
      </div>

      {/* VoIP Calling Modal */}
      {requisition.assignedDriverPhone && (
        <DriverCallModal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          calleeName={requisition.assignedDriverName || 'Driver'}
          calleeRole={`Assigned Driver • ${requisition.assignedVehiclePlate || 'Duty Vehicle'}`}
          calleePhone={requisition.assignedDriverPhone}
          lang={lang}
        />
      )}
    </div>
  );
}
