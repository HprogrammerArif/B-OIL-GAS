import 'package:bogcl_oneops/features/visitors/domain/visitor_models.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

Future<void> printVisitPass(Visit v) async {
  final token = v.qrToken ?? v.visitNo;
  final inter = pw.Font.ttf(await rootBundle.load('assets/fonts/Inter.ttf'));
  final doc = pw.Document(title: v.visitNo)
    ..addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a6,
        margin: const pw.EdgeInsets.all(18),
        theme: pw.ThemeData.withFont(base: inter),
        build: (_) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('BOGCL GUEST PASS', style: const pw.TextStyle(fontSize: 9)),
            pw.SizedBox(height: 6),
            pw.Center(
              child: pw.BarcodeWidget(
                barcode: pw.Barcode.qrCode(),
                data: token,
                width: 120,
                height: 120,
              ),
            ),
            pw.SizedBox(height: 6),
            pw.Center(
              child: pw.Text(
                v.visitNo,
                style: const pw.TextStyle(fontSize: 16),
              ),
            ),
            pw.Divider(),
            pw.Text(v.guest.fullName, style: const pw.TextStyle(fontSize: 12)),
            pw.Text(v.site.name, style: const pw.TextStyle(fontSize: 10)),
            pw.Text(
              'Host: ${v.host.name}',
              style: const pw.TextStyle(fontSize: 10),
            ),
            if (v.badgeNo != null)
              pw.Text(
                'Badge ${v.badgeNo}',
                style: const pw.TextStyle(fontSize: 10),
              ),
          ],
        ),
      ),
    );
  final bytes = await doc.save();
  await Printing.layoutPdf(name: v.visitNo, onLayout: (_) async => bytes);
}
