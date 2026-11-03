import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

/// A colleague as shown in a picker.
@immutable
class PersonPick {
  const PersonPick({
    required this.person,
    required this.department,
    required this.departmentBn,
    required this.site,
    required this.siteBn,
  });

  factory PersonPick.fromJson(Map<String, Object?> j) => PersonPick(
    person: Person.fromJson(j),
    department: (j['department'] as String?) ?? '',
    departmentBn: (j['departmentBn'] as String?) ?? '',
    site: (j['site'] as String?) ?? '',
    siteBn: (j['siteBn'] as String?) ?? '',
  );

  final Person person;
  final String department;
  final String departmentBn;
  final String site;
  final String siteBn;

  String where({required bool bangla}) =>
      bangla ? '$departmentBn, $siteBn' : '$department, $site';
}
