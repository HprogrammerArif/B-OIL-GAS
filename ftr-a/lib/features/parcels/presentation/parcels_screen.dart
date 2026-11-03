import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/parcels/data/parcel_repository.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_providers.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Parcels I send, receive, carry or look after, with a search by tracking
/// number (the QR on the label holds the same number).
class ParcelsScreen extends ConsumerStatefulWidget {
  const ParcelsScreen({super.key});

  @override
  ConsumerState<ParcelsScreen> createState() => _ParcelsScreenState();
}

class _ParcelsScreenState extends ConsumerState<ParcelsScreen> {
  String _view = 'mine';
  String _query = '';
  bool _stuckOnly = false;
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(parcelsProvider);
    await ref.read(
      parcelsProvider(_view, query: _query, stuckOnly: _stuckOnly).future,
    );
  }

  /// Exact tracking number typed or pasted: open it straight away.
  Future<void> _open(String text) async {
    final l10n = context.l10n;
    final no = text.trim().toUpperCase();
    if (!RegExp(r'^PKG-\d{4}-\d{4}$').hasMatch(no)) return;
    try {
      final p = await ref.read(parcelRepositoryProvider).byTracking(no);
      if (!mounted) return;
      unawaited(context.push(AppRoutes.parcelDetail(p.id)));
    } on ApiException {
      if (!mounted) return;
      AppToast.show(context, l10n.pcNotFound, tone: StatusTone.warning);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final session = ref.watch(sessionControllerProvider).value;
    final canCreate = session?.can('parcels:create') ?? false;
    final canCarry = session?.can('parcels:deliver') ?? false;
    final canSite =
        session?.can('parcels:read', GrantScope.site) ?? false;
    final rows = ref.watch(
      parcelsProvider(_view, query: _query, stuckOnly: _stuckOnly),
    );

    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleParcels)),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.parcelNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.pcSend),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.pcIntro,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.md),
                TextField(
                  onChanged: (v) {
                    _debounce?.cancel();
                    _debounce = Timer(const Duration(milliseconds: 300), () {
                      if (mounted) setState(() => _query = v.trim());
                    });
                  },
                  onSubmitted: (v) => unawaited(_open(v)),
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: l10n.pcSearchHint,
                    prefixIcon: const Icon(Icons.search),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.md,
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  chip('mine', l10n.pcTabMine),
                  chip('incoming', l10n.pcTabIncoming),
                  chip('sent', l10n.pcTabSent),
                  if (canCarry) chip('carrying', l10n.pcTabCarrying),
                  if (canSite) chip('all', l10n.pcTabSite),
                  FilterChip(
                    label: Text(l10n.pcStuckOnly),
                    selected: _stuckOnly,
                    onSelected: (v) => setState(() => _stuckOnly = v),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: rows.when(
              loading: () => const SkeletonList(),
              error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.inventory_2_outlined,
                    title: _query.isNotEmpty || _stuckOnly
                        ? l10n.pcEmptyFiltered
                        : l10n.pcEmpty,
                  );
                }
                final needMe = list.where(parcelNeedsMe).length;
                return RefreshIndicator(
                  onRefresh: _refresh,
                  child: ListView.separated(
                    padding: const EdgeInsets.only(bottom: 96),
                    itemCount: list.length + 1,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      if (i == 0) {
                        return Padding(
                          padding: const EdgeInsets.fromLTRB(
                            Space.lg,
                            0,
                            Space.lg,
                            Space.sm,
                          ),
                          child: Text(
                            needMe == 0
                                ? l10n.pcVerdictNone
                                : l10n.pcVerdictNeed(needMe),
                            style: theme.textTheme.titleSmall,
                          ),
                        );
                      }
                      return _Row(parcel: list[i - 1], bangla: bangla);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.parcel, required this.bangla});

  final Parcel parcel;
  final bool bangla;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final p = parcel;
    final title = p.hidden || p.description == null
        ? l10n.pcConfidentialTitle
        : p.description!;
    return ListRow(
      leading: Icon(
        p.isConfidential ? Icons.lock_outline : Icons.inventory_2_outlined,
      ),
      title: title,
      subtitle: [
        '${p.trackingNo} · ${p.origin.label(bangla: bangla)} → '
            '${p.dest.label(bangla: bangla)}',
        parcelNextLine(l10n, p, bangla: bangla),
      ].join('\n'),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          StatusPill(
            label: parcelStatusLabel(l10n, p.status),
            tone: parcelStatusTone(p.status),
          ),
          if (p.stuck)
            Padding(
              padding: const EdgeInsets.only(top: Space.xs),
              child: StatusPill(
                label: l10n.pcStuckPill(p.dwellHours),
                tone: StatusTone.danger,
              ),
            ),
        ],
      ),
      onTap: () => unawaited(context.push(AppRoutes.parcelDetail(p.id))),
    );
  }
}
