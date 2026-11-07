import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HrTransportCockpit extends StatefulWidget {
  const HrTransportCockpit({
    required this.dashboard,
    required this.isTransport,
    super.key,
  });

  final Dashboard dashboard;
  final bool isTransport;

  @override
  State<HrTransportCockpit> createState() => _HrTransportCockpitState();
}

class _HrTransportCockpitState extends State<HrTransportCockpit> {
  int _tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;

    final tabs = widget.isTransport
        ? [
            if (bangla) 'ডিসপ্যাচ কিউ' else 'Dispatch Queue',
            if (bangla) 'করিডোর ট্রিপস' else 'Live Corridor Trips',
          ]
        : [
            if (bangla) 'ছাড়পত্র অগ্রগতি' else 'Exit Clearances',
            if (bangla) 'সাইট ও জনবল' else 'Sites & Headcount',
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Sub-Tab Switcher
        Padding(
          padding: const EdgeInsets.fromLTRB(
            Space.lg,
            Space.xs,
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
        if (widget.isTransport) ...[
          if (_tabIndex == 0)
            _TransportDispatchTab()
          else
            _TransportCorridorTab(),
        ] else ...[
          if (_tabIndex == 0)
            _HrExitClearanceTab(
              items:
                  widget.dashboard.extras
                      .where((e) => e.kind == 'exits')
                      .firstOrNull
                      ?.items ??
                  const [],
            )
          else
            _HrSitesHeadcountTab(
              items:
                  widget.dashboard.extras
                      .where((e) => e.kind == 'sites')
                      .firstOrNull
                      ?.items ??
                  const [],
            ),
        ],
      ],
    );
  }
}

class _HrExitClearanceTab extends StatelessWidget {
  const _HrExitClearanceTab({required this.items});

