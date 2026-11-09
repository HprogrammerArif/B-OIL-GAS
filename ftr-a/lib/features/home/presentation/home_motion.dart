import 'dart:async';

import 'package:flutter/material.dart';

/// Fades a home band up once. A later refresh does not replay it.
class HomeRiseIn extends StatefulWidget {
  const HomeRiseIn({required this.index, required this.child, super.key});

  final int index;
  final Widget child;

  @override
  State<HomeRiseIn> createState() => _HomeRiseInState();
}

class _HomeRiseInState extends State<HomeRiseIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final CurvedAnimation _curve;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _curve = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (MediaQuery.disableAnimationsOf(context)) {
      _controller.value = 1;
      return;
    }
    unawaited(
      Future<void>.delayed(Duration(milliseconds: 70 * widget.index), () {
        if (mounted) _controller.forward();
      }),
    );
  }

  @override
  void dispose() {
    _curve.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.disableAnimationsOf(context)) return widget.child;
    return AnimatedBuilder(
      animation: _curve,
      builder: (context, child) {
        return Opacity(
          opacity: _curve.value,
          child: Transform.translate(
            offset: Offset(0, (1 - _curve.value) * 8),
            child: child,
          ),
        );
      },
      child: widget.child,
    );
  }
}

/// Settles a tile slightly smaller while a finger is on it.
class HomePressScale extends StatefulWidget {
  const HomePressScale({required this.child, super.key});

  final Widget child;

  @override
  State<HomePressScale> createState() => _HomePressScaleState();
}

class _HomePressScaleState extends State<HomePressScale> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    final still = MediaQuery.disableAnimationsOf(context);
    return AnimatedScale(
      scale: !still && _down ? 0.98 : 1,
      duration: Duration(milliseconds: still ? 0 : 120),
      curve: Curves.easeOut,
      child: Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: (_) {
          if (!_down) setState(() => _down = true);
        },
        onPointerUp: (_) {
          if (_down) setState(() => _down = false);
        },
        onPointerCancel: (_) {
          if (_down) setState(() => _down = false);
        },
        child: widget.child,
      ),
    );
  }
}
