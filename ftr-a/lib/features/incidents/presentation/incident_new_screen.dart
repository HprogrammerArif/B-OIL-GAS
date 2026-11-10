import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/attendance/data/location_service.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/incidents/data/incident_repository.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_providers.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _incidentTemplates = <(String, String)>[
  (
    'Minor pressure fluctuation observed on Filling Carousel Valve #08 during cylinder batch charging; line isolated immediately for seal check.',
    'সিলিন্ডার চার্জিং চলাকালীন ফিলিং ক্যারোসেল ভালভ #০৮-এ সামান্য চাপের তারতম্য পরিলক্ষিত হয়েছে; সিল পরীক্ষার জন্য তাৎক্ষণিকভাবে লাইনটি বিচ্ছিন্ন করা হয়েছে।',
  ),
  (
    'Forklift reversing alarm intermittent in Empty Cylinder Stacking Bay; operator instructed to halt vehicle for electrical maintenance.',
    'খালি সিলিন্ডার স্ট্যাকিং বে-তে ফর্কলিফটের রিভার্সিং অ্যালার্ম অনিয়মিতভাবে কাজ করছে; বৈদ্যুতিক মেরামতের জন্য যানটি থামাতে নির্দেশ দেওয়া হয়েছে।',
  ),
  (
    'Static earthing clamp cable insulation wear detected at Bulk LPG Road Tanker Decanting Bay #02 prior to unloading.',
    'আনলোডিংয়ের পূর্বে বাল্ক এলপিজি রোড ট্যাংকার ডিক্যান্টিং বে #০২-এ স্ট্যাটিক আর্থিং ক্ল্যাম্প ক্যাবলের ইনসুলেশন ক্ষয় শনাক্ত করা হয়েছে।',
  ),
];

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
  int? _draftIndex;
  final List<String> _photos = [];

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

  bool get _isReady =>
      _title.text.trim().length >= 5 && _desc.text.trim().length >= 20;

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
        if (_photos.isNotEmpty) 'attachmentFileIds': List<String>.from(_photos),
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

  Widget _chipRow({required List<Widget> children}) =>
      Wrap(spacing: Space.sm, runSpacing: Space.xs, children: children);

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final zones = ref.watch(incidentZonesProvider(_siteId)).asData?.value ?? [];
    final scored = _risk;
    final draftLabels = [
      l10n.inDraftValve,
      l10n.inDraftForklift,
      l10n.inDraftEarthing,
    ];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.inNew)),
      bottomNavigationBar: EnterpriseFormBottomBar(
        primaryLabel: l10n.inCreate,
        primaryIcon: Icons.health_and_safety_outlined,
        loading: _saving,
        isReady: _isReady,
        onPrimaryPressed: _saving ? null : () => unawaited(_submit()),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          Space.lg,
          Space.md,
          Space.lg,
          Space.xxl,
        ),
        children: [
          AppTextField(
            label: l10n.inFieldTitle,
            controller: _title,
            onChanged: (_) => setState(() => _draftIndex = null),
          ),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.inFieldDesc,
            controller: _desc,
            maxLines: 4,
            onChanged: (_) => setState(() => _draftIndex = null),
          ),
          const SizedBox(height: Space.lg),
          EvidenceStrip(
            fileIds: _photos,
            canAdd: true,
            onAdded: (id) async {
              if (!mounted) return;
              setState(() => _photos.add(id));
            },
          ),
          const SizedBox(height: Space.md),
          Text(l10n.inUseDraft, style: theme.textTheme.titleSmall),
          const SizedBox(height: Space.xs),
          _chipRow(
            children: [
              for (var i = 0; i < _incidentTemplates.length; i++)
                ChoiceChip(
                  visualDensity: VisualDensity.compact,
                  label: Text(draftLabels[i]),
                  selected: _draftIndex == i,
                  onSelected: (_) {
                    final preset = _incidentTemplates[i];
                    setState(() {
                      _draftIndex = i;
                      _title.text = draftLabels[i];
                      _desc.text = bangla ? preset.$2 : preset.$1;
                    });
                  },
                ),
            ],
          ),
          const SizedBox(height: Space.lg),
          Text(l10n.inFieldType, style: theme.textTheme.titleSmall),
          const SizedBox(height: Space.xs),
          _chipRow(
            children: [
              for (final t in incidentTypes)
                FilterChip(
                  visualDensity: VisualDensity.compact,
                  label: Text(incidentTypeLabel(l10n, t)),
                  selected: _type == t,
                  onSelected: (_) => setState(() => _type = t),
                ),
            ],
          ),
          const SizedBox(height: Space.lg),
          Text(l10n.inFieldSite, style: theme.textTheme.titleSmall),
          const SizedBox(height: Space.xs),
          _chipRow(
            children: [
              for (final s in [
                ('site_hq', l10n.visSiteHq),
                ('site_plant', l10n.visSitePlant),
                ('site_ctg', l10n.visSiteCtg),
              ])
                ChoiceChip(
                  visualDensity: VisualDensity.compact,
                  label: Text(s.$2),
                  selected: _siteId == s.$1,
                  onSelected: (_) => setState(() {
                    _siteId = s.$1;
                    _zone = null;
                  }),
                ),
            ],
          ),
          const SizedBox(height: Space.lg),
          Text(l10n.inFieldZone, style: theme.textTheme.titleSmall),
          const SizedBox(height: Space.xs),
          _chipRow(
            children: [
              FilterChip(
                visualDensity: VisualDensity.compact,
                label: Text(l10n.inZoneUnassigned),
                selected: _zone == null,
                onSelected: (_) => setState(() => _zone = null),
              ),
              for (final z in zones)
                FilterChip(
                  visualDensity: VisualDensity.compact,
                  label: Text(z.label(bangla: bangla)),
                  selected: _zone == z.name,
                  onSelected: (_) => setState(() => _zone = z.name),
                ),
            ],
          ),
          const SizedBox(height: Space.lg),
          Text(l10n.inFieldWhen, style: theme.textTheme.titleSmall),
          const SizedBox(height: Space.xs),
          InkWell(
            borderRadius: BorderRadius.circular(Radii.md),
            onTap: () => unawaited(_pickWhen()),
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(Radii.md),
                border: Border.all(color: cs.outlineVariant),
              ),
              child: Row(
                children: [
                  Icon(Icons.schedule_outlined, color: cs.onSurfaceVariant),
                  const SizedBox(width: Space.md),
                  Expanded(
                    child: Text(
                      DateFmt.dateTime(_when, lang),
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Space.lg),
          Text(l10n.inFieldSev(_sev), style: theme.textTheme.titleSmall),
          const SizedBox(height: Space.xs),
          _chipRow(
            children: [
              for (var n = 1; n <= 5; n++)
                ChoiceChip(
                  visualDensity: VisualDensity.compact,
                  label: Text('$n'),
                  selected: _sev == n,
                  onSelected: (_) => setState(() => _sev = n),
                ),
            ],
          ),
          const SizedBox(height: Space.md),
          Text(l10n.inFieldLike(_like), style: theme.textTheme.titleSmall),
          const SizedBox(height: Space.xs),
          _chipRow(
            children: [
              for (var n = 1; n <= 5; n++)
                ChoiceChip(
                  visualDensity: VisualDensity.compact,
                  label: Text('$n'),
                  selected: _like == n,
                  onSelected: (_) => setState(() => _like = n),
                ),
            ],
          ),
          const SizedBox(height: Space.sm),
          Text(
            l10n.inRiskLine(scored.$1, incidentRiskLabel(l10n, scored.$2)),
            style: theme.textTheme.bodySmall?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: Space.lg),
          InkWell(
            borderRadius: BorderRadius.circular(Radii.md),
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
            child: Container(
              padding: const EdgeInsets.all(Space.md),
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(Radii.md),
                border: Border.all(color: cs.outlineVariant),
              ),
              child: Row(
                children: [
                  Icon(
                    _lat != null ? Icons.gps_fixed : Icons.my_location_outlined,
                    color: cs.onSurfaceVariant,
                  ),
                  const SizedBox(width: Space.md),
                  Expanded(
                    child: Text(
                      _lat == null ? l10n.inGps : l10n.inGpsOn,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.inFieldAnon),
            subtitle: Text(l10n.inFieldAnonHelp),
            value: _anon,
            onChanged: (v) => setState(() => _anon = v),
          ),
        ],
      ),
    );
  }
}
