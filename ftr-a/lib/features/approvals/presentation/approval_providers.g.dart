// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approval_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(approvalInbox)
final approvalInboxProvider = ApprovalInboxProvider._();

final class ApprovalInboxProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<InboxItem>>,
          List<InboxItem>,
          FutureOr<List<InboxItem>>
        >
    with $FutureModifier<List<InboxItem>>, $FutureProvider<List<InboxItem>> {
  ApprovalInboxProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'approvalInboxProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$approvalInboxHash();

  @$internal
  @override
  $FutureProviderElement<List<InboxItem>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<InboxItem>> create(Ref ref) {
    return approvalInbox(ref);
  }
}

String _$approvalInboxHash() => r'83f55f5dbe99d514e146ee66d71c2bec5cae2655';

@ProviderFor(approvalSummary)
final approvalSummaryProvider = ApprovalSummaryProvider._();

final class ApprovalSummaryProvider
    extends
        $FunctionalProvider<
          AsyncValue<InboxSummary>,
          InboxSummary,
          FutureOr<InboxSummary>
        >
    with $FutureModifier<InboxSummary>, $FutureProvider<InboxSummary> {
  ApprovalSummaryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'approvalSummaryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$approvalSummaryHash();

  @$internal
  @override
  $FutureProviderElement<InboxSummary> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<InboxSummary> create(Ref ref) {
    return approvalSummary(ref);
  }
}

String _$approvalSummaryHash() => r'2192715659b3428d36527439d6599f9653960e13';

@ProviderFor(approvalHistory)
final approvalHistoryProvider = ApprovalHistoryProvider._();

final class ApprovalHistoryProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<HistoryItem>>,
          List<HistoryItem>,
          FutureOr<List<HistoryItem>>
        >
    with
        $FutureModifier<List<HistoryItem>>,
        $FutureProvider<List<HistoryItem>> {
  ApprovalHistoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'approvalHistoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$approvalHistoryHash();

  @$internal
  @override
  $FutureProviderElement<List<HistoryItem>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<HistoryItem>> create(Ref ref) {
    return approvalHistory(ref);
  }
}

String _$approvalHistoryHash() => r'123b7a6d5297dbe2f7645eb680eb5c58f9998f29';

@ProviderFor(approvalDetail)
final approvalDetailProvider = ApprovalDetailFamily._();

final class ApprovalDetailProvider
    extends
        $FunctionalProvider<
          AsyncValue<ApprovalDetail>,
          ApprovalDetail,
          FutureOr<ApprovalDetail>
        >
    with $FutureModifier<ApprovalDetail>, $FutureProvider<ApprovalDetail> {
  ApprovalDetailProvider._({
    required ApprovalDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'approvalDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$approvalDetailHash();

  @override
  String toString() {
    return r'approvalDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<ApprovalDetail> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<ApprovalDetail> create(Ref ref) {
    final argument = this.argument as String;
    return approvalDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ApprovalDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$approvalDetailHash() => r'3babb25359017b18193e38a8518a9cbc6a948ad8';

final class ApprovalDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<ApprovalDetail>, String> {
  ApprovalDetailFamily._()
    : super(
        retry: null,
        name: r'approvalDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ApprovalDetailProvider call(String instanceId) =>
      ApprovalDetailProvider._(argument: instanceId, from: this);

  @override
  String toString() => r'approvalDetailProvider';
}

@ProviderFor(approvalDelegates)
final approvalDelegatesProvider = ApprovalDelegatesProvider._();

final class ApprovalDelegatesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Person>>,
          List<Person>,
          FutureOr<List<Person>>
        >
    with $FutureModifier<List<Person>>, $FutureProvider<List<Person>> {
  ApprovalDelegatesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'approvalDelegatesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$approvalDelegatesHash();

  @$internal
  @override
  $FutureProviderElement<List<Person>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Person>> create(Ref ref) {
    return approvalDelegates(ref);
  }
}

String _$approvalDelegatesHash() => r'91d4d1f1378f75fccbf87745c4b41491d62ae4b5';
