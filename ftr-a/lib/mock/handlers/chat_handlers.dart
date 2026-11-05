import 'package:bogcl_oneops/mock/engines/chat_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

List<RouteDef> chatRoutes() => [
  RouteDef('GET', '/chat/channels', (ctx) async {
    return ok(ChatEngine.mine(ctx.store, ctx.requireAuth()));
  }, permission: ['chat:use']),
  RouteDef('POST', '/chat/direct', (ctx) async {
    final a = ctx.requireAuth();
    final id = ctx.bodyObject()['userId'];
    if (id is! String) throw validationError('userId', 'Pick a colleague');
    final ch = ChatEngine.openDirect(ctx.store, a, id);
    await ctx.store.commit();
    return ok(ChatEngine.channelWire(ctx.store, a, ch), status: 201);
  }, permission: ['chat:use']),
  RouteDef('GET', '/chat/channels/:id', (ctx) async {
    final a = ctx.requireAuth();
    final ch = ChatEngine.requireMember(ctx.store, a, ctx.params['id']!);
    return ok(ChatEngine.channelWire(ctx.store, a, ch));
  }, permission: ['chat:use']),
  RouteDef('GET', '/chat/channels/:id/messages', (ctx) async {
    final a = ctx.requireAuth();
    final ch = ChatEngine.requireMember(ctx.store, a, ctx.params['id']!);
    return ok(ChatEngine.messages(ctx.store, ch));
  }, permission: ['chat:use']),
  RouteDef('POST', '/chat/channels/:id/messages', (ctx) async {
    final a = ctx.requireAuth();
    final ch = ChatEngine.requireMember(ctx.store, a, ctx.params['id']!);
    final rec = ChatEngine.send(ctx.store, a, ch, ctx.bodyObject());
    ChatEngine.maybeAutoReply(ctx.store, ch, rec);
    await ctx.store.commit();
    return ok(ChatEngine.messageWire(ctx.store, rec), status: 201);
  }, permission: ['chat:use']),
  RouteDef('POST', '/chat/channels/:id/read', (ctx) async {
    final a = ctx.requireAuth();
    final ch = ChatEngine.requireMember(ctx.store, a, ctx.params['id']!);
    final last = ctx.bodyObject()['lastMessageId'];
    if (last is! String) throw validationError('lastMessageId', 'Required');
    ChatEngine.markRead(ctx.store, a, ch, last);
    await ctx.store.commit();
    return ok({'ok': true});
  }, permission: ['chat:use']),
  RouteDef('POST', '/chat/channels/:id/directives', (ctx) async {
    final a = ctx.requireAuth();
    final ch = ChatEngine.requireMember(ctx.store, a, ctx.params['id']!);
    final rec = ChatEngine.issueDirective(ctx.store, a, ch, ctx.bodyObject());
    await ctx.store.commit();
    return ok(rec, status: 201);
  }, permission: ['chat:directive-issue']),
  RouteDef('POST', '/chat/messages/:id/reactions', (ctx) async {
    final a = ctx.requireAuth();
    final msg = ctx.store.get(Col.chatMessages, ctx.params['id']!);
    if (msg == null) throw notFound('Message');
    final emoji = ctx.bodyObject()['emoji'];
    if (emoji is! String) throw validationError('emoji', 'Required');
    final rec = ChatEngine.react(ctx.store, a, msg, emoji);
    await ctx.store.commit();
    return ok(ChatEngine.messageWire(ctx.store, rec));
  }, permission: ['chat:use']),
  RouteDef('POST', '/directives/:id/ack', (ctx) async {
    final rec = ChatEngine.ackDirective(
      ctx.store,
      ctx.requireAuth(),
      ctx.params['id']!,
    );
    await ctx.store.commit();
    return ok(rec);
  }, permission: ['chat:use']),
  RouteDef('POST', '/directives/:id/execute', (ctx) async {
    final rec = ChatEngine.executeDirective(
      ctx.store,
      ctx.requireAuth(),
      ctx.params['id']!,
    );
    await ctx.store.commit();
    return ok(rec);
  }, permission: ['chat:directive-issue']),
];
