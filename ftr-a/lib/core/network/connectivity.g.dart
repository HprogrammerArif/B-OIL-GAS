// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'connectivity.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Whether the device itself reports a network connection.

@ProviderFor(deviceOnline)
final deviceOnlineProvider = DeviceOnlineProvider._();

/// Whether the device itself reports a network connection.

final class DeviceOnlineProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, Stream<bool>>
    with $FutureModifier<bool>, $StreamProvider<bool> {
  /// Whether the device itself reports a network connection.
  DeviceOnlineProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'deviceOnlineProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$deviceOnlineHash();

  @$internal
  @override
  $StreamProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<bool> create(Ref ref) {
    return deviceOnline(ref);
  }
}

String _$deviceOnlineHash() => r'7ecc3b0c54b72fae61a89fb0a62d4a26d773310a';
