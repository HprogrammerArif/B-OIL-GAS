import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/bus/domain/bus_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

/// Digits in the active numeral system.
String digits(Object value, {required bool bangla}) =>
    bangla ? toBengaliDigits('$value') : '$value';

/// `HH:mm` as 12-hour clock text, e.g. `7:30 AM`.
String clock(String hhmm, {required bool bangla}) {
  final parts = hhmm.split(':');
  if (parts.length != 2) return hhmm;
  final h = int.tryParse(parts[0]) ?? 0;
  final h12 = h % 12 == 0 ? 12 : h % 12;
  final suffix = h >= 12 ? 'PM' : 'AM';
  final out = '$h12:${parts[1]} $suffix';
  return bangla ? toBengaliDigits(out) : out;
}

String routeStatusLabel(AppL10n l10n, RouteMyStatus s) => switch (s) {
  RouteMyStatus.seat => l10n.busMySeatBadge,
  RouteMyStatus.waiting => l10n.busWaitingBadge,
  RouteMyStatus.offered => l10n.busOfferedBadge,
};

StatusTone routeStatusTone(RouteMyStatus s) => switch (s) {
  RouteMyStatus.seat => StatusTone.success,
  RouteMyStatus.waiting => StatusTone.warning,
  RouteMyStatus.offered => StatusTone.info,
};

/// Time left until [at], e.g. `41h 12m`.
String remaining(AppL10n l10n, DateTime at, {required bool bangla}) {
  final d = at.difference(DateTime.now().toUtc());
  if (d.isNegative) return l10n.busOfferExpired;
  return l10n.busOfferLeft(
    digits(d.inHours, bangla: bangla),
    digits(d.inMinutes % 60, bangla: bangla),
  );
}
