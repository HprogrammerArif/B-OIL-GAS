import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/attendance/data/location_service.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/incidents/data/incident_repository.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_providers.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class IncidentNewScreen extends ConsumerStatefulWidget {
  const IncidentNewScreen({super.key});

  @override
  ConsumerState<IncidentNewScreen> createState() => _IncidentNewScreenState();
}

class _IncidentNewScreenState extends ConsumerState<IncidentNewScreen> {
  final _title = TextEditingController();
  final _desc = TextEditingController();
  String _type = 'NEAR_MISS';
  String _siteId = 'site_hq';
  String? _zone;
  int _sev = 2;
  int _like = 2;
  bool _anon = false;
  late DateTime _when = DateTime.now().subtract(const Duration(minutes: 30));
  bool _saving = false;
  double? _lat;
  double? _lng;

  @override
  void initState() {
    super.initState();
    final site = ref
        .read(sessionControllerProvider)
        .value
        ?.profile
        .employee
        .site
        .id;
    if (site != null) _siteId = site;
  }

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    super.dispose();
  }

  (int, String) get _risk => incidentScore(_sev, _like);

  Future<void> _pickWhen() async {
    final d = await showDatePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now(),
      initialDate: _when,
    );
    if (d == null || !mounted) return;
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_when),
    );
    if (t == null || !mounted) return;
    setState(() => _when = DateTime(d.year, d.month, d.day, t.hour, t.minute));
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    if (_title.text.trim().length < 5) {
      AppToast.show(context, l10n.inErrTitle, tone: StatusTone.warning);
      return;
    }
    if (_desc.text.trim().length < 20) {
      AppToast.show(context, l10n.inErrDesc, tone: StatusTone.warning);
      return;
    }
    final scored = _risk;
    if (scored.$2 == 'HIGH' || scored.$2 == 'EXTREME') {
      final ok = await showConfirmSheet(
        context,
        title: l10n.inConfirmSerious,
        message: l10n.inConfirmSeriousMsg,
        confirmLabel: l10n.inCreate,
      );
      if (!ok || !mounted) return;
    }
    setState(() => _saving = true);
    try {
      final i = await ref.read(incidentRepositoryProvider).create({
        'type': _type,
        'title': _title.text.trim(),
        'description': _desc.text.trim(),
        'siteId': _siteId,
        'zone': _zone,
        'occurredAt': Dhaka.toWire(_when),
        'severity': _sev,
        'likelihood': _like,
        'isAnonymous': _anon,
        if (_lat != null) 'lat': _lat,
        if (_lng != null) 'lng': _lng,
      });
      ref.invalidate(incidentsProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.inDoneCreate, tone: StatusTone.success);
      context.go(AppRoutes.incidentDetail(i.id));
    } on ApiException {
      if (!mounted) return;
      AppToast.show(context, l10n.inErrFailed, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final zones = ref.watch(incidentZonesProvider(_siteId)).asData?.value ?? [];
    final scored = _risk;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.inNew)),
      body: ListView(
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Text(l10n.inFormIntro),
          const SizedBox(height: Space.md),
          Text(l10n.inFieldType, style: Theme.of(context).textTheme.labelLarge),
          Wrap(
            spacing: Space.sm,
            children: [
              for (final t in incidentTypes)
                ChoiceChip(
                  label: Text(incidentTypeLabel(l10n, t)),
                  selected: _type == t,
                  onSelected: (_) => setState(() => _type = t),
                ),
            ],
          ),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.inFieldTitle, controller: _title),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.inFieldDesc, controller: _desc, maxLines: 4),
          const SizedBox(height: Space.md),
          Text(l10n.inFieldSite, style: Theme.of(context).textTheme.labelLarge),
          Wrap(
            spacing: Space.sm,
            children: [
              for (final e in [
                ('site_hq', l10n.visSiteHq),
                ('site_plant', l10n.visSitePlant),
                ('site_ctg', l10n.visSiteCtg),
              ])
                ChoiceChip(
                  label: Text(e.$2),
                  selected: _siteId == e.$1,
                  onSelected: (_) => setState(() {
                    _siteId = e.$1;
                    _zone = null;
                  }),
                ),
            ],
          ),
          if (zones.isNotEmpty) ...[
            const SizedBox(height: Space.md),
            Text(
              l10n.inFieldZone,
              style: Theme.of(context).textTheme.labelLarge,
            ),
            Wrap(
              spacing: Space.sm,
              children: [
                for (final z in zones)
                  ChoiceChip(
                    label: Text(z.label(bangla: bangla)),
                    selected: _zone == z.name,
                    onSelected: (_) => setState(() => _zone = z.name),
                  ),
              ],
            ),
          ],
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.inFieldWhen),
            subtitle: Text(DateFmt.dateTime(_when, bangla ? 'bn' : 'en')),
            trailing: const Icon(Icons.schedule),
            onTap: _pickWhen,
          ),
          Text(l10n.inFieldSev(_sev)),
          Slider(
            value: _sev.toDouble(),
            min: 1,
            max: 5,
            divisions: 4,
            label: '$_sev',
            onChanged: (v) => setState(() => _sev = v.round()),
          ),
          Text(l10n.inFieldLike(_like)),
          Slider(
            value: _like.toDouble(),
            min: 1,
            max: 5,
            divisions: 4,
            label: '$_like',
            onChanged: (v) => setState(() => _like = v.round()),
          ),
          StatusPill(
            label: l10n.inRiskLine(
              scored.$1,
              incidentRiskLabel(l10n, scored.$2),
            ),
            tone: incidentRiskTone(scored.$2),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.inGps),
            subtitle: Text(_lat == null ? l10n.inGps : l10n.inGpsOn),
            trailing: const Icon(Icons.my_location),
            onTap: () async {
              try {
                final fix = await ref.read(locationServiceProvider).capture();
                if (!mounted) return;
                setState(() {
                  _lat = fix.lat;
                  _lng = fix.lng;
                });
              } on Object {
                if (!context.mounted) return;
                AppToast.show(context, l10n.attLocUnavailable);
              }
            },
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.inFieldAnon),
            subtitle: Text(l10n.inFieldAnonHelp),
            value: _anon,
            onChanged: (v) => setState(() => _anon = v),
          ),
          const SizedBox(height: Space.lg),
          PrimaryButton(
            label: l10n.inCreate,
            onPressed: _saving ? null : _submit,
          ),
        ],
      ),
    );
  }
}
