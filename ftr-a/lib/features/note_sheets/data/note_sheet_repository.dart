import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'note_sheet_repository.g.dart';

/// `/note-sheets/*` (doc 03 §9). Online only: signing needs the server clock,
/// the hash chain and an OTP.
class NoteSheetRepository {
  NoteSheetRepository(this._dio);

  final Dio _dio;

  /// [view]: `mine`, `to-sign` or `all`.
  Future<List<NoteSheet>> list({String view = 'mine'}) async {
    try {
      final res = await _dio.get<Object?>(
        '/note-sheets',
        queryParameters: {'view': view, 'pageSize': 100},
      );
      return Envelope.page(res.data, NoteSheet.fromJson).items;
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<NoteSheet> detail(String id) async {
    try {
      final res = await _dio.get<Object?>('/note-sheets/$id');
      return NoteSheet.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<NoteSheet> save({
    required Map<String, Object?> body,
    String? id,
  }) async {
    try {
      final res = id == null
          ? await _dio.post<Object?>('/note-sheets', data: body)
          : await _dio.put<Object?>('/note-sheets/$id', data: body);
      return NoteSheet.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> delete(String id) async {
    try {
      await _dio.delete<Object?>('/note-sheets/$id');
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<NoteSheet> _post(
    String id,
    String action, [
    Map<String, Object?>? body,
  ]) async {
    try {
      final res = await _dio.post<Object?>(
        '/note-sheets/$id/$action',
        data: body,
      );
      return NoteSheet.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<NoteSheet> submit(String id) => _post(id, 'submit');

  Future<NoteSheet> addParagraph(
    String id, {
    required String body,
    required String kind,
  }) => _post(id, 'paragraphs', {'body': body, 'kind': kind});

  Future<NoteSheet> sign(
    String id, {
    required String method,
    required String otp,
    String? typedName,
    String? imageFileId,
    String? comment,
  }) => _post(id, 'sign', {
    'method': method,
    'otp': otp,
    'typedName': ?typedName,
    'imageFileId': ?imageFileId,
    'comment': ?comment,
  });
}

@Riverpod(keepAlive: true)
NoteSheetRepository noteSheetRepository(Ref ref) =>
    NoteSheetRepository(ref.watch(dioProvider));
