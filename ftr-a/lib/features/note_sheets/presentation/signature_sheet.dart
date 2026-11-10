import 'dart:async';
import 'dart:ui' as ui;

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/files/presentation/attachment_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// What the signer drew, typed or uploaded. The caller records the decision.
@immutable
class SignatureDraft {
  const SignatureDraft({
    required this.method,
    required this.otp,
    this.typedName,
    this.imageFileId,
    this.comment,
  });

  final String method;
  final String otp;
  final String? typedName;
  final String? imageFileId;
  final String? comment;

  Map<String, Object?> toJson() => {
    'method': method,
    'otp': otp,
    'typedName': ?typedName,
    'imageFileId': ?imageFileId,
  };
}

/// Pick how to sign, confirm with the one-time code, and return the draft.
/// Returns null when cancelled. Does not approve or return the file.
Future<SignatureDraft?> showSignatureCapture(
  BuildContext context, {
  required String title,
  required String subtitle,
  String? initialComment,
  bool reasonRequired = false,
  List<String> reasonPresets = const [],
  String? confirmLabel,
}) => showModalBottomSheet<SignatureDraft>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  builder: (_) => _SignatureSheet(
    title: title,
    subtitle: subtitle,
    initialComment: initialComment,
    reasonRequired: reasonRequired,
    reasonPresets: reasonPresets,
    confirmLabel: confirmLabel,
  ),
);

enum _Method { typed, drawn, stamp, uploaded }

class _SignatureSheet extends ConsumerStatefulWidget {
  const _SignatureSheet({
    required this.title,
    required this.subtitle,
    required this.reasonRequired,
    required this.reasonPresets,
    this.initialComment,
    this.confirmLabel,
  });

  final String title;
  final String subtitle;
  final String? initialComment;
  final bool reasonRequired;
  final List<String> reasonPresets;
  final String? confirmLabel;

  @override
  ConsumerState<_SignatureSheet> createState() => _SignatureSheetState();
}