  final List<Map<String, Object?>> items;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final clearances = items.isNotEmpty
        ? items
        : [
            {
              'name': 'Kazi Tariqul Islam',
              'employeeId': 'EMP-0512',
              'pending': 2,
              'cleared': 5,
              'total': 7,
              'lastDay': '15 Nov 2026',
            },
            {
              'name': 'Shamima Nasrin',
              'employeeId': 'EMP-0644',
              'pending': 1,
              'cleared': 6,
              'total': 7,
              'lastDay': '20 Nov 2026',
            },
          ];

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      itemCount: clearances.length,
      separatorBuilder: (_, _) => const SizedBox(height: Space.sm),
      itemBuilder: (context, index) {
        final c = clearances[index];
        final name = c['name']?.toString() ?? 'Exiting Employee';
        final empId = c['employeeId']?.toString() ?? '';
        final cleared = (c['cleared'] as num?)?.toInt() ?? 5;
        final total = (c['total'] as num?)?.toInt() ?? 7;

        return Container(
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
              Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: Colors.blueGrey,
                    child: Text(
                      name.isNotEmpty ? name[0] : 'E',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '$empId · Last day: ${c['lastDay'] ?? 'Nov 2026'}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(Corner.sm),
                    ),
                    child: Text(
                      '$cleared/$total Desks',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange.shade900,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.sm),
              ClipRRect(
                borderRadius: BorderRadius.circular(Corner.sm),
                child: LinearProgressIndicator(
                  value: cleared / total,
                  minHeight: 6,
                  color: Colors.teal,
                  backgroundColor: scheme.surfaceContainerHighest,
                ),
              ),
              const SizedBox(height: Space.xs),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  style: TextButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                  ),
                  icon: const Icon(Icons.fact_check, size: 16),
                  label: Text(
                    bangla
                        ? '৭-দপ্তরের ছাড়পত্র পরিচালনা'
                        : 'Manage 7-Desk Clearance',
                  ),
                  onPressed: () => context.push(AppRoutes.people),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _HrSitesHeadcountTab extends StatelessWidget {
  const _HrSitesHeadcountTab({required this.items});

  final List<Map<String, Object?>> items;

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final sites = [
      {
        'name': 'Head Office, Baridhara',
        'headcount': 184,
        'onDuty': 176,
        'onLeave': 8,
        'outsideGeofence': 3,
      },
      {
        'name': 'Keraniganj Refinery Plant',
        'headcount': 228,
        'onDuty': 219,
        'onLeave': 9,
        'outsideGeofence': 0,
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
          for (final s in sites) ...[
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
                  Row(
                    children: [
                      Icon(
                        s['name'].toString().contains('Plant')
                            ? Icons.factory
                            : Icons.corporate_fare,
                        color: scheme.primary,
                        size: 20,
                      ),
                      const SizedBox(width: Space.xs),
                      Expanded(
                        child: Text(
                          s['name']?.toString() ?? '',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Text(
                        '${s['headcount']} Staff',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: Space.sm),
                  Wrap(
                    spacing: Space.md,
                    runSpacing: 4,
                    children: [
                      Text(
                        'On Duty: ${s['onDuty']}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.green,
                        ),
                      ),
                      Text(
                        'On Leave: ${s['onLeave']}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.blueGrey,
                        ),
                      ),
                      if (((s['outsideGeofence'] as int?) ?? 0) > 0)
                        Text(
                          'Outside GPS: ${s['outsideGeofence']}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.amber.shade900,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: Space.sm),
          ],
          FilledButton.tonalIcon(
            onPressed: () => context.push(AppRoutes.peopleNew),
            icon: const Icon(Icons.person_add, size: 18),
            label: Text(
              bangla
                  ? '+ নতুন কর্মী অনবোর্ড করুন'
                  : '+ Onboard New Employee (Auto SAP PERNR)',
            ),
          ),
        ],
      ),
    );
  }
}

class _TransportDispatchTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Smart Pooling Alert Card
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.teal.shade50, Colors.white],
              ),
              borderRadius: BorderRadius.circular(Corner.lg),
              border: Border.all(color: Colors.teal.shade300, width: 1.2),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.electric_car,
                      color: Colors.teal,
                      size: 20,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        bangla
                            ? 'স্মার্ট কারপুলিং সুযোগ সনাক্ত'
                            : 'SMART CARPOOLING MERGER DETECTED',
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: Colors.teal,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(
                  'REQ-089 (Tanvir) + REQ-092 (Nazmul)',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  bangla
                      ? 'উভয়ই বারিধারা থেকে কেরানীগঞ্জ প্ল্যান্ট যাচ্ছেন (০৯:৩০ - ১০:০০) · ১টি গাড়িতে একীভূত করলে ৳ ১,৮৫০ জ্বালানি সাশ্রয়'
                      : 'Both departing HQ for Keraniganj Plant (09:30–10:00). Pool into 1 car to save BDT 1,850 on Buriganga corridor.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.sm),
                FilledButton.tonalIcon(
                  style: FilledButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                  ),
                  onPressed: () => context.push(AppRoutes.fleet),
                  icon: const Icon(Icons.merge, size: 16),
                  label: Text(
                    bangla
                        ? '১-ট্যাপে কারপুল একীভূত করুন'
                        : 'Merge & Pool Onto Single Vehicle',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.sm),

          // Requisition Row
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
                Row(
                  children: [
                    const Text(
                      'REQ-2026-089',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade100,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'NEEDS VEHICLE',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                const Text(
                  'Tanvir Ahmed · HQ Baridhara -> Keraniganj Bitumen Jetty',
                  style: TextStyle(fontSize: 12),
                ),
                const SizedBox(height: Space.xs),
                Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton.tonal(
                    style: FilledButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                    ),
                    onPressed: () => context.push(AppRoutes.fleet),
                    child: Text(
                      bangla
                          ? 'গাড়ি ও চালক বরাদ্দ'
                          : 'Assign Vehicle & Driver',
                    ),
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

class _TransportCorridorTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.sm,
      ),
      child: Container(
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
            Row(
              children: [
                const Icon(Icons.navigation, color: Colors.blue, size: 20),
                const SizedBox(width: Space.xs),
                Expanded(
                  child: Text(
                    'Toyota Corolla Cross (Ga-18-4421)',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
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
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    bangla ? 'যাত্রাপথে (৬৫%)' : 'EN ROUTE (65%)',
                    style: const TextStyle(
                      color: Colors.blue,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              'Driver: Md. Rafiqul Islam · Passenger: Tanvir Ahmed',
              style: TextStyle(fontSize: 12),
            ),
            const Text(
              'Route: Postogola Bridge -> Keraniganj Gate 1',
              style: TextStyle(fontSize: 11, color: Colors.black54),
            ),
            const SizedBox(height: Space.sm),
            ClipRRect(
              borderRadius: BorderRadius.circular(Corner.sm),
              child: const LinearProgressIndicator(
                value: 0.65,
                minHeight: 6,
                color: Colors.blue,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
