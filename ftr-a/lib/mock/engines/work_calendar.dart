import 'package:bogcl_oneops/core/utils/dates.dart';

/// Gazetted holiday (`Setting calendar.holidays` stand-in).
typedef Holiday = ({String date, String name, String nameBn});

/// Bangladesh work calendar (doc 06 §1.2): Friday and Saturday are weekends.
/// Dates are `YYYY-MM-DD` keys; arithmetic runs in UTC so DST never matters.
abstract final class WorkCalendar {
  static const Set<int> weekendDays = {DateTime.friday, DateTime.saturday};

  static const List<Holiday> holidays = [
    (date: '2026-12-16', name: 'Victory Day', nameBn: 'বিজয় দিবস'),
    (date: '2026-12-25', name: 'Christmas Day', nameBn: 'বড়দিন'),
    (
      date: '2027-02-21',
      name: "Language Martyrs' Day",
      nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    ),
    (date: '2027-03-26', name: 'Independence Day', nameBn: 'স্বাধীনতা দিবস'),
    (date: '2027-04-14', name: 'Pohela Boishakh', nameBn: 'পহেলা বৈশাখ'),
    (date: '2027-05-01', name: 'May Day', nameBn: 'মে দিবস'),
  ];

  static String _pad(int n) => n.toString().padLeft(2, '0');

  static String keyOf(DateTime d) =>
      '${d.year}-${_pad(d.month)}-${_pad(d.day)}';

  static DateTime parse(String key) {
    final p = key.split('-').map(int.parse).toList();
    return DateTime.utc(p[0], p[1], p[2]);
  }

  /// Today's date key in Dhaka.
  static String today() => keyOf(Dhaka.today());

  static String addDays(String key, int days) =>
      keyOf(parse(key).add(Duration(days: days)));

  /// Whole days from [a] to [b] (positive when [b] is later).
  static int daysBetween(String a, String b) =>
      parse(b).difference(parse(a)).inDays;

  static bool isValidKey(String key) {
    if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(key)) return false;
    return keyOf(parse(key)) == key;
  }

  static bool isWeekend(String key) => weekendDays.contains(parse(key).weekday);

  static Holiday? holidayOf(String key) {
    for (final h in holidays) {
      if (h.date == key) return h;
    }
    return null;
  }

  static bool isBusinessDay(String key) =>
      !isWeekend(key) && holidayOf(key) == null;

  /// Business days in the inclusive range (BR-10-10).
  static List<String> businessDays(String start, String end) {
    final out = <String>[];
    if (end.compareTo(start) < 0) return out;
    for (var k = start; k.compareTo(end) <= 0; k = addDays(k, 1)) {
      if (isBusinessDay(k)) out.add(k);
    }
    return out;
  }

  /// The [n]th business day on or after [start] (n = 1 is the first).
  static String nthBusinessDay(String start, int n) {
    var k = start;
    var count = 0;
    while (true) {
      if (isBusinessDay(k)) count++;
      if (count >= n) return k;
      k = addDays(k, 1);
    }
  }
}
