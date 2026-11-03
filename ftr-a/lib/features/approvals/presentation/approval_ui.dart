import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String categoryLabel(AppL10n l10n, ApprovalCategory c) => switch (c) {
  ApprovalCategory.leave => l10n.approvalCatLeave,
  ApprovalCategory.claims => l10n.approvalCatClaims,
  ApprovalCategory.procurement => l10n.approvalCatProcurement,
  ApprovalCategory.fleet => l10n.approvalCatFleet,
  ApprovalCategory.other => l10n.approvalCatOther,
};

String slaLabel(AppL10n l10n, SlaState s) => switch (s) {
  SlaState.ok => l10n.approvalSlaOk,
  SlaState.warn => l10n.approvalSlaWarn,
  SlaState.danger => l10n.approvalSlaDanger,
  SlaState.overdue => l10n.approvalSlaOverdue,
};

StatusTone slaTone(SlaState s) => switch (s) {
  SlaState.ok => StatusTone.neutral,
  SlaState.warn => StatusTone.warning,
  SlaState.danger || SlaState.overdue => StatusTone.danger,
};

String decisionLabel(AppL10n l10n, String? decision) => switch (decision) {
  'APPROVED' => l10n.approvalDecApproved,
  'REJECTED' => l10n.approvalDecRejected,
  'RETURNED' => l10n.approvalDecReturned,
  _ => l10n.approvalDecStarted,
};

StatusTone decisionTone(String? decision) => switch (decision) {
  'APPROVED' => StatusTone.success,
  'REJECTED' => StatusTone.danger,
  'RETURNED' => StatusTone.warning,
  _ => StatusTone.neutral,
};

String requestStatusLabel(AppL10n l10n, String status) => switch (status) {
  'APPROVED' => l10n.approvalDecApproved,
  'REJECTED' => l10n.approvalDecRejected,
  'RETURNED' => l10n.approvalDecReturned,
  'WITHDRAWN' => l10n.approvalWithdrawn,
  _ => l10n.approvalInReview,
};

StatusTone requestStatusTone(String status) => switch (status) {
  'APPROVED' => StatusTone.success,
  'REJECTED' => StatusTone.danger,
  'RETURNED' || 'IN_REVIEW' => StatusTone.warning,
  _ => StatusTone.neutral,
};

/// `৳12,500` with lakh grouping.
String taka(double amount, {required bool bangla}) =>
    Money.fromPaisa((amount * 100).round()).format(bengali: bangla);

String actionLabel(AppL10n l10n, String type) => switch (type) {
  'APPROVE' => l10n.approvalActApprove,
  'REJECT' => l10n.approvalActReject,
  'RETURN' => l10n.approvalActReturn,
  'DELEGATE' => l10n.approvalActDelegate,
  'WITHDRAW' => l10n.approvalActWithdraw,
  _ => l10n.approvalActComment,
};
