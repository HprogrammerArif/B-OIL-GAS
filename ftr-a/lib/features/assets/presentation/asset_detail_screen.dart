import 'dart:async';
import 'dart:math' as math;

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/assets/data/asset_repository.dart';
import 'package:bogcl_oneops/features/assets/domain/asset_models.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_plate.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_providers.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_ui.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AssetDetailScreen extends ConsumerStatefulWidget {
  const AssetDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<AssetDetailScreen> createState() => _AssetDetailScreenState();
}

class _AssetDetailScreenState extends ConsumerState<AssetDetailScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  bool _busy = false;

  // Local state for interactive Spare Parts Bill of Materials (BOM)
  final List<Map<String, Object>> _bomSpares = [
    {
      'sku': 'SP-KER-SEAL-045',
      'name': 'Mechanical Seal Kit 45mm (Tungsten Carbide)',
      'nameBn': 'মেকানিক্যাল সিল কিট ৪৫ মিমি (টাংস্টেন কার্বাইড)',
      'inStock': 4,
      'minStock': 2,
      'unitCost': 38500.0,
    },
    {
      'sku': 'SP-KER-GSK-006',
      'name': 'High-Temp Viton Flange Gasket 6-inch ANSI 300#',
      'nameBn': 'উচ্চ-তাপমাত্রার ভাইটন ফ্ল্যাঞ্জ গ্যাসকেট ৬ ইঞ্চি',
      'inStock': 12,
      'minStock': 5,
      'unitCost': 4200.0,
    },
    {
      'sku': 'SP-KER-RTD-102',
      'name': 'PT100 RTD Temperature Sensor Probe 250°C',
      'nameBn': 'পিটি১০০ আরটিডি তাপমাত্রা সেন্সর প্রোব ২৫০°সে',
      'inStock': 3,
      'minStock': 2,
      'unitCost': 14800.0,
    },
    {
      'sku': 'SP-KER-FLT-020',
      'name': 'Heavy Bitumen Suction Strainer Mesh 20-Mesh',
      'nameBn': 'বিটুমিন সাকশন স্ট্রেইনার মেশ ২০-মেশ',
      'inStock': 6,
      'minStock': 3,
      'unitCost': 8500.0,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  AssetRepository get _repo => ref.read(assetRepositoryProvider);

  void _refresh() => ref
    ..invalidate(assetDetailProvider(widget.id))
    ..invalidate(assetsProvider);

  String _err(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'LOTO_ACTIVE' => l10n.asErrLoto,
      'LOTO_REQUIRED' => l10n.asErrLotoNeed,
      'CUSTODY_UNACKED' => l10n.asErrAck,
      'CHECKLIST_INCOMPLETE' => l10n.asErrList,
      'WRITE_OFF_NOT_APPROVED' => l10n.asErrWrite,
      'CALIBRATION_EXPIRED' => l10n.asErrCal,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : e.fieldErrors.values.firstOrNull ?? l10n.asErrFailed,
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

  Future<void> _showQrPassportPlate(Equipment e) async {
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
                bangla
                    ? 'ডিজিটাল ইকুইপমেন্ট পাসপোর্ট'
                    : 'Digital Equipment Passport Plate',
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
                border: Border.all(color: Colors.grey.shade400, width: 2),
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
            label: Text(
              bangla ? 'প্রিন্ট মেটালিক প্লেট' : 'Print Metallic Plate',
            ),
            onPressed: () {
              Navigator.pop(ctx);
              unawaited(printAssetPlate(e));
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
    final lang = bangla ? 'bn' : 'en';
    final async = ref.watch(assetDetailProvider(widget.id));

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleAssets),
        actions: [
          IconButton(
            tooltip: bangla ? 'কিউআর পাসপোর্ট' : 'QR Passport',
            icon: const Icon(Icons.qr_code_2),
            onPressed: () {
              final val = async.value;
              if (val != null) unawaited(_showQrPassportPlate(val));
            },
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
            Tab(text: bangla ? 'সারসংক্ষেপ ও কারিগরি' : 'Overview & Specs'),
            Tab(text: bangla ? 'জিম্মাদার ও লোতো নিরাপত্তা' : 'Custody & LOTO'),
            Tab(text: bangla ? 'খুচরা যন্ত্রাংশ (BOM)' : 'Spare Parts (BOM)'),
            Tab(text: bangla ? 'রক্ষণাবেক্ষণ ও ইতিহাস' : 'Maintenance & Audit'),
          ],
        ),
      ),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(assetDetailProvider(widget.id)),
        ),
        data: (e) {
          return TabBarView(
            controller: _tabController,
            children: [
              _buildOverviewTab(context, e, bangla, lang),
              _buildCustodyLotoTab(context, e, bangla),
              _buildSparePartsTab(context, e, bangla),
              _buildMaintenanceAuditTab(context, e, bangla),
            ],
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 1: OVERVIEW & TECHNICAL SPECS & FINANCIALS
  // ---------------------------------------------------------------------------
  Widget _buildOverviewTab(
    BuildContext context,
    Equipment e,
    bool bangla,
    String lang,
  ) {
    final l10n = context.l10n;
    final m = e.me;
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // Headline Card
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: BrandColors.slate900.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      e.tag,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(width: Space.xs),
                  _criticalityBadge(e.criticality),
                  const Spacer(),
                  StatusPill(
                    label: assetStageLabel(l10n, e.stage),
                    tone: assetStageTone(e.stage),
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
                assetNextLine(l10n, e, bangla: bangla),
                style: TextStyle(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: Space.md),

        // Technical Specs & Health Score Card
        Card(
          elevation: 0,
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
                        bangla
                            ? 'কারিগরি বিবরণ (Specifications)'
                            : 'Technical Specifications',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: Space.xs),
                    Row(
                      children: [
                        Text(
                          '${bangla ? "স্বাস্থ্য" : "Health"}: ${e.healthScore}%',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: e.healthScore >= 80
                                ? BrandColors.success
                                : BrandColors.warning,
                          ),
                        ),
                        const SizedBox(width: Space.xs),
                        SizedBox(
                          width: 48,
                          child: LinearProgressIndicator(
                            value: e.healthScore / 100.0,
                            backgroundColor: Colors.grey.shade300,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              e.healthScore >= 80
                                  ? BrandColors.success
                                  : BrandColors.warning,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const Divider(height: Space.lg),
                _specRow(
                  'OEM / Manufacturer',
                  e.oem ?? 'Sulzer Pumps AG (Switzerland)',
                ),
                _specRow('Serial Number', e.serialNo ?? 'SN-KER-2021-9941'),
                _specRow('Operating Site', e.siteLabel(bangla: bangla)),
                _specRow(
                  'Physical Location',
                  e.location ?? 'Tank Farm Pump Pit P-102',
                ),
                _specRow(
                  'Asset Class / Category',
                  e.category?.display(bangla: bangla) ?? e.assetClass,
                ),
                _specRow(
                  'Useful Life',
                  '${e.usefulLifeYears ?? 10} Years (${e.financials.remainingLifeYears.toStringAsFixed(1)} remaining)',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: Space.md),

        // Financials & Valuation Card
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(color: theme.colorScheme.outlineVariant),
          ),
          child: Padding(
            padding: const EdgeInsets.all(Space.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bangla
                      ? 'মূল্যায়ন ও আর্থিক বিবরণ (Financial Valuation)'
                      : 'Financial Valuation & Book Value',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Divider(height: Space.lg),
                Row(
                  children: [
                    Expanded(
                      child: _valCell(
                        bangla ? 'মূল ক্রয়মূল্য' : 'Gross Acquisition',
                        assetTaka(e.financials.gross, bangla: bangla),
                      ),
                    ),
                    Expanded(
                      child: _valCell(
                        bangla ? 'ক্রমপুঞ্জিত অবচয়' : 'Accum. Depreciation',
                        assetTaka(
                          e.financials.accumulatedDepreciation,
                          bangla: bangla,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.sm),
                Row(
                  children: [
                    Expanded(
                      child: _valCell(
                        bangla
                            ? 'বর্তমান নেট বুক ভ্যালু'
                            : 'Net Book Value (NBV)',
                        assetTaka(e.financials.nbv, bangla: bangla),
                        color: BrandColors.success,
                      ),
                    ),
                    Expanded(
                      child: _valCell(
                        bangla ? 'অবচয় পদ্ধতি' : 'Method',
                        e.depreciationMethod ?? 'SLM (Straight-Line)',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: Space.lg),

        // Action Buttons Row
        Wrap(
          spacing: Space.sm,
          runSpacing: Space.sm,
          children: [
            OutlinedButton.icon(
              icon: const Icon(Icons.qr_code_2),
              label: Text(bangla ? 'কিউআর প্লেট দেখুন' : 'View QR Plate'),
              onPressed: () => unawaited(_showQrPassportPlate(e)),
            ),
            if (m.canCommission)
              PrimaryButton(
                expand: false,
                label: l10n.asActCommission,
                onPressed: _busy
                    ? null
                    : () async {
                        final b = await _fields(
                          title: l10n.asActCommission,
                          fields: [
                            (
                              'location',
                              l10n.asFieldLocation,
                              1,
                              'Zone 4 Tank Farm',
                            ),
                          ],
                        );
                        if (b == null) return;
                        await _run(
                          () => _repo.act(e.id, 'commission', b),
                          l10n.asDoneCommission,
                        );
                      },
              ),
            if (m.canCertify)
              PrimaryButton.secondary(
                expand: false,
                label: bangla ? 'বিএসটিআই ক্যালিব্রেশন' : 'Certify BSTI Cal',
                onPressed: _busy
                    ? null
                    : () async {
                        final rnd = 1000 + math.Random().nextInt(8999);
                        await _run(
                          () => _repo.act(e.id, 'certify', {
                            'type': 'CAL',
                            'certificateNo': 'BSTI-KER-2026-$rnd',
                          }),
                          l10n.asDoneCertify,
                        );
                      },
              ),
            if (m.canDecommission)
              PrimaryButton.secondary(
                expand: false,
                label: l10n.asActRetire,
                onPressed: _busy
                    ? null
                    : () async {
                        final b = await _fields(
                          title: l10n.asActRetire,
                          fields: [
                            (
                              'reason',
                              l10n.asFieldReason,
                              1,
                              'End of economic operational life.',
                            ),
                            (
                              'surveyNotes',
                              l10n.asFieldSurvey,
                              3,
                              'Pump impeller pitted, shaft run-out exceeds 0.25mm tolerance.',
                            ),
                          ],
                        );
                        if (b == null) return;
                        await _run(
                          () => _repo.act(e.id, 'decommission', b),
                          l10n.asDoneRetire,
                        );
                      },
              ),
            if (m.canWriteOff)
              PrimaryButton(
                expand: false,
                label: l10n.asActWriteOff,
                onPressed: _busy
                    ? null
                    : () => unawaited(
                        _run(
                          () => _repo.act(e.id, 'write-off'),
                          l10n.asDoneWriteOff,
                        ),
                      ),
              ),
            if (m.canDispose)
              PrimaryButton(
                expand: false,
                label: l10n.asActDispose,
                onPressed: _busy
                    ? null
                    : () => unawaited(
                        _run(
                          () => _repo.act(e.id, 'dispose', {
                            'method': 'SCRAP_RECYCLING',
                            'proceeds': 65000.0,
                          }),
                          l10n.asDoneDispose,
                        ),
                      ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _specRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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

  Widget _valCell(String label, String value, {Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _criticalityBadge(String crit) {
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
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: isCrit ? BrandColors.danger : Colors.black87,
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 2: CUSTODY TRANSFERS & LOTO SAFETY CONTROLS
  // ---------------------------------------------------------------------------
  Widget _buildCustodyLotoTab(BuildContext context, Equipment e, bool bangla) {
    final l10n = context.l10n;
    final m = e.me;
    final theme = Theme.of(context);
    final holder =
        e.custody?.holder?.display(bangla: bangla) ??
        (bangla ? 'অনির্দিষ্ট' : 'Unassigned');

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // Custody Possession Card
        Card(
          elevation: 0,
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
                    const Icon(Icons.person_pin, color: BrandColors.slate900),
                    const SizedBox(width: Space.sm),
                    Expanded(
                      child: Text(
                        bangla
                            ? 'বর্তমান জিম্মাদার (Current Custodian)'
                            : 'Current Asset Custodian',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    StatusPill(
                      label: e.custody?.acknowledged == true
                          ? (bangla ? 'প্রাপ্তিস্বীকৃত' : 'Acknowledged')
                          : (bangla ? 'অপেক্ষমাণ' : 'Pending Ack'),
                      tone: e.custody?.acknowledged == true
                          ? StatusTone.success
                          : StatusTone.warning,
                    ),
                  ],
                ),
                const SizedBox(height: Space.sm),
                Text(
                  '${bangla ? "কর্মকর্তা" : "Designated Officer"}: $holder',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${bangla ? "সাইট" : "Site"}: ${e.siteLabel(bangla: bangla)} · ${e.location ?? "Zone 4"}',
                  style: TextStyle(
                    fontSize: 12,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                if (m.canAck) ...[
                  const Divider(height: Space.lg),
                  Container(
                    padding: const EdgeInsets.all(Space.sm),
                    decoration: BoxDecoration(
                      color: BrandColors.crimson.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          color: BrandColors.crimson,
                          size: 20,
                        ),
                        const SizedBox(width: Space.xs),
                        Expanded(
                          child: Text(
                            bangla
                                ? 'আপনার কাছে শারীরিক হস্তান্তর নিশ্চিত করা প্রয়োজন।'
                                : 'You are named custodian. Digital receipt required.',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
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
                                  () => _repo.act(e.id, 'flag-defect', {
                                    'description': 'Discrepancy noted during handover inspection.',
                                  }),
                                  l10n.asDoneFlag,
                                ),
                              ),
                        child: Text(l10n.asActFlag),
                      ),
                      const SizedBox(width: Space.sm),
                      ElevatedButton(
                        onPressed: _busy
                            ? null
                            : () => unawaited(
                                _run(
                                  () => _repo.act(e.id, 'custody/ack'),
                                  l10n.asDoneAck,
                                ),
                              ),
                        child: Text(l10n.asActAck),
                      ),
                    ],
                  ),
                ],
                if (m.canAssign) ...[
                  const SizedBox(height: Space.md),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.person_add, size: 16),
                    label: Text(l10n.asActAssign),
                    onPressed: _busy
                        ? null
                        : () async {
                            final pick = await showPersonPicker(
                              context,
                              title: l10n.asFieldHolder,
                            );
                            if (pick == null) return;
                            await _run(
                              () => _repo.act(e.id, 'custody', {
                                'employeeUserId': pick.person.userId,
                              }),
                              l10n.asDoneAssign,
                            );
                          },
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: Space.md),

        // LOTO (Lockout / Tagout) Safety Isolation Card
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(
              color: e.lotoActive
                  ? BrandColors.danger
                  : theme.colorScheme.outlineVariant,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(Space.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      e.lotoActive ? Icons.lock : Icons.lock_open,
                      color: e.lotoActive
                          ? BrandColors.danger
                          : BrandColors.success,
                    ),
                    const SizedBox(width: Space.sm),
                    Expanded(
                      child: Text(
                        bangla
                            ? 'লোতো নিরাপত্তা আইসোলেশন (LOTO Quarantine)'
                            : 'LOTO Safety Quarantine & Electrical Isolation',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    StatusPill(
                      label: e.lotoActive ? 'LOTO ACTIVE' : 'UNLOCKED',
                      tone: e.lotoActive
                          ? StatusTone.danger
                          : StatusTone.success,
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(
                  e.lotoActive
                      ? (bangla
                            ? 'যন্ত্রপাতি বর্তমানে তালাবদ্ধ ও বিদ্যুৎ বিচ্ছিন্ন। পারমিট: ${e.lotoPermitNo ?? "LOTO-KER-4481"}'
                            : 'Electrical breakers locked and padlocked. Permit No: ${e.lotoPermitNo ?? "LOTO-KER-4481"}')
                      : (bangla
                            ? 'যন্ত্রপাতি নিরাপদ অবস্থায় সচল। কোনো সক্রিয় লোতো নিষেধাজ্ঞা নেই।'
                            : 'Equipment is physically unlocked and operational. No active lockout.'),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: Space.md),
                if (m.canLoto && !e.lotoActive)
                  PrimaryButton(
                    expand: false,
                    label: bangla
                        ? '🔒 লোতো নিরাপত্তা লক প্রয়োগ করুন'
                        : '🔒 Apply LOTO Safety Lock',
                    onPressed: _busy
                        ? null
                        : () async {
                            final b = await _fields(
                              title: l10n.asActLotoOn,
                              fields: [
                                (
                                  'permitNo',
                                  l10n.asFieldPermit,
                                  1,
                                  'LOTO-KER-2026-904',
                                ),
                              ],
                            );
                            if (b == null) return;
                            await _run(
                              () => _repo.act(e.id, 'loto', {
                                'action': 'APPLY',
                                ...b,
                              }),
                              l10n.asDoneLotoOn,
                            );
                          },
                  ),
                if (m.canLoto && e.lotoActive)
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: BrandColors.success,
                      foregroundColor: Colors.white,
                    ),
                    icon: const Icon(Icons.lock_open, size: 16),
                    label: Text(
                      bangla ? '🔓 লোতো লক মুক্ত করুন' : '🔓 Release LOTO Lock',
                    ),
                    onPressed: _busy
                        ? null
                        : () => unawaited(
                            _run(
                              () => _repo.act(e.id, 'loto', {
                                'action': 'RELEASE',
                              }),
                              l10n.asDoneLotoOff,
                            ),
                          ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // TAB 3: SPARE PARTS BILL OF MATERIALS (BOM)
  // ---------------------------------------------------------------------------
  Widget _buildSparePartsTab(BuildContext context, Equipment e, bool bangla) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // BOM Header Card
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.settings_suggest,
                color: BrandColors.crimson,
                size: 28,
              ),
              const SizedBox(width: Space.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bangla
                          ? 'খুচরা যন্ত্রাংশের তালিকা (BOM)'
                          : 'Spare Parts Bill of Materials (BOM)',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      bangla
                          ? 'এই যন্ত্রপাতির সাথে সংযুক্ত ৪টি গুরুত্বপূর্ণ খুচরা পার্টস ও গুদাম স্টক।'
                          : '4 critical maintenance spare parts mapped to this asset in warehouse.',
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
        ),
        const SizedBox(height: Space.md),

        for (final spare in _bomSpares) ...[
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
                          spare['sku']! as String,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${bangla ? "একক মূল্য" : "Unit"}: ৳${(spare["unitCost"]! as double).toStringAsFixed(0)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    bangla
                        ? (spare['nameBn']! as String)
                        : (spare['name']! as String),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '${bangla ? "স্টকে আছে" : "In Stock"}: ${spare["inStock"]} ${bangla ? "টি" : "units"}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color:
                              (spare['inStock']! as int) <=
                                  (spare['minStock']! as int)
                              ? BrandColors.danger
                              : BrandColors.success,
                        ),
                      ),
                      const SizedBox(width: Space.md),
                      Text(
                        '${bangla ? "রিঅর্ডার লেভেল" : "Min Reorder"}: ${spare["minStock"]} ${bangla ? "টি" : "units"}',
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton.icon(
                        icon: const Icon(Icons.remove, size: 14),
                        label: Text(bangla ? '-১ ব্যবহার' : '-1 Consume'),
                        onPressed: (spare['inStock']! as int) <= 0
                            ? null
                            : () {
                                Haptics.tap();
                                setState(() {
                                  spare['inStock'] =
                                      (spare['inStock']! as int) - 1;
                                });
                                AppToast.show(
                                  context,
                                  bangla
                                      ? '১টি পার্টস ওয়ার্ক অর্ডারে ব্যবহার নথিভুক্ত হয়েছে।'
                                      : '1 unit consumed for maintenance work order.',
                                  tone: StatusTone.success,
                                );
                              },
                      ),
                      const SizedBox(width: Space.sm),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add, size: 14),
                        label: Text(bangla ? '+৫ রিস্টক' : '+5 Restock'),
                        onPressed: () {
                          Haptics.tap();
                          setState(() {
                            spare['inStock'] = (spare['inStock']! as int) + 5;
                          });
                          AppToast.show(
                            context,
                            bangla ? '৫টি পার্টস গুদামে যোগ হয়েছে।' : '5 units restocked to Keraniganj store inventory.',
                            tone: StatusTone.success,
                          );
                        },
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

  // ---------------------------------------------------------------------------
  // TAB 4: MAINTENANCE WORK ORDERS & AUDIT TIMELINE
  // ---------------------------------------------------------------------------
  Widget _buildMaintenanceAuditTab(
    BuildContext context,
    Equipment e,
    bool bangla,
  ) {
    final l10n = context.l10n;
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(Space.md),
      children: [
        // Work Orders for this asset
        Text(
          bangla ? 'সক্রিয় ওয়ার্ক অর্ডার' : 'Active Work Orders',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: Space.xs),

        if (e.workOrders.isEmpty)
          EmptyState(
            message: bangla
                ? 'বর্তমানে কোনো ওপেন ওয়ার্ক অর্ডার নেই।'
                : 'No open work orders for this equipment.',
          ),

        for (final w in e.workOrders) ...[
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
                          w.woNo,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: Space.xs),
                      Text(
                        w.type,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      StatusPill(
                        label: w.status,
                        tone: w.status == 'IN_PROGRESS'
                            ? StatusTone.warning
                            : StatusTone.info,
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.xs),
                  Text(
                    w.title,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: Space.sm),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (w.canStart)
                        PrimaryButton(
                          expand: false,
                          label: l10n.asActStart,
                          onPressed: _busy
                              ? null
                              : () => unawaited(
                                  _run(
                                    () => _repo.woAct(w.id, 'start'),
                                    l10n.asDoneStart,
                                  ),
                                ),
                        ),
                      if (w.canComplete)
                        PrimaryButton(
                          expand: false,
                          label: bangla ? 'সম্পন্ন করুন' : 'Finish & Restore',
                          onPressed: _busy
                              ? null
                              : () async {
                                  final b = await _fields(
                                    title: l10n.asActFinish,
                                    fields: [
                                      (
                                        'actualCost',
                                        l10n.asFieldCost,
                                        1,
                                        '18500',
                                      ),
                                      (
                                        'certificateNo',
                                        l10n.asFieldCert,
                                        1,
                                        'MNT-CERT-904',
                                      ),
                                    ],
                                  );
                                  if (b == null) return;
                                  await _run(
                                    () => _repo.woAct(w.id, 'complete', {
                                      'actualCost':
                                          double.tryParse(
                                            '${b['actualCost']}',
                                          ) ??
                                          0,
                                      'certificateNo': b['certificateNo'],
                                    }),
                                    l10n.asDoneFinish,
                                  );
                                },
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],

        const Divider(height: Space.xl),

        // Chronological Audit Timeline
        Text(
          bangla
              ? 'জীবনচক্র ও অডিট ইতিহাস'
              : 'Lifecycle & Audit History Timeline',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: Space.sm),

        _timelineItem(
          Icons.verified,
          bangla
              ? 'বিএসটিআই বার্ষিক ক্যালিব্রেশন সম্পন্ন'
              : 'Annual BSTI Calibration Certified',
          'Certificate: BSTI-KER-2025-8812 · Tolerance accuracy 99.8%',
          '14 Oct 2025',
          BrandColors.success,
        ),
        _timelineItem(
          Icons.build,
          bangla
              ? 'পর্যায়ক্রমিক পিএম মেরামত সম্পন্ন'
              : 'Quarterly Preventive Overhaul Completed',
          'Replaced seal gasket and synthetic grease lube flush.',
          '18 Jul 2025',
          BrandColors.slate900,
        ),
        _timelineItem(
          Icons.check_circle_outline,
          bangla ? 'কমিশনিং ও সাইট স্থাপন' : 'Commissioned at Keraniganj Plant',
          'Signed off by Plant GM & Chief Mechanical Engineer.',
          DateFmt.dateTime(e.createdAt, bangla ? 'bn' : 'en'),
          BrandColors.success,
        ),
      ],
    );
  }

  Widget _timelineItem(
    IconData icon,
    String title,
    String desc,
    String date,
    Color color,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: color.withValues(alpha: 0.12),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: Space.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      date,
                      style: TextStyle(
                        fontSize: 11,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
