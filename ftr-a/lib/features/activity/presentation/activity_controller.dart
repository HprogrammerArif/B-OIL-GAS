import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/features/activity/data/activity_repository.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'activity_controller.g.dart';

@immutable
class ActivityState {
  const ActivityState({
    this.items = const [],
    this.nextCursor,
    this.loadingMore = false,
  });

  final List<ActivityEntry> items;
  final String? nextCursor;
  final bool loadingMore;

  bool get hasMore => nextCursor != null;
}

/// "My activity": the caller's recent audit entries, newest first.
@riverpod
class ActivityController extends _$ActivityController {
  @override
  Future<ActivityState> build() async {
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));
    final page = await ref.read(activityRepositoryProvider).list();
    return ActivityState(items: page.items, nextCursor: page.nextCursor);
  }

  Future<void> refresh() async {
    state = await AsyncValue.guard(() async {
      final page = await ref.read(activityRepositoryProvider).list();
      return ActivityState(items: page.items, nextCursor: page.nextCursor);
    });
  }

  /// Throws [ApiException] so the screen can toast.
  Future<void> loadMore() async {
    final cur = state.value;
    if (cur == null || !cur.hasMore || cur.loadingMore) return;
    state = AsyncData(
      ActivityState(
        items: cur.items,
        nextCursor: cur.nextCursor,
        loadingMore: true,
      ),
    );
    try {
      final page = await ref
          .read(activityRepositoryProvider)
          .list(cursor: cur.nextCursor);
      state = AsyncData(
        ActivityState(
          items: [...cur.items, ...page.items],
          nextCursor: page.nextCursor,
        ),
      );
    } on ApiException {
      state = AsyncData(
        ActivityState(items: cur.items, nextCursor: cur.nextCursor),
      );
      rethrow;
    }
  }
}
