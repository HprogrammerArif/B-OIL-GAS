// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'workforce_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(staffList)
final staffListProvider = StaffListFamily._();

final class StaffListProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<StaffMember>>,
          List<StaffMember>,
          FutureOr<List<StaffMember>>
        >
    with
        $FutureModifier<List<StaffMember>>,
        $FutureProvider<List<StaffMember>> {
  StaffListProvider._({
    required StaffListFamily super.from,
    required ({String view, String? query}) super.argument,
  }) : super(
         retry: null,
         name: r'staffListProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$staffListHash();

  @override
  String toString() {
    return r'staffListProvider'
        ''
        '$argument';
  }

  @$internal
  @override
  $FutureProviderElement<List<StaffMember>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<StaffMember>> create(Ref ref) {
    final argument = this.argument as ({String view, String? query});
    return staffList(ref, view: argument.view, query: argument.query);
  }

  @override
  bool operator ==(Object other) {
    return other is StaffListProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$staffListHash() => r'd3dd55f0e7646acc38e89a567e6c0eb2760bab7f';

final class StaffListFamily extends $Family
    with
        $FunctionalFamilyOverride<
          FutureOr<List<StaffMember>>,
          ({String view, String? query})
        > {
  StaffListFamily._()
    : super(
        retry: null,
        name: r'staffListProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  StaffListProvider call({String view = 'all', String? query}) =>
      StaffListProvider._(argument: (view: view, query: query), from: this);

  @override
  String toString() => r'staffListProvider';
}

@ProviderFor(staffDetail)
final staffDetailProvider = StaffDetailFamily._();

final class StaffDetailProvider
    extends
        $FunctionalProvider<
          AsyncValue<StaffMember>,
          StaffMember,
          FutureOr<StaffMember>
        >
    with $FutureModifier<StaffMember>, $FutureProvider<StaffMember> {
  StaffDetailProvider._({
    required StaffDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'staffDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$staffDetailHash();

  @override
  String toString() {
    return r'staffDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<StaffMember> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<StaffMember> create(Ref ref) {
    final argument = this.argument as String;
    return staffDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is StaffDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$staffDetailHash() => r'1b548045029604621f88e9ccbc378942b62c358a';

final class StaffDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<StaffMember>, String> {
  StaffDetailFamily._()
    : super(
        retry: null,
        name: r'staffDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  StaffDetailProvider call(String id) =>
      StaffDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'staffDetailProvider';
}
