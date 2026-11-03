import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'secure_store.g.dart';

/// Keys held in Keystore/Keychain. Tokens never go to shared_preferences.
abstract final class SecureKeys {
  static const accessToken = 'auth.accessToken';
  static const refreshToken = 'auth.refreshToken';
  static const userId = 'auth.userId';
  static const dbKey = 'db.key';
  static const deviceId = 'device.id';
  static const biometricEnabled = 'auth.biometricEnabled';
}

/// Thin wrapper over `flutter_secure_storage`.
class SecureStore {
  SecureStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  Future<String?> read(String key) => _storage.read(key: key);

  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);

  Future<void> delete(String key) => _storage.delete(key: key);

  /// Removes session material (logout). Keeps the DB key.
  Future<void> clearSession() async {
    await _storage.delete(key: SecureKeys.accessToken);
    await _storage.delete(key: SecureKeys.refreshToken);
    await _storage.delete(key: SecureKeys.userId);
  }
}

@Riverpod(keepAlive: true)
SecureStore secureStore(Ref ref) => SecureStore();
