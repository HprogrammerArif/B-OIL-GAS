import 'package:bogcl_oneops/features/auth/domain/session_models.dart';
import 'package:bogcl_oneops/features/dashboards/domain/dashboard_models.dart';
import 'package:bogcl_oneops/features/home/presentation/widgets/chairman_cockpit.dart';
import 'package:bogcl_oneops/features/home/presentation/widgets/driver_cockpit.dart';
import 'package:bogcl_oneops/features/home/presentation/widgets/employee_cockpit.dart';
import 'package:bogcl_oneops/features/home/presentation/widgets/hod_cockpit.dart';
import 'package:bogcl_oneops/features/home/presentation/widgets/home_kpi_grid.dart';
import 'package:bogcl_oneops/features/home/presentation/widgets/hr_transport_cockpit.dart';
import 'package:bogcl_oneops/features/home/presentation/widgets/needs_you_card.dart';
import 'package:bogcl_oneops/features/home/presentation/widgets/plant_gm_cockpit.dart';
import 'package:flutter/material.dart';

/// The 7-Role BOGCL Operations Cockpit:
/// - Block B: Needs You Attention Card
/// - Block C: 2x2 Interactive KPI Grid
/// - Block D: Tailored Role Sub-Tabs & Actions
class HomeRolePanel extends StatelessWidget {
  const HomeRolePanel({
    required this.dashboard,
    required this.session,
    super.key,
  });

  final Dashboard dashboard;
  final Session session;

  @override
  Widget build(BuildContext context) {
    final firstNeed = dashboard.needs.firstOrNull;
    final layout = dashboard.layout;

    final cockpit = switch (layout) {
      'CHAIRMAN' => ChairmanCockpit(dashboard: dashboard),
      'PLANT_GM' => PlantGmCockpit(dashboard: dashboard),
      'HOD' => HodCockpit(dashboard: dashboard),
      'HR_ADMIN' => HrTransportCockpit(
        dashboard: dashboard,
        isTransport: false,
      ),
      'TRANSPORT_ADMIN' => HrTransportCockpit(
        dashboard: dashboard,
        isTransport: true,
      ),
      'DRIVER' => DriverCockpit(dashboard: dashboard),
      _ => EmployeeCockpit(dashboard: dashboard),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (firstNeed != null) NeedsYouCard(need: firstNeed),
        if (dashboard.kpis.isNotEmpty) HomeKpiGrid(kpis: dashboard.kpis),
        cockpit,
      ],
    );
  }
}
