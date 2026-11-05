import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/features/home/presentation/search_sheet.dart';
import 'package:bogcl_oneops/features/notifications/presentation/inbox_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Notification bell for every root tab. Search is on by default;
/// Home turns it off.
class AppBarActions extends ConsumerWidget {
  const AppBarActions({this.showSearch = true, super.key});

  final bool showSearch;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final unread = ref.watch(unreadSummaryControllerProvider).value?.total ?? 0;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showSearch)
          IconButton(
            tooltip: l10n.searchTitle,
            onPressed: () => unawaited(showGlobalSearch(context)),
            icon: const Icon(Icons.search),
          ),
        IconButton(
          tooltip: l10n.inboxTitle,
          onPressed: () => context.push(AppRoutes.inbox),
          icon: Badge(
            isLabelVisible: unread > 0,
            label: Text(unread > 99 ? '99+' : '$unread'),
            child: const Icon(Icons.notifications_outlined),
          ),
        ),
      ],
    );
  }
}
