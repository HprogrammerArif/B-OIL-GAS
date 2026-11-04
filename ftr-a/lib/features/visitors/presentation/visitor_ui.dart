import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String visitStatusLabel(AppL10n l10n, String s) => switch (s) {
  'PRE_REGISTERED' => l10n.visStatusWaiting,
  'APPROVED' => l10n.visStatusExpected,
  'CHECKED_IN' => l10n.visStatusInside,
  'OVERDUE' => l10n.visStatusOverdue,
  'CHECKED_OUT' => l10n.visStatusDone,
  'DENIED' => l10n.visStatusDenied,
  _ => l10n.visStatusCancelled,
};

StatusTone visitStatusTone(String s) => switch (s) {
  'CHECKED_IN' => StatusTone.success,
  'APPROVED' => StatusTone.info,
  'PRE_REGISTERED' => StatusTone.warning,
  'OVERDUE' => StatusTone.danger,
  'DENIED' => StatusTone.danger,
  _ => StatusTone.neutral,
};

String visitCategoryLabel(AppL10n l10n, String c) => switch (c) {
  'VIP' => l10n.visCatVip,
  'GOVT' => l10n.visCatGovt,
  'VENDOR' => l10n.visCatVendor,
  'CLIENT' => l10n.visCatClient,
  'CONTRACTOR' => l10n.visCatContractor,
  _ => l10n.visCatRegular,
};

const visitCategories = [
  'REGULAR',
  'VENDOR',
  'CLIENT',
  'CONTRACTOR',
  'GOVT',
  'VIP',
];

bool visitNeedsMe(Visit v) {
  final m = v.me;
  return m.canApprove ||
      m.canCheckIn ||
      m.canCheckOut ||
      m.canClearWatchlist ||
      m.canPpe && v.ppeRequired && !v.ppeCleared;
}

String visitNextLine(AppL10n l10n, Visit v, {required bool bangla}) {
  final m = v.me;
  final name = v.guest.fullName;
  final when = DateFmt.dateTime(v.expectedAt, bangla ? 'bn' : 'en');
  return switch (v.status) {
    'PRE_REGISTERED' when v.watchlistHit && m.canClearWatchlist =>
      l10n.visNextWatchlist,
    'PRE_REGISTERED' when v.watchlistHit => l10n.visNextWatchlistWait,
    'PRE_REGISTERED' when m.canApprove => l10n.visNextApprove(name),
    'PRE_REGISTERED' when m.isHost => l10n.visNextHostWait,
    'PRE_REGISTERED' => l10n.visNextWaiting,
    'APPROVED' when m.canCheckIn && v.ppeRequired && !v.ppeCleared =>
      l10n.visNextPpe,
    'APPROVED' when m.canCheckIn && v.escortRequired && v.escort == null =>
      l10n.visNextEscort,
    'APPROVED' when m.canCheckIn => l10n.visNextCheckIn(name),
    'APPROVED' when m.isHost => l10n.visNextHostReady(when),
    'APPROVED' => l10n.visNextReady(when),
    'CHECKED_IN' when m.canCheckOut => l10n.visNextCheckOut(name),
    'CHECKED_IN' when m.isHost || m.isEscort => l10n.visNextInsideHost,
    'CHECKED_IN' => l10n.visNextInside,
    'OVERDUE' when m.canExtend => l10n.visNextOverdueAct,
    'OVERDUE' when m.canCheckOut => l10n.visNextCheckOut(name),
    'OVERDUE' => l10n.visNextOverdue,
    'CHECKED_OUT' => l10n.visNextDone,
    'DENIED' => l10n.visNextDenied,
    _ => l10n.visNextCancelled,
  };
}
