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
import 'package:bogcl_oneops/features/incidents/domain/incident_models.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_providers.dart';
import 'package:bogcl_oneops/features/incidents/presentation/incident_ui.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
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
  bool _tried = false;
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

  String _sevWord(AppL10n l10n, int n) => switch (n) {
    1 => l10n.inSev1,
    2 => l10n.inSev2,
    3 => l10n.inSev3,
    4 => l10n.inSev4,
    _ => l10n.inSev5,
  };

  String _likeWord(AppL10n l10n, int n) => switch (n) {
    1 => l10n.inLike1,
    2 => l10n.inLike2,
    3 => l10n.inLike3,
    4 => l10n.inLike4,
    _ => l10n.inLike5,
  };

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

  Future<T?> _sheet<T>({
    required String title,
    required List<Widget> children,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        final maxH = MediaQuery.sizeOf(ctx).height * 0.7;
        return SafeArea(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: maxH),
            child: ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Space.lg,
                    0,
                    Space.lg,
                    Space.sm,
                  ),
                  child: Text(
                    title,
                    style: Theme.of(ctx).textTheme.titleMedium,
                  ),
                ),
                ...children,
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _pickType() async {
    final l10n = context.l10n;
    final picked = await _sheet<String>(
      title: l10n.inFieldType,
      children: [
        for (final t in incidentTypes)
          ListTile(
            title: Text(incidentTypeLabel(l10n, t)),
            selected: _type == t,
            trailing: _type == t ? const Icon(Icons.check) : null,
            onTap: () => Navigator.pop(context, t),
          ),
      ],
    );
    if (picked == null || !mounted) return;
    setState(() => _type = picked);
  }

  Future<void> _pickZone(List<IncidentZone> zones) async {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final picked = await _sheet<String>(
      title: l10n.inFieldZone,
      children: [
        ListTile(
          title: Text(l10n.inZoneUnassigned),
          selected: _zone == null,
          trailing: _zone == null ? const Icon(Icons.check) : null,
          onTap: () => Navigator.pop(context, ''),
        ),
        for (final z in zones)
          ListTile(
            title: Text(z.label(bangla: bangla)),
            selected: _zone == z.name,
            trailing: _zone == z.name ? const Icon(Icons.check) : null,
            onTap: () => Navigator.pop(context, z.name),
          ),
      ],
    );
    if (picked == null || !mounted) return;
    setState(() => _zone = picked.isEmpty ? null : picked);
  }

  Future<void> _pinLocation() async {
    try {
      final fix = await ref.read(locationServiceProvider).capture();
      if (!mounted) return;
      setState(() {
        _lat = fix.lat;
        _lng = fix.lng;
      });
    } on Object {
      if (!mounted) return;
      AppToast.show(context, context.l10n.attLocUnavailable);
    }
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    setState(() => _tried = true);
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

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final bangla = context.isBangla;
    final lang = bangla ? 'bn' : 'en';
    final zones = ref.watch(incidentZonesProvider(_siteId)).asData?.value ?? [];
    final scored = _risk;
    final serious = scored.$2 == 'HIGH' || scored.$2 == 'EXTREME';
    final draftLabels = [
      l10n.inDraftValve,
      l10n.inDraftForklift,
      l10n.inDraftEarthing,
    ];
    final siteLabel = switch (_siteId) {
      'site_plant' => l10n.visSitePlant,
      'site_ctg' => l10n.visSiteCtg,
      _ => l10n.visSiteHq,
    };

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
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.fromLTRB(
          Space.lg,
          Space.md,
          Space.lg,
          Space.xxl,
        ),
        children: [
          Text(
            l10n.inFormIntro,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: Space.lg),
          _Card(
            title: l10n.inFormWhat,
            children: [
              Text(l10n.inUseDraft, style: theme.textTheme.labelLarge),
              const SizedBox(height: Space.xs),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.xs,
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
                          _tried = false;
                        });
                      },
                    ),
                ],
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.inFieldTitle,
                hint: l10n.inTitleHint,
                controller: _title,
                required: true,
                textInputAction: TextInputAction.next,
                errorText: _tried && _title.text.trim().length < 5
                    ? l10n.inErrTitle
                    : null,
                onChanged: (_) => setState(() => _draftIndex = null),
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.inFieldDesc,
                hint: l10n.inDescHint,
                controller: _desc,
                maxLines: 4,
                required: true,
                keyboardType: TextInputType.multiline,
                textInputAction: TextInputAction.newline,
                errorText: _tried && _desc.text.trim().length < 20
                    ? l10n.inErrDesc
                    : null,
                onChanged: (_) => setState(() => _draftIndex = null),
              ),
              const SizedBox(height: Space.md),
              _TapRow(
                icon: Icons.category_outlined,
                label: l10n.inFieldType,
                value: incidentTypeLabel(l10n, _type),
                onTap: () => unawaited(_pickType()),
              ),
              const SizedBox(height: Space.md),
              EvidenceStrip(
                fileIds: _photos,
                canAdd: true,
                onAdded: (id) async {
                  if (!mounted) return;
                  setState(() => _photos.add(id));
                },
              ),
            ],
          ),
          _Card(
            title: l10n.inFormWhere,
            children: [
              Text(l10n.inFieldSite, style: theme.textTheme.labelLarge),
              const SizedBox(height: Space.xs),
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.xs,
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
              const SizedBox(height: Space.md),
              _TapRow(
                icon: Icons.map_outlined,
                label: l10n.inFieldZone,
                value: incidentZoneLabel(l10n, _zone),
                onTap: () => unawaited(_pickZone(zones)),
              ),
              const SizedBox(height: Space.sm),
              _TapRow(
                icon: Icons.schedule_outlined,
                label: l10n.inFieldWhen,
                value: DateFmt.dateTime(_when, lang),
                action: l10n.inChangeTime,
                onTap: () => unawaited(_pickWhen()),
              ),
              const SizedBox(height: Space.sm),
              _TapRow(
                icon: _lat != null
                    ? Icons.gps_fixed
                    : Icons.my_location_outlined,
                label: l10n.inGps,
                value: _lat == null ? siteLabel : l10n.inGpsOn,
                onTap: () => unawaited(_pinLocation()),
              ),
            ],
          ),
          _Card(
            title: l10n.inFormHowBad,
            children: [
              _Scale(
                label: l10n.inSevScale,
                word: _sevWord(l10n, _sev),
                value: _sev,
                onChanged: (n) => setState(() => _sev = n),
              ),
              _Scale(
                label: l10n.inLikeScale,
                word: _likeWord(l10n, _like),
                value: _like,
                onChanged: (n) => setState(() => _like = n),
              ),
              StatusPill(
                label: incidentRiskLabel(l10n, scored.$2),
                tone: incidentRiskTone(scored.$2),
              ),
              if (serious) ...[
                const SizedBox(height: Space.sm),
                Text(
                  l10n.inRiskAlert,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ],
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

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.lg),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Space.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.titleSmall),
              const SizedBox(height: Space.md),
              ...children,
            ],
          ),
        ),
      ),
    );
  }
}

class _TapRow extends StatelessWidget {
  const _TapRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
    this.action,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  final String? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(Radii.md),
      onTap: onTap,
      child: Ink(
        padding: const EdgeInsets.symmetric(
          horizontal: Space.md,
          vertical: Space.md,
        ),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(Radii.md),
          border: Border.all(color: cs.outlineVariant),
        ),
        child: Row(
          children: [
            Icon(icon, color: cs.onSurfaceVariant),
            const SizedBox(width: Space.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                  Text(
                    value,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            if (action != null)
              Text(action!, style: theme.textTheme.labelLarge)
            else
              Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

class _Scale extends StatelessWidget {
  const _Scale({
    required this.label,
    required this.word,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final String word;
  final int value;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: Text(label, style: theme.textTheme.labelLarge)),
            Text(
              word,
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        Slider(
          value: value.toDouble(),
          min: 1,
          max: 5,
          divisions: 4,
          label: word,
          onChanged: (v) => onChanged(v.round()),
        ),
      ],
    );
  }
}
