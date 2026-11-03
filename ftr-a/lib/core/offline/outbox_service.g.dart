// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'outbox_service.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(outboxService)
final outboxServiceProvider = OutboxServiceProvider._();

final class OutboxServiceProvider
    extends $FunctionalProvider<OutboxService, OutboxService, OutboxService>
    with $Provider<OutboxService> {
  OutboxServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'outboxServiceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$outboxServiceHash();

  @$internal
  @override
  $ProviderElement<OutboxService> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  OutboxService create(Ref ref) {
    return outboxService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(OutboxService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<OutboxService>(value),
    );
  }
}

String _$outboxServiceHash() => r'9e38e642ac7a0007c92e2cd9943501b8d91af757';
