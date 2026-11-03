import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/attendance/domain/attendance_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String dayStatusLabel(AppL10n l10n, DayStatus? s) => switch (s) {
  DayStatus.present => l10n.attStatusPresent,
  DayStatus.late => l10n.attStatusLate,
  DayStatus.earlyLeave => l10n.attStatusEarlyLeave,
  DayStatus.halfDay => l10n.attStatusHalfDay,
  DayStatus.absent => l10n.attStatusAbsent,
  DayStatus.onLeave => l10n.attStatusOnLeave,
  DayStatus.holiday => l10n.attStatusHoliday,
  DayStatus.weekend => l10n.attStatusWeekend,
  DayStatus.fieldDuty => l10n.attStatusFieldDuty,
  null => l10n.attStatusNone,
};

StatusTone dayStatusTone(DayStatus? s) => switch (s) {
  DayStatus.present || DayStatus.fieldDuty => StatusTone.success,
  DayStatus.late ||
  DayStatus.earlyLeave ||
  DayStatus.halfDay => StatusTone.warning,
  DayStatus.absent => StatusTone.danger,
  DayStatus.onLeave => StatusTone.info,
  DayStatus.holiday || DayStatus.weekend || null => StatusTone.neutral,
};

String regTypeLabel(AppL10n l10n, RegularisationType t) => switch (t) {
  RegularisationType.missedPunch => l10n.attRegTypeMissed,
  RegularisationType.fieldDuty => l10n.attRegTypeField,
  RegularisationType.lateJustification => l10n.attRegTypeLate,
  RegularisationType.remoteWork => l10n.attRegTypeRemote,
};

String regStatusLabel(AppL10n l10n, RegularisationStatus s) => switch (s) {
  RegularisationStatus.pending => l10n.leaveStatusPending,
  RegularisationStatus.approved => l10n.leaveStatusApproved,
  RegularisationStatus.rejected => l10n.leaveStatusRejected,
  RegularisationStatus.cancelled => l10n.leaveStatusCancelled,
};

StatusTone regStatusTone(RegularisationStatus s) => switch (s) {
  RegularisationStatus.pending => StatusTone.warning,
  RegularisationStatus.approved => StatusTone.success,
  RegularisationStatus.rejected => StatusTone.danger,
  RegularisationStatus.cancelled => StatusTone.neutral,
};

/// Hours and minutes text, Bengali digits for `bn`.
String durationText(AppL10n l10n, int minutes, String lang) {
  final out = l10n.attDuration(
    minutes ~/ 60,
    (minutes % 60).toString().padLeft(2, '0'),
  );
  return lang == 'bn' ? toBengaliDigits(out) : out;
}
