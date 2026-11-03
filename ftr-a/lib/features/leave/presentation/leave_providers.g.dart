// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'leave_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(leaveBalances)
final leaveBalancesProvider = LeaveBalancesProvider._();

final class LeaveBalancesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<LeaveBalance>>,
          List<LeaveBalance>,
          FutureOr<List<LeaveBalance>>
        >
    with
        $FutureModifier<List<LeaveBalance>>,
        $FutureProvider<List<LeaveBalance>> {
  LeaveBalancesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'leaveBalancesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$leaveBalancesHash();

  @$internal
  @override
  $FutureProviderElement<List<LeaveBalance>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<LeaveBalance>> create(Ref ref) {
    return leaveBalances(ref);
  }
}

String _$leaveBalancesHash() => r'117b4fe964ceb91cf87087bfb16b57fd85ef1ec2';

@ProviderFor(myLeaveRequests)
final myLeaveRequestsProvider = MyLeaveRequestsProvider._();

final class MyLeaveRequestsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<LeaveRequestItem>>,
          List<LeaveRequestItem>,
          FutureOr<List<LeaveRequestItem>>
        >
    with
        $FutureModifier<List<LeaveRequestItem>>,
        $FutureProvider<List<LeaveRequestItem>> {
  MyLeaveRequestsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'myLeaveRequestsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$myLeaveRequestsHash();

  @$internal
  @override
  $FutureProviderElement<List<LeaveRequestItem>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<LeaveRequestItem>> create(Ref ref) {
    return myLeaveRequests(ref);
  }
}

String _$myLeaveRequestsHash() => r'44371298713a19870f6e6c5905a52408612c172a';

@ProviderFor(leaveTypes)
final leaveTypesProvider = LeaveTypesProvider._();

final class LeaveTypesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<LeaveType>>,
          List<LeaveType>,
          FutureOr<List<LeaveType>>
        >
    with $FutureModifier<List<LeaveType>>, $FutureProvider<List<LeaveType>> {
  LeaveTypesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'leaveTypesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$leaveTypesHash();

  @$internal
  @override
  $FutureProviderElement<List<LeaveType>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<LeaveType>> create(Ref ref) {
    return leaveTypes(ref);
  }
}

String _$leaveTypesHash() => r'c86503266e62331f7a084c175b13f93417859319';

@ProviderFor(leavePolicy)
final leavePolicyProvider = LeavePolicyProvider._();

final class LeavePolicyProvider
    extends
        $FunctionalProvider<
          AsyncValue<LeavePolicyInfo>,
          LeavePolicyInfo,
          FutureOr<LeavePolicyInfo>
        >
    with $FutureModifier<LeavePolicyInfo>, $FutureProvider<LeavePolicyInfo> {
  LeavePolicyProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'leavePolicyProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$leavePolicyHash();

  @$internal
  @override
  $FutureProviderElement<LeavePolicyInfo> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<LeavePolicyInfo> create(Ref ref) {
    return leavePolicy(ref);
  }
}

String _$leavePolicyHash() => r'6d39030e265f6cf689d7473243705c45216d9851';

@ProviderFor(leaveDetail)
final leaveDetailProvider = LeaveDetailFamily._();

final class LeaveDetailProvider
    extends
        $FunctionalProvider<
          AsyncValue<LeaveRequestItem>,
          LeaveRequestItem,
          FutureOr<LeaveRequestItem>
        >
    with $FutureModifier<LeaveRequestItem>, $FutureProvider<LeaveRequestItem> {
  LeaveDetailProvider._({
    required LeaveDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'leaveDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$leaveDetailHash();

  @override
  String toString() {
    return r'leaveDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<LeaveRequestItem> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<LeaveRequestItem> create(Ref ref) {
    final argument = this.argument as String;
    return leaveDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is LeaveDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$leaveDetailHash() => r'99fb600b3defd9a0273eb2822e3dbecf5ad5d1b7';

final class LeaveDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<LeaveRequestItem>, String> {
  LeaveDetailFamily._()
    : super(
        retry: null,
        name: r'leaveDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  LeaveDetailProvider call(String id) =>
      LeaveDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'leaveDetailProvider';
}
