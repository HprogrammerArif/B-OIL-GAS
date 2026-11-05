// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(chatChannels)
final chatChannelsProvider = ChatChannelsProvider._();

final class ChatChannelsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ChatChannel>>,
          List<ChatChannel>,
          FutureOr<List<ChatChannel>>
        >
    with
        $FutureModifier<List<ChatChannel>>,
        $FutureProvider<List<ChatChannel>> {
  ChatChannelsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'chatChannelsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$chatChannelsHash();

  @$internal
  @override
  $FutureProviderElement<List<ChatChannel>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<ChatChannel>> create(Ref ref) => chatChannels(ref);
}

String _$chatChannelsHash() => r'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

@ProviderFor(chatChannel)
final chatChannelProvider = ChatChannelFamily._();

final class ChatChannelProvider
    extends
        $FunctionalProvider<
          AsyncValue<ChatChannel>,
          ChatChannel,
          FutureOr<ChatChannel>
        >
    with $FutureModifier<ChatChannel>, $FutureProvider<ChatChannel> {
  ChatChannelProvider._({
    required ChatChannelFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'chatChannelProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$chatChannelHash();

  @override
  String toString() => r'chatChannelProvider($argument)';

  @$internal
  @override
  $FutureProviderElement<ChatChannel> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<ChatChannel> create(Ref ref) {
    return chatChannel(ref, this.argument as String);
  }

  @override
  bool operator ==(Object other) {
    return other is ChatChannelProvider && other.argument == argument;
  }

  @override
  int get hashCode => argument.hashCode;
}

String _$chatChannelHash() => r'cccccccccccccccccccccccccccccccccccccccc';

final class ChatChannelFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<ChatChannel>, String> {
  ChatChannelFamily._()
    : super(
        retry: null,
        name: r'chatChannelProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ChatChannelProvider call(String id) =>
      ChatChannelProvider._(argument: id, from: this);

  @override
  String toString() => r'chatChannelProvider';
}

@ProviderFor(chatMessages)
final chatMessagesProvider = ChatMessagesFamily._();

final class ChatMessagesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ChatMessage>>,
          List<ChatMessage>,
          FutureOr<List<ChatMessage>>
        >
    with
        $FutureModifier<List<ChatMessage>>,
        $FutureProvider<List<ChatMessage>> {
  ChatMessagesProvider._({
    required ChatMessagesFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'chatMessagesProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$chatMessagesHash();

  @override
  String toString() => r'chatMessagesProvider($argument)';

  @$internal
  @override
  $FutureProviderElement<List<ChatMessage>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<ChatMessage>> create(Ref ref) {
    return chatMessages(ref, this.argument as String);
  }

  @override
  bool operator ==(Object other) {
    return other is ChatMessagesProvider && other.argument == argument;
  }

  @override
  int get hashCode => argument.hashCode;
}

String _$chatMessagesHash() => r'dddddddddddddddddddddddddddddddddddddddd';

final class ChatMessagesFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<List<ChatMessage>>, String> {
  ChatMessagesFamily._()
    : super(
        retry: null,
        name: r'chatMessagesProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  ChatMessagesProvider call(String id) =>
      ChatMessagesProvider._(argument: id, from: this);

  @override
  String toString() => r'chatMessagesProvider';
}
