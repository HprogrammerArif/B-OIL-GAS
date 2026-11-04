// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(dashboardMe)
final dashboardMeProvider = DashboardMeProvider._();

final class DashboardMeProvider
    extends
        $FunctionalProvider<
          AsyncValue<Dashboard>,
          Dashboard,
          FutureOr<Dashboard>
        >
    with $FutureModifier<Dashboard>, $FutureProvider<Dashboard> {
  DashboardMeProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'dashboardMeProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$dashboardMeHash();

  @$internal
  @override
  $FutureProviderElement<Dashboard> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<Dashboard> create(Ref ref) => dashboardMe(ref);
}

String _$dashboardMeHash() => r'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
