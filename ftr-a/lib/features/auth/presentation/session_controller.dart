import 'dart:async';

import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/storage/secure_store.dart';
import 'package:bogcl_oneops/core/utils/logger.dart';
import 'package:bogcl_oneops/features/auth/data/auth_repository.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'session_controller.g.dart';

/// Current session. `null` data means signed out.
///
/// Tokens live only in secure storage. On start-up the refresh token is
/// exchanged for a fresh access token, so a valid session survives restarts.
@Riverpod(keepAlive: true)
class SessionController extends _$SessionController {
  Future<bool>? _refreshing;

  @override
  Future<Session?> build() async {
    final secure = ref.read(secureStoreProvider);
    final refresh = await secure.read(SecureKeys.refreshToken);
    if (refresh == null) return null;
    try {
      final tokens = await ref.read(authRepositoryProvider).refresh(refresh);
      await _saveTokens(tokens);
      return await ref.read(authRepositoryProvider).loadSession();
    } on ApiException catch (e) {
      // Offline at start-up: keep the stored session, retry on next call.
      if (e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout) {
        rethrow;
      }
      await secure.clearSession();
      return null;
    }
  }

  Future<void> _saveTokens(AuthTokens t) async {
    final secure = ref.read(secureStoreProvider);
    await secure.write(SecureKeys.accessToken, t.accessToken);
    await secure.write(SecureKeys.refreshToken, t.refreshToken);
  }

  /// Signs in. Throws [ApiException] so the form can show a generic message.
  Future<void> login(String identifier, String password) async {
    final repo = ref.read(authRepositoryProvider);
    final tokens = await repo.login(identifier, password);
    await _saveTokens(tokens);
    state = AsyncData(await repo.loadSession());
  }

  /// Demo-menu persona switch: signs out silently, then signs in as [empCode].
  Future<void> switchPersona(String empCode) async {
    final repo = ref.read(authRepositoryProvider);
    final secure = ref.read(secureStoreProvider);
    if (state.value != null) {
      try {
        await repo.logout();
      } on ApiException catch (_) {
        // Ignore: the old session is replaced anyway.
      }
    }
    await secure.clearSession();
    final tokens = await repo.demoSession(empCode);
    await _saveTokens(tokens);
    state = AsyncData(await repo.loadSession());
  }

  Future<void> logout() async {
    try {
      await ref.read(authRepositoryProvider).logout();
    } on ApiException catch (e) {
      AppLog.warn('logout request failed: ${e.code.wire}', tag: 'auth');
    }
    await ref.read(secureStoreProvider).clearSession();
    state = const AsyncData(null);
  }

  /// Re-reads profile and permissions (after profile or role changes).
  Future<void> reload() async {
    state = AsyncData(await ref.read(authRepositoryProvider).loadSession());
  }

  /// Exchanges the refresh token for new tokens. Single-flight so parallel
  /// 401s trigger one refresh. Returns false when the session is gone.
  Future<bool> refreshTokens() {
    return _refreshing ??= _doRefresh().whenComplete(() => _refreshing = null);
  }

  Future<bool> _doRefresh() async {
    final secure = ref.read(secureStoreProvider);
    final refresh = await secure.read(SecureKeys.refreshToken);
    if (refresh == null) return false;
    try {
      await _saveTokens(
        await ref.read(authRepositoryProvider).refresh(refresh),
      );
      return true;
    } on ApiException catch (e) {
      if (e.code == ApiErrorCode.unauthenticated) {
        await secure.clearSession();
        state = const AsyncData(null);
      }
      return false;
    }
  }
}
