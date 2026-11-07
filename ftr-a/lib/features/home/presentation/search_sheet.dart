import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/modules.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/dashboards/data/dashboard_repository.dart';
import 'package:bogcl_oneops/shared/widgets/persona_switcher_sheet.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

Future<void> showGlobalSearch(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
    ),
    builder: (_) => const _SearchSheet(),
  );
}

class _SearchSheet extends ConsumerStatefulWidget {
  const _SearchSheet();

  @override
  ConsumerState<_SearchSheet> createState() => _SearchSheetState();
}

class _SearchSheetState extends ConsumerState<_SearchSheet> {
  final _q = TextEditingController();
  Timer? _debounce;
  List<Map<String, Object?>> _hits = const [];
  bool _busy = false;
  String _last = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _q.dispose();
    super.dispose();
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 240), () {
      unawaited(_run(v));
    });
  }

  Future<void> _run(String v) async {
    final q = v.trim();
    if (q.length < 2) {
      setState(() {
        _hits = const [];
        _last = q;
      });
      return;
    }
    setState(() => _busy = true);
    try {
      final hits = await ref.read(dashboardRepositoryProvider).search(q);
      if (!mounted) return;
      setState(() {
        _hits = hits;
        _last = q;
        _busy = false;
      });
    } on Object {
      if (!mounted) return;
      setState(() => _busy = false);
    }
  }

  void _goRoute(String route) {
    Haptics.tap();
    Navigator.pop(context);
    openAppRoute(context, route);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final inset = MediaQuery.viewInsetsOf(context).bottom;
    final session = ref.watch(sessionControllerProvider).value;
    final navKeys = session?.navigation.toSet() ?? const <String>{};

    return Padding(
      padding: EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, inset + Space.lg),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.82,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(Space.sm),
                  decoration: BoxDecoration(
                    color: scheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(Corner.md),
                  ),
                  child: Icon(
                    Icons.terminal_outlined,
                    color: scheme.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: Space.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bangla
                            ? 'সার্বজনীন কমান্ড ও অনুসন্ধান'
                            : 'Command Palette & Global Search',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        l10n.searchHint,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: Space.md),
            TextField(
              controller: _q,
              autofocus: true,
              decoration: InputDecoration(
                hintText: l10n.searchField,
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _q.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () {
                          _q.clear();
                          _onChanged('');
                          setState(() {});
                        },
                      )
                    : null,
              ),
              onChanged: (v) {
                setState(() {});
                _onChanged(v);
              },
              textInputAction: TextInputAction.search,
            ),
            const SizedBox(height: Space.md),
            Expanded(
              child: _busy
                  ? const SkeletonList()
                  : _last.length < 2
                  ? _ZeroStatePalette(
                      bangla: bangla,
                      navKeys: navKeys,
                      onGoRoute: _goRoute,
                      onQuickQuery: (q) {
                        _q.text = q;
                        setState(() {});
                        unawaited(_run(q));
                      },
                    )
                  : _hits.isEmpty
                  ? EmptyState(title: l10n.searchEmpty)
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(bottom: Space.sm),
                          child: Text(
                            bangla
                                ? '${_hits.length}টি ফলাফল পাওয়া গেছে'
                                : '${_hits.length} matching records across BOGCL OneOps',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: scheme.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Expanded(
                          child: ListView.separated(
                            itemCount: _hits.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: Space.xs),
                            itemBuilder: (context, i) {
                              final h = _hits[i];
                              final kind = '${h['kind']}';
                              final (icon, badgeLabel, color) = _kindMeta(
                                kind,
                                bangla,
                              );
                              return Card(
                                margin: EdgeInsets.zero,
                                child: ListTile(
                                  leading: CircleAvatar(
                                    radius: 18,
                                    backgroundColor: color.withValues(
                                      alpha: 0.14,
                                    ),
                                    child: Icon(icon, size: 18, color: color),
                                  ),
                                  title: Text(
                                    bangla
                                        ? '${h['titleBn'] ?? h['title']}'
                                        : '${h['title']}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  subtitle: Text(
                                    '${h['subtitle'] ?? ''}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  trailing: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 3,
                                    ),
                                    decoration: BoxDecoration(
                                      color: color.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(
                                        Corner.sm,
                                      ),
                                    ),
                                    child: Text(
                                      badgeLabel,
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: color,
                                      ),
                                    ),
                                  ),
                                  onTap: () {
                                    final route = h['route'] as String?;
                                    Haptics.tap();
                                    Navigator.pop(context);
                                    if (route != null) {
                                      unawaited(context.push(route));
                                    }
                                  },
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  (IconData, String, Color) _kindMeta(String kind, bool bangla) =>
      switch (kind) {
        'person' => (
          Icons.person_outline,
          bangla ? 'কর্মী' : 'STAFF',
          BrandColors.info,
        ),
        'notice' => (
          Icons.campaign_outlined,
          bangla ? 'নোটিশ' : 'NOTICE',
          BrandColors.crimson,
        ),
        'leave' => (
          Icons.beach_access_outlined,
          bangla ? 'ছুটি' : 'LEAVE',
          BrandColors.success,
        ),
        'claim' => (
          Icons.receipt_long_outlined,
          bangla ? 'বিল' : 'CLAIM',
          const Color(0xFF7C3AED),
        ),
        'incident' => (
          Icons.health_and_safety_outlined,
          bangla ? 'নিরাপত্তা' : 'SAFETY',
          BrandColors.danger,
        ),
        'asset' => (
          Icons.precision_manufacturing_outlined,
          bangla ? 'সম্পদ' : 'ASSET',
          const Color(0xFF0284C7),
        ),
        'parcel' => (
          Icons.inventory_2_outlined,
          bangla ? 'পার্সেল' : 'PARCEL',
          BrandColors.warning,
        ),
        'visit' => (
          Icons.badge_outlined,
          bangla ? 'অতিথি' : 'VISITOR',
          const Color(0xFF047857),
        ),
        'notesheet' => (
          Icons.description_outlined,
          bangla ? 'নোট-শিট' : 'NOTE-SHEET',
          BrandColors.crimson,
        ),
        'fleet' => (
          Icons.directions_car_outlined,
          bangla ? 'গাড়ি' : 'FLEET',
          const Color(0xFFD97706),
        ),
        'bus' => (
          Icons.directions_bus_outlined,
          bangla ? 'বাস' : 'SHUTTLE',
          BrandColors.info,
        ),
        'licence' => (
          Icons.verified_outlined,
          bangla ? 'লাইসেন্স' : 'PERMIT',
          BrandColors.danger,
        ),
        _ => (Icons.search, bangla ? 'রেকর্ড' : 'RECORD', BrandColors.slate900),
      };
}

class _ZeroStatePalette extends StatelessWidget {
  const _ZeroStatePalette({
    required this.bangla,
    required this.navKeys,
    required this.onGoRoute,
    required this.onQuickQuery,
  });

  final bool bangla;
  final Set<String> navKeys;
  final ValueChanged<String> onGoRoute;
  final ValueChanged<String> onQuickQuery;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final l10n = context.l10n;

    final quickActions = <({IconData icon, String label, String route})>[
      (
        icon: Icons.fingerprint,
        label: bangla ? 'উপস্থিতি পাঞ্চ করুন' : 'Punch Attendance',
        route: AppRoutes.attendance,
      ),
      if (navKeys.contains('claims'))
        (
          icon: Icons.add_card_outlined,
          label: bangla ? 'নতুন খরচের বিল' : 'New Expense Claim',
          route: AppRoutes.claimNew,
        ),
      if (navKeys.contains('fleet'))
        (
          icon: Icons.directions_car_outlined,
          label: bangla ? 'গাড়ি বুক করুন' : 'Book Company Car',
          route: AppRoutes.fleetNew,
        ),
      if (navKeys.contains('visitors'))
        (
          icon: Icons.person_add_alt_1_outlined,
          label: bangla ? 'অতিথি আমন্ত্রণ' : 'Invite Visitor Pass',
          route: AppRoutes.visitNew,
        ),
      if (navKeys.contains('incidents'))
        (
          icon: Icons.warning_amber_rounded,
          label: bangla ? 'নিরাপত্তা ঝুঁকি রিপোর্ট' : 'Report Safety Hazard',
          route: AppRoutes.incidentNew,
        ),
      if (navKeys.contains('note-sheets'))
        (
          icon: Icons.edit_document,
          label: bangla ? 'নতুন নোট-শিট' : 'Compose Note-Sheet',
          route: AppRoutes.noteSheetNew,
        ),
    ];

    final pinnedDossiers =
        <
          ({
            String code,
            String title,
            String subtitle,
            IconData icon,
            Color color,
            String route,
          })
        >[
          if (navKeys.contains('note-sheets'))
            (
              code: 'NS-2026-0041',
              title: bangla
                  ? 'বিটুমিন ভিডিইউ ভ্যাকুয়াম পাম্প ওভারহল'
                  : 'Bitumen VDU Vacuum Pump Overhaul',
              subtitle: bangla
                  ? '৳১৪.৮০ লক্ষ · ৩টি কোটেশন যাচাইকৃত · ই-স্বাক্ষর প্রস্তুত'
                  : 'BDT 14.80L · 3 Quotes Verified · Ready for E-Sign',
              icon: Icons.description_outlined,
              color: BrandColors.crimson,
              route: AppRoutes.noteSheets,
            ),
          if (navKeys.contains('incidents'))
            (
              code: 'INC-2026-0009',
              title: bangla
                  ? 'হট-বিটুমিন ভালভ ফ্ল্যাঞ্জ লিক (কেরানীগঞ্জ)'
                  : 'Hot-Bitumen Valve Flange Leak (Keraniganj)',
              subtitle: bangla
                  ? '৫-হোয়াইস ও ৬এম ফিশবোন আরসিএ · ফর্ম বি-১২'
                  : '5-Whys & 6M Fishbone RCA · Statutory Form B-12',
              icon: Icons.health_and_safety_outlined,
              color: BrandColors.danger,
              route: AppRoutes.incidents,
            ),
          if (navKeys.contains('assets'))
            (
              code: 'AST-PLT-001',
              title: bangla
                  ? 'ভ্যাকুয়াম ডিস্টিলেশন কলাম ও লোতো পারমিট'
                  : 'Vacuum Distillation Unit & LOTO Custody',
              subtitle: bangla
                  ? '৮-ধাপের জীবনচক্র · বিএসটিআই ক্যালিব্রেশন ও বিওএম'
                  : '8-Stage Lifecycle · BSTI Calibration & Spare BOM',
              icon: Icons.precision_manufacturing_outlined,
              color: BrandColors.info,
              route: AppRoutes.assets,
            ),
          if (navKeys.contains('compliance'))
            (
              code: 'DOE / DOEXP',
              title: bangla
                  ? 'সংবিধিবদ্ধ রিফাইনারি লাইসেন্স ও নবায়ন'
                  : 'Statutory Refinery Permits & Renewal Pipeline',
              subtitle: bangla
                  ? '২টি জরুরি নবায়ন · দৈনিক ঝুঁকি ৳১.২৫ কোটি'
                  : '2 Critical Renewals · BDT 1.25 Cr/day Exposure',
              icon: Icons.gavel_outlined,
              color: BrandColors.warning,
              route: AppRoutes.licences,
            ),
        ];

    final accessibleModules = [
      for (final m in builtModules)
        if (navKeys.contains(m.key)) m,
    ];

    return ListView(
      children: [
        // Instant Search Suggestion Chips
        Row(
          children: [
            Icon(Icons.bolt, size: 16, color: scheme.primary),
            const SizedBox(width: 4),
            Text(
              bangla ? 'দ্রুত অনুসন্ধান ট্যাগ' : 'Instant Search Tags',
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
        const SizedBox(height: Space.xs),
        Wrap(
          spacing: Space.xs,
          runSpacing: Space.xs,
          children: [
            for (final tag in const [
              'Bitumen',
              'EMP-1042',
              'BSTI',
              'VDU',
              'Dhaka Metro',
              'Laptop',
            ])
              ActionChip(
                visualDensity: VisualDensity.compact,
                avatar: const Icon(Icons.search, size: 14),
                label: Text(tag, style: const TextStyle(fontSize: 12)),
                onPressed: () => onQuickQuery(tag),
              ),
          ],
        ),
        const SizedBox(height: Space.lg),

        // 1. Role-Aware Quick Actions
        Text(
          bangla ? '১-ট্যাপ দ্রুত কার্যক্রম' : '1-Tap Quick Actions',
          style: theme.textTheme.labelMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: scheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: Space.xs),
        Wrap(
          spacing: Space.sm,
          runSpacing: Space.xs,
          children: [
            for (final act in quickActions)
              FilledButton.tonalIcon(
                onPressed: () => onGoRoute(act.route),
                icon: Icon(act.icon, size: 16),
                label: Text(act.label, style: const TextStyle(fontSize: 12)),
              ),
            OutlinedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                unawaited(showPersonaSwitcherSheet(context));
              },
              icon: const Icon(Icons.swap_horiz, size: 16),
              label: Text(
                bangla ? 'চরিত্র পরিবর্তন' : 'Switch Persona',
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),

        // 2. Pinned Flagship Dossiers
        if (pinnedDossiers.isNotEmpty) ...[
          const SizedBox(height: Space.lg),
          Text(
            bangla
                ? 'পিন করা গুরুত্বপূর্ণ ফাইল ও ডসিয়ার'
                : 'Pinned Flagship Dossiers',
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: Space.xs),
          for (final d in pinnedDossiers)
            Padding(
              padding: const EdgeInsets.only(bottom: Space.xs),
              child: Card(
                margin: EdgeInsets.zero,
                child: ListTile(
                  dense: true,
                  leading: CircleAvatar(
                    radius: 17,
                    backgroundColor: d.color.withValues(alpha: 0.14),
                    child: Icon(d.icon, size: 17, color: d.color),
                  ),
                  title: Text(
                    '${d.code} · ${d.title}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  subtitle: Text(
                    d.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () => onGoRoute(d.route),
                ),
              ),
            ),
        ],

        // 3. All Accessible Modules
        if (accessibleModules.isNotEmpty) ...[
          const SizedBox(height: Space.lg),
          Text(
            bangla ? 'সকল মডিউলে যান' : 'Jump to Module',
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: scheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: Space.xs),
          Wrap(
            spacing: Space.xs,
            runSpacing: Space.xs,
            children: [
              for (final m in accessibleModules)
                ActionChip(
                  avatar: Icon(m.icon, size: 15, color: scheme.primary),
                  label: Text(m.label(l10n)),
                  onPressed: () => onGoRoute(m.route),
                ),
            ],
          ),
        ],
      ],
    );
  }
}
