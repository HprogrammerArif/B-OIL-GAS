import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class VisitorsScreen extends ConsumerStatefulWidget {
  const VisitorsScreen({super.key});

  @override
  ConsumerState<VisitorsScreen> createState() => _VisitorsScreenState();
}

class _VisitorsScreenState extends ConsumerState<VisitorsScreen> {
  String? _status;
  String? _category;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final session = ref.watch(sessionControllerProvider).value;
    final canCreate = session?.navigation.contains('visitors') ?? false;
    final isGate = session?.profile.roles.contains('SECURITY_GATE') ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleVisitors),
        actions: [
          if (canCreate && !isGate)
            IconButton(
              onPressed: () => context.push(AppRoutes.visitorNew),
              icon: const Icon(Icons.person_add_outlined),
              tooltip: l10n.visNewTitle,
            ),
        ],
      ),
      body: Column(
        children: [
          _FilterBar(
            status: _status,
            onStatusChanged: (v) => setState(() => _status = v),
            category: _category,
            onCategoryChanged: (v) => setState(() => _category = v),
          ),
          Expanded(
            child: _VisitorList(status: _status, category: _category),
          ),
        ],
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  const _FilterBar({
    required this.status,
    required this.onStatusChanged,
    required this.category,
    required this.onCategoryChanged,
  });

  final String? status;
  final ValueChanged<String?> onStatusChanged;
  final String? category;
  final ValueChanged<String?> onCategoryChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      child: Row(
        children: [
          _Chip(
            label: l10n.visFilterAll,
            selected: status == null,
            onTap: () => onStatusChanged(null),
          ),
          _Chip(
            label: l10n.visFilterInside,
            selected: status == 'CHECKED_IN',
            onTap: () => onStatusChanged('CHECKED_IN'),
          ),
          _Chip(
            label: l10n.visFilterExpected,
            selected: status == 'PRE_REGISTERED',
            onTap: () => onStatusChanged('PRE_REGISTERED'),
          ),
          _Chip(
            label: l10n.visFilterDone,
            selected: status == 'CHECKED_OUT',
            onTap: () => onStatusChanged('CHECKED_OUT'),
          ),
          const SizedBox(width: Space.sm),
          const VerticalDivider(width: 1, indent: 4, endIndent: 4),
          const SizedBox(width: Space.sm),
          _Chip(
            label: l10n.visVip,
            selected: category == 'VIP',
            onTap: () => onCategoryChanged(category == 'VIP' ? null : 'VIP'),
          ),
          _Chip(
            label: l10n.visGovt,
            selected: category == 'GOVT',
            onTap: () =>
                onCategoryChanged(category == 'GOVT' ? null : 'GOVT'),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: theme.colorScheme.primaryContainer,
        labelStyle: theme.textTheme.labelSmall?.copyWith(
          color: selected
              ? theme.colorScheme.onPrimaryContainer
              : null,
        ),
        side: BorderSide(
          color: selected
              ? theme.colorScheme.primary
              : theme.colorScheme.outline.withValues(alpha: 0.4),
        ),
        showCheckmark: false,
        padding: const EdgeInsets.symmetric(horizontal: Space.xs),
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}

class _VisitorList extends ConsumerWidget {
  const _VisitorList({this.status, this.category});

  final String? status;
  final String? category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(
      visitorsProvider(status: status, category: category),
    );
    return async.when(
      loading: () => const SkeletonList(),
      error: (e, _) => ErrorState(
        onRetry: () => ref.invalidate(
          visitorsProvider(status: status, category: category),
        ),
      ),
      data: (visitors) {
        if (visitors.isEmpty) return EmptyState(icon: Icons.badge_outlined, message: context.l10n.visEmpty);
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(
            visitorsProvider(status: status, category: category),
          ),
          child: ListView.separated(
            padding: const EdgeInsets.only(bottom: Space.xxxl),
            itemCount: visitors.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) => _VisitorRow(visitor: visitors[i]),
          ),
        );
      },
    );
  }
}

class _VisitorRow extends StatelessWidget {
  const _VisitorRow({required this.visitor});

  final Visitor visitor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;
    final bangla = context.isBangla;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      onTap: () => context.push(AppRoutes.visitorDetail(visitor.id)),
      leading: CircleAvatar(
        backgroundColor:
            _categoryColor(visitor.category, theme).withValues(alpha: 0.15),
        child: Text(
          visitor.name.isNotEmpty ? visitor.name[0].toUpperCase() : '?',
          style: TextStyle(color: _categoryColor(visitor.category, theme)),
        ),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              visitor.name,
              style: theme.textTheme.titleSmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          _StatusPill(status: visitor.status),
        ],
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            visitor.organization.isNotEmpty
                ? '${visitor.organization}${visitor.designation.isNotEmpty ? ' · ${visitor.designation}' : ''}'
                : visitor.designation,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: Space.xxs),
          Text(
            '${l10n.visHost}: ${visitor.hostName} · ${visitor.expectedDate} ${visitor.expectedTime}',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
      trailing: visitor.vipProtocol
          ? Tooltip(
              message: l10n.visVipProtocol,
              child: Icon(
                Icons.star_rounded,
                color: context.bogcl.executiveGold,
                size: 18,
              ),
            )
          : null,
    );
  }

  Color _categoryColor(VisitorCategory cat, ThemeData theme) {
    return switch (cat) {
      VisitorCategory.vip => const Color(0xFFD4AF37),
      VisitorCategory.govt => theme.colorScheme.secondary,
      VisitorCategory.vendor => const Color(0xFF0284C7),
      VisitorCategory.client => theme.colorScheme.tertiary,
      VisitorCategory.regular => theme.colorScheme.outline,
    };
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final VisitorStatus status;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final (label, tone) = switch (status) {
      VisitorStatus.preRegistered => (l10n.visStatusExpected, StatusTone.info),
      VisitorStatus.checkedIn => (l10n.visStatusInside, StatusTone.success),
      VisitorStatus.checkedOut => (l10n.visStatusDone, StatusTone.neutral),
      VisitorStatus.overdue => (l10n.visStatusOverdue, StatusTone.danger),
      VisitorStatus.cancelled => (l10n.visStatusCancelled, StatusTone.neutral),
    };
    return StatusPill(label: label, tone: tone);
  }
}
