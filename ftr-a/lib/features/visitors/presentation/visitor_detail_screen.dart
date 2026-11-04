import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class VisitorDetailScreen extends ConsumerWidget {
  const VisitorDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(visitorDetailProvider(id));
    return async.when(
      loading: () =>
          Scaffold(appBar: AppBar(), body: const SkeletonList()),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: ErrorState(
          onRetry: () => ref.invalidate(visitorDetailProvider(id)),
        ),
      ),
      data: (visitor) => _Detail(visitor: visitor),
    );
  }
}

class _Detail extends ConsumerStatefulWidget {
  const _Detail({required this.visitor});
  final Visitor visitor;

  @override
  ConsumerState<_Detail> createState() => _DetailState();
}

class _DetailState extends ConsumerState<_Detail> {
  bool _loading = false;

  Future<void> _act(
    BuildContext context,
    String title,
    String confirm,
    Future<Visitor> Function(VisitorRepository) action,
  ) async {
    final ok = await showConfirmSheet(
      context: context,
      title: title,
      message: confirm,
    );
    if (!ok) return;
    setState(() => _loading = true);
    try {
      final repo = ref.read(visitorRepositoryProvider);
      await action(repo);
      if (context.mounted) {
        ref.invalidate(visitorDetailProvider(widget.visitor.id));
        AppHaptics.success();
        showAppToast(context, context.l10n.visActionDone, tone: ToastTone.success);
      }
    } catch (e) {
      if (context.mounted) {
        showAppToast(context, e.toString(), tone: ToastTone.error);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final visitor = widget.visitor;
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final session = ref.watch(sessionControllerProvider).value;
    final isGate = session?.profile.roles.contains('SECURITY_GATE') ?? false;
    final isOwner =
        session?.profile.id == null
            ? false
            : visitor.createdBy.isNotEmpty;

    final canCheckIn = isGate && visitor.status == VisitorStatus.preRegistered;
    final canCheckOut = isGate && visitor.status == VisitorStatus.checkedIn;
    final canCancel =
        visitor.status == VisitorStatus.preRegistered &&
        (isOwner || isGate);

    return Scaffold(
      appBar: AppBar(
        title: Text(visitor.refNo),
        actions: [
          _StatusChip(status: visitor.status),
          const SizedBox(width: Space.md),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.only(bottom: Space.xxxl),
              children: [
                // Identity card
                _Section(
                  title: l10n.visIdentity,
                  children: [
                    _Row(l10n.visName, visitor.name),
                    if (visitor.organization.isNotEmpty)
                      _Row(l10n.visOrganization, visitor.organization),
                    if (visitor.designation.isNotEmpty)
                      _Row(l10n.visDesignation, visitor.designation),
                    _Row(l10n.visCategory, _categoryLabel(l10n, visitor.category)),
                    if (visitor.phone != null)
                      _Row(l10n.visPhone, visitor.phone!),
                    if (visitor.email != null)
                      _Row(l10n.visEmail, visitor.email!),
                    if (visitor.idProofType != null)
                      _Row(
                        l10n.visIdProof,
                        '${visitor.idProofType} — ${visitor.idProofNumber ?? ''}',
                      ),
                    if (visitor.vehiclePlate != null)
                      _Row(l10n.visVehicle, visitor.vehiclePlate!),
                    if (visitor.badgeNo != null)
                      _Row(l10n.visBadge, visitor.badgeNo!),
                  ],
                ),
                // Visit details
                _Section(
                  title: l10n.visVisitDetails,
                  children: [
                    _Row(l10n.visHost, visitor.hostName),
                    _Row(l10n.visHostDept, visitor.hostDept),
                    _Row(l10n.visPurpose, visitor.purpose),
                    _Row(
                      l10n.visExpected,
                      '${visitor.expectedDate}  ${visitor.expectedTime}',
                    ),
                    if (visitor.checkInTime != null)
                      _Row(
                        l10n.visCheckIn,
                        _fmtTime(visitor.checkInTime!),
                      ),
                    if (visitor.checkOutTime != null)
                      _Row(
                        l10n.visCheckOut,
                        _fmtTime(visitor.checkOutTime!),
                      ),
                    if (visitor.durationMinutes != null)
                      _Row(
                        l10n.visDuration,
                        _fmtDuration(visitor.durationMinutes!),
                      ),
                  ],
                ),
                // Safety
                _Section(
                  title: l10n.visSafety,
                  children: [
                    _BoolRow(
                      l10n.visSafetyBriefing,
                      visitor.safetyBriefingCompleted,
                    ),
                    _BoolRow(l10n.visNda, visitor.ndaSigned),
                    _BoolRow(l10n.visPpeHardHat, visitor.ppeCleared.hardHat),
                    _BoolRow(l10n.visPpeGoggles, visitor.ppeCleared.safetyGoggles),
                    _BoolRow(l10n.visPpeShoes, visitor.ppeCleared.safetyShoes),
                    _BoolRow(l10n.visPpeVest, visitor.ppeCleared.hiVisVest),
                    _BoolRow(l10n.visPpeH2s, visitor.ppeCleared.h2sBriefing),
                  ],
                ),
                // Zones
                if (visitor.permittedZones.isNotEmpty)
                  _Section(
                    title: l10n.visZones,
                    children: [
                      for (final z in visitor.permittedZones)
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: Space.lg,
                            vertical: Space.xs,
                          ),
                          child: Row(
                            children: [
                              _ZoneDot(level: z.level),
                              const SizedBox(width: Space.sm),
                              Expanded(child: Text(z.name)),
                              if (z.escortRequired)
                                Chip(
                                  label: Text(
                                    l10n.visEscortRequired,
                                    style: theme.textTheme.labelSmall,
                                  ),
                                  padding: EdgeInsets.zero,
                                  visualDensity: VisualDensity.compact,
                                ),
                            ],
                          ),
                        ),
                    ],
                  ),
                // Actions
                if (canCheckIn || canCheckOut || canCancel)
                  Padding(
                    padding: const EdgeInsets.all(Space.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (canCheckIn)
                          FilledButton.icon(
                            onPressed: () => _act(
                              context,
                              l10n.visCheckInTitle,
                              l10n.visCheckInConfirm,
                              (r) => r.checkIn(visitor.id),
                            ),
                            icon: const Icon(Icons.login),
                            label: Text(l10n.visCheckIn),
                          ),
                        if (canCheckOut) ...[
                          const SizedBox(height: Space.sm),
                          OutlinedButton.icon(
                            onPressed: () => _act(
                              context,
                              l10n.visCheckOutTitle,
                              l10n.visCheckOutConfirm,
                              (r) => r.checkOut(visitor.id),
                            ),
                            icon: const Icon(Icons.logout),
                            label: Text(l10n.visCheckOut),
                          ),
                        ],
                        if (canCancel) ...[
                          const SizedBox(height: Space.sm),
                          TextButton(
                            onPressed: () => _act(
                              context,
                              l10n.visCancelTitle,
                              l10n.visCancelConfirm,
                              (r) => r.cancel(visitor.id),
                            ),
                            child: Text(
                              l10n.visCancel,
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.error,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
              ],
            ),
    );
  }

  String _fmtTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}  $h:$m';
  }

  String _fmtDuration(int minutes) {
    if (minutes < 60) return '${minutes}m';
    return '${minutes ~/ 60}h ${minutes % 60}m';
  }

  String _categoryLabel(dynamic l10n, VisitorCategory cat) {
    return switch (cat) {
      VisitorCategory.vip => l10n.visVip as String,
      VisitorCategory.govt => l10n.visGovt as String,
      VisitorCategory.vendor => l10n.visVendor as String,
      VisitorCategory.client => l10n.visClient as String,
      VisitorCategory.regular => l10n.visRegular as String,
    };
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [SectionHeader(title: title), ...children],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.xs,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(child: Text(value, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

class _BoolRow extends StatelessWidget {
  const _BoolRow(this.label, this.value);
  final String label;
  final bool value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.xs,
      ),
      child: Row(
        children: [
          Icon(
            value ? Icons.check_circle_outline : Icons.radio_button_unchecked,
            size: 18,
            color: value
                ? theme.colorScheme.primary
                : theme.colorScheme.outlineVariant,
          ),
          const SizedBox(width: Space.sm),
          Expanded(child: Text(label, style: theme.textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

class _ZoneDot extends StatelessWidget {
  const _ZoneDot({required this.level});
  final String level;

  @override
  Widget build(BuildContext context) {
    final color = switch (level) {
      'red' => Theme.of(context).colorScheme.error,
      'yellow' => const Color(0xFFD97706),
      _ => const Color(0xFF059669),
    };
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});
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
