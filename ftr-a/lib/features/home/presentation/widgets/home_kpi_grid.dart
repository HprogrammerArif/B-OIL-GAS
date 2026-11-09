import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/home/presentation/home_motion.dart';
import 'package:flutter/material.dart';

/// Block C — 2x2 Interactive KPI Grid.
class HomeKpiGrid extends StatelessWidget {
  const HomeKpiGrid({required this.kpis, this.onTapKpi, super.key});

  final List<DashKpi> kpis;
  final ValueChanged<DashKpi>? onTapKpi;

  static String _formatValue(DashKpi k, bool bangla) {
    if (k.empty || k.value == null) return '—';
    if (k.key == 'pendingValue' && k.value is num) {
      final val = (k.value! as num).toDouble();
      if (val >= 10000000) {
        final cr = (val / 10000000).toStringAsFixed(2);
        return bangla ? '৳ $cr কোটি' : '৳ $cr Cr';
      }
      if (val >= 100000) {
        final l = (val / 100000).toStringAsFixed(1);
        return bangla ? '৳ $l লক্ষ' : '৳ ${l}L';
      }
      return '৳ ${val.round()}';
    }
    if (k.key == 'assetOk' && k.value is num) {
      return '${k.value}%';
    }
    return k.display();
  }

  static ({IconData icon, Color color}) _meta(String key, ColorScheme scheme) {
    return switch (key) {
      'pendingApprovals' || 'pendingValue' => (
        icon: Icons.assignment_turned_in_outlined,
        color: BrandColors.crimson,
      ),
      'safeDays' => (
        icon: Icons.verified_user_outlined,
        color: BrandColors.success,
      ),
      'openIncidents' => (
        icon: Icons.warning_amber_rounded,
        color: BrandColors.danger,
      ),
      'licencesAtRisk' => (
        icon: Icons.gavel_outlined,
        color: const Color(0xFFD97706),
      ),
      'present' || 'headcount' || 'deptHeadcount' => (
        icon: Icons.how_to_reg_outlined,
        color: Colors.teal.shade700,
      ),
      'onLeave' || 'leaveLeft' => (
        icon: Icons.event_available_outlined,
        color: BrandColors.info,
      ),
      'reqs' || 'onRoad' => (
        icon: Icons.directions_car_outlined,
        color: const Color(0xFFD97706),
      ),
      'waitlist' => (
        icon: Icons.directions_bus_outlined,
        color: const Color(0xFF7C3AED),
      ),
      'assetOk' => (
        icon: Icons.precision_manufacturing_outlined,
        color: Colors.teal.shade700,
      ),
      _ => (icon: Icons.analytics_outlined, color: scheme.primary),
    };
  }

  @override
  Widget build(BuildContext context) {
    if (kpis.isEmpty) return const SizedBox.shrink();
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final displayKpis = kpis.take(4).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.lg),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisExtent: 96,
          crossAxisSpacing: Space.md,
          mainAxisSpacing: Space.md,
        ),
        itemCount: displayKpis.length,
        itemBuilder: (context, index) {
          final k = displayKpis[index];
          final meta = _meta(k.key, scheme);
          return HomePressScale(
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(Corner.lg),
                boxShadow: cardShadow(scheme.shadow),
              ),
              child: Material(
                color: Colors.transparent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Corner.lg),
                ),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  borderRadius: BorderRadius.circular(Corner.lg),
                  onTap: onTapKpi == null ? null : () => onTapKpi!(k),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Space.md,
                      vertical: Space.sm,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(5),
                              decoration: BoxDecoration(
                                color: meta.color.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(Corner.sm),
                              ),
                              child: Icon(
                                meta.icon,
                                size: 15,
                                color: meta.color,
                              ),
                            ),
                            const SizedBox(width: Space.xs),
                            Expanded(
                              child: Text(
                                _formatValue(k, bangla),
                                style: theme.textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: meta.color,
                                  fontSize: 21,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (onTapKpi != null)
                              Icon(
                                Icons.chevron_right,
                                size: 16,
                                color: scheme.onSurfaceVariant.withValues(
                                  alpha: 0.6,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          k.label(bangla: bangla),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: scheme.onSurfaceVariant,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
