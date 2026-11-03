import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

extension AppL10nContext on BuildContext {
  AppL10n get l10n => AppL10n.of(this);

  bool get isBangla => Localizations.localeOf(this).languageCode == 'bn';
}

/// "5 min ago", "2 h ago", "3 d ago"; older than a week shows the date.
String relativeTime(AppL10n l, DateTime instant, String languageCode) {
  final diff = DateTime.now().toUtc().difference(instant);
  if (diff.inMinutes < 1) return l.timeJustNow;
  if (diff.inHours < 1) return l.timeMinutesAgo(diff.inMinutes);
  if (diff.inDays < 1) return l.timeHoursAgo(diff.inHours);
  if (diff.inDays < 7) return l.timeDaysAgo(diff.inDays);
  return DateFmt.date(instant, languageCode);
}

/// "2 days", "Half day", "1.5 days"; numbers use Bengali digits for `bn`.
String daysText(AppL10n l, double days, String languageCode) {
  if (days == 0.5) return l.leaveHalfDay;
  if (days == days.roundToDouble()) return l.leaveDaysCount(days.toInt());
  return l.leaveDaysFraction(
    NumberFormat.decimalPattern(languageCode).format(days),
  );
}

/// Localised role label; falls back to the server-provided name.
String roleLabel(AppL10n l, RoleInfo role) => switch (role.key) {
  'CHAIRMAN' => l.enumRoleCHAIRMAN,
  'PLANT_GM' => l.enumRolePLANT_GM,
  'HOD' => l.enumRoleHOD,
  'LINE_MANAGER' => l.enumRoleLINE_MANAGER,
  'HR_ADMIN' => l.enumRoleHR_ADMIN,
  'FINANCE' => l.enumRoleFINANCE,
  'TRANSPORT_ADMIN' => l.enumRoleTRANSPORT_ADMIN,
  'HSE_OFFICER' => l.enumRoleHSE_OFFICER,
  'SECURITY_GATE' => l.enumRoleSECURITY_GATE,
  'MAILROOM' => l.enumRoleMAILROOM,
  'DRIVER' => l.enumRoleDRIVER,
  'EMPLOYEE' => l.enumRoleEMPLOYEE,
  _ => role.name,
};

/// Bilingual accessors on the profile (Bangla falls back to English).
extension EmployeeNames on EmployeeProfile {
  String displayName({required bool bangla}) =>
      bangla ? (fullNameBn ?? fullName) : fullName;

  String shortDisplayName({required bool bangla}) => bangla
      ? (shortNameBn ?? fullNameBn ?? fullName)
      : (shortName ?? fullName);

  String designationTitle({required bool bangla}) =>
      bangla ? (designation.titleBn ?? designation.title) : designation.title;
}

extension OrgRefNames on OrgRef {
  String displayName({required bool bangla}) =>
      bangla ? (nameBn ?? name) : name;
}
