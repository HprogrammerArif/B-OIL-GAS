import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';

String parcelStatusLabel(AppL10n l10n, String status) => switch (status) {
  'CREATED' => l10n.pcStatusCreated,
  'DISPATCHED' => l10n.pcStatusDispatched,
  'IN_TRANSIT' => l10n.pcStatusInTransit,
  'AT_GATE' => l10n.pcStatusAtGate,
  'OUT_FOR_DELIVERY' => l10n.pcStatusOut,
  'DELIVERED' => l10n.pcStatusDelivered,
  'QUARANTINED' => l10n.pcStatusHeld,
  'RETURN_INITIATED' || 'RETURN_IN_TRANSIT' => l10n.pcStatusReturning,
  'RETURNED' => l10n.pcStatusReturned,
  'LOST' => l10n.pcStatusLost,
  'DAMAGED' => l10n.pcStatusDamaged,
  _ => l10n.pcStatusCancelled,
};

StatusTone parcelStatusTone(String status) => switch (status) {
  'DELIVERED' => StatusTone.success,
  'QUARANTINED' || 'LOST' || 'DAMAGED' => StatusTone.danger,
  'RETURN_INITIATED' || 'RETURN_IN_TRANSIT' => StatusTone.warning,
  'OUT_FOR_DELIVERY' || 'AT_GATE' => StatusTone.info,
  'DISPATCHED' || 'IN_TRANSIT' => StatusTone.info,
  _ => StatusTone.neutral,
};

String parcelCategoryLabel(AppL10n l10n, String c) => switch (c) {
  'LEGAL_DOCS' => l10n.pcCatLegal,
  'QC_SAMPLE' => l10n.pcCatSample,
  'SPARES' => l10n.pcCatSpares,
  'TENDER_BID' => l10n.pcCatTender,
  'IT_HARDWARE' => l10n.pcCatIt,
  'CONFIDENTIAL' => l10n.pcCatConfidential,
  _ => l10n.pcCatGeneral,
};

const parcelCategories = [
  'GENERAL',
  'LEGAL_DOCS',
  'TENDER_BID',
  'SPARES',
  'IT_HARDWARE',
  'QC_SAMPLE',
  'CONFIDENTIAL',
];

String parcelHandlingLabel(AppL10n l10n, String h) => switch (h) {
  'FRAGILE' => l10n.pcHandFragile,
  'COLD_CHAIN' => l10n.pcHandCold,
  'HAZMAT' => l10n.pcHandHazmat,
  _ => l10n.pcHandUpright,
};

String parcelReturnReasonLabel(AppL10n l10n, String r) => switch (r) {
  'TAMPER_BROKEN' => l10n.pcRetTamper,
  'DAMAGED_CONTENTS' => l10n.pcRetDamaged,
  'WRONG_DOCUMENTS' => l10n.pcRetWrong,
  'RECIPIENT_REFUSED' => l10n.pcRetRefused,
  _ => l10n.pcRetUnavailable,
};

const parcelReturnReasons = [
  'TAMPER_BROKEN',
  'DAMAGED_CONTENTS',
  'WRONG_DOCUMENTS',
  'RECIPIENT_REFUSED',
  'RECIPIENT_UNAVAILABLE',
];

String parcelEventLabel(AppL10n l10n, String type) => switch (type) {
  'CREATED' => l10n.pcEvCreated,
  'HANDOVER' => l10n.pcEvHandover,
  'CHECKPOINT' => l10n.pcEvCheckpoint,
  'GATE_IN' => l10n.pcEvGateIn,
  'OUT_FOR_DELIVERY' => l10n.pcEvOut,
  'OTP_VERIFIED' => l10n.pcEvCode,
  'DELIVERED' => l10n.pcEvDelivered,
  'TAMPER_FLAGGED' => l10n.pcEvProblem,
  'RETURN_INITIATED' => l10n.pcEvReturn,
  'RETURN_CHECKPOINT' => l10n.pcEvReturnCheckpoint,
  'RETURNED' => l10n.pcEvReturned,
  'EXCEPTION' => l10n.pcEvException,
  'CANCELLED' => l10n.pcEvCancelled,
  _ => l10n.pcEvNote,
};

