import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/files/data/files_repository.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

String _taka(double v) => Money.fromPaisa((v * 100).round()).format();

/// Builds the printable note-sheet and opens the system print / save dialog.
/// Only an approved sheet gets the official stamp (doc 06 BR-03-09); others
/// are marked as not final.
Future<void> printNoteSheet(
  NoteSheet sheet, {
  required FilesRepository files,
}) async {
  final bytes = await _build(sheet, files);
  await Printing.layoutPdf(
    name: sheet.fileNo ?? 'note-sheet',
    onLayout: (_) async => bytes,
  );
}

Future<Uint8List> _build(NoteSheet s, FilesRepository files) async {
  final inter = pw.Font.ttf(await rootBundle.load('assets/fonts/Inter.ttf'));
  final bn = pw.Font.ttf(
    await rootBundle.load('assets/fonts/NotoSansBengali.ttf'),
  );
  final theme = pw.ThemeData.withFont(base: inter, fontFallback: [bn]);

  final images = <String, pw.MemoryImage>{};
  for (final sig in s.signatures) {
    final id = sig.imageFileId;
    if (id == null) continue;
    final data = await files.download(id);
    if (data != null) images[id] = pw.MemoryImage(data);
  }

  final doc = pw.Document(title: s.fileNo ?? s.title);
  const grey = PdfColors.grey700;
  pw.Widget label(String t) => pw.Padding(
    padding: const pw.EdgeInsets.only(top: 14, bottom: 4),
    child: pw.Text(
      t.toUpperCase(),
      style: const pw.TextStyle(fontSize: 9, color: grey, letterSpacing: 1),
    ),
  );

  doc.addPage(
    pw.MultiPage(
      theme: theme,
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(36),
      header: (_) => pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(
            'Bangladesh Oil, Gas & Mineral Resources Corp. Note-sheet',
            style: const pw.TextStyle(fontSize: 9, color: grey),
          ),
          pw.Text(
            s.isApproved ? 'APPROVED' : 'NOT FINAL',
            style: pw.TextStyle(
              fontSize: 10,
              fontWeight: pw.FontWeight.bold,
              color: s.isApproved ? PdfColors.green800 : PdfColors.orange800,
            ),
          ),
        ],
      ),
      build: (_) => [
        pw.Text(
          s.title,
          style: const pw.TextStyle(
            fontSize: 18,
            fontWeight: pw.FontWeight.bold,
          ),
        ),
        pw.SizedBox(height: 4),
        pw.Text(s.subject),
        pw.SizedBox(height: 8),
        pw.Text(
          [
            if (s.fileNo != null) 'File ${s.fileNo}',
            s.departmentName,
            'From ${s.initiator.name}',
            if (s.amount != null && s.amount! > 0) _taka(s.amount!),
          ].join('  |  '),
          style: const pw.TextStyle(fontSize: 10, color: grey),
        ),
        label('Notes'),
        for (final p in s.paragraphs)
          pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 8),
            child: pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.SizedBox(
                  width: 24,
                  child: pw.Text(
                    '${p.seqNo}.',
                    style: const pw.TextStyle(color: grey),
                  ),
                ),
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        '${p.author.name}  ${DateFmt.dateTime(p.createdAt, 'en')}'
                        '${p.kind == 'NOTE' ? '' : '  (${p.kind.toLowerCase()})'}',
                        style: const pw.TextStyle(fontSize: 8, color: grey),
                      ),
                      pw.Text(p.body),
                    ],
                  ),
                ),
              ],
            ),
          ),
        if (s.quotes.isNotEmpty) ...[
          label('Quotations'),
          pw.TableHelper.fromTextArray(
            headerStyle: const pw.TextStyle(
              fontSize: 9,
              fontWeight: pw.FontWeight.bold,
            ),
            cellStyle: const pw.TextStyle(fontSize: 9),
            headers: ['Supplier', 'Price', 'Delivery', 'Warranty', ''],
            data: [
              for (final q in s.quotes)
                [
                  q.vendorName,
                  _taka(q.amount),
                  '${q.deliveryDays} days',
                  '${q.warrantyMonths} months',
                  if (q.isRecommended) 'Recommended' else '',
                ],
            ],
          ),
        ],
        label('Signatures'),
        pw.Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            for (final g in s.signatures)
              pw.Container(
                width: 160,
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey500),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    if (g.imageFileId != null && images[g.imageFileId] != null)
                      pw.SizedBox(
                        height: 40,
                        child: pw.Image(images[g.imageFileId]!),
                      )
                    else
                      pw.Text(
                        g.typedName ?? g.signerName,
                        style: const pw.TextStyle(
                          fontSize: 14,
                          fontStyle: pw.FontStyle.italic,
                        ),
                      ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      g.signerName,
                      style: const pw.TextStyle(
                        fontSize: 9,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.Text(
                      '${g.stepName}${g.roleTitle == null ? '' : ', ${g.roleTitle}'}',
                      style: const pw.TextStyle(fontSize: 8, color: grey),
                    ),
                    pw.Text(
                      DateFmt.dateTime(g.signedAt, 'en'),
                      style: const pw.TextStyle(fontSize: 8, color: grey),
                    ),
                  ],
                ),
              ),
          ],
        ),
        if (s.signatures.isEmpty)
          pw.Text('No signatures yet.', style: const pw.TextStyle(color: grey)),
        if (s.isApproved && s.verificationCode != null) ...[
          pw.SizedBox(height: 18),
          pw.Row(
            children: [
              pw.BarcodeWidget(
                barcode: pw.Barcode.qrCode(),
                data: 'bogcl-oneops:verify:${s.verificationCode}',
                width: 70,
                height: 70,
              ),
              pw.SizedBox(width: 12),
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Approved and signed. Verification code ${s.verificationCode}',
                      style: const pw.TextStyle(fontWeight: pw.FontWeight.bold),
                    ),
                    pw.Text(
                      'Final hash (SHA-256) ${s.finalHash}',
                      style: const pw.TextStyle(fontSize: 7, color: grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ],
    ),
  );
  return await doc.save();
}
