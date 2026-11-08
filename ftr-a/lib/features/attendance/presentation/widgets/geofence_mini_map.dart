import 'dart:math' as math;

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/mock/mock_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Interactive 140px-tall schematic map displaying the employee's live GPS fix
/// relative to the site geofence perimeter (HQ Baridhara 300m / Keraniganj Plant 500m).
/// Includes interactive demo location toggle chips for pitch presentations.
class GeofenceMiniMap extends ConsumerStatefulWidget {
  const GeofenceMiniMap({
    super.key,
    this.siteName = 'Head Office, Baridhara',
    this.siteNameBn = 'প্রধান কার্যালয়, বারিধারা',
    this.fenceRadiusM = 300,
    this.isInside = true,
    this.distanceM = 110,
    this.onLocationChanged,
  });

  final String siteName;
  final String siteNameBn;
  final int fenceRadiusM;
  final bool isInside;
  final int distanceM;
  final void Function(DemoLocation)? onLocationChanged;

  @override
  ConsumerState<GeofenceMiniMap> createState() => _GeofenceMiniMapState();
}

class _GeofenceMiniMapState extends ConsumerState<GeofenceMiniMap>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final mockLocation = ref.watch(mockConfigControllerProvider).location;

    final isOutsideSimulated = mockLocation == DemoLocation.outside;
    final isInsideEffective = !isOutsideSimulated && widget.isInside;
    final effectiveDistanceM = isOutsideSimulated ? 4200 : widget.distanceM;

    final primarySite = widget.siteName;
    final otherSite = primarySite.contains('Baridhara')
        ? (bangla
              ? 'কেরানীগঞ্জ প্ল্যান্ট · ১৪.৮ কিমি'
              : 'Keraniganj Plant · 14.8 km')
        : (bangla
              ? 'বারিধারা প্রধান কার্যালয় · ১৪.৮ কিমি'
              : 'HQ Baridhara · 14.8 km');

    return Container(
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(Corner.lg),
        border: Border.all(
          color: isInsideEffective
              ? Colors.teal.withValues(alpha: 0.4)
              : Colors.deepOrange.withValues(alpha: 0.5),
          width: 1.2,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Map Header Strip
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.md,
              vertical: Space.xs,
            ),
            color: isInsideEffective
                ? Colors.teal.withValues(alpha: 0.08)
                : Colors.deepOrange.withValues(alpha: 0.08),
            child: Row(
              children: [
                Icon(
                  isInsideEffective
                      ? Icons.check_circle
                      : Icons.warning_amber_rounded,
                  size: 15,
                  color: isInsideEffective ? Colors.teal : Colors.deepOrange,
                ),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: Text(
                    isInsideEffective
                        ? (bangla
                              ? 'অনুমোদিত সাইট জিওফেন্সের ভিতরে ($effectiveDistanceM মি)'
                              : 'INSIDE GEOFENCE ($effectiveDistanceM m from gate)')
                        : (bangla
                              ? 'সাইট জিওফেন্সের বাইরে (${(effectiveDistanceM / 1000).toStringAsFixed(1)} কিমি)'
                              : 'OUTSIDE GEOFENCE (${(effectiveDistanceM / 1000).toStringAsFixed(1)} km from gate)'),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                      color: isInsideEffective
                          ? Colors.teal.shade800
                          : Colors.deepOrange.shade900,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: scheme.surface,
                    borderRadius: BorderRadius.circular(Corner.sm),
                    border: Border.all(color: scheme.outlineVariant),
                  ),
                  child: Text(
                    otherSite,
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w500,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // CustomPaint Radar / Spatial Schematic
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, _) {
              return SizedBox(
                height: 140,
                child: CustomPaint(
                  painter: _GeofenceMapPainter(
                    isInside: isInsideEffective,
                    distanceM: effectiveDistanceM,
                    fenceRadiusM: widget.fenceRadiusM,
                    siteLabel: bangla ? widget.siteNameBn : widget.siteName,
                    pulseProgress: _pulseController.value,
                    isBangla: bangla,
                  ),
                ),
              );
            },
          ),

          // Interactive Demo Location Toggle Strip
          Container(
            padding: const EdgeInsets.fromLTRB(Space.sm, 4, Space.sm, 6),
            decoration: BoxDecoration(
              color: scheme.surface,
              border: Border(top: BorderSide(color: scheme.outlineVariant)),
            ),
            child: Row(
              children: [
                Text(
                  bangla ? 'ডেমো সিমুলেশন:' : 'Demo GPS:',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _demoChip(
                          label: bangla
                              ? 'গেটে অবস্থান (১১০মি)'
                              : 'Inside Gate (110m)',
                          isSelected: !isOutsideSimulated,
                          tone: Colors.teal,
                          onTap: () {
                            Haptics.tap();
                            ref
                                .read(mockConfigControllerProvider.notifier)
                                .setLocation(DemoLocation.headOffice);
                            widget.onLocationChanged?.call(
                              DemoLocation.headOffice,
                            );
                          },
                        ),
                        const SizedBox(width: 4),
                        _demoChip(
                          label: bangla
                              ? 'বাইরে অবস্থান (৪.২ কিমি)'
                              : 'Outside Gate (4.2km)',
                          isSelected: isOutsideSimulated,
                          tone: Colors.deepOrange,
                          onTap: () {
                            Haptics.tap();
                            ref
                                .read(mockConfigControllerProvider.notifier)
                                .setLocation(DemoLocation.outside);
                            widget.onLocationChanged?.call(
                              DemoLocation.outside,
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _demoChip({
    required String label,
    required bool isSelected,
    required Color tone,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Corner.sm),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: isSelected ? tone.withValues(alpha: 0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(Corner.sm),
          border: Border.all(
            color: isSelected ? tone : Colors.grey.shade400,
            width: isSelected ? 1.2 : 0.8,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.normal,
            color: isSelected ? tone : Colors.black87,
          ),
        ),
      ),
    );
  }
}

class _GeofenceMapPainter extends CustomPainter {
  _GeofenceMapPainter({
    required this.isInside,
    required this.distanceM,
    required this.fenceRadiusM,
    required this.siteLabel,
    required this.pulseProgress,
    required this.isBangla,
  });

  final bool isInside;
  final int distanceM;
  final int fenceRadiusM;
  final String siteLabel;
  final double pulseProgress;
  final bool isBangla;

  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = const Color(0xFFF8FAFC);
    canvas.drawRect(Offset.zero & size, bgPaint);

    // Grid lines for blueprint/radar look
    final gridPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 0.8;

    for (var x = 20.0; x < size.width; x += 30) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (var y = 15.0; y < size.height; y += 30) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Site Center Coordinate
    // When inside, place site near center; when outside, place site on the left.
    final siteCenter = isInside
        ? Offset(size.width * 0.42, size.height * 0.5)
        : Offset(size.width * 0.28, size.height * 0.5);

    final fenceRadius = size.height * 0.36;

    // Draw Geofence allowed zone (shaded circle)
    final zoneFillPaint = Paint()
      ..color = isInside
          ? const Color(0xFF10B981).withValues(alpha: 0.12)
          : const Color(0xFF0284C7).withValues(alpha: 0.10)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(siteCenter, fenceRadius, zoneFillPaint);

    // Draw Dashed Perimeter ring
    final ringPaint = Paint()
      ..color = isInside ? const Color(0xFF059669) : const Color(0xFF0284C7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;

    _drawDashedCircle(canvas, siteCenter, fenceRadius, ringPaint);

    // Site Pin / Icon
    final siteBadgePaint = Paint()
      ..color = isInside ? const Color(0xFF059669) : const Color(0xFF0369A1)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(siteCenter, 14, siteBadgePaint);

    final siteInnerWhite = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(siteCenter, 5, siteInnerWhite);

    // Site Label
    final siteTextPainter = TextPainter(
      text: TextSpan(
        text: siteLabel.length > 26
            ? '${siteLabel.substring(0, 24)}...'
            : siteLabel,
        style: const TextStyle(
          color: Color(0xFF1E293B),
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    siteTextPainter.paint(
      canvas,
      Offset(siteCenter.dx - siteTextPainter.width / 2, siteCenter.dy + 17),
    );

    // Perimeter radius tag
    final radiusTextPainter = TextPainter(
      text: TextSpan(
        text: '${fenceRadiusM}m ${isBangla ? "সীমানা" : "Radius"}',
        style: TextStyle(
          color: isInside ? const Color(0xFF047857) : const Color(0xFF0369A1),
          fontSize: 8.5,
          fontWeight: FontWeight.w600,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    radiusTextPainter.paint(
      canvas,
      Offset(
        siteCenter.dx - radiusTextPainter.width / 2,
        siteCenter.dy - fenceRadius - 12,
      ),
    );

    // Employee Pin ("You")
    final Offset userPos;
    if (isInside) {
      // 110m inside: position upper-right from site center within fence
      userPos = Offset(
        siteCenter.dx + fenceRadius * 0.45,
        siteCenter.dy - fenceRadius * 0.28,
      );
    } else {
      // 4.2 km outside: position far right
      userPos = Offset(size.width * 0.82, size.height * 0.44);

      // Draw dashed connecting vector line
      final vectorPaint = Paint()
        ..color = const Color(0xFFEA580C)
        ..strokeWidth = 1.5;
      _drawDashedLine(canvas, siteCenter, userPos, vectorPaint);

      // Distance pill on the line
      final midPoint = Offset(
        (siteCenter.dx + userPos.dx) / 2,
        (siteCenter.dy + userPos.dy) / 2 - 12,
      );
      final distPillBg = Paint()
        ..color = const Color(0xFFFFF7ED)
        ..style = PaintingStyle.fill;
      final distPillBorder = Paint()
        ..color = const Color(0xFFEA580C)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1;

      final distTextPainter = TextPainter(
        text: TextSpan(
          text: '${(distanceM / 1000).toStringAsFixed(1)} km',
          style: const TextStyle(
            color: Color(0xFFC2410C),
            fontSize: 9.5,
            fontWeight: FontWeight.w800,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();

      final pillRect = RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: midPoint,
          width: distTextPainter.width + 12,
          height: 18,
        ),
        const Radius.circular(4),
      );
      canvas
        ..drawRRect(pillRect, distPillBg)
        ..drawRRect(pillRect, distPillBorder);
      distTextPainter.paint(
        canvas,
        Offset(
          midPoint.dx - distTextPainter.width / 2,
          midPoint.dy - distTextPainter.height / 2,
        ),
      );
    }

    // Pulsing aura around Employee Pin
    final auraRadius = 10.0 + (pulseProgress * 8.0);
    final auraPaint = Paint()
      ..color = (isInside ? const Color(0xFF10B981) : const Color(0xFFEA580C))
          .withValues(alpha: 0.35 * (1 - pulseProgress))
      ..style = PaintingStyle.fill;
    canvas.drawCircle(userPos, auraRadius, auraPaint);

    // Employee Pin Solid Dot
    final userDotPaint = Paint()
      ..color = isInside ? const Color(0xFF059669) : const Color(0xFFC2410C)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(userPos, 8, userDotPaint);

    final userInnerDot = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(userPos, 3.5, userInnerDot);

    // "You" Pin Label (placed above the dot when inside so it never collides with site pin)
    final userLabelPainter = TextPainter(
      text: TextSpan(
        text: isInside
            ? (isBangla ? 'আপনি (১১০মি)' : 'You (110m)')
            : (isBangla ? 'আপনি (বাইরে)' : 'You (Outside)'),
        style: TextStyle(
          color: isInside ? const Color(0xFF047857) : const Color(0xFF9A3412),
          fontSize: 9.5,
          fontWeight: FontWeight.w800,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    final labelY = isInside
        ? userPos.dy - userLabelPainter.height - 9
        : userPos.dy + 11;
    userLabelPainter.paint(
      canvas,
      Offset(userPos.dx - userLabelPainter.width / 2, labelY),
    );
  }

  void _drawDashedCircle(
    Canvas canvas,
    Offset center,
    double radius,
    Paint paint,
  ) {
    const dashCount = 36;
    const dashAngle = (2 * math.pi) / dashCount;
    for (var i = 0; i < dashCount; i += 2) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        i * dashAngle,
        dashAngle,
        false,
        paint,
      );
    }
  }

  void _drawDashedLine(Canvas canvas, Offset p1, Offset p2, Paint paint) {
    final dx = p2.dx - p1.dx;
    final dy = p2.dy - p1.dy;
    final dist = math.sqrt(dx * dx + dy * dy);
    const dashLen = 5.0;
    const gapLen = 4.0;
    var cur = 0.0;
    while (cur < dist) {
      final startFrac = cur / dist;
      final endFrac = math.min((cur + dashLen) / dist, 1);
      canvas.drawLine(
        Offset(p1.dx + dx * startFrac, p1.dy + dy * startFrac),
        Offset(p1.dx + dx * endFrac, p1.dy + dy * endFrac),
        paint,
      );
      cur += dashLen + gapLen;
    }
  }

  @override
  bool shouldRepaint(covariant _GeofenceMapPainter oldDelegate) {
    return oldDelegate.isInside != isInside ||
        oldDelegate.distanceM != distanceM ||
        oldDelegate.pulseProgress != pulseProgress ||
        oldDelegate.isBangla != isBangla;
  }
}
