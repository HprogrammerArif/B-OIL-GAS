import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/offline/outbox_service.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/leave/data/leave_repository.dart';
import 'package:bogcl_oneops/features/leave/domain/leave_models.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_providers.dart';
import 'package:bogcl_oneops/features/leave/presentation/leave_ui.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

DateTime _day(DateTime d) => DateTime.utc(d.year, d.month, d.day);

/// Apply for leave, or fix a returned request ([id] set).
class LeaveApplyScreen extends ConsumerWidget {
  const LeaveApplyScreen({this.id, super.key});

  final String? id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final types = ref.watch(leaveTypesProvider);
    final policy = ref.watch(leavePolicyProvider);
    final balances = ref.watch(leaveBalancesProvider);
    final existing = id == null ? null : ref.watch(leaveDetailProvider(id!));
    final failed =
        types.hasError ||
        policy.hasError ||
        balances.hasError ||
        (existing?.hasError ?? false);
    final ready =
        types.hasValue &&
        policy.hasValue &&
        balances.hasValue &&
        (existing == null || existing.hasValue);
    return Scaffold(
      appBar: AppBar(
        title: Text(id == null ? l10n.leaveApply : l10n.leaveEditTitle),
      ),
      body: failed
          ? ErrorState(
              onRetry: () => ref
                ..invalidate(leaveTypesProvider)
                ..invalidate(leavePolicyProvider)
                ..invalidate(leaveBalancesProvider)
                ..invalidate(leaveDetailProvider),
            )
          : !ready
          ? const SkeletonList(itemCount: 4)
          : _Form(
              types: types.requireValue,
              policy: policy.requireValue,
              balances: balances.requireValue,
              existing: existing?.requireValue,
            ),
    );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({
    required this.types,
    required this.policy,
    required this.balances,
    this.existing,
  });

  final List<LeaveType> types;
  final LeavePolicyInfo policy;
  final List<LeaveBalance> balances;
  final LeaveRequestItem? existing;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  final _reason = TextEditingController();
  LeaveType? _type;
  DateTime? _start;
  DateTime? _end;
  HalfDay? _half;
  ({String id, String name, String mime})? _attachment;
  bool _uploading = false;
  bool _submitting = false;
  bool _touched = false;
  String? _serverError;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    if (e != null) {
      _type = widget.types.where((t) => t.id == e.type.id).firstOrNull;
      _start = DateTime.tryParse(e.startDate);
      _end = DateTime.tryParse(e.endDate);
      _half = e.halfDay;
      _reason.text = e.reason;
      if (e.attachmentFileId != null) {
        _attachment = (id: e.attachmentFileId!, name: '', mime: 'image/jpeg');
      }
      return;
    }
    _type =
        widget.types.where((t) => t.code == 'CL').firstOrNull ??
        widget.types.firstOrNull;
    final start = _nextBusinessDay(widget.policy, _day(Dhaka.today()));
    _start = start;
    _end = start;
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  DateTime get _today => _day(Dhaka.today());

  DateTime _nextBusinessDay(LeavePolicyInfo policy, DateTime from) {
    var d = from;
    for (var i = 0; i < 14 && !policy.isBusinessDay(d); i++) {
      d = d.add(const Duration(days: 1));
    }
    return d;
  }

  double _days() {
    final s = _start;
    final e = _end;
    if (s == null || e == null) return 0;
    if (_half != null) return 0.5;
    return widget.policy.businessDays(s, e).toDouble();
  }

  bool get _halfAllowed {
    final t = _type;
    return t != null &&
        t.halfDayAllowed &&
        _start != null &&
        _end != null &&
        dateKey(_start!) == dateKey(_end!);
  }

  String? _blocking(AppL10n l10n, String lang) {
    final type = _type;
    if (type == null || _start == null || _end == null) {
      return l10n.leaveFormNoWorkingDays;
    }
    final days = _days();
    if (days == 0) return l10n.leaveFormNoWorkingDays;
    if (type.code == 'CL' && days > widget.policy.maxConsecutiveCl) {
      return l10n.leaveFormClLimit(widget.policy.maxConsecutiveCl);
    }
    if (type.checksBalance) {
      final b = widget.balances.where((x) => x.type.id == type.id).firstOrNull;
      if (b != null && days > b.available) {
        return l10n.leaveFormBalanceShort(daysText(l10n, b.available, lang));
      }
    }
    if (_reason.text.trim().length < widget.policy.reasonMin) {
      return l10n.leaveFormReasonMin(widget.policy.reasonMin);
    }
    if (type.requiresDoc &&
        days > widget.policy.docRequiredAboveDays &&
        _attachment == null) {
      return l10n.leaveFormAttachRequired;
    }
    return null;
  }

