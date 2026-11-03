// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'activity_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// "My activity": the caller's recent audit entries, newest first.

@ProviderFor(ActivityController)
final activityControllerProvider = ActivityControllerProvider._();

/// "My activity": the caller's recent audit entries, newest first.
final class ActivityControllerProvider
    extends $AsyncNotifierProvider<ActivityController, ActivityState> {
  /// "My activity": the caller's recent audit entries, newest first.
  ActivityControllerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'activityControllerProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$activityControllerHash();

  @$internal
  @override
  ActivityController create() => ActivityController();
}

String _$activityControllerHash() =>
    r'e0ac7a48cd1edb4df6fb3efc1a83cbc25da43124';

/// "My activity": the caller's recent audit entries, newest first.

abstract class _$ActivityController extends $AsyncNotifier<ActivityState> {
  FutureOr<ActivityState> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<AsyncValue<ActivityState>, ActivityState>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<ActivityState>, ActivityState>,
              AsyncValue<ActivityState>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
