import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/notices/data/notice_repository.dart';
import 'package:bogcl_oneops/features/notices/domain/notice_models.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_providers.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_ui.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum _Audience { all, department, site }

const _noticeBodyPresets = <(String, String)>[
  (
    'All plant operational staff and shift engineers at Keraniganj Filling Plant are instructed to complete mandatory PPE and static earthing verification prior to cylinder batch charging.',
    'কেরানীগঞ্জ ফিলিং প্ল্যান্টের সকল অপারেশনাল কর্মী ও শিফট প্রকৌশলীদের সিলিন্ডার চার্জিং শুরুর পূর্বে বাধ্যতামূলক পিপিই এবং স্ট্যাটিক আর্থিং যাচাই সম্পন্ন করার নির্দেশ দেওয়া হলো।',
  ),
  (
    'Head Office and Plant administrative offices will follow revised roster timings on the upcoming public observance day. Emergency LPG dispatch & security desks remain 24/7 operational.',
    'আসন্ন সরকারি দিবসে প্রধান কার্যালয় ও প্ল্যান্ট অফিসসমূহ সংশোধিত রোস্টার সময়সূচি অনুসরণ করবে। জরুরি এলপিজি ডেসপ্যাচ এবং নিরাপত্তা ডেস্ক ২৪/৭ সচল থাকবে।',
  ),
  (
    'Departmental heads are requested to submit quarterly statutory compliance and asset inspection summaries via OneOps before the 25th of this month.',
    'বিভাগীয় প্রধানগণকে চলতি মাসের ২৫ তারিখের মধ্যে ওয়ানঅপসের মাধ্যমে ত্রৈমাসিক বিধিবদ্ধ কমপ্লায়েন্স এবং সম্পদ পরিদর্শন প্রতিবেদন জমা দেওয়ার জন্য অনুরোধ করা হচ্ছে।',
  ),
];

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
  int? _draftIndex;

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  bool _valid() =>
      _title.text.trim().length >= 3 &&
      _body.text.trim().length >= 5 &&
      (_audience == _Audience.all || _ids.isNotEmpty);

  void _pickAudience(_Audience a, NoticeOptions o) {
    setState(() {
      _audience = a;
      _ids.clear();
      if (a != _Audience.all && o.scope != 'COMPANY') {
        _ids.add(a == _Audience.department ? o.ownDepartmentId : o.ownSiteId);
      }
    });
  }

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
            category: _category ?? options.categories.first,
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

  String _draftLabel(AppL10n l10n, int i) => switch (i) {
    0 => l10n.noticeDraftPpe,
    1 => l10n.noticeDraftHoliday,
    _ => l10n.noticeDraftQuarter,
  };

  String _audienceLabel(AppL10n l10n, _Audience a) => switch (a) {
    _Audience.all => l10n.noticeAudAll,
    _Audience.department => l10n.noticeAudDepartment,
    _Audience.site => l10n.noticeAudSite,
  };

  Widget _form(BuildContext context, NoticeOptions o) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final category = _category ?? o.categories.first;
    final audiences = <_Audience>[
      if (o.company) _Audience.all,
      _Audience.department,
      if (o.scope != 'DEPARTMENT') _Audience.site,
    ];
    if (!audiences.contains(_audience)) {
      _audience = audiences.first;
    }
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

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
              Space.md,
              Space.sm,
              Space.md,
              Space.lg,
            ),
            children: [
              _Card(
                children: [
                  AppTextField(
                    label: l10n.noticeFieldTitle,
                    controller: _title,
                    maxLength: 200,
                    required: true,
                    textInputAction: TextInputAction.next,
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: Space.sm),
                  EnterpriseDropdownField<int?>(
                    label: l10n.noticeUseDraft,
                    icon: Icons.auto_fix_high_outlined,
                    value: _draftIndex,
                    items: [
                      const DropdownMenuItem<int?>(child: Text('—')),
                      for (var i = 0; i < _noticeBodyPresets.length; i++)
                        DropdownMenuItem(
                          value: i,
                          child: Text(_draftLabel(l10n, i)),
                        ),
                    ],
                    onChanged: (i) {
                      if (i == null) {
                        setState(() => _draftIndex = null);
                        return;
                      }
                      final preset = _noticeBodyPresets[i];
                      setState(() {
                        _draftIndex = i;
                        _body.text = bangla ? preset.$2 : preset.$1;
                      });
                    },
                  ),
                  const SizedBox(height: Space.sm),
                  AppTextField(
                    label: l10n.noticeFieldBody,
                    controller: _body,
                    maxLines: 3,
                    maxLength: 5000,
                    required: true,
                    textInputAction: TextInputAction.newline,
                    keyboardType: TextInputType.multiline,
                    onChanged: (_) => setState(() => _draftIndex = null),
                  ),
                  const SizedBox(height: Space.sm),
                  EnterpriseDropdownField<_Audience>(
                    label: l10n.noticeFieldAudience,
                    icon: Icons.groups_outlined,
                    value: _audience,
                    items: [
                      for (final a in audiences)
                        DropdownMenuItem(
                          value: a,
                          child: Text(_audienceLabel(l10n, a)),
                        ),
                    ],
                    onChanged: (a) {
                      if (a != null) _pickAudience(a, o);
                    },
                  ),
                  if (choices.isNotEmpty) ...[
                    const SizedBox(height: Space.sm),
                    Wrap(
                      spacing: Space.sm,
                      runSpacing: Space.xs,
                      children: [
                        for (final c in choices)
                          FilterChip(
                            visualDensity: VisualDensity.compact,
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
                  const SizedBox(height: Space.sm),
                  EnterpriseDropdownField<NoticeCategory>(
                    label: l10n.noticeFieldCategory,
                    icon: Icons.category_outlined,
                    value: category,
                    items: [
                      for (final c in o.categories)
                        DropdownMenuItem(
                          value: c,
                          child: Text(noticeCategoryLabel(l10n, c)),
                        ),
                    ],
                    onChanged: (c) {
                      if (c != null) setState(() => _category = c);
                    },
                  ),
                  const SizedBox(height: Space.sm),
                  EnterpriseDropdownField<NoticePriority>(
                    label: l10n.noticeFieldPriority,
                    icon: Icons.flag_outlined,
                    value: _priority,
                    items: [
                      for (final p in NoticePriority.values)
                        DropdownMenuItem(
                          value: p,
                          child: Text(noticePriorityLabel(l10n, p)),
                        ),
                    ],
                    onChanged: (p) {
                      if (p != null) setState(() => _priority = p);
                    },
                  ),
                  if (_priority == NoticePriority.critical)
                    Padding(
                      padding: const EdgeInsets.only(top: Space.sm),
                      child: Text(
                        l10n.noticeCriticalHint,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: context.bogcl.danger,
                        ),
                      ),
                    ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    visualDensity: VisualDensity.compact,
                    title: Text(l10n.noticeFieldRequireAck),
                    value: _ack || _priority == NoticePriority.critical,
                    onChanged: _priority == NoticePriority.critical
                        ? null
                        : (v) => setState(() => _ack = v),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    visualDensity: VisualDensity.compact,
                    title: Text(l10n.noticeFieldPin),
                    value: _pin,
                    onChanged: (v) => setState(() => _pin = v),
                  ),
                ],
              ),
            ],
          ),
        ),
        EnterpriseFormBottomBar(
          primaryLabel: l10n.noticePublish,
          loading: _submitting,
          isReady: _valid(),
          errorMessage: _error,
          onPrimaryPressed: _valid() && !_submitting
              ? () => unawaited(_submit(o))
              : null,
        ),
      ],
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.md),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ),
    );
  }
}
