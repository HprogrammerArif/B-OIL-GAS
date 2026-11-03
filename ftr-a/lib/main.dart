import 'package:bogcl_oneops/app/app.dart';
import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/mock/bootstrap.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Date symbols for EN + BN (used by DateFmt).
  await initializeDateFormatting();
  // Opens the DB, seeds the mock backend and wires the mock transport.
  final container = await bootstrapMock(
    extraOverrides: (container) => [
      tokenRefresherProvider.overrideWithValue(
        () => container()
            .read(sessionControllerProvider.notifier)
            .refreshTokens(),
      ),
    ],
  );
  runApp(
    UncontrolledProviderScope(container: container, child: const BogclApp()),
  );
}
