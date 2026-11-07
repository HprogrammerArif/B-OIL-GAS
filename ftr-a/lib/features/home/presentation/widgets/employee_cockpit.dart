import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/app/shell_scaffold.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class EmployeeCockpit extends StatelessWidget {
  const EmployeeCockpit({required this.dashboard, super.key});

  final Dashboard dashboard;

  void _openDigitalGatePass(BuildContext context) {
    unawaited(
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
        ),
        builder: (_) => const _DigitalGatePassSheet(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: Space.lg,
        vertical: Space.xs,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header CTA: Digital Gate Pass (Employee QR Badge)
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: scheme.primary,
              foregroundColor: scheme.onPrimary,
              padding: const EdgeInsets.symmetric(vertical: Space.md),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Corner.lg),
              ),
            ),
            icon: const Icon(Icons.qr_code_scanner, size: 20),
            label: Text(
              bangla
                  ? 'ডিজিটাল গেট পাস ও আইডি ব্যাজ'
                  : 'Digital Gate Pass & Security QR',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            onPressed: () {
              Haptics.tap();
              _openDigitalGatePass(context);
            },
          ),
          const SizedBox(height: Space.md),

          // 5 Status-Aware Action Tiles
          Text(
            bangla ? 'দৈনিক কাজের অ্যাকশন' : 'My Daily Action Workspaces',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: Space.xs),

          _ActionTile(
            icon: Icons.fingerprint,
            title: bangla
                ? 'দৈনিক হাজিরা ও জিপিএস'
                : 'My Daily Attendance & GPS',
            status: bangla
                ? 'হাজিরা দেওয়া হয়েছে (০৮:৫৪) · বারিধারা'
                : 'Punched in 08:54 AM · HQ Baridhara (110m)',
            statusColor: Colors.green,
            onTap: () => openAppRoute(context, AppRoutes.attendance),
          ),
          _ActionTile(
            icon: Icons.directions_car_outlined,
            title: bangla ? 'কোম্পানি গাড়ি বুকিং' : 'Book Company Car & Fleet',
            status: bangla
                ? 'ট্রিপ REQ-089 বরাদ্দ · টয়োটা করোলা'
                : 'Active Trip: Toyota Corolla Cross (Ga-18-4421)',
            statusColor: Colors.blue,
            onTap: () => context.push(AppRoutes.fleet),
          ),
          _ActionTile(
            icon: Icons.directions_bus_outlined,
            title: bangla ? 'স্টাফ শাটল বাস' : 'Staff Shuttle Bus (52-Seat)',
            status: bangla
                ? 'বাস #০৩ উত্তরা রুট · সিট ৪এ'
                : 'Bus #03 Uttara Route · Confirmed Seat 4A',
            statusColor: Colors.purple,
            onTap: () => context.push(AppRoutes.bus),
          ),
          _ActionTile(
            icon: Icons.receipt_long_outlined,
            title: bangla ? 'খরচের দাবি পেশ' : 'My Expense Claims',
            status: bangla
                ? '২টি খোলা আবেদন · ৳ ১৪,৫০০'
                : '2 open claims in progress · BDT 14,500',
            statusColor: Colors.orange.shade800,
            onTap: () => context.push(AppRoutes.claims),
          ),
          _ActionTile(
            icon: Icons.beach_access_outlined,
            title: bangla ? 'আমার ছুটির ব্যালেন্স' : 'My Leave Entitlements',
            status: bangla
                ? '১০ নৈমিত্তিক · ১৪ অসুস্থ · ২০ অর্জিত'
                : '10 Casual · 14 Sick · 20 Earned Days Left',
            statusColor: Colors.teal,
            onTap: () => context.push(AppRoutes.leave),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.title,
    required this.status,
    required this.statusColor,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String status;
  final Color statusColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: Space.xs),
      child: InkWell(
        borderRadius: BorderRadius.circular(Corner.lg),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: Space.md,
            vertical: Space.sm,
          ),
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(Corner.lg),
            border: Border.all(
              color: scheme.outlineVariant.withValues(alpha: 0.6),
            ),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: scheme.primary.withValues(alpha: 0.1),
                child: Icon(icon, size: 20, color: scheme.primary),
              ),
              const SizedBox(width: Space.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      status,
                      style: TextStyle(
                        fontSize: 11.5,
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_ios,
                size: 14,
                color: Colors.black38,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DigitalGatePassSheet extends StatelessWidget {
  const _DigitalGatePassSheet();

  @override
  Widget build(BuildContext context) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.8,
      maxChildSize: 0.9,
      builder: (context, scrollController) => ListView(
        controller: scrollController,
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Center(
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(Corner.xl),
                border: Border.all(color: scheme.primary, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: scheme.primary.withValues(alpha: 0.15),
                    blurRadius: 12,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.oil_barrel, color: scheme.primary, size: 24),
                      const SizedBox(width: Space.xs),
                      const Text(
                        'BASHUNDHARA OIL & GAS',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.8,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const Text(
                    'EMPLOYEE DIGITAL IDENTITY & GATE PASS',
                    style: TextStyle(fontSize: 10, color: Colors.black54),
                  ),
                  const Divider(height: 24),

                  // Avatar & ID
                  const CircleAvatar(
                    radius: 36,
                    backgroundColor: Color(0xFF0284C7),
                    child: Text(
                      'TA',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                  Text(
                    'Tanvir Ahmed',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'Senior Sales Officer · EMP-1042',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const Text(
                    'SAP PERNR: 00104288 · Blood: O+',
                    style: TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                  const SizedBox(height: Space.md),

                  // High-Contrast QR Code Placeholder
                  Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(Corner.md),
                      border: Border.all(),
                    ),
                    child: const Center(
                      child: Icon(Icons.qr_code_2, size: 120),
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                  const Text(
                    'TURNSTILE & RFID VERIFIED',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                      color: Colors.green,
                    ),
                  ),
                  const Text(
                    'Valid today at: HQ Baridhara · Keraniganj Plant',
                    style: TextStyle(fontSize: 11, color: Colors.black54),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.md),
          FilledButton.tonal(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(bangla ? 'বন্ধ করুন' : 'Close Badge'),
          ),
        ],
      ),
    );
  }
}
