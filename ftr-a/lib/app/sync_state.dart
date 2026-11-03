import 'dart:async';

import 'package:bogcl_oneops/core/network/connectivity.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/mock/mock_config.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'sync_state.g.dart';

/// True when the device has no network or the demo "Simulate offline" is on.
@Riverpod(keepAlive: true)
bool isOffline(Ref ref) {
  final deviceOnline = ref.watch(deviceOnlineProvider).value ?? true;
  final simulated = ref.watch(mockConfigControllerProvider).offline;
  return !deviceOnline || simulated;
}

/// Replays the outbox whenever connectivity returns or a session starts.
/// Watched once from the app root.
@Riverpod(keepAlive: true)
void syncCoordinator(Ref ref) {
  final outbox = ref.watch(outboxServiceProvider);

  ref
    ..listen(isOfflineProvider, (previous, offline) {
      if (previous == true && !offline) unawaited(outbox.replay());
    })
    ..listen(sessionControllerProvider, (previous, next) {
      final wasSignedIn = previous?.value != null;
      if (!wasSignedIn && next.value != null && !ref.read(isOfflineProvider)) {
        unawaited(outbox.replay());
      }
    });
}
