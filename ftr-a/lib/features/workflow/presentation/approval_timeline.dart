import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/workflow/data/workflow_trail.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

String _stepName(AppL10n l10n, TrailStep s) => switch (s.key) {
  'MANAGER' => l10n.workflowStepManager,
  'HR_REVIEW' => l10n.workflowStepHr,
  _ => s.name,
};

/// Vertical approval route: who has decided, who is next. Loads the trail of
/// [instanceId] itself and handles loading and error states.
class ApprovalTimeline extends ConsumerWidget {
  const ApprovalTimeline({
    required this.instanceId,
    required this.submittedAt,
    super.key,
  });

  final String instanceId;
  final DateTime submittedAt;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trail = ref.watch(workflowTrailProvider(instanceId));
    return trail.when(
      skipLoadingOnReload: true,
      loading: () => const Padding(
        padding: EdgeInsets.all(Space.lg),
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (_, _) => ErrorState(
        onRetry: () => ref.invalidate(workflowTrailProvider(instanceId)),
      ),
      data: (t) => _Steps(trail: t, submittedAt: submittedAt),
    );
  }
}

class _Steps extends StatelessWidget {
  const _Steps({required this.trail, required this.submittedAt});

  final WorkflowTrail trail;
  final DateTime submittedAt;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final steps = trail.steps.where((s) => s.state != TrailState.skipped);

    String detail(TrailStep s) => switch (s.state) {
      TrailState.approved => l10n.workflowStepApprovedBy(
        s.decidedBy?.displayName(bangla: bangla) ?? '',
      ),
      TrailState.rejected => l10n.workflowStepRejectedBy(
        s.decidedBy?.displayName(bangla: bangla) ?? '',
      ),
      TrailState.active => l10n.workflowStepWaiting(
        s.approvers.map((a) => a.displayName(bangla: bangla)).join(', '),
      ),
      TrailState.returned => l10n.workflowStepRejectedBy(
        s.decidedBy?.displayName(bangla: bangla) ?? '',
      ),
      TrailState.pending || TrailState.skipped => l10n.workflowStepUpNext,
    };

    final rows = <_Row>[
      _Row(
        title: l10n.workflowStepSubmitted,
        subtitle: DateFmt.dateTime(submittedAt, lang),
        state: TrailState.approved,
      ),
      for (final s in steps)
        _Row(
          title: _stepName(l10n, s),
          subtitle: [
            detail(s),
            if (s.decidedAt != null) DateFmt.dateTime(s.decidedAt!, lang),
          ].join(' · '),
          comment: s.comment,
          state: s.state,
        ),
    ];
    return Column(
      children: [
        for (final (i, r) in rows.indexed)
          _TimelineTile(row: r, isLast: i == rows.length - 1),
      ],
    );
  }
}

class _Row {
  const _Row({
    required this.title,
    required this.subtitle,
    required this.state,
    this.comment,
  });

  final String title;
  final String subtitle;
  final String? comment;
  final TrailState state;
}

class _TimelineTile extends StatelessWidget {
  const _TimelineTile({required this.row, required this.isLast});

  final _Row row;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = context.bogcl;
    final (icon, color) = switch (row.state) {
      TrailState.approved => (Icons.check_circle, c.success),
      TrailState.rejected || TrailState.returned => (Icons.cancel, c.danger),
      TrailState.active => (Icons.hourglass_top, c.warning),
      TrailState.pending ||
      TrailState.skipped => (Icons.radio_button_unchecked, theme.disabledColor),
    };
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 32,
            child: Column(
              children: [
                Icon(icon, size: 22, color: color),
                if (!isLast)
                  Expanded(
                    child: Container(width: 2, color: theme.dividerColor),
                  ),
              ],
            ),
          ),
          const SizedBox(width: Space.md),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: Space.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(row.title, style: theme.textTheme.titleSmall),
                  Text(
                    row.subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (row.comment != null && row.comment!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: Space.xs),
                      child: Text(
                        '“${row.comment}”',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
