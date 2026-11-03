import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_providers.dart';
import 'package:bogcl_oneops/features/note_sheets/presentation/note_sheet_ui.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Note-sheets I wrote, those waiting for my signature, and (for managers)
/// everything in my scope.
class NoteSheetsScreen extends ConsumerStatefulWidget {
  const NoteSheetsScreen({super.key});

  @override
  ConsumerState<NoteSheetsScreen> createState() => _NoteSheetsScreenState();
}

class _NoteSheetsScreenState extends ConsumerState<NoteSheetsScreen> {
  String _view = 'mine';

  Future<void> _refresh() async {
    ref.invalidate(noteSheetsProvider);
    await ref.read(noteSheetsProvider(_view).future);
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
    final theme = Theme.of(context);

    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        label: Text(label),
        selected: _view == view,
        onSelected: (_) => setState(() => _view = view),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.moduleNoteSheets)),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.noteSheetNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.nsNew),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, 0),
            child: Text(
              l10n.nsIntro,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(Space.lg),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  chip('mine', l10n.nsTabMine),
                  if (canSign) chip('to-sign', l10n.nsTabToSign),
                  if (canAll) chip('all', l10n.nsTabAll),
                ],
              ),
            ),
          ),
          Expanded(
            child: sheets.when(
              loading: SkeletonList.new,
              error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
              data: (rows) => rows.isEmpty
                  ? EmptyState(
                      icon: Icons.description_outlined,
                      title: switch (_view) {
                        'to-sign' => l10n.nsEmptyToSign,
                        'all' => l10n.nsEmptyAll,
                        _ => l10n.nsEmptyMine,
                      },
                    )
                  : RefreshIndicator(
                      onRefresh: _refresh,
                      child: ListView.separated(
                        padding: const EdgeInsets.only(bottom: 96),
                        itemCount: rows.length,
                        separatorBuilder: (_, _) => const Divider(height: 1),
                        itemBuilder: (_, i) => _Row(
                          sheet: rows[i],
                          showAuthor: _view != 'mine',
                          bangla: bangla,
                        ),
                      ),
                    ),
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
