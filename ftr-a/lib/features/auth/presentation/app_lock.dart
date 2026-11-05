import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/storage/secure_store.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/logger.dart';
import 'package:bogcl_oneops/features/auth/data/auth_repository.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

/// Wraps the app: locks after [appLockTimeout] in the background and shows the
/// lock screen over everything until the user authenticates.
class AppLockGate extends ConsumerStatefulWidget {
  const AppLockGate({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<AppLockGate> createState() => _AppLockGateState();
}

class _AppLockGateState extends ConsumerState<AppLockGate>
    with WidgetsBindingObserver {
  DateTime? _pausedAt;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _pausedAt = DateTime.now();
    } else if (state == AppLifecycleState.resumed) {
      final since = _pausedAt;
      _pausedAt = null;
      if (since == null || DateTime.now().difference(since) < appLockTimeout) {
        return;
      }
      final signedIn = ref.read(sessionControllerProvider).value != null;
      if (signedIn) {
        ref.read(appLockedProvider.notifier).lock();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Signing out always clears the lock.
    ref.listen(sessionControllerProvider, (_, next) {
      if (next.value == null) ref.read(appLockedProvider.notifier).unlock();
    });
    final locked = ref.watch(appLockedProvider);
    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        if (locked) const Positioned.fill(child: _LockScreen()),
      ],
    );
  }
}

class _LockScreen extends ConsumerStatefulWidget {
  const _LockScreen();

  @override
  ConsumerState<_LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends ConsumerState<_LockScreen> {
  final _password = TextEditingController();
  bool _busy = false;
  bool _failed = false;
  int _left = 5;

  @override
  void initState() {
    super.initState();
    final enabled = ref.read(biometricEnabledProvider).value ?? false;
    final supported = ref.read(biometricSupportedProvider).value ?? false;
    if (enabled && supported) {
      WidgetsBinding.instance.addPostFrameCallback((_) => unawaited(_unlock()));
    }
  }

  @override
  void dispose() {
    _password.dispose();
    super.dispose();
  }

  Future<void> _unlock() async {
    if (_busy) return;
    final reason = context.l10n.lockReason;
    setState(() {
      _busy = true;
      _failed = false;
    });
    var ok = false;
    try {
      ok = await LocalAuthentication().authenticate(localizedReason: reason);
    } on Object catch (e) {
      AppLog.warn('biometric prompt failed: $e', tag: 'lock');
    }
    if (!mounted) return;
    if (ok) {
      ref.read(appLockedProvider.notifier).unlock();
    } else {
      setState(() {
        _busy = false;
        _failed = true;
      });
    }
  }

  Future<void> _unlockPassword() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _failed = false;
    });
    try {
      await ref.read(authRepositoryProvider).unlockWithPassword(_password.text);
      if (!mounted) return;
      ref.read(appLockedProvider.notifier).unlock();
    } on ApiException catch (e) {
      if (e.reason == 'UNLOCK_LOCKED_OUT') {
        await ref.read(sessionControllerProvider.notifier).logout();
        return;
      }
      if (!mounted) return;
      setState(() {
        _busy = false;
        _failed = true;
        _left =
            (e.details.firstOrNull?['attemptsLeft'] as num?)?.toInt() ??
            (_left - 1);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final supported = ref.watch(biometricSupportedProvider).value ?? false;
    return Material(
      color: theme.scaffoldBackgroundColor,
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(Space.xxl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 360),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.lock_outline,
                    size: 56,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(height: Space.xl),
                  Text(l10n.lockTitle, style: theme.textTheme.headlineSmall),
                  const SizedBox(height: Space.sm),
                  Text(
                    l10n.lockMessagePassword,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (_failed) ...[
                    const SizedBox(height: Space.lg),
                    Semantics(
                      liveRegion: true,
                      child: Text(
                        l10n.lockFailedLeft(_left),
                        style: TextStyle(color: theme.colorScheme.error),
                      ),
                    ),
                  ],
                  const SizedBox(height: Space.lg),
                  AppTextField(
                    label: l10n.lockPassword,
                    controller: _password,
                    obscure: true,
                    onSubmitted: (_) => unawaited(_unlockPassword()),
                  ),
                  const SizedBox(height: Space.md),
                  PrimaryButton(
                    label: l10n.lockUnlockPassword,
                    loading: _busy,
                    onPressed: _unlockPassword,
                  ),
                  if (supported) ...[
                    const SizedBox(height: Space.sm),
                    PrimaryButton.secondary(
                      label: l10n.lockUnlock,
                      icon: Icons.fingerprint,
                      onPressed: _busy ? null : _unlock,
                    ),
                  ],
                  const SizedBox(height: Space.sm),
                  PrimaryButton.secondary(
                    label: l10n.signOut,
                    onPressed: () =>
                        ref.read(sessionControllerProvider.notifier).logout(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
