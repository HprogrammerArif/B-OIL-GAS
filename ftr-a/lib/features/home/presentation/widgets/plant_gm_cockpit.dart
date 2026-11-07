import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlantGmCockpit extends ConsumerStatefulWidget {
  const PlantGmCockpit({required this.dashboard, super.key});

  final Dashboard dashboard;

  @override
  ConsumerState<PlantGmCockpit> createState() => _PlantGmCockpitState();
}

class _PlantGmCockpitState extends ConsumerState<PlantGmCockpit> {
  int _tabIndex = 0;
  bool _batchReleased = false;

  void _openBatchReleaseSheet(BuildContext context) {
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
        ),
        builder: (_) => _BitumenBatchReleaseSheet(
          alreadyReleased: _batchReleased,
          onReleased: () {
            setState(() => _batchReleased = true);
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;

    final tabs = [
      if (bangla) 'রিফাইনারি উৎপাদন' else 'Refinery Output',
      if (bangla) 'নিরাপত্তা ও লোতো' else 'Safety & LOTO',
      if (bangla) 'শিফট হ্যান্ডওভার' else 'Shift Handover',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Primary Role Header CTA: Release Bitumen Batch
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.lg,
            vertical: Space.xs,
          ),
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: _batchReleased
                  ? Colors.teal
                  : Colors.amber.shade900,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: Space.md),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Corner.lg),
              ),
            ),
            icon: Icon(
              _batchReleased ? Icons.check_circle : Icons.verified,
              size: 20,
            ),
            label: Text(
              _batchReleased
                  ? (bangla
                        ? 'ব্যাচ B88 অনুমোদিত ও রিলিজড'
                        : 'Batch B88 Released (BDS 1238 Compliant)')
                  : (bangla
                        ? 'বিটুমিন ব্যাচ রিলিজ অনুমোদন করুন'
                        : 'Release Bitumen Batch (BOGCL-BIT-2026-B88)'),
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            onPressed: () {
              Haptics.tap();
              _openBatchReleaseSheet(context);
            },
          ),
        ),

        // Role Sub-Tabs
        Padding(
          padding: const EdgeInsets.fromLTRB(
            Space.lg,
            Space.sm,
            Space.lg,
            Space.xs,
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (var i = 0; i < tabs.length; i++) ...[
                  ChoiceChip(
                    label: Text(tabs[i]),
                    selected: _tabIndex == i,
                    onSelected: (_) {
                      Haptics.tap();
                      setState(() => _tabIndex = i);
                    },
                  ),
                  const SizedBox(width: Space.xs),
                ],
              ],
            ),
          ),
        ),

        // Sub-Tab Content
        switch (_tabIndex) {
          1 => _LotoPermitsTab(
            items:
                widget.dashboard.extras
                    .where((e) => e.kind == 'permits')
                    .firstOrNull
                    ?.items ??
                const [],
          ),
          2 => _HandoversTab(
            items:
                widget.dashboard.extras
                    .where((e) => e.kind == 'handovers')
                    .firstOrNull
                    ?.items ??
                const [],
          ),
          _ => _RefineryOutputTab(
            batchReleased: _batchReleased,
            onReleaseTap: () => _openBatchReleaseSheet(context),
          ),
        },
      ],
    );
  }
}

class _BitumenBatchReleaseSheet extends StatefulWidget {
  const _BitumenBatchReleaseSheet({
    required this.alreadyReleased,
    required this.onReleased,
  });

  final bool alreadyReleased;
  final VoidCallback onReleased;

  @override
  State<_BitumenBatchReleaseSheet> createState() =>
      _BitumenBatchReleaseSheetState();
}

class _BitumenBatchReleaseSheetState extends State<_BitumenBatchReleaseSheet> {
  bool _confirmed = false;
  bool _isReleasing = false;

