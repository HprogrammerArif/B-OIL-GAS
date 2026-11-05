import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// Turns on Android FLAG_SECURE while this widget is on screen (sign, chat,
/// claim receipts). iOS has no equivalent window flag in this pitch build.
class SecureFlag extends StatefulWidget {
  const SecureFlag({required this.child, super.key});

  final Widget child;

  static const _channel = MethodChannel('bogcl.oneops/secure_flag');
  static int _holds = 0;

  static Future<void> _apply(bool on) async {
    try {
      await _channel.invokeMethod<void>('set', {'on': on});
    } on PlatformException {
      // Desktop / tests: ignore.
    }
  }

  @override
  State<SecureFlag> createState() => _SecureFlagState();
}

class _SecureFlagState extends State<SecureFlag> {
  @override
  void initState() {
    super.initState();
    SecureFlag._holds++;
    unawaited(SecureFlag._apply(true));
  }

  @override
  void dispose() {
    SecureFlag._holds--;
    unawaited(SecureFlag._apply(SecureFlag._holds > 0));
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
