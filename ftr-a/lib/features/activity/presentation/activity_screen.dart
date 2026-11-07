import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/activity/data/activity_repository.dart';
import 'package:bogcl_oneops/features/activity/presentation/activity_controller.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/mock/bootstrap.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

typedef _ActionMeta = ({
  String label,
  String badge,
  IconData icon,
  Color color,
  String category,
});

_ActionMeta _describe(
  AppL10n l10n,
  bool bangla,
  String action,
  String entityType,
) {
  final act = action.toUpperCase();
  final ent = entityType.toUpperCase();

  if (act == 'LOGIN_SUCCESS' || act == 'PERSONA_SWITCH') {
    return (
      label: l10n.activityLoginSuccess,
      badge: bangla ? 'নিরাপত্তা' : 'AUTH',
      icon: Icons.verified_user_outlined,
      color: BrandColors.success,
      category: 'security',
    );
  }
  if (act == 'LOGIN_FAILED') {
    return (
      label: l10n.activityLoginFailed,
      badge: bangla ? 'সতর্কতা' : 'SECURITY',
      icon: Icons.gpp_maybe_outlined,
      color: BrandColors.danger,
      category: 'security',
    );
  }
  if (act == 'LOGOUT') {
    return (
      label: l10n.activityLogout,
      badge: bangla ? 'সেশন' : 'SESSION',
      icon: Icons.logout,
      color: BrandColors.slate900,
      category: 'security',
    );
  }
  if (act == 'PROFILE_UPDATED') {
    return (
      label: l10n.activityProfileUpdated,
      badge: bangla ? 'প্রোফাইল' : 'PROFILE',
      icon: Icons.person_outline,
      color: BrandColors.info,
      category: 'security',
    );
  }
  if (act == 'PREFERENCES_UPDATED') {
    return (
      label: l10n.activityPreferencesUpdated,
      badge: bangla ? 'সেটিংস' : 'PREFS',
      icon: Icons.tune,
      color: BrandColors.info,
      category: 'security',
    );
  }
  if (act == 'NOTIFICATION_ACKED' || act.contains('ACK')) {
    return (
      label: l10n.activityNotificationAcked,
      badge: bangla ? 'স্বীকৃতি' : 'ACK',
      icon: Icons.mark_email_read_outlined,
      color: BrandColors.success,
      category: 'governance',
    );
  }
  if (act.contains('APPROVE') || ent.contains('WORKFLOW')) {
    return (
      label: bangla
          ? 'ওয়ার্কফ্লো অনুমোদন ও সিদ্ধান্ত'
          : 'Workflow Approval & Decision Recorded',
      badge: bangla ? 'অনুমোদন' : 'WORKFLOW',
      icon: Icons.fact_check_outlined,
      color: BrandColors.crimson,
      category: 'governance',
    );
  }
  if (act.contains('SIGN') || ent.contains('NOTE_SHEET')) {
    return (
      label: bangla
          ? 'নোট-শিট ই-স্বাক্ষর ও হ্যাশ সিল'
          : 'Note-Sheet E-Signed & SHA-256 Sealed',
      badge: bangla ? 'নোট-শিট' : 'NOTE-SHEET',
      icon: Icons.draw_outlined,
      color: BrandColors.crimson,
      category: 'governance',
    );
  }
  if (act.contains('PUNCH') || ent.contains('ATTENDANCE')) {
    return (
      label: bangla
          ? 'জিপিএস জিওফেন্স উপস্থিতি পাঞ্চ'
          : 'GPS Geofence Attendance Recorded',
      badge: bangla ? 'উপস্থিতি' : 'ATTENDANCE',
      icon: Icons.fingerprint,
      color: BrandColors.info,
      category: 'operations',
    );
  }
  if (ent.contains('LEAVE')) {
    return (
      label: bangla ? 'ছুটির আবেদন ও হালনাগাদ' : 'Leave Request Processed',
      badge: bangla ? 'ছুটি' : 'LEAVE',
      icon: Icons.beach_access_outlined,
      color: BrandColors.success,
      category: 'operations',
    );
  }
  if (ent.contains('CLAIM') || ent.contains('ADVANCE')) {
    return (
      label: bangla
          ? 'খরচের বিল ও ভাউচার যাচাই'
          : 'Expense Claim & Voucher Action',
      badge: bangla ? 'বিল' : 'CLAIM',
      icon: Icons.receipt_long_outlined,
      color: const Color(0xFF7C3AED),
      category: 'governance',
    );
  }
  if (ent.contains('INCIDENT') || ent.contains('CAPA')) {
    return (
      label: bangla
          ? 'রিফাইনারি নিরাপত্তা ও আরসিএ লগ'
          : 'Refinery Safety & CAPA Action',
      badge: bangla ? 'নিরাপত্তা' : 'HSE SAFETY',
      icon: Icons.health_and_safety_outlined,
      color: BrandColors.danger,
      category: 'operations',
    );
  }
  if (ent.contains('ASSET')) {
    return (
      label: bangla
          ? 'সম্পদ হেফাজত ও রক্ষণাবেক্ষণ লগ'
          : 'Enterprise Asset & Custody Action',
      badge: bangla ? 'সম্পদ' : 'ASSET',
      icon: Icons.precision_manufacturing_outlined,
      color: BrandColors.info,
      category: 'operations',
    );
  }
  if (ent.contains('PARCEL')) {
    return (
      label: bangla
          ? 'মেইলরুম পার্সেল ও ওটিপি চেইন'
          : 'Mailroom Parcel Custody Event',
      badge: bangla ? 'পার্সেল' : 'PARCEL',
      icon: Icons.inventory_2_outlined,
      color: BrandColors.warning,
      category: 'operations',
    );
  }
  if (ent.contains('VISIT')) {
    return (
      label: bangla
          ? 'অতিথি গেট পাস ও নিরাপত্তা নিবন্ধন'
          : 'Visitor Gate Pass & Security Log',
      badge: bangla ? 'অতিথি' : 'VISITOR',
      icon: Icons.badge_outlined,
      color: const Color(0xFF047857),
      category: 'operations',
    );
  }
  if (ent.contains('FLEET') || ent.contains('TRIP') || ent.contains('BUS')) {
    return (
      label: bangla
          ? 'পরিবহন ও ফ্লিট ডিসপ্যাচ লগ'
          : 'Fleet Dispatch & Mobility Event',
      badge: bangla ? 'পরিবহন' : 'MOBILITY',
      icon: Icons.directions_car_outlined,
      color: const Color(0xFFD97706),
      category: 'operations',
    );
  }
  if (ent.contains('LICENCE') || ent.contains('COMPLIANCE')) {
    return (
      label: bangla
          ? 'সংবিধিবদ্ধ লাইসেন্স নবায়ন পদক্ষেপ'
          : 'Statutory Permit Compliance Action',
      badge: bangla ? 'লাইসেন্স' : 'PERMIT',
      icon: Icons.gavel_outlined,
      color: BrandColors.danger,
      category: 'governance',
    );
  }
  if (ent.contains('EMPLOYEE') || ent.contains('EXIT')) {
    return (
      label: bangla
          ? 'মানবসম্পদ ও ছাড়পত্র রেকর্ড'
          : 'Workforce & Exit Clearance Event',
      badge: bangla ? 'এইচআর' : 'WORKFORCE',
      icon: Icons.people_outline,
      color: BrandColors.info,
      category: 'governance',
    );
  }

  return (
    label: '${action.replaceAll('_', ' ')} · $entityType',
    badge: entityType.toUpperCase(),
    icon: Icons.shield_outlined,
    color: BrandColors.crimson,
    category: 'operations',
  );
}

