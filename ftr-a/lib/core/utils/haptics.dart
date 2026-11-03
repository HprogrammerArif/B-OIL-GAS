import 'dart:async';

import 'package:flutter/services.dart';

/// Thin wrapper so haptics are consistent and easy to disable.
/// Fire-and-forget: callers never wait on haptics.
abstract final class Haptics {
  static void tap() => unawaited(HapticFeedback.selectionClick());
  static void success() => unawaited(HapticFeedback.mediumImpact());
  static void error() => unawaited(HapticFeedback.vibrate());
  static void heavy() => unawaited(HapticFeedback.heavyImpact());
}
