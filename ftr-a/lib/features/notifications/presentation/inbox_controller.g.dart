// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'inbox_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Inbox list with filters, paging and optimistic read/ack.

@ProviderFor(InboxController)
final inboxControllerProvider = InboxControllerProvider._();

/// Inbox list with filters, paging and optimistic read/ack.
final class InboxControllerProvider
    extends $AsyncNotifierProvider<InboxController, InboxState> {
  /// Inbox list with filters, paging and optimistic read/ack.
  InboxControllerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'inboxControllerProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$inboxControllerHash();

  @$internal
  @override
  InboxController create() => InboxController();
}

String _$inboxControllerHash() => r'c4c397abcd66437c841bf6c2dc908e0a9d09c986';

/// Inbox list with filters, paging and optimistic read/ack.

abstract class _$InboxController extends $AsyncNotifier<InboxState> {
  FutureOr<InboxState> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<AsyncValue<InboxState>, InboxState>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<InboxState>, InboxState>,
              AsyncValue<InboxState>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}

/// Unread badge for the Inbox tab. Polls while a user is signed in.

@ProviderFor(UnreadSummaryController)
final unreadSummaryControllerProvider = UnreadSummaryControllerProvider._();

/// Unread badge for the Inbox tab. Polls while a user is signed in.
final class UnreadSummaryControllerProvider
    extends $AsyncNotifierProvider<UnreadSummaryController, UnreadSummary> {
  /// Unread badge for the Inbox tab. Polls while a user is signed in.
  UnreadSummaryControllerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'unreadSummaryControllerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$unreadSummaryControllerHash();

  @$internal
  @override
  UnreadSummaryController create() => UnreadSummaryController();
}

String _$unreadSummaryControllerHash() =>
    r'fe7b49454af0615f54019c24876e6f6f2cd76664';

/// Unread badge for the Inbox tab. Polls while a user is signed in.

abstract class _$UnreadSummaryController extends $AsyncNotifier<UnreadSummary> {
  FutureOr<UnreadSummary> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<AsyncValue<UnreadSummary>, UnreadSummary>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<UnreadSummary>, UnreadSummary>,
              AsyncValue<UnreadSummary>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
