import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/notices/data/notice_repository.dart';
import 'package:bogcl_oneops/features/notices/domain/notice_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'notice_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<Notice>> notices(Ref ref, String filter) {
  _watchUser(ref);
  return ref.watch(noticeRepositoryProvider).list(filter: filter);
}

@riverpod
Future<Notice> noticeDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(noticeRepositoryProvider).detail(id);
}

@riverpod
Future<NoticeOptions> noticeOptions(Ref ref) {
  _watchUser(ref);
  return ref.watch(noticeRepositoryProvider).options();
}

@riverpod
Future<NoticeReceipts> noticeReceipts(Ref ref, String id) =>
    ref.watch(noticeRepositoryProvider).receipts(id);

@riverpod
Future<Map<String, int>> noticeCounts(Ref ref) {
  _watchUser(ref);
  return ref.watch(noticeRepositoryProvider).unreadCount();
}
