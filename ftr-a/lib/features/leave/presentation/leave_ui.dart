import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String leaveStatusLabel(AppL10n l10n, LeaveStatus s) => switch (s) {
  LeaveStatus.pending => l10n.leaveStatusPending,
  LeaveStatus.approved => l10n.leaveStatusApproved,
  LeaveStatus.rejected => l10n.leaveStatusRejected,
  LeaveStatus.cancelled => l10n.leaveStatusCancelled,
};

StatusTone leaveStatusTone(LeaveStatus s) => switch (s) {
  LeaveStatus.pending => StatusTone.warning,
  LeaveStatus.approved => StatusTone.success,
  LeaveStatus.rejected => StatusTone.danger,
  LeaveStatus.cancelled => StatusTone.neutral,
};

String halfDayLabel(AppL10n l10n, HalfDay h) => switch (h) {
  HalfDay.first => l10n.leaveHalfFirst,
  HalfDay.second => l10n.leaveHalfSecond,
};
