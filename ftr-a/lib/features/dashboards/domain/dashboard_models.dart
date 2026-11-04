import 'package:flutter/foundation.dart';

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

@immutable
class DashNeed {
  const DashNeed({
    required this.tone,
    required this.sentenceEn,
    required this.sentenceBn,
    required this.route,
  });

  factory DashNeed.fromJson(Map<String, Object?> j) => DashNeed(
    tone: j['tone'] as String? ?? 'info',
    sentenceEn: j['sentenceEn'] as String? ?? '',
    sentenceBn: j['sentenceBn'] as String? ?? '',
    route: j['route'] as String? ?? '/home',
  );

  final String tone;
  final String sentenceEn;
  final String sentenceBn;
  final String route;

  String text({required bool bangla}) => bangla ? sentenceBn : sentenceEn;
}

@immutable
class DashKpi {
  const DashKpi({
    required this.key,
    required this.labelEn,
    required this.labelBn,
    this.value,
    this.empty = false,
  });

  factory DashKpi.fromJson(Map<String, Object?> j) => DashKpi(
    key: j['key'] as String? ?? '',
    labelEn: j['labelEn'] as String? ?? '',
    labelBn: j['labelBn'] as String? ?? '',
    value: j['value'],
    empty: j['empty'] == true,
  );

  final String key;
  final String labelEn;
  final String labelBn;
  final Object? value;
  final bool empty;

  String label({required bool bangla}) => bangla ? labelBn : labelEn;

  String display() {
    if (empty || value == null) return '—';
    return '$value';
  }
}

@immutable
class DashExtra {
  const DashExtra({
    required this.kind,
    required this.titleEn,
    required this.titleBn,
    this.bodyEn,
    this.bodyBn,
    this.route,
    this.leaders = const [],
    this.items = const [],
    this.roi = const {},
  });

  factory DashExtra.fromJson(Map<String, Object?> j) => DashExtra(
    kind: j['kind'] as String? ?? 'list',
    titleEn: j['titleEn'] as String? ?? '',
    titleBn: j['titleBn'] as String? ?? '',
    bodyEn: j['bodyEn'] as String?,
    bodyBn: j['bodyBn'] as String?,
    route: j['route'] as String?,
    leaders: [
      for (final e in j['leaders'] as List? ?? const [])
        if (e is Map) Map<String, Object?>.from(e),
    ],
    items: [
      for (final e in j['items'] as List? ?? const [])
        if (e is Map) Map<String, Object?>.from(e),
    ],
    roi: j['roi'] is Map ? _map(j['roi']) : const {},
  );

  final String kind;
  final String titleEn;
  final String titleBn;
  final String? bodyEn;
  final String? bodyBn;
  final String? route;
  final List<Map<String, Object?>> leaders;
  final List<Map<String, Object?>> items;
  final Map<String, Object?> roi;

  String title({required bool bangla}) => bangla ? titleBn : titleEn;

  String? body({required bool bangla}) => bangla ? bodyBn : bodyEn;
}

@immutable
class Dashboard {
  const Dashboard({
    required this.layout,
    required this.needs,
    required this.kpis,
    required this.extras,
    required this.canBrief,
  });

  factory Dashboard.fromJson(Map<String, Object?> j) => Dashboard(
    layout: j['layout'] as String? ?? 'EMPLOYEE',
    needs: [
      for (final e in j['needs'] as List? ?? const [])
        if (e is Map) DashNeed.fromJson(Map<String, Object?>.from(e)),
    ],
    kpis: [
      for (final e in j['kpis'] as List? ?? const [])
        if (e is Map) DashKpi.fromJson(Map<String, Object?>.from(e)),
    ],
    extras: [
      for (final e in j['extras'] as List? ?? const [])
        if (e is Map) DashExtra.fromJson(Map<String, Object?>.from(e)),
    ],
    canBrief: j['canBrief'] == true,
  );

  final String layout;
  final List<DashNeed> needs;
  final List<DashKpi> kpis;
  final List<DashExtra> extras;
  final bool canBrief;
}
