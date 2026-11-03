import 'dart:convert';

import 'package:bogcl_oneops/core/network/api_error.dart';

/// JSON object as stored by the mock layer.
typedef Json = Map<String, Object?>;

/// Typed accessors so engines stay free of raw casts.
extension JsonX on Json {
  String str(String key) => this[key]! as String;
  String? strOrNull(String key) => this[key] as String?;
  int intVal(String key) => (this[key]! as num).toInt();
  int? intOrNull(String key) => (this[key] as num?)?.toInt();
  bool boolVal(String key) => this[key]! as bool;
  Json obj(String key) => Map<String, Object?>.from(this[key]! as Map);
  Json? objOrNull(String key) =>
      this[key] == null ? null : Map<String, Object?>.from(this[key]! as Map);
  List<String> strList(String key) => [
    for (final e in (this[key] as List? ?? const <Object?>[])) e! as String,
  ];
  List<Json> objList(String key) => [
    for (final e in (this[key] as List? ?? const <Object?>[]))
      Map<String, Object?>.from(e! as Map),
  ];
}

/// Request as seen by the in-app server (transport-independent).
class MockRequest {
  const MockRequest({
    required this.method,
    required this.path,
    this.query = const {},
    this.body,
    this.headers = const {},
  });

  /// Upper-case HTTP method.
  final String method;

  /// Path relative to `/api/v1`, no query string.
  final String path;
  final Map<String, String> query;
  final Object? body;

  /// Header names are lower-case.
  final Map<String, String> headers;
}

/// Response with a JSON-encodable body (null for 204).
class MockResponse {
  const MockResponse(this.status, this.body);

  final int status;
  final Object? body;
}

/// Thrown by handlers; converted to the doc 03 error envelope by the server.
class HttpError implements Exception {
  HttpError(this.code, this.message, {this.details = const [], int? status})
    : status = status ?? code.httpStatus;

  final ApiErrorCode code;
  final String message;
  final List<Json> details;
  final int status;

  Json toBody(String requestId) => {
    'error': {
      'code': code.wire,
      'message': message,
      'details': details,
      'requestId': requestId,
    },
  };

  @override
  String toString() => 'HttpError(${code.wire}: $message)';
}

MockResponse ok(Object? data, {int status = 200}) =>
    MockResponse(status, {'data': data});

MockResponse noContent() => const MockResponse(204, null);

HttpError notFound([String what = 'Resource']) =>
    HttpError(ApiErrorCode.notFound, '$what not found');

HttpError forbidden([
  String message = 'You do not have permission to perform this action',
]) => HttpError(ApiErrorCode.forbidden, message);

HttpError unauthenticated(String message, {String? reason, Json? extra}) =>
    HttpError(
      ApiErrorCode.unauthenticated,
      message,
      details: [
        if (reason != null) {'reason': reason, ...?extra},
      ],
    );

HttpError invalidTransition(String message) =>
    HttpError(ApiErrorCode.invalidStateTransition, message);

HttpError policyViolation(String rule, String message) => HttpError(
  ApiErrorCode.policyViolation,
  message,
  details: [
    {'rule': rule, 'message': message},
  ],
);

HttpError validationError(String path, String message) => HttpError(
  ApiErrorCode.validationError,
  message,
  details: [
    {
      'path': [path],
      'message': message,
    },
  ],
);

/// Page-based list over an already filtered and sorted list (doc 03 §1.4).
MockResponse paginate(
  List<Object?> items,
  Map<String, String> query, {
  int defaultPageSize = 20,
}) {
  final pageSize = (int.tryParse(query['pageSize'] ?? '') ?? defaultPageSize)
      .clamp(1, 100);
  final page = (int.tryParse(query['page'] ?? '') ?? 1).clamp(1, 1 << 30);
  final start = (page - 1) * pageSize;
  final slice = items.skip(start).take(pageSize).toList();
  return MockResponse(200, {
    'data': slice,
    'meta': {
      'page': page,
      'pageSize': pageSize,
      'total': items.length,
      if (query['sort'] != null) 'sort': query['sort'],
    },
  });
}

/// Sorts records by `-field` / `field` (string, num or null values).
List<Json> sortBy(List<Json> items, String? sort, String fallback) {
  final key = (sort == null || sort.isEmpty) ? fallback : sort;
  final desc = key.startsWith('-');
  final field = desc ? key.substring(1) : key;
  return [...items]..sort((a, b) {
    final av = a[field];
    final bv = b[field];
    if (av == bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    final c = (av is num && bv is num)
        ? av.compareTo(bv)
        : av.toString().compareTo(bv.toString());
    return desc ? -c : c;
  });
}

/// Case-insensitive contains across the given fields.
bool matchesSearch(String? q, List<String?> fields) {
  final needle = q?.trim().toLowerCase() ?? '';
  if (needle.isEmpty) return true;
  return fields.any((f) => f?.toLowerCase().contains(needle) ?? false);
}

/// Comma-separated query value to list.
List<String> csv(String? value) => value == null
    ? const []
    : value.split(',').map((v) => v.trim()).where((v) => v.isNotEmpty).toList();

/// Cursor list for append-only streams (doc 03 §1.4 extension). [items] must
/// be newest first and carry an integer `seq`; the cursor is the last `seq`
/// returned, base64url encoded (opaque to clients).
MockResponse cursorPaginate(
  List<Json> items,
  Map<String, String> query, {
  int defaultLimit = 50,
  Json Function(Json item)? shape,
}) {
  final limit = (int.tryParse(query['limit'] ?? '') ?? defaultLimit).clamp(
    1,
    100,
  );
  final raw = query['cursor'];
  var after = 1 << 40;
  if (raw != null && raw.isNotEmpty) {
    final parsed = _decodeCursor(raw);
    if (parsed == null) throw validationError('cursor', 'Invalid cursor');
    after = parsed;
  }
  final rest = items.where((e) => e.intVal('seq') < after).toList();
  final page = rest.take(limit).toList();
  final hasMore = rest.length > page.length;
  return MockResponse(200, {
    'data': [
      for (final e in page)
        if (shape == null) e else shape(e),
    ],
    'meta': {
      'hasMore': hasMore,
      'nextCursor': hasMore
          ? base64Url.encode(utf8.encode('${page.last.intVal('seq')}'))
          : null,
    },
  });
}

int? _decodeCursor(String raw) {
  try {
    return int.tryParse(utf8.decode(base64Url.decode(raw)));
  } on FormatException {
    return null;
  }
}
