import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'mock_config.g.dart';

/// Failure injected into mock responses (demo menu).
enum MockFailureMode { none, timeout, serverError, conflict }

@immutable
class MockConfig {
  const MockConfig({
    this.minLatencyMs = 150,
    this.maxLatencyMs = 600,
    this.offline = false,
    this.failure = MockFailureMode.none,
  });

  final int minLatencyMs;
  final int maxLatencyMs;

  /// "Simulate offline": every request fails with a connection error.
  final bool offline;
  final MockFailureMode failure;

  MockConfig copyWith({
    int? minLatencyMs,
    int? maxLatencyMs,
    bool? offline,
    MockFailureMode? failure,
  }) => MockConfig(
    minLatencyMs: minLatencyMs ?? this.minLatencyMs,
    maxLatencyMs: maxLatencyMs ?? this.maxLatencyMs,
    offline: offline ?? this.offline,
    failure: failure ?? this.failure,
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

  /// Slow network preset to show skeletons in a pitch.
  void setSlow({required bool value}) => state = state.copyWith(
    minLatencyMs: value ? 1500 : 150,
    maxLatencyMs: value ? 3000 : 600,
  );
}
