// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'file_image.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Bytes of an uploaded image, or null when unavailable (not scanned yet,
/// blocked, or missing). Never throws: callers fall back to initials.

@ProviderFor(fileBytes)
final fileBytesProvider = FileBytesFamily._();

/// Bytes of an uploaded image, or null when unavailable (not scanned yet,
/// blocked, or missing). Never throws: callers fall back to initials.

final class FileBytesProvider
    extends
        $FunctionalProvider<
          AsyncValue<Uint8List?>,
          Uint8List?,
          FutureOr<Uint8List?>
        >
    with $FutureModifier<Uint8List?>, $FutureProvider<Uint8List?> {
  /// Bytes of an uploaded image, or null when unavailable (not scanned yet,
  /// blocked, or missing). Never throws: callers fall back to initials.
  FileBytesProvider._({
    required FileBytesFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'fileBytesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$fileBytesHash();

  @override
  String toString() {
    return r'fileBytesProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<Uint8List?> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<Uint8List?> create(Ref ref) {
    final argument = this.argument as String;
    return fileBytes(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is FileBytesProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$fileBytesHash() => r'6ba468b66ffea103b819b290c6bc6ee40b2c92ba';

/// Bytes of an uploaded image, or null when unavailable (not scanned yet,
/// blocked, or missing). Never throws: callers fall back to initials.

final class FileBytesFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<Uint8List?>, String> {
  FileBytesFamily._()
    : super(
        retry: null,
        name: r'fileBytesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// Bytes of an uploaded image, or null when unavailable (not scanned yet,
  /// blocked, or missing). Never throws: callers fall back to initials.

  FileBytesProvider call(String fileId) =>
      FileBytesProvider._(argument: fileId, from: this);

  @override
  String toString() => r'fileBytesProvider';
}
