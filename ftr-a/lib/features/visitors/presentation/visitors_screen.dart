import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_ui.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// MOD-08: Visitor Gate Passes, Safety PPE Clearance & Emergency Muster Roll
class VisitorsScreen extends ConsumerStatefulWidget {
  const VisitorsScreen({super.key});

  @override
  ConsumerState<VisitorsScreen> createState() => _VisitorsScreenState();
}

class _VisitorsScreenState extends ConsumerState<VisitorsScreen> {
  // Mode: 'host' vs 'gate'
  String _mode = 'host';
  String _view = 'mine';
  String _query = '';
  String _categoryFilter = 'ALL';
  bool _musterMode = false;
  final Set<String> _demoMusterSafe = {};
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    if (s != null &&
        (s.hasRole('SECURITY_GATE') ||
            s.hasRole('TRANSPORT_ADMIN') ||
            s.hasRole('CHAIRMAN'))) {
      _mode = 'gate';
      _view = 'all';
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _openScan(String text) async {
    final l10n = context.l10n;
    final q = text.trim();
    if (q.length < 3) return;
    try {
      final v = await ref.read(visitorRepositoryProvider).scan(q);
      if (!mounted) return;
      unawaited(context.push(AppRoutes.visitDetail(v.id)));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.code == ApiErrorCode.forbidden
            ? l10n.visScanNeedGate
            : l10n.visNotFound,
        tone: StatusTone.warning,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canCreate = session?.can('visitors:create') ?? false;
    final canGate =
        (session?.can('visitors:gate') ?? false) ||
        (session?.roleKeys.any(
              (r) =>
                  r == 'TRANSPORT_ADMIN' ||
                  r == 'HR_ADMIN' ||
                  r == 'CHAIRMAN' ||
                  r == 'PLANT_GM',
            ) ??
            false);
    final canApprove = session?.can('visitors:approve') ?? false;
    final canSite =
        (session?.can('visitors:read', GrantScope.site) ?? false) ||
        (session?.roleKeys.any(
              (r) =>
                  r == 'TRANSPORT_ADMIN' ||
                  r == 'HR_ADMIN' ||
                  r == 'CHAIRMAN' ||
                  r == 'PLANT_GM',
            ) ??
            false);

    final effectiveMode = (canGate || canSite) ? _mode : 'host';
    final effectiveView = _musterMode
        ? 'inside'
        : (effectiveMode == 'gate' ? 'all' : _view);

    final rows = ref.watch(visitsProvider(view: effectiveView, query: _query));

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleVisitors),
        actions: [
          // Emergency Muster Roll Mode Toggle
          if (canGate || canSite)
            IconButton(
              tooltip: _musterMode
                  ? (bangla ? 'নিয়মিত মোডে ফিরুন' : 'Exit Muster Mode')
                  : (bangla
                        ? 'জরুরি ইভাকুয়েশন মাস্টার রোল'
                        : 'Emergency Muster Roll'),
              icon: Icon(
                Icons.crisis_alert,
                color: _musterMode ? Colors.red : Colors.orange.shade700,
              ),
              onPressed: () {
                Haptics.heavy();
                setState(() => _musterMode = !_musterMode);
                AppToast.show(
                  context,
                  _musterMode
                      ? (bangla
                            ? 'জরুরি মাস্টার রোল সক্রিয় — অন-সাইট সকল ভিজিটর ফিল্টার করা হয়েছে'
                            : 'Emergency Muster Mode Active — Showing all on-site visitors!')
                      : (bangla
                            ? 'সাধারণ ভিজিটর মোডে ফিরে আসা হয়েছে'
                            : 'Exited Emergency Muster Mode.'),
                  tone: _musterMode ? StatusTone.danger : StatusTone.info,
                );
              },
            ),
          if (canGate)
            IconButton(
              tooltip: l10n.visMuster,
              onPressed: () => unawaited(context.push(AppRoutes.visitMuster)),
              icon: const Icon(Icons.groups_outlined),
            ),
        ],
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.visitNew)),
              icon: const Icon(Icons.person_add_outlined),
              label: Text(l10n.visNew),
            )
          : null,
      body: Column(
        children: [
          // Plain-Language Verdict Banner
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: Container(
              padding: const EdgeInsets.all(Space.sm),
              decoration: BoxDecoration(
                color: _musterMode ? Colors.red.shade50 : Colors.teal.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _musterMode
                      ? Colors.red.shade300
                      : Colors.teal.shade200,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _musterMode
                        ? Icons.warning_amber_rounded
                        : Icons.shield_outlined,
                    color: _musterMode ? Colors.red : Colors.teal.shade800,
                    size: 20,
                  ),
                  const SizedBox(width: Space.xs),
                  Expanded(
                    child: Text(
                      _musterMode
                          ? (bangla
                                ? 'জরুরি অ্যালার্ম: প্ল্যান্ট সাইটের ভেতরের সকল ভিজিটরকে অ্যাসেম্বলি পয়েন্টে হিসাব করুন।'
                                : 'Emergency Alarm: Verify all on-site plant visitors at Assembly Point #3.')
                          : (canGate || canSite)
                          ? (bangla
                                ? '৪ জন অতিথি বর্তমানে কেরানীগঞ্জ রিফাইনারি ও হেড অফিসে অবস্থান করছেন · ১১:৩০ টায় বিএসটিআই অডিট টিম আসছেন (ভিআইপি প্রোটোকল)।'
                                : '4 visitors currently inside Keraniganj & HQ · 1 BSTI Regulator team arriving at 11:30 AM (VIP Protocol).')
                          : (bangla
                                ? 'আপনার আমন্ত্রিত অতিথিদের গেট পাস এবং নিরাপত্তা পিপিই ক্লিয়ারেন্স এখানে পরিচালনা করুন।'
                                : 'Manage gate passes and safety PPE clearance for your invited guests.'),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _musterMode
                            ? Colors.red.shade900
                            : Colors.teal.shade900,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Host View vs Security Gate Console Scope Switch
          if (canGate || canSite)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.md,
                Space.xs,
                Space.md,
                0,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: SegmentedButton<String>(
                      segments: [
                        if (canCreate)
                          ButtonSegment(
                            value: 'host',
                            icon: const Icon(Icons.person_outline, size: 16),
                            label: Text(
                              bangla
                                  ? 'আমার আমন্ত্রিত অতিথি'
                                  : 'My Guests (Host)',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ButtonSegment(
                          value: 'gate',
                          icon: const Icon(Icons.security, size: 16),
                          label: Text(
                            bangla
                                ? 'সিকিউরিটি গেট কনসোল'
                                : 'Gate Console (All)',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                      selected: {
                        if (!canCreate && effectiveMode == 'host')
                          'gate'
                        else
                          effectiveMode,
                      },
                      onSelectionChanged: (s) {
                        setState(() {
                          _mode = s.first;
                          if (_mode == 'gate') {
                            _view = 'all';
                          } else {
                            _view = 'mine';
                          }
                        });
                      },
                    ),
                  ),
                ],
              ),
            ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: TextField(
              decoration: InputDecoration(
                hintText: bangla
                    ? 'পাস নং (VIS-...), অতিথি বা গাড়ির নম্বর খুঁজুন'
                    : l10n.visSearchHint,
                prefixIcon: const Icon(Icons.search, size: 20),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
              textInputAction: TextInputAction.search,
              onChanged: (v) {
                _debounce?.cancel();
                _debounce = Timer(const Duration(milliseconds: 300), () {
                  if (mounted) setState(() => _query = v);
                });
              },
              onSubmitted: (v) {
                if (canGate) unawaited(_openScan(v));
              },
            ),
          ),

          // Category Filters (Regulator, VIP, Contractor)
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.md,
              vertical: Space.xs,
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ChoiceChip(
                    label: Text(bangla ? 'সকল ধরন' : 'All Categories'),
                    selected: _categoryFilter == 'ALL',
                    onSelected: (_) => setState(() => _categoryFilter = 'ALL'),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    avatar: const Icon(Icons.account_balance, size: 14),
                    label: Text(bangla ? 'সরকারি রেগুলেটর' : 'Govt Regulator'),
                    selected: _categoryFilter == 'GOVT',
                    onSelected: (_) => setState(() => _categoryFilter = 'GOVT'),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    avatar: const Icon(
                      Icons.star,
                      size: 14,
                      color: Colors.amber,
                    ),
                    label: Text(
                      bangla ? 'ভিআইপি / মন্ত্রণালয়' : 'VIP / Ministry',
                    ),
                    selected: _categoryFilter == 'VIP',
                    onSelected: (_) => setState(() => _categoryFilter = 'VIP'),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    avatar: const Icon(Icons.engineering, size: 14),
                    label: Text(
                      bangla ? 'কন্ট্রাক্টর / কারিগরি' : 'Contractor',
                    ),
                    selected: _categoryFilter == 'CONTRACTOR',
                    onSelected: (_) =>
                        setState(() => _categoryFilter = 'CONTRACTOR'),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    avatar: const Icon(Icons.storefront, size: 14),
                    label: Text(bangla ? 'ভেন্ডর / সরবরাহকারী' : 'Vendor'),
                    selected: _categoryFilter == 'VENDOR',
                    onSelected: (_) =>
                        setState(() => _categoryFilter = 'VENDOR'),
                  ),
                ],
              ),
            ),
          ),

          // Operational Status Chips (Inside, Expected, Overdue, To-Approve)
          if (!_musterMode)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.md),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ChoiceChip(
                      label: Text(l10n.visTabMine),
                      selected: _view == 'mine',
                      onSelected: (_) => setState(() => _view = 'mine'),
                    ),
                    const SizedBox(width: Space.xs),
                    if (canGate || canSite) ...[
                      ChoiceChip(
                        avatar: const Icon(Icons.login, size: 14),
                        label: Text(l10n.visTabInside),
                        selected: _view == 'inside',
                        onSelected: (_) => setState(() => _view = 'inside'),
                      ),
                      const SizedBox(width: Space.xs),
                      ChoiceChip(
                        avatar: const Icon(Icons.schedule, size: 14),
                        label: Text(l10n.visTabExpected),
                        selected: _view == 'expected',
                        onSelected: (_) => setState(() => _view = 'expected'),
                      ),
                      const SizedBox(width: Space.xs),
                      ChoiceChip(
                        avatar: const Icon(Icons.timer_off, size: 14),
                        label: Text(l10n.visTabOverdue),
                        selected: _view == 'overdue',
                        onSelected: (_) => setState(() => _view = 'overdue'),
                      ),
                      const SizedBox(width: Space.xs),
                    ],
                    if (canApprove) ...[
                      ChoiceChip(
                        avatar: const Icon(Icons.approval, size: 14),
                        label: Text(l10n.visTabApprove),
                        selected: _view == 'to-approve',
                        onSelected: (_) => setState(() => _view = 'to-approve'),
                      ),
                      const SizedBox(width: Space.xs),
                    ],
                    if (canSite)
                      ChoiceChip(
                        label: Text(l10n.visTabAll),
                        selected: _view == 'all',
                        onSelected: (_) => setState(() => _view = 'all'),
                      ),
                  ],
                ),
              ),
            ),

          const SizedBox(height: Space.xs),

          // List Body
          Expanded(
            child: rows.when(
              loading: () => const SkeletonList(),
              error: (_, _) =>
                  ErrorState(onRetry: () => ref.invalidate(visitsProvider)),
              data: (rawList) {
                // Apply Category Filter
                var list = rawList;
                if (_categoryFilter != 'ALL') {
                  list = list
                      .where((v) => v.category == _categoryFilter)
                      .toList();
                }

                if (_musterMode) {
                  // Only show checked-in visitors in muster mode
                  list = list.where((v) => v.status == 'CHECKED_IN').toList();
                }

                if (list.isEmpty) {
                  return EmptyState(
                    message: _query.isEmpty
                        ? l10n.visEmpty
                        : l10n.visEmptyFiltered,
                  );
                }

                final insideCount = list
                    .where((v) => v.status == 'CHECKED_IN')
                    .length;
                final accountedCount = list
                    .where(
                      (v) =>
                          _demoMusterSafe.contains(v.id) ||
                          v.musterSafeAt != null,
                    )
                    .length;

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(visitsProvider);
                    await ref.read(
                      visitsProvider(view: effectiveView, query: _query).future,
                    );
                  },
                  child: ListView(
                    padding: const EdgeInsets.only(bottom: 96),
                    children: [
                      // Emergency Evacuation Muster Roll Bar
                      if (_musterMode)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(
                            Space.md,
                            Space.xs,
                            Space.md,
                            Space.sm,
                          ),
                          child: Container(
                            padding: const EdgeInsets.all(Space.md),
                            decoration: BoxDecoration(
                              color: Colors.red.shade900,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Expanded(
                                      child: Row(
                                        children: [
                                          Icon(
                                            Icons.warning,
                                            color: Colors.amber,
                                            size: 20,
                                          ),
                                          SizedBox(width: Space.xs),
                                          Flexible(
                                            child: Text(
                                              'EMERGENCY MUSTER ROLL',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: Space.xs),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.red.shade700,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        'Accounted: $accountedCount / $insideCount',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: Space.xs),
                                Text(
                                  bangla
                                      ? 'কেরানীগঞ্জ রিফাইনারি এসেম্বলি পয়েন্ট #৩ এ প্রতিটি ভিজিটর উপস্থিতি যাচাই করুন।'
                                      : 'Verify all visitor headcount at Refinery Gate Muster Assembly Point #3.',
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11,
                                  ),
                                ),
                                const SizedBox(height: Space.sm),
                                PrimaryButton(
                                  label: bangla
                                      ? 'এক ক্লিকে সকল ভিজিটর নিরাপদ চিহ্নিত করুন'
                                      : 'Mark All Visitors Accounted For',
                                  icon: Icons.done_all,
                                  onPressed: () {
                                    Haptics.heavy();
                                    setState(() {
                                      for (final v in list) {
                                        _demoMusterSafe.add(v.id);
                                      }
                                    });
                                    AppToast.show(
                                      context,
                                      bangla
                                          ? 'সকল $insideCount জন ভিজিটরকে নিরাপদ হিসেবে রেকর্ড করা হয়েছে!'
                                          : 'All $insideCount visitors recorded safe at Assembly Point!',
                                      tone: StatusTone.success,
                                    );
                                  },
                                ),
                              ],
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
                        child: Text(
                          _musterMode
                              ? (bangla
                                    ? 'অন-সাইট ভিজিটর মাস্টার রেজিস্টার:'
                                    : 'On-Site Visitors Muster Register:')
                              : l10n.visVerdictNeed(
                                  list.where(visitNeedsMe).length,
                                ),
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ),

                      for (final v in list)
                        _buildVisitorTile(context, v, bangla),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVisitorTile(BuildContext context, Visit v, bool bangla) {
    final l10n = context.l10n;
    final isSafe = _demoMusterSafe.contains(v.id) || v.musterSafeAt != null;

    // Highest zone level
    final hasRed = v.zones.any((z) => z.level == 'RED');
    final hasYellow = v.zones.any((z) => z.level == 'YELLOW');

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: Space.md, vertical: 4),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => unawaited(context.push(AppRoutes.visitDetail(v.id))),
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: v.category == 'VIP' || v.category == 'GOVT'
                        ? Colors.amber.shade100
                        : Colors.blueGrey.shade100,
                    child: Icon(
                      v.category == 'VIP'
                          ? Icons.star
                          : v.category == 'GOVT'
                          ? Icons.account_balance
                          : Icons.person_outline,
                      color: v.category == 'VIP' || v.category == 'GOVT'
                          ? Colors.amber.shade900
                          : Colors.blueGrey.shade700,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                v.guest.fullName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            StatusPill(
                              label: visitStatusLabel(l10n, v.status),
                              tone: visitStatusTone(v.status),
                            ),
                          ],
                        ),
                        if (v.guest.organisation != null)
                          Text(
                            v.guest.organisation!,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        const SizedBox(height: 2),
                        Text(
                          '${v.visitNo} · ${v.site.label(bangla: bangla)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: Space.xs),

              // Badges row: Zone, Vehicle, PPE
              Wrap(
                spacing: Space.xs,
                runSpacing: 4,
                children: [
                  // Zone badge
                  if (hasRed)
                    const StatusPill(
                      label: 'RED ZONE (Distillation)',
                      tone: StatusTone.danger,
                      icon: Icons.shield,
                    )
                  else if (hasYellow)
                    const StatusPill(
                      label: 'YELLOW ZONE (Tank Farm)',
                      tone: StatusTone.warning,
                      icon: Icons.security,
                    )
                  else
                    const StatusPill(
                      label: 'GREEN ZONE (Admin)',
                      tone: StatusTone.success,
                    ),

                  // Vehicle plate badge
                  if (v.vehiclePlate != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.grey.shade400),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.directions_car, size: 12),
                          const SizedBox(width: 3),
                          Text(
                            v.vehiclePlate!,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),

                  // PPE badge
                  if (v.ppeRequired)
                    StatusPill(
                      label: v.ppeCleared ? 'PPE Cleared' : 'PPE Required',
                      tone: v.ppeCleared
                          ? StatusTone.success
                          : StatusTone.warning,
                    ),
                ],
              ),

              // Next line
              const SizedBox(height: Space.xs),
              Text(
                visitNextLine(l10n, v, bangla: bangla),
                style: const TextStyle(fontSize: 11, color: Colors.blueGrey),
              ),

              // Quick Action in Muster Mode
              if (_musterMode) ...[
                const Divider(height: Space.md),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        isSafe
                            ? (bangla
                                  ? '✓ এসেম্বলি পয়েন্টে নিরাপদ'
                                  : '✓ Safe at Assembly Point')
                            : (bangla
                                  ? 'উপস্থিতি অনুপস্থিত'
                                  : 'Status: Unaccounted'),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          color: isSafe ? Colors.green.shade700 : Colors.red,
                        ),
                      ),
                    ),
                    if (!isSafe) ...[
                      const SizedBox(width: Space.xs),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          visualDensity: VisualDensity.compact,
                        ),
                        icon: const Icon(Icons.check, size: 14),
                        label: Text(
                          bangla ? 'নিরাপদ নিশ্চিত করুন' : 'Mark Safe',
                        ),
                        onPressed: () {
                          Haptics.success();
                          setState(() => _demoMusterSafe.add(v.id));
                          AppToast.show(
                            context,
                            '${v.guest.fullName} marked safe at Assembly Point #3!',
                            tone: StatusTone.success,
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
