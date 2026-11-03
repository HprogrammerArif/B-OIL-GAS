import 'package:bogcl_oneops/features/notices/domain/notice_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';

String noticeCategoryLabel(AppL10n l10n, NoticeCategory c) => switch (c) {
  NoticeCategory.general => l10n.noticeCatGeneral,
  NoticeCategory.policy => l10n.noticeCatPolicy,
  NoticeCategory.safety => l10n.noticeCatSafety,
  NoticeCategory.operations => l10n.noticeCatOperations,
  NoticeCategory.admin => l10n.noticeCatAdmin,
  NoticeCategory.hr => l10n.noticeCatHr,
  NoticeCategory.executive => l10n.noticeCatExecutive,
};

String noticePriorityLabel(AppL10n l10n, NoticePriority p) => switch (p) {
  NoticePriority.normal => l10n.noticePrioNormal,
  NoticePriority.high => l10n.noticePrioHigh,
  NoticePriority.critical => l10n.noticePrioCritical,
};

StatusTone noticePriorityTone(NoticePriority p) => switch (p) {
  NoticePriority.normal => StatusTone.neutral,
  NoticePriority.high => StatusTone.warning,
  NoticePriority.critical => StatusTone.danger,
};

IconData noticeCategoryIcon(NoticeCategory c) => switch (c) {
  NoticeCategory.general => Icons.campaign_outlined,
  NoticeCategory.policy => Icons.gavel_outlined,
  NoticeCategory.safety => Icons.health_and_safety_outlined,
  NoticeCategory.operations => Icons.precision_manufacturing_outlined,
  NoticeCategory.admin => Icons.business_center_outlined,
  NoticeCategory.hr => Icons.groups_outlined,
  NoticeCategory.executive => Icons.workspace_premium_outlined,
};
