import 'package:bogcl_oneops/features/assets/domain/asset_models.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

/// Opens the system print dialog for a metal QR plate of this asset.
Future<void> printAssetPlate(Equipment e) async {
  final inter = pw.Font.ttf(await rootBundle.load('assets/fonts/Inter.ttf'));
  final tag = e.tag.isEmpty ? e.id : e.tag;
  final doc = pw.Document(title: tag)
    ..addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a6,
        margin: const pw.EdgeInsets.all(18),
        theme: pw.ThemeData.withFont(base: inter),
        build: (_) => pw.Column(
          children: [
            pw.Text('BOGCL ASSET', style: const pw.TextStyle(fontSize: 9)),
            pw.SizedBox(height: 8),
            pw.BarcodeWidget(
              barcode: pw.Barcode.qrCode(),
              data: tag,
              width: 120,
              height: 120,
            ),
            pw.SizedBox(height: 8),
            pw.Text(
              tag,
              style: const pw.TextStyle(
                fontSize: 16,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            pw.SizedBox(height: 4),
            pw.Text(e.name, textAlign: pw.TextAlign.center),
          ],
        ),
      ),
    );
  await Printing.layoutPdf(name: tag, onLayout: (_) => doc.save());
}
