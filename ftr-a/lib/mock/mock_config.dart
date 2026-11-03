import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'mock_config.g.dart';

/// Failure injected into mock responses (demo menu).
enum MockFailureMode { none, timeout, serverError, conflict }

/// Where the demo phone claims to be when punching (demo menu). `device`
/// uses the real GPS; the others return a synthetic fix near a seeded fence.
enum DemoLocation { device, headOffice, plant, outside, mockGps }

@immutable
class MockConfig {
  const MockConfig({
    this.minLatencyMs = 150,
    this.maxLatencyMs = 600,
    this.offline = false,
    this.failure = MockFailureMode.none,
    this.location = DemoLocation.headOffice,
  });

  final int minLatencyMs;
  final int maxLatencyMs;

  /// "Simulate offline": every request fails with a connection error.
  final bool offline;
  final MockFailureMode failure;
  final DemoLocation location;

  MockConfig copyWith({
    int? minLatencyMs,
    int? maxLatencyMs,
    bool? offline,
    MockFailureMode? failure,
    DemoLocation? location,
  }) => MockConfig(
    minLatencyMs: minLatencyMs ?? this.minLatencyMs,
    maxLatencyMs: maxLatencyMs ?? this.maxLatencyMs,
    offline: offline ?? this.offline,
    failure: failure ?? this.failure,
    location: location ?? this.location,
  );
}

/// Live mock-server knobs, driven by the hidden demo menu.
@Riverpod(keepAlive: true)
class MockConfigController extends _$MockConfigController {
  @override
  MockConfig build() => const MockConfig();

  void setOffline({required bool value}) =>
      state = state.copyWith(offline: value);

  void setFailure(MockFailureMode mode) =>
      state = state.copyWith(failure: mode);

  void setLocation(DemoLocation mode) => state = state.copyWith(location: mode);

  /// Slow network preset to show skeletons in a pitch.
  void setSlow({required bool value}) => state = state.copyWith(
    minLatencyMs: value ? 1500 : 150,
    maxLatencyMs: value ? 3000 : 600,
  );
}
