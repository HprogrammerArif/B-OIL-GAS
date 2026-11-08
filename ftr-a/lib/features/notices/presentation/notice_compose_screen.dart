import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/notices/data/notice_repository.dart';
import 'package:bogcl_oneops/features/notices/domain/notice_models.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_providers.dart';
import 'package:bogcl_oneops/features/notices/presentation/notice_ui.dart';
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
    _category ??= o.categories.first;
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

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.md,
              Space.lg,
              Space.xxl,
            ),
            children: [
              EnterpriseApplicantStrip(
                badgeLabel: bangla ? 'দাপ্তরিক বিজ্ঞপ্তি' : 'OFFICIAL CIRCULAR',
                badgeIcon: Icons.campaign_outlined,
              ),
              const SizedBox(height: Space.md),
              EnterpriseSectionCard(
                stepNumber: 1,
                icon: Icons.category_outlined,
                title: bangla
                    ? 'বিজ্ঞপ্তির শ্রেণি ও অগ্রাধিকার'
                    : 'Notice Category & Priority Tier',
                subtitle: bangla
                    ? 'বিজ্ঞপ্তির ধরন এবং গুরুত্বের মাত্রা নির্বাচন করুন'
                    : 'Select circular classification and broadcast urgency level',
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: EnterpriseDropdownField<NoticeCategory>(
                          label: l10n.noticeFieldCategory,
                          icon: Icons.folder_outlined,
                          value: _category!,
                          items: [
                            for (final c in o.categories)
                              DropdownMenuItem(
                                value: c,
                                child: Text(noticeCategoryLabel(l10n, c)),
                              ),
                          ],
                          onChanged: (v) =>
                              setState(() => _category = v ?? _category),
                        ),
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: EnterpriseDropdownField<NoticePriority>(
                          label: l10n.noticeFieldPriority,
                          icon: Icons.priority_high_outlined,
                          value: _priority,
                          items: [
                            for (final p in NoticePriority.values)
                              DropdownMenuItem(
                                value: p,
                                child: Text(noticePriorityLabel(l10n, p)),
                              ),
                          ],
                          onChanged: (v) =>
                              setState(() => _priority = v ?? _priority),
                        ),
                      ),
                    ],
                  ),
                  if (_priority == NoticePriority.critical)
                    Padding(
                      padding: const EdgeInsets.only(top: Space.sm),
                      child: Text(
                        l10n.noticeCriticalHint,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: context.bogcl.danger,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: Space.md),
              EnterpriseSectionCard(
                stepNumber: 2,
                icon: Icons.article_outlined,
                title: bangla
                    ? 'বিজ্ঞপ্তির শিরোনাম ও মূল বার্তা'
                    : 'Circular Subject & Official Body',
                subtitle: bangla
                    ? 'স্ট্যান্ডার্ড খসড়া বাছাই করুন অথবা বিজ্ঞপ্তির বিবরণ লিখুন'
                    : 'Use a standard BOGCL circular template or compose custom text',
                children: [
                  AppTextField(
                    label: l10n.noticeFieldTitle,
                    controller: _title,
                    maxLength: 200,
                    required: true,
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: Space.md),
                  EnterpriseTemplateDropdown(
                    presets: _noticeBodyPresets,
                    controller: _body,
                    onPicked: () => setState(() {}),
                    labelEn: 'Standard BOGCL Circular Template (Quick Fill)',
                    labelBn: 'স্ট্যান্ডার্ড বিজ্ঞপ্তি টেমপ্লেট (দ্রুত পূরণ)',
                  ),
                  const SizedBox(height: Space.sm),
                  AppTextField(
                    label: l10n.noticeFieldBody,
                    controller: _body,
                    maxLines: 6,
                    maxLength: 5000,
                    required: true,
                    onChanged: (_) => setState(() {}),
                  ),
                ],
              ),
              const SizedBox(height: Space.md),
              EnterpriseSectionCard(
                stepNumber: 3,
                icon: Icons.groups_outlined,
                title: bangla
                    ? 'প্রাপক পরিধি ও প্রাপ্তিস্বীকার'
                    : 'Target Audience & Read Receipt Controls',
                subtitle: bangla
                    ? 'কোন বিভাগ বা স্থাপনায় বিজ্ঞপ্তিটি পৌঁছাবে তা নির্ধারণ করুন'
                    : 'Choose target scope, board pinning, and mandatory read acknowledgement',
                children: [
                  EnterpriseDropdownField<_Audience>(
                    label: l10n.noticeFieldAudience,
                    icon: Icons.radar_outlined,
                    value: _audience,
                    items: [
                      for (final a in audiences)
                        DropdownMenuItem(
                          value: a,
                          child: Text(switch (a) {
                            _Audience.all => l10n.noticeAudAll,
                            _Audience.department => l10n.noticeAudDepartment,
                            _Audience.site => l10n.noticeAudSite,
                          }),
                        ),
                    ],
                    onChanged: (a) {
                      if (a == null) return;
                      setState(() {
                        _audience = a;
                        _ids.clear();
                        if (a != _Audience.all && o.scope != 'COMPANY') {
                          _ids.add(
                            a == _Audience.department
                                ? o.ownDepartmentId
                                : o.ownSiteId,
                          );
                        }
                      });
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
                  const SizedBox(height: Space.xs),
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
                ],
              ),
              const SizedBox(height: Space.md),
              EnterpriseWorkflowCard(
                title: bangla
                    ? 'বিজ্ঞপ্তি সম্প্রচার ও প্রাপ্তিস্বীকার ট্র্যাকিং'
                    : 'Broadcast Delivery & Read-Receipt Audit',
                steps: [
                  (
                    Icons.campaign_outlined,
                    bangla ? 'প্রকাশক' : 'Publisher',
                    bangla ? 'স্বাক্ষর ও প্রকাশ' : 'Signed & Sent',
                  ),
                  (
                    Icons.notifications_active_outlined,
                    bangla ? 'পুশ নোটিফিকেশন' : 'Instant Push',
                    bangla ? 'টার্গেট কর্মী' : 'Scoped Staff',
                  ),
                  (
                    Icons.done_all_outlined,
                    bangla ? 'প্রাপ্তিস্বীকার লগ' : 'Read Ledger',
                    bangla ? 'কমপ্লায়েন্স অডিট' : 'Ack Tracked',
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
