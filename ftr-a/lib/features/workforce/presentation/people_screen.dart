import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/workforce/domain/workforce_models.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_providers.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_ui.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class PeopleScreen extends ConsumerStatefulWidget {
  const PeopleScreen({super.key});

  @override
  ConsumerState<PeopleScreen> createState() => _PeopleScreenState();
}

class _PeopleScreenState extends ConsumerState<PeopleScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String _query = '';
  String _departmentFilter = 'ALL';
  String _siteFilter = 'ALL';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  void _refresh() => ref
    ..invalidate(staffListProvider)
    ..invalidate(staffDetailProvider);

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final session = ref.watch(sessionControllerProvider).value;
    final canAdd = session?.can('employees:create') ?? false;
    final canManageHr =
        canAdd ||
        (session?.can('employees:offboard') ?? false) ||
        (session?.can('employees:clearance') ?? false) ||
        (session?.can('employees:read', GrantScope.site) ?? false);

    // Load all staff for unified multi-tab filtering
    final allStaffAsync = ref.watch(staffListProvider(query: _query));
    final leavingStaffAsync = ref.watch(
      staffListProvider(view: 'leaving', query: _query),
    );
    final formerStaffAsync = ref.watch(
      staffListProvider(view: 'former', query: _query),
    );

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
        bottom: canManageHr
            ? TabBar(
                controller: _tabController,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: [
                  Tab(
                    text: bangla ? 'সক্রিয় কর্মী তালিকা' : 'Active Directory',
                  ),
                  Tab(
                    text: bangla
                        ? 'প্রস্থান ছাড়পত্র চলমান'
                        : 'Exit Clearances in Progress',
                  ),
                  Tab(
                    text: bangla
                        ? 'সাবেক কর্মকর্তা আর্কাইভ'
                        : 'Former Staff Archive',
                  ),
                ],
              )
            : null,
      ),
      floatingActionButton: canAdd
          ? FloatingActionButton.extended(
              onPressed: () => unawaited(context.push(AppRoutes.peopleNew)),
              icon: const Icon(Icons.person_add_alt_1),
              label: Text(bangla ? '+ নতুন অন্তর্ভুক্তি' : '+ Onboard Staff'),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Space.md, Space.md, Space.md, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: bangla
                        ? 'নাম, পদবী, ইএমপি আইডি বা এসএপি পার্নার অনুসন্ধান...'
                        : 'Search by Name, EMP ID, SAP PERNR, Designation...',
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
                const SizedBox(height: Space.xs),

                // Filter Chips (Site & Department)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _siteChip('ALL', bangla ? 'সকল সাইট' : 'All Sites'),
                      _siteChip('PLANT', bangla ? 'কেরানীগঞ্জ' : 'Plant'),
                      _siteChip('HQ', bangla ? 'বারিধারা হেড অফিস' : 'HQ'),
                      const SizedBox(width: Space.sm),
                      _deptChip('ALL', bangla ? 'সকল বিভাগ' : 'All Depts'),
                      _deptChip('OPS', bangla ? 'অপারেশনস' : 'Operations'),
                      _deptChip('FIN', bangla ? 'ফিন্যান্স' : 'Finance'),
                      _deptChip('HR', bangla ? 'এইচআর' : 'HR'),
                      _deptChip('FLT', bangla ? 'ট্রান্সপোর্ট' : 'Fleet'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Space.xs),

          // TabBar Views
          Expanded(
            child: canManageHr
                ? TabBarView(
                    controller: _tabController,
                    children: [
                      _buildStaffList(allStaffAsync, bangla, 'ACTIVE'),
                      _buildStaffList(leavingStaffAsync, bangla, 'LEAVING'),
                      _buildStaffList(formerStaffAsync, bangla, 'FORMER'),
                    ],
                  )
                : _buildStaffList(allStaffAsync, bangla, 'ACTIVE'),
          ),
        ],
      ),
    );
  }

  Widget _buildStaffList(
    AsyncValue<List<StaffMember>> asyncRows,
    bool bangla,
    String tabType,
  ) {
    final l10n = context.l10n;

    return asyncRows.when(
      loading: () => const SkeletonList(),
      error: (_, _) => ErrorState(onRetry: _refresh),
      data: (list) {
        final filtered = list.where((e) {
          if (_siteFilter == 'PLANT' &&
              !e.where(bangla: false).contains('Plant')) {
            return false;
          }
          if (_siteFilter == 'HQ' && !e.where(bangla: false).contains('Head')) {
            return false;
          }
          return true;
        }).toList();

        if (filtered.isEmpty) {
          return EmptyState(
            message: bangla
                ? 'কোনো কর্মী পাওয়া যায়নি।'
                : 'No employees found under this view.',
          );
        }

        return RefreshIndicator(
          onRefresh: () async => _refresh(),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.md,
              vertical: Space.xs,
            ),
            itemCount: filtered.length,
            itemBuilder: (ctx, i) {
              final e = filtered[i];
              return Card(
                elevation: 0,
                margin: const EdgeInsets.only(bottom: Space.xs),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                  side: BorderSide(
                    color: Theme.of(ctx).colorScheme.outlineVariant,
                  ),
                ),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: BrandColors.slate900.withValues(
                      alpha: 0.1,
                    ),
                    child: Text(
                      e.fullName.isEmpty ? '?' : e.fullName.substring(0, 1),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: BrandColors.slate900,
                      ),
                    ),
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          e.heading(bangla: bangla),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                      StatusPill(
                        label: staffStatusLabel(l10n, e.status),
                        tone: staffStatusTone(e.status),
                      ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${e.job(bangla: bangla)} · ${e.where(bangla: bangla)}',
                        style: TextStyle(
                          color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                          fontSize: 12,
                        ),
                      ),
                      if (e.next(bangla: bangla).isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          e.next(bangla: bangla),
                          style: TextStyle(
                            fontSize: 11,
                            color: e.status == 'LEAVING'
                                ? BrandColors.warning
                                : BrandColors.slate900,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                  onTap: () =>
                      unawaited(context.push(AppRoutes.peopleDetail(e.id))),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _siteChip(String key, String label) {
    return Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: ChoiceChip(
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: _siteFilter == key,
        onSelected: (_) => setState(() => _siteFilter = key),
      ),
    );
  }

  Widget _deptChip(String key, String label) {
    return Padding(
      padding: const EdgeInsets.only(right: Space.xs),
      child: ChoiceChip(
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: _departmentFilter == key,
        onSelected: (_) => setState(() => _departmentFilter = key),
      ),
    );
  }
}
