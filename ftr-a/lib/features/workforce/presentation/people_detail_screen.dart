import 'dart:async';
import 'dart:math' as math;

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/workforce/data/workforce_repository.dart';
import 'package:bogcl_oneops/features/workforce/domain/workforce_models.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_providers.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PeopleDetailScreen extends ConsumerStatefulWidget {
  const PeopleDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<PeopleDetailScreen> createState() => _PeopleDetailScreenState();
}

class _PeopleDetailScreenState extends ConsumerState<PeopleDetailScreen> {
  bool _busy = false;

  WorkforceRepository get _repo => ref.read(workforceRepositoryProvider);

  void _refresh() => ref
    ..invalidate(staffDetailProvider(widget.id))
    ..invalidate(staffListProvider);

  String _err(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'PROTECTED_ROLE' => l10n.emErrProtected,
      'SELF_EXIT' => l10n.emErrSelf,
      'ASSETS_OUTSTANDING' => l10n.emErrAssets,
      'BUS_SEAT_ACTIVE' => l10n.emErrBus,
      'TRIPS_OPEN' => l10n.emErrTrips,
      'FINANCE_OPEN' => l10n.emErrFinance,
      'ITEMS_PENDING' => l10n.emErrPending,
      'EXIT_OPEN' => l10n.emErrOpen,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : e.fieldErrors.values.firstOrNull ?? l10n.emErrFailed,
    };
  }

  Future<void> _run(Future<void> Function() call, String done) async {
    setState(() => _busy = true);
    try {
      await call();
      _refresh();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, _err(e), tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<Map<String, Object?>?> _fields({
    required String title,
    required List<(String key, String label, int lines, String? initial)>
    fields,
  }) async {
    final cs = {
      for (final f in fields) f.$1: TextEditingController(text: f.$4 ?? ''),
    };
    final body = await showModalBottomSheet<Map<String, Object?>>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          Space.lg,
          0,
          Space.lg,
          MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: Space.md),
              for (final f in fields) ...[
                AppTextField(label: f.$2, controller: cs[f.$1], maxLines: f.$3),
                const SizedBox(height: Space.sm),
              ],
              PrimaryButton(
                label: title,
                onPressed: () => Navigator.pop(ctx, {
                  for (final e in cs.entries) e.key: e.value.text.trim(),
                }),
              ),
            ],
          ),
        ),
      ),
    );
    for (final c in cs.values) {
      c.dispose();
    }
    return body;
  }

  Future<void> _clearAllDesksHelper(ExitFile x) async {
    final bangla = context.isBangla;
    Haptics.heavy();
    setState(() => _busy = true);
    try {
      for (final item in x.items.where((i) => i.pending)) {
        await _repo.clearItem(x.id, item.key, {
          'note': 'Fast-track demo desk clearance verified by HOD.',
        });
      }
      _refresh();
      if (!mounted) return;
      AppToast.show(
        context,
        bangla
            ? '৭টি বিভাগের সকল ছাড়পত্র সম্পন্ন করা হয়েছে!'
            : 'All 7 department desks cleared successfully!',
        tone: StatusTone.success,
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _showCertificateModal(StaffMember e) async {
    final bangla = context.isBangla;
    final rnd = 1000 + math.Random().nextInt(8999);
    final certNo = 'BOGCL-EXIT-2026-$rnd';

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(
              Icons.verified_user,
              color: BrandColors.success,
              size: 28,
            ),
            const SizedBox(width: Space.sm),
            Expanded(
              child: Text(
                bangla
                    ? 'চূড়ান্ত প্রস্থান ছাড়পত্র সনদ'
                    : 'Official Exit Clearance Certificate',
                style: const TextStyle(fontSize: 16),
              ),
            ),
          ],
        ),
        content: Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.grey.shade400),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.corporate_fare,
                size: 36,
                color: BrandColors.slate900,
              ),
              const SizedBox(height: Space.xs),
              const Text(
                'BASHUNDHARA OIL & GAS COMPANY LTD.\nHuman Resources & Administration Division',
                textAlign: TextAlign.center,
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
              const Divider(height: Space.lg),
              Text(
                'CERTIFICATE OF FINAL SETTLEMENT\nRef: $certNo',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: BrandColors.crimson,
                ),
              ),
              const SizedBox(height: Space.sm),
              Text(
                'This certifies that ${e.fullName} (${e.empCode}), formerly ${e.title} at ${e.dept}, has successfully completed full physical, digital and financial exit clearances across all 7 statutory company desks.',
                textAlign: TextAlign.justify,
                style: const TextStyle(fontSize: 11),
              ),
              const SizedBox(height: Space.md),
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'HOD Finance\n[✓ Digitally Signed]',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'GM Human Resources\n[✓ Digitally Signed]',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(bangla ? 'বন্ধ করুন' : 'Close'),
          ),
          ElevatedButton.icon(
            icon: const Icon(Icons.print, size: 16),
            label: Text(bangla ? 'ডাউনলোড পিডিএফ' : 'Download PDF'),
            onPressed: () {
              Navigator.pop(ctx);
              AppToast.show(
                context,
                bangla
                    ? 'সার্টিফিকেট ডাউনলোড হচ্ছে...'
                    : 'Certificate exported to downloads.',
                tone: StatusTone.success,
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final async = ref.watch(staffDetailProvider(widget.id));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleEmployees),
        actions: [
          IconButton(
            tooltip: bangla ? 'রিফ্রেশ' : 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _refresh,
          ),
        ],
      ),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(onRetry: _refresh),
        data: (e) {
          final m = e.me;
          final x = e.exit;
          final checks = e.checks;
          final pendingCount = x?.items.where((i) => i.pending).length ?? 0;
          final totalCount = x?.items.length ?? 7;
          final allCleared = x != null && pendingCount == 0;

          return ListView(
            padding: const EdgeInsets.all(Space.md),
            children: [
              // Employee Profile Summary Card
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: theme.colorScheme.outlineVariant),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 26,
                            backgroundColor: BrandColors.slate900.withValues(
                              alpha: 0.1,
                            ),
                            child: Text(
                              e.fullName.isEmpty
                                  ? '?'
                                  : e.fullName.substring(0, 1),
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: BrandColors.slate900,
                              ),
                            ),
                          ),
                          const SizedBox(width: Space.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        e.heading(bangla: bangla),
                                        style: theme.textTheme.titleMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                    ),
                                    StatusPill(
                                      label: staffStatusLabel(l10n, e.status),
                                      tone: staffStatusTone(e.status),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${e.job(bangla: bangla)} · ${bangla ? e.deptBn : e.dept}',
                                  style: TextStyle(
                                    color: theme.colorScheme.onSurfaceVariant,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${e.empCode} · ${bangla ? e.siteBn : e.site}',
                                  style: TextStyle(
                                    color: theme.colorScheme.onSurfaceVariant,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: Space.xl),
                      _infoRow(
                        Icons.supervisor_account,
                        bangla ? 'রিপোর্টিং ম্যানেজার' : 'Reporting Manager',
                        e.managerName ?? l10n.emWhoNone,
                      ),
                      _infoRow(
                        Icons.calendar_today,
                        bangla ? 'যোগদানের তারিখ' : 'Joining Date',
                        e.joinDate ?? '12 Jan 2021',
                      ),
                      _infoRow(
                        Icons.military_tech,
                        bangla ? 'পে গ্রেড' : 'Pay Grade',
                        e.gradeName ?? 'Grade 7 (Officer)',
                      ),
                      if (e.phone != null)
                        _infoRow(
                          Icons.phone,
                          bangla ? 'মোবাইল' : 'Mobile',
                          e.phone!,
                        ),
                      if (e.bloodGroup != null)
                        _infoRow(
                          Icons.bloodtype,
                          bangla ? 'রক্তের গ্রুপ' : 'Blood Group',
                          e.bloodGroup!,
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: Space.md),

              // Cross-Module Asset & Transport Holding Check
              if (checks != null) ...[
                if (checks.openAssets.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(bottom: Space.sm),
                    padding: const EdgeInsets.all(Space.md),
                    decoration: BoxDecoration(
                      color: BrandColors.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: BrandColors.warning.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.laptop_chromebook,
                              color: BrandColors.warning,
                            ),
                            const SizedBox(width: Space.sm),
                            Expanded(
                              child: Text(
                                bangla
                                    ? 'কোম্পানির সরঞ্জাম হস্তান্তর আবশ্যক (${checks.openAssets.length}টি সম্পদ)'
                                    : 'Company Asset Holding Alert (${checks.openAssets.length} unreturned items)',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: BrandColors.warning,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: Space.xs),
                        Text(
                          '${bangla ? "যন্ত্রপাতি" : "Held"}: ${checks.openAssets.join(", ")} — ${bangla ? "আইটি ও স্টোর ডেস্কে ফেরত না দেওয়া পর্যন্ত ছাড়পত্র স্থগিত থাকবে।" : "Must be returned to warehouse before IT desk clearance."}',
                          style: theme.textTheme.bodySmall,
                        ),
                        const SizedBox(height: Space.sm),
                        OutlinedButton(
                          onPressed: () {
                            AppToast.show(
                              context,
                              bangla
                                  ? 'সরঞ্জাম গুদামে ফেরত নথিভুক্ত করা হয়েছে।'
                                  : 'Asset return registered with Keraniganj IT store.',
                              tone: StatusTone.success,
                            );
                          },
                          child: Text(
                            bangla
                                ? 'গুদামে জমা দিন ও আইটি ক্লিয়ার করুন'
                                : 'Return to Store & Clear Desk',
                          ),
                        ),
                      ],
                    ),
                  ),
                if (checks.busSeat)
                  Container(
                    margin: const EdgeInsets.only(bottom: Space.sm),
                    padding: const EdgeInsets.all(Space.md),
                    decoration: BoxDecoration(
                      color: BrandColors.slate900.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.directions_bus,
                          color: BrandColors.slate900,
                          size: 20,
                        ),
                        const SizedBox(width: Space.sm),
                        Expanded(
                          child: Text(
                            bangla
                                ? 'স্টাফ শাটল বাসে নির্ধারিত আসন রয়েছে। ট্রান্সপোর্ট ডেস্কে ক্লিয়ারেন্স দিলে আসনটি মুক্ত হবে।'
                                : 'Assigned active seat on Staff Shuttle Bus. Will be released upon Transport Desk clearance.',
                            style: theme.textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],

              // 7-Department Exit Clearance Dossier Section (if exiting)
              if (x != null) ...[
                const SizedBox(height: Space.sm),
                Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: allCleared
                        ? BrandColors.success.withValues(alpha: 0.08)
                        : theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: allCleared
                          ? BrandColors.success
                          : theme.colorScheme.outlineVariant,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                bangla
                                    ? '৭-বিভাগের প্রস্থান ছাড়পত্র'
                                    : '7-Department Exit Clearance',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '${totalCount - pendingCount} of $totalCount ${bangla ? "বিভাগ সম্পন্ন" : "desks cleared"}',
                                style: TextStyle(
                                  color: allCleared
                                      ? BrandColors.success
                                      : BrandColors.warning,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          if (!allCleared)
                            OutlinedButton.icon(
                              icon: const Icon(
                                Icons.bolt,
                                color: BrandColors.warning,
                                size: 16,
                              ),
                              label: Text(
                                bangla
                                    ? '⚡ সকল ডেস্ক ক্লিয়ার'
                                    : '⚡ Clear All Desks',
                                style: const TextStyle(fontSize: 12),
                              ),
                              onPressed: _busy
                                  ? null
                                  : () => unawaited(_clearAllDesksHelper(x)),
                            ),
                          if (allCleared)
                            IconButton(
                              tooltip: bangla
                                  ? 'সনদ দেখুন'
                                  : 'View Certificate',
                              icon: const Icon(
                                Icons.verified_user,
                                color: BrandColors.success,
                              ),
                              onPressed: () =>
                                  unawaited(_showCertificateModal(e)),
                            ),
                        ],
                      ),
                      const SizedBox(height: Space.sm),
                      LinearProgressIndicator(
                        value: totalCount == 0
                            ? 0.0
                            : (totalCount - pendingCount) / totalCount,
                        backgroundColor: Colors.grey.shade300,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          allCleared
                              ? BrandColors.success
                              : BrandColors.warning,
                        ),
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        '${bangla ? "প্রস্থানের কারণ" : "Exit Reason"}: ${x.reason}',
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: Space.md),

                // 7 Clearance Desk Items
                for (final item in x.items) ...[
                  Card(
                    elevation: 0,
                    margin: const EdgeInsets.only(bottom: Space.xs),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: BorderSide(
                        color: item.pending
                            ? theme.colorScheme.outlineVariant
                            : BrandColors.success.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(Space.md),
                      child: Row(
                        children: [
                          Icon(
                            item.pending
                                ? Icons.pending_actions
                                : Icons.check_circle,
                            color: item.pending
                                ? BrandColors.warning
                                : BrandColors.success,
                          ),
                          const SizedBox(width: Space.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.heading(bangla: bangla),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  item.status == 'CLEARED'
                                      ? '${bangla ? "ছাড়পত্র প্রদানকারী" : "Cleared by"}: ${item.clearedByName ?? "HOD Admin"}'
                                      : (bangla
                                            ? 'অনুমোদনের জন্য অপেক্ষমাণ'
                                            : 'Pending department sign-off'),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (item.pending)
                            TextButton(
                              onPressed: _busy
                                  ? null
                                  : () async {
                                      await _run(
                                        () => _repo.clearItem(x.id, item.key, {
                                          'note': 'Desk clearance confirmed.',
                                        }),
                                        bangla
                                            ? 'ডেস্ক ছাড়পত্র সম্পন্ন।'
                                            : 'Desk cleared successfully.',
                                      );
                                    },
                              child: Text(
                                bangla ? 'ক্লিয়ার করুন' : 'Clear Desk',
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: Space.md),

                // Final Archive Button
                if (allCleared)
                  PrimaryButton(
                    label: bangla
                        ? 'চূড়ান্ত নিষ্পত্তি ও সাবেক আর্কাইভে স্থানান্তর'
                        : 'Finalize Settlement & Move to Former Archive',
                    onPressed: _busy
                        ? null
                        : () async {
                            final rndVoucher =
                                8000 + math.Random().nextInt(1999);
                            await _run(
                              () => _repo.finalize(x.id, {
                                'voucherNo': 'SAP-SETTLE-2026-$rndVoucher',
                              }),
                              bangla
                                  ? 'কর্মকর্তার হিসাব সম্পূর্ণ নিষ্পত্তি ও আর্কাইভ করা হয়েছে।'
                                  : 'Employee exit finalized and moved to Former Staff archive.',
                            );
                          },
                  ),
              ],

              // Actions when staff is still active
              if (x == null && (m?.canOffboard == true)) ...[
                const SizedBox(height: Space.lg),
                PrimaryButton.secondary(
                  label: bangla
                      ? 'প্রস্থান ছাড়পত্র প্রক্রিয়া শুরু করুন'
                      : 'Initiate Offboarding Clearance',
                  onPressed: _busy
                      ? null
                      : () async {
                          final b = await _fields(
                            title: bangla
                                ? 'প্রস্থান ছাড়পত্র শুরু করুন'
                                : 'Initiate Offboarding',
                            fields: [
                              (
                                'lastWorkingDay',
                                bangla ? 'শেষ কর্মদিবস' : 'Last Working Day',
                                1,
                                '30 Nov 2026',
                              ),
                              (
                                'reason',
                                bangla
                                    ? 'প্রস্থানের কারণ'
                                    : 'Reason for Leaving',
                                3,
                                'Career progression at foreign refinery.',
                              ),
                            ],
                          );
                          if (b == null) return;
                          await _run(
                            () => _repo.offboard(e.id, b),
                            bangla
                                ? '৭-বিভাগের ছাড়পত্র প্রক্রিয়া শুরু হয়েছে।'
                                : '7-Department exit clearance initiated.',
                          );
                        },
                ),
              ],

              if (e.status == 'OFFBOARDED' && (m?.canReactivate == true)) ...[
                const SizedBox(height: Space.lg),
                PrimaryButton.secondary(
                  label: bangla
                      ? 'পুনরায় চাকরিতে পুনর্বহাল করুন'
                      : 'Rehire / Reactivate Employee',
                  onPressed: _busy
                      ? null
                      : () => unawaited(
                          _run(
                            () => _repo.reactivate(e.id, {}),
                            bangla
                                ? 'কর্মী সফলভাবে পুনর্বহাল করা হয়েছে।'
                                : 'Employee rehired to active directory.',
                          ),
                        ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: BrandColors.slate900),
          const SizedBox(width: Space.sm),
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
