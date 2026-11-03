import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:flutter/material.dart';

/// `৳12,500` with lakh grouping and Bengali digits when [bangla].
String bdt(double amount, {required bool bangla}) =>
    Money.fromPaisa((amount * 100).round()).format(bengali: bangla);

String claimTypeLabel(AppL10n l10n, ClaimType t) => switch (t) {
  ClaimType.tada => l10n.claimTypeTada,
  ClaimType.conveyance => l10n.claimTypeConveyance,
  ClaimType.tourEvent => l10n.claimTypeTour,
};

IconData claimTypeIcon(ClaimType t) => switch (t) {
  ClaimType.tada => Icons.flight_takeoff,
  ClaimType.conveyance => Icons.directions_car_outlined,
  ClaimType.tourEvent => Icons.event_available_outlined,
};

String claimStatusLabel(AppL10n l10n, ClaimStatus s) => switch (s) {
  ClaimStatus.draft => l10n.claimStatusDraft,
  ClaimStatus.pendingManager => l10n.claimStatusPendingManager,
  ClaimStatus.pendingFinance => l10n.claimStatusPendingFinance,
  ClaimStatus.approved => l10n.claimStatusApproved,
  ClaimStatus.settled => l10n.claimStatusSettled,
  ClaimStatus.returned => l10n.claimStatusReturned,
  ClaimStatus.rejected => l10n.claimStatusRejected,
  ClaimStatus.cancelled => l10n.claimStatusCancelled,
};

StatusTone claimStatusTone(ClaimStatus s) => switch (s) {
  ClaimStatus.draft || ClaimStatus.cancelled => StatusTone.neutral,
  ClaimStatus.pendingManager || ClaimStatus.pendingFinance => StatusTone.warning,
  ClaimStatus.approved => StatusTone.info,
  ClaimStatus.settled => StatusTone.success,
  ClaimStatus.returned => StatusTone.warning,
  ClaimStatus.rejected => StatusTone.danger,
};

String advanceStatusLabel(AppL10n l10n, AdvanceStatus s) => switch (s) {
  AdvanceStatus.pendingManager => l10n.claimStatusPendingManager,
  AdvanceStatus.pendingFinance => l10n.claimStatusPendingFinance,
  AdvanceStatus.approved => l10n.claimStatusApproved,
  AdvanceStatus.disbursed => l10n.advStatusDisbursed,
  AdvanceStatus.settled => l10n.claimStatusSettled,
  AdvanceStatus.rejected => l10n.claimStatusRejected,
  AdvanceStatus.cancelled => l10n.claimStatusCancelled,
};

StatusTone advanceStatusTone(AdvanceStatus s) => switch (s) {
  AdvanceStatus.pendingManager || AdvanceStatus.pendingFinance =>
    StatusTone.warning,
  AdvanceStatus.approved => StatusTone.info,
  AdvanceStatus.disbursed || AdvanceStatus.settled => StatusTone.success,
  AdvanceStatus.rejected => StatusTone.danger,
  AdvanceStatus.cancelled => StatusTone.neutral,
};

String claimCategoryLabel(AppL10n l10n, String c) => switch (c) {
  'DA' => l10n.claimCatDa,
  'TICKET' => l10n.claimCatTicket,
  'HOTEL' => l10n.claimCatHotel,
  'MEALS' => l10n.claimCatMeals,
  'MILEAGE' => l10n.claimCatMileage,
  'CNG' => l10n.claimCatCng,
  'RICKSHAW' => l10n.claimCatRickshaw,
  'RIDE_SHARE' => l10n.claimCatRideShare,
  'BUS_FARE' => l10n.claimCatBusFare,
  'EVENT' => l10n.claimCatEvent,
  _ => l10n.claimCatOther,
};

String travelModeLabel(AppL10n l10n, String m) => switch (m) {
  'EXECUTIVE_CAR' => l10n.claimModeExecutiveCar,
  'COMPANY_CAR' => l10n.claimModeCompanyCar,
  'POOL_CAR' => l10n.claimModePoolCar,
  'DOMESTIC_AIR' => l10n.claimModeAir,
  'AC_TRAIN' => l10n.claimModeAcTrain,
  'FIRST_CLASS_TRAIN' => l10n.claimModeFirstTrain,
  'TRAIN' => l10n.claimModeTrain,
  'AC_BUS' => l10n.claimModeAcBus,
  'BUS' => l10n.claimModeBus,
  'CNG' => l10n.claimCatCng,
  'RIDE_SHARE' => l10n.claimCatRideShare,
  _ => l10n.claimCatRickshaw,
};

String claimFlagLabel(AppL10n l10n, ClaimFlag f, {required bool bangla}) {
  final amount = f.amount == null ? '' : bdt(f.amount!, bangla: bangla);
  return switch (f.code) {
    'NO_LINES' => l10n.claimFlagNoLines,
    'RECEIPT_REQUIRED' => l10n.claimFlagReceipt,
    'HOTEL_CAP_EXCEEDED' => l10n.claimFlagHotel(amount),
    'CONVEYANCE_CAP_EXCEEDED' => l10n.claimFlagConveyance(amount),
    'OVERLAPPING_PERIOD' => l10n.claimFlagOverlap,
    'DUPLICATE_RECEIPT' => l10n.claimFlagDuplicate,
    'LATE_SUBMISSION' => l10n.claimFlagLate,
    'MODE_ABOVE_ENTITLEMENT' => l10n.claimFlagMode,
    'MILEAGE_LONG' => l10n.claimFlagMileage,
    _ => f.code,
  };
}
