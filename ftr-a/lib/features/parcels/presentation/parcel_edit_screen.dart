import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/parcels/data/parcel_repository.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_providers.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_ui.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

const _handlings = ['FRAGILE', 'COLD_CHAIN', 'HAZMAT', 'KEEP_UPRIGHT'];

/// Send a parcel (or fix one that has not been handed over yet).
class ParcelEditScreen extends ConsumerWidget {
  const ParcelEditScreen({this.id, super.key});

  final String? id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = this.id;
    if (id == null) return const _Form();
    return ref
        .watch(parcelDetailProvider(id))
        .when(
          loading: () => Scaffold(
            appBar: AppBar(),
            body: const SkeletonList(),
          ),
          error: (_, _) => Scaffold(
            appBar: AppBar(),
            body: ErrorState(
              onRetry: () => ref.invalidate(parcelDetailProvider(id)),
            ),
          ),
          data: (p) => _Form(parcel: p),
        );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({this.parcel});

  final Parcel? parcel;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  late final _description = TextEditingController(
    text: widget.parcel?.description,
  );
  late final _value = TextEditingController(
    text: widget.parcel?.declaredValue?.round().toString(),
  );
  late final _weight = TextEditingController(
    text: widget.parcel?.weightKg?.toString(),
  );
  late final _waybill = TextEditingController(text: widget.parcel?.waybillNo);
  late String _category = widget.parcel?.category ?? 'GENERAL';
  late String _urgency = widget.parcel?.urgency ?? 'NORMAL';
  late bool _confidential = widget.parcel?.isConfidential ?? false;
  late final Set<String> _handling = {...?widget.parcel?.specialHandling};
  late Person? _recipient = widget.parcel?.recipient;
  late String? _recipientWhere = widget.parcel?.dest.label(
    bangla: context.isBangla,
  );
  Map<String, String> _errors = {};
  bool _saving = false;

  @override
  void dispose() {
    _description.dispose();
    _value.dispose();
    _weight.dispose();
    _waybill.dispose();
    super.dispose();
  }

  bool get _forcedConfidential => const {
    'CONFIDENTIAL',
    'LEGAL_DOCS',
    'TENDER_BID',
  }.contains(_category);

  Future<void> _pickRecipient() async {
    final pick = await showPersonPicker(
      context,
      title: context.l10n.pcFieldRecipient,
    );
    if (pick == null || !mounted) return;
    setState(() {
      _recipient = pick.person;
      _recipientWhere = pick.where(bangla: context.isBangla);
    });
  }

