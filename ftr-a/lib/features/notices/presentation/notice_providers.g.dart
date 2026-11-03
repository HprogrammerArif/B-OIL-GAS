// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notice_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(notices)
final noticesProvider = NoticesFamily._();

final class NoticesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Notice>>,
          List<Notice>,
          FutureOr<List<Notice>>
        >
    with $FutureModifier<List<Notice>>, $FutureProvider<List<Notice>> {
  NoticesProvider._({
    required NoticesFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'noticesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$noticesHash();

  @override
  String toString() {
    return r'noticesProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<List<Notice>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Notice>> create(Ref ref) {
    final argument = this.argument as String;
    return notices(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is NoticesProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$noticesHash() => r'aebb31e8ea7b11e0663f5b3a5c53cda94fc9f3b6';

final class NoticesFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<Notice>>, String> {
  NoticesFamily._()
    : super(
        retry: null,
        name: r'noticesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  NoticesProvider call(String filter) =>
      NoticesProvider._(argument: filter, from: this);

  @override
  String toString() => r'noticesProvider';
}

@ProviderFor(noticeDetail)
final noticeDetailProvider = NoticeDetailFamily._();

final class NoticeDetailProvider
    extends $FunctionalProvider<AsyncValue<Notice>, Notice, FutureOr<Notice>>
    with $FutureModifier<Notice>, $FutureProvider<Notice> {
  NoticeDetailProvider._({
    required NoticeDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'noticeDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$noticeDetailHash();

  @override
  String toString() {
    return r'noticeDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<Notice> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<Notice> create(Ref ref) {
    final argument = this.argument as String;
    return noticeDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is NoticeDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$noticeDetailHash() => r'26961875ff8fa721675bc7927751e5df30664ed2';

final class NoticeDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<Notice>, String> {
  NoticeDetailFamily._()
    : super(
        retry: null,
        name: r'noticeDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  NoticeDetailProvider call(String id) =>
      NoticeDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'noticeDetailProvider';
}

@ProviderFor(noticeOptions)
final noticeOptionsProvider = NoticeOptionsProvider._();

final class NoticeOptionsProvider
    extends
        $FunctionalProvider<
          AsyncValue<NoticeOptions>,
          NoticeOptions,
          FutureOr<NoticeOptions>
        >
    with $FutureModifier<NoticeOptions>, $FutureProvider<NoticeOptions> {
  NoticeOptionsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'noticeOptionsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$noticeOptionsHash();

  @$internal
  @override
  $FutureProviderElement<NoticeOptions> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<NoticeOptions> create(Ref ref) {
    return noticeOptions(ref);
  }
}

String _$noticeOptionsHash() => r'90523e9ace6f01d523a813ed3fe3e023c67d8f78';

@ProviderFor(noticeReceipts)
final noticeReceiptsProvider = NoticeReceiptsFamily._();

final class NoticeReceiptsProvider
    extends
        $FunctionalProvider<
          AsyncValue<NoticeReceipts>,
          NoticeReceipts,
          FutureOr<NoticeReceipts>
        >
    with $FutureModifier<NoticeReceipts>, $FutureProvider<NoticeReceipts> {
  NoticeReceiptsProvider._({
    required NoticeReceiptsFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'noticeReceiptsProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$noticeReceiptsHash();

  @override
  String toString() {
    return r'noticeReceiptsProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<NoticeReceipts> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<NoticeReceipts> create(Ref ref) {
    final argument = this.argument as String;
    return noticeReceipts(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is NoticeReceiptsProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$noticeReceiptsHash() => r'f262eae8b7fcb3a00f1f348a97b36c443fceb103';

final class NoticeReceiptsFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<NoticeReceipts>, String> {
  NoticeReceiptsFamily._()
    : super(
        retry: null,
        name: r'noticeReceiptsProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  NoticeReceiptsProvider call(String id) =>
      NoticeReceiptsProvider._(argument: id, from: this);

  @override
  String toString() => r'noticeReceiptsProvider';
}

@ProviderFor(noticeCounts)
final noticeCountsProvider = NoticeCountsProvider._();

final class NoticeCountsProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<String, int>>,
          Map<String, int>,
          FutureOr<Map<String, int>>
        >
    with $FutureModifier<Map<String, int>>, $FutureProvider<Map<String, int>> {
  NoticeCountsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'noticeCountsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$noticeCountsHash();

  @$internal
  @override
  $FutureProviderElement<Map<String, int>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<Map<String, int>> create(Ref ref) {
    return noticeCounts(ref);
  }
}

String _$noticeCountsHash() => r'142be93e3c86a60e0406faea7e773af974997794';
