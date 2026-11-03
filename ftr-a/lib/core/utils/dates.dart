import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:intl/intl.dart';

/// Date helpers pinned to Asia/Dhaka (UTC+6, no DST).
abstract final class Dhaka {
  static const offset = Duration(hours: 6);

  /// Converts any instant to a wall-clock `DateTime` in Dhaka.
  /// The result is a local-style (non-UTC) value meant only for formatting.
  static DateTime wall(DateTime instant) {
    final u = instant.toUtc().add(offset);
    return DateTime(
      u.year,
      u.month,
      u.day,
      u.hour,
      u.minute,
      u.second,
      u.millisecond,
    );
  }

  /// Current wall-clock time in Dhaka. Overridable for the demo "today" anchor.
  static DateTime Function() clock = DateTime.now;

  static DateTime now() => wall(clock());

  /// Midnight (Dhaka) of today.
  static DateTime today() {
    final n = now();
    return DateTime(n.year, n.month, n.day);
  }

  /// Parses a wire timestamp (ISO-8601 UTC) to a UTC instant.
  static DateTime parseInstant(String iso) => DateTime.parse(iso).toUtc();

  /// Formats an instant as an ISO-8601 UTC string with `Z`.
  static String toWire(DateTime instant) => instant.toUtc().toIso8601String();
}

/// Formatters for `dd MMM yyyy`, `hh:mm a` in Dhaka. Bengali digits for `bn`.
abstract final class DateFmt {
  static String date(DateTime instant, String languageCode) =>
      _fmt('dd MMM yyyy', instant, languageCode);

  static String time(DateTime instant, String languageCode) =>
      _fmt('hh:mm a', instant, languageCode);

  static String dateTime(DateTime instant, String languageCode) =>
      '${date(instant, languageCode)}, ${time(instant, languageCode)}';

  /// A `YYYY-MM-DD` calendar date (no time zone), e.g. a leave start date.
  static String key(
    String dateKey,
    String languageCode, {
    String pattern = 'dd MMM yyyy',
  }) {
    final p = dateKey.split('-').map(int.parse).toList();
    final out = DateFormat(
      pattern,
      languageCode,
    ).format(DateTime(p[0], p[1], p[2]));
    return languageCode == 'bn' ? toBengaliDigits(out) : out;
  }

  /// `12 Nov – 14 Nov 2026`; a single date when [start] equals [end].
  static String range(String start, String end, String languageCode) {
    if (start == end) return key(start, languageCode);
    final sameYear = start.substring(0, 4) == end.substring(0, 4);
    final from = key(
      start,
      languageCode,
      pattern: sameYear ? 'dd MMM' : 'dd MMM yyyy',
    );
    return '$from – ${key(end, languageCode)}';
  }

  static String _fmt(String pattern, DateTime instant, String languageCode) {
    final out = DateFormat(pattern, languageCode).format(Dhaka.wall(instant));
    return languageCode == 'bn' ? toBengaliDigits(out) : out;
  }
}
