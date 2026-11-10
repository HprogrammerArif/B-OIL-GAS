import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'workflow_trail.g.dart';

enum TrailState { pending, active, approved, rejected, skipped, returned }

@immutable
class TrailPerson {
  const TrailPerson({
    required this.name,
    required this.nameBn,
    this.title,
    this.department,
    this.departmentBn,
  });

  factory TrailPerson.fromJson(Map<String, Object?> json) => TrailPerson(
    name: json['name']! as String,
    nameBn: (json['nameBn'] as String?) ?? json['name']! as String,
    title: json['title'] as String?,
    department: json['department'] as String?,
    departmentBn: json['departmentBn'] as String?,
  );

  final String name;
  final String nameBn;
  final String? title;
  final String? department;
  final String? departmentBn;

  String displayName({required bool bangla}) => bangla ? nameBn : name;

  String? departmentName({required bool bangla}) {
    final bn = departmentBn;
    if (bangla && bn != null && bn.isNotEmpty) return bn;
    final en = department;
    if (en == null || en.isEmpty) return null;
    return en;
  }
}

@immutable
class TrailStep {
  const TrailStep({
    required this.key,
    required this.name,
    required this.state,
    required this.approvers,
    this.comment,
    this.decidedBy,
    this.decidedAt,
    this.dueAt,
  });

  factory TrailStep.fromJson(Map<String, Object?> json) {
    final status = json['status']! as String;
    final decision = json['decision'] as String?;
    final decidedBy = json['decidedBy'];
    final decidedAt = json['decidedAt'] as String?;
    final dueAt = json['dueAt'] as String?;
    return TrailStep(
      key: json['key']! as String,
      name: json['name']! as String,
      state: switch ((status, decision)) {
        ('SKIPPED', _) => TrailState.skipped,
        ('ACTIVE', _) => TrailState.active,
        (_, 'APPROVED') => TrailState.approved,
        (_, 'REJECTED') => TrailState.rejected,
        (_, 'RETURNED') => TrailState.returned,
        _ => TrailState.pending,
      },
      approvers: [
        for (final a in (json['approvers'] as List? ?? const <Object?>[]))
          TrailPerson.fromJson(Map<String, Object?>.from(a! as Map)),
      ],
      comment: json['comment'] as String?,
      decidedBy: decidedBy is Map
          ? TrailPerson.fromJson(Map<String, Object?>.from(decidedBy))
          : null,
      decidedAt: decidedAt == null ? null : DateTime.parse(decidedAt).toUtc(),
      dueAt: dueAt == null ? null : DateTime.parse(dueAt).toUtc(),
    );
  }

  final String key;
  final String name;
  final TrailState state;
  final List<TrailPerson> approvers;
  final String? comment;
  final TrailPerson? decidedBy;
  final DateTime? decidedAt;
  final DateTime? dueAt;
}

/// Read-only approval route of one request (doc 03 `/workflow/instances/{id}`).
@immutable
class WorkflowTrail {
  const WorkflowTrail({required this.status, required this.steps});

  factory WorkflowTrail.fromJson(Map<String, Object?> json) => WorkflowTrail(
    status: json['status']! as String,
    steps: [
      for (final s in (json['steps'] as List? ?? const <Object?>[]))
        TrailStep.fromJson(Map<String, Object?>.from(s! as Map)),
    ],
  );

  final String status;
  final List<TrailStep> steps;
}

Duration? _noRetry(int retryCount, Object error) => null;

@Riverpod(retry: _noRetry)
Future<WorkflowTrail> workflowTrail(Ref ref, String instanceId) async {
  final dio = ref.watch(dioProvider);
  try {
    final res = await dio.get<Object?>('/workflow/instances/$instanceId');
    return WorkflowTrail.fromJson(Envelope.object(res.data));
  } on DioException catch (e) {
    throwApi(e);
  } catch (e, st) {
    Error.throwWithStackTrace(e, st);
  }
}
