// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'workflow_trail.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(workflowTrail)
final workflowTrailProvider = WorkflowTrailFamily._();

final class WorkflowTrailProvider
    extends
        $FunctionalProvider<
          AsyncValue<WorkflowTrail>,
          WorkflowTrail,
          FutureOr<WorkflowTrail>
        >
    with $FutureModifier<WorkflowTrail>, $FutureProvider<WorkflowTrail> {
  WorkflowTrailProvider._({
    required WorkflowTrailFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'workflowTrailProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$workflowTrailHash();

  @override
  String toString() {
    return r'workflowTrailProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<WorkflowTrail> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<WorkflowTrail> create(Ref ref) {
    final argument = this.argument as String;
    return workflowTrail(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is WorkflowTrailProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$workflowTrailHash() => r'd0bc14daf15e04e7df9410689a1b21225f6a8362';

final class WorkflowTrailFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<WorkflowTrail>, String> {
  WorkflowTrailFamily._()
    : super(
        retry: null,
        name: r'workflowTrailProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  WorkflowTrailProvider call(String instanceId) =>
      WorkflowTrailProvider._(argument: instanceId, from: this);

  @override
  String toString() => r'workflowTrailProvider';
}
