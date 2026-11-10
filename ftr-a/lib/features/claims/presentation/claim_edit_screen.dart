import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/claims/data/claim_repository.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_line_sheet.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_providers.dart';
import 'package:bogcl_oneops/features/claims/presentation/claim_ui.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _claimPurposePresets = <(String, String)>[
  (
    'Official engineering inspection and technical audit at Keraniganj LPG Filling Plant.',
    'কেরানীগঞ্জ এলপিজি ফিলিং প্ল্যান্টে দাপ্তরিক ইঞ্জিনিয়ারিং পরিদর্শন ও কারিগরি অডিট।',
  ),
  (
    'Outstation tour to Chattogram Terminal for bulk LPG vessel discharge & logistics coordination.',
    'বাল্ক এলপিজি ভেসেল ডিসচার্জ ও লজিস্টিকস সমন্বয়ের জন্য চট্টগ্রাম টার্মিনালে দাপ্তরিক সফর।',
  ),
  (
    'Local conveyance for regulatory filings at Petrobangla, BERC, and Department of Explosives.',
    'পেট্রোবাংলা, বিইআরসি এবং বিস্ফোরক পরিদপ্তরে দাপ্তরিক নথি দাখিলের স্থানীয় যাতায়াত।',
  ),
  (
    'Field distribution dealer inspection and safety compliance visit in Dhaka Metro zone.',
    'ঢাকা মেট্রো অঞ্চলে ডিলার পরিদর্শন এবং নিরাপত্তা কমপ্লায়েন্স সফর।',
  ),
];

/// Create ([id] null, [type] given) or edit a draft/returned claim.
class ClaimEditScreen extends ConsumerWidget {
  const ClaimEditScreen({this.id, this.type, super.key});

  final String? id;
  final ClaimType? type;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final policy = ref.watch(claimPolicyProvider);
    final existing = id == null ? null : ref.watch(claimDetailProvider(id!));
    final failed = policy.hasError || (existing?.hasError ?? false);
    final ready = policy.hasValue && (existing == null || existing.hasValue);
    return Scaffold(
      appBar: AppBar(
        title: Text(id == null ? l10n.claimNewTitle : l10n.claimEditTitle),
      ),
      body: failed
          ? ErrorState(
              onRetry: () => ref
                ..invalidate(claimPolicyProvider)
                ..invalidate(claimDetailProvider),
            )
          : !ready
          ? const SkeletonList(itemCount: 4)
          : _Form(
              policy: policy.requireValue,
              claim: existing?.requireValue,
              type: existing?.requireValue.type ?? type ?? ClaimType.tada,
            ),
    );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({required this.policy, required this.type, this.claim});

  final ClaimPolicyInfo policy;
  final Claim? claim;
  final ClaimType type;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  final _formKey = GlobalKey<FormState>();
  final _purpose = TextEditingController();
  final _place = TextEditingController();
  DateTime? _periodStart;
  DateTime? _periodEnd;
  DateTime? _depart;
  DateTime? _return;
  String _destination = 'DHAKA';
  String? _mode;
  String? _advanceId;
  List<ClaimLine> _lines = [];
  bool _saving = false;
  bool _showErrors = false;
  String? _error;

  ClaimType get _type => widget.type;
  bool get _isConveyance => _type == ClaimType.conveyance;

  List<String> get _receiptIds => [
    for (final l in _lines)
      if (l.receiptFileId != null) l.receiptFileId!,
  ];

  @override
  void initState() {
    super.initState();
    final c = widget.claim;
    if (c == null) return;
    _purpose.text = c.purpose;
    _lines = [
      for (final l in c.lines)
        if (!l.system) l,
    ];
    if (_isConveyance) {
      _periodStart = c.periodStart == null
          ? null
          : DateTime.parse(c.periodStart!);
      _periodEnd = c.periodEnd == null ? null : DateTime.parse(c.periodEnd!);
    } else {
      _depart = c.departAt == null ? null : Dhaka.wall(c.departAt!);
      _return = c.returnAt == null ? null : Dhaka.wall(c.returnAt!);
      _destination = c.destination ?? 'DHAKA';
      _place.text = c.destinationName ?? '';
      _mode = c.travelMode;
      _advanceId = c.advance?.id;
    }
  }

