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
import 'package:bogcl_oneops/shared/widgets/app_bar_actions.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Note-Sheets Home (MOD-03):
/// Top Verdict Banner, Category Filters, Signatory Queue, and Multi-Level Dossier
class NoteSheetsScreen extends ConsumerStatefulWidget {
  const NoteSheetsScreen({super.key});

  @override
  ConsumerState<NoteSheetsScreen> createState() => _NoteSheetsScreenState();
}

class _NoteSheetsScreenState extends ConsumerState<NoteSheetsScreen> {
  String _view = 'mine';
  String _category = 'ALL';

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
    final scheme = theme.colorScheme;

    final categories = [
      ('ALL', bangla ? 'সকল' : 'All'),
      ('CAPEX', bangla ? 'ক্যাপেক্স' : 'CAPEX'),
      ('OPEX', bangla ? 'ওপেক্স' : 'OPEX'),
      ('PROCUREMENT', bangla ? 'ক্রয়' : 'Procurement'),
      ('HR_POLICY', bangla ? 'এইচআর পলিসি' : 'HR Policy'),
      ('EMERGENCY', bangla ? 'প্ল্যান্ট জরুরি' : 'Emergency Plant'),
    ];

    Widget chip(String view, String label) => Padding(
      padding: const EdgeInsets.only(right: Space.sm),
      child: ChoiceChip(
        label: Text(label),
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
          // Plain-Language Verdict Banner
          Container(
            margin: const EdgeInsets.fromLTRB(Space.lg, Space.sm, Space.lg, 0),
            padding: const EdgeInsets.symmetric(
              horizontal: Space.md,
              vertical: Space.sm,
            ),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(Corner.lg),
              border: Border.all(color: scheme.outlineVariant),
            ),
            child: Row(
              children: [
                const Icon(Icons.edit_document, color: Colors.teal, size: 20),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: Text(
                    bangla
                        ? '২টি নোট-শীট আপনার ডিজিটাল স্বাক্ষরের জন্য প্রস্তুত রয়েছে · ১টি ফেরত ফাইল সংশোধনের অপেক্ষায়।'
                        : '2 note-sheets are waiting at your desk for digital signature · 1 returned file needs revision.',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.teal,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Primary View Tabs
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.sm, Space.lg, 0),
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

          // Category Filter Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.xs,
              Space.lg,
              Space.xs,
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final c in categories) ...[
                    FilterChip(
                      label: Text(c.$2),
                      selected: _category == c.$1,
                      onSelected: (_) {
                        Haptics.tap();
                        setState(() => _category = c.$1);
                      },
                    ),
                    const SizedBox(width: Space.xs),
                  ],
                ],
              ),
            ),
          ),

          Expanded(
            child: sheets.when(
              loading: SkeletonList.new,
              error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
              data: (rows) {
                final filtered = rows.where((r) {
                  if (_category == 'ALL') return true;
                  final text = '${r.title} ${r.subject} ${r.departmentName}'
                      .toUpperCase();
                  return switch (_category) {
                    'CAPEX' =>
                      text.contains('CAPEX') ||
                          (r.amount != null && r.amount! > 1000000),
                    'OPEX' =>
                      text.contains('OPEX') ||
                          (r.amount != null && r.amount! <= 1000000),
                    'PROCUREMENT' =>
                      text.contains('PROCUREMENT') ||
                          text.contains('PURCHASE') ||
                          text.contains('SUPPLY') ||
                          r.quoteCount > 0,
                    'HR_POLICY' =>
                      text.contains('HR') ||
                          text.contains('POLICY') ||
                          text.contains('PERSONNEL'),
                    'EMERGENCY' =>
                      text.contains('EMERGENCY') ||
                          text.contains('CRITICAL') ||
                          r.urgency == 'URGENT',
                    _ => true,
                  };
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
