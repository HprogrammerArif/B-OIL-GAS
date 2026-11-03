import 'dart:convert';

import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/server.dart';
import 'package:dio/dio.dart';

/// Dio transport that answers from the in-app [MockServer].
class MockAdapter implements HttpClientAdapter {
  MockAdapter(this.server);

  final MockServer server;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<List<int>>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    Object? body;
    if (requestStream != null) {
      final bytes = <int>[];
      await requestStream.forEach(bytes.addAll);
      if (bytes.isNotEmpty) body = jsonDecode(utf8.decode(bytes));
    }

    final path = options.uri.path.startsWith(apiBasePath)
        ? options.uri.path.substring(apiBasePath.length)
        : options.uri.path;
    final req = MockRequest(
      method: options.method.toUpperCase(),
      path: path.isEmpty ? '/' : path,
      query: options.uri.queryParameters,
      body: body,
      headers: {
        for (final e in options.headers.entries)
          e.key.toLowerCase(): e.value.toString(),
      },
    );

    final MockResponse res;
    try {
      res = await server.handle(req);
    } on MockTransportError catch (e) {
      throw switch (e.kind) {
        MockTransportFailure.offline => DioException.connectionError(
          requestOptions: options,
          reason: 'Simulated offline',
        ),
        MockTransportFailure.timeout => DioException.receiveTimeout(
          timeout: options.receiveTimeout ?? const Duration(seconds: 30),
          requestOptions: options,
        ),
      };
    }

    return ResponseBody.fromString(
      res.body == null ? '' : jsonEncode(res.body),
      res.status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