  @override
  void initState() {
    super.initState();
    _confirmed = widget.alreadyReleased;
  }

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      builder: (context, scrollController) => ListView(
        controller: scrollController,
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(Space.sm),
                decoration: BoxDecoration(
                  color: Colors.amber.shade100,
                  borderRadius: BorderRadius.circular(Corner.md),
                ),
                child: Icon(
                  Icons.science,
                  color: Colors.amber.shade900,
                  size: 24,
                ),
              ),
              const SizedBox(width: Space.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bangla
                          ? 'বিটুমিন ব্যাচ বাণিজ্যিক ছাড়পত্র'
                          : 'Bitumen Batch Commercial Release',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'Batch: BOGCL-BIT-2026-B88 · Pen 60/70',
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
          const Divider(),

          // Metadata Card
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(Corner.lg),
            ),
            child: Column(
              children: [
                _row(
                  'Product Grade',
                  'Penetration Grade 60/70 (Bitumen Blowing Unit)',
                ),
                _row('Batch Volume', '450 Metric Tons (Tank TK-102)'),
                _row('Destination', 'RHD Dhaka-Sylhet 4-Lane Highway Depot'),
                _row('QC Certificate', '#QC-2026-884 (Issued 08:30 AM today)'),
              ],
            ),
          ),
          const SizedBox(height: Space.md),

          // BDS 1238:2020 Laboratory Standards Table
          Text(
            bangla
                ? 'বিডিএস ১২৩৮:২০২০ ল্যাব পরীক্ষার ফলাফল'
                : 'BDS 1238:2020 Laboratory Test Verification',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: Space.xs),
          Table(
            border: TableBorder.all(color: scheme.outlineVariant),
            children: [
              TableRow(
                decoration: BoxDecoration(color: scheme.surfaceContainerLow),
                children: const [
                  Padding(
                    padding: EdgeInsets.all(6),
                    child: Text(
                      'Parameter',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.all(6),
                    child: Text(
                      'Standard Spec',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.all(6),
                    child: Text(
                      'Actual Lab Test',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.all(6),
                    child: Text(
                      'Status',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
              _labRow('Penetration @ 25°C', '60 – 70 dmm', '64 dmm', 'PASS'),
              _labRow('Softening Point', '46 – 54 °C', '49.5 °C', 'PASS'),
              _labRow('Ductility @ 25°C', 'Min 100 cm', '> 100 cm', 'PASS'),
              _labRow('Flash Point (COC)', 'Min 230 °C', '268 °C', 'PASS'),
            ],
          ),
          const SizedBox(height: Space.lg),

          // Confirmation Checkbox
          CheckboxListTile(
            value: _confirmed,
            title: Text(
              bangla
                  ? 'আমি প্রত্যয়ন করছি যে বিটুমিন ব্যাচ B88 বিডিএস ১২৩৮:২০২০ মান সম্পূর্ণ পূরণ করে।'
                  : 'I confirm QC Certificate #QC-2026-884 meets BDS 1238:2020 standards and authorize commercial tanker dispatch.',
              style: const TextStyle(fontSize: 12),
            ),
            onChanged: widget.alreadyReleased
                ? null
                : (v) {
                    Haptics.tap();
                    setState(() => _confirmed = v ?? false);
                  },
          ),
          const SizedBox(height: Space.md),

          // Action Button
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.amber.shade900,
              padding: const EdgeInsets.symmetric(vertical: Space.md),
            ),
            icon: _isReleasing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.check_circle_outline),
            label: Text(
              widget.alreadyReleased
                  ? (bangla
                        ? 'ইতিমধ্যে অনুমোদিত'
                        : 'Already Authorized & Released')
                  : (bangla
                        ? 'বাণিজ্যিক ছাড়পত্র অনুমোদন করুন'
                        : 'Authorize Commercial Dispatch'),
            ),
            onPressed: (!_confirmed || widget.alreadyReleased || _isReleasing)
                ? null
                : () async {
                    Haptics.tap();
                    setState(() => _isReleasing = true);
                    await Future<void>.delayed(
                      const Duration(milliseconds: 600),
                    );
                    widget.onReleased();
                    if (context.mounted) {
                      Navigator.of(context).pop();
                      AppToast.show(
                        context,
                        bangla ? 'বিটুমিন ব্যাচ B88 সফলভাবে ছাড়পত্র পেয়েছে' : 'Batch B88 successfully authorized for commercial dispatch',
                        tone: StatusTone.success,
                      );
                    }
                  },
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: const TextStyle(fontSize: 11.5, color: Colors.black54),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  TableRow _labRow(String param, String spec, String actual, String result) {
    return TableRow(
      children: [
        Padding(
          padding: const EdgeInsets.all(6),
          child: Text(param, style: const TextStyle(fontSize: 11)),
        ),
        Padding(
          padding: const EdgeInsets.all(6),
          child: Text(spec, style: const TextStyle(fontSize: 11)),
        ),
        Padding(
          padding: const EdgeInsets.all(6),
          child: Text(
            actual,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(6),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              result,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.green.shade900,
                fontWeight: FontWeight.bold,
                fontSize: 10,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _RefineryOutputTab extends StatelessWidget {
  const _RefineryOutputTab({
    required this.batchReleased,
    required this.onReleaseTap,
  });

  final bool batchReleased;
  final VoidCallback onReleaseTap;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final units = [
      {
        'name': 'Crude Distillation Unit (CDU)',
        'rate': '96%',
        'val': 0.96,
        'color': Colors.blue,
      },
      {
        'name': 'Vacuum Distillation Unit (VDU)',
        'rate': '91%',
        'val': 0.91,
        'color': Colors.indigo,
      },
      {
        'name': 'Bitumen Blowing Unit (BBU)',
        'rate': '98%',
        'val': 0.98,
        'color': Colors.amber.shade900,
      },
      {
        'name': 'Polymer Modified Bitumen (PMB)',
        'rate': '88%',
        'val': 0.88,
        'color': Colors.teal,
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(Corner.lg),
              border: Border.all(
                color: scheme.outlineVariant.withValues(alpha: 0.6),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bangla
                      ? 'রিফাইনারি ইউনিটের দৈনিক আউটপুট'
                      : 'Daily Output vs Plant Target (1,500 MT/day)',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: Space.md),
                for (final u in units) ...[
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          u['name']?.toString() ?? '',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      Text(
                        u['rate']?.toString() ?? '',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(Corner.sm),
                    child: LinearProgressIndicator(
                      value: (u['val'] as num?)?.toDouble() ?? 0.0,
                      minHeight: 8,
                      backgroundColor: scheme.surfaceContainerHighest,
                      color: (u['color'] as Color?) ?? Colors.teal,
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LotoPermitsTab extends StatefulWidget {
  const _LotoPermitsTab({required this.items});

  final List<Map<String, Object?>> items;

  @override
  State<_LotoPermitsTab> createState() => _LotoPermitsTabState();
}

class _LotoPermitsTabState extends State<_LotoPermitsTab> {
  final Set<String> _restored = {};

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final permits = widget.items.isNotEmpty
        ? widget.items
        : [
            {
              'id': 'LOTO-01',
              'name': 'VDU Charge Pump P-204A',
              'body':
                  'Electrical breaker locked for mechanical seal maintenance',
              'status': 'LOCKED',
            },
            {
              'id': 'LOTO-02',
              'name': 'Bitumen Storage Tank TK-108 Heater',
              'body': 'Steam inlet valve blanked for internal coil inspection',
              'status': 'LOCKED',
            },
            {
              'id': 'LOTO-03',
              'name': 'Nitrogen Purge Line B',
              'body': 'Locked out for flange gasket replacement',
              'status': 'LOCKED',
            },
          ];

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      itemCount: permits.length,
      separatorBuilder: (_, _) => const SizedBox(height: Space.sm),
      itemBuilder: (context, index) {
        final p = permits[index];
        final id = p['id']?.toString() ?? 'LOTO-$index';
        final isLocked = !_restored.contains(id);

        return Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(Corner.lg),
            border: Border.all(
              color: isLocked ? Colors.red.shade300 : Colors.teal.shade300,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    isLocked ? Icons.lock : Icons.lock_open,
                    color: isLocked ? Colors.red : Colors.teal,
                    size: 20,
                  ),
                  const SizedBox(width: Space.xs),
                  Expanded(
                    child: Text(
                      id,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(width: Space.xs),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: isLocked
                          ? Colors.red.shade50
                          : Colors.teal.shade50,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      isLocked ? 'ISOLATION ACTIVE' : 'RESTORED TO SERVICE',
                      style: TextStyle(
                        color: isLocked
                            ? Colors.red.shade900
                            : Colors.teal.shade900,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.xs),
              Text(
                p['name']?.toString() ?? '',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                p['body']?.toString() ?? '',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: scheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: Space.sm),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                  ),
                  icon: Icon(
                    isLocked ? Icons.build_circle : Icons.lock,
                    size: 16,
                  ),
                  label: Text(
                    isLocked
                        ? (bangla
                              ? 'আইসোলেশন তুলে নিন'
                              : 'Verify & Restore to Service')
                        : (bangla
                              ? 'লক পুনরায় সক্রিয় করুন'
                              : 'Re-apply Lockout'),
                    style: const TextStyle(fontSize: 11),
                  ),
                  onPressed: () {
                    Haptics.tap();
                    setState(() {
                      if (isLocked) {
                        _restored.add(id);
                      } else {
                        _restored.remove(id);
                      }
                    });
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _HandoversTab extends StatelessWidget {
  const _HandoversTab({required this.items});

  final List<Map<String, Object?>> items;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    return Padding(
      padding: const EdgeInsets.all(Space.lg),
      child: Container(
        padding: const EdgeInsets.all(Space.md),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(Corner.lg),
          border: Border.all(color: Colors.black12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              bangla
                  ? 'বর্তমান শিফট হস্তান্তর লগ'
                  : 'Current Shift Handover Log',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: Space.sm),
            const Text(
              'Morning Shift (06:00 - 14:00) handed over to Evening Shift (14:00 - 22:00). All pressure relief valves checked normal. Tank TK-102 at 85% capacity.',
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
