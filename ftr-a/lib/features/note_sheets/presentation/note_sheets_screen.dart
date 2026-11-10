import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_providers.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_ui.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _statusCodes = <String>[
  'ALL',
  'DRAFT',
  'IN_REVIEW',
  'RETURNED',
  'APPROVED',
  'REJECTED',
];

/// Note-sheets list: view tabs with counts, search, and status filters.
class NoteSheetsScreen extends ConsumerStatefulWidget {
  const NoteSheetsScreen({super.key});

  @override
  ConsumerState<NoteSheetsScreen> createState() => _NoteSheetsScreenState();
}

class _NoteSheetsScreenState extends ConsumerState<NoteSheetsScreen> {
  String _view = 'mine';
  String _status = 'ALL';
  String _search = '';

  Future<void> _refresh() async {
    ref.invalidate(noteSheetsProvider);
    await ref.read(noteSheetsProvider(_view).future);
  }

  String _statusLabel(AppL10n l10n, String code) => switch (code) {
    'ALL' => l10n.nsFilterAllStatuses,
    _ => nsStatusLabel(l10n, code),
  };

  bool _matchesSearch(NoteSheet r, {required bool bangla}) {
    if (_search.isEmpty) return true;
    final hay =
        '${r.title} ${r.subject} ${r.fileNo ?? ''} '
                '${r.departmentName} ${r.departmentNameBn} '
                '${r.initiator.display(bangla: bangla)}'
            .toLowerCase();
    return hay.contains(_search);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canSign = session?.can('note-sheets:sign') ?? false;
    final canAll = session?.can('note-sheets:read', GrantScope.team) ?? false;
    final canCreate = session?.can('note-sheets:create') ?? false;
    final sheets = ref.watch(noteSheetsProvider(_view));
    final scheme = Theme.of(context).colorScheme;
    final mineCount = ref.watch(noteSheetsProvider('mine')).value?.length ?? 0;
    final toSignCount = canSign
        ? (ref.watch(noteSheetsProvider('to-sign')).value?.length ?? 0)
        : 0;
    final allCount = canAll
        ? (ref.watch(noteSheetsProvider('all')).value?.length ?? 0)
        : 0;

    Widget viewChip(String view, String label, int count) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        visualDensity: VisualDensity.compact,
        label: Text('$label ($count)', style: const TextStyle(fontSize: 12)),
        selected: _view == view,
        onSelected: (_) {
          Haptics.tap();
          setState(() => _view = view);
        },
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleNoteSheets),
        actions: const [AppBarActions()],
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.noteSheetNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.nsNew),
            )
          : null,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.sm, Space.lg, 0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  viewChip('mine', l10n.nsTabMine, mineCount),
                  if (canSign)
                    viewChip('to-sign', l10n.nsTabToSign, toSignCount),
                  if (canAll) viewChip('all', l10n.nsTabAll, allCount),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: 2,
            ),
            child: SizedBox(
              height: 40,
              child: TextField(
                decoration: InputDecoration(
                  hintText: l10n.nsSearchHint,
                  hintStyle: const TextStyle(fontSize: 12),
                  prefixIcon: const Icon(Icons.search, size: 18),
                  contentPadding: EdgeInsets.zero,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(Corner.md),
                    borderSide: BorderSide(color: scheme.outlineVariant),
                  ),
                ),
                onChanged: (v) =>
                    setState(() => _search = v.trim().toLowerCase()),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.xs,
              Space.lg,
              Space.xs,
            ),
            child: sheets.maybeWhen(
              data: (rows) {
                final searched = rows
                    .where((r) => _matchesSearch(r, bangla: bangla))
                    .toList();
                return SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (final code in _statusCodes) ...[
                        FilterChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(
                            '${_statusLabel(l10n, code)} (${code == 'ALL' ? searched.length : searched.where((r) => r.status == code).length})',
                            style: const TextStyle(fontSize: 12),
                          ),
                          selected: _status == code,
                          onSelected: (_) {
                            Haptics.tap();
                            setState(() => _status = code);
                          },
                        ),
                        const SizedBox(width: Space.xs),
                      ],
                    ],
                  ),
                );
              },
              orElse: () => const SizedBox(height: 32),
            ),
          ),
          Expanded(
            child: sheets.when(
              loading: SkeletonList.new,
              error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
              data: (rows) {
                final filtered = rows.where((r) {
                  if (_status != 'ALL' && r.status != _status) return false;
                  return _matchesSearch(r, bangla: bangla);
                }).toList();

                if (filtered.isEmpty) {
                  return EmptyState(
                    icon: Icons.description_outlined,
                    title: switch (_view) {
                      'to-sign' => l10n.nsEmptyToSign,
                      'all' => l10n.nsEmptyAll,
                      _ => l10n.nsEmptyMine,
                    },
                  );
                }

                return RefreshIndicator(
                  onRefresh: _refresh,
                  child: ListView.separated(
                    padding: const EdgeInsets.only(bottom: 96),
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (_, i) => _Row(
                      sheet: filtered[i],
                      showAuthor: _view != 'mine',
                      bangla: bangla,
                    ),
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
  const _Row({
    required this.sheet,
    required this.showAuthor,
    required this.bangla,
  });

  final NoteSheet sheet;
  final bool showAuthor;
  final bool bangla;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final amount = nsAmount(sheet, bangla: bangla, none: '');
    final head = [
      if (sheet.fileNo != null) sheet.fileNo!,
      if (amount.isNotEmpty) amount,
      if (showAuthor) sheet.initiator.display(bangla: bangla),
    ].join(' · ');
    return ListRow(
      title: sheet.title,
      subtitle: [
        if (head.isNotEmpty) head,
        nsNextLine(l10n, sheet, bangla: bangla),
      ].join('\n'),
      trailing: StatusPill(
        label: nsStatusLabel(l10n, sheet.status),
        tone: sheet.me.canSign ? StatusTone.info : nsStatusTone(sheet.status),
      ),
      onTap: () => unawaited(context.push(AppRoutes.noteSheetDetail(sheet.id))),
    );
  }
}
