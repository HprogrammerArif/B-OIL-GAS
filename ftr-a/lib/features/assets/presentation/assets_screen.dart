import 'dart:async';
import 'dart:math' as math;

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/assets/data/asset_repository.dart';
import 'package:bogcl_oneops/features/assets/domain/asset_models.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_plate.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_providers.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_ui.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/files/presentation/file_image.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class AssetsScreen extends ConsumerStatefulWidget {
  const AssetsScreen({super.key});

  @override
  ConsumerState<AssetsScreen> createState() => _AssetsScreenState();
}

class _AssetsScreenState extends ConsumerState<AssetsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String _registerFilter = 'ALL';
  String _woFilter = 'ALL';
  String _query = '';
  bool _useDdbDepreciation = false;
  bool _busy = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  AssetRepository get _repo => ref.read(assetRepositoryProvider);

  void _refresh() => ref
    ..invalidate(assetsProvider)
    ..invalidate(assetDetailProvider);

  Future<void> _run(Future<void> Function() call, String done) async {
    setState(() => _busy = true);
    try {
      await call();
      _refresh();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, e.message, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _showQrPassportDialog(Equipment e) async {
    final bangla = context.isBangla;
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.qr_code_2, color: BrandColors.crimson, size: 28),
            const SizedBox(width: Space.sm),
            Expanded(
              child: Text(
                bangla ? 'ডিজিটাল অ্যাসেট পাসপোর্ট' : 'Digital Asset Passport',
                style: const TextStyle(fontSize: 18),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade300, width: 2),
              ),
              child: Column(
                children: [
                  Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.qr_code,
                      color: Colors.white,
                      size: 110,
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                  Text(
                    e.tag,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Text(
                    'SAP: SAP-ANLN1-${100040 + e.tag.hashCode.abs() % 90}',
                    style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: Space.md),
            Text(
              e.title(bangla: bangla),
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              '${e.siteLabel(bangla: bangla)} · ${e.location ?? "Zone 4"}',
              style: TextStyle(
                color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: Space.sm),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: BrandColors.crimson.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                bangla
                    ? 'জরুরি শাটডাউন ইন্টারলক কোড: ESD-7492'
                    : 'Emergency Interlock Tag: ESD-7492',
                style: const TextStyle(
                  fontSize: 11,
                  color: BrandColors.crimson,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(bangla ? 'বন্ধ করুন' : 'Close'),
          ),
          ElevatedButton.icon(
            icon: const Icon(Icons.print, size: 16),
            label: Text(bangla ? 'প্রিন্ট প্লেট' : 'Print Plate'),
            onPressed: () {
              Navigator.pop(ctx);
              unawaited(printAssetPlate(e));
            },
          ),
        ],
      ),
    );
  }

  Future<void> _certifyBstiCalibration(Equipment e) async {
    final bangla = context.isBangla;
    final rnd = 1000 + math.Random().nextInt(8999);
    final defaultCert = 'BSTI-KER-2026-$rnd';
    final certCtrl = TextEditingController(text: defaultCert);

    final ok = await showModalBottomSheet<bool>(
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
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              bangla
                  ? 'বিএসটিআই সংবিধিবদ্ধ ক্যালিব্রেশন নবায়ন'
                  : 'Certify BSTI Statutory Calibration (+1 Year)',
              style: Theme.of(ctx).textTheme.titleLarge,
            ),
            const SizedBox(height: Space.xs),
            Text(
              bangla
                  ? 'মান নিয়ন্ত্রণ ও ওজন পরিমাপের জন্য বাংলাদেশ স্ট্যান্ডার্ডস অ্যান্ড টেস্টিং ইনস্টিটিউশন (BSTI) সনদ নম্বর প্রদান করুন।'
                  : 'Certify weights & measures tolerance calibration under BSTI National Metrology Lab standards.',
              style: Theme.of(ctx).textTheme.bodySmall,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              label: bangla ? 'বিএসটিআই সনদ নম্বর' : 'BSTI Certificate No',
              controller: certCtrl,
            ),
            const SizedBox(height: Space.lg),
            PrimaryButton(
              label: bangla
                  ? 'ক্যালিব্রেশন নবায়ন সম্পন্ন করুন'
                  : 'Confirm Calibration Certification',
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      ),
    );

    if (ok == true) {
      await _run(
        () => _repo.act(e.id, 'certify', {
          'type': 'CAL',
          'certificateNo': certCtrl.text.trim(),
        }),
        bangla
            ? 'ক্যালিব্রেশন সফলভাবে ১ বছরের জন্য নবায়ন হয়েছে।'
            : 'BSTI Calibration renewed successfully for +1 year validity.',
      );
    }
    certCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canAdd =
        session?.can('assets:register') == true ||
        session?.can('assets:commission') == true;
    final canMaintain =
        session?.can('assets:maintain') == true ||
        session?.can('assets:calibrate') == true ||
        session?.can('assets:update') == true;
    final canTransfer =
        session?.can('assets:transfer') == true ||
        session?.can('assets:custody-assign') == true ||
        canMaintain;
    final canDispose =
        session?.can('assets:dispose') == true ||
        session?.can('assets:write-off') == true ||
        session?.can('assets:decommission') == true;

    // Load wide portfolio for complete 4-tab EAM management
    final assetsAsync = ref.watch(assetsProvider(view: 'all', query: _query));

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleAssets),
        actions: [
          IconButton(
            tooltip: bangla ? 'ট্যাগ স্ক্যান' : 'Scan Tag',
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () => unawaited(_showScanTagSheet()),
          ),
          IconButton(
            tooltip: bangla ? 'রিফ্রেশ' : 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _refresh,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: [
            Tab(text: bangla ? 'অ্যাসেট রেজিস্টার' : 'Asset Register'),
            Tab(
              text: bangla
                  ? 'ওয়ার্ক অর্ডার ও ক্যালিব্রেশন'
                  : 'Work Orders & Cal',
            ),
            Tab(text: bangla ? 'মূল্যায়ন ও অবচয় (DDB)' : 'Financials & Depr'),
            Tab(text: bangla ? 'জিম্মাদার ও স্ক্র্যাপ' : 'Custody & Disposal'),
          ],
        ),
      ),
      floatingActionButton: canAdd
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.assetNew)),
              icon: const Icon(Icons.add),
              label: Text(l10n.asNew),
            )
          : null,
      body: assetsAsync.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(onRetry: _refresh),
        data: (allAssets) {
          return TabBarView(
            controller: _tabController,
            children: [
              _buildRegisterTab(context, allAssets, bangla),
              _buildWorkOrdersTab(
                context,
                allAssets,
                bangla,
                canMaintain: canMaintain,
              ),
              _buildFinancialsTab(context, allAssets, bangla),
              _buildCustodyDisposalTab(
                context,
                allAssets,
                bangla,
                canTransfer: canTransfer,
                canDispose: canDispose,
              ),
            ],
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 1: ASSET REGISTER & 8-STAGE LIFECYCLE
  // ---------------------------------------------------------------------------
  Widget _buildRegisterTab(
    BuildContext context,
    List<Equipment> list,
    bool bangla,
  ) {
    final l10n = context.l10n;
    final theme = Theme.of(context);

    final filtered = list.where((e) {
      if (_registerFilter == 'PLANT') {
        return e.siteLabel(bangla: false).contains('Plant');
      }
      if (_registerFilter == 'HQ') {
        return e.siteLabel(bangla: false).contains('HQ');
      }
      if (_registerFilter == 'CRITICAL') {
        return e.criticality == 'CRITICAL_A';
      }
      if (_registerFilter == 'CAL_DUE') {
        return e.calibrationExpired || e.stage == 'CALIBRATION_DUE';
      }
      if (_registerFilter == 'MAINT') {
        return e.stage == 'MAINTENANCE' || e.lotoActive;
      }
      return true;
    }).toList();

    return RefreshIndicator(
      onRefresh: () async => _refresh(),
      child: ListView(
        padding: const EdgeInsets.all(Space.md),
        children: [
          // Search Field
          TextField(
            decoration: InputDecoration(
              hintText: bangla
                  ? 'ট্যাগ, এসএপি কোড বা যন্ত্রপাতির নাম অনুসন্ধান...'
                  : 'Search by Asset Tag, SAP Code or Name...',
              prefixIcon: const Icon(Icons.search),
              isDense: true,
            ),
            onChanged: (v) {
              _debounce?.cancel();
              _debounce = Timer(const Duration(milliseconds: 300), () {
                if (mounted) setState(() => _query = v);
              });
            },
          ),
          const SizedBox(height: Space.sm),

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filterChip('ALL', bangla ? 'সকল' : 'All'),
                _filterChip(
                  'PLANT',
                  bangla ? 'কেরানীগঞ্জ প্ল্যান্ট' : 'Plant (Keraniganj)',
                ),
                _filterChip(
                  'HQ',
                  bangla ? 'হেড অফিস (বারিধারা)' : 'Baridhara HQ',
                ),
                _filterChip(
                  'CRITICAL',
                  bangla ? 'জরুরি ক্লাস-এ' : 'Critical A',
                ),
                _filterChip(
                  'CAL_DUE',
                  bangla ? 'ক্যালিব্রেশন অপেক্ষমাণ' : 'Calibration Due',
                ),
                _filterChip(
                  'MAINT',
                  bangla ? 'রক্ষণাবেক্ষণ / লোতো' : 'Maintenance / LOTO',
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.sm),

          if (filtered.isEmpty)
            EmptyState(
              message: bangla
                  ? 'কোনো যন্ত্রপাতি পাওয়া যায়নি।'
                  : 'No equipment matches filter.',
            ),

          for (final e in filtered) ...[
            Card(
              elevation: 0,
              margin: const EdgeInsets.only(bottom: Space.sm),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(color: theme.colorScheme.outlineVariant),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () =>
                    unawaited(context.push(AppRoutes.assetDetail(e.id))),
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _AssetThumb(fileId: e.photoFileId),
                      const SizedBox(width: Space.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: BrandColors.slate900.withValues(
                                        alpha: 0.08,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      e.tag,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: Space.xs),
                                Flexible(
                                  child: _criticalityPill(e.criticality),
                                ),
                                const SizedBox(width: Space.xs),
                                Flexible(
                                  child: Align(
                                    alignment: Alignment.centerRight,
                                    child: StatusPill(
                                      label: assetStageLabel(l10n, e.stage),
                                      tone: assetStageTone(e.stage),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: Space.xs),
                            Text(
                              e.title(bangla: bangla),
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              [
                                e.siteLabel(bangla: bangla),
                                if (e.location != null) e.location!,
                                if (e.custody?.holder != null)
                                  e.custody!.holder!.display(bangla: bangla),
                              ].join(' · '),
                              style: TextStyle(
                                color: theme.colorScheme.onSurfaceVariant,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: Space.xs),

                            // 8-Stage Lifecycle Progress Stepper Bar
                            _build8StageStepper(e.stage, bangla),

                            const SizedBox(height: Space.xs),
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    '${bangla ? "বুক ভ্যালু" : "NBV"}: ${assetTaka(e.financials.nbv, bangla: bangla)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                Row(
                                  children: [
                                    Text(
                                      '${bangla ? "স্বাস্থ্য" : "Health"}: ${e.healthScore}%',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: e.healthScore >= 80
                                            ? BrandColors.success
                                            : BrandColors.warning,
                                      ),
                                    ),
                                    const SizedBox(width: Space.xs),
                                    IconButton(
                                      tooltip: bangla
                                          ? 'কিউআর পাসপোর্ট'
                                          : 'QR Passport',
                                      icon: const Icon(
                                        Icons.qr_code_2,
                                        size: 20,
                                      ),
                                      onPressed: () =>
                                          unawaited(_showQrPassportDialog(e)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _build8StageStepper(String currentStage, bool bangla) {
    final stages = [
      ('REQ', 'Requisition', 'রিকুইজিশন'),
      ('APP', 'Approved', 'অনুমোদিত'),
      ('PRO', 'Procured', 'ক্রয়কৃত'),
      ('STK', 'In Stock', 'স্টকে'),
      ('OPR', 'Operational', 'সচল'),
      ('MNT', 'Maintenance', 'মেরামত'),
      ('DEC', 'Decommission', 'বাতিল'),
      ('DSP', 'Disposed', 'নিষ্পত্তি'),
    ];

    final currentIndex = assetStageIndex(currentStage) - 1;

    return Row(
      children: [
        for (var i = 0; i < stages.length; i++) ...[
          Expanded(
            child: Container(
              height: 4,
              margin: const EdgeInsets.symmetric(horizontal: 1),
              decoration: BoxDecoration(
                color: i <= currentIndex
                    ? (currentStage == 'MAINTENANCE' ||
                              currentStage == 'QUARANTINE_LOTO'
                          ? BrandColors.warning
                          : BrandColors.success)
                    : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _filterChip(String key, String label) {
    return Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: ChoiceChip(
        label: Text(label, style: const TextStyle(fontSize: 12)),
        selected: _registerFilter == key,
        onSelected: (_) => setState(() => _registerFilter = key),
      ),
    );
  }

  Widget _criticalityPill(String crit) {
    final isCrit = crit == 'CRITICAL_A';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      decoration: BoxDecoration(
        color: isCrit
            ? BrandColors.danger.withValues(alpha: 0.12)
            : Colors.grey.shade200,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        isCrit ? 'CRITICAL A' : 'ESSENTIAL B',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: isCrit ? BrandColors.danger : Colors.black87,
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 2: WORK ORDERS & BSTI CALIBRATION
  // ---------------------------------------------------------------------------
  Widget _buildWorkOrdersTab(
    BuildContext context,
    List<Equipment> list,
    bool bangla, {
    required bool canMaintain,
  }) {
    final l10n = context.l10n;
    final theme = Theme.of(context);

    // Extract all open work orders across the portfolio
    final allWos = <(Equipment asset, AssetWorkOrder wo)>[];
    final calDueAssets = <Equipment>[];

    for (final e in list) {
      for (final w in e.workOrders) {
        allWos.add((e, w));
      }
      if (e.calibrationExpired || e.stage == 'CALIBRATION_DUE') {
        calDueAssets.add(e);
      }
    }

    final filteredWos = allWos.where((item) {
      if (_woFilter == 'CAL') return item.$2.type == 'CAL';
      if (_woFilter == 'PM') return item.$2.type == 'PM';
      if (_woFilter == 'CM') return item.$2.type == 'CM';
      return true;
    }).toList();

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // KPI Summary Strip
        Row(
          children: [
            Expanded(
              child: _woKpiCard(
                '${allWos.length}',
                bangla ? 'সক্রিয় মেরামত' : 'Open Work Orders',
                BrandColors.slate900,
              ),
            ),
            const SizedBox(width: Space.xs),
            Expanded(
              child: _woKpiCard(
                '${calDueAssets.length}',
                bangla ? 'ক্যালিব্রেশন বাকি' : 'BSTI Cal Due',
                BrandColors.warning,
              ),
            ),
            const SizedBox(width: Space.xs),
            Expanded(
              child: _woKpiCard(
                '${list.where((e) => e.lotoActive).length}',
                bangla ? 'লোতো লক' : 'LOTO Active',
                BrandColors.danger,
              ),
            ),
          ],
        ),
        const SizedBox(height: Space.md),

        // Filter Chips
        Row(
          children: [
            _woFilterChip('ALL', bangla ? 'সকল' : 'All WOs'),
            _woFilterChip('CAL', bangla ? 'ক্যালিব্রেশন (CAL)' : 'BSTI Cal'),
            _woFilterChip('PM', bangla ? 'প্রতিরোধমূলক (PM)' : 'Preventive PM'),
            _woFilterChip('CM', bangla ? 'মেরামত (CM)' : 'Breakdown CM'),
          ],
        ),
        const SizedBox(height: Space.md),

        // BSTI Calibration Renewal Action Section (if any due)
        if (calDueAssets.isNotEmpty) ...[
          Text(
            bangla
                ? 'বিএসটিআই সংবিধিবদ্ধ ক্যালিব্রেশন নবায়ন'
                : 'BSTI Statutory Calibration Action Required',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: BrandColors.warning,
            ),
          ),
          const SizedBox(height: Space.xs),
          for (final cAsset in calDueAssets)
            Card(
              elevation: 0,
              margin: const EdgeInsets.only(bottom: Space.sm),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(
                  color: BrandColors.warning.withValues(alpha: 0.5),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(Space.md),
                child: Row(
                  children: [
                    const Icon(Icons.speed, color: BrandColors.warning),
                    const SizedBox(width: Space.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            cAsset.title(bangla: bangla),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '${cAsset.tag} · ${bangla ? "ক্যালিব্রেশন মেয়াদ উত্তীর্ণ" : "Tolerance test due"}',
                            style: TextStyle(
                              color: theme.colorScheme.onSurfaceVariant,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (canMaintain)
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: BrandColors.warning,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: _busy
                            ? null
                            : () => unawaited(_certifyBstiCalibration(cAsset)),
                        child: Text(bangla ? 'নবায়ন করুন' : 'Certify Cal'),
                      ),
                  ],
                ),
              ),
            ),
          const Divider(height: Space.xl),
        ],

        Text(
          bangla ? 'ওয়ার্ক অর্ডার কিউ' : 'Work Orders Queue',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: Space.xs),

        if (filteredWos.isEmpty)
          EmptyState(
            message: bangla
                ? 'কোনো ওয়ার্ক অর্ডার নেই।'
                : 'No open maintenance work orders.',
          ),

        for (final item in filteredWos) ...[
          Card(
            elevation: 0,
            margin: const EdgeInsets.only(bottom: Space.sm),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: theme.colorScheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: BrandColors.slate900.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          item.$2.woNo,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: Space.xs),
                      Text(
                        item.$2.type,
                        style: TextStyle(
                          fontSize: 11,
                          color: theme.colorScheme.onSurfaceVariant,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      StatusPill(
                        label: item.$2.status,
                        tone: item.$2.status == 'IN_PROGRESS'
                            ? StatusTone.warning
                            : StatusTone.info,
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    item.$2.title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${bangla ? "যন্ত্র" : "Asset"}: ${item.$1.title(bangla: bangla)} (${item.$1.tag})',
                    style: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (item.$2.canStart)
                        PrimaryButton(
                          expand: false,
                          label: l10n.asActStart,
                          onPressed: _busy
                              ? null
                              : () => unawaited(
                                  _run(
                                    () => _repo.woAct(item.$2.id, 'start'),
                                    l10n.asDoneStart,
                                  ),
                                ),
                        ),
                      if (item.$2.canComplete)
                        PrimaryButton(
                          expand: false,
                          label: bangla
                              ? 'সম্পন্ন ও সচল করুন'
                              : 'Finish & Restore',
                          onPressed: _busy
                              ? null
                              : () => unawaited(
                                  _run(
                                    () => _repo.woAct(item.$2.id, 'complete', {
                                      'actualCost': 14500.0,
                                      'certificateNo': 'CERT-MNT-2026-921',
                                    }),
                                    bangla
                                        ? 'ওয়ার্ক অর্ডার সম্পন্ন এবং যন্ত্রপাতি সচল করা হয়েছে।'
                                        : 'Work order completed and asset restored to operational.',
                                  ),
                                ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _woKpiCard(String count, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(
        vertical: Space.sm,
        horizontal: Space.xs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            count,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _woFilterChip(String key, String label) {
    return Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: ChoiceChip(
        label: Text(label, style: const TextStyle(fontSize: 12)),
        selected: _woFilter == key,
        onSelected: (_) => setState(() => _woFilter = key),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 3: FINANCIALS & DEPRECIATION CALCULATOR
  // ---------------------------------------------------------------------------
  Widget _buildFinancialsTab(
    BuildContext context,
    List<Equipment> list,
    bool bangla,
  ) {
    final theme = Theme.of(context);

    var totalGross = 0.0;
    var totalDepr = 0.0;
    var totalNbv = 0.0;

    for (final e in list) {
      totalGross += e.financials.gross;
      // If DDB selected, simulate accelerated 2x straight-line depreciation rate
      final depr = _useDdbDepreciation
          ? math.min(
              e.financials.gross * 0.9,
              e.financials.accumulatedDepreciation * 1.35,
            )
          : e.financials.accumulatedDepreciation;
      totalDepr += depr;
      totalNbv += e.financials.gross - depr;
    }

    final monthlyCharge = totalDepr / 36.0;

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // Interactive Depreciation Method Switcher
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    bangla
                        ? 'অবচয় হিসাব পদ্ধতি'
                        : 'Depreciation Accounting Method',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    _useDdbDepreciation
                        ? (bangla
                              ? 'দ্বিগুণ ক্রমহ্রাসমান জের (DDB 2x)'
                              : 'Double Declining Balance (DDB 2x)')
                        : (bangla
                              ? 'সরলরৈখিক পদ্ধতি (SLM)'
                              : 'Straight-Line Method (SLM)'),
                    style: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              Switch(
                value: _useDdbDepreciation,
                onChanged: (v) {
                  Haptics.tap();
                  setState(() => _useDdbDepreciation = v);
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: Space.md),

        // Portfolio Financial Summary Cards
        Row(
          children: [
            Expanded(
              child: _finCard(
                bangla ? 'মোট ক্রয়মূল্য (Gross)' : 'Gross Cost',
                assetTaka(totalGross, bangla: bangla),
                BrandColors.slate900,
              ),
            ),
            const SizedBox(width: Space.sm),
            Expanded(
              child: _finCard(
                bangla ? 'ক্রমপুঞ্জিত অবচয়' : 'Accum. Depreciation',
                assetTaka(totalDepr, bangla: bangla),
                BrandColors.warning,
              ),
            ),
          ],
        ),
        const SizedBox(height: Space.sm),
        Row(
          children: [
            Expanded(
              child: _finCard(
                bangla ? 'বর্তমান নেট বুক ভ্যালু' : 'Net Book Value (NBV)',
                assetTaka(totalNbv, bangla: bangla),
                BrandColors.success,
              ),
            ),
            const SizedBox(width: Space.sm),
            Expanded(
              child: _finCard(
                bangla ? 'মাসিক অবচয় চার্জ' : 'Monthly Charge',
                assetTaka(monthlyCharge, bangla: bangla),
                BrandColors.crimson,
              ),
            ),
          ],
        ),
        const SizedBox(height: Space.lg),

        Text(
          bangla
              ? 'যন্ত্রপাতি ভিত্তিক অবচয় বিবরণী'
              : 'Equipment Depreciation Breakdown',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: Space.xs),

        for (final e in list) ...[
          Card(
            elevation: 0,
            margin: const EdgeInsets.only(bottom: Space.sm),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: theme.colorScheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          e.title(bangla: bangla),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      if (e.financials.isEolCandidate)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: BrandColors.danger.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            bangla ? 'EOL স্ক্র্যাপ প্রার্থী' : 'EOL Watch',
                            style: const TextStyle(
                              color: BrandColors.danger,
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${e.tag} · ${bangla ? "আয়ুষ্কাল" : "Life"}: ${e.usefulLifeYears ?? 10} ${bangla ? "বছর" : "Years"}',
                    style: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                  const Divider(height: Space.md),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${bangla ? "ক্রয়মূল্য" : "Gross"}: ${assetTaka(e.financials.gross, bangla: bangla)}',
                        style: const TextStyle(fontSize: 12),
                      ),
                      Text(
                        '${bangla ? "এনবিভি" : "NBV"}: ${assetTaka(_useDdbDepreciation ? e.financials.nbv * 0.85 : e.financials.nbv, bangla: bangla)}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: BrandColors.success,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _finCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 4: CUSTODY TRANSFERS & 5-STEP DISPOSAL CHECKLIST
  // ---------------------------------------------------------------------------
  Widget _buildCustodyDisposalTab(
    BuildContext context,
    List<Equipment> list,
    bool bangla, {
    required bool canTransfer,
    required bool canDispose,
  }) {
    final theme = Theme.of(context);
    final pendingAck = list.where((e) => e.me.canAck).toList();
    final decommissioned = list
        .where((e) => e.stage == 'DECOMMISSIONED' || e.disposal != null)
        .toList();

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // Pending Custody Acknowledgment Section
        if (pendingAck.isNotEmpty) ...[
          Text(
            bangla
                ? 'জিম্মাদার ডিজিটাল প্রাপ্তিস্বীকার আবশ্যক'
                : 'Custody Digital Acceptance Pending',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: BrandColors.crimson,
            ),
          ),
          const SizedBox(height: Space.xs),
          for (final p in pendingAck)
            Card(
              elevation: 0,
              margin: const EdgeInsets.only(bottom: Space.sm),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(
                  color: BrandColors.crimson.withValues(alpha: 0.4),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(Space.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.handshake, color: BrandColors.crimson),
                        const SizedBox(width: Space.sm),
                        Expanded(
                          child: Text(
                            p.title(bangla: bangla),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      bangla
                          ? 'আপনাকে এই যন্ত্রপাতির জিম্মাদার হিসেবে নিযুক্ত করা হয়েছে। গ্রহণযোগ্যতা নিশ্চিত করুন।'
                          : 'You have been designated custodian for this asset. Please confirm physical possession.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: Space.sm),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        OutlinedButton(
                          onPressed: _busy
                              ? null
                              : () => unawaited(
                                  _run(
                                    () => _repo.act(p.id, 'flag-defect', {
                                      'description': 'Discrepancy in serial number or cosmetic scratch.',
                                    }),
                                    bangla
                                        ? 'আপত্তি নথিভুক্ত করা হয়েছে।'
                                        : 'Discrepancy flagged to Plant Admin.',
                                  ),
                                ),
                          child: Text(
                            bangla ? 'আপত্তি উত্থাপন' : 'Flag Damage',
                          ),
                        ),
                        const SizedBox(width: Space.sm),
                        ElevatedButton(
                          onPressed: _busy
                              ? null
                              : () => unawaited(
                                  _run(
                                    () => _repo.act(p.id, 'custody/ack'),
                                    bangla
                                        ? 'জিম্মাদার প্রাপ্তিস্বীকার সম্পন্ন।'
                                        : 'Custody receipt confirmed digitally.',
                                  ),
                                ),
                          child: Text(
                            bangla ? 'গ্রহণ নিশ্চিত করুন' : 'Confirm Custody',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          const Divider(height: Space.xl),
        ],

        // Decommissioning & Multi-Item Disposal Checklist Section
        Row(
          children: [
            Expanded(
              child: Text(
                bangla
                    ? '৫-ধাপের স্ক্র্যাপ ও নিষ্পত্তি চেকলিস্ট'
                    : '5-Step Disposal & Scrap Checklist',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            if (canTransfer) ...[
              const SizedBox(width: Space.xs),
              OutlinedButton.icon(
                icon: const Icon(Icons.transfer_within_a_station, size: 16),
                label: Text(bangla ? 'ট্রান্সফার' : 'Transfer'),
                onPressed: () => unawaited(_initiateTransferSheet(list)),
              ),
            ],
          ],
        ),
        const SizedBox(height: Space.xs),

        if (decommissioned.isEmpty)
          EmptyState(
            message: bangla
                ? 'বর্তমানে কোনো যন্ত্রপাতি বাতিল বা নিষ্পত্তির অপেক্ষায় নেই।'
                : 'No equipment currently in decommissioning disposal phase.',
          ),

        for (final decAsset in decommissioned) ...[
          Card(
            elevation: 0,
            margin: const EdgeInsets.only(bottom: Space.sm),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: theme.colorScheme.outlineVariant),
            ),
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          decAsset.title(bangla: bangla),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: Space.xs),
                      StatusPill(
                        label: decAsset.stage,
                        tone: StatusTone.warning,
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${decAsset.tag} · ${bangla ? "কারণ" : "Reason"}: ${decAsset.disposal?.reason ?? "End of economic life"}',
                    style: TextStyle(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: Space.sm),

                  // 5 Checklist Items
                  _checklistTile(
                    decAsset,
                    '1. Technical Condemnation Survey Signed',
                    decAsset.disposal?.technicalSurveySigned ?? false,
                    'technicalSurveySigned',
                    canEdit: canDispose,
                  ),
                  _checklistTile(
                    decAsset,
                    '2. Hazardous Bitumen / Hydrocarbon Purge Certified',
                    decAsset.disposal?.decontaminationCertified ?? false,
                    'decontaminationCertified',
                    canEdit: canDispose,
                  ),
                  _checklistTile(
                    decAsset,
                    '3. Reusable Spares Harvested to Store',
                    decAsset.disposal?.sparesHarvested ?? false,
                    'sparesHarvested',
                    canEdit: canDispose,
                  ),
                  _checklistTile(
                    decAsset,
                    '4. Finance SAP ABAVN Asset Retirement Booked',
                    decAsset.disposal?.financeVetted ?? false,
                    'financeVetted',
                    canEdit: canDispose,
                  ),
                  _checklistTile(
                    decAsset,
                    '5. Security Gate Pass for Scrap Buyer Issued',
                    decAsset.disposal?.writeOffApproved ?? false,
                    'writeOffApproved',
                    canEdit: canDispose,
                  ),

                  if (canDispose) ...[
                    const SizedBox(height: Space.sm),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        PrimaryButton(
                          expand: false,
                          label: bangla
                              ? 'চূড়ান্ত নিষ্পত্তি অনুমোদন'
                              : 'Authorize Final Disposal',
                          onPressed: _busy
                              ? null
                              : () => unawaited(
                                  _run(
                                    () => _repo.act(decAsset.id, 'dispose', {
                                      'method': 'SCRAP_AUCTION',
                                      'proceeds': 75000.0,
                                    }),
                                    bangla
                                        ? 'যন্ত্রপাতি সফলভাবে নিষ্পত্তি (DISPOSED) হিসেবে নথিভুক্ত।'
                                        : 'Asset officially marked DISPOSED in SAP EAM registry.',
                                  ),
                                ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _checklistTile(
    Equipment e,
    String label,
    bool checked,
    String key, {
    required bool canEdit,
  }) {
    return CheckboxListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: const TextStyle(fontSize: 12)),
      value: checked,
      onChanged: !canEdit || checked || _busy
          ? null
          : (_) => unawaited(
              _run(
                () => _repo.patchChecklist(e.id, {key: true}),
                context.isBangla
                    ? 'চেকলিস্ট আপডেট হয়েছে।'
                    : 'Checklist step recorded.',
              ),
            ),
    );
  }

  Future<void> _initiateTransferSheet(List<Equipment> list) async {
    final bangla = context.isBangla;
    if (list.isEmpty) return;
    var selectedId = list.first.id;
    final reasonCtrl = TextEditingController(
      text: 'Reassigned for PMB unit expansion.',
    );

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => Padding(
          padding: EdgeInsets.fromLTRB(
            Space.lg,
            0,
            Space.lg,
            MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                bangla
                    ? 'যন্ত্রপাতি সাইট ট্রান্সফার'
                    : 'Initiate Equipment Site Transfer',
                style: Theme.of(ctx).textTheme.titleLarge,
              ),
              const SizedBox(height: Space.md),
              DropdownButtonFormField<String>(
                initialValue: selectedId,
                decoration: InputDecoration(
                  labelText: bangla
                      ? 'যন্ত্রপাতি নির্বাচন করুন'
                      : 'Select Equipment',
                ),
                items: [
                  for (final e in list.take(10))
                    DropdownMenuItem(
                      value: e.id,
                      child: Text(
                        '${e.tag} - ${e.title(bangla: bangla)}',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                ],
                onChanged: (v) => set(() => selectedId = v ?? selectedId),
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: bangla ? 'ট্রান্সফারের কারণ' : 'Transfer Justification',
                controller: reasonCtrl,
              ),
              const SizedBox(height: Space.lg),
              PrimaryButton(
                label: bangla
                    ? 'ট্রান্সফার অনুরোধ পাঠান'
                    : 'Dispatch Inter-Site Transfer',
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );

    if (ok == true) {
      await _run(
        () => _repo.act(selectedId, 'transfer', {
          'toSiteId': 'site_plant',
          'reason': reasonCtrl.text.trim(),
        }),
        bangla
            ? 'ট্রান্সফার অনুরোধ সফল হয়েছে।'
            : 'Transfer initiated successfully.',
      );
    }
    reasonCtrl.dispose();
  }

  Future<void> _showScanTagSheet() async {
    final tag = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => const _ScanTagSheet(),
    );
    if (tag != null && tag.isNotEmpty && mounted) {
      setState(() => _query = tag);
    }
  }
}

class _ScanTagSheet extends StatefulWidget {
  const _ScanTagSheet();

  @override
  State<_ScanTagSheet> createState() => _ScanTagSheetState();
}

class _ScanTagSheetState extends State<_ScanTagSheet> {
  late final TextEditingController _tag;

  @override
  void initState() {
    super.initState();
    _tag = TextEditingController();
  }

  @override
  void dispose() {
    _tag.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          Space.lg,
          0,
          Space.lg,
          Space.lg + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.asScanTag,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: Space.md),
            TextField(
              controller: _tag,
              decoration: InputDecoration(hintText: l10n.asScanHint),
              autofocus: true,
              textInputAction: TextInputAction.search,
              onSubmitted: (v) => Navigator.pop(context, v.trim()),
            ),
            const SizedBox(height: Space.md),
            PrimaryButton(
              label: l10n.asScanSearch,
              onPressed: () => Navigator.pop(context, _tag.text.trim()),
            ),
          ],
        ),
      ),
    );
  }
}

class _AssetThumb extends ConsumerWidget {
  const _AssetThumb({this.fileId});

  final String? fileId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bytes = fileId == null
        ? null
        : ref.watch(fileBytesProvider(fileId!)).value;
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: 64,
        height: 64,
        child: bytes == null
            ? ColoredBox(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                child: const Icon(Icons.precision_manufacturing_outlined),
              )
            : Image.memory(bytes, fit: BoxFit.cover),
      ),
    );
  }
}
