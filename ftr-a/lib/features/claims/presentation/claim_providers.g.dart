// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'claim_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(claims)
final claimsProvider = ClaimsFamily._();

final class ClaimsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Claim>>,
          List<Claim>,
          FutureOr<List<Claim>>
        >
    with $FutureModifier<List<Claim>>, $FutureProvider<List<Claim>> {
  ClaimsProvider._({
    required ClaimsFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'claimsProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$claimsHash();

  @override
  String toString() {
    return r'claimsProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<List<Claim>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Claim>> create(Ref ref) {
    final argument = this.argument as String;
    return claims(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ClaimsProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$claimsHash() => r'd7c82bae518c6cb27e7513634f88b7b7cb9fdf7f';

final class ClaimsFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<Claim>>, String> {
  ClaimsFamily._()
    : super(
        retry: null,
        name: r'claimsProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ClaimsProvider call(String scope) =>
      ClaimsProvider._(argument: scope, from: this);

  @override
  String toString() => r'claimsProvider';
}

@ProviderFor(claimDetail)
final claimDetailProvider = ClaimDetailFamily._();

final class ClaimDetailProvider
    extends $FunctionalProvider<AsyncValue<Claim>, Claim, FutureOr<Claim>>
    with $FutureModifier<Claim>, $FutureProvider<Claim> {
  ClaimDetailProvider._({
    required ClaimDetailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'claimDetailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$claimDetailHash();

  @override
  String toString() {
    return r'claimDetailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<Claim> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<Claim> create(Ref ref) {
    final argument = this.argument as String;
    return claimDetail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is ClaimDetailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$claimDetailHash() => r'1f764b349968a9c7c79646d0d23b6600bacc5158';

final class ClaimDetailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<Claim>, String> {
  ClaimDetailFamily._()
    : super(
        retry: null,
        name: r'claimDetailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ClaimDetailProvider call(String id) =>
      ClaimDetailProvider._(argument: id, from: this);

  @override
  String toString() => r'claimDetailProvider';
}

@ProviderFor(claimPolicy)
final claimPolicyProvider = ClaimPolicyProvider._();

final class ClaimPolicyProvider
    extends
        $FunctionalProvider<
          AsyncValue<ClaimPolicyInfo>,
          ClaimPolicyInfo,
          FutureOr<ClaimPolicyInfo>
        >
    with $FutureModifier<ClaimPolicyInfo>, $FutureProvider<ClaimPolicyInfo> {
  ClaimPolicyProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'claimPolicyProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$claimPolicyHash();

  @$internal
  @override
  $FutureProviderElement<ClaimPolicyInfo> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<ClaimPolicyInfo> create(Ref ref) {
    return claimPolicy(ref);
  }
}

String _$claimPolicyHash() => r'b93f4dfb8eb18de68878ec6a99649084bbc47332';

@ProviderFor(advances)
final advancesProvider = AdvancesFamily._();

final class AdvancesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Advance>>,
          List<Advance>,
          FutureOr<List<Advance>>
        >
    with $FutureModifier<List<Advance>>, $FutureProvider<List<Advance>> {
  AdvancesProvider._({
    required AdvancesFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'advancesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$advancesHash();

  @override
  String toString() {
    return r'advancesProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<List<Advance>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Advance>> create(Ref ref) {
    final argument = this.argument as String;
    return advances(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is AdvancesProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$advancesHash() => r'ef1d2f27c7b47dcb506b4e2196b28751efcb70cf';

final class AdvancesFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<Advance>>, String> {
  AdvancesFamily._()
    : super(
        retry: null,
        name: r'advancesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  AdvancesProvider call(String scope) =>
      AdvancesProvider._(argument: scope, from: this);

  @override
  String toString() => r'advancesProvider';
}
