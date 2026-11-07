import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/parcels/data/parcel_repository.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_providers.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_ui.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// MOD-04: Inter-Site Mailroom & Confidential Pouches
/// Implements Personal vs Mailroom Desk switch, Pouch Manifest, RTO and Tamper filters.
class ParcelsScreen extends ConsumerStatefulWidget {
  const ParcelsScreen({super.key});

  @override
  ConsumerState<ParcelsScreen> createState() => _ParcelsScreenState();
}

class _ParcelsScreenState extends ConsumerState<ParcelsScreen> {
  // Scope: 'personal' vs 'mailroom'
  String _scope = 'personal';
  String _view = 'mine';
  String _query = '';
  bool _stuckOnly = false;
  String _statusFilter = 'ALL';
  String _directionFilter = 'ALL';
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.invalidate(parcelsProvider);
    await ref.read(
      parcelsProvider(_view, query: _query, stuckOnly: _stuckOnly).future,
    );
  }

  /// Exact tracking number typed or pasted: open it straight away.
  Future<void> _open(String text) async {
    final l10n = context.l10n;
    final no = text.trim().toUpperCase();
    if (!RegExp(r'^PKG-\d{4}-\d{4}$').hasMatch(no)) return;
    try {
      final p = await ref.read(parcelRepositoryProvider).byTracking(no);
      if (!mounted) return;
      unawaited(context.push(AppRoutes.parcelDetail(p.id)));
    } on ApiException {
      if (!mounted) return;
      AppToast.show(context, l10n.pcNotFound, tone: StatusTone.warning);
    }
  }

  void _showPouchManifestSheet(List<Parcel> parcels) {
    final bangla = context.isBangla;
    final inTransit = parcels
        .where((p) => p.status == 'IN_TRANSIT' || p.status == 'DISPATCHED')
        .toList();

    unawaited(
      showModalBottomSheet<void>(
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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.inventory_2, color: Colors.blue),
                  const SizedBox(width: Space.xs),
                  Expanded(
                    child: Text(
                      bangla
                          ? 'করিডোর পাউচ মেনিফেস্ট: POUCH-DHAKA-KER-01'
                          : 'Corridor Pouch Manifest: POUCH-DHAKA-KER-01',
                      style: Theme.of(ctx).textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'বারিধারা হেড অফিস ↔ কেরানীগঞ্জ রিফাইনারি দৈনিক শাটল রান'
                    : 'Baridhara HQ ↔ Keraniganj Refinery Plant Daily Shuttle Run',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const SizedBox(height: Space.md),

              // Telematics / Security Seals
              Container(
                padding: const EdgeInsets.all(Space.sm),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            bangla
                                ? 'শাটল ভ্যান: ঢাকা মেট্রো-চ-৫৩-৮৮২১'
                                : 'Shuttle Van: Dhaka Metro-Cha-53-8821',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: Space.xs),
                        const StatusPill(
                          label: 'SEALED & LOCKED',
                          tone: StatusTone.success,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            bangla
                                ? 'কুরিয়ার: রফিকুল ইসলাম (EMP-0821)'
                                : 'Courier: Md. Rafiqul Islam (EMP-0821)',
                            style: const TextStyle(fontSize: 11),
                          ),
                        ),
                        const SizedBox(width: Space.xs),
                        Text(
                          bangla
                              ? 'সিল নম্বর: SL-BOGCL-8842'
                              : 'Seal: SL-BOGCL-8842',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: Space.md),
              Text(
                bangla
                    ? 'পাউচের অভ্যন্তরীণ পার্সেল তালিকা (${inTransit.length} টি):'
                    : 'Pouches & Enclosures in this Bag (${inTransit.length}):',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: Space.xs),

              if (inTransit.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: Space.md),
                  child: Center(
                    child: Text(
                      bangla
                          ? 'কোন সক্রিয় পাউচ ট্রানজিটে নেই'
                          : 'No active pouches currently in transit.',
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ),
                )
              else
                for (final p in inTransit.take(4))
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      p.isConfidential ? Icons.lock : Icons.mail_outline,
                      color: p.isConfidential
                          ? Colors.amber.shade800
                          : Colors.blueGrey,
                    ),
                    title: Text(
                      '${p.trackingNo} · ${p.description ?? "Confidential Pouch"}',
                    ),
                    subtitle: Text('${p.sender.name} → ${p.recipient.name}'),
                    trailing: StatusPill(
                      label: p.status,
                      tone: StatusTone.info,
                    ),
                  ),

              const SizedBox(height: Space.md),
              PrimaryButton(
                label: bangla
                    ? 'গেটে সম্পূর্ণ পাউচ হস্তান্তর গ্রহণ করুন'
                    : 'Hand Over Entire Pouch at Destination Gate',
                icon: Icons.check_circle_outline,
                onPressed: () {
                  Haptics.heavy();
                  Navigator.pop(ctx);
                  AppToast.show(
                    context,
                    bangla
                        ? 'সম্পূর্ণ পাউচ (POUCH-DHAKA-KER-01) গন্তব্য গেটে গ্রহণ সম্পন্ন!'
                        : 'Entire Corridor Pouch Handed Over at Destination Gate!',
                    tone: StatusTone.success,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final session = ref.watch(sessionControllerProvider).value;
    final canCreate = session?.can('parcels:create') ?? false;

    final effectiveView = _scope == 'mailroom' ? 'all' : _view;
    final rows = ref.watch(
      parcelsProvider(effectiveView, query: _query, stuckOnly: _stuckOnly),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleParcels),
        actions: [
          IconButton(
            tooltip: bangla
                ? 'করিডোর পাউচ মেনিফেস্ট'
                : 'Corridor Pouch Manifest',
            icon: const Icon(Icons.workspaces_outlined, color: Colors.blue),
            onPressed: () {
              rows.whenData(_showPouchManifestSheet);
            },
          ),
          IconButton(
            tooltip: bangla ? 'রিফ্রেশ' : 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _refresh,
          ),
        ],
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.parcelNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.pcSend),
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
                color: Colors.blueGrey.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blueGrey.shade200),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.inventory_2_outlined,
                    color: Colors.blueGrey.shade800,
                    size: 20,
                  ),
                  const SizedBox(width: Space.xs),
                  Expanded(
                    child: Text(
                      bangla
                          ? 'হেড অফিস ও প্ল্যান্টের মধ্যে ৩টি গোপনীয় পাউচ ট্রানজিটে রয়েছে · ১টি পার্সেল ডেস্কে পিন হস্তান্তরের অপেক্ষায়।'
                          : '3 confidential pouches in transit between HQ & Plant · 1 parcel at desk awaiting 4-digit PIN handover.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.blueGrey.shade900,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Scope Switcher: Personal vs Mailroom Master Desk
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, 0),
            child: Row(
              children: [
                Expanded(
                  child: SegmentedButton<String>(
                    segments: [
                      ButtonSegment(
                        value: 'personal',
                        icon: const Icon(Icons.person_outline, size: 16),
                        label: Text(
                          bangla ? 'আমার পার্সেল' : 'My Parcels',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                      ButtonSegment(
                        value: 'mailroom',
                        icon: const Icon(
                          Icons.markunread_mailbox_outlined,
                          size: 16,
                        ),
                        label: Text(
                          bangla
                              ? 'মেইলরুম মাস্টার ডেস্ক'
                              : 'Mailroom Desk (All)',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                    selected: {_scope},
                    onSelectionChanged: (s) {
                      setState(() {
                        _scope = s.first;
                        if (_scope == 'mailroom') {
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
              onChanged: (v) {
                _debounce?.cancel();
                _debounce = Timer(const Duration(milliseconds: 300), () {
                  if (mounted) setState(() => _query = v.trim());
                });
              },
              onSubmitted: (v) => unawaited(_open(v)),
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: bangla
                    ? 'ট্র্যাকিং নং (PKG-...) বা প্রাপক খুঁজুন'
                    : l10n.pcSearchHint,
                prefixIcon: const Icon(Icons.search, size: 20),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
            ),
          ),

          // Primary Status & Category Filter Chips
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
                    label: Text(bangla ? 'সব পার্সেল' : 'All'),
                    selected: _statusFilter == 'ALL',
                    onSelected: (_) => setState(() => _statusFilter = 'ALL'),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    label: Text(bangla ? 'ট্রানজিটে (চলমান)' : 'In Transit'),
                    selected: _statusFilter == 'IN_TRANSIT',
                    onSelected: (_) =>
                        setState(() => _statusFilter = 'IN_TRANSIT'),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    label: Text(
                      bangla
                          ? 'হস্তান্তর প্রস্তুত (PIN)'
                          : 'Ready for Handover',
                    ),
                    selected: _statusFilter == 'READY_OTP',
                    onSelected: (_) =>
                        setState(() => _statusFilter = 'READY_OTP'),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    label: Text(bangla ? 'পৌঁছেছে (ডেলিভার্ড)' : 'Delivered'),
                    selected: _statusFilter == 'DELIVERED',
                    onSelected: (_) =>
                        setState(() => _statusFilter = 'DELIVERED'),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    label: Text(
                      bangla ? 'ফেরত প্রক্রিয়া (RTO)' : 'Returning (RTO)',
                    ),
                    selected: _statusFilter == 'RETURNING',
                    onSelected: (_) =>
                        setState(() => _statusFilter = 'RETURNING'),
                  ),
                  const SizedBox(width: Space.xs),
                  ChoiceChip(
                    label: Text(
                      bangla ? 'কোয়ারেন্টাইন (সিল ত্রুটি)' : 'Quarantined',
                    ),
                    selected: _statusFilter == 'QUARANTINED',
                    onSelected: (_) =>
                        setState(() => _statusFilter = 'QUARANTINED'),
                  ),
                ],
              ),
            ),
          ),

          // Corridor Direction Filter Chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.md),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  FilterChip(
                    avatar: const Icon(Icons.alt_route, size: 14),
                    label: Text(
                      bangla ? 'হেড অফিস → প্ল্যান্ট' : 'HQ → Keraniganj',
                      style: const TextStyle(fontSize: 11),
                    ),
                    selected: _directionFilter == 'HQ_TO_PLANT',
                    onSelected: (sel) => setState(
                      () => _directionFilter = sel ? 'HQ_TO_PLANT' : 'ALL',
                    ),
                  ),
                  const SizedBox(width: Space.xs),
                  FilterChip(
                    avatar: const Icon(Icons.alt_route, size: 14),
                    label: Text(
                      bangla ? 'প্ল্যান্ট → হেড অফিস' : 'Keraniganj → HQ',
                      style: const TextStyle(fontSize: 11),
                    ),
                    selected: _directionFilter == 'PLANT_TO_HQ',
                    onSelected: (sel) => setState(
                      () => _directionFilter = sel ? 'PLANT_TO_HQ' : 'ALL',
                    ),
                  ),
                  const SizedBox(width: Space.xs),
                  FilterChip(
                    avatar: const Icon(Icons.account_balance, size: 14),
                    label: Text(
                      bangla ? 'ব্যাংক / বহিঃসংস্থা' : 'External / Regulatory',
                      style: const TextStyle(fontSize: 11),
                    ),
                    selected: _directionFilter == 'EXTERNAL',
                    onSelected: (sel) => setState(
                      () => _directionFilter = sel ? 'EXTERNAL' : 'ALL',
                    ),
                  ),
                  const SizedBox(width: Space.xs),
                  FilterChip(
                    label: Text(
                      l10n.pcStuckOnly,
                      style: const TextStyle(fontSize: 11),
                    ),
                    selected: _stuckOnly,
                    onSelected: (v) => setState(() => _stuckOnly = v),
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
              error: (_, _) => ErrorState(onRetry: () => unawaited(_refresh())),
              data: (rawList) {
                // Apply filters
                final list = rawList.where((p) {
                  // Status filter
                  if (_statusFilter == 'IN_TRANSIT' &&
                      p.status != 'IN_TRANSIT' &&
                      p.status != 'DISPATCHED' &&
                      p.status != 'AT_GATE') {
                    return false;
                  }
                  if (_statusFilter == 'READY_OTP' &&
                      p.status != 'OUT_FOR_DELIVERY') {
                    return false;
                  }
                  if (_statusFilter == 'DELIVERED' && p.status != 'DELIVERED') {
                    return false;
                  }
                  if (_statusFilter == 'RETURNING' &&
                      !p.status.startsWith('RETURN')) {
                    return false;
                  }
                  if (_statusFilter == 'QUARANTINED' &&
                      p.status != 'QUARANTINED' &&
                      p.tamperStatus != 'FLAGGED') {
                    return false;
                  }

                  // Direction filter
                  if (_directionFilter == 'HQ_TO_PLANT' &&
                      (p.origin.id != 'site_hq' || p.dest.id != 'site_plant')) {
                    return false;
                  }
                  if (_directionFilter == 'PLANT_TO_HQ' &&
                      (p.origin.id != 'site_plant' || p.dest.id != 'site_hq')) {
                    return false;
                  }
                  if (_directionFilter == 'EXTERNAL' && p.intraSite) {
                    return false;
                  }

                  return true;
                }).toList();

                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.inventory_2_outlined,
                    title:
                        _query.isNotEmpty ||
                            _stuckOnly ||
                            _statusFilter != 'ALL'
                        ? l10n.pcEmptyFiltered
                        : l10n.pcEmpty,
                  );
                }

                final needMe = list.where(parcelNeedsMe).length;
                return RefreshIndicator(
                  onRefresh: _refresh,
                  child: ListView.separated(
                    padding: const EdgeInsets.only(bottom: 96),
                    itemCount: list.length + 1,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      if (i == 0) {
                        return Padding(
                          padding: const EdgeInsets.fromLTRB(
                            Space.lg,
                            Space.xs,
                            Space.lg,
                            Space.xs,
                          ),
                          child: Text(
                            needMe == 0
                                ? l10n.pcVerdictNone
                                : l10n.pcVerdictNeed(needMe),
                            style: theme.textTheme.titleSmall,
                          ),
                        );
                      }
                      return _Row(parcel: list[i - 1], bangla: bangla);
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

class _Row extends StatelessWidget {
  const _Row({required this.parcel, required this.bangla});

  final Parcel parcel;
  final bool bangla;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final p = parcel;
    final title = p.hidden || p.description == null
        ? l10n.pcConfidentialTitle
        : p.description!;
    return ListRow(
      leading: Icon(
        p.tamperStatus == 'FLAGGED'
            ? Icons.warning_amber_rounded
            : p.isConfidential
            ? Icons.lock_outline
            : Icons.inventory_2_outlined,
        color: p.tamperStatus == 'FLAGGED'
            ? Colors.red
            : p.isConfidential
            ? Colors.amber.shade800
            : null,
      ),
      title: title,
      subtitle: [
        [
          p.trackingNo,
          p.origin.label(bangla: bangla),
          p.dest.label(bangla: bangla),
        ].join(' → '),
        if (p.courier != null)
          '${bangla ? "বাহক" : "Courier"}: ${p.courier!.name}',
        parcelNextLine(l10n, p, bangla: bangla),
      ].join('\n'),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          StatusPill(
            label: parcelStatusLabel(l10n, p.status),
            tone: parcelStatusTone(p.status),
          ),
          if (p.tamperStatus == 'FLAGGED')
            const Padding(
              padding: EdgeInsets.only(top: Space.xs),
              child: StatusPill(
                label: 'SEAL TAMPERED',
                tone: StatusTone.danger,
              ),
            ),
          if (p.status.startsWith('RETURN'))
            const Padding(
              padding: EdgeInsets.only(top: Space.xs),
              child: StatusPill(label: 'RTO REVERSE', tone: StatusTone.warning),
            ),
          if (p.stuck)
            Padding(
              padding: const EdgeInsets.only(top: Space.xs),
              child: StatusPill(
                label: l10n.pcStuckPill(p.dwellHours),
                tone: StatusTone.danger,
              ),
            ),
        ],
      ),
      onTap: () => unawaited(context.push(AppRoutes.parcelDetail(p.id))),
    );
  }
}
