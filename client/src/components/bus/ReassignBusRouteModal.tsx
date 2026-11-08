import React, { useState } from 'react';
import { BusVehicle, RouteInfo, shortBusModel } from './busTypes';
import { t } from '../../types';
import { RefreshCw } from 'lucide-react';

interface ReassignBusRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  buses: BusVehicle[];
  routes: Record<string, RouteInfo>;
  initialBusId?: string | null;
  bookedByRoute: Record<string, number>;
  onReassign: (busId: string, targetRouteId: string) => boolean;
  lang: 'en' | 'bn';
}

function otherRoute(routes: Record<string, RouteInfo>, currentId: string): string {
  return Object.keys(routes).find((id) => id !== currentId) || currentId;
}

export default function ReassignBusRouteModal({
  isOpen,
  onClose,
  buses,
  routes,
  initialBusId,
  bookedByRoute,
  onReassign,
  lang,
}: ReassignBusRouteModalProps) {
  const starting = buses.find((bus) => bus.id === initialBusId) || buses[0];
  const [selectedBusId, setSelectedBusId] = useState(starting?.id || '');
  const [targetRouteId, setTargetRouteId] = useState(otherRoute(routes, starting?.assignedRouteId || ''));

  if (!isOpen) return null;

  const selectedBus = buses.find((bus) => bus.id === selectedBusId) || buses[0];
  const currentRoute = selectedBus ? routes[selectedBus.assignedRouteId] : undefined;
  const targetRoute = routes[targetRouteId];
  const targetBooked = bookedByRoute[targetRouteId] ?? 0;
  const sameRoute = !!selectedBus && selectedBus.assignedRouteId === targetRouteId;
  const tooSmall = !!selectedBus && targetBooked > selectedBus.capacity;
  const displaced = buses.find((bus) => bus.id !== selectedBus?.id && bus.assignedRouteId === targetRouteId);
  const sourceBooked = selectedBus ? (bookedByRoute[selectedBus.assignedRouteId] ?? 0) : 0;
  const displacedTooSmall = !!displaced && sourceBooked > displaced.capacity;
  const blocked = !selectedBus || !targetRoute || sameRoute || tooSmall || displacedTooSmall;

  const reason = sameRoute
    ? t('This bus already runs that route.', 'এই বাস ইতিমধ্যে ওই রুটে চলে।', lang)
    : tooSmall
      ? t(
          `That route has ${targetBooked} people booked. This bus has ${selectedBus?.capacity ?? 0} seats.`,
          `ওই রুটে ${targetBooked} জন বুক করা। এই বাসে ${selectedBus?.capacity ?? 0}টি আসন।`,
          lang,
        )
      : displacedTooSmall
        ? t(
            `The coach already on that route has ${displaced?.capacity ?? 0} seats, and this route has ${sourceBooked} people booked.`,
            `ওই রুটের বর্তমান বাসে ${displaced?.capacity ?? 0}টি আসন, আর এই রুটে ${sourceBooked} জন বুক করা।`,
            lang,
          )
        : t(
            'People already booked on the new route keep their seats. This bus must have room for them.',
            'নতুন রুটে যাঁরা বুক করা আছেন তাঁদের আসন থাকবে। এই বাসে তাঁদের জায়গা থাকতে হবে।',
            lang,
          );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked || !selectedBus) return;
    if (onReassign(selectedBus.id, targetRouteId)) onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal shuttle-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div>
            <h3>
              <RefreshCw size={18} />
              {t('Reassign this bus', 'এই বাস অন্য রুটে দিন', lang)}
            </h3>
            <p className="shuttle-sub">
              {t('This coach starts running the route you pick.', 'এই বাস আপনি যে রুট বাছবেন সেটি চালানো শুরু করবে।', lang)}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন', lang)}>×</button>
        </div>

        <form id="shuttle-reassign-bus" className="modal-body" onSubmit={handleSubmit}>
          <div className="shuttle-stack">
            <div>
              <label>{t('Bus', 'বাস', lang)}</label>
              <select
                className="form-input"
                value={selectedBus?.id || ''}
                onChange={(e) => {
                  const nextId = e.target.value;
                  const nextBus = buses.find((bus) => bus.id === nextId);
                  setSelectedBusId(nextId);
                  if (nextBus && targetRouteId === nextBus.assignedRouteId) {
                    setTargetRouteId(otherRoute(routes, nextBus.assignedRouteId));
                  }
                }}
              >
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.coachNo} · {shortBusModel(bus.model)} · {bus.capacity}
                  </option>
                ))}
              </select>
              {selectedBus && (
                <p className="shuttle-sub">
                  {t('Driver', 'চালক', lang)}: {selectedBus.driverName}
                  {currentRoute ? ` · ${currentRoute.name}` : ''}
                </p>
              )}
            </div>

            <div>
              <label>{t('Move to', 'যে রুটে যাবে', lang)}</label>
              <select className="form-input" value={targetRouteId} onChange={(e) => setTargetRouteId(e.target.value)}>
                {Object.values(routes).map((route) => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
              </select>
            </div>

            <p className="shuttle-note">{reason}</p>
          </div>
        </form>

        <div className="modal-ft">
          <button type="button" className="btn-outline" onClick={onClose}>{t('Cancel', 'বাতিল', lang)}</button>
          <button type="submit" form="shuttle-reassign-bus" className="btn-primary" disabled={blocked}>
            {t('Move this bus', 'এই বাস সরিয়ে দিন', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