  @override
  void dispose() {
    _purpose.dispose();
    _place.dispose();
    super.dispose();
  }

  DateTime get _today => Dhaka.today();

  DateTime _utcOf(DateTime wall) => DateTime.utc(
    wall.year,
    wall.month,
    wall.day,
    wall.hour,
    wall.minute,
  ).subtract(Dhaka.offset);

  /// Range lines may fall in.
  (DateTime, DateTime) get _lineRange {
    if (_isConveyance) {
      final s = _periodStart ?? _today.subtract(const Duration(days: 30));
      return (s, _periodEnd ?? _today);
    }
    final s = _depart == null
        ? _today.subtract(const Duration(days: 60))
        : DateTime(_depart!.year, _depart!.month, _depart!.day);
    final e = _return == null
        ? _today
        : DateTime(_return!.year, _return!.month, _return!.day);
    return (s, e.isBefore(s) ? s : e);
  }

  Future<void> _pickPeriod({required bool start}) async {
    final first = _today.subtract(const Duration(days: 62));
    final initial = (start ? _periodStart : _periodEnd) ?? _today;
    final d = await showDatePicker(
      context: context,
      initialDate: initial.isAfter(_today) ? _today : initial,
      firstDate: start ? first : (_periodStart ?? first),
      lastDate: _today,
    );
    if (d == null) return;
    setState(() {
      if (start) {
        _periodStart = d;
        if (_periodEnd == null || _periodEnd!.isBefore(d)) _periodEnd = d;
      } else {
        _periodEnd = d;
      }
    });
  }