/// Tamper-evident SHA-256 Merkle Audit Ledger & Personal Activity Screen.
class ActivityScreen extends ConsumerStatefulWidget {
  const ActivityScreen({super.key});

  @override
  ConsumerState<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends ConsumerState<ActivityScreen> {
  final _scroll = ScrollController();
  String _category = 'all';
  int? _brokenSeq;
  bool _verified = true;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.extentAfter < 300) unawaited(_loadMore());
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _loadMore() async {
    try {
      await ref.read(activityControllerProvider.notifier).loadMore();
    } on ApiException {
      if (mounted) {
        AppToast.show(
          context,
          context.l10n.inboxLoadMoreFailed,
          tone: StatusTone.warning,
        );
      }
    }
  }

  void _verifyChain(MockStore store, bool bangla) {
    Haptics.success();
    final broken = AuditEngine.verify(store);
    setState(() {
      _brokenSeq = broken;
      _verified = broken == null;
    });
    final total = store.all(Col.auditLogs).length;
    AppToast.show(
      context,
      broken == null
          ? (bangla
                ? 'SHA-256 চেইন অক্ষুণ্ণ রয়েছে · $totalটি ব্লক যাচাইকৃত'
                : 'SHA-256 Merkle chain verified intact across all $total blocks')
          : (bangla
                ? 'ব্লক #$broken এ অসামঞ্জস্য পাওয়া গেছে'
                : 'Chain mismatch detected at sequence #$broken'),
      tone: broken == null ? StatusTone.success : StatusTone.danger,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final lang = Localizations.localeOf(context).languageCode;
    final activity = ref.watch(activityControllerProvider);
    final controller = ref.read(activityControllerProvider.notifier);
    final store = ref.watch(mockStoreProvider);
    final allLogs = store.all(Col.auditLogs);
    final headHash = allLogs.isNotEmpty
        ? '${allLogs.last['hash'] ?? ''}'
        : AuditEngine.genesisHash;

    final categories = <(String, String)>[
      ('all', bangla ? 'সকল কার্যক্রম' : 'All Ledger Events'),
      ('governance', bangla ? 'অনুমোদন ও স্বাক্ষর' : 'Governance & E-Sign'),
      ('operations', bangla ? 'ফিল্ড ও অপারেশনস' : 'Operations & Field'),
      ('security', bangla ? 'নিরাপত্তা ও সেশন' : 'Security & Auth'),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.activityTitle),
        actions: [
          IconButton(
            tooltip: bangla ? 'চেইন যাচাই করুন' : 'Verify SHA-256 Chain',
            icon: const Icon(Icons.verified_outlined),
            onPressed: () => _verifyChain(store, bangla),
          ),
        ],
      ),
      body: Column(
        children: [
          // SHA-256 Merkle Chain Verification Banner
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.lg, Space.xs, Space.lg, 0),
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: _verified
                    ? BrandColors.success.withValues(alpha: 0.1)
                    : BrandColors.danger.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(Corner.lg),
                border: Border.all(
                  color: _verified
                      ? BrandColors.success.withValues(alpha: 0.4)
                      : BrandColors.danger,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _verified ? Icons.verified_user : Icons.gpp_bad,
                        color: _verified
                            ? BrandColors.success
                            : BrandColors.danger,
                        size: 20,
                      ),
                      const SizedBox(width: Space.sm),
                      Expanded(
                        child: Text(
                          _verified
                              ? (bangla
                                    ? 'অপরিবর্তনীয় SHA-256 অডিট লেজার যাচাইকৃত (${allLogs.length} ব্লক)'
                                    : 'Tamper-Evident SHA-256 Audit Chain Intact (${allLogs.length} blocks)')
                              : (bangla
                                    ? 'চেইন ত্রুটি: ব্লক #$_brokenSeq'
                                    : 'Chain Tamper Alert at Block #$_brokenSeq'),
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      FilledButton.tonalIcon(
                        style: FilledButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                        ),
                        onPressed: () => _verifyChain(store, bangla),
                        icon: const Icon(Icons.bolt, size: 15),
                        label: Text(
                          bangla ? 'যাচাই' : 'Verify',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    bangla
                        ? 'প্রতিটি অপারেশনাল সিদ্ধান্ত পূর্ববর্তী হ্যাশের সাথে যুক্ত। যেকোনো সারিতে ট্যাপ করে ক্রিপ্টোগ্রাফিক প্রমাণ দেখুন।'
                        : 'Every action is hash-chained to the previous block. Tap any row below to inspect its SHA-256 proof.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: scheme.surface,
                      borderRadius: BorderRadius.circular(Corner.sm),
                    ),
                    child: Text(
                      'HEAD SHA-256: ${headHash.length > 28 ? '${headHash.substring(0, 28)}…' : headHash}',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Category Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.sm,
            ),
            child: Row(
              children: [
                for (final c in categories) ...[
                  ChoiceChip(
                    label: Text(c.$2),
                    selected: _category == c.$1,
                    onSelected: (_) => setState(() => _category = c.$1),
                  ),
                  const SizedBox(width: Space.sm),
                ],
              ],
            ),
          ),

          Expanded(
            child: activity.when(
              loading: () => const SkeletonList(),
              error: (_, _) =>
                  ErrorState(onRetry: () => unawaited(controller.refresh())),
              data: (s) {
                final filtered = [
                  for (final e in s.items)
                    if (_category == 'all' ||
                        _describe(
                              l10n,
                              bangla,
                              e.action,
                              e.entityType,
                            ).category ==
                            _category)
                      e,
                ];

                if (filtered.isEmpty) {
                  return LayoutBuilder(
                    builder: (context, box) => SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: box.maxHeight,
                        child: EmptyState(
                          icon: Icons.history,
                          title: l10n.activityEmptyTitle,
                          message: l10n.activityEmptyMessage,
                        ),
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: controller.refresh,
                  child: ListView.separated(
                    controller: _scroll,
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(
                      Space.lg,
                      0,
                      Space.lg,
                      Space.xxl,
                    ),
                    itemCount: filtered.length + (s.loadingMore ? 1 : 0),
                    separatorBuilder: (_, _) =>
                        const SizedBox(height: Space.sm),
                    itemBuilder: (context, i) {
                      if (i == filtered.length) {
                        return const Padding(
                          padding: EdgeInsets.all(Space.lg),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }
                      final e = filtered[i];
                      final meta = _describe(
                        l10n,
                        bangla,
                        e.action,
                        e.entityType,
                      );
                      final shortHash = e.hash != null && e.hash!.length >= 12
                          ? '#${e.seq ?? '•'} · ${e.hash!.substring(0, 12)}…'
                          : e.id;

                      return Card(
                        margin: EdgeInsets.zero,
                        child: ListTile(
                          leading: CircleAvatar(
                            radius: 19,
                            backgroundColor: meta.color.withValues(alpha: 0.14),
                            child: Icon(meta.icon, size: 19, color: meta.color),
                          ),
                          title: Text(
                            meta.label,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${DateFmt.dateTime(e.createdAt, lang)}'
                                '${e.entityId != null ? ' · ${e.entityId}' : ''}',
                              ),
                              Text(
                                shortHash,
                                style: TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 11,
                                  color: scheme.primary,
                                ),
                              ),
                            ],
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: meta.color.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(Corner.sm),
                            ),
                            child: Text(
                              meta.badge,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: meta.color,
                              ),
                            ),
                          ),
                          onTap: () {
                            Haptics.tap();
                            unawaited(
                              showModalBottomSheet<void>(
                                context: context,
                                isScrollControlled: true,
                                showDragHandle: true,
                                builder: (_) => _AuditProofSheet(
                                  entry: e,
                                  meta: meta,
                                  bangla: bangla,
                                  lang: lang,
                                ),
                              ),
                            );
                          },
                        ),
                      );
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

class _AuditProofSheet extends StatelessWidget {
  const _AuditProofSheet({
    required this.entry,
    required this.meta,
    required this.bangla,
    required this.lang,
  });

  final ActivityEntry entry;
  final _ActionMeta meta;
  final bool bangla;
  final String lang;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final hash = entry.hash ?? AuditEngine.genesisHash;
    final prevHash = entry.prevHash ?? AuditEngine.genesisHash;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          Space.xl,
          Space.xs,
          Space.xl,
          Space.xl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: meta.color.withValues(alpha: 0.14),
                  child: Icon(meta.icon, color: meta.color),
                ),
                const SizedBox(width: Space.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bangla
                            ? 'ক্রিপ্টোগ্রাফিক অডিট প্রমাণপত্র'
                            : 'Cryptographic Audit Block Proof',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: scheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        meta.label,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: Space.md),
            Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(Corner.md),
                border: Border.all(color: scheme.outlineVariant),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ProofLine(
                    label: bangla ? 'ব্লক ক্রম (Seq)' : 'Ledger Block #',
                    value: '${entry.seq ?? entry.id}',
                  ),
                  _ProofLine(
                    label: bangla ? 'অ্যাকশন কোড' : 'Action Code',
                    value: entry.action,
                  ),
                  _ProofLine(
                    label: bangla ? 'টার্গেট রেকর্ড' : 'Target Entity',
                    value:
                        '${entry.entityType}${entry.entityId != null ? ' (${entry.entityId})' : ''}',
                  ),
                  _ProofLine(
                    label: bangla ? 'টাইমস্ট্যাম্প' : 'Timestamp',
                    value: DateFmt.dateTime(entry.createdAt, lang),
                  ),
                  const Divider(height: Space.lg),
                  Text(
                    bangla
                        ? 'পূর্ববর্তী ব্লক হ্যাশ (Prev SHA-256)'
                        : 'Previous Block SHA-256',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  SelectableText(
                    prevHash,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                  Text(
                    bangla
                        ? 'বর্তমান ব্লক হ্যাশ (Block SHA-256)'
                        : 'Current Block SHA-256 Seal',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: BrandColors.success,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SelectableText(
                    hash,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: Space.lg),
            FilledButton.icon(
              onPressed: () {
                Haptics.tap();
                final text =
                    'BOGCL OneOps Audit Proof\n'
                    'Block: ${entry.seq ?? entry.id}\n'
                    'Action: ${entry.action} (${entry.entityType})\n'
                    'Time: ${entry.createdAt.toIso8601String()}\n'
                    'Prev SHA-256: $prevHash\n'
                    'Seal SHA-256: $hash';
                unawaited(Clipboard.setData(ClipboardData(text: text)));
                Navigator.pop(context);
                AppToast.show(
                  context,
                  bangla
                      ? 'অডিট প্রমাণপত্র ক্লিপবোর্ডে কপি হয়েছে'
                      : 'Cryptographic audit proof copied to clipboard',
                  tone: StatusTone.success,
                );
              },
              icon: const Icon(Icons.copy_all_outlined, size: 18),
              label: Text(
                bangla
                    ? 'ক্রিপ্টোগ্রাফিক প্রমাণ কপি করুন'
                    : 'Copy Cryptographic Proof Certificate',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProofLine extends StatelessWidget {
  const _ProofLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(width: Space.md),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodySmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
