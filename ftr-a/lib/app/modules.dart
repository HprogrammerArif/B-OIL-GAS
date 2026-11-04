import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:flutter/material.dart';

/// A module with a working entry screen. Home lists these when the session's
/// `navigation` includes the key; add one line per shipped module.
typedef AppModule = ({
  String key,
  IconData icon,
  String Function(AppL10n l10n) label,
  String route,
});

final List<AppModule> builtModules = [
  (
    key: 'dashboards',
    icon: Icons.insights_outlined,
    label: (l10n) => l10n.moduleDashboards,
    route: AppRoutes.dashboards,
  ),
  (
    key: 'chat',
    icon: Icons.forum_outlined,
    label: (l10n) => l10n.moduleChat,
    route: AppRoutes.chat,
  ),
  (
    key: 'attendance',
    icon: Icons.fingerprint,
    label: (l10n) => l10n.moduleAttendance,
    route: AppRoutes.attendance,
  ),
  (
    key: 'leave',
    icon: Icons.beach_access_outlined,
    label: (l10n) => l10n.moduleLeave,
    route: AppRoutes.leave,
  ),
  (
    key: 'notices',
    icon: Icons.campaign_outlined,
    label: (l10n) => l10n.moduleNotices,
    route: AppRoutes.notices,
  ),
  (
    key: 'claims',
    icon: Icons.receipt_long_outlined,
    label: (l10n) => l10n.moduleClaims,
    route: AppRoutes.claims,
  ),
  (
    key: 'bus',
    icon: Icons.directions_bus_outlined,
    label: (l10n) => l10n.moduleBus,
    route: AppRoutes.bus,
  ),
  (
    key: 'note-sheets',
    icon: Icons.description_outlined,
    label: (l10n) => l10n.moduleNoteSheets,
    route: AppRoutes.noteSheets,
  ),
  (
    key: 'parcels',
    icon: Icons.inventory_2_outlined,
    label: (l10n) => l10n.moduleParcels,
    route: AppRoutes.parcels,
  ),
  (
    key: 'visitors',
    icon: Icons.badge_outlined,
    label: (l10n) => l10n.moduleVisitors,
    route: AppRoutes.visits,
  ),
  (
    key: 'fleet',
    icon: Icons.directions_car_outlined,
    label: (l10n) => l10n.moduleFleet,
    route: AppRoutes.fleet,
  ),
  (
    key: 'incidents',
    icon: Icons.health_and_safety_outlined,
    label: (l10n) => l10n.moduleIncidents,
    route: AppRoutes.incidents,
  ),
  (
    key: 'assets',
    icon: Icons.precision_manufacturing_outlined,
    label: (l10n) => l10n.moduleAssets,
    route: AppRoutes.assets,
  ),
  (
    key: 'compliance',
    icon: Icons.gavel_outlined,
    label: (l10n) => l10n.moduleCompliance,
    route: AppRoutes.licences,
  ),
  (
    key: 'employees',
    icon: Icons.badge_outlined,
    label: (l10n) => l10n.moduleEmployees,
    route: AppRoutes.people,
  ),
  (
    key: 'approvals',
    icon: Icons.fact_check_outlined,
    label: (l10n) => l10n.moduleApprovals,
    route: AppRoutes.approvals,
  ),
];