  Future<void> _pickDate({required bool start}) async {
    final type = _type;
    if (type == null) return;
    final back = widget.policy.backdateTypes.contains(type.code)
        ? widget.policy.backdateDays
        : 0;
    final first = _today.subtract(Duration(days: back));
    final initial = (start ? _start : _end) ?? _today;
    final d = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(first) ? first : initial,
      firstDate: first,
      lastDate: _today.add(const Duration(days: 365)),
    );
    if (d == null) return;
    setState(() {
      if (start) {
        _start = _day(d);
        if (_end == null || _end!.isBefore(_start!)) _end = _start;
      } else {
        _end = _day(d);
        if (_start != null && _end!.isBefore(_start!)) _start = _end;
      }
      if (!_halfAllowed) _half = null;
    });
  }

  void _fill({required DateTime start, DateTime? end, HalfDay? half}) {
    setState(() {
      _start = start;
      _end = end ?? start;
      _half = half;
      if (!_halfAllowed) _half = null;
    });
  }

  Future<void> _attach() async {
    final l10n = context.l10n;
    final picked = await pickAttachment(context);
    if (picked == null || !mounted) return;
    setState(() => _uploading = true);
    try {
      final uploads = ref.read(uploadServiceProvider);
      final purpose = picked.mime.startsWith('image/') ? 'PHOTO' : 'DOCUMENT';
      final meta = await uploads.upload(picked, purpose: purpose);
      await uploads.awaitClean(meta.id);
      if (!mounted) return;
      setState(
        () => _attachment = (id: meta.id, name: picked.name, mime: picked.mime),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, switch (e.code) {
        ApiErrorCode.offline ||
        ApiErrorCode.timeout => l10n.uploadNeedsConnection,
        ApiErrorCode.forbidden => l10n.uploadBlocked,
        _ => l10n.uploadRejected,
      }, tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    final lang = Localizations.localeOf(context).languageCode;
    setState(() => _touched = true);
    final block = _blocking(l10n, lang);
    if (block != null) {
      AppToast.show(context, block, tone: StatusTone.warning);
      return;
    }
    final type = _type!;
    final start = dateKey(_start!);
    final end = dateKey(_end!);
    setState(() {
      _submitting = true;
      _serverError = null;
    });
    try {
      final result = await ref
          .read(leaveRepositoryProvider)
          .apply(
            id: widget.existing?.id,
            leaveTypeId: type.id,
            startDate: start,
            endDate: end,
            halfDay: _halfAllowed ? _half : null,
            reason: _reason.text.trim(),
            attachmentFileId: _attachment?.id,
            label: l10n.leaveQueueLabel(
              type.displayName(bangla: context.isBangla),
              DateFmt.range(start, end, lang),
            ),
          );
      ref
        ..invalidate(myLeaveRequestsProvider)
        ..invalidate(leaveRequestsProvider)
        ..invalidate(leaveBalancesProvider)
        ..invalidate(leaveDetailProvider);
      if (!mounted) return;
      AppToast.show(
        context,
        result is Queued ? l10n.leaveQueued : l10n.leaveSubmitted,
        tone: result is Queued ? StatusTone.info : StatusTone.success,
      );
      context.pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _serverError = switch (e.rule) {
          'INSUFFICIENT_BALANCE' => l10n.leaveErrInsufficient,
          'MAX_CONSECUTIVE_CL' => l10n.leaveFormClLimit(
            widget.policy.maxConsecutiveCl,
          ),
          'OVERLAP' => l10n.leaveErrOverlap,
          _ =>
            e.code == ApiErrorCode.conflict
                ? l10n.leaveErrOverlap
                : l10n.leaveErrFailed,
        };
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  List<String> _reasons(LeaveType? type, bool bangla) {
    final code = type?.code ?? 'CL';
    return switch (code) {
      'SL' => [
        if (bangla)
          'জ্বর ও মৌসুমি ভাইরাল সংক্রমণের কারণে বিশ্রাম প্রয়োজন।'
        else
          'Seasonal fever; rest advised.',
        if (bangla)
          'হাসপাতালে পরীক্ষা ও ডাক্তারের অ্যাপয়েন্টমেন্ট।'
        else
          'Hospital tests and a specialist appointment.',
      ],
      'EL' => [
        if (bangla)
          'পরিবারের সাথে বার্ষিক ভ্রমণ।'
        else
          'Annual family vacation.',
        if (bangla)
          'পারিবারিক অনুষ্ঠানের জন্য ঢাকার বাইরে।'
        else
          'Family ceremony out of Dhaka.',
      ],
      'ML' || 'PL' => [
        if (bangla)
          'নবজাতকের যত্ন ও পারিবারিক দায়িত্ব।'
        else
          'Care for a newborn.',
      ],
      _ => [
        if (bangla)
          'জরুরি পারিবারিক কাজের জন্য ছুটি।'
        else
          'Urgent personal and family work.',
        if (bangla)
          'ব্যাংক ও দাপ্তরিক ব্যক্তিগত কাজ।'
        else
          'Banking and personal errands.',
      ],
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final lang = Localizations.localeOf(context).languageCode;
    final type = _type;
    final days = _days();
    final bal = type == null
        ? null
        : widget.balances.where((x) => x.type.id == type.id).firstOrNull;
    final remaining = bal == null ? null : bal.available - days;
    final needDoc =
        type != null &&
        type.requiresDoc &&
        days > widget.policy.docRequiredAboveDays;
    final shownError = _touched
        ? _blocking(l10n, lang) ?? _serverError
        : _serverError;

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.md,
              Space.lg,
              Space.xxl,
            ),
            children: [
              _Card(
                children: [
                  EnterpriseDropdownField<String>(
                    label: l10n.leaveFormKind,
                    icon: Icons.event_available_outlined,
                    value: type?.id ?? widget.types.first.id,
                    items: [
                      for (final t in widget.types)
                        DropdownMenuItem(
                          value: t.id,
                          child: Text(t.displayName(bangla: bangla)),
                        ),
                    ],
                    onChanged: (id) {
                      final t = widget.types
                          .where((x) => x.id == id)
                          .firstOrNull;
                      if (t == null) return;
                      setState(() {
                        _type = t;
                        if (!t.requiresDoc) _attachment = null;
                        if (!t.halfDayAllowed) _half = null;
                      });
                    },
                  ),
                  if (days > 0) ...[
                    const SizedBox(height: Space.md),
                    Text(
                      [
                        l10n.leaveFormCounts(daysText(l10n, days, lang)),
                        if (remaining != null && remaining >= 0)
                          l10n.leaveFormRemain(daysText(l10n, remaining, lang)),
                      ].join(' · '),
                    ),
                  ],
                ],
              ),
              _Card(
                title: l10n.leaveFormWhen,
                children: [
                  Wrap(
                    spacing: Space.xs,
                    runSpacing: Space.xs,
                    children: [
                      FilterChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(l10n.leaveChipToday),
                        selected:
                            _start != null &&
                            _end != null &&
                            dateKey(_start!) == dateKey(_today) &&
                            dateKey(_end!) == dateKey(_today) &&
                            _half == null,
                        onSelected: (_) => _fill(start: _today),
                      ),
                      FilterChip(
                        visualDensity: VisualDensity.compact,
                        label: Text(l10n.leaveChipTomorrow),
                        selected:
                            _start != null &&
                            _end != null &&
                            dateKey(_start!) ==
                                dateKey(_today.add(const Duration(days: 1))) &&
                            dateKey(_end!) ==
                                dateKey(_today.add(const Duration(days: 1))),
                        onSelected: (_) {
                          final t = _nextBusinessDay(
                            widget.policy,
                            _today.add(const Duration(days: 1)),
                          );
                          _fill(start: t);
                        },
                      ),
                      if (type?.halfDayAllowed == true) ...[
                        FilterChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(l10n.leaveChipHalfAm),
                          selected: _half == HalfDay.first,
                          onSelected: (_) =>
                              _fill(start: _today, half: HalfDay.first),
                        ),
                        FilterChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(l10n.leaveChipHalfPm),
                          selected: _half == HalfDay.second,
                          onSelected: (_) =>
                              _fill(start: _today, half: HalfDay.second),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: Space.md),
                  Row(
                    children: [
                      Expanded(
                        child: ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(l10n.leaveFormFrom),
                          subtitle: Text(
                            _start == null
                                ? '—'
                                : DateFmt.range(
                                    dateKey(_start!),
                                    dateKey(_start!),
                                    lang,
                                  ),
                          ),
                          onTap: () => unawaited(_pickDate(start: true)),
                        ),
                      ),
                      Expanded(
                        child: ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(l10n.leaveFormTo),
                          subtitle: Text(
                            _end == null
                                ? '—'
                                : DateFmt.range(
                                    dateKey(_end!),
                                    dateKey(_end!),
                                    lang,
                                  ),
                          ),
                          onTap: () => unawaited(_pickDate(start: false)),
                        ),
                      ),
                    ],
                  ),
                  if (_halfAllowed)
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(l10n.leaveFormHalfDay),
                      subtitle: _half == null
                          ? null
                          : Text(halfDayLabel(l10n, _half!)),
                      value: _half != null,
                      onChanged: (v) => setState(() {
                        _half = v ? HalfDay.first : null;
                      }),
                    ),
                ],
              ),
              _Card(
                title: l10n.leaveFormWhy,
                children: [
                  AppTextField(
                    label: l10n.leaveFormReason,
                    hint: l10n.leaveFormReasonHint,
                    controller: _reason,
                    required: true,
                    maxLines: 3,
                    maxLength: widget.policy.reasonMax,
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: Space.sm),
                  Wrap(
                    spacing: Space.xs,
                    runSpacing: Space.xs,
                    children: [
                      for (final p in _reasons(type, bangla))
                        FilterChip(
                          visualDensity: VisualDensity.compact,
                          label: Text(
                            p,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          selected: _reason.text == p,
                          onSelected: (_) => setState(() => _reason.text = p),
                        ),
                    ],
                  ),
                  if (needDoc || _attachment != null) ...[
                    const SizedBox(height: Space.md),
                    Text(
                      l10n.leaveFormAttachment,
                      style: theme.textTheme.titleSmall,
                    ),
                    if (needDoc)
                      Text(
                        l10n.leaveFormAttachRequired,
                        style: theme.textTheme.bodySmall,
                      ),
                    const SizedBox(height: Space.sm),
                    if (_attachment != null &&
                        _attachment!.mime.startsWith('image/'))
                      EvidenceStrip(fileIds: [_attachment!.id], max: 1),
                    if (_attachment != null &&
                        !_attachment!.mime.startsWith('image/'))
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.attach_file),
                        title: Text(
                          _attachment!.name.isEmpty
                              ? l10n.leaveFormAttachment
                              : _attachment!.name,
                        ),
                      ),
                    if (_attachment == null)
                      PrimaryButton.secondary(
                        label: l10n.leaveFormAttach,
                        icon: Icons.attach_file,
                        loading: _uploading,
                        onPressed: _uploading
                            ? null
                            : () => unawaited(_attach()),
                      )
                    else
                      Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: IconButton(
                          tooltip: l10n.leaveFormRemove,
                          onPressed: () => setState(() => _attachment = null),
                          icon: const Icon(Icons.delete_outline),
                        ),
                      ),
                  ],
                ],
              ),
              if (shownError != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: Space.md),
                  child: Text(
                    shownError,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: context.bogcl.danger,
                    ),
                  ),
                ),
            ],
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(Space.lg),
            child: PrimaryButton(
              label: l10n.leaveFormSubmit,
              loading: _submitting,
              onPressed: _submitting ? null : () => unawaited(_submit()),
            ),
          ),
        ),
      ],
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.children, this.title});

  final String? title;
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
              if (title != null) ...[
                Text(title!, style: theme.textTheme.titleSmall),
                const SizedBox(height: Space.md),
              ],
              ...children,
            ],
          ),
        ),
      ),
    );
  }
}
