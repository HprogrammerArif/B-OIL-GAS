import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/chat/domain/chat_models.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'chat_repository.g.dart';

class ChatRepository {
  ChatRepository(this._dio);

  final Dio _dio;

  Future<List<ChatChannel>> channels() async {
    try {
      final res = await _dio.get<Object?>('/chat/channels');
      return [
        for (final e in Envelope.data(res.data)! as List)
          ChatChannel.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<List<ChatMessage>> messages(String id, String me) async {
    try {
      final res = await _dio.get<Object?>('/chat/channels/$id/messages');
      return [
        for (final e in Envelope.data(res.data)! as List)
          ChatMessage.fromJson(Map<String, Object?>.from(e! as Map), me: me),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<ChatChannel> channel(String id) async {
    try {
      final res = await _dio.get<Object?>('/chat/channels/$id');
      return ChatChannel.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> sendVoice(String id, int durationSec) async {
    try {
      await _dio.post<Object?>(
        '/chat/channels/$id/messages',
        data: {'body': 'VOICE:$durationSec'},
      );
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> send(
    String id,
    String body, {
    bool urgent = false,
    String? fileId,
    String? fileName,
    String? mime,
  }) async {
    try {
      await _dio.post<Object?>(
        '/chat/channels/$id/messages',
        data: {
          'body': body,
          'isUrgent': urgent,
          ?fileId: fileId,
          ?fileName: fileName,
          ?mime: mime,
        },
      );
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> read(String id, String lastMessageId) async {
    try {
      await _dio.post<Object?>(
        '/chat/channels/$id/read',
        data: {'lastMessageId': lastMessageId},
      );
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> react(String messageId, String emoji) async {
    try {
      await _dio.post<Object?>(
        '/chat/messages/$messageId/reactions',
        data: {'emoji': emoji},
      );
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> ack(String directiveId) async {
    try {
      await _dio.post<Object?>('/directives/$directiveId/ack');
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> execute(String directiveId) async {
    try {
      await _dio.post<Object?>('/directives/$directiveId/execute');
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> issue(String channelId, Map<String, Object?> body) async {
    try {
      await _dio.post<Object?>(
        '/chat/channels/$channelId/directives',
        data: body,
      );
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<ChatChannel> openDirect(String userId) async {
    try {
      final res = await _dio.post<Object?>(
        '/chat/direct',
        data: {'userId': userId},
      );
      return ChatChannel.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<ChatChannel> createChannel({
    required String name,
    required List<String> memberUserIds,
    String? description,
  }) async {
    try {
      final res = await _dio.post<Object?>(
        '/chat/channels',
        data: {
          'name': name,
          if (description != null && description.isNotEmpty)
            'description': description,
          'memberUserIds': memberUserIds,
        },
      );
      return ChatChannel.fromJson(Envelope.object(res.data));
    } on DioException catch (e) {
      throwApi(e);
    }
  }

  Future<void> archiveChannel(String id) async {
    try {
      await _dio.delete<Object?>('/chat/channels/$id');
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
ChatRepository chatRepository(Ref ref) =>
    ChatRepository(ref.watch(dioProvider));
