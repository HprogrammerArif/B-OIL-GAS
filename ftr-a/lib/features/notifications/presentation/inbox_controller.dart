import 'dart:async';

import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/notifications/data/notifications_repository.dart';
import 'package:bogcl_oneops/features/notifications/domain/notification_models.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'inbox_controller.g.dart';

/// How often the unread badge re-checks the (mock) server. Real-time push
/// replaces this in Phase 7.
const unreadPollInterval = Duration(seconds: 20);

@immutable
class InboxState {
  const InboxState({
    this.items = const [],
    this.page = 1,
    this.hasMore = false,
    this.loadingMore = false,
    this.category = NotificationCategory.all,
    this.unreadOnly = false,
  });

  final List<AppNotification> items;
  final int page;
  final bool hasMore;
  final bool loadingMore;
  final NotificationCategory category;
  final bool unreadOnly;

  InboxState copyWith({
    List<AppNotification>? items,
    int? page,
    bool? hasMore,
    bool? loadingMore,
    NotificationCategory? category,
    bool? unreadOnly,
  }) => InboxState(
    items: items ?? this.items,
    page: page ?? this.page,
    hasMore: hasMore ?? this.hasMore,
    loadingMore: loadingMore ?? this.loadingMore,
    category: category ?? this.category,
    unreadOnly: unreadOnly ?? this.unreadOnly,
  );
}

/// Inbox list with filters, paging and optimistic read/ack.
@riverpod
class InboxController extends _$InboxController {
  NotificationCategory _category = NotificationCategory.all;
  bool _unreadOnly = false;

  @override
  Future<InboxState> build() async {
    // Rebuild (and drop old data) when the signed-in user changes.
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));
    return await _load(page: 1);
  }

  Future<InboxState> _load({
    required int page,
    List<AppNotification>? prior,
  }) async {
    final res = await ref
        .read(notificationsRepositoryProvider)
        .list(page: page, category: _category, unreadOnly: _unreadOnly);
    return InboxState(
      items: [...?prior, ...res.items],
      page: page,
      hasMore: res.meta.hasMore,
      category: _category,
      unreadOnly: _unreadOnly,
    );
  }

  Future<void> refresh() async {
    state = await AsyncValue.guard(() => _load(page: 1));
    unawaited(ref.read(unreadSummaryControllerProvider.notifier).refresh());
  }

  Future<void> setFilter({NotificationCategory? category, bool? unreadOnly}) {
    _category = category ?? _category;
    _unreadOnly = unreadOnly ?? _unreadOnly;
    state = const AsyncLoading<InboxState>();
    return refresh();
  }

  /// Loads the next page. Throws [ApiException] so the screen can toast.
  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || !current.hasMore || current.loadingMore) return;
    state = AsyncData(current.copyWith(loadingMore: true));
    try {
      state = AsyncData(
        await _load(page: current.page + 1, prior: current.items),
      );
    } on ApiException {
      state = AsyncData(current.copyWith(loadingMore: false));
      rethrow;
    }
  }

  void _patch(String id, AppNotification Function(AppNotification) f) {
    final current = state.value;
    if (current == null) return;
    state = AsyncData(
      current.copyWith(
        items: [
          for (final n in current.items)
            if (n.id == id) f(n) else n,
        ],
      ),
    );
  }

  Future<void> markRead(String id, {required String label}) async {
    final n = state.value?.items.where((e) => e.id == id).firstOrNull;
    if (n == null || n.isRead) return;
    _patch(id, (n) => n.copyWith(readAt: DateTime.now().toUtc()));
    ref.read(unreadSummaryControllerProvider.notifier).adjust(total: -1);
    try {
      await ref
          .read(notificationsRepositoryProvider)
          .markRead(id, label: label);
    } on ApiException {
      await refresh();
      rethrow;
    }
  }

  Future<void> markAllRead({required String label}) async {
    final now = DateTime.now().toUtc();
    final current = state.value;
    if (current != null) {
      state = AsyncData(
        current.copyWith(
          items: [
            for (final n in current.items)
              if (n.isRead) n else n.copyWith(readAt: now),
          ],
        ),
      );
    }
    try {
      await ref.read(notificationsRepositoryProvider).markAllRead(label: label);
    } finally {
      unawaited(ref.read(unreadSummaryControllerProvider.notifier).refresh());
    }
  }

  Future<void> acknowledge(String id, {required String label}) async {
    final wasUnread = state.value?.items.any((n) => n.id == id && !n.isRead);
    final now = DateTime.now().toUtc();
    _patch(id, (n) => n.copyWith(ackedAt: now, readAt: n.readAt ?? now));
    try {
      await ref
          .read(notificationsRepositoryProvider)
          .acknowledge(id, label: label);
    } on ApiException {
      await refresh();
      rethrow;
    }
    if (wasUnread ?? false) {
      ref.read(unreadSummaryControllerProvider.notifier).adjust(total: -1);
    }
    unawaited(ref.read(unreadSummaryControllerProvider.notifier).refresh());
  }
}

/// Unread badge for the Inbox tab. Polls while a user is signed in.
@Riverpod(keepAlive: true)
class UnreadSummaryController extends _$UnreadSummaryController {
  @override
  Future<UnreadSummary> build() async {
    final userId = ref.watch(
      sessionControllerProvider.select((s) => s.value?.profile.id),
    );
    if (userId == null) return const UnreadSummary();
    final timer = Timer.periodic(
      unreadPollInterval,
      (_) => unawaited(refresh()),
    );
    ref.onDispose(timer.cancel);
    return await _fetch();
  }

  Future<UnreadSummary> _fetch() async {
    try {
      return await ref.read(notificationsRepositoryProvider).unreadSummary();
    } on ApiException {
      // Badge is best-effort: keep the last known value when offline.
      return state.value ?? const UnreadSummary();
    }
  }

  Future<void> refresh() async {
    if (ref.read(sessionControllerProvider).value == null) return;
    state = AsyncData(await _fetch());
  }

  /// Optimistic local change before the server answers.
  void adjust({required int total}) {
    final cur = state.value ?? const UnreadSummary();
    state = AsyncData(
      UnreadSummary(
        total: (cur.total + total).clamp(0, 1 << 20),
        critical: cur.critical,
        pendingAck: cur.pendingAck,
      ),
    );
  }
}
