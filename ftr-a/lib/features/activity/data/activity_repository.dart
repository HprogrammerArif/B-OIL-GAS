import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'activity_repository.g.dart';

/// One line of the caller's own audit trail (`GET /me/activity`). Redacted:
/// no before/after values.
@immutable
class ActivityEntry {
  const ActivityEntry({
    required this.id,
    required this.action,
    required this.entityType,
    required this.createdAt,
    this.seq,
    this.entityId,
    this.prevHash,
    this.hash,
  });

  factory ActivityEntry.fromJson(Map<String, Object?> json) => ActivityEntry(
    id: json['id']! as String,
    action: json['action']! as String,
    entityType: json['entityType']! as String,
    createdAt: DateTime.parse(json['createdAt']! as String).toUtc(),
    seq: (json['seq'] as num?)?.toInt(),
    entityId: json['entityId'] as String?,
    prevHash: json['prevHash'] as String?,
    hash: json['hash'] as String?,
  );

  final String id;
  final String action;
  final String entityType;
  final DateTime createdAt;
  final int? seq;
  final String? entityId;
  final String? prevHash;
  final String? hash;
}

class ActivityRepository {
  ActivityRepository(this._dio);

  final Dio _dio;

  Future<CursorPage<ActivityEntry>> list({String? cursor}) async {
    try {
      final res = await _dio.get<Object?>(
        '/me/activity',
        queryParameters: {'cursor': ?cursor},
      );
      return Envelope.cursorPage(res.data, ActivityEntry.fromJson);
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
ActivityRepository activityRepository(Ref ref) =>
    ActivityRepository(ref.watch(dioProvider));
