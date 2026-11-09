import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:flutter/material.dart';

/// Block B — "Needs Your Attention" Banner.
class NeedsYouCard extends StatelessWidget {
  const NeedsYouCard({required this.need, super.key});

  final DashNeed need;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final isDanger = need.tone == 'danger';
    final isWarning = need.tone == 'warning';

    final bg = isDanger
        ? Colors.red.shade50
        : isWarning
        ? Colors.amber.shade50
        : theme.colorScheme.primaryContainer.withValues(alpha: 0.25);
    final border = isDanger
        ? Colors.red.shade300
        : isWarning
        ? Colors.amber.shade400
        : theme.colorScheme.primary.withValues(alpha: 0.3);
    final textCol = isDanger
        ? Colors.red.shade900
        : isWarning
        ? Colors.amber.shade900
        : theme.colorScheme.primary;
    final icon = isDanger
        ? Icons.error_outline
        : isWarning
        ? Icons.warning_amber_rounded
        : Icons.info_outline;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.lg),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(Corner.lg),
          onTap: () => openAppRoute(context, need.route),
          child: Ink(
            padding: const EdgeInsets.all(Space.lg),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(Corner.lg),
              border: Border.all(color: border),
            ),
            child: Row(
              children: [
                Icon(icon, color: textCol, size: 22),
                const SizedBox(width: Space.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            bangla
                                ? 'আপনার মনোযোগ প্রয়োজন'
                                : 'NEEDS YOUR ATTENTION',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.6,
                              color: textCol,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            bangla ? 'দেখুন' : 'Review',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: textCol,
                            ),
                          ),
                          Icon(
                            Icons.arrow_forward_ios,
                            size: 10,
                            color: textCol,
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        need.text(bangla: bangla),
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
