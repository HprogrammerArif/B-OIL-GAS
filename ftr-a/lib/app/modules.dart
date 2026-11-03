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
];
