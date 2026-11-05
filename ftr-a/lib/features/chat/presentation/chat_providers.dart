import 'dart:async';

import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
import 'package:bogcl_oneops/features/chat/domain/chat_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'chat_providers.g.dart';

void _watch(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<ChatChannel>> chatChannels(Ref ref) {
  _watch(ref);
  return ref.watch(chatRepositoryProvider).channels();
}

@riverpod
Future<ChatChannel> chatChannel(Ref ref, String id) {
  _watch(ref);
  return ref.watch(chatRepositoryProvider).channel(id);
}

@riverpod
Future<List<ChatMessage>> chatMessages(Ref ref, String id) {
  _watch(ref);
  final me = ref.watch(sessionControllerProvider).value?.profile.id ?? '';
  return ref.watch(chatRepositoryProvider).messages(id, me);
}
