import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/notices/data/notice_repository.dart';
import 'package:bogcl_oneops/features/notices/domain/notice_models.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_providers.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Audience { all, department, site }

/// Publish a notice (HR, HODs, Plant GM, HSE, Chairman). What is offered
/// follows the signed-in user's permissions.
class NoticeComposeScreen extends ConsumerStatefulWidget {
  const NoticeComposeScreen({super.key});

  @override
  ConsumerState<NoticeComposeScreen> createState() =>
      _NoticeComposeScreenState();
}

class _NoticeComposeScreenState extends ConsumerState<NoticeComposeScreen> {
  final _title = TextEditingController();
  final _body = TextEditingController();
  NoticeCategory? _category;
  NoticePriority _priority = NoticePriority.normal;
  _Audience _audience = _Audience.all;
  final Set<String> _ids = {};
  bool _ack = false;
  bool _pin = false;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  bool _valid() =>
      _category != null &&
      _title.text.trim().length >= 3 &&
      _body.text.trim().length >= 5 &&
      (_audience == _Audience.all || _ids.isNotEmpty);

  Future<void> _submit(NoticeOptions options) async {
    final l10n = context.l10n;
    final ok = await showConfirmSheet(
      context,
      title: l10n.noticePublishConfirmTitle,
      message: l10n.noticePublishConfirmMessage,
      confirmLabel: l10n.noticePublish,
    );
    if (!ok || !mounted) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref
          .read(noticeRepositoryProvider)
          .publish(
            title: _title.text.trim(),
            body: _body.text.trim(),
            category: _category!,
            priority: _priority,
            requiresAck: _ack || _priority == NoticePriority.critical,
            isPinned: _pin,
            audienceType: switch (_audience) {
              _Audience.all => 'ALL',
              _Audience.department => 'DEPARTMENT',
              _Audience.site => 'SITE',
            },
            audienceIds: _audience == _Audience.all ? const [] : _ids.toList(),
          );
      ref
        ..invalidate(noticesProvider)
        ..invalidate(noticeCountsProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.noticePublished, tone: StatusTone.success);
      context.pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = switch (e.code) {
          ApiErrorCode.conflict => l10n.noticeErrMaxPinned,
          ApiErrorCode.forbidden => l10n.noticeErrForbidden,
          _ => l10n.noticeErrFailed,
        };
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final options = ref.watch(noticeOptionsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.noticeCompose)),
      body: options.when(
        loading: () => const SkeletonList(),
        error: (_, _) =>
            ErrorState(onRetry: () => ref.invalidate(noticeOptionsProvider)),
        data: (o) => o.canPublish && o.categories.isNotEmpty
            ? _form(context, o)
            : EmptyState(
                icon: Icons.lock_outline,
                title: l10n.noticeErrForbidden,
              ),
      ),
    );
  }

  Widget _form(BuildContext context, NoticeOptions o) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final audiences = <_Audience>[
      if (o.company) _Audience.all,
      _Audience.department,
      if (o.scope != 'DEPARTMENT') _Audience.site,
    ];
    if (!audiences.contains(_audience)) _audience = audiences.first;
    final choices = _audience == _Audience.department
        ? o.departments
        : _audience == _Audience.site
        ? o.sites
        : const <NamedRef>[];
    final ownId = _audience == _Audience.department
        ? o.ownDepartmentId
        : o.ownSiteId;
    final restricted =
        o.scope == 'DEPARTMENT' ||
        (o.scope == 'SITE' && _audience == _Audience.site);

    return ListView(
      padding: const EdgeInsets.all(Space.lg),
      children: [
        Text(l10n.noticeFieldCategory, style: theme.textTheme.labelLarge),
        const SizedBox(height: Space.sm),
        Wrap(
          spacing: Space.sm,
          runSpacing: Space.sm,
          children: [
            for (final c in o.categories)
              ChoiceChip(
                label: Text(noticeCategoryLabel(l10n, c)),
                selected: _category == c,
                onSelected: (_) => setState(() => _category = c),
              ),
          ],
        ),
        const SizedBox(height: Space.lg),
        AppTextField(
          label: l10n.noticeFieldTitle,
          controller: _title,
          maxLength: 200,
          required: true,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: Space.md),
        AppTextField(
          label: l10n.noticeFieldBody,
          controller: _body,
          maxLines: 8,
          maxLength: 5000,
          required: true,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: Space.lg),
        Text(l10n.noticeFieldPriority, style: theme.textTheme.labelLarge),
        const SizedBox(height: Space.sm),
        SegmentedButton<NoticePriority>(
          segments: [
            for (final p in NoticePriority.values)
              ButtonSegment(
                value: p,
                label: Text(noticePriorityLabel(l10n, p)),
              ),
          ],
          selected: {_priority},
          onSelectionChanged: (s) => setState(() => _priority = s.first),
        ),
        if (_priority == NoticePriority.critical)
          Padding(
            padding: const EdgeInsets.only(top: Space.sm),
            child: Text(
              l10n.noticeCriticalHint,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        const SizedBox(height: Space.lg),
        Text(l10n.noticeFieldAudience, style: theme.textTheme.labelLarge),
        const SizedBox(height: Space.sm),
        Wrap(
          spacing: Space.sm,
          children: [
            for (final a in audiences)
              ChoiceChip(
                label: Text(switch (a) {
                  _Audience.all => l10n.noticeAudAll,
                  _Audience.department => l10n.noticeAudDepartment,
                  _Audience.site => l10n.noticeAudSite,
                }),
                selected: _audience == a,
                onSelected: (_) => setState(() {
                  _audience = a;
                  _ids.clear();
                  if (a != _Audience.all && o.scope != 'COMPANY') {
                    _ids.add(
                      a == _Audience.department
                          ? o.ownDepartmentId
                          : o.ownSiteId,
                    );
                  }
                }),
              ),
          ],
        ),
        if (choices.isNotEmpty) ...[
          const SizedBox(height: Space.sm),
          Wrap(
            spacing: Space.sm,
            runSpacing: Space.sm,
            children: [
              for (final c in choices)
                FilterChip(
                  label: Text(c.displayName(bangla: bangla)),
                  selected: _ids.contains(c.id),
                  onSelected: restricted && c.id != ownId
                      ? null
                      : (v) => setState(() {
                          if (v) {
                            _ids.add(c.id);
                          } else {
                            _ids.remove(c.id);
                          }
                        }),
                ),
            ],
          ),
        ],
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(l10n.noticeFieldRequireAck),
          value: _ack || _priority == NoticePriority.critical,
          onChanged: _priority == NoticePriority.critical
              ? null
              : (v) => setState(() => _ack = v),
        ),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(l10n.noticeFieldPin),
          value: _pin,
          onChanged: (v) => setState(() => _pin = v),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: Space.sm),
            child: Row(
              children: [
                Icon(Icons.error_outline, color: context.bogcl.danger),
                const SizedBox(width: Space.sm),
                Expanded(
                  child: Text(
                    _error!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: context.bogcl.danger,
                    ),
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: Space.lg),
        PrimaryButton(
          label: l10n.noticePublish,
          icon: Icons.send_outlined,
          loading: _submitting,
          onPressed: _valid() && !_submitting
              ? () => unawaited(_submit(o))
              : null,
        ),
      ],
    );
  }
}
