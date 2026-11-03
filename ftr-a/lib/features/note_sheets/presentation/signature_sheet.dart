import 'dart:async';
import 'dart:ui' as ui;

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/files/application/upload_service.dart';
import 'package:bogcl_oneops/features/note_sheets/data/note_sheet_repository.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Sign a note-sheet: pick how, confirm with the one-time code, done.
/// Returns the updated sheet, or null when cancelled.
Future<NoteSheet?> showSignatureSheet(
  BuildContext context, {
  required NoteSheet sheet,
}) => showModalBottomSheet<NoteSheet>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  builder: (_) => _SignatureSheet(sheet: sheet),
);

enum _Method { typed, drawn, stamp }

class _SignatureSheet extends ConsumerStatefulWidget {
  const _SignatureSheet({required this.sheet});

  final NoteSheet sheet;

  @override
  ConsumerState<_SignatureSheet> createState() => _SignatureSheetState();
}

class _SignatureSheetState extends ConsumerState<_SignatureSheet> {
  _Method _method = _Method.typed;
  late final _typed = TextEditingController(
    text: ref.read(sessionControllerProvider).value?.profile.employee.fullName,
  );
  final _otp = TextEditingController();
  final _comment = TextEditingController();
  final List<List<Offset>> _strokes = [];
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

  Future<void> _sign() async {
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
      }
      final comment = _comment.text.trim();
      final updated = await ref
          .read(noteSheetRepositoryProvider)
          .sign(
            widget.sheet.id,
            method: switch (_method) {
              _Method.typed => 'TYPED',
              _Method.drawn => 'DRAWN',
              _Method.stamp => 'STAMP',
            },
            otp: _otp.text.trim(),
            typedName: _method == _Method.typed ? typed : null,
            imageFileId: imageId,
            comment: comment.isEmpty ? null : comment,
          );
      if (!mounted) return;
      Navigator.of(context).pop(updated);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.fieldErrors.keys.any((k) => k.endsWith('otp'))
            ? l10n.nsSignErrOtpWrong
            : switch (e.code) {
                ApiErrorCode.offline ||
                ApiErrorCode.timeout => l10n.claimErrOffline,
                _ => l10n.nsSignErrFailed,
              };
      });
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
            Text(l10n.nsSignTitle, style: theme.textTheme.titleLarge),
            const SizedBox(height: Space.xs),
            Text(
              l10n.nsSignIntro(widget.sheet.fileNo ?? widget.sheet.title),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: Space.lg),
            SegmentedButton<_Method>(
              segments: [
                ButtonSegment(
                  value: _Method.typed,
                  label: Text(l10n.nsSignTyped),
                ),
                ButtonSegment(
                  value: _Method.drawn,
                  label: Text(l10n.nsSignDrawn),
                ),
                ButtonSegment(
                  value: _Method.stamp,
                  label: Text(l10n.nsSignStamp),
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
            },
            const SizedBox(height: Space.md),
            AppTextField(
              label: l10n.nsSignComment,
              controller: _comment,
              maxLines: 2,
              maxLength: 500,
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
              label: l10n.nsSignConfirm,
              icon: Icons.draw_outlined,
              loading: _busy,
              onPressed: () => unawaited(_sign()),
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
