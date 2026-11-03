import 'package:flutter/foundation.dart';

/// Exact money amount in BDT. Stored as integer paisa; never a `double`.
/// Wire format is a decimal string with at most 2 fraction digits
/// (doc 03 §1.5), e.g. `"4850000.00"`.
@immutable
class Money implements Comparable<Money> {
  const Money.fromPaisa(this.paisa);

  /// Parses a wire decimal string. Throws [FormatException] when invalid.
  factory Money.parse(String value) {
    final v = value.trim();
    if (!_wire.hasMatch(v)) {
      throw FormatException('Invalid money value', value);
    }
    final negative = v.startsWith('-');
    final parts = (negative ? v.substring(1) : v).split('.');
    final whole = int.parse(parts[0]);
    final frac = parts.length == 2 ? int.parse(parts[1].padRight(2, '0')) : 0;
    final paisa = whole * 100 + frac;
    return Money.fromPaisa(negative ? -paisa : paisa);
  }

  static const zero = Money.fromPaisa(0);

  static final _wire = RegExp(r'^-?\d+(\.\d{1,2})?$');

  /// Returns null instead of throwing.
  static Money? tryParse(String? value) {
    if (value == null) return null;
    try {
      return Money.parse(value);
    } on FormatException {
      return null;
    }
  }

  final int paisa;

  Money operator +(Money other) => Money.fromPaisa(paisa + other.paisa);
  Money operator -(Money other) => Money.fromPaisa(paisa - other.paisa);

  /// Multiplies by an integer factor (e.g. nights, days).
  Money times(int factor) => Money.fromPaisa(paisa * factor);

  bool operator >(Money other) => paisa > other.paisa;
  bool operator >=(Money other) => paisa >= other.paisa;
  bool operator <(Money other) => paisa < other.paisa;
  bool operator <=(Money other) => paisa <= other.paisa;

  bool get isNegative => paisa < 0;

  /// Wire format: `"4850000.00"`.
  String toWire() {
    final abs = paisa.abs();
    final whole = abs ~/ 100;
    final frac = (abs % 100).toString().padLeft(2, '0');
    return '${isNegative ? '-' : ''}$whole.$frac';
  }

  /// Display format with lakh grouping: `৳48,50,000` (fraction shown only when
  /// non-zero). Uses Bengali numerals when [bengali] is true.
  String format({bool bengali = false, bool symbol = true}) {
    final abs = paisa.abs();
    final whole = _lakhGroup((abs ~/ 100).toString());
    final fracValue = abs % 100;
    var out = whole;
    if (fracValue != 0) {
      out = '$out.${fracValue.toString().padLeft(2, '0')}';
    }
    if (isNegative) out = '-$out';
    if (symbol) out = '৳$out';
    return bengali ? toBengaliDigits(out) : out;
  }

  static String _lakhGroup(String digits) {
    if (digits.length <= 3) return digits;
    final last3 = digits.substring(digits.length - 3);
    var rest = digits.substring(0, digits.length - 3);
    final groups = <String>[];
    while (rest.length > 2) {
      groups.insert(0, rest.substring(rest.length - 2));
      rest = rest.substring(0, rest.length - 2);
    }
    if (rest.isNotEmpty) groups.insert(0, rest);
    return '${groups.join(',')},$last3';
  }

  @override
  int compareTo(Money other) => paisa.compareTo(other.paisa);

  @override
  bool operator ==(Object other) => other is Money && other.paisa == paisa;

  @override
  int get hashCode => paisa.hashCode;

  @override
  String toString() => 'Money(${toWire()})';
}

/// Replaces ASCII digits with Bengali numerals.
String toBengaliDigits(String input) {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return input.replaceAllMapped(RegExp('[0-9]'), (m) => bn[int.parse(m[0]!)]);
}