IconData parcelEventIcon(String type) => switch (type) {
  'CREATED' => Icons.inventory_2_outlined,
  'HANDOVER' => Icons.handshake_outlined,
  'CHECKPOINT' || 'RETURN_CHECKPOINT' => Icons.place_outlined,
  'GATE_IN' => Icons.sensor_door_outlined,
  'OUT_FOR_DELIVERY' => Icons.local_shipping_outlined,
  'OTP_VERIFIED' => Icons.pin_outlined,
  'DELIVERED' || 'RETURNED' => Icons.check_circle_outline,
  'TAMPER_FLAGGED' || 'EXCEPTION' => Icons.report_gmailerrorred_outlined,
  'RETURN_INITIATED' => Icons.undo,
  'CANCELLED' => Icons.cancel_outlined,
  _ => Icons.notes_outlined,
};

/// A parcel I can act on right now (drives the verdict line on the list).
bool parcelNeedsMe(Parcel p) {
  final m = p.me;
  return m.canDispatch ||
      m.canCheckpoint ||
      m.canGateIn ||
      m.canOutForDelivery ||
      m.canAccept ||
      (m.canVerifyOtp && !m.isSender);
}

/// One plain sentence: where it stands and what the viewer does next.
String parcelNextLine(AppL10n l10n, Parcel p, {required bool bangla}) {
  final m = p.me;
  final to = p.recipient.display(bangla: bangla);
  final from = p.sender.display(bangla: bangla);
  final dest = p.dest.label(bangla: bangla);
  return switch (p.status) {
    'CREATED' when m.canDispatch => l10n.pcNextDispatch,
    'CREATED' when m.isSender => l10n.pcNextCreatedSender,
    'CREATED' => l10n.pcNextCreated,
    'DISPATCHED' || 'IN_TRANSIT' when m.canGateIn => l10n.pcNextGateIn,
    'DISPATCHED' || 'IN_TRANSIT' when m.canCheckpoint =>
      p.intraSite ? l10n.pcNextCarryLocal(to) : l10n.pcNextCarry(dest),
    'DISPATCHED' || 'IN_TRANSIT' when m.isRecipient => l10n.pcNextComing(
      p.courier?.display(bangla: bangla) ?? '—',
    ),
    'DISPATCHED' || 'IN_TRANSIT' => l10n.pcNextRoad(dest),
    'AT_GATE' when m.canOutForDelivery => l10n.pcNextBring(to),
    'AT_GATE' when m.isRecipient => l10n.pcNextAtGateYou,
    'AT_GATE' => l10n.pcNextAtGate,
    'OUT_FOR_DELIVERY' when m.isRecipient => l10n.pcNextReceive,
    'OUT_FOR_DELIVERY' when m.canVerifyOtp => l10n.pcNextAskCode(to),
    'OUT_FOR_DELIVERY' => l10n.pcNextOut(to),
    'DELIVERED' => l10n.pcNextDelivered(
      to,
      p.deliveredAt == null
          ? ''
          : DateFmt.date(p.deliveredAt!, bangla ? 'bn' : 'en'),
    ),
    'QUARANTINED' when m.canReturn => l10n.pcNextHeldAct,
    'QUARANTINED' => l10n.pcNextHeld,
    'DAMAGED' when m.canReturn => l10n.pcNextDamagedAct,
    'DAMAGED' => l10n.pcNextHeld,
    'RETURN_INITIATED' when m.canCheckpoint => l10n.pcNextCarryBack(from),
    'RETURN_INITIATED' => l10n.pcNextBackSoon(from),
    'RETURN_IN_TRANSIT' when m.isSender => l10n.pcNextBackYou,
    'RETURN_IN_TRANSIT' when m.canVerifyOtp => l10n.pcNextAskCode(from),
    'RETURN_IN_TRANSIT' => l10n.pcNextBackSoon(from),
    'RETURNED' => l10n.pcNextReturned(from),
    'LOST' => l10n.pcNextLost,
    _ => l10n.pcNextCancelled,
  };
}
