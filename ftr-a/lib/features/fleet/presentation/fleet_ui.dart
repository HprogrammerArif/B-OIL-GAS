import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String fleetTaka(num amount, {required bool bangla}) =>
    Money.fromPaisa((amount * 100).round()).format(bengali: bangla);

String fleetStatusLabel(AppL10n l10n, String s) => switch (s) {
  'DRAFT' => l10n.flStatusDraft,
  'PENDING_APPROVAL' => l10n.flStatusPending,
  'APPROVED' => l10n.flStatusApproved,
  'ASSIGNED' => l10n.flStatusAssigned,
  'IN_TRANSIT' => l10n.flStatusLive,
  'COMPLETED' => l10n.flStatusDone,
  'REJECTED' => l10n.flStatusRejected,
  _ => l10n.flStatusCancelled,
};

StatusTone fleetStatusTone(String s) => switch (s) {
  'IN_TRANSIT' => StatusTone.info,
  'ASSIGNED' => StatusTone.success,
  'APPROVED' => StatusTone.info,
  'PENDING_APPROVAL' => StatusTone.warning,
  'COMPLETED' => StatusTone.neutral,
  'REJECTED' => StatusTone.danger,
  _ => StatusTone.neutral,
};

bool fleetNeedsMe(VehicleRequisition r) {
  final m = r.me;
  return m.canAssign ||
      m.canGateOut ||
      m.canComplete ||
      m.canSos ||
      m.canRate ||
      m.canSubmit;
}

String fleetNextLine(
  AppL10n l10n,
  VehicleRequisition r, {
  required bool bangla,
}) {
  final m = r.me;
  final when = DateFmt.dateTime(r.departAt, bangla ? 'bn' : 'en');
  final who = r.requester?.display(bangla: bangla) ?? '';
  return switch (r.status) {
    'DRAFT' when m.canSubmit => l10n.flNextSubmit,
    'PENDING_APPROVAL' when m.isRequester => l10n.flNextWaitHod,
    'PENDING_APPROVAL' => l10n.flNextEndorse(who),
    'APPROVED' when m.canAssign => l10n.flNextAssign,
    'APPROVED' => l10n.flNextWaitCar,
    'ASSIGNED' when m.canGateOut => l10n.flNextGateOut(when),
    'ASSIGNED' => l10n.flNextAssigned(r.vehicle?.plateNo ?? ''),
    'IN_TRANSIT' when m.canComplete => l10n.flNextFinish,
    'IN_TRANSIT' => l10n.flNextLive(r.vehicle?.plateNo ?? ''),
    'COMPLETED' when m.canRate => l10n.flNextRate,
    'COMPLETED' => l10n.flNextDone,
    'REJECTED' when m.canSubmit => l10n.flNextFix,
    'REJECTED' => l10n.flNextRejected,
    _ => l10n.flNextCancelled,
  };
}

String fleetTripType(AppL10n l10n, String t) =>
    t == 'ROUND_TRIP' ? l10n.flTypeRound : l10n.flTypeOne;
