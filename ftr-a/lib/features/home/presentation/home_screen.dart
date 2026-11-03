import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Role-based home. The header accent follows the home variant (Chairman and
/// executives get the gold accent); quick actions list only built modules the
/// persona may use.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    return session.when(
      loading: () => const SkeletonList(),
      error: (_, _) =>
          ErrorState(onRetry: () => ref.invalidate(sessionControllerProvider)),
      data: (s) => s == null ? const SizedBox.shrink() : _HomeBody(session: s),
    );
  }
}

String _greeting(AppL10n l10n, String name) {
  final hour = Dhaka.now().hour;
  if (hour < 12) return l10n.homeGoodMorning(name);
  if (hour < 17) return l10n.homeGoodAfternoon(name);
  return l10n.homeGoodEvening(name);
}

class _HomeBody extends StatelessWidget {
  const _HomeBody({required this.session});

  final Session session;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final emp = session.profile.employee;
    final executive = session.homeVariant == HomeVariant.executive;
    final accent = executive
        ? context.bogcl.executiveGold
        : theme.colorScheme.primary;

    return ListView(
      padding: const EdgeInsets.only(bottom: Space.xxxl),
      children: [
        Container(
          margin: const EdgeInsets.all(Space.lg),
          padding: const EdgeInsets.all(Space.xl),
          decoration: BoxDecoration(
            color: executive
                ? const Color(0xFF0B132B)
                : theme.colorScheme.primary,
            borderRadius: BorderRadius.circular(Corner.xl),
            border: executive ? Border.all(color: accent, width: 1.5) : null,
          ),
          child: Row(
            children: [
              Avatar(name: emp.fullName, size: 56),
              const SizedBox(width: Space.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _greeting(l10n, emp.shortDisplayName(bangla: bangla)),
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      emp.designationTitle(bangla: bangla),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        SectionHeader(title: l10n.homeWorkspaceTitle),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.lg),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(Space.lg),
              child: Column(
                children: [
                  _InfoRow(l10n.profileEmployeeId, emp.empCode),
                  _InfoRow(
                    l10n.profileDepartment,
                    emp.department.displayName(bangla: bangla),
                  ),
                  _InfoRow(
                    l10n.profileSite,
                    emp.site.displayName(bangla: bangla),
                  ),
                  _InfoRow(l10n.profileGrade, emp.grade.code),
                  const SizedBox(height: Space.sm),
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: Wrap(
                      spacing: Space.sm,
                      runSpacing: Space.sm,
                      children: [
                        for (final r in session.profile.roles)
                          StatusPill(
                            label: roleLabel(l10n, r),
                            tone: executive
                                ? StatusTone.executive
                                : StatusTone.info,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Space.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
