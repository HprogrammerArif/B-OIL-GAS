import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:bogcl_oneops/features/files/presentation/evidence_strip.dart';
import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_providers.dart';
import 'package:bogcl_oneops/features/parcels/presentation/parcel_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The small forms behind each parcel action. Each returns the request body
/// to send, or null when cancelled.
enum ParcelSheet {
  dispatch,
  checkpoint,
  returnCheckpoint,
  gateIn,
  verify,
  flag,
  returnBack,
  exception,
  note,
}

Future<Map<String, Object?>?> showParcelSheet(
  BuildContext context, {
  required ParcelSheet kind,
  required Parcel parcel,
}) => showModalBottomSheet<Map<String, Object?>>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  builder: (_) => _Sheet(kind: kind, parcel: parcel),
);

class _Sheet extends ConsumerStatefulWidget {
  const _Sheet({required this.kind, required this.parcel});

  final ParcelSheet kind;
  final Parcel parcel;

  @override
  ConsumerState<_Sheet> createState() => _SheetState();
}

class _SheetState extends ConsumerState<_Sheet> {
  final _seal = TextEditingController();
  final _location = TextEditingController();
  final _note = TextEditingController();
  final _otp = TextEditingController();
  final _receivedBy = TextEditingController();
  Person? _courier;
  String? _photoId;
  String _reason = 'TAMPER_BROKEN';
  String _exceptionKind = 'LOST';
  bool _sealIntact = true;
  String? _error;

  String _returnPick = parcelReturnReasons.first;

  @override
  void dispose() {
    _seal.dispose();
    _location.dispose();
    _note.dispose();
    _otp.dispose();
    _receivedBy.dispose();
    super.dispose();
  }

  bool get _photoNeeded => switch (widget.kind) {
    ParcelSheet.flag => true,
    ParcelSheet.gateIn => !_sealIntact,
    ParcelSheet.exception => _exceptionKind == 'DAMAGED',
    ParcelSheet.verify =>
      widget.parcel.status == 'OUT_FOR_DELIVERY' &&
          widget.parcel.me.photoRequiredForDelivery,
    _ => false,
  };

  bool get _photoOffered => _photoNeeded || widget.kind == ParcelSheet.verify;

