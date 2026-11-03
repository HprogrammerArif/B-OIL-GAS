import 'dart:async';

import 'package:bogcl_oneops/features/attendance/domain/attendance_models.dart';
import 'package:bogcl_oneops/mock/mock_config.dart';
import 'package:geolocator/geolocator.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'location_service.g.dart';

enum LocationFailure { serviceOff, denied, deniedForever, unavailable }

typedef _Pt = ({double lat, double lng});

class LocationException implements Exception {
  const LocationException(this.failure);

  final LocationFailure failure;

  @override
  String toString() => 'LocationException($failure)';
}

/// Captures a position fix for a punch (doc 05 §attendance). Waits up to
/// a short wait for an accuracy at or below about 40 m and otherwise returns
/// the best fix seen; the server decides whether it is good enough.
///
/// In the pitch build the demo menu can place the phone at a seeded site, so
/// a punch can be shown anywhere. That path never asks for permission.
class LocationService {
  LocationService(this._mode);

  final DemoLocation Function() _mode;

  static const _goodAccuracyM = 40.0;
  static const _wait = Duration(seconds: 15);

  // Seeded fence centres (see mock/seed/attendance.dart).
  static const _Pt _hq = (lat: 23.8103, lng: 90.4125);
  static const _Pt _plant = (lat: 23.7005, lng: 90.3499);
  static const _Pt _outside = (lat: 23.7800, lng: 90.4000);

  Future<LocationFix> capture() {
    switch (_mode()) {
      case DemoLocation.headOffice:
        return _synthetic(_hq.lat + 0.00008, _hq.lng + 0.00006);
      case DemoLocation.plant:
        return _synthetic(_plant.lat - 0.00010, _plant.lng + 0.00005);
      case DemoLocation.outside:
        return _synthetic(_outside.lat, _outside.lng);
      case DemoLocation.mockGps:
        return _synthetic(_hq.lat, _hq.lng, mock: true);
      case DemoLocation.device:
        return _fromDevice();
    }
  }

  Future<LocationFix> _synthetic(
    double lat,
    double lng, {
    bool mock = false,
  }) async {
    // A short wait so the "locating" state is visible, like a real fix.
    await Future<void>.delayed(const Duration(milliseconds: 900));
    return LocationFix(lat: lat, lng: lng, accuracyM: 12, isMock: mock);
  }

  Future<LocationFix> _fromDevice() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
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

    Position? best;
    final done = Completer<void>();
    final sub =
        Geolocator.getPositionStream(locationSettings: AndroidSettings())
            .listen((p) {
              if (best == null || p.accuracy < best!.accuracy) best = p;
              if (p.accuracy <= _goodAccuracyM && !done.isCompleted) {
                done.complete();
              }
            }, onError: (Object _) {});
    try {
      await done.future.timeout(_wait, onTimeout: () {});
    } finally {
      await sub.cancel();
    }
    final fix = best ?? await Geolocator.getLastKnownPosition();
    if (fix == null) {
      throw const LocationException(LocationFailure.unavailable);
    }
    return LocationFix(
      lat: fix.latitude,
      lng: fix.longitude,
      accuracyM: fix.accuracy,
      isMock: fix.isMocked,
    );
  }

  Future<void> openSettings() async {
    await Geolocator.openAppSettings();
  }
}

@Riverpod(keepAlive: true)
LocationService locationService(Ref ref) =>
    LocationService(() => ref.read(mockConfigControllerProvider).location);
