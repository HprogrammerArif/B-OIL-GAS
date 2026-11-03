import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/activity/presentation/activity_controller.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

(String, IconData) _describe(AppL10n l10n, String action) => switch (action) {
  'LOGIN_SUCCESS' => (l10n.activityLoginSuccess, Icons.login),
  'LOGIN_FAILED' => (l10n.activityLoginFailed, Icons.gpp_maybe_outlined),
  'LOGOUT' => (l10n.activityLogout, Icons.logout),
  'PROFILE_UPDATED' => (l10n.activityProfileUpdated, Icons.person_outline),
  'PREFERENCES_UPDATED' => (l10n.activityPreferencesUpdated, Icons.tune),
  'NOTIFICATION_ACKED' => (
    l10n.activityNotificationAcked,
    Icons.mark_email_read_outlined,
  ),
  _ => (l10n.activityOther, Icons.history),
};

/// Read-only view of the caller's own audit trail (doc 03 `/me/activity`).
class ActivityScreen extends ConsumerStatefulWidget {
  const ActivityScreen({super.key});

  @override
  ConsumerState<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends ConsumerState<ActivityScreen> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.extentAfter < 300) unawaited(_loadMore());
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _loadMore() async {
    try {
      await ref.read(activityControllerProvider.notifier).loadMore();
    } on ApiException {
      if (mounted) {
        AppToast.show(
          context,
          context.l10n.inboxLoadMoreFailed,
          tone: StatusTone.warning,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    final activity = ref.watch(activityControllerProvider);
    final controller = ref.read(activityControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.activityTitle)),
      body: activity.when(
        loading: () => const SkeletonList(),
        error: (_, _) =>
            ErrorState(onRetry: () => unawaited(controller.refresh())),
        data: (s) => RefreshIndicator(
          onRefresh: controller.refresh,
          child: s.items.isEmpty
              ? LayoutBuilder(
                  builder: (context, box) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(
                      height: box.maxHeight,
                      child: EmptyState(
                        icon: Icons.history,
                        title: l10n.activityEmptyTitle,
                        message: l10n.activityEmptyMessage,
                      ),
                    ),
                  ),
                )
              : ListView.separated(
                  controller: _scroll,
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(Space.lg),
                  itemCount: s.items.length + (s.loadingMore ? 1 : 0),
                  separatorBuilder: (_, _) => const SizedBox(height: Space.sm),
                  itemBuilder: (context, i) {
                    if (i == s.items.length) {
                      return const Padding(
                        padding: EdgeInsets.all(Space.lg),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    }
                    final e = s.items[i];
                    final (label, icon) = _describe(l10n, e.action);
                    return ListRow(
                      title: label,
                      subtitle: DateFmt.dateTime(e.createdAt, lang),
                      leading: Icon(icon),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