  void _confirm() {
    final l10n = context.l10n;
    final note = _note.text.trim();
    String? problem;
    Map<String, Object?>? body;
    switch (widget.kind) {
      case ParcelSheet.dispatch:
        if (_courier == null) {
          problem = l10n.pcErrCourier;
        } else if (widget.parcel.me.sealRequired && _seal.text.trim().isEmpty) {
          problem = l10n.pcErrSeal;
        } else {
          body = {
            'courierUserId': _courier!.userId,
            if (_seal.text.trim().isNotEmpty) 'sealNo': _seal.text.trim(),
          };
        }
      case ParcelSheet.checkpoint || ParcelSheet.returnCheckpoint:
        if (_location.text.trim().length < 2) {
          problem = l10n.pcErrLocation;
        } else {
          body = {
            'location': _location.text.trim(),
            'sealIntact': true,
            if (note.isNotEmpty) 'note': note,
          };
        }
      case ParcelSheet.gateIn:
        if (!_sealIntact && note.length < 10) {
          problem = l10n.pcErrProblemNote;
        } else if (!_sealIntact && _photoId == null) {
          problem = l10n.pcErrPhotoNeeded;
        } else {
          body = {
            'sealIntact': _sealIntact,
            if (note.isNotEmpty) 'note': note,
            'photoFileId': ?_photoId,
          };
        }
      case ParcelSheet.verify:
        if (_otp.text.trim().length != 6) {
          problem = l10n.pcErrCode;
        } else if (_photoNeeded && _photoId == null) {
          problem = l10n.pcErrPhotoNeeded;
        } else {
          body = {
            'otp': _otp.text.trim(),
            if (_receivedBy.text.trim().length >= 2)
              'receivedByName': _receivedBy.text.trim(),
            'photoFileId': ?_photoId,
          };
        }
      case ParcelSheet.flag:
        if (note.length < 10) {
          problem = l10n.pcErrProblemNote;
        } else if (_photoId == null) {
          problem = l10n.pcErrPhotoNeeded;
        } else {
          body = {'reason': _reason, 'note': note, 'photoFileId': _photoId};
        }
      case ParcelSheet.returnBack:
        if (note.length < 20) {
          problem = l10n.pcErrExceptionNote;
        } else {
          body = {'reason': _returnPick, 'details': note};
        }
      case ParcelSheet.exception:
        if (note.length < 20) {
          problem = l10n.pcErrExceptionNote;
        } else if (_photoNeeded && _photoId == null) {
          problem = l10n.pcErrPhotoNeeded;
        } else {
          body = {
            'status': _exceptionKind,
            'note': note,
            'photoFileId': ?_photoId,
          };
        }
      case ParcelSheet.note:
        if (note.isEmpty) {
          problem = l10n.pcErrNote;
        } else {
          body = {'note': note};
        }
    }
    if (body == null) {
      setState(() => _error = problem);
      return;
    }
    Navigator.of(context).pop(body);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final k = widget.kind;
    final (title, intro, confirm, destructive) = switch (k) {
      ParcelSheet.dispatch => (
        l10n.pcSheetDispatch,
        l10n.pcSheetDispatchHelp,
        l10n.pcActDispatch,
        false,
      ),
      ParcelSheet.checkpoint => (
        l10n.pcSheetCheckpoint,
        l10n.pcSheetCheckpointHelp,
        l10n.pcActCheckpoint,
        false,
      ),
      ParcelSheet.returnCheckpoint => (
        l10n.pcSheetCheckpoint,
        l10n.pcSheetReturnCheckpointHelp,
        l10n.pcActCheckpoint,
        false,
      ),
      ParcelSheet.gateIn => (
        l10n.pcSheetGateIn,
        l10n.pcSheetGateInHelp,
        _sealIntact ? l10n.pcActGateIn : l10n.pcActReportProblem,
        !_sealIntact,
      ),
      ParcelSheet.verify => (
        l10n.pcSheetVerify,
        widget.parcel.status == 'RETURN_IN_TRANSIT'
            ? l10n.pcSheetVerifyReturnHelp
            : l10n.pcSheetVerifyHelp,
        l10n.pcActConfirmCode,
        false,
      ),
      ParcelSheet.flag => (
        l10n.pcSheetFlag,
        l10n.pcSheetFlagHelp,
        l10n.pcActReportProblem,
        true,
      ),
      ParcelSheet.returnBack => (
        l10n.pcSheetReturn,
        l10n.pcSheetReturnHelp(widget.parcel.sender.name),
        l10n.pcActReturn,
        true,
      ),
      ParcelSheet.exception => (
        l10n.pcSheetException,
        l10n.pcSheetExceptionHelp,
        l10n.pcActException,
        true,
      ),
      ParcelSheet.note => (
        l10n.pcSheetNote,
        l10n.pcSheetNoteHelp,
        l10n.pcActAddNote,
        false,
      ),
    };

    final couriers = k == ParcelSheet.dispatch
        ? ref.watch(parcelCouriersProvider)
        : null;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        Space.lg,
        0,
        Space.lg,
        MediaQuery.viewInsetsOf(context).bottom + Space.lg,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.titleLarge),
            const SizedBox(height: Space.xs),
            Text(intro, style: theme.textTheme.bodyMedium),
            const SizedBox(height: Space.md),
            if (k == ParcelSheet.dispatch) ...[
              Text(l10n.pcFieldCourier, style: theme.textTheme.labelLarge),
              couriers!.when(
                loading: () => const Padding(
                  padding: EdgeInsets.all(Space.md),
                  child: LinearProgressIndicator(),
                ),
                error: (_, _) => Text(l10n.commonErrorMessage),
                data: (list) => RadioGroup<String>(
                  groupValue: _courier?.userId,
                  onChanged: (id) => setState(
                    () => _courier = list.firstWhere((c) => c.userId == id),
                  ),
                  child: Column(
                    children: [
                      for (final c in list)
                        RadioListTile<String>(
                          value: c.userId,
                          title: Text(c.display(bangla: context.isBangla)),
                          subtitle: c.title == null ? null : Text(c.title!),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: widget.parcel.me.sealRequired
                    ? l10n.pcFieldSealRequired
                    : l10n.pcFieldSeal,
                helper: widget.parcel.me.sealRequired ? l10n.pcSealWhy : null,
                controller: _seal,
                maxLength: 40,
              ),
            ],
            if (k == ParcelSheet.checkpoint ||
                k == ParcelSheet.returnCheckpoint) ...[
              AppTextField(
                label: l10n.pcFieldLocation,
                controller: _location,
                maxLength: 120,
              ),
              const SizedBox(height: Space.md),
            ],
            if (k == ParcelSheet.gateIn)
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.pcFieldSealIntact),
                subtitle: widget.parcel.sealNo == null
                    ? null
                    : Text(l10n.pcSealNo(widget.parcel.sealNo!)),
                value: _sealIntact,
                onChanged: (v) => setState(() => _sealIntact = v),
              ),
            if (k == ParcelSheet.flag)
              SegmentedButton<String>(
                segments: [
                  ButtonSegment(
                    value: 'TAMPER_BROKEN',
                    label: Text(l10n.pcReasonSeal),
                  ),
                  ButtonSegment(
                    value: 'DAMAGED_CONTENTS',
                    label: Text(l10n.pcReasonDamaged),
                  ),
                ],
                selected: {_reason},
                onSelectionChanged: (s) => setState(() => _reason = s.first),
              ),
            if (k == ParcelSheet.returnBack)
              Wrap(
                spacing: Space.sm,
                runSpacing: Space.xs,
                children: [
                  for (final r in parcelReturnReasons)
                    FilterChip(
                      visualDensity: VisualDensity.compact,
                      label: Text(parcelReturnReasonLabel(l10n, r)),
                      selected: _returnPick == r,
                      onSelected: (_) => setState(() {
                        _returnPick = r;
                        _note.text = parcelReturnReasonLabel(l10n, r);
                      }),
                    ),
                ],
              ),
            if (k == ParcelSheet.exception)
              SegmentedButton<String>(
                segments: [
                  ButtonSegment(value: 'LOST', label: Text(l10n.pcStatusLost)),
                  ButtonSegment(
                    value: 'DAMAGED',
                    label: Text(l10n.pcStatusDamaged),
                  ),
                ],
                selected: {_exceptionKind},
                onSelectionChanged: (s) =>
                    setState(() => _exceptionKind = s.first),
              ),
            if (k == ParcelSheet.verify) ...[
              AppTextField(
                label: l10n.pcFieldCode,
                controller: _otp,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: l10n.pcFieldReceivedBy,
                controller: _receivedBy,
                maxLength: 120,
              ),
            ],
            if (k != ParcelSheet.dispatch && k != ParcelSheet.verify) ...[
              const SizedBox(height: Space.md),
              AppTextField(
                label: switch (k) {
                  ParcelSheet.flag ||
                  ParcelSheet.exception => l10n.pcFieldWhatHappened,
                  ParcelSheet.returnBack => l10n.pcReturnHint,
                  ParcelSheet.gateIn =>
                    _sealIntact
                        ? l10n.pcFieldNoteOptional
                        : l10n.pcFieldWhatHappened,
                  ParcelSheet.note => l10n.pcFieldNote,
                  _ => l10n.pcFieldNoteOptional,
                },
                controller: _note,
                maxLines: 3,
                maxLength: 500,
              ),
            ],
            if (_photoOffered) ...[
              const SizedBox(height: Space.sm),
              EvidenceStrip(
                fileIds: [?_photoId],
                canAdd: _photoId == null,
                max: 1,
                onAdded: (id) async {
                  if (!mounted) return;
                  setState(() => _photoId = id);
                },
              ),
            ],
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: Space.sm),
                child: Text(
                  _error!,
                  style: TextStyle(color: context.bogcl.danger),
                ),
              ),
            const SizedBox(height: Space.lg),
            if (destructive)
              PrimaryButton.danger(label: confirm, onPressed: _confirm)
            else
              PrimaryButton(label: confirm, onPressed: _confirm),
          ],
        ),
      ),
    );
  }
}
