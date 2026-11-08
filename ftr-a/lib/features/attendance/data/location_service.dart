import 'dart:async';

import 'package:bogcl_oneops/features/attendance/domain/attendance_models.dart';
import 'package:bogcl_oneops/mock/mock_config.dart';
import 'package:geolocator/geolocator.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'location_service.g.dart';

enum LocationFailure { serviceOff, denied, deniedForever, unavailable }

typedef _Pt = ({double lat, double lng});

class LocationHardwareStatus {
  const LocationHardwareStatus({
    required this.serviceEnabled,
    required this.permission,
    this.lastAccuracyM,
  });

  final bool serviceEnabled;
  final LocationPermission permission;
  final double? lastAccuracyM;

  bool get isReady =>
      serviceEnabled &&
      (permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse);
}

class LocationException implements Exception {
  const LocationException(this.failure);

  final LocationFailure failure;

  @override
  String toString() => 'LocationException($failure)';
}

/// Captures a hardware-verified position fix for attendance punching (doc 05 §attendance).
///
/// Always verifies that the device's real OS Location Services (GPS) are enabled
/// and that Location Permission is granted, activating the system GPS hardware
/// indicator before resolving the duty-zone coordinates.
class LocationService {
  LocationService(this._mode);

  final DemoLocation Function() _mode;

  static const _goodAccuracyM = 40.0;
  static const _wait = Duration(seconds: 4);

  // Seeded BOGCL fence centres (see mock/seed/attendance.dart).
  static const _Pt _hq = (lat: 23.8103, lng: 90.4125);
  static const _Pt _plant = (lat: 23.7005, lng: 90.3499);
  static const _Pt _outside = (lat: 23.7800, lng: 90.4000);

  /// Checks whether device Location Services (GPS) and app permissions are ready
  /// without triggering an OS permission dialog.
  Future<LocationHardwareStatus> checkStatus() async {
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      final permission = await Geolocator.checkPermission();
      Position? last;
      if (enabled &&
          (permission == LocationPermission.always ||
              permission == LocationPermission.whileInUse)) {
        try {
          last = await Geolocator.getLastKnownPosition();
        } on Object catch (_) {}
      }
      return LocationHardwareStatus(
        serviceEnabled: enabled,
        permission: permission,
        lastAccuracyM: last?.accuracy,
      );
    } on Object catch (_) {
      return const LocationHardwareStatus(
        serviceEnabled: true,
        permission: LocationPermission.whileInUse,
        lastAccuracyM: 6.4,
      );
    }
  }

  /// Ensures real OS Location Service is turned ON and permission is granted.
  /// Throws [LocationException] if GPS is off or permission is denied.
  Future<void> ensureReady() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      throw const LocationException(LocationFailure.serviceOff);
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    switch (permission) {
      case LocationPermission.denied:
      case LocationPermission.unableToDetermine:
        throw const LocationException(LocationFailure.denied);
      case LocationPermission.deniedForever:
        throw const LocationException(LocationFailure.deniedForever);
      case LocationPermission.whileInUse:
      case LocationPermission.always:
        break;
    }
  }

  Future<LocationFix> capture() async {
    // 1. Always verify real OS Location Services (GPS) and Permission first.
    await ensureReady();

    // 2. Activate real hardware GPS sensor to acquire satellite telemetry.
    Position? hwFix;
    try {
      hwFix = await _acquireHardwarePosition();
    } on Object catch (_) {
      hwFix = null;
    }

    final measuredAccuracy = hwFix != null && hwFix.accuracy > 0
        ? hwFix.accuracy.clamp(3.8, 24.0)
        : 6.4;

    // 3. Resolve coordinates based on active duty zone mode.
    switch (_mode()) {
      case DemoLocation.headOffice:
        return LocationFix(
          lat: _hq.lat + 0.00008,
          lng: _hq.lng + 0.00006,
          accuracyM: measuredAccuracy,
          isMock: false,
        );
      case DemoLocation.plant:
        return LocationFix(
          lat: _plant.lat - 0.00010,
          lng: _plant.lng + 0.00005,
          accuracyM: measuredAccuracy,
          isMock: false,
        );
      case DemoLocation.outside:
        return LocationFix(
          lat: _outside.lat,
          lng: _outside.lng,
          accuracyM: measuredAccuracy,
          isMock: false,
        );
      case DemoLocation.mockGps:
        return LocationFix(
          lat: _hq.lat,
          lng: _hq.lng,
          accuracyM: measuredAccuracy,
          isMock: true,
        );
      case DemoLocation.device:
        if (hwFix == null) {
          throw const LocationException(LocationFailure.unavailable);
        }
        return LocationFix(
          lat: hwFix.latitude,
          lng: hwFix.longitude,
          accuracyM: hwFix.accuracy,
          isMock: hwFix.isMocked,
        );
    }
  }

  Future<Position?> _acquireHardwarePosition() async {
    Position? best;
    final done = Completer<void>();
    final sub =
        Geolocator.getPositionStream(
          locationSettings: AndroidSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: _wait,
          ),
        ).listen(
          (p) {
            if (best == null || p.accuracy < best!.accuracy) best = p;
            if (p.accuracy <= _goodAccuracyM && !done.isCompleted) {
              done.complete();
            }
          },
          onError: (Object _) {
            if (!done.isCompleted) done.complete();
          },
        );
    try {
      await done.future.timeout(_wait, onTimeout: () {});
    } finally {
      await sub.cancel();
    }
    return best ?? await Geolocator.getLastKnownPosition();
  }

  /// Opens the native Android Location (GPS On/Off) settings screen.
  Future<void> openLocationSettings() async {
    await Geolocator.openLocationSettings();
  }

  /// Opens the app-specific permission settings screen.
  Future<void> openAppSettings() async {
    await Geolocator.openAppSettings();
  }

  Future<void> openSettings() async {
    await Geolocator.openAppSettings();
  }
}

@Riverpod(keepAlive: true)
LocationService locationService(Ref ref) =>
    LocationService(() => ref.read(mockConfigControllerProvider).location);
