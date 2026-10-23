import React, { useState, useEffect, useRef } from 'react';
import { VehicleRequisition, useFleetStore } from '../../store/fleetStore';
import { t } from '../../types';
import { showToast } from '../../App';
import {
  MessageSquare, Send, X, Users, Phone, Car, MapPin,
  Clock, Shield, User, CheckCircle2, Sparkles
} from 'lucide-react';

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
  const { chatMessages, sendChatMessage } = useFleetStore();
  const [inputText, setInputText] = useState('');
  
  // Simulation Persona: By default matches user role, but allows switching for interactive testing
  const [activeSpeaker, setActiveSpeaker] = useState<'employee' | 'driver' | 'admin'>(
    userRole === 'employee' ? 'employee' : 'admin'
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync default speaker when role changes
  useEffect(() => {
    setActiveSpeaker(userRole === 'employee' ? 'employee' : 'admin');
  }, [userRole]);

  // Filter messages for current requisition
  const reqMessages = requisition
    ? chatMessages.filter(m => m.requisitionId === requisition.id)
    : [];

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [reqMessages.length, isOpen]);

  if (!isOpen || !requisition) return null;

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    let senderName = '';
    if (activeSpeaker === 'employee') {
      senderName = requisition.requesterName || 'Tanvir Ahmed (Staff)';
    } else if (activeSpeaker === 'driver') {
      senderName = `${requisition.assignedDriverName || 'Md. Shahidul Islam'} (Driver)`;
    } else {
      senderName = 'Md. Kamruzzaman (Transport Admin)';
    }

    sendChatMessage(requisition.id, activeSpeaker, senderName, text);
    setInputText('');

    showToast(t(
      `Message sent as ${senderName}`,
      `বার্তা পাঠানো হয়েছে (${senderName})`,
      lang
    ), 'info');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickReplies = [
    t('📍 Waiting at Gate-1 porch with documents', '📍 গেট-১ এ নথিপত্র নিয়ে প্রস্তুত আছি', lang),
    t('⏳ Coming down in 5 mins from 4th floor', '⏳ ৫ মিনিটের মধ্যে নিচে নামছি', lang),
    t('❄️ Please keep AC cooling at nominal temp', '❄️ এসির তাপমাত্রা স্বাভাবিক রাখবেন', lang),
    t('🚦 Heavy traffic on flyover, 10-15m delay', '🚦 ফ্লাইওভারে জ্যাম, ১০-১৫ মিনিট দেরি হতে পারে', lang),
    t('✓ Gate Outward Pass verified by Security', '✓ সিকিউরিটি গেট পাস যাচাই সম্পন্ন', lang),
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
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#fff',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageSquare size={17} color="#60A5FA" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>
                  {t('Tri-Party Trip Dispatch Chat', 'ত্রিপক্ষীয় ট্রিপ ডেসপ্যাচ লাইভ চ্যাট', lang)}
                </h3>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                  {requisition.id} • {requisition.from.split(',')[0]} ➔ {requisition.to.split(',')[0]}
                </div>
              </div>
            </div>
          </div>
          <button
            className="modal-close"
            style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '28px', height: '28px' }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 3-Party Participant Roster Strip */}
        <div style={{
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '11.5px',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              padding: '2px 8px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              🧑‍💼 {requisition.requesterName} (Staff)
            </span>
            <span style={{
              background: '#ECFDF5',
              color: '#047857',
              border: '1px solid #A7F3D0',
              borderRadius: '6px',
              padding: '2px 8px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              🚙 {requisition.assignedDriverName || 'Driver Assg Pending'}
              {requisition.assignedDriverPhone && ` (${requisition.assignedDriverPhone})`}
            </span>
            <span style={{
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FDE68A',
              borderRadius: '6px',
              padding: '2px 8px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              👮 Md. Kamruzzaman (Admin)
            </span>
          </div>

          {requisition.assignedVehiclePlate && (
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', background: '#E2E8F0', padding: '2px 7px', borderRadius: '4px', fontSize: '10.5px' }}>
              🚗 {requisition.assignedVehiclePlate}
            </span>
          )}
        </div>

        {/* Simulation Speaker Switcher (For Interactive Testing) */}
        <div style={{
          background: '#F1F5F9',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          borderBottom: '1px solid #E2E8F0',
        }}>
          <span style={{ color: '#64748B', fontWeight: 600 }}>
            {t('Simulate Sending As:', 'বার্তা প্রেরক মোড পরিবর্তন করুন:', lang)}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveSpeaker('employee')}
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                border: activeSpeaker === 'employee' ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                background: activeSpeaker === 'employee' ? '#2563EB' : '#fff',
                color: activeSpeaker === 'employee' ? '#fff' : '#334155',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '10.5px',
              }}
            >
              Staff ({requisition.requesterName.split(' ')[0]})
            </button>
            <button
              onClick={() => setActiveSpeaker('driver')}
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                border: activeSpeaker === 'driver' ? '1.5px solid #059669' : '1px solid #CBD5E1',
                background: activeSpeaker === 'driver' ? '#059669' : '#fff',
                color: activeSpeaker === 'driver' ? '#fff' : '#334155',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '10.5px',
              }}
            >
              Driver ({requisition.assignedDriverName ? requisition.assignedDriverName.split(' ')[0] : 'Driver'})
            </button>
            <button
              onClick={() => setActiveSpeaker('admin')}
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                border: activeSpeaker === 'admin' ? '1.5px solid #B45309' : '1px solid #CBD5E1',
                background: activeSpeaker === 'admin' ? '#B45309' : '#fff',
                color: activeSpeaker === 'admin' ? '#fff' : '#334155',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '10.5px',
              }}
            >
              Transport Admin
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: 'var(--brand-card-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {reqMessages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px 10px',
              color: '#94A3B8',
              fontSize: '12.5px',
            }}>
              <MessageSquare size={32} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
              <div>{t('No messages in this trip channel yet.', 'এই ট্রিপের কোনো চ্যাট বার্তা নেই।', lang)}</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                {t('Coordinate pickup location, departure timing, or special route instructions directly with your driver and dispatch admin.', 'পিকআপের অবস্থান বা সময় পরিবর্তনের জন্য চালক ও পরিবহন কর্মকর্তার সাথে সরাসরি কথা বলুন।', lang)}
              </div>
            </div>
          ) : (
            reqMessages.map((m) => {
              const isStaff = m.senderRole === 'employee';
              const isDriver = m.senderRole === 'driver';
              const isAdmin = m.senderRole === 'admin';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isStaff ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Sender Name & Badge */}
                  <div style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    marginBottom: '3px',
                    color: isStaff ? '#1D4ED8' : isDriver ? '#047857' : '#B45309',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    {isStaff && <span>🧑‍💼 {m.senderName}</span>}
                    {isDriver && <span>🚙 {m.senderName}</span>}
                    {isAdmin && <span>👮 {m.senderName}</span>}
                    <span style={{ fontSize: '9.5px', color: '#94A3B8', fontWeight: 500 }}>
                      {m.timestamp}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    maxWidth: '80%',
                    padding: '9px 14px',
                    borderRadius: isStaff ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    fontSize: '12.5px',
                    lineHeight: '1.45',
                    background: isStaff
                      ? 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)'
                      : isDriver
                      ? '#ECFDF5'
                      : '#FEF3C7',
                    color: isStaff ? '#fff' : isDriver ? '#065F46' : '#78350F',
                    border: isStaff
                      ? 'none'
                      : isDriver
                      ? '1px solid #A7F3D0'
                      : '1px solid #FDE68A',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    wordBreak: 'break-word',
                  }}>
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{
          padding: '8px 14px',
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
                borderRadius: '14px',
                border: '1px solid #CBD5E1',
                background: '#fff',
                fontSize: '10.5px',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563EB')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
            >
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div style={{
          padding: '12px 16px',
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
              height: '38px',
              fontSize: '12.5px',
              paddingLeft: '12px',
              borderRadius: '8px',
            }}
            placeholder={
              activeSpeaker === 'employee'
                ? t('Message driver & transport admin...', 'ড্রাইভার ও পরিবহন কর্মকর্তাকে বার্তা পাঠান...', lang)
                : activeSpeaker === 'driver'
                ? t('Reply to passenger Tanvir Ahmed...', 'যাত্রী তানভীর আহমেদকে উত্তর দিন...', lang)
                : t('Send official dispatch instruction...', 'দাপ্তরিক ডেসপ্যাচ নির্দেশনা দিন...', lang)
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className="btn-primary"
            style={{
              height: '38px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              borderRadius: '8px',
            }}
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
          >
            <Send size={14} />
            <span>{t('Send', 'পাঠান', lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