  Future<void> _pickMoment({required bool depart}) async {
    final first = _today.subtract(const Duration(days: 62));
    final current = (depart ? _depart : _return) ?? Dhaka.now();
    final d = await showDatePicker(
      context: context,
      initialDate: current.isAfter(_today) ? _today : current,
      firstDate: depart ? first : (_depart ?? first),
      lastDate: _today,
    );
    if (d == null || !mounted) return;
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(current),
    );
    if (t == null) return;
    setState(() {
      final v = DateTime(d.year, d.month, d.day, t.hour, t.minute);
      if (depart) {
        _depart = v;
        if (_return != null && !_return!.isAfter(v)) _return = null;
      } else {
        _return = v;
      }
    });
  }

  Future<void> _editLine([int? index]) async {
    final (first, last) = _lineRange;
    final line = await showClaimLineSheet(
      context,
      type: _type,
      policy: widget.policy,
      firstDate: first,
      lastDate: last,
      existing: index == null ? null : _lines[index],
    );
    if (line == null) return;
    setState(() {
      if (index == null) {
        _lines = [..._lines, line];
      } else {
        _lines = [..._lines]..[index] = line;
      }
    });
  }

  bool get _datesOk => _isConveyance
      ? _periodStart != null && _periodEnd != null
      : _depart != null && _return != null && _return!.isAfter(_depart!);

  bool get _isReady => _purpose.text.trim().length >= 3 && _datesOk;

  Map<String, Object?> _body() => {
    'type': _type.wire,
    'purpose': _purpose.text.trim(),
    if (_isConveyance) ...{
      'periodStart': dateKey(_periodStart!),
      'periodEnd': dateKey(_periodEnd!),
    } else ...{
      'departAt': _utcOf(_depart!).toIso8601String(),
      'returnAt': _utcOf(_return!).toIso8601String(),
      'destination': _destination,
      if (_place.text.trim().isNotEmpty) 'destinationName': _place.text.trim(),
      'travelMode': ?_mode,
      'advanceId': ?(_type == ClaimType.tourEvent ? _advanceId : null),
    },
    'lines': [for (final l in _lines) l.toJson()],
  };

  Future<void> _save() async {
    final l10n = context.l10n;
    setState(() {
      _showErrors = true;
      _error = null;
    });
    if (!_formKey.currentState!.validate() || !_datesOk) return;
    setState(() => _saving = true);
    try {
      final saved = await ref
          .read(claimRepositoryProvider)
          .save(id: widget.claim?.id, body: _body());
      ref
        ..invalidate(claimsProvider)
        ..invalidate(claimDetailProvider(saved.id))
        ..invalidate(advancesProvider)
        ..invalidate(claimPolicyProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.claimSaved, tone: StatusTone.success);
      if (widget.claim == null) {
        context.pushReplacement(AppRoutes.claimDetail(saved.id));
      } else {
        context.pop();
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = switch (e.code) {
          ApiErrorCode.offline || ApiErrorCode.timeout => l10n.claimErrOffline,
          _ => l10n.claimErrSave,
        };
      });
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
    final lang = Localizations.localeOf(context).languageCode;
    final total = _lines.fold<double>(0, (s, l) => s + l.amount);
    final advances = _type == ClaimType.tourEvent
        ? ref.watch(advancesProvider('mine')).value
        : null;
    final openAdvances = [
      for (final a in advances ?? const <Advance>[])
        if (a.open || a.id == _advanceId) a,
    ];

    return Column(
      children: [
        Expanded(
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                Space.md,
                Space.sm,
                Space.md,
                Space.lg,
              ),
              children: [
                _Card(
                  title: l10n.claimFormWhy,
                  children: [
                    EnterpriseTemplateDropdown(
                      presets: _claimPurposePresets,
                      controller: _purpose,
                      onPicked: () => setState(() {}),
                    ),
                    const SizedBox(height: Space.sm),
                    AppTextField(
                      label: l10n.claimFieldPurpose,
                      controller: _purpose,
                      required: true,
                      maxLength: 200,
                      maxLines: 2,
                      onChanged: (_) => setState(() {}),
                      validator: (v) => (v ?? '').trim().length < 3
                          ? l10n.claimErrPurpose
                          : null,
                    ),
                    if (_type == ClaimType.tourEvent &&
                        openAdvances.isNotEmpty) ...[
                      const SizedBox(height: Space.md),
                      EnterpriseDropdownField<String?>(
                        label: l10n.claimFieldAdvance,
                        icon: Icons.account_balance_wallet_outlined,
                        value: _advanceId,
                        items: [
                          DropdownMenuItem<String?>(
                            child: Text(l10n.claimAdvanceNone),
                          ),
                          for (final a in openAdvances)
                            DropdownMenuItem(
                              value: a.id,
                              child: Text(
                                '${bdt(a.amount, bangla: bangla)} · ${a.advanceNo}',
                              ),
                            ),
                        ],
                        onChanged: (v) => setState(() => _advanceId = v),
                      ),
                    ],
                  ],
                ),
                _Card(
                  title: l10n.claimFormWhen,
                  children: [
                    if (_isConveyance) ...[
                      Row(
                        children: [
                          Expanded(
                            child: EnterpriseDateTile(
                              label: l10n.claimFieldPeriodFrom,
                              valueText: _periodStart == null
                                  ? '—'
                                  : DateFmt.range(
                                      dateKey(_periodStart!),
                                      dateKey(_periodStart!),
                                      lang,
                                    ),
                              errorText: _showErrors && _periodStart == null
                                  ? l10n.claimErrDates
                                  : null,
                              onTap: () => unawaited(_pickPeriod(start: true)),
                            ),
                          ),
                          const SizedBox(width: Space.sm),
                          Expanded(
                            child: EnterpriseDateTile(
                              label: l10n.claimFieldPeriodTo,
                              valueText: _periodEnd == null
                                  ? '—'
                                  : DateFmt.range(
                                      dateKey(_periodEnd!),
                                      dateKey(_periodEnd!),
                                      lang,
                                    ),
                              errorText: _showErrors && _periodEnd == null
                                  ? l10n.claimErrDates
                                  : null,
                              onTap: () => unawaited(_pickPeriod(start: false)),
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      EnterpriseDateTile(
                        label: l10n.claimFieldDepart,
                        valueText: _depart == null
                            ? '—'
                            : DateFmt.dateTime(_utcOf(_depart!), lang),
                        icon: Icons.flight_takeoff_outlined,
                        errorText: _showErrors && _depart == null
                            ? l10n.claimErrDates
                            : null,
                        onTap: () => unawaited(_pickMoment(depart: true)),
                      ),
                      const SizedBox(height: Space.sm),
                      EnterpriseDateTile(
                        label: l10n.claimFieldReturn,
                        valueText: _return == null
                            ? '—'
                            : DateFmt.dateTime(_utcOf(_return!), lang),
                        icon: Icons.flight_land_outlined,
                        errorText: _showErrors && !_datesOk && _depart != null
                            ? l10n.claimErrDates
                            : null,
                        onTap: () => unawaited(_pickMoment(depart: false)),
                      ),
                      const SizedBox(height: Space.sm),
                      EnterpriseDropdownField<String>(
                        label: l10n.claimFieldDestination,
                        icon: Icons.location_city_outlined,
                        value: _destination,
                        items: [
                          DropdownMenuItem(
                            value: 'DHAKA',
                            child: Text(l10n.claimDestDhaka),
                          ),
                          DropdownMenuItem(
                            value: 'OTHER',
                            child: Text(l10n.claimDestOther),
                          ),
                        ],
                        onChanged: (v) =>
                            setState(() => _destination = v ?? _destination),
                      ),
                      const SizedBox(height: Space.sm),
                      EnterpriseDropdownField<String?>(
                        label: l10n.claimFieldMode,
                        icon: Icons.commute_outlined,
                        value: _mode,
                        items: [
                          DropdownMenuItem<String?>(
                            child: Text(l10n.claimModeNone),
                          ),
                          for (final m in widget.policy.allowedTravelModes)
                            DropdownMenuItem(
                              value: m,
                              child: Text(travelModeLabel(l10n, m)),
                            ),
                        ],
                        onChanged: (v) => setState(() => _mode = v),
                      ),
                      const SizedBox(height: Space.md),
                      AppTextField(
                        label: l10n.claimFieldDestination,
                        controller: _place,
                        maxLength: 80,
                      ),
                    ],
                  ],
                ),
                _Card(
                  title: l10n.claimFormLines,
                  children: [
                    Align(
                      alignment: AlignmentDirectional.centerEnd,
                      child: TextButton.icon(
                        onPressed: () => unawaited(_editLine()),
                        icon: const Icon(Icons.add, size: 18),
                        label: Text(l10n.claimLineAdd),
                      ),
                    ),
                    if (_lines.isEmpty)
                      Text(
                        l10n.claimNoLinesYet,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      )
                    else
                      for (final (i, l) in _lines.indexed)
                        Dismissible(
                          key: ValueKey('${l.id}_$i'),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: AlignmentDirectional.centerEnd,
                            padding: const EdgeInsets.symmetric(
                              horizontal: Space.lg,
                            ),
                            color: context.bogcl.danger,
                            child: const Icon(
                              Icons.delete_outline,
                              color: Colors.white,
                            ),
                          ),
                          onDismissed: (_) =>
                              setState(() => _lines = [..._lines]..removeAt(i)),
                          child: ListRow(
                            title: l.category == 'MILEAGE'
                                ? '${claimCategoryLabel(l10n, l.category)} · '
                                      '${l10n.claimKm(l.distanceKm!.toStringAsFixed(0))}'
                                : '${claimCategoryLabel(l10n, l.category)} · '
                                      '${bdt(l.amount, bangla: bangla)}',
                            subtitle: [
                              DateFmt.range(l.date, l.date, lang),
                              if (l.description.isNotEmpty) l.description,
                            ].join(' · '),
                            trailing: const Icon(Icons.edit_outlined, size: 18),
                            onTap: () => unawaited(_editLine(i)),
                          ),
                        ),
                    if (_receiptIds.isNotEmpty) ...[
                      const SizedBox(height: Space.md),
                      EvidenceStrip(fileIds: _receiptIds),
                    ],
                    if (_lines.isNotEmpty) ...[
                      const SizedBox(height: Space.sm),
                      Text(
                        l10n.claimEnteredTotal(bdt(total, bangla: bangla)),
                        style: theme.textTheme.titleMedium,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
        EnterpriseFormBottomBar(
          primaryLabel: l10n.claimSaveDraft,
          primaryIcon: Icons.save_outlined,
          loading: _saving,
          isReady: _isReady,
          errorMessage: _error,
          onPrimaryPressed: () => unawaited(_save()),
        ),
      ],
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
      padding: const EdgeInsets.only(bottom: Space.md),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.titleSmall),
              const SizedBox(height: Space.sm),
              ...children,
            ],
          ),
        ),
      ),
    );
  }
}