  Future<void> _save() async {
    final l10n = context.l10n;
    final errors = <String, String>{};
    if (_description.text.trim().length < 5) {
      errors['description'] = l10n.pcErrDescription;
    }
    if (_recipient == null) errors['recipient'] = l10n.pcErrRecipient;
    final value = _value.text.trim().isEmpty
        ? null
        : double.tryParse(_value.text.trim());
    if (_value.text.trim().isNotEmpty && value == null) {
      errors['value'] = l10n.pcErrNumber;
    }
    final weight = _weight.text.trim().isEmpty
        ? null
        : double.tryParse(_weight.text.trim());
    if (_weight.text.trim().isNotEmpty && (weight == null || weight <= 0)) {
      errors['weight'] = l10n.pcErrNumber;
    }
    if (_waybill.text.trim().isNotEmpty && _waybill.text.trim().length < 3) {
      errors['waybill'] = l10n.pcErrWaybill;
    }
    if (errors.isNotEmpty) {
      setState(() => _errors = errors);
      return;
    }
    setState(() {
      _errors = {};
      _saving = true;
    });
    try {
      final saved = await ref
          .read(parcelRepositoryProvider)
          .save(
            id: widget.parcel?.id,
            body: {
              'category': _category,
              'description': _description.text.trim(),
              'urgency': _urgency,
              'recipientUserId': _recipient!.userId,
              'declaredValue': value,
              'weightKg': weight,
              'waybillNo': _waybill.text.trim().isEmpty
                  ? null
                  : _waybill.text.trim(),
              'specialHandling': _handling.toList(),
              'isConfidential': _confidential || _forcedConfidential,
            },
          );
      ref
        ..invalidate(parcelsProvider)
        ..invalidate(parcelDetailProvider);
      if (!mounted) return;
      AppToast.show(
        context,
        widget.parcel == null ? l10n.pcDoneCreate : l10n.pcDoneEdit,
        tone: StatusTone.success,
      );
      if (widget.parcel == null) {
        context.pushReplacement(AppRoutes.parcelDetail(saved.id));
      } else {
        context.pop();
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      final fields = e.fieldErrors;
      if (fields.isNotEmpty) {
        setState(() => _errors = fields);
      } else {
        AppToast.show(
          context,
          e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
              ? l10n.claimErrOffline
              : l10n.pcErrFailed,
          tone: StatusTone.danger,
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final editing = widget.parcel != null;
    final recipient = _recipient;
    return Scaffold(
      appBar: AppBar(title: Text(editing ? l10n.pcEditTitle : l10n.pcSend)),
      body: ListView(
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Text(
            l10n.pcFormIntro,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: Space.lg),
          Text(l10n.pcFieldRecipient, style: theme.textTheme.labelLarge),
          const SizedBox(height: Space.xs),
          Card(
            child: ListTile(
              leading: const Icon(Icons.person_outline),
              title: Text(
                recipient == null
                    ? l10n.pcPickRecipient
                    : recipient.display(bangla: bangla),
              ),
              subtitle: recipient == null
                  ? (_errors['recipient'] == null
                        ? null
                        : Text(
                            _errors['recipient']!,
                            style: TextStyle(color: context.bogcl.danger),
                          ))
                  : Text(
                      [
                        ?recipient.title,
                        ?_recipientWhere,
                      ].join(' · '),
                    ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => unawaited(_pickRecipient()),
            ),
          ),
          const SizedBox(height: Space.md),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: InputDecoration(labelText: l10n.pcFieldCategory),
            items: [
              for (final c in parcelCategories)
                DropdownMenuItem(
                  value: c,
                  child: Text(parcelCategoryLabel(l10n, c)),
                ),
            ],
            onChanged: (v) => setState(() => _category = v ?? _category),
          ),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.pcFieldDescription,
            controller: _description,
            maxLines: 3,
            maxLength: 500,
            errorText: _errors['description'],
          ),
          const SizedBox(height: Space.md),
          Text(l10n.pcFieldUrgency, style: theme.textTheme.labelLarge),
          const SizedBox(height: Space.xs),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'NORMAL', label: Text(l10n.pcUrgNormal)),
              ButtonSegment(value: 'HIGH', label: Text(l10n.nsUrgHigh)),
              ButtonSegment(value: 'CRITICAL', label: Text(l10n.nsUrgCritical)),
            ],
            selected: {_urgency},
            onSelectionChanged: (s) => setState(() => _urgency = s.first),
          ),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.pcFieldValue,
            helper: l10n.pcValueHelp,
            controller: _value,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            errorText: _errors['value'] ?? _errors['declaredValue'],
          ),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.pcFieldWeight,
            controller: _weight,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            errorText: _errors['weight'] ?? _errors['weightKg'],
          ),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.pcFieldWaybill,
            controller: _waybill,
            maxLength: 40,
            errorText: _errors['waybill'] ?? _errors['waybillNo'],
          ),
          const SizedBox(height: Space.md),
          Text(l10n.pcFieldHandling, style: theme.textTheme.labelLarge),
          Wrap(
            spacing: Space.sm,
            children: [
              for (final h in _handlings)
                FilterChip(
                  label: Text(parcelHandlingLabel(l10n, h)),
                  selected: _handling.contains(h),
                  onSelected: (on) => setState(
                    () => on ? _handling.add(h) : _handling.remove(h),
                  ),
                ),
            ],
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.pcFieldConfidential),
            subtitle: Text(
              _forcedConfidential
                  ? l10n.pcConfidentialAuto
                  : l10n.pcConfidentialHelp,
            ),
            value: _confidential || _forcedConfidential,
            onChanged: _forcedConfidential
                ? null
                : (v) => setState(() => _confidential = v),
          ),
          const SizedBox(height: Space.lg),
          PrimaryButton(
            label: editing ? l10n.pcSaveChanges : l10n.pcCreate,
            loading: _saving,
            onPressed: () => unawaited(_save()),
          ),
        ],
      ),
    );
  }
}
