import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String leaveStatusLabel(AppL10n l10n, LeaveStatus s) => switch (s) {
  LeaveStatus.pending => l10n.leaveStatusPending,
  LeaveStatus.returned => l10n.leaveStatusReturned,
  LeaveStatus.approved => l10n.leaveStatusApproved,
  LeaveStatus.rejected => l10n.leaveStatusRejected,
  LeaveStatus.cancelled => l10n.leaveStatusCancelled,
};

StatusTone leaveStatusTone(LeaveStatus s) => switch (s) {
  LeaveStatus.pending || LeaveStatus.returned => StatusTone.warning,
  LeaveStatus.approved => StatusTone.success,
  LeaveStatus.rejected => StatusTone.danger,
  LeaveStatus.cancelled => StatusTone.neutral,
};

String halfDayLabel(AppL10n l10n, HalfDay h) => switch (h) {
  HalfDay.first => l10n.leaveHalfFirst,
  HalfDay.second => l10n.leaveHalfSecond,
};

String leaveNextLine(AppL10n l10n, LeaveRequestItem r, {required bool bangla}) {
  if (r.awaitingYou) return l10n.leaveNextAwaitingYou;
  return switch (r.status) {
    LeaveStatus.returned => l10n.leaveNextReturned,
    LeaveStatus.pending =>
      r.waitingForName(bangla: bangla) == null
          ? l10n.leaveNextWait
          : l10n.leaveWaitingFor(r.waitingForName(bangla: bangla)!),
    LeaveStatus.approved => l10n.leaveNextApproved,
    LeaveStatus.rejected => l10n.leaveNextRejected,
    LeaveStatus.cancelled => l10n.leaveNextCancelled,
  };
}
