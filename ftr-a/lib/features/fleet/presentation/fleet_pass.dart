import 'package:bogcl_oneops/features/fleet/domain/fleet_models.dart';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

Future<void> printTripPass(VehicleRequisition r) async {
  final pass = r.trip?.passNo ?? r.reqNo;
  final inter = pw.Font.ttf(await rootBundle.load('assets/fonts/Inter.ttf'));
  final doc = pw.Document(title: pass)
    ..addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a6,
        margin: const pw.EdgeInsets.all(18),
        theme: pw.ThemeData.withFont(base: inter),
        build: (_) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text('BOGCL TRIP PASS', style: const pw.TextStyle(fontSize: 9)),
            pw.SizedBox(height: 6),
            pw.Center(
              child: pw.BarcodeWidget(
                barcode: pw.Barcode.qrCode(),
                data: '*BOGCL-TRIP-$pass*',
                width: 120,
                height: 120,
              ),
            ),
            pw.SizedBox(height: 6),
            pw.Center(
              child: pw.Text(pass, style: const pw.TextStyle(fontSize: 16)),
            ),
            pw.Divider(),
            pw.Text(r.destination, style: const pw.TextStyle(fontSize: 12)),
            pw.Text(
              '${r.origin} → ${r.destination}',
              style: const pw.TextStyle(fontSize: 10),
            ),
            if (r.vehicle != null)
              pw.Text(
                r.vehicle!.plateNo,
                style: const pw.TextStyle(fontSize: 10),
              ),
            if (r.driver?.person != null)
              pw.Text(
                r.driver!.person!.name,
                style: const pw.TextStyle(fontSize: 10),
              ),
          ],
        ),
      ),
    );
  final bytes = await doc.save();
  await Printing.layoutPdf(name: pass, onLayout: (_) async => bytes);
}
