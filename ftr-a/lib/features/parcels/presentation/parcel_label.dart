import 'package:bogcl_oneops/features/parcels/domain/parcel_models.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

/// A6 label with the tracking number as text and QR. The gate and mailroom
/// type or scan the same number into the search box.
Future<void> printParcelLabel(Parcel p) async {
  final inter = pw.Font.ttf(await rootBundle.load('assets/fonts/Inter.ttf'));
  final doc = pw.Document(title: p.trackingNo);
  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a6,
      margin: const pw.EdgeInsets.all(18),
      theme: pw.ThemeData.withFont(base: inter),
      build: (_) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text('BOGCL PARCEL', style: const pw.TextStyle(fontSize: 9)),
          pw.SizedBox(height: 6),
          pw.Center(
            child: pw.BarcodeWidget(
              barcode: pw.Barcode.qrCode(),
              data: p.trackingNo,
              width: 120,
              height: 120,
            ),
          ),
          pw.SizedBox(height: 6),
          pw.Center(
            child: pw.Text(
              p.trackingNo,
              style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.Divider(),
          pw.Text('To: ${p.recipient.name}', style: const pw.TextStyle(fontSize: 11)),
          pw.Text(p.dest.name, style: const pw.TextStyle(fontSize: 10)),
          pw.SizedBox(height: 4),
          pw.Text('From: ${p.sender.name}', style: const pw.TextStyle(fontSize: 10)),
          pw.Text(p.origin.name, style: const pw.TextStyle(fontSize: 10)),
          if (p.sealNo != null) ...[
            pw.SizedBox(height: 4),
            pw.Text('Seal ${p.sealNo}', style: const pw.TextStyle(fontSize: 10)),
          ],
          if (p.urgency != 'NORMAL')
            pw.Text(
              p.urgency == 'CRITICAL' ? 'CRITICAL' : 'HIGH PRIORITY',
              style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold),
            ),
          if (p.specialHandling.isNotEmpty)
            pw.Text(
              p.specialHandling.join(', '),
              style: const pw.TextStyle(fontSize: 9),
            ),
        ],
      ),
    ),
  );
  final bytes = await doc.save();
  await Printing.layoutPdf(name: p.trackingNo, onLayout: (_) async => bytes);
}
