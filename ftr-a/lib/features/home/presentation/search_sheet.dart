import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/dashboards/data/dashboard_repository.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

Future<void> showGlobalSearch(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
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
    _debounce = Timer(const Duration(milliseconds: 280), () {
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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final inset = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, inset + Space.lg),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.72,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.searchTitle,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: Space.xs),
            Text(l10n.searchHint),
            const SizedBox(height: Space.md),
            TextField(
              controller: _q,
              autofocus: true,
              decoration: InputDecoration(
                hintText: l10n.searchField,
                prefixIcon: const Icon(Icons.search),
              ),
              onChanged: _onChanged,
              textInputAction: TextInputAction.search,
            ),
            const SizedBox(height: Space.md),
            Expanded(
              child: _busy
                  ? const SkeletonList()
                  : _last.length >= 2 && _hits.isEmpty
                  ? EmptyState(title: l10n.searchEmpty)
                  : ListView(
                      children: [
                        for (final h in _hits)
                          ListTile(
                            leading: Icon(_icon('${h['kind']}')),
                            title: Text(
                              bangla
                                  ? '${h['titleBn'] ?? h['title']}'
                                  : '${h['title']}',
                            ),
                            subtitle: Text('${h['subtitle'] ?? ''}'),
                            onTap: () {
                              final route = h['route'] as String?;
                              Navigator.pop(context);
                              if (route != null) {
                                unawaited(context.push(route));
                              }
                            },
                          ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _icon(String kind) => switch (kind) {
    'person' => Icons.person_outline,
    'notice' => Icons.campaign_outlined,
    'leave' => Icons.beach_access_outlined,
    'claim' => Icons.receipt_long_outlined,
    'incident' => Icons.health_and_safety_outlined,
    'asset' => Icons.precision_manufacturing_outlined,
    'parcel' => Icons.inventory_2_outlined,
    'visit' => Icons.badge_outlined,
    'notesheet' => Icons.description_outlined,
    _ => Icons.search,
  };
}