class _SignatureSheetState extends ConsumerState<_SignatureSheet> {
  _Method _method = _Method.typed;
  late final _typed = TextEditingController(
    text: ref.read(sessionControllerProvider).value?.profile.employee.fullName,
  );
  final _otp = TextEditingController();
  late final _comment = TextEditingController(
    text: widget.initialComment ?? '',
  );
  final List<List<Offset>> _strokes = [];
  PickedFile? _uploaded;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _typed.dispose();
    _otp.dispose();
    _comment.dispose();
    super.dispose();
  }

  static const _padSize = Size(320, 160);

  Future<void> _pickSignatureImage() async {
    final picked = await pickAttachment(context);
    if (picked != null) {
      setState(() {
        _uploaded = picked;
        _error = null;
      });
    }
  }

  /// A phone photo is a JPEG. A signature upload must be a PNG under 1 MB.
  Future<Uint8List> _signaturePng(Uint8List source) async {
    const maxBytes = 1024 * 1024;
    var width = 800;
    while (true) {
      final png = await _pngAtWidth(source, width);
      if (png.lengthInBytes <= maxBytes || width <= 160) return png;
      width = (width * 0.6).round();
    }
  }

  Future<Uint8List> _pngAtWidth(Uint8List source, int maxWidth) async {
    var codec = await ui.instantiateImageCodec(source);
    var frame = await codec.getNextFrame();
    if (frame.image.width > maxWidth) {
      frame.image.dispose();
      codec.dispose();
      codec = await ui.instantiateImageCodec(source, targetWidth: maxWidth);
      frame = await codec.getNextFrame();
    }
    try {
      final data = await frame.image.toByteData(format: ui.ImageByteFormat.png);
      if (data == null) {
        throw const FormatException('Could not encode signature');
      }
      return data.buffer.asUint8List();
    } finally {
      frame.image.dispose();
      codec.dispose();
    }
  }

  Future<Uint8List> _renderPng() async {
    const scale = 2.0;
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder)..scale(scale);
    _paintStrokes(canvas, _strokes, const Color(0xFF111827));
    final image = await recorder.endRecording().toImage(
      (_padSize.width * scale).round(),
      (_padSize.height * scale).round(),
    );
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    return data!.buffer.asUint8List();
  }

  Future<void> _capture() async {
    final l10n = context.l10n;
    setState(() => _error = null);
    final typed = _typed.text.trim();
    if (_method == _Method.typed && typed.length < 2) {
      setState(() => _error = l10n.nsSignErrName);
      return;
    }
    if (_method == _Method.drawn && _strokes.isEmpty) {
      setState(() => _error = l10n.nsSignErrDraw);
      return;
    }
    if (_method == _Method.uploaded && _uploaded == null) {
      setState(() => _error = l10n.nsSignErrUpload);
      return;
    }
    final comment = _comment.text.trim();
    if (widget.reasonRequired && comment.length < 10) {
      setState(() => _error = l10n.nsSignErrReason);
      return;
    }
    if (_otp.text.trim().length != 6) {
      setState(() => _error = l10n.nsSignErrOtp);
      return;
    }
    setState(() => _busy = true);
    try {
      String? imageId;
      if (_method == _Method.drawn) {
        final uploads = ref.read(uploadServiceProvider);
        final meta = await uploads.upload(
          PickedFile(
            name: 'signature.png',
            bytes: await _renderPng(),
            mime: 'image/png',
          ),
          purpose: 'SIGNATURE',
        );
        await uploads.awaitClean(meta.id);
        imageId = meta.id;
      } else if (_method == _Method.uploaded) {
        final uploads = ref.read(uploadServiceProvider);
        final meta = await uploads.upload(
          PickedFile(
            name: 'signature.png',
            bytes: await _signaturePng(_uploaded!.bytes),
            mime: 'image/png',
          ),
          purpose: 'SIGNATURE',
        );
        await uploads.awaitClean(meta.id);
        imageId = meta.id;
      }
      if (!mounted) return;
      Navigator.of(context).pop(
        SignatureDraft(
          method: switch (_method) {
            _Method.typed => 'TYPED',
            _Method.drawn => 'DRAWN',
            _Method.stamp => 'STAMP',
            _Method.uploaded => 'UPLOADED',
          },
          otp: _otp.text.trim(),
          typedName: _method == _Method.typed ? typed : null,
          imageFileId: imageId,
          comment: comment.isEmpty ? null : comment,
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = switch (e.code) {
          ApiErrorCode.offline || ApiErrorCode.timeout => l10n.claimErrOffline,
          _ => l10n.nsSignErrFailed,
        };
      });
    } on Object catch (_) {
      if (!mounted) return;
      setState(() => _error = l10n.nsSignErrFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final profile = ref.watch(sessionControllerProvider).value?.profile;
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
            EnterpriseModalHeader(
              title: widget.title,
              subtitle: widget.subtitle,
              icon: Icons.draw_outlined,
            ),
            const SizedBox(height: Space.sm),
            SegmentedButton<_Method>(
              style: SegmentedButton.styleFrom(
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 2),
              ),
              segments: [
                ButtonSegment(
                  value: _Method.typed,
                  label: Text(
                    l10n.nsSignTyped,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
                ButtonSegment(
                  value: _Method.drawn,
                  label: Text(
                    l10n.nsSignDrawn,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
                ButtonSegment(
                  value: _Method.stamp,
                  label: Text(
                    l10n.nsSignStamp,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
                ButtonSegment(
                  value: _Method.uploaded,
                  label: Text(
                    l10n.nsSignUpload,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
              ],
              selected: {_method},
              onSelectionChanged: (s) => setState(() => _method = s.first),
            ),
            const SizedBox(height: Space.md),
            switch (_method) {
              _Method.typed => AppTextField(
                label: l10n.nsSignTypedLabel,
                controller: _typed,
                maxLength: 80,
              ),
              _Method.drawn => _Pad(
                strokes: _strokes,
                size: _padSize,
                onChanged: () => setState(() {}),
                clearLabel: l10n.nsSignClear,
                hint: l10n.nsSignDrawHint,
              ),
              _Method.stamp => Card(
                child: Padding(
                  padding: const EdgeInsets.all(Space.lg),
                  child: Column(
                    children: [
                      const Icon(Icons.verified_outlined, size: 36),
                      const SizedBox(height: Space.sm),
                      Text(
                        profile?.employee.fullName ?? '',
                        style: theme.textTheme.titleMedium,
                      ),
                      Text(
                        profile?.employee.designation.title ?? '',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
              _Method.uploaded =>
                _uploaded == null
                    ? InkWell(
                        onTap: _pickSignatureImage,
                        borderRadius: BorderRadius.circular(Corner.md),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            vertical: Space.xl,
                            horizontal: Space.md,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(Corner.md),
                            border: Border.all(
                              color: theme.colorScheme.outlineVariant,
                            ),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.cloud_upload_outlined,
                                size: 40,
                                color: theme.colorScheme.primary,
                              ),
                              const SizedBox(height: Space.sm),
                              Text(
                                l10n.nsSignUploadHint,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                l10n.nsSignUploadSub,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      )
                    : Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(Space.md),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerLowest,
                          borderRadius: BorderRadius.circular(Corner.md),
                          border: Border.all(
                            color: Colors.teal.shade400,
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              height: 120,
                              width: double.infinity,
                              alignment: Alignment.center,
                              padding: const EdgeInsets.all(Space.sm),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(Corner.sm),
                                border: Border.all(
                                  color: theme.colorScheme.outlineVariant
                                      .withValues(alpha: 0.5),
                                ),
                              ),
                              child: Image.memory(
                                _uploaded!.bytes,
                                fit: BoxFit.contain,
                              ),
                            ),
                            const SizedBox(height: Space.sm),
                            Row(
                              children: [
                                const Icon(
                                  Icons.image_outlined,
                                  size: 18,
                                  color: Colors.teal,
                                ),
                                const SizedBox(width: Space.xs),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _uploaded!.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12,
                                        ),
                                      ),
                                      Text(
                                        '${(_uploaded!.bytes.length / 1024).toStringAsFixed(1)} KB · Ready to embed',
                                        style: TextStyle(
                                          color: theme
                                              .colorScheme
                                              .onSurfaceVariant,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                TextButton.icon(
                                  icon: const Icon(Icons.refresh, size: 15),
                                  label: Text(l10n.nsSignChange),
                                  onPressed: _pickSignatureImage,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
            },
            const SizedBox(height: Space.md),
            if (widget.reasonPresets.isNotEmpty) ...[
              Wrap(
                spacing: Space.xs,
                runSpacing: Space.xs,
                children: [
                  for (final preset in widget.reasonPresets)
                    FilterChip(
                      label: Text(preset),
                      selected: _comment.text == preset,
                      onSelected: (_) {
                        _comment.text = preset;
                        setState(() => _error = null);
                      },
                    ),
                ],
              ),
              const SizedBox(height: Space.sm),
            ],
            AppTextField(
              label: widget.reasonRequired
                  ? l10n.approvalReasonHint
                  : l10n.nsSignComment,
              controller: _comment,
              maxLines: 2,
              maxLength: widget.reasonRequired ? 1000 : 500,
            ),
            const SizedBox(height: Space.sm),
            AppTextField(
              label: l10n.nsSignOtp,
              controller: _otp,
              helper: l10n.nsSignOtpHelp,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: Space.sm),
                child: Text(
                  _error!,
                  style: TextStyle(color: context.bogcl.danger),
                ),
              ),
            const SizedBox(height: Space.lg),
            PrimaryButton(
              label: widget.confirmLabel ?? l10n.nsSignConfirm,
              icon: Icons.draw_outlined,
              loading: _busy,
              onPressed: _busy ? null : () => unawaited(_capture()),
            ),
          ],
        ),
      ),
    );
  }
}

void _paintStrokes(Canvas canvas, List<List<Offset>> strokes, Color color) {
  final paint = Paint()
    ..color = color
    ..strokeWidth = 2.5
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round
    ..style = PaintingStyle.stroke;
  for (final s in strokes) {
    if (s.length == 1) {
      canvas.drawCircle(s.first, 1.2, paint..style = PaintingStyle.fill);
      paint.style = PaintingStyle.stroke;
      continue;
    }
    final path = Path()..moveTo(s.first.dx, s.first.dy);
    for (final p in s.skip(1)) {
      path.lineTo(p.dx, p.dy);
    }
    canvas.drawPath(path, paint);
  }
}

class _Pad extends StatelessWidget {
  const _Pad({
    required this.strokes,
    required this.size,
    required this.onChanged,
    required this.clearLabel,
    required this.hint,
  });

  final List<List<Offset>> strokes;
  final Size size;
  final VoidCallback onChanged;
  final String clearLabel;
  final String hint;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: scheme.surfaceContainerLowest,
            border: Border.all(color: scheme.outlineVariant),
            borderRadius: BorderRadius.circular(Corner.md),
          ),
          child: FittedBox(
            child: GestureDetector(
              onPanStart: (d) {
                strokes.add([d.localPosition]);
                onChanged();
              },
              onPanUpdate: (d) {
                strokes.last.add(d.localPosition);
                onChanged();
              },
              child: CustomPaint(
                size: size,
                painter: _PadPainter(
                  strokes: [
                    for (final s in strokes) [...s],
                  ],
                  color: scheme.onSurface,
                  hint: strokes.isEmpty ? hint : null,
                ),
              ),
            ),
          ),
        ),
        Align(
          alignment: AlignmentDirectional.centerEnd,
          child: TextButton(
            onPressed: strokes.isEmpty
                ? null
                : () {
                    strokes.clear();
                    onChanged();
                  },
            child: Text(clearLabel),
          ),
        ),
      ],
    );
  }
}

class _PadPainter extends CustomPainter {
  _PadPainter({required this.strokes, required this.color, this.hint});

  final List<List<Offset>> strokes;
  final Color color;
  final String? hint;

  @override
  void paint(Canvas canvas, Size size) {
    if (hint != null) {
      final tp = TextPainter(
        text: TextSpan(
          text: hint,
          style: TextStyle(color: color.withValues(alpha: 0.4), fontSize: 14),
        ),
        textDirection: TextDirection.ltr,
      )..layout(maxWidth: size.width);
      tp.paint(canvas, Offset((size.width - tp.width) / 2, size.height / 2));
    }
    _paintStrokes(canvas, strokes, color);
  }

  @override
  bool shouldRepaint(_PadPainter old) => true;
}
