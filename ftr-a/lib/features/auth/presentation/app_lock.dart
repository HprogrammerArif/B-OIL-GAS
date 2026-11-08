import 'package:bogcl_oneops/core/storage/secure_store.dart';
import 'package:bogcl_oneops/core/utils/logger.dart';
import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_lock.g.dart';

/// Background time after which the app asks for biometrics again (doc 05-F §7).
const Duration appLockTimeout = Duration(minutes: 2);

/// Whether the device can do biometric / screen-lock authentication.
@Riverpod(keepAlive: true)
Future<bool> biometricSupported(Ref ref) async {
  try {
    return await LocalAuthentication().isDeviceSupported();
  } on Object catch (e) {
    AppLog.warn('biometric support check failed: $e', tag: 'lock');
    return false;
  }
}

/// User preference. On by default when the device supports it.
@Riverpod(keepAlive: true)
class BiometricEnabled extends _$BiometricEnabled {
  @override
  Future<bool> build() async {
    final stored = await ref
        .read(secureStoreProvider)
        .read(SecureKeys.biometricEnabled);
    return stored != 'false';
  }

  Future<void> set({required bool value}) async {
    state = AsyncData(value);
    await ref
        .read(secureStoreProvider)
        .write(SecureKeys.biometricEnabled, value.toString());
  }
}

/// Whether the lock overlay is showing.
@Riverpod(keepAlive: true)
class AppLocked extends _$AppLocked {
  @override
  bool build() => false;

  void lock() => state = true;
  void unlock() => state = false;
}

/// Wraps the app: background auto-lock is disabled so the app never interrupts
/// the user with a lock screen when returning from the background.
class AppLockGate extends StatelessWidget {
  const AppLockGate({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) => child;
}
