import 'package:bogcl_oneops/features/attendance/data/attendance_repository.dart';
import 'package:bogcl_oneops/features/attendance/domain/attendance_models.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'attendance_providers.g.dart';

/// Re-runs providers when the signed-in user changes.
void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<TodayAttendance> todayAttendance(Ref ref) {
  _watchUser(ref);
  return ref.watch(attendanceRepositoryProvider).today();
}

/// [month] is `YYYY-MM`; the range is clipped to today by the server.
@riverpod
Future<AttendanceRange> attendanceMonth(Ref ref, String month) {
  _watchUser(ref);
  final parts = month.split('-').map(int.parse).toList();
  final last = DateTime.utc(parts[0], parts[1] + 1, 0).day;
  return ref
      .watch(attendanceRepositoryProvider)
      .range('$month-01', '$month-${last.toString().padLeft(2, '0')}');
}

@riverpod
Future<List<Regularisation>> myRegularisations(Ref ref) {
  _watchUser(ref);
  return ref.watch(attendanceRepositoryProvider).regularisations();
}

@riverpod
Future<TeamRoster?> teamAttendance(Ref ref) async {
  _watchUser(ref);
  final session = ref.read(sessionControllerProvider).value;
  if (session == null || !session.can('attendance:read', GrantScope.team)) {
    return null;
  }
  try {
    return await ref.watch(attendanceRepositoryProvider).team();
  } on Object {
    return null;
  }
}
